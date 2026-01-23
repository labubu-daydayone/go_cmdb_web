package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

"github.com/labubu-daydayone/go_cmdb_web/backend/internal/database"
"github.com/labubu-daydayone/go_cmdb_web/backend/internal/models"
"github.com/labubu-daydayone/go_cmdb_web/backend/internal/utils"
"gorm.io/gorm"
)

var (
ErrWebsiteNotFound        = errors.New("website not found")
ErrLineGroupNotFound      = errors.New("line group not found")
ErrInvalidOriginMode      = errors.New("invalid origin mode")
ErrOriginGroupRequired    = errors.New("origin_group_id required when mode=group")
ErrOriginAddressesRequired = errors.New("origin_addresses required when mode=manual")
ErrNoPrimaryDomain        = errors.New("at least one primary domain required")
)

type WebsiteService struct {
domainService        *DomainService
configVersionService *ConfigVersionService
dnsRecordService     *DNSRecordService
lineGroupService     *LineGroupService
originService        *OriginService
}

func NewWebsiteService() *WebsiteService {
	configVersionService := NewConfigVersionService()
	domainService := NewDomainService()
	return &WebsiteService{
		domainService:        domainService,
		configVersionService: configVersionService,
dnsRecordService:     NewDNSRecordService(NewDomainService()),
lineGroupService:     NewLineGroupService(NewConfigVersionService()),
originService:        NewOriginService(NewConfigVersionService()),
}
}

// CreateWebsiteRequest represents request to create a website
type CreateWebsiteRequest struct {
Name            string                        `json:"name" binding:"required"`
LineGroupID     int                           `json:"line_group_id" binding:"required"`
OriginMode      string                        `json:"origin_mode" binding:"required,oneof=group manual redirect"`
OriginGroupID   *int                          `json:"origin_group_id"`
OriginAddresses []CreateOriginAddressRequest  `json:"origin_addresses"`
RedirectURL     *string                       `json:"redirect_url"`
RedirectCode    *int                          `json:"redirect_status_code"`
CacheRuleID     *int                          `json:"cache_rule_id"`
Domains         []CreateWebsiteDomainRequest  `json:"domains" binding:"required,min=1"`
HTTPSConfig     *CreateWebsiteHTTPSRequest    `json:"https_config"`
Atomic          bool                          `json:"atomic"`
}

type CreateOriginAddressRequest struct {
Role     string `json:"role" binding:"required,oneof=primary backup"`
Protocol string `json:"protocol" binding:"required,oneof=http https"`
Address  string `json:"address" binding:"required"`
Weight   int    `json:"weight" binding:"required,min=1"`
Enabled  bool   `json:"enabled"`
}

type CreateWebsiteDomainRequest struct {
Domain    string `json:"domain" binding:"required"`
IsPrimary bool   `json:"is_primary"`
}

type CreateWebsiteHTTPSRequest struct {
Enabled       bool   `json:"enabled"`
ForceRedirect bool   `json:"force_redirect"`
HSTS          bool   `json:"hsts"`
CertMode      string `json:"cert_mode" binding:"oneof=select acme"`
CertificateID *int   `json:"certificate_id"`
}

// CreateWebsiteResponse represents response after creating a website
type CreateWebsiteResponse struct {
WebsiteID      int      `json:"website_id"`
DomainsCreated int      `json:"domains_created"`
DomainsFailed  int      `json:"domains_failed"`
FailedDomains  []string `json:"failed_domains"`
}

// CreateWebsite creates a new website (WF-03 workflow)
func (s *WebsiteService) CreateWebsite(req CreateWebsiteRequest) (*CreateWebsiteResponse, error) {
db := database.DB

// Validate origin mode
if req.OriginMode == "group" && req.OriginGroupID == nil {
return nil, ErrOriginGroupRequired
}
if req.OriginMode == "manual" && len(req.OriginAddresses) == 0 {
return nil, ErrOriginAddressesRequired
}

// Validate at least one primary domain
hasPrimary := false
for _, d := range req.Domains {
if d.IsPrimary {
hasPrimary = true
break
}
}
if !hasPrimary {
return nil, ErrNoPrimaryDomain
}

// Get line group to get CNAME
lineGroup, err := s.lineGroupService.GetLineGroup(*&req.LineGroupID)
if err != nil {
return nil, ErrLineGroupNotFound
}

response := &CreateWebsiteResponse{
FailedDomains: []string{},
}

err = db.Transaction(func(tx *gorm.DB) error {
var originSetID int

// Step 1: Create origin_set if needed
if req.OriginMode == "group" || req.OriginMode == "manual" {
originSet := &models.OriginSet{
Source:        req.OriginMode,
OriginGroupID: 0,
}

if req.OriginMode == "group" {
originSet.OriginGroupID = *req.OriginGroupID
}

if err := tx.Create(originSet).Error; err != nil {
return fmt.Errorf("failed to create origin_set: %w", err)
}
originSetID = originSet.ID

// Create origin_addresses
var addresses []models.OriginAddress
if req.OriginMode == "group" {
// Copy from origin_group_addresses
var groupAddresses []models.OriginGroupAddress
if err := tx.Where("origin_group_id = ?", *req.OriginGroupID).Find(&groupAddresses).Error; err != nil {
return fmt.Errorf("failed to get origin group addresses: %w", err)
}
for _, ga := range groupAddresses {
addresses = append(addresses, models.OriginAddress{
OriginSetID: originSetID,
Role:        ga.Role,
Protocol:    ga.Protocol,
Address:     ga.Address,
Weight:      ga.Weight,
Enabled:     ga.Enabled,
})
}
} else {
// Manual mode: use provided addresses
for _, addr := range req.OriginAddresses {
addresses = append(addresses, models.OriginAddress{
OriginSetID: originSetID,
Role:        addr.Role,
Protocol:    addr.Protocol,
Address:     addr.Address,
Weight:      addr.Weight,
Enabled:     addr.Enabled,
})
}
}

if len(addresses) > 0 {
if err := tx.Create(&addresses).Error; err != nil {
return fmt.Errorf("failed to create origin addresses: %w", err)
}
}
}

// Step 2: Create website
website := &models.Website{
LineGroupID:        req.LineGroupID,
CacheRuleID:        req.CacheRuleID,
OriginMode:         req.OriginMode,
OriginGroupID:      0,
OriginSetID:        originSetID,
RedirectURL:        req.RedirectURL,
RedirectStatusCode: req.RedirectCode,
Status:             "active",
}

if req.OriginGroupID != nil {
website.OriginGroupID = *req.OriginGroupID
}

if err := tx.Create(website).Error; err != nil {
return fmt.Errorf("failed to create website: %w", err)
}
response.WebsiteID = website.ID

// Step 3: Create website_https
httpsConfig := &models.WebsiteHTTPS{
WebsiteID:     website.ID,
Enabled:       false,
ForceRedirect: false,
HSTS:          false,
CertMode:      "select",
}

if req.HTTPSConfig != nil {
httpsConfig.Enabled = req.HTTPSConfig.Enabled
httpsConfig.ForceRedirect = req.HTTPSConfig.ForceRedirect
httpsConfig.HSTS = req.HTTPSConfig.HSTS
if req.HTTPSConfig.CertMode != "" {
httpsConfig.CertMode = req.HTTPSConfig.CertMode
}
httpsConfig.CertificateID = req.HTTPSConfig.CertificateID
}

if err := tx.Create(httpsConfig).Error; err != nil {
return fmt.Errorf("failed to create website_https: %w", err)
}

// Step 4: Create website_domains and DNS records
for _, domainReq := range req.Domains {
// Check if domain already exists
var existingDomain models.WebsiteDomain
err := tx.Where("domain = ?", domainReq.Domain).First(&existingDomain).Error
if err == nil {
// Domain exists
response.DomainsFailed++
response.FailedDomains = append(response.FailedDomains, domainReq.Domain)
if req.Atomic {
return fmt.Errorf("domain %s already exists", domainReq.Domain)
}
continue
}

// Create website_domain
websiteDomain := &models.WebsiteDomain{
WebsiteID: website.ID,
Domain:    domainReq.Domain,
IsPrimary: domainReq.IsPrimary,
CNAME:     &lineGroup.CNAME,
}

if err := tx.Create(websiteDomain).Error; err != nil {
response.DomainsFailed++
response.FailedDomains = append(response.FailedDomains, domainReq.Domain)
if req.Atomic {
return fmt.Errorf("failed to create website_domain for %s: %w", domainReq.Domain, err)
}
continue
}

// Find domain_id for DNS record
var domain models.Domain
fqdn := domainReq.Domain
			zoneName, err := s.findZoneForFQDN(tx, fqdn)
if err != nil {
response.DomainsFailed++
response.FailedDomains = append(response.FailedDomains, domainReq.Domain)
if req.Atomic {
return fmt.Errorf("failed to find zone for %s: %w", fqdn, err)
}
continue
}

if err := tx.Where("domain = ?", zoneName).First(&domain).Error; err != nil {
response.DomainsFailed++
response.FailedDomains = append(response.FailedDomains, domainReq.Domain)
if req.Atomic {
return fmt.Errorf("failed to find domain for zone %s: %w", zoneName, err)
}
continue
}

// Calculate relative name
relativeName := utils.CalculateRelativeName(fqdn, zoneName)

// Create DNS CNAME record (pending)
			dnsRecord := &models.DomainDNSRecord{
DomainID:  domain.ID,
Type:      "CNAME",
Name:      relativeName,
Value:     lineGroup.CNAME,
TTL:       120,
Proxied:   false,
Status:    "pending",
OwnerType: "website_domain",
OwnerID:   websiteDomain.ID,
}

if err := tx.Create(dnsRecord).Error; err != nil {
response.DomainsFailed++
response.FailedDomains = append(response.FailedDomains, domainReq.Domain)
if req.Atomic {
return fmt.Errorf("failed to create DNS record for %s: %w", fqdn, err)
}
continue
}

response.DomainsCreated++
}

// Step 5: Bump config version
if err := s.configVersionService.BumpVersion(tx, fmt.Sprintf("website:create:%s", req.Name)); err != nil {
return fmt.Errorf("failed to bump config version: %w", err)
}

return nil
})

if err != nil {
return nil, err
}

return response, nil
}

// ListWebsites returns all websites with pagination
func (s *WebsiteService) ListWebsites(page, pageSize int, status string) ([]models.Website, int64, error) {
var websites []models.Website
var total int64

query := database.DB.Model(&models.Website{})

if status != "" {
query = query.Where("status = ?", status)
}

if err := query.Count(&total).Error; err != nil {
return nil, 0, err
}

offset := (page - 1) * pageSize
if err := query.Preload("LineGroup").Preload("CacheRule").Preload("OriginGroup").
Offset(offset).Limit(pageSize).Find(&websites).Error; err != nil {
return nil, 0, err
}

return websites, total, nil
}

// GetWebsite returns a website by ID with all relations
func (s *WebsiteService) GetWebsite(id int) (*models.Website, error) {
var website models.Website
if err := database.DB.Preload("LineGroup").Preload("CacheRule").
Preload("OriginGroup").Preload("OriginSet").
First(&website, id).Error; err != nil {
if errors.Is(err, gorm.ErrRecordNotFound) {
return nil, ErrWebsiteNotFound
}
return nil, err
}
return &website, nil
}

// GetWebsiteDomains returns all domains for a website
func (s *WebsiteService) GetWebsiteDomains(websiteID int) ([]models.WebsiteDomain, error) {
var domains []models.WebsiteDomain
if err := database.DB.Where("website_id = ?", websiteID).Find(&domains).Error; err != nil {
return nil, err
}
return domains, nil
}

// GetWebsiteHTTPS returns HTTPS config for a website
func (s *WebsiteService) GetWebsiteHTTPS(websiteID int) (*models.WebsiteHTTPS, error) {
var https models.WebsiteHTTPS
if err := database.DB.Where("website_id = ?", websiteID).First(&https).Error; err != nil {
if errors.Is(err, gorm.ErrRecordNotFound) {
return nil, errors.New("website HTTPS config not found")
}
return nil, err
}
return &https, nil
}

// UpdateWebsiteRequest represents request to update a website
type UpdateWebsiteRequest struct {
Name            *string                       `json:"name"`
LineGroupID     *int                          `json:"line_group_id"`
OriginMode      *string                       `json:"origin_mode"`
OriginGroupID   *int                          `json:"origin_group_id"`
OriginAddresses []CreateOriginAddressRequest  `json:"origin_addresses"`
RedirectURL     *string                       `json:"redirect_url"`
RedirectCode    *int                          `json:"redirect_status_code"`
CacheRuleID     *int                          `json:"cache_rule_id"`
Status          *string                       `json:"status"`
HTTPSConfig     *UpdateWebsiteHTTPSRequest    `json:"https_config"`
}

type UpdateWebsiteHTTPSRequest struct {
Enabled       *bool   `json:"enabled"`
ForceRedirect *bool   `json:"force_redirect"`
HSTS          *bool   `json:"hsts"`
CertMode      *string `json:"cert_mode"`
CertificateID *int    `json:"certificate_id"`
}

// UpdateWebsite updates a website configuration
func (s *WebsiteService) UpdateWebsite(id int, req UpdateWebsiteRequest) error {
db := database.DB

// Check if website exists
var website models.Website
if err := db.First(&website, id).Error; err != nil {
if errors.Is(err, gorm.ErrRecordNotFound) {
return ErrWebsiteNotFound
}
return err
}

return db.Transaction(func(tx *gorm.DB) error {
needsBump := false

// Update basic fields
updates := make(map[string]interface{})
if req.Status != nil {
updates["status"] = *req.Status
needsBump = true
}
if req.CacheRuleID != nil {
updates["cache_rule_id"] = *req.CacheRuleID
needsBump = true
}
if req.RedirectURL != nil {
updates["redirect_url"] = *req.RedirectURL
needsBump = true
}
if req.RedirectCode != nil {
updates["redirect_status_code"] = *req.RedirectCode
needsBump = true
}

if len(updates) > 0 {
if err := tx.Model(&website).Updates(updates).Error; err != nil {
return err
}
}

// Handle line group update (WF-04)
if req.LineGroupID != nil && *req.LineGroupID != website.LineGroupID {
if err := s.updateLineGroup(tx, id, *req.LineGroupID); err != nil {
return err
}
needsBump = true
}

// Handle origin update (WF-05)
if req.OriginMode != nil || req.OriginGroupID != nil || len(req.OriginAddresses) > 0 {
originMode := website.OriginMode
if req.OriginMode != nil {
originMode = *req.OriginMode
}

originGroupID := website.OriginGroupID
if req.OriginGroupID != nil {
originGroupID = *req.OriginGroupID
}

if err := s.updateOrigin(tx, id, originMode, originGroupID, req.OriginAddresses); err != nil {
return err
}
needsBump = true
}

// Update HTTPS config
if req.HTTPSConfig != nil {
var httpsConfig models.WebsiteHTTPS
if err := tx.Where("website_id = ?", id).First(&httpsConfig).Error; err != nil {
return err
}

httpsUpdates := make(map[string]interface{})
if req.HTTPSConfig.Enabled != nil {
httpsUpdates["enabled"] = *req.HTTPSConfig.Enabled
}
if req.HTTPSConfig.ForceRedirect != nil {
httpsUpdates["force_redirect"] = *req.HTTPSConfig.ForceRedirect
}
if req.HTTPSConfig.HSTS != nil {
httpsUpdates["hsts"] = *req.HTTPSConfig.HSTS
}
if req.HTTPSConfig.CertMode != nil {
httpsUpdates["cert_mode"] = *req.HTTPSConfig.CertMode
}
if req.HTTPSConfig.CertificateID != nil {
httpsUpdates["certificate_id"] = *req.HTTPSConfig.CertificateID
}

if len(httpsUpdates) > 0 {
if err := tx.Model(&httpsConfig).Updates(httpsUpdates).Error; err != nil {
return err
}
needsBump = true
}
}

// Bump config version if needed
if needsBump {
if err := s.configVersionService.BumpVersion(tx, fmt.Sprintf("website:update:%d", id)); err != nil {
return err
}
}

return nil
})
}

// updateLineGroup implements WF-04 workflow
func (s *WebsiteService) updateLineGroup(tx *gorm.DB, websiteID, lineGroupID int) error {
// Get line group to get new CNAME
lineGroup, err := s.lineGroupService.GetLineGroup(lineGroupID)
if err != nil {
return ErrLineGroupNotFound
}

// Step 1: Update website.line_group_id
if err := tx.Model(&models.Website{}).Where("id = ?", websiteID).
Update("line_group_id", lineGroupID).Error; err != nil {
return err
}

// Step 2: Update website_domains.cname
if err := tx.Model(&models.WebsiteDomain{}).Where("website_id = ?", websiteID).
Update("cname", lineGroup.CNAME).Error; err != nil {
return err
}

// Step 3: Create new DNS CNAME records (pending) for each domain
var domains []models.WebsiteDomain
if err := tx.Where("website_id = ?", websiteID).Find(&domains).Error; err != nil {
return err
}

for _, domain := range domains {
// Find zone for this domain
var domainRecord models.Domain
		zoneName, err := s.findZoneForFQDN(tx, domain.Domain)
if err != nil {
continue
}

if err := tx.Where("domain = ?", zoneName).First(&domainRecord).Error; err != nil {
continue
}

relativeName := utils.CalculateRelativeName(domain.Domain, zoneName)

// Create new DNS record (pending)
		dnsRecord := &models.DomainDNSRecord{
DomainID:  domainRecord.ID,
Type:      "CNAME",
Name:      relativeName,
Value:     lineGroup.CNAME,
TTL:       120,
Proxied:   false,
Status:    "pending",
OwnerType: "website_domain",
OwnerID:   domain.ID,
}

if err := tx.Create(dnsRecord).Error; err != nil {
return err
}
}

return nil
}

// updateOrigin implements WF-05 workflow
func (s *WebsiteService) updateOrigin(tx *gorm.DB, websiteID int, originMode string, originGroupID int, addresses []CreateOriginAddressRequest) error {
// Step 1: Create new origin_set
originSet := &models.OriginSet{
Source:        originMode,
OriginGroupID: 0,
}

if originMode == "group" {
originSet.OriginGroupID = originGroupID
}

if err := tx.Create(originSet).Error; err != nil {
return err
}

// Create origin_addresses
var originAddresses []models.OriginAddress
if originMode == "group" {
// Copy from origin_group_addresses
var groupAddresses []models.OriginGroupAddress
if err := tx.Where("origin_group_id = ?", originGroupID).Find(&groupAddresses).Error; err != nil {
return err
}
for _, ga := range groupAddresses {
originAddresses = append(originAddresses, models.OriginAddress{
OriginSetID: originSet.ID,
Role:        ga.Role,
Protocol:    ga.Protocol,
Address:     ga.Address,
Weight:      ga.Weight,
Enabled:     ga.Enabled,
})
}
} else if originMode == "manual" {
// Use provided addresses
for _, addr := range addresses {
originAddresses = append(originAddresses, models.OriginAddress{
OriginSetID: originSet.ID,
Role:        addr.Role,
Protocol:    addr.Protocol,
Address:     addr.Address,
Weight:      addr.Weight,
Enabled:     addr.Enabled,
})
}
}

if len(originAddresses) > 0 {
if err := tx.Create(&originAddresses).Error; err != nil {
return err
}
}

// Step 2: Update website
updates := map[string]interface{}{
"origin_mode":     originMode,
"origin_group_id": originGroupID,
"origin_set_id":   originSet.ID,
}

if err := tx.Model(&models.Website{}).Where("id = ?", websiteID).Updates(updates).Error; err != nil {
return err
}

return nil
}

// DeleteWebsite deletes a website
func (s *WebsiteService) DeleteWebsite(id int) error {
db := database.DB

// Check if website exists
var website models.Website
if err := db.First(&website, id).Error; err != nil {
if errors.Is(err, gorm.ErrRecordNotFound) {
return ErrWebsiteNotFound
}
return err
}

return db.Transaction(func(tx *gorm.DB) error {
// Step 1: Delete website_https
if err := tx.Where("website_id = ?", id).Delete(&models.WebsiteHTTPS{}).Error; err != nil {
return err
}

// Step 2: Delete website_domains and related DNS records
var domains []models.WebsiteDomain
if err := tx.Where("website_id = ?", id).Find(&domains).Error; err != nil {
return err
}

for _, domain := range domains {
// Delete DNS records
if err := tx.Where("owner_type = ? AND owner_id = ?", "website_domain", domain.ID).
			Delete(&models.DomainDNSRecord{}).Error; err != nil {
return err
}
}

if err := tx.Where("website_id = ?", id).Delete(&models.WebsiteDomain{}).Error; err != nil {
return err
}

// Step 3: Delete origin_set if exists
if website.OriginSetID > 0 {
// Delete origin_addresses first
if err := tx.Where("origin_set_id = ?", website.OriginSetID).
Delete(&models.OriginAddress{}).Error; err != nil {
return err
}

// Delete origin_set
if err := tx.Delete(&models.OriginSet{}, website.OriginSetID).Error; err != nil {
return err
}
}

// Step 4: Delete website
if err := tx.Delete(&models.Website{}, id).Error; err != nil {
return err
}

// Step 5: Bump config version
if err := s.configVersionService.BumpVersion(tx, fmt.Sprintf("website:delete:%d", id)); err != nil {
return err
}

return nil
})
}

// AddDomain adds a new domain to an existing website
func (s *WebsiteService) AddDomain(websiteID int, domain string, isPrimary bool) error {
db := database.DB

// Check if website exists
var website models.Website
if err := db.Preload("LineGroup").First(&website, websiteID).Error; err != nil {
if errors.Is(err, gorm.ErrRecordNotFound) {
return ErrWebsiteNotFound
}
return err
}

return db.Transaction(func(tx *gorm.DB) error {
// Check if domain already exists
var existing models.WebsiteDomain
if err := tx.Where("domain = ?", domain).First(&existing).Error; err == nil {
return ErrDomainAlreadyExists
}

// Get line group CNAME
var lineGroup models.LineGroup
if err := tx.First(&lineGroup, website.LineGroupID).Error; err != nil {
return ErrLineGroupNotFound
}

// Create website_domain
websiteDomain := &models.WebsiteDomain{
WebsiteID: websiteID,
Domain:    domain,
IsPrimary: isPrimary,
CNAME:     &lineGroup.CNAME,
}

if err := tx.Create(websiteDomain).Error; err != nil {
return err
}

// Find zone and create DNS record
var domainRecord models.Domain
		zoneName, err := s.findZoneForFQDN(tx, domain)
if err != nil {
return err
}

if err := tx.Where("domain = ?", zoneName).First(&domainRecord).Error; err != nil {
return err
}

relativeName := utils.CalculateRelativeName(domain, zoneName)

	dnsRecord := &models.DomainDNSRecord{
DomainID:  domainRecord.ID,
Type:      "CNAME",
Name:      relativeName,
Value:     lineGroup.CNAME,
TTL:       120,
Proxied:   false,
Status:    "pending",
OwnerType: "website_domain",
OwnerID:   websiteDomain.ID,
}

if err := tx.Create(dnsRecord).Error; err != nil {
return err
}

// Bump config version
if err := s.configVersionService.BumpVersion(tx, fmt.Sprintf("website:add_domain:%d", websiteID)); err != nil {
return err
}

return nil
})
}

// RemoveDomain removes a domain from a website
func (s *WebsiteService) RemoveDomain(websiteID int, domain string) error {
db := database.DB

return db.Transaction(func(tx *gorm.DB) error {
// Find domain
var websiteDomain models.WebsiteDomain
if err := tx.Where("website_id = ? AND domain = ?", websiteID, domain).First(&websiteDomain).Error; err != nil {
if errors.Is(err, gorm.ErrRecordNotFound) {
return errors.New("domain not found")
}
return err
}

// Delete DNS records
if err := tx.Where("owner_type = ? AND owner_id = ?", "website_domain", websiteDomain.ID).
		Delete(&models.DomainDNSRecord{}).Error; err != nil {
return err
}

// Delete domain
if err := tx.Delete(&websiteDomain).Error; err != nil {
return err
}

// Bump config version
if err := s.configVersionService.BumpVersion(tx, fmt.Sprintf("website:remove_domain:%d", websiteID)); err != nil {
return err
}

return nil
})
}

// ClearCacheRequest represents request to clear cache
type ClearCacheRequest struct {
WebsiteIDs []int    `json:"website_ids" binding:"required,min=1"`
Type       string   `json:"type" binding:"required,oneof=all url directory"`
Targets    []string `json:"targets"`
}

// ClearCache creates agent tasks to clear cache
func (s *WebsiteService) ClearCache(req ClearCacheRequest) error {
db := database.DB

// Validate targets for url/directory type
if (req.Type == "url" || req.Type == "directory") && len(req.Targets) == 0 {
return errors.New("targets required for url/directory type")
}

return db.Transaction(func(tx *gorm.DB) error {
// For each website, create agent tasks
for _, websiteID := range req.WebsiteIDs {
// Verify website exists
var website models.Website
if err := tx.First(&website, websiteID).Error; err != nil {
continue
}

		// Create agent task
		task := &models.AgentTask{
			NodeID:  0, // Will be assigned by task scheduler
			Type:    "purge_cache",
			Payload: fmt.Sprintf(`{"website_id":%d,"type":"%s","targets":%v}`, websiteID, req.Type, req.Targets),
			Status:  "pending",
		}

if err := tx.Create(task).Error; err != nil {
return err
}
}

return nil
})
}

// findZoneForFQDN finds the zone (domain) that contains the given FQDN
func (s *WebsiteService) findZoneForFQDN(tx *gorm.DB, fqdn string) (string, error) {
	fqdn = strings.TrimSuffix(fqdn, ".")
	
	// Try to find exact match first
	var domain models.Domain
	if err := tx.Where("domain = ?", fqdn).First(&domain).Error; err == nil {
		return domain.Domain, nil
	}
	
	// Try to find parent zones
	parts := strings.Split(fqdn, ".")
	for i := 1; i < len(parts); i++ {
		zone := strings.Join(parts[i:], ".")
		if err := tx.Where("domain = ?", zone).First(&domain).Error; err == nil {
			return domain.Domain, nil
		}
	}
	
	return "", errors.New("no zone found for FQDN: " + fqdn)
}
