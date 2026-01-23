package handler

import (
	"strconv"

	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type OriginHandler struct {
	originService *service.OriginService
}

func NewOriginHandler(originService *service.OriginService) *OriginHandler {
	return &OriginHandler{
		originService: originService,
	}
}

// ListOriginGroups godoc
// @Summary Get origin groups list
// @Description Get all origin groups with pagination
// @Tags Origin Groups
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Success 200 {object} response.Response
// @Router /origin-groups [get]
func (h *OriginHandler) ListOriginGroups(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	groups, total, err := h.originService.ListOriginGroups(page, pageSize)
	if err != nil {
		response.Error(c, 1001, "Failed to list origin groups: "+err.Error())
		return
	}

	response.SuccessWithPagination(c, groups, total, page, pageSize)
}

// CreateOriginGroup godoc
// @Summary Create origin group
// @Description Create a new origin group
// @Tags Origin Groups
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.CreateOriginGroupRequest true "Origin group info"
// @Success 200 {object} response.Response
// @Router /origin-groups/create [post]
func (h *OriginHandler) CreateOriginGroup(c *gin.Context) {
	var req service.CreateOriginGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	group, err := h.originService.CreateOriginGroup(req)
	if err != nil {
		response.Error(c, 1001, "Failed to create origin group: "+err.Error())
		return
	}

	response.Success(c, group)
}

// UpdateOriginGroup godoc
// @Summary Update origin group
// @Description Update origin group information
// @Tags Origin Groups
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.UpdateOriginGroupRequest true "Origin group info"
// @Success 200 {object} response.Response
// @Router /origin-groups/update [post]
func (h *OriginHandler) UpdateOriginGroup(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
		service.UpdateOriginGroupRequest
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	group, err := h.originService.UpdateOriginGroup(req.ID, req.UpdateOriginGroupRequest)
	if err != nil {
		if err == service.ErrOriginGroupNotFound {
			response.Error(c, 3001, "Origin group not found: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to update origin group: "+err.Error())
		return
	}

	response.Success(c, group)
}

// DeleteOriginGroup godoc
// @Summary Delete origin group
// @Description Delete an origin group
// @Tags Origin Groups
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]int true "Origin group ID"
// @Success 200 {object} response.Response
// @Router /origin-groups/delete [post]
func (h *OriginHandler) DeleteOriginGroup(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	err := h.originService.DeleteOriginGroup(req.ID)
	if err != nil {
		if err == service.ErrOriginGroupNotFound {
			response.Error(c, 3001, "Origin group not found: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to delete origin group: "+err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Origin group deleted successfully"})
}
