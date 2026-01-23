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

// GetConfig godoc
// @Summary Get complete CDN configuration
// @Description Get all configuration data for the agent node including websites, node groups, and line groups
// @Tags agent
// @Accept json
// @Produce json
// @Success 200 {object} response.Response{data=service.AgentConfigResponse}
// @Failure 500 {object} response.Response
// @Security mTLS
// @Router /api/v1/agent/config [get]
func (h *AgentHandler) GetConfig(c *gin.Context) {
	config, err := h.agentService.GetConfig()
	if err != nil {
		response.Error(c, response.CodeSystemError, err.Error())
		return
	}

	response.Success(c, config)
}

// GetPendingTasks godoc
// @Summary Get pending tasks for the current node
// @Description Get all pending tasks assigned to the authenticated node
// @Tags agent
// @Accept json
// @Produce json
// @Success 200 {object} response.Response{data=[]models.AgentTask}
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Security mTLS
// @Router /api/v1/agent/tasks [get]
func (h *AgentHandler) GetPendingTasks(c *gin.Context) {
	// Get node from context (set by mTLS middleware)
	nodeID, exists := c.Get("node_id")
	if !exists {
		response.Error(c, response.CodeUnauthorized, "node not authenticated")
		return
	}

	taskService := service.NewAgentTaskService()
	tasks, err := taskService.GetPendingTasks(nodeID.(int))
	if err != nil {
		response.Error(c, response.CodeSystemError, err.Error())
		return
	}

	response.Success(c, tasks)
}

// UpdateTaskStatus godoc
// @Summary Update task status
// @Description Update the status of a task (called by agent after task execution)
// @Tags agent
// @Accept json
// @Produce json
// @Param id path int true "Task ID"
// @Param request body service.UpdateTaskStatusRequest true "Status update request"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security mTLS
// @Router /api/v1/agent/tasks/:id/status [post]
func (h *AgentHandler) UpdateTaskStatus(c *gin.Context) {
	// Get task ID from path
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.Error(c, response.CodeInvalidParams, "invalid task id")
		return
	}

	// Parse request
	var req service.UpdateTaskStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, response.CodeInvalidParams, err.Error())
		return
	}

	// Verify task belongs to authenticated node
	nodeID, exists := c.Get("node_id")
	if !exists {
		response.Error(c, response.CodeUnauthorized, "node not authenticated")
		return
	}

	taskService := service.NewAgentTaskService()
	task, err := taskService.GetTaskByID(id)
	if err != nil {
		response.Error(c, response.CodeNotFound, "task not found")
		return
	}

	if task.NodeID != nodeID.(int) {
		response.Error(c, response.CodeForbidden, "task does not belong to this node")
		return
	}

	// Update status
	if err := taskService.UpdateTaskStatus(id, req); err != nil {
		response.Error(c, response.CodeSystemError, err.Error())
		return
	}

	response.Success(c, nil)
}
