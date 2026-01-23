package service

import (
	"errors"
	"fmt"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"github.com/cdn-control-panel/backend/internal/utils"
	"gorm.io/gorm"
)

var (
	ErrDNSRecordNotFound      = errors.New("DNS record not found")
	ErrDNSRecordAlreadyExists = errors.New("DNS record already exists")
)

type DNSRecordService struct {
	domainService *DomainService
}

func NewDNSRecordService(domainService *DomainService) *DNSRecordService {
	return &DNSRecordService{
		domainService: domainService,
	}
}

// CreateDNSRecordRequest represents request to create a DNS record
type CreateDNSRecordRequest struct {
	DomainID  int    `json:"domain_id" binding:"required"`
	Type      string `json:"type" binding:"required"`
	Name      string `json:"name" binding:"required"` // Can be FQDN or relative name
	Value     string `json:"value" binding:"required"`
	TTL       int    `json:"ttl"`
	Proxied   bool   `json:"proxied"`
	OwnerType string `json:"owner_type" binding:"required"`
	OwnerID   int    `json:"owner_id"`
}

// UpdateDNSRecordRequest represents request to update a DNS record
type UpdateDNSRecordRequest struct {
	Value   string `json:"value"`
	TTL     int    `json:"ttl"`
	Proxied *bool  `json:"proxied"`
}

// DNSRecordFilter represents filter for listing DNS records
type DNSRecordFilter struct {
	DomainID  int
	Type      string
	Status    string
	OwnerType string
	OwnerID   int
	Page      int
	PageSize  int
}

// CreateRecord creates a new DNS record (R2: status=pending)
func (s *DNSRecordService) CreateRecord(req CreateDNSRecordRequest) (*models.DomainDNSRecord, error) {
	db := database.GetDB()

	// Get domain
	domain, err := s.domainService.GetDomain(req.DomainID)
	if err != nil {
		return nil, err
	}

	// Calculate relative name from FQDN if needed
	relativeName := req.Name
	if utils.ValidateFQDN(req.Name, domain.Domain) {
		relativeName = utils.CalculateRelativeName(req.Name, domain.Domain)
	}

	// Validate FQDN belongs to zone (R23)
	fqdn := utils.CalculateFQDN(relativeName, domain.Domain)
	if !utils.ValidateFQDN(fqdn, domain.Domain) {
		return nil, ErrInvalidFQDN
	}

	// Set defaults
	if req.TTL == 0 {
		req.TTL = 120
	}

	// Check unique constraint
	var existing models.DomainDNSRecord
	err = db.Where("domain_id = ? AND type = ? AND name = ? AND value = ? AND owner_type = ? AND owner_id = ?",
		req.DomainID, req.Type, relativeName, req.Value, req.OwnerType, req.OwnerID).
		First(&existing).Error

	if err == nil {
		return nil, ErrDNSRecordAlreadyExists
	}

	// Create record with status=pending (R2)
	record := &models.DomainDNSRecord{
		DomainID:  req.DomainID,
		Type:      req.Type,
		Name:      relativeName,
		Value:     req.Value,
		TTL:       req.TTL,
		Proxied:   req.Proxied, // R5: default false
		Status:    "pending",
		OwnerType: req.OwnerType,
		OwnerID:   req.OwnerID,
	}

	if err := db.Create(record).Error; err != nil {
		return nil, err
	}

	return record, nil
}

// CreateRecordsBatch creates multiple DNS records in a transaction
func (s *DNSRecordService) CreateRecordsBatch(records []CreateDNSRecordRequest) error {
	db := database.GetDB()

	return db.Transaction(func(tx *gorm.DB) error {
		for _, req := range records {
			// Get domain
			domain, err := s.domainService.GetDomain(req.DomainID)
			if err != nil {
				return err
			}

			// Calculate relative name
			relativeName := req.Name
			if utils.ValidateFQDN(req.Name, domain.Domain) {
				relativeName = utils.CalculateRelativeName(req.Name, domain.Domain)
			}

			// Validate FQDN
			fqdn := utils.CalculateFQDN(relativeName, domain.Domain)
			if !utils.ValidateFQDN(fqdn, domain.Domain) {
				return fmt.Errorf("invalid FQDN %s for zone %s", fqdn, domain.Domain)
			}

			// Set defaults
			if req.TTL == 0 {
				req.TTL = 120
			}

			// Create record
			record := &models.DomainDNSRecord{
				DomainID:  req.DomainID,
				Type:      req.Type,
				Name:      relativeName,
				Value:     req.Value,
				TTL:       req.TTL,
				Proxied:   req.Proxied,
				Status:    "pending",
				OwnerType: req.OwnerType,
				OwnerID:   req.OwnerID,
			}

			if err := tx.Create(record).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// GetRecord retrieves a DNS record by ID
func (s *DNSRecordService) GetRecord(id int) (*models.DomainDNSRecord, error) {
	db := database.GetDB()

	var record models.DomainDNSRecord
	if err := db.First(&record, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDNSRecordNotFound
		}
		return nil, err
	}

	return &record, nil
}

// ListRecords retrieves a paginated list of DNS records
func (s *DNSRecordService) ListRecords(filter DNSRecordFilter) ([]map[string]interface{}, int64, error) {
	db := database.GetDB()

	query := db.Model(&models.DomainDNSRecord{})

	// Apply filters
	if filter.DomainID > 0 {
		query = query.Where("domain_id = ?", filter.DomainID)
	}
	if filter.Type != "" {
		query = query.Where("type = ?", filter.Type)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.OwnerType != "" {
		query = query.Where("owner_type = ?", filter.OwnerType)
	}
	if filter.OwnerID > 0 {
		query = query.Where("owner_id = ?", filter.OwnerID)
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 50
	}

	offset := (filter.Page - 1) * filter.PageSize

	var records []models.DomainDNSRecord
	if err := query.Offset(offset).Limit(filter.PageSize).Order("created_at DESC").Find(&records).Error; err != nil {
		return nil, 0, err
	}

	// Enrich with domain info and owner name
	result := make([]map[string]interface{}, 0, len(records))

	for _, record := range records {
		// Get domain
		var domain models.Domain
		db.First(&domain, record.DomainID)

		// Get owner name based on owner_type
		ownerName := s.getOwnerName(record.OwnerType, record.OwnerID)

		item := map[string]interface{}{
			"id":                 record.ID,
			"domain_id":          record.DomainID,
			"domain":             domain.Domain,
			"type":               record.Type,
			"name":               record.Name,
			"value":              record.Value,
			"ttl":                record.TTL,
			"proxied":            record.Proxied,
			"status":             record.Status,
			"provider_record_id": record.ProviderRecordID,
			"last_error":         record.LastError,
			"retry_count":        record.RetryCount,
			"next_retry_at":      record.NextRetryAt,
			"owner_type":         record.OwnerType,
			"owner_id":           record.OwnerID,
			"owner_name":         ownerName,
			"created_at":         record.CreatedAt,
			"updated_at":         record.UpdatedAt,
		}

		result = append(result, item)
	}

	return result, total, nil
}

// getOwnerName retrieves owner name based on owner type
func (s *DNSRecordService) getOwnerName(ownerType string, ownerID int) string {
	db := database.GetDB()

	switch ownerType {
	case "node_group":
		var nodeGroup models.NodeGroup
		if err := db.First(&nodeGroup, ownerID).Error; err == nil {
			return nodeGroup.Name
		}
	case "line_group":
		var lineGroup models.LineGroup
		if err := db.First(&lineGroup, ownerID).Error; err == nil {
			return lineGroup.Name
		}
	case "website_domain":
		var websiteDomain models.WebsiteDomain
		if err := db.First(&websiteDomain, ownerID).Error; err == nil {
			return websiteDomain.Domain
		}
	case "acme_challenge":
		return "ACME Challenge"
	}

	return ""
}

// GetRecordsByOwner retrieves all DNS records for a specific owner
func (s *DNSRecordService) GetRecordsByOwner(ownerType string, ownerID int) ([]models.DomainDNSRecord, error) {
	db := database.GetDB()

	var records []models.DomainDNSRecord
	if err := db.Where("owner_type = ? AND owner_id = ?", ownerType, ownerID).Find(&records).Error; err != nil {
		return nil, err
	}

	return records, nil
}

// UpdateRecord updates a DNS record and sets status=pending for re-sync
func (s *DNSRecordService) UpdateRecord(id int, req UpdateDNSRecordRequest) error {
	db := database.GetDB()

	updates := map[string]interface{}{
		"status": "pending", // Trigger re-sync
	}

	if req.Value != "" {
		updates["value"] = req.Value
		// Clear provider_record_id to force recreation
		updates["provider_record_id"] = nil
	}
	if req.TTL > 0 {
		updates["ttl"] = req.TTL
	}
	if req.Proxied != nil {
		updates["proxied"] = *req.Proxied
	}

	result := db.Model(&models.DomainDNSRecord{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrDNSRecordNotFound
	}

	return nil
}

// DeleteRecord deletes a DNS record
func (s *DNSRecordService) DeleteRecord(id int) error {
	db := database.GetDB()

	result := db.Delete(&models.DomainDNSRecord{}, id)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrDNSRecordNotFound
	}

	return nil
}

// TriggerSync manually triggers sync for a specific record or all error records
func (s *DNSRecordService) TriggerSync(recordID *int) error {
	db := database.GetDB()

	updates := map[string]interface{}{
		"status":        "pending",
		"retry_count":   0,
		"next_retry_at": nil,
	}

	if recordID != nil {
		// Trigger sync for specific record
		result := db.Model(&models.DomainDNSRecord{}).Where("id = ?", *recordID).Updates(updates)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrDNSRecordNotFound
		}
	} else {
		// Trigger sync for all error records
		db.Model(&models.DomainDNSRecord{}).Where("status = ?", "error").Updates(updates)
	}

	return nil
}

// ResetErrorRecords resets all error records to pending
func (s *DNSRecordService) ResetErrorRecords() error {
	db := database.GetDB()

	updates := map[string]interface{}{
		"status":        "pending",
		"retry_count":   0,
		"next_retry_at": nil,
	}

	return db.Model(&models.DomainDNSRecord{}).Where("status = ?", "error").Updates(updates).Error
}
