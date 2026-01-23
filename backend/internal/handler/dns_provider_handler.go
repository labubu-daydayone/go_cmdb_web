package handler

import (

	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type DNSProviderHandler struct {
	providerService *service.DNSProviderService
}

func NewDNSProviderHandler(providerService *service.DNSProviderService) *DNSProviderHandler {
	return &DNSProviderHandler{
		providerService: providerService,
	}
}

// ListProviders godoc
// @Summary 获取DNS提供商列表
// @Description 获取所有DNS提供商配置列表
// @Tags DNS提供商
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.Response{data=[]object}
// @Router /dns/providers [get]
func (h *DNSProviderHandler) ListProviders(c *gin.Context) {
	providers, err := h.providerService.ListProviders()
	if err != nil {
		response.Error(c, 1001, "Failed to list providers: " + err.Error())
		return
	}

	response.Success(c, map[string]interface{}{
		"items": providers,
	})
}

// CreateProvider godoc
// @Summary 创建DNS提供商配置
// @Description 为域名配置DNS提供商
// @Tags DNS提供商
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.CreateProviderRequest true "创建提供商请求"
// @Success 200 {object} response.Response{data=models.DomainDNSProvider}
// @Router /dns/providers/create [post]
func (h *DNSProviderHandler) CreateProvider(c *gin.Context) {
	var req service.CreateProviderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: " + err.Error())
		return
	}

	provider, err := h.providerService.CreateProvider(req)
	if err != nil {
		if err == service.ErrProviderAlreadyExists {
			response.Error(c, 3002, "Provider already exists for this domain: " + err.Error())
			return
		}
		if err == service.ErrDomainNotFound {
			response.Error(c, 3001, "Domain not found: " + err.Error())
			return
		}
		response.Error(c, 1001, "Failed to create provider: " + err.Error())
		return
	}

	response.Success(c, provider)
}

// UpdateProvider godoc
// @Summary 更新DNS提供商配置
// @Description 更新DNS提供商配置信息
// @Tags DNS提供商
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body object{id=int,updates=service.UpdateProviderRequest} true "更新提供商请求"
// @Success 200 {object} response.Response
// @Router /dns/providers/update [post]
func (h *DNSProviderHandler) UpdateProvider(c *gin.Context) {
	var req struct {
		ID      int                                  `json:"id" binding:"required"`
		Updates service.UpdateProviderRequest `json:"updates"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: " + err.Error())
		return
	}

	if err := h.providerService.UpdateProvider(req.ID, req.Updates); err != nil {
		if err == service.ErrProviderNotFound {
			response.Error(c, 3001, "Provider not found: " + err.Error())
			return
		}
		response.Error(c, 1001, "Failed to update provider: " + err.Error())
		return
	}

	response.Success(c, nil)
}

// DeleteProvider godoc
// @Summary 删除DNS提供商配置
// @Description 删除DNS提供商配置
// @Tags DNS提供商
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body object{id=int} true "删除提供商请求"
// @Success 200 {object} response.Response
// @Router /dns/providers/delete [post]
func (h *DNSProviderHandler) DeleteProvider(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: " + err.Error())
		return
	}

	if err := h.providerService.DeleteProvider(req.ID); err != nil {
		if err == service.ErrProviderNotFound {
			response.Error(c, 3001, "Provider not found: " + err.Error())
			return
		}
		response.Error(c, 1001, "Failed to delete provider: " + err.Error())
		return
	}

	response.Success(c, nil)
}
