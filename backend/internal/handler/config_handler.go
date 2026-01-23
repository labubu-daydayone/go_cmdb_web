package handler

import (
	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type ConfigHandler struct {
	configVersionService *service.ConfigVersionService
}

func NewConfigHandler(configVersionService *service.ConfigVersionService) *ConfigHandler {
	return &ConfigHandler{
		configVersionService: configVersionService,
	}
}

// GetVersion handles GET /api/v1/config/version
func (h *ConfigHandler) GetVersion(c *gin.Context) {
	version, err := h.configVersionService.GetLatestVersion()
	if err != nil {
		response.SystemError(c, "Failed to get config version")
		return
	}

	response.Success(c, version)
}
