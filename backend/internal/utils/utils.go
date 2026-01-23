package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"fmt"
	"math/big"
	"strings"
)

// GenerateCNAMEPrefix generates a random CNAME prefix
// Format: 8 random alphanumeric characters
func GenerateCNAMEPrefix() (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	const length = 8

	result := make([]byte, length)
	for i := range result {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", fmt.Errorf("failed to generate random prefix: %w", err)
		}
		result[i] = charset[num.Int64()]
	}

	return string(result), nil
}

// BuildCNAME builds full CNAME from prefix and zone
func BuildCNAME(prefix, zone string) string {
	return fmt.Sprintf("%s.%s", prefix, zone)
}

// ComputeCertificateFingerprint computes SHA256 fingerprint of certificate PEM
func ComputeCertificateFingerprint(certPEM string) (string, error) {
	block, _ := pem.Decode([]byte(certPEM))
	if block == nil {
		return "", fmt.Errorf("failed to decode PEM block")
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "", fmt.Errorf("failed to parse certificate: %w", err)
	}

	hash := sha256.Sum256(cert.Raw)
	return hex.EncodeToString(hash[:]), nil
}

// ExtractSANFromCertificate extracts Subject Alternative Names from certificate PEM
func ExtractSANFromCertificate(certPEM string) ([]string, error) {
	block, _ := pem.Decode([]byte(certPEM))
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block")
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse certificate: %w", err)
	}

	domains := make([]string, 0)

	// Add Common Name if present
	if cert.Subject.CommonName != "" {
		domains = append(domains, cert.Subject.CommonName)
	}

	// Add all SANs
	domains = append(domains, cert.DNSNames...)

	// Remove duplicates
	seen := make(map[string]bool)
	result := make([]string, 0)
	for _, domain := range domains {
		if !seen[domain] {
			seen[domain] = true
			result = append(result, domain)
		}
	}

	return result, nil
}

// CalculateRelativeName calculates relative DNS name from FQDN and zone
// R24: FQDN calculation rules
// - zone => @
// - www.zone => www
// - a.b.zone => a.b
func CalculateRelativeName(fqdn, zone string) (string, error) {
	// Ensure both are lowercase for comparison
	fqdn = strings.ToLower(strings.TrimSuffix(fqdn, "."))
	zone = strings.ToLower(strings.TrimSuffix(zone, "."))

	// R23: FQDN must belong to zone
	if fqdn == zone {
		return "@", nil
	}

	if !strings.HasSuffix(fqdn, "."+zone) {
		return "", fmt.Errorf("FQDN %s does not belong to zone %s", fqdn, zone)
	}

	// Remove zone suffix to get relative name
	relativeName := strings.TrimSuffix(fqdn, "."+zone)
	return relativeName, nil
}

// ValidateDomainCoverage validates if all domains are covered by certificate domains
// Supports wildcard matching (*.example.com covers a.example.com)
func ValidateDomainCoverage(domains []string, certDomains []string) bool {
	for _, domain := range domains {
		if !isDomainCovered(domain, certDomains) {
			return false
		}
	}
	return true
}

// isDomainCovered checks if a domain is covered by any certificate domain
func isDomainCovered(domain string, certDomains []string) bool {
	domain = strings.ToLower(domain)

	for _, certDomain := range certDomains {
		certDomain = strings.ToLower(certDomain)

		// Exact match
		if domain == certDomain {
			return true
		}

		// Wildcard match (*.example.com covers a.example.com but not example.com)
		if strings.HasPrefix(certDomain, "*.") {
			wildcardBase := certDomain[2:] // Remove "*."
			if strings.HasSuffix(domain, "."+wildcardBase) {
				// Ensure it's a single-level subdomain
				prefix := strings.TrimSuffix(domain, "."+wildcardBase)
				if !strings.Contains(prefix, ".") {
					return true
				}
			}
		}
	}

	return false
}

// HashPassword hashes a password using SHA256 (for simplicity, use bcrypt in production)
func HashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// VerifyPassword verifies if password matches hash
func VerifyPassword(password, hash string) bool {
	return HashPassword(password) == hash
}
