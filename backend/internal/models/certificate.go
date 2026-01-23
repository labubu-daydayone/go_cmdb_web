package models

import (
	"time"
)

// ACMEProvider represents the acme_providers table
type ACMEProvider struct {
	ID           int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string    `gorm:"type:varchar(64);not null;uniqueIndex" json:"name"`
	DirectoryURL string    `gorm:"type:varchar(255);not null" json:"directory_url"`
	RequiresEAB  bool      `gorm:"type:tinyint(1);not null;default:0" json:"requires_eab"`
	Status       string    `gorm:"type:enum('active','inactive');not null;default:active" json:"status"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name
func (ACMEProvider) TableName() string {
	return "acme_providers"
}

// ACMEAccount represents the acme_accounts table
type ACMEAccount struct {
	ID              int        `gorm:"primaryKey;autoIncrement" json:"id"`
	ProviderID      int        `gorm:"not null;index" json:"provider_id"`
	Email           string     `gorm:"type:varchar(255);not null" json:"email"`
	AccountKeyPEM   string     `gorm:"type:longtext;not null" json:"-"`
	RegistrationURI *string    `gorm:"type:varchar(255)" json:"registration_uri"`
	Status          string     `gorm:"type:enum('pending','active','disabled');not null;default:pending" json:"status"`
	LastError       *string    `gorm:"type:varchar(255)" json:"last_error"`
	EABKid          *string    `gorm:"type:varchar(255)" json:"eab_kid"`
	EABHmacKey      *string    `gorm:"type:varchar(255)" json:"-"`
	EABExpiresAt    *time.Time `json:"eab_expires_at"`
	CreatedAt       time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Provider *ACMEProvider `gorm:"foreignKey:ProviderID" json:"provider,omitempty"`
}

// TableName specifies the table name
func (ACMEAccount) TableName() string {
	return "acme_accounts"
}

// CertificateRequest represents the certificate_requests table
type CertificateRequest struct {
	ID                  int        `gorm:"primaryKey;autoIncrement" json:"id"`
	ACMEAccountID       int        `gorm:"not null;index" json:"acme_account_id"`
	DomainsJSON         string     `gorm:"type:json;not null" json:"domains_json"`
	Status              string     `gorm:"type:enum('pending','running','success','failed');not null;default:pending" json:"status"`
	PollIntervalSec     int        `gorm:"not null;default:40" json:"poll_interval_sec"`
	PollMaxAttempts     int        `gorm:"not null;default:10" json:"poll_max_attempts"`
	Attempts            int        `gorm:"not null;default:0" json:"attempts"`
	LastError           *string    `gorm:"type:varchar(255)" json:"last_error"`
	ResultCertificateID *int       `gorm:"index" json:"result_certificate_id"`
	CreatedAt           time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt           time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	ACMEAccount       *ACMEAccount  `gorm:"foreignKey:ACMEAccountID" json:"acme_account,omitempty"`
	ResultCertificate *Certificate  `gorm:"foreignKey:ResultCertificateID" json:"result_certificate,omitempty"`
}

// TableName specifies the table name
func (CertificateRequest) TableName() string {
	return "certificate_requests"
}

// Certificate represents the certificates table
// NOTE: R14 - certificates table MUST NOT store domain/san fields
type Certificate struct {
	ID             int        `gorm:"primaryKey;autoIncrement" json:"id"`
	Provider       string     `gorm:"type:enum('letsencrypt','google_publicca','manual');not null" json:"provider"`
	Source         string     `gorm:"type:enum('acme','manual');not null" json:"source"`
	ACMEAccountID  *int       `gorm:"index" json:"acme_account_id"`
	Status         string     `gorm:"type:enum('valid','expiring','expired','revoked');not null;default:valid" json:"status"`
	IssueAt        *time.Time `json:"issue_at"`
	ExpireAt       *time.Time `json:"expire_at"`
	Fingerprint    string     `gorm:"type:varchar(128);not null;uniqueIndex" json:"fingerprint"`
	CertificatePEM string     `gorm:"type:longtext;not null" json:"certificate_pem"`
	PrivateKeyPEM  string     `gorm:"type:longtext;not null" json:"-"`
	RenewMode      string     `gorm:"type:enum('auto','manual');not null;default:manual" json:"renew_mode"`
	RenewAt        *time.Time `json:"renew_at"`
	LastError      *string    `gorm:"type:varchar(255)" json:"last_error"`
	CreatedAt      time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	ACMEAccount *ACMEAccount `gorm:"foreignKey:ACMEAccountID" json:"acme_account,omitempty"`
}

// TableName specifies the table name
func (Certificate) TableName() string {
	return "certificates"
}

// CertificateDomain represents the certificate_domains table
// R15: This is the ONLY place to store certificate covered domains
type CertificateDomain struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	CertificateID int       `gorm:"not null;index" json:"certificate_id"`
	Domain        string    `gorm:"type:varchar(255);not null" json:"domain"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Certificate *Certificate `gorm:"foreignKey:CertificateID" json:"certificate,omitempty"`
}

// TableName specifies the table name
func (CertificateDomain) TableName() string {
	return "certificate_domains"
}

// CertificateBinding represents the certificate_bindings table
// R17: One website can only have ONE active binding
type CertificateBinding struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	CertificateID int       `gorm:"not null;index" json:"certificate_id"`
	BindType      string    `gorm:"type:enum('website');not null" json:"bind_type"`
	BindID        int       `gorm:"not null;index" json:"bind_id"`
	IsActive      bool      `gorm:"type:tinyint(1);not null;default:1" json:"is_active"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Certificate *Certificate `gorm:"foreignKey:CertificateID" json:"certificate,omitempty"`
}

// TableName specifies the table name
func (CertificateBinding) TableName() string {
	return "certificate_bindings"
}
