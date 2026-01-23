package handler

import (
	"strconv"

	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type DomainHandler struct {
	domainService *service.DomainService
}

func NewDomainHandler(domainService *service.DomainService) *DomainHandler {
	return &DomainHandler{
		domainService: domainService,
	}
}

// ListDomains godoc
// @Summary 获取域名列表
// @Description 获取DNS Zone列表，支持分页和筛选
// @Tags 域名管理
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Param purpose query string false "用途筛选" Enums(cdn, general)
// @Param status query string false "状态筛选" Enums(active, inactive)
// @Success 200 {object} response.Response{data=object}
// @Router /domains [get]
func (h *DomainHandler) ListDomains(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	purpose := c.Query("purpose")
	status := c.Query("status")

	filter := service.DomainFilter{
		Purpose:  purpose,
		Status:   status,
		Page:     page,
		PageSize: pageSize,
	}

	domains, total, err := h.domainService.ListDomains(filter)
	if err != nil {
		response.Error(c, 1001, "Failed to list domains: " + err.Error())
		return
	}

	response.SuccessWithPagination(c, domains, total, page, pageSize)
}

// CreateDomain godoc
// @Summary 创建域名
// @Description 创建新的DNS Zone并配置DNS提供商
// @Tags 域名管理
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.CreateDomainRequest true "创建域名请求"
// @Success 200 {object} response.Response{data=models.Domain}
// @Router /domains/create [post]
func (h *DomainHandler) CreateDomain(c *gin.Context) {
	var req service.CreateDomainRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: " + err.Error())
		return
	}

	domain, err := h.domainService.CreateDomain(req)
	if err != nil {
		if err == service.ErrDomainAlreadyExists {
			response.Error(c, 3002, "Domain already exists: " + err.Error())
			return
		}
		response.Error(c, 1001, "Failed to create domain: " + err.Error())
		return
	}

	response.Success(c, domain)
}

// UpdateDomain godoc
// @Summary 更新域名
// @Description 更新DNS Zone配置
// @Tags 域名管理
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body object{id=int,purpose=string,status=string} true "更新域名请求"
// @Success 200 {object} response.Response
// @Router /domains/update [post]
func (h *DomainHandler) UpdateDomain(c *gin.Context) {
	var req struct {
		ID      int                            `json:"id" binding:"required"`
		Updates service.UpdateDomainRequest `json:"updates"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: " + err.Error())
		return
	}

	if err := h.domainService.UpdateDomain(req.ID, req.Updates); err != nil {
		if err == service.ErrDomainNotFound {
			response.Error(c, 3001, "Domain not found: " + err.Error())
			return
		}
		response.Error(c, 1001, "Failed to update domain: " + err.Error())
		return
	}

	response.Success(c, nil)
}

// DeleteDomain godoc
// @Summary 删除域名
// @Description 删除DNS Zone（需检查依赖）
// @Tags 域名管理
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body object{id=int} true "删除域名请求"
// @Success 200 {object} response.Response
// @Router /domains/delete [post]
func (h *DomainHandler) DeleteDomain(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: " + err.Error())
		return
	}

	if err := h.domainService.DeleteDomain(req.ID); err != nil {
		if err == service.ErrDomainNotFound {
			response.Error(c, 3001, "Domain not found: " + err.Error())
			return
		}
		if err == service.ErrDomainHasDependency {
			response.Error(c, 3003, "Domain has dependencies: " + err.Error())
			return
		}
		response.Error(c, 1001, "Failed to delete domain: " + err.Error())
		return
	}

	response.Success(c, nil)
}
