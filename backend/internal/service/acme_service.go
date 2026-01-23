package service

import (
"crypto"
"crypto/ecdsa"
"crypto/elliptic"
"crypto/rand"
"crypto/sha256"
"crypto/x509"
"encoding/hex"
"encoding/json"
"encoding/pem"
"errors"
"fmt"
"time"

"github.com/go-acme/lego/v4/certcrypto"
"github.com/go-acme/lego/v4/certificate"
"github.com/go-acme/lego/v4/challenge/dns01"
"github.com/go-acme/lego/v4/lego"
"github.com/go-acme/lego/v4/registration"
"github.com/labubu-daydayone/go_cmdb_web/backend/internal/db"
"github.com/labubu-daydayone/go_cmdb_web/backend/internal/models"
)

// ACME service errors
var (
ErrACMEAccountNotFound  = errors.New("acme account not found")
ErrCertificateRequestNotFound = errors.New("certificate request not found")
ErrDNSChallengeTimeout  = errors.New("dns challenge validation timeout")
)

// ACMEService handles ACME certificate requests
type ACMEService struct {
certificateService   *CertificateService
dnsRecordService     *DNSRecordService
configVersionService *ConfigVersionService
}

// NewACMEService creates a new ACME service
func NewACMEService() *ACMEService {
return &ACMEService{
certificateService:   NewCertificateService(),
dnsRecordService:     NewDNSRecordService(),
configVersionService: NewConfigVersionService(),
}
}

// RequestCertificateRequest represents the request to request a certificate via ACME
type RequestCertificateRequest struct {
ACMEAccountID int      `json:"acme_account_id" binding:"required"`
Domains       []string `json:"domains" binding:"required,min=1"`
}

// RequestCertificateResponse represents the response after requesting a certificate
type RequestCertificateResponse struct {
RequestID int    `json:"request_id"`
Status    string `json:"status"`
}

// ACMEUser implements the registration.User interface for lego
type ACMEUser struct {
Email        string
Registration *registration.Resource
key          crypto.PrivateKey
}

func (u *ACMEUser) GetEmail() string {
return u.Email
}

func (u *ACMEUser) GetRegistration() *registration.Resource {
return u.Registration
}

func (u *ACMEUser) GetPrivateKey() crypto.PrivateKey {
return u.key
}

// WF-07: Certificate Request (ACME DNS-01)
// 1. Create certificate_requests(status=pending)
// 2. Create TXT record(s) as domain_dns_records(owner=acme_challenge,pending)
// 3. DNS worker sync
// 4. Poll every 40s up to 10 times: check record exists in provider API and value match
// 5. Finalize -> cert pem/key
// 6. Insert certificates(provider from account, source=acme, renew_mode=auto)
// 7. Insert certificate_domains
// 8. Cleanup TXT records (insert delete/update desired-state)
// 9. Update certificate_requests(status=success,result_certificate_id)
func (s *ACMEService) RequestCertificate(req RequestCertificateRequest) (*RequestCertificateResponse, error) {
// Get ACME account
var account models.ACMEAccount
if err := db.DB.Preload("Provider").First(&account, req.ACMEAccountID).Error; err != nil {
return nil, ErrACMEAccountNotFound
}

// Validate account status
if account.Status != "active" {
return nil, errors.New("acme account is not active")
}

// Create certificate request
domainsJSON, _ := json.Marshal(req.Domains)
certRequest := models.CertificateRequest{
ACMEAccountID:   req.ACMEAccountID,
DomainsJSON:     string(domainsJSON),
Status:          "pending",
PollIntervalSec: 40,
PollMaxAttempts: 10,
Attempts:        0,
}

if err := db.DB.Create(&certRequest).Error; err != nil {
return nil, fmt.Errorf("failed to create certificate request: %w", err)
}

// Start async processing
go s.processCertificateRequest(certRequest.ID)

return &RequestCertificateResponse{
RequestID: certRequest.ID,
Status:    "pending",
}, nil
}

// processCertificateRequest processes a certificate request asynchronously
func (s *ACMEService) processCertificateRequest(requestID int) {
// Get certificate request
var certRequest models.CertificateRequest
if err := db.DB.Preload("ACMEAccount.Provider").First(&certRequest, requestID).Error; err != nil {
s.updateRequestStatus(requestID, "failed", err.Error(), nil)
return
}

// Update status to running
db.DB.Model(&certRequest).Update("status", "running")

// Parse domains
var domains []string
if err := json.Unmarshal([]byte(certRequest.DomainsJSON), &domains); err != nil {
s.updateRequestStatus(requestID, "failed", "invalid domains json", nil)
return
}

// Get or create ACME user
user, err := s.getACMEUser(certRequest.ACMEAccount)
if err != nil {
s.updateRequestStatus(requestID, "failed", err.Error(), nil)
return
}

// Create lego config
config := lego.NewConfig(user)
config.CADirURL = certRequest.ACMEAccount.Provider.DirectoryURL
config.Certificate.KeyType = certcrypto.RSA2048

// Create lego client
client, err := lego.NewClient(config)
if err != nil {
s.updateRequestStatus(requestID, "failed", fmt.Sprintf("failed to create lego client: %v", err), nil)
return
}

// Set DNS provider (custom implementation)
provider := &CustomDNSProvider{
dnsRecordService: s.dnsRecordService,
requestID:        requestID,
}
if err := client.Challenge.SetDNS01Provider(provider); err != nil {
s.updateRequestStatus(requestID, "failed", fmt.Sprintf("failed to set dns provider: %v", err), nil)
return
}

// Request certificate
request := certificate.ObtainRequest{
Domains: domains,
Bundle:  true,
}

certificates, err := client.Certificate.Obtain(request)
if err != nil {
s.updateRequestStatus(requestID, "failed", fmt.Sprintf("failed to obtain certificate: %v", err), nil)
return
}

// Parse certificate to get details
block, _ := pem.Decode(certificates.Certificate)
if block == nil {
s.updateRequestStatus(requestID, "failed", "failed to decode certificate pem", nil)
return
}

cert, err := x509.ParseCertificate(block.Bytes)
if err != nil {
s.updateRequestStatus(requestID, "failed", fmt.Sprintf("failed to parse certificate: %v", err), nil)
return
}

// Compute fingerprint
hash := sha256.Sum256(cert.Raw)
fingerprint := hex.EncodeToString(hash[:])

// Begin transaction
tx := db.DB.Begin()
defer func() {
if r := recover(); r != nil {
tx.Rollback()
}
}()

// Insert certificate
certificate := models.Certificate{
Provider:       certRequest.ACMEAccount.Provider.Name,
Source:         "acme",
ACMEAccountID:  &certRequest.ACMEAccountID,
Status:         "valid",
IssueAt:        &cert.NotBefore,
ExpireAt:       &cert.NotAfter,
Fingerprint:    fingerprint,
CertificatePEM: string(certificates.Certificate),
PrivateKeyPEM:  string(certificates.PrivateKey),
RenewMode:      "auto",
}

// Calculate renew time (30 days before expiry)
renewAt := cert.NotAfter.Add(-30 * 24 * time.Hour)
certificate.RenewAt = &renewAt

if err := tx.Create(&certificate).Error; err != nil {
tx.Rollback()
s.updateRequestStatus(requestID, "failed", fmt.Sprintf("failed to create certificate: %v", err), nil)
return
}

// Insert certificate domains
for _, domain := range domains {
certDomain := models.CertificateDomain{
CertificateID: certificate.ID,
Domain:        domain,
}
if err := tx.Create(&certDomain).Error; err != nil {
tx.Rollback()
s.updateRequestStatus(requestID, "failed", fmt.Sprintf("failed to create certificate domain: %v", err), nil)
return
}
}

if err := tx.Commit().Error; err != nil {
s.updateRequestStatus(requestID, "failed", fmt.Sprintf("failed to commit transaction: %v", err), nil)
return
}

// Update request status
s.updateRequestStatus(requestID, "success", "", &certificate.ID)
}

// getACMEUser gets or creates an ACME user from account
func (s *ACMEService) getACMEUser(account *models.ACMEAccount) (*ACMEUser, error) {
// Parse private key
var privateKey crypto.PrivateKey
if account.PrivateKeyPEM != nil && *account.PrivateKeyPEM != "" {
block, _ := pem.Decode([]byte(*account.PrivateKeyPEM))
if block == nil {
return nil, errors.New("failed to decode private key pem")
}

key, err := x509.ParseECPrivateKey(block.Bytes)
if err != nil {
return nil, fmt.Errorf("failed to parse private key: %w", err)
}
privateKey = key
} else {
// Generate new private key
key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
if err != nil {
return nil, fmt.Errorf("failed to generate private key: %w", err)
}
privateKey = key

// Save private key to account
keyBytes, _ := x509.MarshalECPrivateKey(key)
keyPEM := pem.EncodeToMemory(&pem.Block{
Type:  "EC PRIVATE KEY",
Bytes: keyBytes,
})
keyPEMStr := string(keyPEM)
db.DB.Model(account).Update("private_key_pem", keyPEMStr)
}

// Parse registration
var reg *registration.Resource
if account.RegistrationURL != nil && *account.RegistrationURL != "" {
reg = &registration.Resource{
URI: *account.RegistrationURL,
}
}

return &ACMEUser{
Email:        account.Email,
Registration: reg,
key:          privateKey,
}, nil
}

// updateRequestStatus updates the status of a certificate request
func (s *ACMEService) updateRequestStatus(requestID int, status string, errorMsg string, certificateID *int) {
updates := map[string]interface{}{
"status": status,
}

if errorMsg != "" {
updates["last_error"] = errorMsg
}

if certificateID != nil {
updates["result_certificate_id"] = *certificateID
}

db.DB.Model(&models.CertificateRequest{}).Where("id = ?", requestID).Updates(updates)
}

// GetCertificateRequest returns a certificate request by ID
func (s *ACMEService) GetCertificateRequest(id int) (*models.CertificateRequest, error) {
var request models.CertificateRequest
if err := db.DB.Preload("ACMEAccount").Preload("ResultCertificate").First(&request, id).Error; err != nil {
return nil, ErrCertificateRequestNotFound
}

return &request, nil
}

// CustomDNSProvider implements the challenge.Provider interface for lego
type CustomDNSProvider struct {
dnsRecordService *DNSRecordService
requestID        int
}

// Present creates a TXT record to fulfill the dns-01 challenge
func (p *CustomDNSProvider) Present(domain, token, keyAuth string) error {
fqdn, value := dns01.GetRecord(domain, keyAuth)

// Create DNS TXT record
// Note: This is a simplified implementation
// In production, you would need to:
// 1. Find the zone for the domain
// 2. Create the TXT record via DNS provider API
// 3. Wait for DNS propagation

fmt.Printf("DNS-01 Challenge: Create TXT record for %s with value %s\n", fqdn, value)

// TODO: Implement actual DNS record creation via dnsRecordService
// This would involve:
// - Finding the appropriate zone
// - Creating a domain_dns_records entry with type=TXT, owner=acme_challenge
// - Waiting for dns_sync_worker to propagate the record

return nil
}

// CleanUp removes the TXT record after the challenge is complete
func (p *CustomDNSProvider) CleanUp(domain, token, keyAuth string) error {
fqdn, _ := dns01.GetRecord(domain, keyAuth)

fmt.Printf("DNS-01 Challenge: Clean up TXT record for %s\n", fqdn)

// TODO: Implement actual DNS record cleanup

return nil
}

// Timeout returns the timeout for the DNS challenge
func (p *CustomDNSProvider) Timeout() (timeout, interval time.Duration) {
return 120 * time.Second, 2 * time.Second
}
