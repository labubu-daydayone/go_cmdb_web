package models

import (
	"time"
)

// Website represents the websites table
type Website struct {
	ID                 int       `gorm:"primaryKey;autoIncrement" json:"id"`
	LineGroupID        int       `gorm:"not null;index" json:"line_group_id"`
	CacheRuleID        *int      `gorm:"index" json:"cache_rule_id"`
	OriginMode         string    `gorm:"type:enum('group','manual','redirect');not null" json:"origin_mode"`
	OriginGroupID      int       `gorm:"not null;default:0" json:"origin_group_id"`
	OriginSetID        int       `gorm:"not null;default:0" json:"origin_set_id"`
	RedirectURL        *string   `gorm:"type:varchar(2048)" json:"redirect_url"`
	RedirectStatusCode *int      `json:"redirect_status_code"`
	Status             string    `gorm:"type:enum('active','inactive');not null;default:active" json:"status"`
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt          time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	LineGroup   *LineGroup  `gorm:"foreignKey:LineGroupID" json:"line_group,omitempty"`
	CacheRule   *CacheRule  `gorm:"foreignKey:CacheRuleID" json:"cache_rule,omitempty"`
	OriginGroup *OriginGroup `gorm:"foreignKey:OriginGroupID" json:"origin_group,omitempty"`
	OriginSet   *OriginSet  `gorm:"foreignKey:OriginSetID" json:"origin_set,omitempty"`
}

// TableName specifies the table name
func (Website) TableName() string {
	return "websites"
}

// WebsiteDomain represents the website_domains table
type WebsiteDomain struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	WebsiteID int       `gorm:"not null;index" json:"website_id"`
	Domain    string    `gorm:"type:varchar(255);not null;uniqueIndex" json:"domain"`
	IsPrimary bool      `gorm:"type:tinyint(1);not null;default:0" json:"is_primary"`
	CNAME     *string   `gorm:"type:varchar(255)" json:"cname"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Website *Website `gorm:"foreignKey:WebsiteID" json:"website,omitempty"`
}

// TableName specifies the table name
func (WebsiteDomain) TableName() string {
	return "website_domains"
}

// WebsiteHTTPS represents the website_https table
type WebsiteHTTPS struct {
	ID             int       `gorm:"primaryKey;autoIncrement" json:"id"`
	WebsiteID      int       `gorm:"not null;uniqueIndex" json:"website_id"`
	Enabled        bool      `gorm:"type:tinyint(1);not null;default:0" json:"enabled"`
	ForceRedirect  bool      `gorm:"type:tinyint(1);not null;default:0" json:"force_redirect"`
	HSTS           bool      `gorm:"type:tinyint(1);not null;default:0" json:"hsts"`
	CertMode       string    `gorm:"type:enum('select','acme');not null;default:select" json:"cert_mode"`
	CertificateID  *int      `gorm:"index" json:"certificate_id"`
	ACMEProviderID *int      `gorm:"index" json:"acme_provider_id"`
	ACMEAccountID  *int      `gorm:"index" json:"acme_account_id"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Website      *Website      `gorm:"foreignKey:WebsiteID" json:"website,omitempty"`
	Certificate  *Certificate  `gorm:"foreignKey:CertificateID" json:"certificate,omitempty"`
	ACMEProvider *ACMEProvider `gorm:"foreignKey:ACMEProviderID" json:"acme_provider,omitempty"`
	ACMEAccount  *ACMEAccount  `gorm:"foreignKey:ACMEAccountID" json:"acme_account,omitempty"`
}

// TableName specifies the table name
func (WebsiteHTTPS) TableName() string {
	return "website_https"
}
