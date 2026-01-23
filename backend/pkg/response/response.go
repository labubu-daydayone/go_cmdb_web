package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response represents the standard API response format
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// Error code segments
const (
	// Success
	CodeSuccess = 0

	// Auth errors (1000-1099)
	CodeAuthInvalidToken     = 1001
	CodeAuthTokenExpired     = 1002
	CodeAuthInvalidCredentials = 1003
	CodeAuthUnauthorized     = 1004

	// Validation errors (2000-2099)
	CodeValidationFailed     = 2001
	CodeValidationMissing    = 2002
	CodeValidationInvalid    = 2003
	CodeValidationFQDNNotInZone = 2004

	// Business/Resource errors (3000-3999)
	CodeResourceNotFound     = 3001
	CodeResourceAlreadyExists = 3002
	CodeResourceInUse        = 3003
	CodeResourceConflict     = 3004
	CodeOriginSetNotReusable = 3005
	CodeCertificateNotCoverDomains = 3006
	CodeWebsiteActiveBindingExists = 3007

	// System/Dependency errors (5000-5999)
	CodeSystemError          = 5001
	CodeDatabaseError        = 5002
	CodeRedisError           = 5003
	CodeCloudflareError      = 5004
	CodeACMEError            = 5005
)

// Success sends a successful response
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    CodeSuccess,
		Message: "success",
		Data:    data,
	})
}

// Error sends an error response
func Error(c *gin.Context, code int, message string) {
	c.JSON(http.StatusOK, Response{
		Code:    code,
		Message: message,
		Data:    nil,
	})
}

// ErrorWithData sends an error response with additional data
func ErrorWithData(c *gin.Context, code int, message string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    code,
		Message: message,
		Data:    data,
	})
}

// Common error responses
func AuthError(c *gin.Context, message string) {
	Error(c, CodeAuthUnauthorized, message)
}

func ValidationError(c *gin.Context, message string) {
	Error(c, CodeValidationFailed, message)
}

func NotFoundError(c *gin.Context, message string) {
	Error(c, CodeResourceNotFound, message)
}

func SystemError(c *gin.Context, message string) {
	Error(c, CodeSystemError, message)
}

func DatabaseError(c *gin.Context, message string) {
	Error(c, CodeDatabaseError, message)
}
