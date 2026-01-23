package service

import (
	"errors"
	"time"

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
	Name        string                     `json:"name" binding:"required"`
	Description *string                    `json:"description"`
	Items       []CreateOriginGroupItemReq `json:"items" binding:"required,min=1"`
}

type CreateOriginGroupItemReq struct {
	Origin   string `json:"origin" binding:"required"`
	Weight   int    `json:"weight" binding:"required,min=1"`
	Priority int    `json:"priority" binding:"required,min=1"`
}

// UpdateOriginGroupRequest represents request to update an origin group
type UpdateOriginGroupRequest struct {
	Name        *string                    `json:"name"`
	Description *string                    `json:"description"`
	Items       []CreateOriginGroupItemReq `json:"items"`
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

		// Create items
		for _, itemReq := range req.Items {
			item := &models.OriginGroupItem{
				GroupID:  group.ID,
				Origin:   itemReq.Origin,
				Weight:   itemReq.Weight,
				Priority: itemReq.Priority,
			}
			if err := tx.Create(item).Error; err != nil {
				return err
			}
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion("origin_group_created"); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Load items
	db.Preload("Items").First(group, group.ID)

	return group, nil
}

// ListOriginGroups returns all origin groups with pagination
func (s *OriginService) ListOriginGroups(page, pageSize int) ([]models.OriginGroup, int64, error) {
	var groups []models.OriginGroup
	var total int64

	query := database.DB.Model(&models.OriginGroup{}).Preload("Items")

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
	if err := database.DB.Preload("Items").First(&group, id).Error; err != nil {
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

		// Update items if provided
		if req.Items != nil {
			// Delete old items
			if err := tx.Where("group_id = ?", id).Delete(&models.OriginGroupItem{}).Error; err != nil {
				return err
			}

			// Create new items
			for _, itemReq := range req.Items {
				item := &models.OriginGroupItem{
					GroupID:  id,
					Origin:   itemReq.Origin,
					Weight:   itemReq.Weight,
					Priority: itemReq.Priority,
				}
				if err := tx.Create(item).Error; err != nil {
					return err
				}
			}
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion("origin_group_updated"); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Reload with items
	db.Preload("Items").First(&group, id)

	return &group, nil
}

// DeleteOriginGroup deletes an origin group
func (s *OriginService) DeleteOriginGroup(id int) error {
	db := database.DB

	// Check if group is in use by websites
	var count int64
	if err := db.Model(&models.Website{}).Where("origin_mode = ? AND origin_group_id = ?", "group", id).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("origin group is in use by websites")
	}

	return db.Transaction(func(tx *gorm.DB) error {
		// Delete items first
		if err := tx.Where("group_id = ?", id).Delete(&models.OriginGroupItem{}).Error; err != nil {
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
		if err := s.configVersionService.BumpVersion("origin_group_deleted"); err != nil {
			return err
		}

		return nil
	})
}

// ===== Origin Set (Snapshot) =====

// CreateOriginSetFromGroup creates an origin set (snapshot) from a group
func (s *OriginService) CreateOriginSetFromGroup(websiteID, groupID int) (*models.OriginSet, error) {
	db := database.DB

	// Get group with items
	var group models.OriginGroup
	if err := db.Preload("Items").First(&group, groupID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrOriginGroupNotFound
		}
		return nil, err
	}

	set := &models.OriginSet{
		WebsiteID:       websiteID,
		OriginGroupID:   &groupID,
		OriginGroupName: &group.Name,
		SnapshotAt:      time.Now(),
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		// Create set
		if err := tx.Create(set).Error; err != nil {
			return err
		}

		// Copy items from group
		for _, groupItem := range group.Items {
			setItem := &models.OriginSetItem{
				SetID:    set.ID,
				Origin:   groupItem.Origin,
				Weight:   groupItem.Weight,
				Priority: groupItem.Priority,
			}
			if err := tx.Create(setItem).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Load items
	db.Preload("Items").First(set, set.ID)

	return set, nil
}

// CreateOriginSetManual creates an origin set manually
func (s *OriginService) CreateOriginSetManual(websiteID int, items []CreateOriginGroupItemReq) (*models.OriginSet, error) {
	db := database.DB

	set := &models.OriginSet{
		WebsiteID:  websiteID,
		SnapshotAt: time.Now(),
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		// Create set
		if err := tx.Create(set).Error; err != nil {
			return err
		}

		// Create items
		for _, itemReq := range items {
			item := &models.OriginSetItem{
				SetID:    set.ID,
				Origin:   itemReq.Origin,
				Weight:   itemReq.Weight,
				Priority: itemReq.Priority,
			}
			if err := tx.Create(item).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Load items
	db.Preload("Items").First(set, set.ID)

	return set, nil
}

// GetOriginSetByWebsite returns the origin set for a website
func (s *OriginService) GetOriginSetByWebsite(websiteID int) (*models.OriginSet, error) {
	var set models.OriginSet
	if err := database.DB.Preload("Items").Where("website_id = ?", websiteID).First(&set).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrOriginSetNotFound
		}
		return nil, err
	}
	return &set, nil
}
