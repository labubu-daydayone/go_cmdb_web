package handler

import (
	"strconv"

	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type APIKeyHandler struct {
	apiKeyService *service.APIKeyService
}

func NewAPIKeyHandler(apiKeyService *service.APIKeyService) *APIKeyHandler {
	return &APIKeyHandler{
		apiKeyService: apiKeyService,
	}
}

// ListAPIKeys godoc
// @Summary Get API keys list
// @Description Get all API keys with pagination
// @Tags API Keys
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param provider query string false "Provider"
// @Param status query string false "Status"
// @Success 200 {object} response.Response
// @Router /api-keys [get]
func (h *APIKeyHandler) ListAPIKeys(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	provider := c.Query("provider")
	status := c.Query("status")

	apiKeys, total, err := h.apiKeyService.ListAPIKeys(page, pageSize, provider, status)
	if err != nil {
		response.Error(c, 1001, "Failed to list API keys: "+err.Error())
		return
	}

	response.SuccessWithPagination(c, apiKeys, total, page, pageSize)
}

// CreateAPIKey godoc
// @Summary Create API key
// @Description Create a new API key
// @Tags API Keys
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.CreateAPIKeyRequest true "API key info"
// @Success 200 {object} response.Response
// @Router /api-keys/create [post]
func (h *APIKeyHandler) CreateAPIKey(c *gin.Context) {
	var req service.CreateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	apiKey, err := h.apiKeyService.CreateAPIKey(req)
	if err != nil {
		if err == service.ErrAPIKeyAlreadyExists {
			response.Error(c, 3002, "API key already exists: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to create API key: "+err.Error())
		return
	}

	response.Success(c, apiKey)
}

// UpdateAPIKey godoc
// @Summary Update API key
// @Description Update API key information
// @Tags API Keys
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.UpdateAPIKeyRequest true "API key info"
// @Success 200 {object} response.Response
// @Router /api-keys/update [post]
func (h *APIKeyHandler) UpdateAPIKey(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
		service.UpdateAPIKeyRequest
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	apiKey, err := h.apiKeyService.UpdateAPIKey(req.ID, req.UpdateAPIKeyRequest)
	if err != nil {
		if err == service.ErrAPIKeyNotFound {
			response.Error(c, 3001, "API key not found: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to update API key: "+err.Error())
		return
	}

	response.Success(c, apiKey)
}

// DeleteAPIKey godoc
// @Summary Delete API key
// @Description Delete an API key
// @Tags API Keys
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]int true "API key ID"
// @Success 200 {object} response.Response
// @Router /api-keys/delete [post]
func (h *APIKeyHandler) DeleteAPIKey(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	err := h.apiKeyService.DeleteAPIKey(req.ID)
	if err != nil {
		if err == service.ErrAPIKeyNotFound {
			response.Error(c, 3001, "API key not found: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to delete API key: "+err.Error())
		return
	}

	response.Success(c, gin.H{"message": "API key deleted successfully"})
}
