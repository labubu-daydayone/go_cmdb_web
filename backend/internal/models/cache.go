package models

import (
	"time"
)

// CacheRule represents the cache_rules table
type CacheRule struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"type:varchar(128);not null;uniqueIndex" json:"name"`
	Description *string   `gorm:"type:varchar(255)" json:"description"`
	Status      string    `gorm:"type:enum('active','inactive');not null;default:active" json:"status"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name
func (CacheRule) TableName() string {
	return "cache_rules"
}

// CacheRuleItem represents the cache_rule_items table
type CacheRuleItem struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	CacheRuleID int       `gorm:"not null;index" json:"cache_rule_id"`
	RuleType    string    `gorm:"type:enum('directory','suffix','file');not null" json:"rule_type"`
	Path        string    `gorm:"type:varchar(255);not null" json:"path"`
	TTL         int       `gorm:"not null" json:"ttl"`
	ForceCache  bool      `gorm:"type:tinyint(1);not null;default:0" json:"force_cache"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	CacheRule *CacheRule `gorm:"foreignKey:CacheRuleID" json:"cache_rule,omitempty"`
}

// TableName specifies the table name
func (CacheRuleItem) TableName() string {
	return "cache_rule_items"
}
