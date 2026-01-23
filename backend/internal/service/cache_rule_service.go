package service

import (
	"errors"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrCacheRuleNotFound = errors.New("cache rule not found")
)

type CacheRuleService struct {
	configVersionService *ConfigVersionService
}

func NewCacheRuleService(configVersionService *ConfigVersionService) *CacheRuleService {
	return &CacheRuleService{
		configVersionService: configVersionService,
	}
}

// CreateCacheRuleRequest represents request to create a cache rule
type CreateCacheRuleRequest struct {
	Name        string                 `json:"name" binding:"required"`
	Description *string                `json:"description"`
	Items       []CreateCacheRuleItemReq `json:"items" binding:"required,min=1"`
}

type CreateCacheRuleItemReq struct {
	Type  string `json:"type" binding:"required,oneof=directory suffix file"`
	Value string `json:"value" binding:"required"`
	TTL   int    `json:"ttl" binding:"required,min=0"`
}

// UpdateCacheRuleRequest represents request to update a cache rule
type UpdateCacheRuleRequest struct {
	Name        *string                `json:"name"`
	Description *string                `json:"description"`
	Items       []CreateCacheRuleItemReq `json:"items"`
}

// CreateCacheRule creates a new cache rule
func (s *CacheRuleService) CreateCacheRule(req CreateCacheRuleRequest) (*models.CacheRule, error) {
	db := database.DB

	// Check if rule with same name exists
	var existing models.CacheRule
	if err := db.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		return nil, errors.New("cache rule already exists")
	}

	rule := &models.CacheRule{
		Name:        req.Name,
		Description: req.Description,
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		// Create rule
		if err := tx.Create(rule).Error; err != nil {
			return err
		}

		// Create items
		for _, itemReq := range req.Items {
			item := &models.CacheRuleItem{
				RuleID: rule.ID,
				Type:   itemReq.Type,
				Value:  itemReq.Value,
				TTL:    itemReq.TTL,
			}
			if err := tx.Create(item).Error; err != nil {
				return err
			}
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion("cache_rule_created"); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Load items
	db.Preload("Items").First(rule, rule.ID)

	return rule, nil
}

// ListCacheRules returns all cache rules with pagination
func (s *CacheRuleService) ListCacheRules(page, pageSize int) ([]models.CacheRule, int64, error) {
	var rules []models.CacheRule
	var total int64

	query := database.DB.Model(&models.CacheRule{}).Preload("Items")

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&rules).Error; err != nil {
		return nil, 0, err
	}

	return rules, total, nil
}

// GetCacheRule returns a cache rule by ID
func (s *CacheRuleService) GetCacheRule(id int) (*models.CacheRule, error) {
	var rule models.CacheRule
	if err := database.DB.Preload("Items").First(&rule, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCacheRuleNotFound
		}
		return nil, err
	}
	return &rule, nil
}

// UpdateCacheRule updates a cache rule
func (s *CacheRuleService) UpdateCacheRule(id int, req UpdateCacheRuleRequest) (*models.CacheRule, error) {
	db := database.DB

	var rule models.CacheRule
	if err := db.First(&rule, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCacheRuleNotFound
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
			if err := tx.Model(&rule).Updates(updates).Error; err != nil {
				return err
			}
		}

		// Update items if provided
		if req.Items != nil {
			// Delete old items
			if err := tx.Where("rule_id = ?", id).Delete(&models.CacheRuleItem{}).Error; err != nil {
				return err
			}

			// Create new items
			for _, itemReq := range req.Items {
				item := &models.CacheRuleItem{
					RuleID: id,
					Type:   itemReq.Type,
					Value:  itemReq.Value,
					TTL:    itemReq.TTL,
				}
				if err := tx.Create(item).Error; err != nil {
					return err
				}
			}
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion("cache_rule_updated"); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Reload with items
	db.Preload("Items").First(&rule, id)

	return &rule, nil
}

// DeleteCacheRule deletes a cache rule
func (s *CacheRuleService) DeleteCacheRule(id int) error {
	db := database.DB

	// Check if rule is in use by websites
	var count int64
	if err := db.Model(&models.Website{}).Where("cache_rule_id = ?", id).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("cache rule is in use by websites")
	}

	return db.Transaction(func(tx *gorm.DB) error {
		// Delete items first
		if err := tx.Where("rule_id = ?", id).Delete(&models.CacheRuleItem{}).Error; err != nil {
			return err
		}

		// Delete rule
		result := tx.Delete(&models.CacheRule{}, id)
		if result.Error != nil {
			return result.Error
		}

		if result.RowsAffected == 0 {
			return ErrCacheRuleNotFound
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion("cache_rule_deleted"); err != nil {
			return err
		}

		return nil
	})
}
