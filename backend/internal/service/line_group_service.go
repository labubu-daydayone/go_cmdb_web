package service

import (
	"fmt"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"github.com/cdn-control-panel/backend/internal/utils"
	"gorm.io/gorm"
)

type LineGroupService struct {
	configVersionService *ConfigVersionService
}

func NewLineGroupService(configVersionService *ConfigVersionService) *LineGroupService {
	return &LineGroupService{
		configVersionService: configVersionService,
	}
}

// CreateLineGroupRequest represents the request to create a line group
type CreateLineGroupRequest struct {
	Name        string `json:"name" binding:"required"`
	DomainID    int    `json:"domain_id" binding:"required"`
	NodeGroupID int    `json:"node_group_id" binding:"required"`
}

// CreateLineGroup implements WF-02: Create Line Group
// 1. insert line_groups (generate cname_prefix/cname)
// 2. insert domain_dns_records(type=CNAME, value=node_group.cname, proxied=0, owner=line_group, pending)
// 3. bump config_versions(reason="line_group:create")
func (s *LineGroupService) CreateLineGroup(req CreateLineGroupRequest) (*models.LineGroup, error) {
	var lineGroup *models.LineGroup

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// Get domain to build CNAME
		var domain models.Domain
		if err := tx.First(&domain, req.DomainID).Error; err != nil {
			return fmt.Errorf("domain not found: %w", err)
		}

		// Get node group to get its CNAME
		var nodeGroup models.NodeGroup
		if err := tx.First(&nodeGroup, req.NodeGroupID).Error; err != nil {
			return fmt.Errorf("node group not found: %w", err)
		}

		// Generate CNAME prefix
		cnamePrefix, err := utils.GenerateCNAMEPrefix()
		if err != nil {
			return fmt.Errorf("failed to generate CNAME prefix: %w", err)
		}

		cname := utils.BuildCNAME(cnamePrefix, domain.Domain)

		// 1. Insert line_groups
		lineGroup = &models.LineGroup{
			Name:        req.Name,
			DomainID:    req.DomainID,
			NodeGroupID: req.NodeGroupID,
			CNAMEPrefix: cnamePrefix,
			CNAME:       cname,
			Status:      "active",
		}

		if err := tx.Create(lineGroup).Error; err != nil {
			return fmt.Errorf("failed to create line group: %w", err)
		}

		// 2. Insert domain_dns_records (CNAME pointing to node_group.cname)
		relativeName := utils.CalculateRelativeName(cname, domain.Domain)

		dnsRecord := models.DomainDNSRecord{
			DomainID:  req.DomainID,
			Type:      "CNAME",
			Name:      relativeName,
			Value:     nodeGroup.CNAME,
			TTL:       120,
			Proxied:   false, // R5: Proxied default 0
			Status:    "pending",
			OwnerType: "line_group",
			OwnerID:   lineGroup.ID,
		}

		if err := tx.Create(&dnsRecord).Error; err != nil {
			return fmt.Errorf("failed to create DNS record: %w", err)
		}

		// 3. Bump config_versions
		if err := s.configVersionService.BumpVersion(tx, "line_group:create"); err != nil {
			return fmt.Errorf("failed to bump config version: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return lineGroup, nil
}

// ListLineGroups returns all line groups with pagination
func (s *LineGroupService) ListLineGroups(page, pageSize int) ([]models.LineGroup, int64, error) {
	var lineGroups []models.LineGroup
	var total int64

	if err := database.DB.Model(&models.LineGroup{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count line groups: %w", err)
	}

	offset := (page - 1) * pageSize
	if err := database.DB.Preload("Domain").Preload("NodeGroup").Offset(offset).Limit(pageSize).Find(&lineGroups).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get line groups: %w", err)
	}

	return lineGroups, total, nil
}

// GetLineGroup returns a line group by ID
func (s *LineGroupService) GetLineGroup(id int) (*models.LineGroup, error) {
	var lineGroup models.LineGroup
	if err := database.DB.Preload("Domain").Preload("NodeGroup").First(&lineGroup, id).Error; err != nil {
		return nil, fmt.Errorf("line group not found: %w", err)
	}
	return &lineGroup, nil
}

// DeleteLineGroup deletes a line group
func (s *LineGroupService) DeleteLineGroup(id int) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// Delete DNS records
		if err := tx.Where("owner_type = ? AND owner_id = ?", "line_group", id).Delete(&models.DomainDNSRecord{}).Error; err != nil {
			return fmt.Errorf("failed to delete DNS records: %w", err)
		}

		// Delete line group
		if err := tx.Delete(&models.LineGroup{}, id).Error; err != nil {
			return fmt.Errorf("failed to delete line group: %w", err)
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "line_group:delete"); err != nil {
			return fmt.Errorf("failed to bump config version: %w", err)
		}

		return nil
	})
}

// UpdateLineGroupRequest represents the request to update a line group
type UpdateLineGroupRequest struct {
	Name        *string `json:"name"`
	NodeGroupID *int    `json:"node_group_id"`
}

// UpdateLineGroup updates a line group
// DB Writes (transaction):
// 1. update line_groups (name, node_group_id)
// 2. if node_group_id changed: update domain_dns_records(value=new_node_group.cname, status=pending)
// 3. bump config_versions(reason="line_group:update")
func (s *LineGroupService) UpdateLineGroup(id int, req UpdateLineGroupRequest) (*models.LineGroup, error) {
	var lineGroup *models.LineGroup

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// Get existing line group
		lineGroup = &models.LineGroup{}
		if err := tx.First(lineGroup, id).Error; err != nil {
			return fmt.Errorf("line group not found: %w", err)
		}

		oldNodeGroupID := lineGroup.NodeGroupID

		// 1. Update line_groups
		updates := make(map[string]interface{})
		if req.Name != nil {
			updates["name"] = *req.Name
		}
		if req.NodeGroupID != nil {
			updates["node_group_id"] = *req.NodeGroupID
		}

		if len(updates) > 0 {
			if err := tx.Model(lineGroup).Updates(updates).Error; err != nil {
				return fmt.Errorf("failed to update line group: %w", err)
			}
		}

		// 2. If node_group_id changed, update DNS records
		if req.NodeGroupID != nil && *req.NodeGroupID != oldNodeGroupID {
			// Get new node group to get its CNAME
			var newNodeGroup models.NodeGroup
			if err := tx.First(&newNodeGroup, *req.NodeGroupID).Error; err != nil {
				return fmt.Errorf("new node group not found: %w", err)
			}

			// Update DNS record value and set status to pending
			if err := tx.Model(&models.DomainDNSRecord{}).
				Where("owner_type = ? AND owner_id = ?", "line_group", id).
				Updates(map[string]interface{}{
					"value":  newNodeGroup.CNAME,
					"status": "pending",
				}).Error; err != nil {
				return fmt.Errorf("failed to update DNS record: %w", err)
			}
		}

		// 3. Bump config_versions
		if err := s.configVersionService.BumpVersion(tx, "line_group:update"); err != nil {
			return fmt.Errorf("failed to bump config version: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Reload line group with relations
	if err := database.DB.Preload("Domain").Preload("NodeGroup").First(lineGroup, id).Error; err != nil {
		return nil, fmt.Errorf("failed to reload line group: %w", err)
	}

	return lineGroup, nil
}
