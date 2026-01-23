package models

import (
	"time"
)

// Node represents the nodes table (Agent)
type Node struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(128);not null;uniqueIndex" json:"name"`
	MainIP    string    `gorm:"type:varchar(64);not null" json:"main_ip"`
	AgentPort int       `gorm:"not null;default:8080" json:"agent_port"`
	Enabled   bool      `gorm:"type:tinyint(1);not null;default:1" json:"enabled"`
	Status    string    `gorm:"type:enum('online','offline','maintenance');not null;default:offline" json:"status"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name
func (Node) TableName() string {
	return "nodes"
}

// NodeSubIP represents the node_sub_ips table
type NodeSubIP struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	NodeID    int       `gorm:"not null;index" json:"node_id"`
	IP        string    `gorm:"type:varchar(64);not null" json:"ip"`
	Enabled   bool      `gorm:"type:tinyint(1);not null;default:1" json:"enabled"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Node *Node `gorm:"foreignKey:NodeID" json:"node,omitempty"`
}

// TableName specifies the table name
func (NodeSubIP) TableName() string {
	return "node_sub_ips"
}

// NodeGroup represents the node_groups table
type NodeGroup struct {
	ID           int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string    `gorm:"type:varchar(128);not null;uniqueIndex" json:"name"`
	Description  *string   `gorm:"type:varchar(255)" json:"description"`
	DomainID     int       `gorm:"not null;index" json:"domain_id"`
	CNAMEPrefix  string    `gorm:"type:varchar(128);not null;uniqueIndex" json:"cname_prefix"`
	CNAME        string    `gorm:"type:varchar(255);not null;uniqueIndex" json:"cname"`
	Status       string    `gorm:"type:enum('active','inactive');not null;default:active" json:"status"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Domain *Domain `gorm:"foreignKey:DomainID" json:"domain,omitempty"`
}

// TableName specifies the table name
func (NodeGroup) TableName() string {
	return "node_groups"
}

// NodeGroupSubIP represents the node_group_sub_ips table
type NodeGroupSubIP struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	NodeGroupID int       `gorm:"not null;index" json:"node_group_id"`
	SubIPID     int       `gorm:"not null;index" json:"sub_ip_id"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	NodeGroup *NodeGroup `gorm:"foreignKey:NodeGroupID" json:"node_group,omitempty"`
	SubIP     *NodeSubIP `gorm:"foreignKey:SubIPID" json:"sub_ip,omitempty"`
}

// TableName specifies the table name
func (NodeGroupSubIP) TableName() string {
	return "node_group_sub_ips"
}

// LineGroup represents the line_groups table
type LineGroup struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"type:varchar(128);not null;uniqueIndex" json:"name"`
	DomainID    int       `gorm:"not null;index" json:"domain_id"`
	NodeGroupID int       `gorm:"not null;index" json:"node_group_id"`
	CNAMEPrefix string    `gorm:"type:varchar(128);not null;uniqueIndex" json:"cname_prefix"`
	CNAME       string    `gorm:"type:varchar(255);not null;uniqueIndex" json:"cname"`
	Status      string    `gorm:"type:enum('active','inactive');not null;default:active" json:"status"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Domain    *Domain    `gorm:"foreignKey:DomainID" json:"domain,omitempty"`
	NodeGroup *NodeGroup `gorm:"foreignKey:NodeGroupID" json:"node_group,omitempty"`
}

// TableName specifies the table name
func (LineGroup) TableName() string {
	return "line_groups"
}
