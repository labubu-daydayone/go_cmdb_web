package utils

import (
	"strings"
)

// ValidateFQDN validates if a FQDN belongs to a zone (R23 rule)
// Example:
//   - ValidateFQDN("example.com", "example.com") => true
//   - ValidateFQDN("www.example.com", "example.com") => true
//   - ValidateFQDN("example.org", "example.com") => false
func ValidateFQDN(fqdn string, zone string) bool {
	fqdn = strings.TrimSuffix(fqdn, ".")
	zone = strings.TrimSuffix(zone, ".")

	// Exact match
	if fqdn == zone {
		return true
	}

	// Subdomain match
	return strings.HasSuffix(fqdn, "."+zone)
}

// CalculateRelativeName calculates relative DNS name from FQDN and zone (R24 rule)
// Example:
//   - CalculateRelativeName("example.com", "example.com") => "@"
//   - CalculateRelativeName("www.example.com", "example.com") => "www"
//   - CalculateRelativeName("a.b.example.com", "example.com") => "a.b"
func CalculateRelativeName(fqdn string, zone string) string {
	fqdn = strings.TrimSuffix(fqdn, ".")
	zone = strings.TrimSuffix(zone, ".")

	// zone => @
	if fqdn == zone {
		return "@"
	}

	// www.zone => www
	// a.b.zone => a.b
	if strings.HasSuffix(fqdn, "."+zone) {
		return strings.TrimSuffix(fqdn, "."+zone)
	}

	return fqdn
}

// CalculateFQDN calculates full FQDN from relative name and zone
// Example:
//   - CalculateFQDN("@", "example.com") => "example.com"
//   - CalculateFQDN("www", "example.com") => "www.example.com"
//   - CalculateFQDN("a.b", "example.com") => "a.b.example.com"
func CalculateFQDN(relativeName string, zone string) string {
	zone = strings.TrimSuffix(zone, ".")

	if relativeName == "@" || relativeName == "" {
		return zone
	}

	return relativeName + "." + zone
}
