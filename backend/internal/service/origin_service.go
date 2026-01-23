package service

import (
	"errors"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrOriginGroupNotFound = errors.New("origin group not found")
	ErrOriginSetNotFound   = errors.New("origin set not found")
)

type OriginService struct {
	configVersionService *ConfigVersionService
}

func NewOriginService(configVersionService *ConfigVersionService) *OriginService {
	return &OriginService{
		configVersionService: configVersionService,
	}
}

// ===== Origin Group =====

// CreateOriginGroupRequest represents request to create an origin group
type CreateOriginGroupRequest struct {
	Name        string                       `json:"name" binding:"required"`
	Description *string                      `json:"description"`
	Addresses   []CreateOriginGroupAddressReq `json:"addresses" binding:"required,min=1"`
}

type CreateOriginGroupAddressReq struct {
	Role     string `json:"role" binding:"required,oneof=primary backup"`
	Protocol string `json:"protocol" binding:"required,oneof=http https"`
	Address  string `json:"address" binding:"required"`
	Weight   int    `json:"weight" binding:"required,min=1"`
	Enabled  bool   `json:"enabled"`
}

// UpdateOriginGroupRequest represents request to update an origin group
type UpdateOriginGroupRequest struct {
	Name        *string                       `json:"name"`
	Description *string                       `json:"description"`
	Addresses   []CreateOriginGroupAddressReq `json:"addresses"`
}

// CreateOriginGroup creates a new origin group
func (s *OriginService) CreateOriginGroup(req CreateOriginGroupRequest) (*models.OriginGroup, error) {
	db := database.DB

	// Check if group with same name exists
	var existing models.OriginGroup
	if err := db.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		return nil, errors.New("origin group already exists")
	}

	group := &models.OriginGroup{
		Name:        req.Name,
		Description: req.Description,
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		// Create group
		if err := tx.Create(group).Error; err != nil {
			return err
		}

		// Create addresses
		for _, addrReq := range req.Addresses {
			addr := &models.OriginGroupAddress{
				OriginGroupID: group.ID,
				Role:          addrReq.Role,
				Protocol:      addrReq.Protocol,
				Address:       addrReq.Address,
				Weight:        addrReq.Weight,
				Enabled:       addrReq.Enabled,
			}
			if err := tx.Create(addr).Error; err != nil {
				return err
			}
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "origin_group_created"); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return group, nil
}

// ListOriginGroups returns all origin groups with pagination
func (s *OriginService) ListOriginGroups(page, pageSize int) ([]models.OriginGroup, int64, error) {
	var groups []models.OriginGroup
	var total int64

	query := database.DB.Model(&models.OriginGroup{})

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&groups).Error; err != nil {
		return nil, 0, err
	}

	return groups, total, nil
}

// GetOriginGroup returns an origin group by ID
func (s *OriginService) GetOriginGroup(id int) (*models.OriginGroup, error) {
	var group models.OriginGroup
	if err := database.DB.First(&group, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrOriginGroupNotFound
		}
		return nil, err
	}
	return &group, nil
}

// UpdateOriginGroup updates an origin group
func (s *OriginService) UpdateOriginGroup(id int, req UpdateOriginGroupRequest) (*models.OriginGroup, error) {
	db := database.DB

	var group models.OriginGroup
	if err := db.First(&group, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrOriginGroupNotFound
		}
		return nil, err
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		updates := make(map[string]interface{})
		if req.Name != nil {
			updates["name"] = *req.Name
		}
		if req.Description != nil {
			updates["description"] = *req.Description
		}

		if len(updates) > 0 {
			if err := tx.Model(&group).Updates(updates).Error; err != nil {
				return err
			}
		}

		// Update addresses if provided
		if req.Addresses != nil {
			// Delete old addresses
			if err := tx.Where("origin_group_id = ?", id).Delete(&models.OriginGroupAddress{}).Error; err != nil {
				return err
			}

			// Create new addresses
			for _, addrReq := range req.Addresses {
				addr := &models.OriginGroupAddress{
					OriginGroupID: id,
					Role:          addrReq.Role,
					Protocol:      addrReq.Protocol,
					Address:       addrReq.Address,
					Weight:        addrReq.Weight,
					Enabled:       addrReq.Enabled,
				}
				if err := tx.Create(addr).Error; err != nil {
					return err
				}
			}
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "origin_group_updated"); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &group, nil
}

// DeleteOriginGroup deletes an origin group
func (s *OriginService) DeleteOriginGroup(id int) error {
	db := database.DB

	// Check if group is in use by websites (via origin_sets)
	var count int64
	if err := db.Model(&models.OriginSet{}).Where("origin_group_id = ?", id).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("origin group is in use by websites")
	}

	return db.Transaction(func(tx *gorm.DB) error {
		// Delete addresses first
		if err := tx.Where("origin_group_id = ?", id).Delete(&models.OriginGroupAddress{}).Error; err != nil {
			return err
		}

		// Delete group
		result := tx.Delete(&models.OriginGroup{}, id)
		if result.Error != nil {
			return result.Error
		}

		if result.RowsAffected == 0 {
			return ErrOriginGroupNotFound
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "origin_group_deleted"); err != nil {
			return err
		}

		return nil
	})
}
