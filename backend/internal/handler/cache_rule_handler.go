package handler

import (
	"strconv"

	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type CacheRuleHandler struct {
	cacheRuleService *service.CacheRuleService
}

func NewCacheRuleHandler(cacheRuleService *service.CacheRuleService) *CacheRuleHandler {
	return &CacheRuleHandler{
		cacheRuleService: cacheRuleService,
	}
}

// ListCacheRules godoc
// @Summary Get cache rules list
// @Description Get all cache rules with pagination
// @Tags Cache Rules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Success 200 {object} response.Response
// @Router /cache-rules [get]
func (h *CacheRuleHandler) ListCacheRules(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	rules, total, err := h.cacheRuleService.ListCacheRules(page, pageSize)
	if err != nil {
		response.Error(c, 1001, "Failed to list cache rules: "+err.Error())
		return
	}

	response.SuccessWithPagination(c, rules, total, page, pageSize)
}

// CreateCacheRule godoc
// @Summary Create cache rule
// @Description Create a new cache rule
// @Tags Cache Rules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.CreateCacheRuleRequest true "Cache rule info"
// @Success 200 {object} response.Response
// @Router /cache-rules/create [post]
func (h *CacheRuleHandler) CreateCacheRule(c *gin.Context) {
	var req service.CreateCacheRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	rule, err := h.cacheRuleService.CreateCacheRule(req)
	if err != nil {
		response.Error(c, 1001, "Failed to create cache rule: "+err.Error())
		return
	}

	response.Success(c, rule)
}

// UpdateCacheRule godoc
// @Summary Update cache rule
// @Description Update cache rule information
// @Tags Cache Rules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.UpdateCacheRuleRequest true "Cache rule info"
// @Success 200 {object} response.Response
// @Router /cache-rules/update [post]
func (h *CacheRuleHandler) UpdateCacheRule(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
		service.UpdateCacheRuleRequest
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	rule, err := h.cacheRuleService.UpdateCacheRule(req.ID, req.UpdateCacheRuleRequest)
	if err != nil {
		if err == service.ErrCacheRuleNotFound {
			response.Error(c, 3001, "Cache rule not found: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to update cache rule: "+err.Error())
		return
	}

	response.Success(c, rule)
}

// DeleteCacheRule godoc
// @Summary Delete cache rule
// @Description Delete a cache rule
// @Tags Cache Rules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]int true "Cache rule ID"
// @Success 200 {object} response.Response
// @Router /cache-rules/delete [post]
func (h *CacheRuleHandler) DeleteCacheRule(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	err := h.cacheRuleService.DeleteCacheRule(req.ID)
	if err != nil {
		if err == service.ErrCacheRuleNotFound {
			response.Error(c, 3001, "Cache rule not found: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to delete cache rule: "+err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Cache rule deleted successfully"})
}
