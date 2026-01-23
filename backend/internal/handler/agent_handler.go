package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/labubu-daydayone/go_cmdb_web/backend/internal/service"
	"github.com/labubu-daydayone/go_cmdb_web/backend/pkg/response"
)

type AgentHandler struct {
	agentService *service.AgentService
}

func NewAgentHandler() *AgentHandler {
	return &AgentHandler{
		agentService: service.NewAgentService(),
	}
}

// GetCertificates godoc
// @Summary Get all certificates for agent
// @Description Get list of all certificates (R18: no node-based filtering)
// @Tags agent
// @Accept json
// @Produce json
// @Success 200 {object} response.Response{data=[]service.CertificateListResponse}
// @Failure 500 {object} response.Response
// @Security mTLS
// @Router /api/v1/agent/certificates [get]
func (h *AgentHandler) GetCertificates(c *gin.Context) {
	certificates, err := h.agentService.GetAllCertificates()
	if err != nil {
		response.Error(c, response.CodeSystemError, err.Error())
		return
	}

	response.Success(c, certificates)
}

// GetCertificateByID godoc
// @Summary Get certificate details by ID
// @Description Get detailed certificate information including PEM data
// @Tags agent
// @Accept json
// @Produce json
// @Param id path int true "Certificate ID"
// @Success 200 {object} response.Response{data=service.CertificateDetailResponse}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security mTLS
// @Router /api/v1/agent/certificates/{id} [get]
func (h *AgentHandler) GetCertificateByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.Error(c, response.CodeValidationFailed, "invalid certificate ID")
		return
	}

	certificate, err := h.agentService.GetCertificateByID(id)
	if err != nil {
		if err == service.ErrCertificateNotFound {
			response.NotFoundError(c, "certificate not found")
			return
		}
		response.Error(c, response.CodeSystemError, err.Error())
		return
	}

	response.Success(c, certificate)
}
