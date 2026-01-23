package service

import (
	"github.com/labubu-daydayone/go_cmdb_web/backend/internal/database"
	"github.com/labubu-daydayone/go_cmdb_web/backend/internal/models"
)

// AgentService handles agent-related operations
type AgentService struct {
	certificateService *CertificateService
}

// NewAgentService creates a new agent service
func NewAgentService() *AgentService {
	return &AgentService{
		certificateService: NewCertificateService(),
	}
}

// CertificateListResponse represents a certificate in the agent response
type CertificateListResponse struct {
	ID             int      `json:"id"`
	Provider       string   `json:"provider"`
	Source         string   `json:"source"`
	Status         string   `json:"status"`
	IssueAt        *string  `json:"issue_at"`
	ExpireAt       *string  `json:"expire_at"`
	Fingerprint    string   `json:"fingerprint"`
	Domains        []string `json:"domains"`
	RenewMode      string   `json:"renew_mode"`
	RenewAt        *string  `json:"renew_at"`
}

// CertificateDetailResponse represents detailed certificate information for agent
type CertificateDetailResponse struct {
	ID             int      `json:"id"`
	Provider       string   `json:"provider"`
	Source         string   `json:"source"`
	Status         string   `json:"status"`
	IssueAt        *string  `json:"issue_at"`
	ExpireAt       *string  `json:"expire_at"`
	Fingerprint    string   `json:"fingerprint"`
	CertificatePEM string   `json:"certificate_pem"`
	PrivateKeyPEM  string   `json:"private_key_pem"`
	Domains        []string `json:"domains"`
	RenewMode      string   `json:"renew_mode"`
	RenewAt        *string  `json:"renew_at"`
}

// GetAllCertificates returns all certificates for agent (R18: no node-based filtering)
func (s *AgentService) GetAllCertificates() ([]CertificateListResponse, error) {
	var certificates []models.Certificate
	
	// Get all certificates (R18: Agent can pull all CDN certificates)
	if err := database.DB.Order("id DESC").Find(&certificates).Error; err != nil {
		return nil, err
	}

	// Build response with domains
	result := make([]CertificateListResponse, 0, len(certificates))
	for _, cert := range certificates {
		// Get domains for this certificate
		var certDomains []models.CertificateDomain
		if err := database.DB.Where("certificate_id = ?", cert.ID).Find(&certDomains).Error; err != nil {
			return nil, err
		}

		domains := make([]string, 0, len(certDomains))
		for _, cd := range certDomains {
			domains = append(domains, cd.Domain)
		}

		// Format timestamps
		var issueAt, expireAt, renewAt *string
		if cert.IssueAt != nil {
			ts := cert.IssueAt.Format("2006-01-02T15:04:05Z")
			issueAt = &ts
		}
		if cert.ExpireAt != nil {
			ts := cert.ExpireAt.Format("2006-01-02T15:04:05Z")
			expireAt = &ts
		}
		if cert.RenewAt != nil {
			ts := cert.RenewAt.Format("2006-01-02T15:04:05Z")
			renewAt = &ts
		}

		result = append(result, CertificateListResponse{
			ID:          cert.ID,
			Provider:    cert.Provider,
			Source:      cert.Source,
			Status:      cert.Status,
			IssueAt:     issueAt,
			ExpireAt:    expireAt,
			Fingerprint: cert.Fingerprint,
			Domains:     domains,
			RenewMode:   cert.RenewMode,
			RenewAt:     renewAt,
		})
	}

	return result, nil
}

// GetCertificateByID returns detailed certificate information including PEM data
func (s *AgentService) GetCertificateByID(id int) (*CertificateDetailResponse, error) {
	var cert models.Certificate
	if err := database.DB.First(&cert, id).Error; err != nil {
		return nil, ErrCertificateNotFound
	}

	// Get domains for this certificate
	var certDomains []models.CertificateDomain
	if err := database.DB.Where("certificate_id = ?", cert.ID).Find(&certDomains).Error; err != nil {
		return nil, err
	}

	domains := make([]string, 0, len(certDomains))
	for _, cd := range certDomains {
		domains = append(domains, cd.Domain)
	}

	// Format timestamps
	var issueAt, expireAt, renewAt *string
	if cert.IssueAt != nil {
		ts := cert.IssueAt.Format("2006-01-02T15:04:05Z")
		issueAt = &ts
	}
	if cert.ExpireAt != nil {
		ts := cert.ExpireAt.Format("2006-01-02T15:04:05Z")
		expireAt = &ts
	}
	if cert.RenewAt != nil {
		ts := cert.RenewAt.Format("2006-01-02T15:04:05Z")
		renewAt = &ts
	}

	// Add GetConfig method here
	return &CertificateDetailResponse{
		ID:             cert.ID,
		Provider:       cert.Provider,
		Source:         cert.Source,
		Status:         cert.Status,
		IssueAt:        issueAt,
		ExpireAt:       expireAt,
		Fingerprint:    cert.Fingerprint,
		CertificatePEM: cert.CertificatePEM,
		PrivateKeyPEM:  cert.PrivateKeyPEM,
		Domains:        domains,
		RenewMode:      cert.RenewMode,
		RenewAt:        renewAt,
	}, nil
}

// AgentConfigResponse represents the complete configuration for an agent node
type AgentConfigResponse struct {
	Version       int                        `json:"version"`
	Websites      []WebsiteConfig            `json:"websites"`
	NodeGroups    []NodeGroupConfig          `json:"node_groups"`
	LineGroups    []LineGroupConfig          `json:"line_groups"`
}

type WebsiteConfig struct {
	ID          int                  `json:"id"`
	Domains     []string             `json:"domains"`
	OriginSet   OriginSetConfig      `json:"origin_set"`
	HTTPS       WebsiteHTTPSConfig   `json:"https"`
	CacheRules  []CacheRuleConfig    `json:"cache_rules"`
}

type OriginSetConfig struct {
	ID        int              `json:"id"`
	Addresses []OriginAddress  `json:"addresses"`
}

type OriginAddress struct {
	Address  string `json:"address"`
	Port     int    `json:"port"`
	Weight   int    `json:"weight"`
	Priority int    `json:"priority"`
}

type WebsiteHTTPSConfig struct {
	Enabled       bool   `json:"enabled"`
	ForceHTTPS    bool   `json:"force_https"`
	CertificateID *int   `json:"certificate_id"`
}

type CacheRuleConfig struct {
	ID       int              `json:"id"`
	Name     string           `json:"name"`
	Priority int              `json:"priority"`
	Items    []CacheRuleItem  `json:"items"`
}

type CacheRuleItem struct {
	MatchType  string `json:"match_type"`
	MatchValue string `json:"match_value"`
	CacheTTL   int    `json:"cache_ttl"`
}

type NodeGroupConfig struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	CNAME       string   `json:"cname"`
	SubIPs      []string `json:"sub_ips"`
}

type LineGroupConfig struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	CNAME       string `json:"cname"`
	NodeGroupID int    `json:"node_group_id"`
}

// GetConfig returns the complete CDN configuration for the agent
func (s *AgentService) GetConfig() (*AgentConfigResponse, error) {
	// Get current config version
	var configVersion models.ConfigVersion
	if err := database.DB.Order("id DESC").First(&configVersion).Error; err != nil {
		return nil, err
	}

	// Get all websites with related data
	var websites []models.Website
	if err := database.DB.Find(&websites).Error; err != nil {
		return nil, err
	}

	websiteConfigs := make([]WebsiteConfig, 0, len(websites))
	for _, website := range websites {
		// Get domains
		var websiteDomains []models.WebsiteDomain
		if err := database.DB.Where("website_id = ?", website.ID).Find(&websiteDomains).Error; err != nil {
			return nil, err
		}

		domains := make([]string, 0, len(websiteDomains))
		for _, wd := range websiteDomains {
			domains = append(domains, wd.Domain)
		}

		// Get origin set
		var originSet models.OriginSet
		if err := database.DB.First(&originSet, website.OriginSetID).Error; err != nil {
			return nil, err
		}

		var originAddresses []models.OriginAddress
		if err := database.DB.Where("origin_set_id = ?", originSet.ID).Find(&originAddresses).Error; err != nil {
			return nil, err
		}

		addresses := make([]OriginAddress, 0, len(originAddresses))
		for _, oa := range originAddresses {
			addresses = append(addresses, OriginAddress{
				Address:  oa.Address,
				Port:     oa.Port,
				Weight:   oa.Weight,
				Priority: oa.Priority,
			})
		}

		// Get HTTPS config
		var websiteHTTPS models.WebsiteHTTPS
		if err := database.DB.Where("website_id = ?", website.ID).First(&websiteHTTPS).Error; err != nil {
			return nil, err
		}

		// Get cache rules
		var cacheRules []models.CacheRule
		if err := database.DB.Where("id IN (?)", database.DB.Table("cache_rules").Select("id")).Find(&cacheRules).Error; err != nil {
			return nil, err
		}

		cacheRuleConfigs := make([]CacheRuleConfig, 0, len(cacheRules))
		for _, cr := range cacheRules {
			var cacheRuleItems []models.CacheRuleItem
			if err := database.DB.Where("cache_rule_id = ?", cr.ID).Find(&cacheRuleItems).Error; err != nil {
				return nil, err
			}

			items := make([]CacheRuleItem, 0, len(cacheRuleItems))
			for _, cri := range cacheRuleItems {
				items = append(items, CacheRuleItem{
					MatchType:  cri.MatchType,
					MatchValue: cri.MatchValue,
					CacheTTL:   cri.CacheTTL,
				})
			}

			cacheRuleConfigs = append(cacheRuleConfigs, CacheRuleConfig{
				ID:       cr.ID,
				Name:     cr.Name,
				Priority: cr.Priority,
				Items:    items,
			})
		}

		websiteConfigs = append(websiteConfigs, WebsiteConfig{
			ID:      website.ID,
			Domains: domains,
			OriginSet: OriginSetConfig{
				ID:        originSet.ID,
				Addresses: addresses,
			},
			HTTPS: WebsiteHTTPSConfig{
				Enabled:       websiteHTTPS.Enabled,
				ForceHTTPS:    websiteHTTPS.ForceHTTPS,
				CertificateID: websiteHTTPS.CertificateID,
			},
			CacheRules: cacheRuleConfigs,
		})
	}

	// Get all node groups
	var nodeGroups []models.NodeGroup
	if err := database.DB.Find(&nodeGroups).Error; err != nil {
		return nil, err
	}

	nodeGroupConfigs := make([]NodeGroupConfig, 0, len(nodeGroups))
	for _, ng := range nodeGroups {
		// Get sub IPs
		var nodeGroupSubIPs []models.NodeGroupSubIP
		if err := database.DB.Where("node_group_id = ?", ng.ID).Find(&nodeGroupSubIPs).Error; err != nil {
			return nil, err
		}

		subIPs := make([]string, 0, len(nodeGroupSubIPs))
		for _, ngsi := range nodeGroupSubIPs {
			// Get sub IP address
			var subIP models.NodeSubIP
			if err := database.DB.First(&subIP, ngsi.SubIPID).Error; err != nil {
				continue
			}
			subIPs = append(subIPs, subIP.IP)
		}

		nodeGroupConfigs = append(nodeGroupConfigs, NodeGroupConfig{
			ID:     ng.ID,
			Name:   ng.Name,
			CNAME:  ng.CNAME,
			SubIPs: subIPs,
		})
	}

	// Get all line groups
	var lineGroups []models.LineGroup
	if err := database.DB.Find(&lineGroups).Error; err != nil {
		return nil, err
	}

	lineGroupConfigs := make([]LineGroupConfig, 0, len(lineGroups))
	for _, lg := range lineGroups {
		lineGroupConfigs = append(lineGroupConfigs, LineGroupConfig{
			ID:          lg.ID,
			Name:        lg.Name,
			CNAME:       lg.CNAME,
			NodeGroupID: lg.NodeGroupID,
		})
	}

	return &AgentConfigResponse{
		Version:    configVersion.Version,
		Websites:   websiteConfigs,
		NodeGroups: nodeGroupConfigs,
		LineGroups: lineGroupConfigs,
	}, nil
}
