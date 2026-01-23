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
	ErrDomainNotFound      = errors.New("domain not found")
	ErrDomainAlreadyExists = errors.New("domain already exists")
	ErrDomainHasDependency = errors.New("domain has dependencies")
	ErrInvalidFQDN         = errors.New("invalid FQDN for this zone")
)

type DomainService struct{}

func NewDomainService() *DomainService {
	return &DomainService{}
}

// CreateDomainRequest represents request to create a domain
type CreateDomainRequest struct {
	Domain         string `json:"domain" binding:"required"`
	Purpose        string `json:"purpose"`
	Provider       string `json:"provider" binding:"required"`
	ProviderZoneID string `json:"provider_zone_id" binding:"required"`
	APIKeyID       int    `json:"api_key_id" binding:"required"`
}

// UpdateDomainRequest represents request to update a domain
type UpdateDomainRequest struct {
	Purpose string `json:"purpose"`
	Status  string `json:"status"`
}

// DomainFilter represents filter for listing domains
type DomainFilter struct {
	Purpose string
	Status  string
	Page    int
	PageSize int
}

// CreateDomain creates a new domain with DNS provider configuration
func (s *DomainService) CreateDomain(req CreateDomainRequest) (*models.Domain, error) {
	db := database.GetDB()

	// Check if domain already exists
	var existing models.Domain
	if err := db.Where("domain = ?", req.Domain).First(&existing).Error; err == nil {
		return nil, ErrDomainAlreadyExists
	}

	// Verify API key exists and is active
	var apiKey models.APIKey
	if err := db.Where("id = ? AND status = ?", req.APIKeyID, "active").First(&apiKey).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("API key not found or inactive")
		}
		return nil, err
	}

	// Create domain and provider in transaction
	domain := &models.Domain{
		Domain:  req.Domain,
		Purpose: req.Purpose,
		Status:  "active",
	}

	if domain.Purpose == "" {
		domain.Purpose = "cdn"
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		// Create domain
		if err := tx.Create(domain).Error; err != nil {
			return err
		}

		// Create DNS provider configuration
		provider := &models.DomainDNSProvider{
			DomainID:       domain.ID,
			Provider:       req.Provider,
			ProviderZoneID: req.ProviderZoneID,
			APIKeyID:       req.APIKeyID,
			Status:         "active",
		}

		if err := tx.Create(provider).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return domain, nil
}

// GetDomain retrieves a domain by ID
func (s *DomainService) GetDomain(id int) (*models.Domain, error) {
	db := database.GetDB()

	var domain models.Domain
	if err := db.First(&domain, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDomainNotFound
		}
		return nil, err
	}

	return &domain, nil
}

// GetDomainByName retrieves a domain by name
func (s *DomainService) GetDomainByName(domainName string) (*models.Domain, error) {
	db := database.GetDB()

	var domain models.Domain
	if err := db.Where("domain = ?", domainName).First(&domain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDomainNotFound
		}
		return nil, err
	}

	return &domain, nil
}

// ListDomains retrieves a paginated list of domains
func (s *DomainService) ListDomains(filter DomainFilter) ([]models.Domain, int64, error) {
	db := database.GetDB()

	query := db.Model(&models.Domain{})

	// Apply filters
	if filter.Purpose != "" {
		query = query.Where("purpose = ?", filter.Purpose)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
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
		filter.PageSize = 20
	}

	offset := (filter.Page - 1) * filter.PageSize

	var domains []models.Domain
	if err := query.Offset(offset).Limit(filter.PageSize).Order("created_at DESC").Find(&domains).Error; err != nil {
		return nil, 0, err
	}

	return domains, total, nil
}

// UpdateDomain updates a domain
func (s *DomainService) UpdateDomain(id int, req UpdateDomainRequest) error {
	db := database.GetDB()

	updates := make(map[string]interface{})

	if req.Purpose != "" {
		updates["purpose"] = req.Purpose
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}

	if len(updates) == 0 {
		return nil
	}

	result := db.Model(&models.Domain{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrDomainNotFound
	}

	return nil
}

// DeleteDomain deletes a domain after checking dependencies
func (s *DomainService) DeleteDomain(id int) error {
	db := database.GetDB()

	// Check for DNS records
	var recordCount int64
	if err := db.Model(&models.DomainDNSRecord{}).Where("domain_id = ?", id).Count(&recordCount).Error; err != nil {
		return err
	}
	if recordCount > 0 {
		return fmt.Errorf("%w: has %d DNS records", ErrDomainHasDependency, recordCount)
	}

	// Check for node groups
	var nodeGroupCount int64
	if err := db.Model(&models.NodeGroup{}).Where("domain_id = ?", id).Count(&nodeGroupCount).Error; err != nil {
		return err
	}
	if nodeGroupCount > 0 {
		return fmt.Errorf("%w: has %d node groups", ErrDomainHasDependency, nodeGroupCount)
	}

	// Check for line groups
	var lineGroupCount int64
	if err := db.Model(&models.LineGroup{}).Where("domain_id = ?", id).Count(&lineGroupCount).Error; err != nil {
		return err
	}
	if lineGroupCount > 0 {
		return fmt.Errorf("%w: has %d line groups", ErrDomainHasDependency, lineGroupCount)
	}

	// Delete in transaction
	return db.Transaction(func(tx *gorm.DB) error {
		// Delete DNS provider
		if err := tx.Where("domain_id = ?", id).Delete(&models.DomainDNSProvider{}).Error; err != nil {
			return err
		}

		// Delete domain
		result := tx.Delete(&models.Domain{}, id)
		if result.Error != nil {
			return result.Error
		}

		if result.RowsAffected == 0 {
			return ErrDomainNotFound
		}

		return nil
	})
}

// ValidateFQDN validates if a FQDN belongs to a zone (R23 rule)
func (s *DomainService) ValidateFQDN(fqdn string, domainID int) (bool, error) {
	domain, err := s.GetDomain(domainID)
	if err != nil {
		return false, err
	}

	return utils.ValidateFQDN(fqdn, domain.Domain), nil
}

// CalculateRelativeName calculates relative DNS name from FQDN (R24 rule)
func (s *DomainService) CalculateRelativeName(fqdn string, domainID int) (string, error) {
	domain, err := s.GetDomain(domainID)
	if err != nil {
		return "", err
	}

	return utils.CalculateRelativeName(fqdn, domain.Domain), nil
}
