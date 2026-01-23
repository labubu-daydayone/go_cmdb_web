package handler

import (
"strconv"

"github.com/gin-gonic/gin"
"github.com/labubu-daydayone/go_cmdb_web/backend/internal/service"
"github.com/labubu-daydayone/go_cmdb_web/backend/pkg/response"
)

type CertificateHandler struct {
certificateService *service.CertificateService
acmeService        *service.ACMEService
}

func NewCertificateHandler() *CertificateHandler {
return &CertificateHandler{
certificateService: service.NewCertificateService(),
acmeService:        service.NewACMEService(),
}
}

// ListCertificates godoc
// @Summary List certificates
// @Description Get list of certificates with pagination
// @Tags certificates
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param status query string false "Filter by status" Enums(valid, expiring, expired, revoked)
// @Success 200 {object} response.Response{data=[]models.Certificate}
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /api/v1/certificates [get]
func (h *CertificateHandler) ListCertificates(c *gin.Context) {
page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
status := c.Query("status")

if page < 1 {
page = 1
}
if pageSize < 1 || pageSize > 100 {
pageSize = 10
}

certificates, total, err := h.certificateService.ListCertificates(page, pageSize, status)
if err != nil {
response.Error(c, response.CodeSystemError, err.Error())
return
}

response.SuccessWithPagination(c, certificates, total, page, pageSize)
}

// GetCertificate godoc
// @Summary Get certificate details
// @Description Get certificate by ID with domains
// @Tags certificates
// @Accept json
// @Produce json
// @Param id path int true "Certificate ID"
// @Success 200 {object} response.Response{data=object}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /api/v1/certificates/{id} [get]
func (h *CertificateHandler) GetCertificate(c *gin.Context) {
id, err := strconv.Atoi(c.Param("id"))
if err != nil {
response.Error(c, response.CodeValidationFailed, "invalid certificate ID")
return
}

certificate, domains, err := h.certificateService.GetCertificate(id)
if err != nil {
if err == service.ErrCertificateNotFound {
response.NotFoundError(c, "certificate not found")
return
}
response.Error(c, response.CodeSystemError, err.Error())
return
}

response.Success(c, gin.H{
"certificate": certificate,
"domains":     domains,
})
}

// UploadCertificate godoc
// @Summary Upload certificate
// @Description Upload a certificate manually (WF-06)
// @Tags certificates
// @Accept json
// @Produce json
// @Param request body service.UploadCertificateRequest true "Upload certificate request"
// @Success 200 {object} response.Response{data=service.UploadCertificateResponse}
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /api/v1/certificates/upload [post]
func (h *CertificateHandler) UploadCertificate(c *gin.Context) {
var req service.UploadCertificateRequest
if err := c.ShouldBindJSON(&req); err != nil {
response.Error(c, response.CodeValidationFailed, err.Error())
return
}

resp, err := h.certificateService.UploadCertificate(req)
if err != nil {
code := response.CodeSystemError
if err == service.ErrInvalidCertificatePEM || err == service.ErrInvalidPrivateKeyPEM {
code = response.CodeValidationFailed
} else if err == service.ErrCertificateExpired {
code = response.CodeValidationInvalid
}

response.Error(c, code, err.Error())
return
}

response.Success(c, resp)
}

// RequestCertificate godoc
// @Summary Request certificate via ACME
// @Description Request a certificate via ACME DNS-01 challenge (WF-07)
// @Tags certificates
// @Accept json
// @Produce json
// @Param request body service.RequestCertificateRequest true "Request certificate request"
// @Success 200 {object} response.Response{data=service.RequestCertificateResponse}
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /api/v1/certificates/request [post]
func (h *CertificateHandler) RequestCertificate(c *gin.Context) {
var req service.RequestCertificateRequest
if err := c.ShouldBindJSON(&req); err != nil {
response.Error(c, response.CodeValidationFailed, err.Error())
return
}

resp, err := h.acmeService.RequestCertificate(req)
if err != nil {
code := response.CodeSystemError
if err == service.ErrACMEAccountNotFound {
code = response.CodeResourceNotFound
}

response.Error(c, code, err.Error())
return
}

response.Success(c, resp)
}

// DeleteCertificate godoc
// @Summary Delete certificate
// @Description Delete a certificate and its related data
// @Tags certificates
// @Accept json
// @Produce json
// @Param request body map[string]int true "Delete certificate request"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /api/v1/certificates/delete [post]
func (h *CertificateHandler) DeleteCertificate(c *gin.Context) {
var req struct {
ID int `json:"id" binding:"required"`
}

if err := c.ShouldBindJSON(&req); err != nil {
response.Error(c, response.CodeValidationFailed, err.Error())
return
}

err := h.certificateService.DeleteCertificate(req.ID)
if err != nil {
if err == service.ErrCertificateNotFound {
response.NotFoundError(c, "certificate not found")
return
}
response.Error(c, response.CodeSystemError, err.Error())
return
}

response.Success(c, nil)
}

// BindCertificate godoc
// @Summary Bind certificate to website
// @Description Bind a certificate to a website (WF-08)
// @Tags certificates
// @Accept json
// @Produce json
// @Param request body service.BindCertificateRequest true "Bind certificate request"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /api/v1/certificates/bind [post]
func (h *CertificateHandler) BindCertificate(c *gin.Context) {
var req service.BindCertificateRequest
if err := c.ShouldBindJSON(&req); err != nil {
response.Error(c, response.CodeValidationFailed, err.Error())
return
}

err := h.certificateService.BindCertificate(req)
if err != nil {
code := response.CodeSystemError
if err == service.ErrCertificateNotFound {
code = response.CodeResourceNotFound
} else if err == service.ErrDomainNotCovered {
code = response.CodeCertificateNotCoverDomains
}

response.Error(c, code, err.Error())
return
}

response.Success(c, nil)
}

// UnbindCertificate godoc
// @Summary Unbind certificate from website
// @Description Unbind the active certificate from a website
// @Tags certificates
// @Accept json
// @Produce json
// @Param request body service.UnbindCertificateRequest true "Unbind certificate request"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /api/v1/certificates/unbind [post]
func (h *CertificateHandler) UnbindCertificate(c *gin.Context) {
var req service.UnbindCertificateRequest
if err := c.ShouldBindJSON(&req); err != nil {
response.Error(c, response.CodeValidationFailed, err.Error())
return
}

err := h.certificateService.UnbindCertificate(req)
if err != nil {
if err == service.ErrBindingNotFound {
response.NotFoundError(c, "certificate binding not found")
return
}
response.Error(c, response.CodeSystemError, err.Error())
return
}

response.Success(c, nil)
}
