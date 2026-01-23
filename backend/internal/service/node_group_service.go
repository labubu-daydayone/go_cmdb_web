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
		relativeName, err := utils.CalculateRelativeName(cname, domain.Domain)
		if err != nil {
			return fmt.Errorf("failed to calculate relative name: %w", err)
		}

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
