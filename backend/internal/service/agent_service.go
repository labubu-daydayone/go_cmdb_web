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
