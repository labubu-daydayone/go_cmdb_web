package models

import (
	"time"
)

// OriginGroup represents the origin_groups table (reusable)
type OriginGroup struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"type:varchar(128);not null;uniqueIndex" json:"name"`
	Description *string   `gorm:"type:varchar(255)" json:"description"`
	Status      string    `gorm:"type:enum('active','inactive');not null;default:active" json:"status"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name
func (OriginGroup) TableName() string {
	return "origin_groups"
}

// OriginGroupAddress represents the origin_group_addresses table
type OriginGroupAddress struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	OriginGroupID int       `gorm:"not null;index" json:"origin_group_id"`
	Role          string    `gorm:"type:enum('primary','backup');not null" json:"role"`
	Protocol      string    `gorm:"type:enum('http','https');not null" json:"protocol"`
	Address       string    `gorm:"type:varchar(255);not null" json:"address"`
	Weight        int       `gorm:"not null;default:10" json:"weight"`
	Enabled       bool      `gorm:"type:tinyint(1);not null;default:1" json:"enabled"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	OriginGroup *OriginGroup `gorm:"foreignKey:OriginGroupID" json:"origin_group,omitempty"`
}

// TableName specifies the table name
func (OriginGroupAddress) TableName() string {
	return "origin_group_addresses"
}

// OriginSet represents the origin_sets table (per-website snapshot, not reusable)
type OriginSet struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Source        string    `gorm:"type:enum('group','manual');not null" json:"source"`
	OriginGroupID int       `gorm:"not null;default:0" json:"origin_group_id"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name
func (OriginSet) TableName() string {
	return "origin_sets"
}

// OriginAddress represents the origin_addresses table (snapshot addresses)
type OriginAddress struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	OriginSetID int       `gorm:"not null;index" json:"origin_set_id"`
	Role        string    `gorm:"type:enum('primary','backup');not null" json:"role"`
	Protocol    string    `gorm:"type:enum('http','https');not null" json:"protocol"`
	Address     string    `gorm:"type:varchar(255);not null" json:"address"`
	Weight      int       `gorm:"not null;default:10" json:"weight"`
	Enabled     bool      `gorm:"type:tinyint(1);not null;default:1" json:"enabled"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	OriginSet *OriginSet `gorm:"foreignKey:OriginSetID" json:"origin_set,omitempty"`
}

// TableName specifies the table name
func (OriginAddress) TableName() string {
	return "origin_addresses"
}
