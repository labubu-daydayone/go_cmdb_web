package worker

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"github.com/cdn-control-panel/backend/pkg/cloudflare"
	"gorm.io/gorm"
)

// DNSSyncWorker handles asynchronous DNS record synchronization with Cloudflare
type DNSSyncWorker struct {
	db               *gorm.DB
	cloudflareClient *cloudflare.Client
	interval         time.Duration
	batchSize        int
}

// NewDNSSyncWorker creates a new DNS sync worker
func NewDNSSyncWorker(interval time.Duration) *DNSSyncWorker {
	return &DNSSyncWorker{
		db:               database.GetDB(),
		cloudflareClient: cloudflare.NewClient(),
		interval:         interval,
		batchSize:        100,
	}
}

// Start starts the DNS sync worker
func (w *DNSSyncWorker) Start(ctx context.Context) {
	log.Println("[DNSSyncWorker] Starting DNS sync worker...")

	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	// Run immediately on start
	w.syncPendingRecords()

	for {
		select {
		case <-ctx.Done():
			log.Println("[DNSSyncWorker] Stopping DNS sync worker...")
			return
		case <-ticker.C:
			w.syncPendingRecords()
		}
	}
}

// syncPendingRecords syncs all pending and error records
func (w *DNSSyncWorker) syncPendingRecords() {
	records := w.fetchPendingRecords()

	if len(records) == 0 {
		return
	}

	log.Printf("[DNSSyncWorker] Found %d records to sync\n", len(records))

	for _, record := range records {
		w.syncSingleRecord(record)
	}
}

// fetchPendingRecords fetches records that need to be synced
// Input: domain_dns_records where status IN ('pending', 'error')
//        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
func (w *DNSSyncWorker) fetchPendingRecords() []models.DomainDNSRecord {
	var records []models.DomainDNSRecord

	err := w.db.Where("status IN (?, ?)", "pending", "error").
		Where("next_retry_at IS NULL OR next_retry_at <= ?", time.Now()).
		Order("created_at ASC").
		Limit(w.batchSize).
		Find(&records).Error

	if err != nil {
		log.Printf("[DNSSyncWorker] Error fetching pending records: %v\n", err)
		return nil
	}

	return records
}

// syncSingleRecord syncs a single DNS record with Cloudflare
func (w *DNSSyncWorker) syncSingleRecord(record models.DomainDNSRecord) {
	log.Printf("[DNSSyncWorker] Syncing record ID=%d, domain_id=%d, type=%s, name=%s\n",
		record.ID, record.DomainID, record.Type, record.Name)

	// 1. Get domain
	var domain models.Domain
	if err := w.db.First(&domain, record.DomainID).Error; err != nil {
		w.markError(record.ID, "domain not found")
		return
	}

	// 2. Get DNS provider
	var provider models.DomainDNSProvider
	if err := w.db.Where("domain_id = ?", record.DomainID).First(&provider).Error; err != nil {
		w.markError(record.ID, "DNS provider not found")
		return
	}

	// 3. Get API key
	var apiKey models.APIKey
	if err := w.db.First(&apiKey, provider.APIKeyID).Error; err != nil {
		w.markError(record.ID, "API key not found")
		return
	}

	// Check API key status
	if apiKey.Status != "active" {
		w.markError(record.ID, "API key is inactive")
		return
	}

	// 4. Initialize Cloudflare client with token
	client := w.cloudflareClient.WithToken(apiKey.APIToken)

	// 5. Calculate full DNS name
	var fullName string
	if record.Name == "@" {
		fullName = domain.Domain
	} else {
		fullName = record.Name + "." + domain.Domain
	}

	// 6. Call Cloudflare API
	var providerRecordID string
	var err error

	if record.ProviderRecordID != "" {
		// Update existing record
		log.Printf("[DNSSyncWorker] Updating existing record: provider_record_id=%s\n", record.ProviderRecordID)
		providerRecordID, err = client.UpdateDNSRecord(
			provider.ProviderZoneID,
			record.ProviderRecordID,
			record.Type,
			fullName,
			record.Value,
			record.TTL,
			record.Proxied,
		)
	} else {
		// Create new record
		log.Printf("[DNSSyncWorker] Creating new record\n")
		providerRecordID, err = client.CreateDNSRecord(
			provider.ProviderZoneID,
			record.Type,
			fullName,
			record.Value,
			record.TTL,
			record.Proxied,
		)
	}

	// 7. Update database status
	if err != nil {
		log.Printf("[DNSSyncWorker] Error syncing record ID=%d: %v\n", record.ID, err)
		w.markError(record.ID, err.Error())
	} else {
		log.Printf("[DNSSyncWorker] Successfully synced record ID=%d, provider_record_id=%s\n",
			record.ID, providerRecordID)
		w.markSuccess(record.ID, providerRecordID)
	}
}

// markSuccess marks a record as successfully synced (A7 assertion)
func (w *DNSSyncWorker) markSuccess(recordID int, providerRecordID string) {
	updates := map[string]interface{}{
		"status":             "active",
		"provider_record_id": providerRecordID,
		"last_error":         nil,
		"retry_count":        0,
		"next_retry_at":      nil,
		"updated_at":         time.Now(),
	}

	if err := w.db.Model(&models.DomainDNSRecord{}).Where("id = ?", recordID).Updates(updates).Error; err != nil {
		log.Printf("[DNSSyncWorker] Error marking record %d as success: %v\n", recordID, err)
	}
}

// markError marks a record as failed with retry backoff (A7 assertion)
// Backoff strategy: 60s * retry_count (60s, 120s, 180s, ...)
func (w *DNSSyncWorker) markError(recordID int, errorMsg string) {
	var record models.DomainDNSRecord
	if err := w.db.First(&record, recordID).Error; err != nil {
		log.Printf("[DNSSyncWorker] Error fetching record %d: %v\n", recordID, err)
		return
	}

	retryCount := record.RetryCount + 1
	backoffSeconds := 60 * retryCount // 60s, 120s, 180s...
	nextRetryAt := time.Now().Add(time.Duration(backoffSeconds) * time.Second)

	// Truncate error message if too long
	if len(errorMsg) > 255 {
		errorMsg = errorMsg[:252] + "..."
	}

	updates := map[string]interface{}{
		"status":        "error",
		"last_error":    errorMsg,
		"retry_count":   retryCount,
		"next_retry_at": nextRetryAt,
		"updated_at":    time.Now(),
	}

	if err := w.db.Model(&models.DomainDNSRecord{}).Where("id = ?", recordID).Updates(updates).Error; err != nil {
		log.Printf("[DNSSyncWorker] Error marking record %d as error: %v\n", recordID, err)
	}

	log.Printf("[DNSSyncWorker] Record %d marked as error, retry_count=%d, next_retry_at=%s\n",
		recordID, retryCount, nextRetryAt.Format(time.RFC3339))
}

// DeleteDNSRecordFromProvider deletes a DNS record from Cloudflare
// This is used when deleting a record from the database
func (w *DNSSyncWorker) DeleteDNSRecordFromProvider(record models.DomainDNSRecord) error {
	// If no provider_record_id, nothing to delete
	if record.ProviderRecordID == "" {
		return nil
	}

	// Get DNS provider
	var provider models.DomainDNSProvider
	if err := w.db.Where("domain_id = ?", record.DomainID).First(&provider).Error; err != nil {
		return fmt.Errorf("DNS provider not found: %w", err)
	}

	// Get API key
	var apiKey models.APIKey
	if err := w.db.First(&apiKey, provider.APIKeyID).Error; err != nil {
		return fmt.Errorf("API key not found: %w", err)
	}

	// Check API key status
	if apiKey.Status != "active" {
		return fmt.Errorf("API key is inactive")
	}

	// Initialize Cloudflare client
	client := w.cloudflareClient.WithToken(apiKey.APIToken)

	// Delete record from Cloudflare
	if err := client.DeleteDNSRecord(provider.ProviderZoneID, record.ProviderRecordID); err != nil {
		return fmt.Errorf("failed to delete from Cloudflare: %w", err)
	}

	return nil
}
