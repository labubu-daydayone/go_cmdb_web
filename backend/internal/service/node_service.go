package service

import (
	"errors"

	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrNodeNotFound      = errors.New("node not found")
	ErrNodeAlreadyExists = errors.New("node already exists")
	ErrNodeInUse         = errors.New("node is in use")
)

type NodeService struct {
	configVersionService *ConfigVersionService
}

func NewNodeService(configVersionService *ConfigVersionService) *NodeService {
	return &NodeService{
		configVersionService: configVersionService,
	}
}

// CreateNodeRequest represents request to create a node
type CreateNodeRequest struct {
	Name      string `json:"name" binding:"required"`
	MainIP    string `json:"main_ip" binding:"required"`
	AgentPort int    `json:"agent_port"`
	Enabled   bool   `json:"enabled"`
}

// UpdateNodeRequest represents request to update a node
type UpdateNodeRequest struct {
	Name      *string `json:"name"`
	MainIP    *string `json:"main_ip"`
	AgentPort *int    `json:"agent_port"`
	Enabled   *bool   `json:"enabled"`
	Status    *string `json:"status"`
}

// AddSubIPRequest represents request to add a sub IP
type AddSubIPRequest struct {
	NodeID  int    `json:"node_id" binding:"required"`
	IP      string `json:"ip" binding:"required"`
	Enabled bool   `json:"enabled"`
}

// UpdateSubIPRequest represents request to update a sub IP
type UpdateSubIPRequest struct {
	Enabled *bool `json:"enabled"`
}

// CreateNode creates a new node
func (s *NodeService) CreateNode(req CreateNodeRequest) (*models.Node, error) {
	db := database.DB

	// Check if node with same name exists
	var existing models.Node
	if err := db.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		return nil, ErrNodeAlreadyExists
	}

	agentPort := 8080
	if req.AgentPort > 0 {
		agentPort = req.AgentPort
	}

	node := &models.Node{
		Name:      req.Name,
		MainIP:    req.MainIP,
		AgentPort: agentPort,
		Enabled:   req.Enabled,
		Status:    "offline",
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(node).Error; err != nil {
			return err
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "node:create"); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return node, nil
}

// ListNodes returns all nodes with pagination
func (s *NodeService) ListNodes(page, pageSize int, status string) ([]models.Node, int64, error) {
	var nodes []models.Node
	var total int64

	query := database.DB.Model(&models.Node{})
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&nodes).Error; err != nil {
		return nil, 0, err
	}

	return nodes, total, nil
}

// GetNode returns a node by ID
func (s *NodeService) GetNode(id int) (*models.Node, error) {
	var node models.Node
	if err := database.DB.First(&node, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNodeNotFound
		}
		return nil, err
	}
	return &node, nil
}

// UpdateNode updates a node
func (s *NodeService) UpdateNode(id int, req UpdateNodeRequest) (*models.Node, error) {
	db := database.DB

	var node models.Node
	if err := db.First(&node, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNodeNotFound
		}
		return nil, err
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.MainIP != nil {
		updates["main_ip"] = *req.MainIP
	}
	if req.AgentPort != nil {
		updates["agent_port"] = *req.AgentPort
	}
	if req.Enabled != nil {
		updates["enabled"] = *req.Enabled
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if len(updates) == 0 {
		return &node, nil
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&node).Updates(updates).Error; err != nil {
			return err
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "node:update"); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &node, nil
}

// DeleteNode deletes a node
func (s *NodeService) DeleteNode(id int) error {
	db := database.DB

	// Check if node is in use by node groups
	var count int64
	if err := db.Model(&models.NodeGroupSubIP{}).
		Joins("JOIN node_sub_ips ON node_sub_ips.id = node_group_sub_ips.sub_ip_id").
		Where("node_sub_ips.node_id = ?", id).
		Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return ErrNodeInUse
	}

	return db.Transaction(func(tx *gorm.DB) error {
		// Delete sub IPs
		if err := tx.Where("node_id = ?", id).Delete(&models.NodeSubIP{}).Error; err != nil {
			return err
		}

		// Delete node
		if err := tx.Delete(&models.Node{}, id).Error; err != nil {
			return err
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "node:delete"); err != nil {
			return err
		}

		return nil
	})
}

// AddSubIP adds a sub IP to a node
func (s *NodeService) AddSubIP(req AddSubIPRequest) (*models.NodeSubIP, error) {
	db := database.DB

	// Check if node exists
	var node models.Node
	if err := db.First(&node, req.NodeID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNodeNotFound
		}
		return nil, err
	}

	// Check if sub IP already exists
	var existing models.NodeSubIP
	if err := db.Where("node_id = ? AND ip = ?", req.NodeID, req.IP).First(&existing).Error; err == nil {
		return nil, errors.New("sub IP already exists")
	}

	subIP := &models.NodeSubIP{
		NodeID:  req.NodeID,
		IP:      req.IP,
		Enabled: req.Enabled,
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(subIP).Error; err != nil {
			return err
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "node:sub_ip:add"); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return subIP, nil
}

// UpdateSubIP updates a sub IP
func (s *NodeService) UpdateSubIP(id int, req UpdateSubIPRequest) (*models.NodeSubIP, error) {
	db := database.DB

	var subIP models.NodeSubIP
	if err := db.First(&subIP, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("sub IP not found")
		}
		return nil, err
	}

	updates := make(map[string]interface{})
	if req.Enabled != nil {
		updates["enabled"] = *req.Enabled
	}

	if len(updates) == 0 {
		return &subIP, nil
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&subIP).Updates(updates).Error; err != nil {
			return err
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "node:sub_ip:update"); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &subIP, nil
}

// DeleteSubIP deletes a sub IP
func (s *NodeService) DeleteSubIP(id int) error {
	db := database.DB

	// Check if sub IP is in use by node groups
	var count int64
	if err := db.Model(&models.NodeGroupSubIP{}).Where("sub_ip_id = ?", id).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("sub IP is in use by node groups")
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&models.NodeSubIP{}, id).Error; err != nil {
			return err
		}

		// Bump config version
		if err := s.configVersionService.BumpVersion(tx, "node:sub_ip:delete"); err != nil {
			return err
		}

		return nil
	})
}

// ListSubIPs returns all sub IPs for a node
func (s *NodeService) ListSubIPs(nodeID int) ([]models.NodeSubIP, error) {
	var subIPs []models.NodeSubIP
	if err := database.DB.Where("node_id = ?", nodeID).Find(&subIPs).Error; err != nil {
		return nil, err
	}
	return subIPs, nil
}
