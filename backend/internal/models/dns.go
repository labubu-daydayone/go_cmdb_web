package models

import (
	"time"
)

// Domain represents the domains table (DNS zone)
type Domain struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Domain    string    `gorm:"type:varchar(255);not null;uniqueIndex" json:"domain"`
	Purpose   string    `gorm:"type:enum('cdn','general');not null;default:cdn" json:"purpose"`
	Status    string    `gorm:"type:enum('active','inactive');not null;default:active" json:"status"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name
func (Domain) TableName() string {
	return "domains"
}

// DomainDNSProvider represents the domain_dns_providers table (zone -> provider mapping)
type DomainDNSProvider struct {
	ID             int       `gorm:"primaryKey;autoIncrement" json:"id"`
	DomainID       int       `gorm:"not null;uniqueIndex" json:"domain_id"`
	Provider       string    `gorm:"type:enum('cloudflare','aliyun','tencent','route53','manual');not null" json:"provider"`
	ProviderZoneID string    `gorm:"type:varchar(128);not null" json:"provider_zone_id"`
	APIKeyID       int       `gorm:"not null" json:"api_key_id"`
	Status         string    `gorm:"type:enum('active','inactive');not null;default:active" json:"status"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Domain *Domain `gorm:"foreignKey:DomainID" json:"domain,omitempty"`
	APIKey *APIKey `gorm:"foreignKey:APIKeyID" json:"api_key,omitempty"`
}

// TableName specifies the table name
func (DomainDNSProvider) TableName() string {
	return "domain_dns_providers"
}

// DomainDNSRecord represents the domain_dns_records table (DNS desired-state)
type DomainDNSRecord struct {
	ID               int        `gorm:"primaryKey;autoIncrement" json:"id"`
	DomainID         int        `gorm:"not null;index" json:"domain_id"`
	Type             string     `gorm:"type:enum('A','AAAA','CNAME','TXT');not null" json:"type"`
	Name             string     `gorm:"type:varchar(255);not null" json:"name"`
	Value            string     `gorm:"type:varchar(2048);not null" json:"value"`
	TTL              int        `gorm:"not null;default:120" json:"ttl"`
	Proxied          bool       `gorm:"type:tinyint(1);not null;default:0" json:"proxied"`
	Status           string     `gorm:"type:enum('pending','active','error');not null;default:pending" json:"status"`
	ProviderRecordID *string    `gorm:"type:varchar(128)" json:"provider_record_id"`
	LastError        *string    `gorm:"type:varchar(255)" json:"last_error"`
	RetryCount       int        `gorm:"not null;default:0" json:"retry_count"`
	NextRetryAt      *time.Time `json:"next_retry_at"`
	OwnerType        string     `gorm:"type:enum('node_group','line_group','website_domain','acme_challenge');not null" json:"owner_type"`
	OwnerID          int        `gorm:"not null;index" json:"owner_id"`
	CreatedAt        time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Domain *Domain `gorm:"foreignKey:DomainID" json:"domain,omitempty"`
}

// TableName specifies the table name
func (DomainDNSRecord) TableName() string {
	return "domain_dns_records"
}
