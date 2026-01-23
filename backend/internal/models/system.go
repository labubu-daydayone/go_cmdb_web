package models

import (
	"time"
)

// AgentTask represents the agent_tasks table
type AgentTask struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	NodeID    int       `gorm:"not null;index" json:"node_id"`
	Type      string    `gorm:"type:enum('purge_cache','apply_config','reload');not null" json:"type"`
	Payload   string    `gorm:"type:json;not null" json:"payload"`
	Status    string    `gorm:"type:enum('pending','running','success','failed');not null;default:pending" json:"status"`
	LastError *string   `gorm:"type:varchar(255)" json:"last_error"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Node *Node `gorm:"foreignKey:NodeID" json:"node,omitempty"`
}

// TableName specifies the table name
func (AgentTask) TableName() string {
	return "agent_tasks"
}

// ConfigVersion represents the config_versions table
// R1: All config changes must bump this table (insert new row, version increments)
type ConfigVersion struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Version   int64     `gorm:"not null;uniqueIndex" json:"version"`
	Reason    *string   `gorm:"type:varchar(255)" json:"reason"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// TableName specifies the table name
func (ConfigVersion) TableName() string {
	return "config_versions"
}
