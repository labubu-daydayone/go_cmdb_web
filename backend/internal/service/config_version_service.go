package service

import (
	"fmt"
	"time"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"gorm.io/gorm"
)

type ConfigVersionService struct{}

func NewConfigVersionService() *ConfigVersionService {
	return &ConfigVersionService{}
}

// BumpVersion creates a new config version entry
// R1: All config changes must bump config_versions (insert new row, version increments)
func (s *ConfigVersionService) BumpVersion(tx *gorm.DB, reason string) error {
	// Get the latest version
	var latestVersion models.ConfigVersion
	err := tx.Order("version DESC").First(&latestVersion).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to get latest version: %w", err)
	}

	// Calculate new version
	newVersion := int64(1)
	if err != gorm.ErrRecordNotFound {
		newVersion = latestVersion.Version + 1
	}

	// Create new version entry
	configVersion := models.ConfigVersion{
		Version:   newVersion,
		Reason:    &reason,
		CreatedAt: time.Now(),
	}

	if err := tx.Create(&configVersion).Error; err != nil {
		return fmt.Errorf("failed to create config version: %w", err)
	}

	return nil
}

// BumpVersionInTx is a convenience method for bumping version within a transaction
func (s *ConfigVersionService) BumpVersionInTx(reason string) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		return s.BumpVersion(tx, reason)
	})
}

// GetLatestVersion returns the latest config version
func (s *ConfigVersionService) GetLatestVersion() (*models.ConfigVersion, error) {
	var version models.ConfigVersion
	if err := database.DB.Order("version DESC").First(&version).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// No versions yet, return version 0
			return &models.ConfigVersion{Version: 0}, nil
		}
		return nil, fmt.Errorf("failed to get latest version: %w", err)
	}
	return &version, nil
}

// GetVersionHistory returns version history with pagination
func (s *ConfigVersionService) GetVersionHistory(page, pageSize int) ([]models.ConfigVersion, int64, error) {
	var versions []models.ConfigVersion
	var total int64

	// Count total
	if err := database.DB.Model(&models.ConfigVersion{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count versions: %w", err)
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	if err := database.DB.Order("version DESC").Offset(offset).Limit(pageSize).Find(&versions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get versions: %w", err)
	}

	return versions, total, nil
}
