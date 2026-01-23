package handler

import (
	"strconv"

	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type GroupHandler struct {
	nodeGroupService *service.NodeGroupService
	lineGroupService *service.LineGroupService
}

func NewGroupHandler(nodeGroupService *service.NodeGroupService, lineGroupService *service.LineGroupService) *GroupHandler {
	return &GroupHandler{
		nodeGroupService: nodeGroupService,
		lineGroupService: lineGroupService,
	}
}

// ListNodeGroups handles GET /api/v1/node-groups
func (h *GroupHandler) ListNodeGroups(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	nodeGroups, total, err := h.nodeGroupService.ListNodeGroups(page, pageSize)
	if err != nil {
		response.DatabaseError(c, "Failed to list node groups")
		return
	}

	response.Success(c, gin.H{
		"items": nodeGroups,
		"total": total,
		"page":  page,
		"page_size": pageSize,
	})
}

// CreateNodeGroup handles POST /api/v1/node-groups/create
func (h *GroupHandler) CreateNodeGroup(c *gin.Context) {
	var req service.CreateNodeGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "Invalid request parameters")
		return
	}

	nodeGroup, err := h.nodeGroupService.CreateNodeGroup(req)
	if err != nil {
		response.SystemError(c, "Failed to create node group")
		return
	}

	response.Success(c, nodeGroup)
}

// DeleteNodeGroup handles POST /api/v1/node-groups/delete
func (h *GroupHandler) DeleteNodeGroup(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "Invalid request parameters")
		return
	}

	if err := h.nodeGroupService.DeleteNodeGroup(req.ID); err != nil {
		response.SystemError(c, "Failed to delete node group")
		return
	}

	response.Success(c, gin.H{"message": "Node group deleted successfully"})
}

// ListLineGroups handles GET /api/v1/line-groups
func (h *GroupHandler) ListLineGroups(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	lineGroups, total, err := h.lineGroupService.ListLineGroups(page, pageSize)
	if err != nil {
		response.DatabaseError(c, "Failed to list line groups")
		return
	}

	response.Success(c, gin.H{
		"items": lineGroups,
		"total": total,
		"page":  page,
		"page_size": pageSize,
	})
}

// CreateLineGroup handles POST /api/v1/line-groups/create
func (h *GroupHandler) CreateLineGroup(c *gin.Context) {
	var req service.CreateLineGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "Invalid request parameters")
		return
	}

	lineGroup, err := h.lineGroupService.CreateLineGroup(req)
	if err != nil {
		response.SystemError(c, "Failed to create line group")
		return
	}

	response.Success(c, lineGroup)
}

// DeleteLineGroup handles POST /api/v1/line-groups/delete
func (h *GroupHandler) DeleteLineGroup(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "Invalid request parameters")
		return
	}

	if err := h.lineGroupService.DeleteLineGroup(req.ID); err != nil {
		response.SystemError(c, "Failed to delete line group")
		return
	}

	response.Success(c, gin.H{"message": "Line group deleted successfully"})
}
