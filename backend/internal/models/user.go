package models

import (
	"time"
)

// User represents the users table
type User struct {
	ID           int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Username     string    `gorm:"type:varchar(64);not null;uniqueIndex" json:"username"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	Role         string    `gorm:"type:varchar(32);not null;default:admin" json:"role"`
	Status       string    `gorm:"type:enum('active','inactive');not null;default:active" json:"status"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name
func (User) TableName() string {
	return "users"
}

// APIKey represents the api_keys table
type APIKey struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(128);not null" json:"name"`
	Provider  string    `gorm:"type:enum('cloudflare');not null" json:"provider"`
	Account   *string   `gorm:"type:varchar(255)" json:"account"`
	APIToken  string    `gorm:"type:varchar(255);not null" json:"api_token"`
	Status    string    `gorm:"type:enum('active','inactive');not null;default:active" json:"status"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name
func (APIKey) TableName() string {
	return "api_keys"
}
