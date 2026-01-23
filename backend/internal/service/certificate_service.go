package service

import (
"crypto/sha256"
"crypto/x509"
"encoding/hex"
"encoding/pem"
"errors"
"fmt"
"strings"
"time"

"github.com/labubu-daydayone/go_cmdb_web/backend/internal/db"
"github.com/labubu-daydayone/go_cmdb_web/backend/internal/models"
)

// Certificate service errors
var (
ErrCertificateNotFound         = errors.New("certificate not found")
ErrInvalidCertificatePEM       = errors.New("invalid certificate PEM format")
ErrInvalidPrivateKeyPEM        = errors.New("invalid private key PEM format")
ErrCertificateExpired          = errors.New("certificate has expired")
ErrDomainNotCovered            = errors.New("website domains not covered by certificate")
ErrActiveBindingExists         = errors.New("website already has an active certificate binding")
ErrBindingNotFound             = errors.New("certificate binding not found")
)

// CertificateService handles certificate management
type CertificateService struct {
configVersionService *ConfigVersionService
websiteService       *WebsiteService
}

// NewCertificateService creates a new certificate service
func NewCertificateService() *CertificateService {
return &CertificateService{
configVersionService: NewConfigVersionService(),
websiteService:       NewWebsiteService(),
}
}

// UploadCertificateRequest represents the request to upload a certificate
type UploadCertificateRequest struct {
CertificatePEM string `json:"certificate_pem" binding:"required"`
PrivateKeyPEM  string `json:"private_key_pem" binding:"required"`
}

// UploadCertificateResponse represents the response after uploading a certificate
type UploadCertificateResponse struct {
CertificateID int      `json:"certificate_id"`
Domains       []string `json:"domains"`
IssueAt       string   `json:"issue_at"`
ExpireAt      string   `json:"expire_at"`
Fingerprint   string   `json:"fingerprint"`
}

// BindCertificateRequest represents the request to bind a certificate to a website
type BindCertificateRequest struct {
CertificateID int `json:"certificate_id" binding:"required"`
WebsiteID     int `json:"website_id" binding:"required"`
}

// UnbindCertificateRequest represents the request to unbind a certificate from a website
type UnbindCertificateRequest struct {
WebsiteID int `json:"website_id" binding:"required"`
}

// WF-06: Upload Certificate (manual)
// 1. Parse cert PEM -> get SAN list
// 2. Compute fingerprint
// 3. Insert certificates(provider=manual, source=manual, renew_mode=manual)
// 4. Insert certificate_domains (one row per SAN)
// 5. Return certificate_id
func (s *CertificateService) UploadCertificate(req UploadCertificateRequest) (*UploadCertificateResponse, error) {
// Parse certificate PEM
block, _ := pem.Decode([]byte(req.CertificatePEM))
if block == nil || block.Type != "CERTIFICATE" {
return nil, ErrInvalidCertificatePEM
}

cert, err := x509.ParseCertificate(block.Bytes)
if err != nil {
return nil, fmt.Errorf("failed to parse certificate: %w", err)
}

// Validate private key PEM
keyBlock, _ := pem.Decode([]byte(req.PrivateKeyPEM))
if keyBlock == nil {
return nil, ErrInvalidPrivateKeyPEM
}

// Check if certificate is expired
if time.Now().After(cert.NotAfter) {
return nil, ErrCertificateExpired
}

// Extract SAN list (Subject Alternative Names)
domains := make([]string, 0)
if len(cert.DNSNames) > 0 {
domains = append(domains, cert.DNSNames...)
}
// Also include CN if not in SAN
if cert.Subject.CommonName != "" {
found := false
for _, d := range domains {
if d == cert.Subject.CommonName {
found = true
break
}
}
if !found {
domains = append(domains, cert.Subject.CommonName)
}
}

if len(domains) == 0 {
return nil, errors.New("certificate has no valid domains")
}

// Compute fingerprint (SHA256 of DER bytes)
hash := sha256.Sum256(cert.Raw)
fingerprint := hex.EncodeToString(hash[:])

// Check if certificate already exists
var existingCert models.Certificate
if err := db.DB.Where("fingerprint = ?", fingerprint).First(&existingCert).Error; err == nil {
return nil, errors.New("certificate already exists")
}

// Begin transaction
tx := db.DB.Begin()
defer func() {
if r := recover(); r != nil {
tx.Rollback()
}
}()

// Insert certificate
certificate := models.Certificate{
Provider:       "manual",
Source:         "manual",
Status:         "valid",
IssueAt:        &cert.NotBefore,
ExpireAt:       &cert.NotAfter,
Fingerprint:    fingerprint,
CertificatePEM: req.CertificatePEM,
PrivateKeyPEM:  req.PrivateKeyPEM,
RenewMode:      "manual",
}

if err := tx.Create(&certificate).Error; err != nil {
tx.Rollback()
return nil, fmt.Errorf("failed to create certificate: %w", err)
}

// Insert certificate domains
for _, domain := range domains {
certDomain := models.CertificateDomain{
CertificateID: certificate.ID,
Domain:        domain,
}
if err := tx.Create(&certDomain).Error; err != nil {
tx.Rollback()
return nil, fmt.Errorf("failed to create certificate domain: %w", err)
}
}

if err := tx.Commit().Error; err != nil {
return nil, fmt.Errorf("failed to commit transaction: %w", err)
}

return &UploadCertificateResponse{
CertificateID: certificate.ID,
Domains:       domains,
IssueAt:       cert.NotBefore.Format(time.RFC3339),
ExpireAt:      cert.NotAfter.Format(time.RFC3339),
Fingerprint:   fingerprint,
}, nil
}

// ListCertificates returns a paginated list of certificates
func (s *CertificateService) ListCertificates(page, pageSize int, status string) ([]models.Certificate, int64, error) {
var certificates []models.Certificate
var total int64

query := db.DB.Model(&models.Certificate{})

if status != "" {
query = query.Where("status = ?", status)
}

if err := query.Count(&total).Error; err != nil {
return nil, 0, err
}

offset := (page - 1) * pageSize
if err := query.Offset(offset).Limit(pageSize).Order("id DESC").Find(&certificates).Error; err != nil {
return nil, 0, err
}

return certificates, total, nil
}

// GetCertificate returns a certificate by ID with its domains
func (s *CertificateService) GetCertificate(id int) (*models.Certificate, []models.CertificateDomain, error) {
var certificate models.Certificate
if err := db.DB.First(&certificate, id).Error; err != nil {
return nil, nil, ErrCertificateNotFound
}

var domains []models.CertificateDomain
if err := db.DB.Where("certificate_id = ?", id).Find(&domains).Error; err != nil {
return nil, nil, err
}

return &certificate, domains, nil
}

// DeleteCertificate deletes a certificate and its related data
func (s *CertificateService) DeleteCertificate(id int) error {
// Check if certificate exists
var certificate models.Certificate
if err := db.DB.First(&certificate, id).Error; err != nil {
return ErrCertificateNotFound
}

// Check if certificate is bound to any website
var bindingCount int64
if err := db.DB.Model(&models.CertificateBinding{}).
Where("certificate_id = ? AND is_active = ?", id, true).
Count(&bindingCount).Error; err != nil {
return err
}

if bindingCount > 0 {
return errors.New("certificate is bound to active websites, unbind first")
}

// Begin transaction
tx := db.DB.Begin()
defer func() {
if r := recover(); r != nil {
tx.Rollback()
}
}()

// Delete certificate domains
if err := tx.Where("certificate_id = ?", id).Delete(&models.CertificateDomain{}).Error; err != nil {
tx.Rollback()
return err
}

// Delete certificate bindings (inactive ones)
if err := tx.Where("certificate_id = ?", id).Delete(&models.CertificateBinding{}).Error; err != nil {
tx.Rollback()
return err
}

// Delete certificate
if err := tx.Delete(&certificate).Error; err != nil {
tx.Rollback()
return err
}

if err := tx.Commit().Error; err != nil {
return err
}

return nil
}

// WF-08: Bind Certificate to Website
// 1. Validate coverage: website_domains must be covered by certificate_domains (wildcard ok)
// 2. Set old binding is_active=0
// 3. Insert new binding is_active=1
// 4. Bump config_versions(reason="cert:bind")
func (s *CertificateService) BindCertificate(req BindCertificateRequest) error {
// Get certificate domains
var certDomains []models.CertificateDomain
if err := db.DB.Where("certificate_id = ?", req.CertificateID).Find(&certDomains).Error; err != nil {
return err
}

if len(certDomains) == 0 {
return ErrCertificateNotFound
}

// Get website domains
websiteDomains, err := s.websiteService.GetWebsiteDomains(req.WebsiteID)
if err != nil {
return err
}

if len(websiteDomains) == 0 {
return errors.New("website has no domains")
}

// Validate coverage
certDomainSet := make(map[string]bool)
for _, cd := range certDomains {
certDomainSet[cd.Domain] = true
}

for _, wd := range websiteDomains {
if !s.isDomainCovered(wd.Domain, certDomainSet) {
return fmt.Errorf("%w: %s", ErrDomainNotCovered, wd.Domain)
}
}

// Begin transaction
tx := db.DB.Begin()
defer func() {
if r := recover(); r != nil {
tx.Rollback()
}
}()

// Set old binding is_active=0
if err := tx.Model(&models.CertificateBinding{}).
Where("bind_type = ? AND bind_id = ? AND is_active = ?", "website", req.WebsiteID, true).
Update("is_active", false).Error; err != nil {
tx.Rollback()
return err
}

// Insert new binding
binding := models.CertificateBinding{
CertificateID: req.CertificateID,
BindType:      "website",
BindID:        req.WebsiteID,
IsActive:      true,
}

if err := tx.Create(&binding).Error; err != nil {
tx.Rollback()
return err
}

if err := tx.Commit().Error; err != nil {
return err
}

// Bump config version
if err := s.configVersionService.BumpVersion("cert:bind"); err != nil {
return err
}

return nil
}

// UnbindCertificate unbinds the active certificate from a website
func (s *CertificateService) UnbindCertificate(req UnbindCertificateRequest) error {
// Set active binding to inactive
result := db.DB.Model(&models.CertificateBinding{}).
Where("bind_type = ? AND bind_id = ? AND is_active = ?", "website", req.WebsiteID, true).
Update("is_active", false)

if result.Error != nil {
return result.Error
}

if result.RowsAffected == 0 {
return ErrBindingNotFound
}

// Bump config version
if err := s.configVersionService.BumpVersion("cert:unbind"); err != nil {
return err
}

return nil
}

// GetWebsiteCertificate returns the active certificate for a website
func (s *CertificateService) GetWebsiteCertificate(websiteID int) (*models.Certificate, error) {
var binding models.CertificateBinding
if err := db.DB.Where("bind_type = ? AND bind_id = ? AND is_active = ?", "website", websiteID, true).
First(&binding).Error; err != nil {
return nil, ErrBindingNotFound
}

var certificate models.Certificate
if err := db.DB.First(&certificate, binding.CertificateID).Error; err != nil {
return nil, ErrCertificateNotFound
}

return &certificate, nil
}

// isDomainCovered checks if a domain is covered by certificate domains (supports wildcard)
func (s *CertificateService) isDomainCovered(domain string, certDomains map[string]bool) bool {
// Exact match
if certDomains[domain] {
return true
}

// Wildcard match
parts := strings.Split(domain, ".")
if len(parts) > 1 {
wildcard := "*." + strings.Join(parts[1:], ".")
if certDomains[wildcard] {
return true
}
}

return false
}
