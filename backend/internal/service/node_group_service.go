package service

import (
	"fmt"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"github.com/cdn-control-panel/backend/internal/utils"
	"gorm.io/gorm"
)

type NodeGroupService struct {
	configVersionService *ConfigVersionService
}

func NewNodeGroupService(configVersionService *ConfigVersionService) *NodeGroupService {
	return &NodeGroupService{
		configVersionService: configVersionService,
	}
}

// CreateNodeGroupRequest represents the request to create a node group
type CreateNodeGroupRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
	DomainID    int     `json:"domain_id" binding:"required"`
	SubIPIDs    []int   `json:"sub_ip_ids" binding:"required"`
}

// CreateNodeGroup implements WF-01: Create Node Group
// DB Writes (transaction):
// 1. insert node_groups (generate cname_prefix/cname)
// 2. insert node_group_sub_ips
// 3. for each enabled sub_ip: insert domain_dns_records(type=A, proxied=0, owner=node_group, status=pending)
// 4. bump config_versions(reason="node_group:create")
func (s *NodeGroupService) CreateNodeGroup(req CreateNodeGroupRequest) (*models.NodeGroup, error) {
	var nodeGroup *models.NodeGroup

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// Get domain to build CNAME
		var domain models.Domain
		if err := tx.First(&domain, req.DomainID).Error; err != nil {
			return fmt.Errorf("domain not found: %w", err)
		}

		// Generate CNAME prefix
		cnamePrefix, err := utils.GenerateCNAMEPrefix()
		if err != nil {
			return fmt.Errorf("failed to generate CNAME prefix: %w", err)
		}

		cname := utils.BuildCNAME(cnamePrefix, domain.Domain)

		// 1. Insert node_groups
		nodeGroup = &models.NodeGroup{
			Name:        req.Name,
			Description: req.Description,
			DomainID:    req.DomainID,
			CNAMEPrefix: cnamePrefix,
			CNAME:       cname,
			Status:      "active",
		}

		if err := tx.Create(nodeGroup).Error; err != nil {
			return fmt.Errorf("failed to create node group: %w", err)
		}

		// 2. Insert node_group_sub_ips
		for _, subIPID := range req.SubIPIDs {
			nodeGroupSubIP := models.NodeGroupSubIP{
				NodeGroupID: nodeGroup.ID,
				SubIPID:     subIPID,
			}
			if err := tx.Create(&nodeGroupSubIP).Error; err != nil {
				return fmt.Errorf("failed to create node group sub IP: %w", err)
			}
		}

		// 3. For each enabled sub_ip: insert domain_dns_records
		var subIPs []models.NodeSubIP
		if err := tx.Where("id IN ? AND enabled = ?", req.SubIPIDs, true).Find(&subIPs).Error; err != nil {
			return fmt.Errorf("failed to get sub IPs: %w", err)
		}

		// Calculate relative name for DNS record
		relativeName := utils.CalculateRelativeName(cname, domain.Domain)

		for _, subIP := range subIPs {
			dnsRecord := models.DomainDNSRecord{
				DomainID:  req.DomainID,
				Type:      "A",
				Name:      relativeName,
				Value:     subIP.IP,
				TTL:       120,
				Proxied:   false, // R5: Proxied default 0
				Status:    "pending",
				OwnerType: "node_group",
				OwnerID:   nodeGroup.ID,
			}
			if err := tx.Create(&dnsRecord).Error; err != nil {
				return fmt.Errorf("failed to create DNS record: %w", err)
			}
		}

		// 4. Bump config_versions
		if err := s.configVersionService.BumpVersion(tx, "node_group:create"); err != nil {
			return fmt.Errorf("failed to bump config version: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return nodeGroup, nil
}

// ListNodeGroups returns all node groups with pagination
func (s *NodeGroupService) ListNodeGroups(page, pageSize int) ([]models.NodeGroup, int64, error) {
	var nodeGroups []models.NodeGroup
	var total int64

	if err := database.DB.Model(&models.NodeGroup{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count node groups: %w", err)
	}

	offset := (page - 1) * pageSize
	if err := database.DB.Preload("Domain").Offset(offset).Limit(pageSize).Find(&nodeGroups).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get node groups: %w", err)
	}

	return nodeGroups, total, nil
}

// GetNodeGroup returns a node group by ID
func (s *NodeGroupService) GetNodeGroup(id int) (*models.NodeGroup, error) {
	var nodeGroup models.NodeGroup
	if err := database.DB.Preload("Domain").First(&nodeGroup, id).Error; err != nil {
		return nil, fmt.Errorf("node group not found: %w", err)
	}
	return &nodeGroup, nil
}

// DeleteNodeGroup deletes a node group
func (s *NodeGroupService) DeleteNodeGroup(id int) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// Delete DNS records
		if err := tx.Where("owner_type = ? AND owner_id = ?", "node_group", id).Delete(&models.DomainDNSRecord{}).Error; err != nil {
			return fmt.Errorf("failed to delete DNS records: %w", err)
		}

		// Delete node group sub IPs
		if err := tx.Where("node_group_id = ?", id).Delete(&models.NodeGroupSubIP{}).Error; err != nil {
			return fmt.Errorf("failed to delete node group sub IPs: %w", err)
		}

		// Delete node group
		if err := tx.Delete(&models.NodeGroup{}, id).Error; err != nil {
			return fmt.Errorf("failed to delete node group: %w", err)
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "node_group:delete"); err != nil {
			return fmt.Errorf("failed to bump config version: %w", err)
		}

		return nil
	})
}

// UpdateNodeGroupRequest represents the request to update a node group
type UpdateNodeGroupRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	SubIPIDs    []int   `json:"sub_ip_ids"`
}

// UpdateNodeGroup updates a node group
// DB Writes (transaction):
// 1. update node_groups (name, description)
// 2. sync node_group_sub_ips (add/remove)
// 3. for newly added enabled sub_ips: insert domain_dns_records(type=A, status=pending)
// 4. for removed sub_ips: delete corresponding domain_dns_records
// 5. bump config_versions(reason="node_group:update")
func (s *NodeGroupService) UpdateNodeGroup(id int, req UpdateNodeGroupRequest) (*models.NodeGroup, error) {
	var nodeGroup *models.NodeGroup

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// Get existing node group
		nodeGroup = &models.NodeGroup{}
		if err := tx.First(nodeGroup, id).Error; err != nil {
			return fmt.Errorf("node group not found: %w", err)
		}

		// 1. Update node_groups
		updates := make(map[string]interface{})
		if req.Name != nil {
			updates["name"] = *req.Name
		}
		if req.Description != nil {
			updates["description"] = *req.Description
		}

		if len(updates) > 0 {
			if err := tx.Model(nodeGroup).Updates(updates).Error; err != nil {
				return fmt.Errorf("failed to update node group: %w", err)
			}
		}

		// 2. Sync node_group_sub_ips if provided
		if req.SubIPIDs != nil {
			// Get existing sub IP IDs
			var existingSubIPs []models.NodeGroupSubIP
			if err := tx.Where("node_group_id = ?", id).Find(&existingSubIPs).Error; err != nil {
				return fmt.Errorf("failed to get existing sub IPs: %w", err)
			}

			existingIDMap := make(map[int]bool)
			for _, subIP := range existingSubIPs {
				existingIDMap[subIP.SubIPID] = true
			}

			newIDMap := make(map[int]bool)
			for _, subIPID := range req.SubIPIDs {
				newIDMap[subIPID] = true
			}

			// Find IDs to add and remove
			var toAdd []int
			var toRemove []int

			for _, subIPID := range req.SubIPIDs {
				if !existingIDMap[subIPID] {
					toAdd = append(toAdd, subIPID)
				}
			}

			for _, subIP := range existingSubIPs {
				if !newIDMap[subIP.SubIPID] {
					toRemove = append(toRemove, subIP.SubIPID)
				}
			}

			// Get domain for DNS record creation
			var domain models.Domain
			if err := tx.First(&domain, nodeGroup.DomainID).Error; err != nil {
				return fmt.Errorf("domain not found: %w", err)
			}

			relativeName := utils.CalculateRelativeName(nodeGroup.CNAME, domain.Domain)

			// 3. Add new sub IPs
			if len(toAdd) > 0 {
				// Insert node_group_sub_ips
				for _, subIPID := range toAdd {
					nodeGroupSubIP := models.NodeGroupSubIP{
						NodeGroupID: id,
						SubIPID:     subIPID,
					}
					if err := tx.Create(&nodeGroupSubIP).Error; err != nil {
						return fmt.Errorf("failed to create node group sub IP: %w", err)
					}
				}

				// Create DNS records for enabled sub IPs
				var newSubIPs []models.NodeSubIP
				if err := tx.Where("id IN ? AND enabled = ?", toAdd, true).Find(&newSubIPs).Error; err != nil {
					return fmt.Errorf("failed to get new sub IPs: %w", err)
				}

				for _, subIP := range newSubIPs {
					dnsRecord := models.DomainDNSRecord{
						DomainID:  nodeGroup.DomainID,
						Type:      "A",
						Name:      relativeName,
						Value:     subIP.IP,
						TTL:       120,
						Proxied:   false,
						Status:    "pending",
						OwnerType: "node_group",
						OwnerID:   id,
					}
					if err := tx.Create(&dnsRecord).Error; err != nil {
						return fmt.Errorf("failed to create DNS record: %w", err)
					}
				}
			}

			// 4. Remove old sub IPs
			if len(toRemove) > 0 {
				// Delete node_group_sub_ips
				if err := tx.Where("node_group_id = ? AND sub_ip_id IN ?", id, toRemove).Delete(&models.NodeGroupSubIP{}).Error; err != nil {
					return fmt.Errorf("failed to delete node group sub IPs: %w", err)
				}

				// Delete corresponding DNS records
				var removedSubIPs []models.NodeSubIP
				if err := tx.Where("id IN ?", toRemove).Find(&removedSubIPs).Error; err != nil {
					return fmt.Errorf("failed to get removed sub IPs: %w", err)
				}

				for _, subIP := range removedSubIPs {
					if err := tx.Where("owner_type = ? AND owner_id = ? AND value = ?", "node_group", id, subIP.IP).
						Delete(&models.DomainDNSRecord{}).Error; err != nil {
						return fmt.Errorf("failed to delete DNS record: %w", err)
					}
				}
			}
		}

		// 5. Bump config_versions
		if err := s.configVersionService.BumpVersion(tx, "node_group:update"); err != nil {
			return fmt.Errorf("failed to bump config version: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Reload node group with relations
	if err := database.DB.Preload("Domain").First(nodeGroup, id).Error; err != nil {
		return nil, fmt.Errorf("failed to reload node group: %w", err)
	}

	return nodeGroup, nil
}
