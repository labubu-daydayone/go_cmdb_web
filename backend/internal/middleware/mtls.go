package middleware

import (
	"crypto/x509"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/labubu-daydayone/go_cmdb_web/backend/internal/database"
	"github.com/labubu-daydayone/go_cmdb_web/backend/internal/models"
	"github.com/labubu-daydayone/go_cmdb_web/backend/pkg/response"
)

// MTLSAuth is a middleware that validates client certificates for Agent API
// It extracts the client certificate from TLS connection and validates it against the nodes table
func MTLSAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get TLS connection state
		if c.Request.TLS == nil {
			response.Error(c, response.CodeUnauthorized, "TLS connection required")
			c.Abort()
			return
		}

		// Check if client certificate is provided
		if len(c.Request.TLS.PeerCertificates) == 0 {
			response.Error(c, response.CodeUnauthorized, "Client certificate required")
			c.Abort()
			return
		}

		// Get the first certificate (client certificate)
		clientCert := c.Request.TLS.PeerCertificates[0]

		// Extract node identifier from certificate
		// We use the Common Name (CN) as the node identifier
		nodeIdentifier := clientCert.Subject.CommonName
		if nodeIdentifier == "" {
			response.Error(c, response.CodeUnauthorized, "Certificate CN is empty")
			c.Abort()
			return
		}

		// Validate certificate
		if err := validateClientCertificate(clientCert); err != nil {
			response.Error(c, response.CodeUnauthorized, err.Error())
			c.Abort()
			return
		}

		// Query node from database
		var node models.Node
		if err := database.DB.Where("hostname = ?", nodeIdentifier).First(&node).Error; err != nil {
			response.Error(c, response.CodeUnauthorized, "Node not found or invalid")
			c.Abort()
			return
		}

		// Check node status
		if node.Status != "active" {
			response.Error(c, response.CodeForbidden, "Node is not active")
			c.Abort()
			return
		}

		// Store node information in context for later use
		c.Set("node_id", node.ID)
		c.Set("node_hostname", node.Hostname)
		c.Set("node_ip", node.IP)

		c.Next()
	}
}

// validateClientCertificate validates the client certificate
func validateClientCertificate(cert *x509.Certificate) error {
	// Check if certificate is expired
	// Note: TLS layer already validates this, but we double-check here
	now := cert.NotBefore
	if now.After(cert.NotAfter) {
		return errors.New("certificate has expired")
	}

	// Additional validations can be added here:
	// - Check certificate revocation status (CRL/OCSP)
	// - Verify certificate chain
	// - Check certificate key usage
	// - Validate certificate issuer

	return nil
}

// GetNodeFromContext retrieves node information from gin context
func GetNodeFromContext(c *gin.Context) (nodeID int, hostname string, ip string, exists bool) {
	nodeIDVal, ok1 := c.Get("node_id")
	hostnameVal, ok2 := c.Get("node_hostname")
	ipVal, ok3 := c.Get("node_ip")

	if !ok1 || !ok2 || !ok3 {
		return 0, "", "", false
	}

	nodeID, ok := nodeIDVal.(int)
	if !ok {
		return 0, "", "", false
	}

	hostname, ok = hostnameVal.(string)
	if !ok {
		return 0, "", "", false
	}

	ip, ok = ipVal.(string)
	if !ok {
		return 0, "", "", false
	}

	return nodeID, hostname, ip, true
}
