package service

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrAPIKeyNotFound      = errors.New("API key not found")
	ErrAPIKeyAlreadyExists = errors.New("API key already exists")
)

type APIKeyService struct{}

func NewAPIKeyService() *APIKeyService {
	return &APIKeyService{}
}

// CreateAPIKeyRequest represents request to create an API key
type CreateAPIKeyRequest struct {
	Name        string     `json:"name" binding:"required"`
	Description *string    `json:"description"`
	Provider    string     `json:"provider" binding:"required"` // cloudflare, aliyun, etc
	APIKey      string     `json:"api_key" binding:"required"`
	APISecret   *string    `json:"api_secret"`
	ExpiresAt   *time.Time `json:"expires_at"`
}

// UpdateAPIKeyRequest represents request to update an API key
type UpdateAPIKeyRequest struct {
	Name        *string    `json:"name"`
	Description *string    `json:"description"`
	APIKey      *string    `json:"api_key"`
	APISecret   *string    `json:"api_secret"`
	ExpiresAt   *time.Time `json:"expires_at"`
	Status      *string    `json:"status"`
}

// generateToken generates a random token for API key identification
func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// CreateAPIKey creates a new API key
func (s *APIKeyService) CreateAPIKey(req CreateAPIKeyRequest) (*models.APIKey, error) {
	db := database.DB

	// Check if API key with same name exists
	var existing models.APIKey
	if err := db.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		return nil, ErrAPIKeyAlreadyExists
	}

	// Generate token
	token, err := generateToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	apiKey := &models.APIKey{
		Name:        req.Name,
		Description: req.Description,
		Provider:    req.Provider,
		APIKey:      req.APIKey,
		APISecret:   req.APISecret,
		Token:       token,
		ExpiresAt:   req.ExpiresAt,
		Status:      "active",
	}

	if err := db.Create(apiKey).Error; err != nil {
		return nil, err
	}

	return apiKey, nil
}

// ListAPIKeys returns all API keys with pagination
func (s *APIKeyService) ListAPIKeys(page, pageSize int, provider, status string) ([]models.APIKey, int64, error) {
	var apiKeys []models.APIKey
	var total int64

	query := database.DB.Model(&models.APIKey{})
	if provider != "" {
		query = query.Where("provider = ?", provider)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&apiKeys).Error; err != nil {
		return nil, 0, err
	}

	return apiKeys, total, nil
}

// GetAPIKey returns an API key by ID
func (s *APIKeyService) GetAPIKey(id int) (*models.APIKey, error) {
	var apiKey models.APIKey
	if err := database.DB.First(&apiKey, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAPIKeyNotFound
		}
		return nil, err
	}
	return &apiKey, nil
}

// GetAPIKeyByToken returns an API key by token
func (s *APIKeyService) GetAPIKeyByToken(token string) (*models.APIKey, error) {
	var apiKey models.APIKey
	if err := database.DB.Where("token = ? AND status = ?", token, "active").First(&apiKey).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAPIKeyNotFound
		}
		return nil, err
	}

	// Check if expired
	if apiKey.ExpiresAt != nil && apiKey.ExpiresAt.Before(time.Now()) {
		return nil, errors.New("API key expired")
	}

	return &apiKey, nil
}

// UpdateAPIKey updates an API key
func (s *APIKeyService) UpdateAPIKey(id int, req UpdateAPIKeyRequest) (*models.APIKey, error) {
	db := database.DB

	var apiKey models.APIKey
	if err := db.First(&apiKey, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAPIKeyNotFound
		}
		return nil, err
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.APIKey != nil {
		updates["api_key"] = *req.APIKey
	}
	if req.APISecret != nil {
		updates["api_secret"] = *req.APISecret
	}
	if req.ExpiresAt != nil {
		updates["expires_at"] = *req.ExpiresAt
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if len(updates) == 0 {
		return &apiKey, nil
	}

	if err := db.Model(&apiKey).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &apiKey, nil
}

// DeleteAPIKey deletes an API key
func (s *APIKeyService) DeleteAPIKey(id int) error {
	db := database.DB

	// Check if API key is in use by DNS providers
	var count int64
	if err := db.Model(&models.DomainDNSProvider{}).Where("api_key_id = ?", id).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("API key is in use by DNS providers")
	}

	result := db.Delete(&models.APIKey{}, id)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrAPIKeyNotFound
	}

	return nil
}

// UpdateLastUsed updates the last_used_at timestamp
func (s *APIKeyService) UpdateLastUsed(id int) error {
	return database.DB.Model(&models.APIKey{}).Where("id = ?", id).Update("last_used_at", time.Now()).Error
}
