package service

import (
	"errors"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrProviderNotFound      = errors.New("DNS provider not found")
	ErrProviderAlreadyExists = errors.New("DNS provider already exists for this domain")
)

type DNSProviderService struct{}

func NewDNSProviderService() *DNSProviderService {
	return &DNSProviderService{}
}

// CreateProviderRequest represents request to create a DNS provider
type CreateProviderRequest struct {
	DomainID       int    `json:"domain_id" binding:"required"`
	Provider       string `json:"provider" binding:"required"`
	ProviderZoneID string `json:"provider_zone_id" binding:"required"`
	APIKeyID       int    `json:"api_key_id" binding:"required"`
}

// UpdateProviderRequest represents request to update a DNS provider
type UpdateProviderRequest struct {
	ProviderZoneID string `json:"provider_zone_id"`
	APIKeyID       int    `json:"api_key_id"`
	Status         string `json:"status"`
}

// CreateProvider creates a DNS provider configuration
func (s *DNSProviderService) CreateProvider(req CreateProviderRequest) (*models.DomainDNSProvider, error) {
	db := database.GetDB()

	// Check if provider already exists for this domain
	var existing models.DomainDNSProvider
	if err := db.Where("domain_id = ?", req.DomainID).First(&existing).Error; err == nil {
		return nil, ErrProviderAlreadyExists
	}

	// Verify domain exists
	var domain models.Domain
	if err := db.First(&domain, req.DomainID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDomainNotFound
		}
		return nil, err
	}

	// Verify API key exists and is active
	var apiKey models.APIKey
	if err := db.Where("id = ? AND status = ?", req.APIKeyID, "active").First(&apiKey).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("API key not found or inactive")
		}
		return nil, err
	}

	provider := &models.DomainDNSProvider{
		DomainID:       req.DomainID,
		Provider:       req.Provider,
		ProviderZoneID: req.ProviderZoneID,
		APIKeyID:       req.APIKeyID,
		Status:         "active",
	}

	if err := db.Create(provider).Error; err != nil {
		return nil, err
	}

	return provider, nil
}

// GetProvider retrieves a DNS provider by ID
func (s *DNSProviderService) GetProvider(id int) (*models.DomainDNSProvider, error) {
	db := database.GetDB()

	var provider models.DomainDNSProvider
	if err := db.First(&provider, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProviderNotFound
		}
		return nil, err
	}

	return &provider, nil
}

// GetProviderByDomain retrieves a DNS provider by domain ID
func (s *DNSProviderService) GetProviderByDomain(domainID int) (*models.DomainDNSProvider, error) {
	db := database.GetDB()

	var provider models.DomainDNSProvider
	if err := db.Where("domain_id = ?", domainID).First(&provider).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProviderNotFound
		}
		return nil, err
	}

	return &provider, nil
}

// ListProviders retrieves all DNS providers with domain and API key info
func (s *DNSProviderService) ListProviders() ([]map[string]interface{}, error) {
	db := database.GetDB()

	var providers []models.DomainDNSProvider
	if err := db.Order("created_at DESC").Find(&providers).Error; err != nil {
		return nil, err
	}

	result := make([]map[string]interface{}, 0, len(providers))

	for _, provider := range providers {
		// Get domain info
		var domain models.Domain
		db.First(&domain, provider.DomainID)

		// Get API key info
		var apiKey models.APIKey
		db.First(&apiKey, provider.APIKeyID)

		item := map[string]interface{}{
			"id":               provider.ID,
			"domain_id":        provider.DomainID,
			"domain":           domain.Domain,
			"provider":         provider.Provider,
			"provider_zone_id": provider.ProviderZoneID,
			"api_key_id":       provider.APIKeyID,
			"api_key_name":     apiKey.Name,
			"status":           provider.Status,
			"created_at":       provider.CreatedAt,
			"updated_at":       provider.UpdatedAt,
		}

		result = append(result, item)
	}

	return result, nil
}

// UpdateProvider updates a DNS provider
func (s *DNSProviderService) UpdateProvider(id int, req UpdateProviderRequest) error {
	db := database.GetDB()

	updates := make(map[string]interface{})

	if req.ProviderZoneID != "" {
		updates["provider_zone_id"] = req.ProviderZoneID
	}
	if req.APIKeyID > 0 {
		// Verify API key exists and is active
		var apiKey models.APIKey
		if err := db.Where("id = ? AND status = ?", req.APIKeyID, "active").First(&apiKey).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("API key not found or inactive")
			}
			return err
		}
		updates["api_key_id"] = req.APIKeyID
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}

	if len(updates) == 0 {
		return nil
	}

	result := db.Model(&models.DomainDNSProvider{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrProviderNotFound
	}

	return nil
}

// DeleteProvider deletes a DNS provider
func (s *DNSProviderService) DeleteProvider(id int) error {
	db := database.GetDB()

	result := db.Delete(&models.DomainDNSProvider{}, id)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrProviderNotFound
	}

	return nil
}
