package worker

import (
	"fmt"
	"log"
	"time"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"github.com/cdn-control-panel/backend/internal/service"
	"gorm.io/gorm"
)

// ACMEWorker handles automatic certificate requests and renewals
type ACMEWorker struct {
	acmeService          *service.ACMEService
	certificateService   *service.CertificateService
	dnsRecordService     *service.DNSRecordService
	interval             time.Duration
	renewalThresholdDays int
	stopChan             chan struct{}
}

// NewACMEWorker creates a new ACME worker
func NewACMEWorker(
	acmeService *service.ACMEService,
	certificateService *service.CertificateService,
	dnsRecordService *service.DNSRecordService,
) *ACMEWorker {
	return &ACMEWorker{
		acmeService:          acmeService,
		certificateService:   certificateService,
		dnsRecordService:     dnsRecordService,
		interval:             5 * time.Minute, // Check every 5 minutes
		renewalThresholdDays: 30,               // Renew 30 days before expiration
		stopChan:             make(chan struct{}),
	}
}

// Start starts the ACME worker
func (w *ACMEWorker) Start() {
	log.Println("[ACME Worker] Starting...")

	// Run immediately on start
	w.processPendingRequests()
	w.processRenewals()

	// Then run periodically
	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			w.processPendingRequests()
			w.processRenewals()
		case <-w.stopChan:
			log.Println("[ACME Worker] Stopped")
			return
		}
	}
}

// Stop stops the ACME worker
func (w *ACMEWorker) Stop() {
	close(w.stopChan)
}

// processPendingRequests processes pending certificate requests
func (w *ACMEWorker) processPendingRequests() {
	log.Println("[ACME Worker] Processing pending certificate requests...")

	var requests []models.CertificateRequest
	if err := database.DB.Where("status = ?", "pending").Find(&requests).Error; err != nil {
		log.Printf("[ACME Worker] Failed to get pending requests: %v", err)
		return
	}

	if len(requests) == 0 {
		log.Println("[ACME Worker] No pending requests found")
		return
	}

	log.Printf("[ACME Worker] Found %d pending requests", len(requests))

	for _, req := range requests {
		if err := w.processRequest(&req); err != nil {
			log.Printf("[ACME Worker] Failed to process request %d: %v", req.ID, err)
			// Update status to error
			database.DB.Model(&req).Updates(map[string]interface{}{
				"status":     "error",
				"last_error": err.Error(),
			})
		}
	}
}

// processRequest processes a single certificate request
func (w *ACMEWorker) processRequest(req *models.CertificateRequest) error {
	log.Printf("[ACME Worker] Processing request %d for domains: %v", req.ID, req.Domains)

	// Update status to processing
	if err := database.DB.Model(req).Update("status", "processing").Error; err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}

	// Request certificate using ACME service
	// The ACMEService will handle DNS-01 challenge internally
	certificateID, err := w.acmeService.RequestCertificate(req.Domains, req.Email)
	if err != nil {
		return fmt.Errorf("ACME request failed: %w", err)
	}

	// Update request status to completed
	if err := database.DB.Model(req).Updates(map[string]interface{}{
		"status":         "completed",
		"certificate_id": certificateID,
		"last_error":     "",
	}).Error; err != nil {
		return fmt.Errorf("failed to update request: %w", err)
	}

	log.Printf("[ACME Worker] Successfully completed request %d, certificate ID: %d", req.ID, certificateID)
	return nil
}

// processRenewals processes certificate renewals
func (w *ACMEWorker) processRenewals() {
	log.Println("[ACME Worker] Processing certificate renewals...")

	// Find certificates expiring within threshold
	expirationThreshold := time.Now().AddDate(0, 0, w.renewalThresholdDays)

	var certificates []models.Certificate
	if err := database.DB.Where("not_after < ? AND auto_renew = ?", expirationThreshold, true).
		Find(&certificates).Error; err != nil {
		log.Printf("[ACME Worker] Failed to get certificates for renewal: %v", err)
		return
	}

	if len(certificates) == 0 {
		log.Println("[ACME Worker] No certificates need renewal")
		return
	}

	log.Printf("[ACME Worker] Found %d certificates for renewal", len(certificates))

	for _, cert := range certificates {
		if err := w.renewCertificate(&cert); err != nil {
			log.Printf("[ACME Worker] Failed to renew certificate %d: %v", cert.ID, err)
		}
	}
}

// renewCertificate renews a single certificate
func (w *ACMEWorker) renewCertificate(cert *models.Certificate) error {
	log.Printf("[ACME Worker] Renewing certificate %d (expires: %v)", cert.ID, cert.NotAfter)

	// Get certificate domains
	var domains []models.CertificateDomain
	if err := database.DB.Where("certificate_id = ?", cert.ID).Find(&domains).Error; err != nil {
		return fmt.Errorf("failed to get certificate domains: %w", err)
	}

	if len(domains) == 0 {
		return fmt.Errorf("no domains found for certificate")
	}

	// Extract domain names
	var domainNames []string
	for _, d := range domains {
		domainNames = append(domainNames, d.Domain)
	}

	// Create a new certificate request
	req := models.CertificateRequest{
		Domains: domainNames,
		Email:   "admin@example.com", // TODO: Get from config or certificate metadata
		Status:  "pending",
	}

	if err := database.DB.Create(&req).Error; err != nil {
		return fmt.Errorf("failed to create renewal request: %w", err)
	}

	log.Printf("[ACME Worker] Created renewal request %d for certificate %d", req.ID, cert.ID)

	// The renewal will be processed in the next cycle
	return nil
}

// processChallenge processes DNS-01 challenge for a domain
// This is called by ACMEService during certificate request
func (w *ACMEWorker) processChallenge(domain, token, keyAuth string) error {
	log.Printf("[ACME Worker] Processing DNS-01 challenge for domain: %s", domain)

	// Find the zone for this domain
	var domainRecord models.Domain
	if err := database.DB.Where("domain = ?", domain).Or("domain LIKE ?", "%."+domain).
		Order("LENGTH(domain) DESC").First(&domainRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("no zone found for domain %s", domain)
		}
		return fmt.Errorf("failed to find zone: %w", err)
	}

	// Create DNS TXT record for challenge
	challengeRecord := "_acme-challenge." + domain

	createReq := service.CreateDNSRecordRequest{
		DomainID:  domainRecord.ID,
		Type:      "TXT",
		Name:      challengeRecord,
		Value:     keyAuth,
		TTL:       120,
		Proxied:   false,
		OwnerType: "acme_challenge",
		OwnerID:   0, // No specific owner
	}

	if err := w.dnsRecordService.CreateDNSRecord(createReq); err != nil {
		return fmt.Errorf("failed to create challenge record: %w", err)
	}

	log.Printf("[ACME Worker] Created DNS TXT record: %s = %s", challengeRecord, keyAuth)

	// Wait for DNS propagation
	time.Sleep(30 * time.Second)

	return nil
}

// cleanupChallenge cleans up DNS-01 challenge record
func (w *ACMEWorker) cleanupChallenge(domain string) error {
	log.Printf("[ACME Worker] Cleaning up DNS-01 challenge for domain: %s", domain)

	challengeRecord := "_acme-challenge." + domain

	// Delete challenge TXT records
	if err := database.DB.Where("type = ? AND name = ? AND owner_type = ?",
		"TXT", challengeRecord, "acme_challenge").
		Delete(&models.DomainDNSRecord{}).Error; err != nil {
		log.Printf("[ACME Worker] Failed to cleanup challenge record: %v", err)
		// Don't return error, as this is cleanup
	}

	return nil
}
