package handler

import (
	"strconv"

	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type NodeHandler struct {
	nodeService *service.NodeService
}

func NewNodeHandler(nodeService *service.NodeService) *NodeHandler {
	return &NodeHandler{
		nodeService: nodeService,
	}
}

// ListNodes godoc
// @Summary Get nodes list
// @Description Get all nodes with pagination
// @Tags Nodes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param status query string false "Node status"
// @Success 200 {object} response.Response
// @Router /nodes [get]
func (h *NodeHandler) ListNodes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")

	nodes, total, err := h.nodeService.ListNodes(page, pageSize, status)
	if err != nil {
		response.Error(c, 1001, "Failed to list nodes: "+err.Error())
		return
	}

	response.SuccessWithPagination(c, nodes, total, page, pageSize)
}

// CreateNode godoc
// @Summary Create node
// @Description Create a new node
// @Tags Nodes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.CreateNodeRequest true "Node info"
// @Success 200 {object} response.Response
// @Router /nodes/create [post]
func (h *NodeHandler) CreateNode(c *gin.Context) {
	var req service.CreateNodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	node, err := h.nodeService.CreateNode(req)
	if err != nil {
		if err == service.ErrNodeAlreadyExists {
			response.Error(c, 3002, "Node already exists: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to create node: "+err.Error())
		return
	}

	response.Success(c, node)
}

// UpdateNode godoc
// @Summary Update node
// @Description Update node information
// @Tags Nodes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.UpdateNodeRequest true "Node info"
// @Success 200 {object} response.Response
// @Router /nodes/update [post]
func (h *NodeHandler) UpdateNode(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
		service.UpdateNodeRequest
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	node, err := h.nodeService.UpdateNode(req.ID, req.UpdateNodeRequest)
	if err != nil {
		if err == service.ErrNodeNotFound {
			response.Error(c, 3001, "Node not found: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to update node: "+err.Error())
		return
	}

	response.Success(c, node)
}

// DeleteNode godoc
// @Summary Delete node
// @Description Delete a node
// @Tags Nodes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]int true "Node ID"
// @Success 200 {object} response.Response
// @Router /nodes/delete [post]
func (h *NodeHandler) DeleteNode(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	err := h.nodeService.DeleteNode(req.ID)
	if err != nil {
		if err == service.ErrNodeNotFound {
			response.Error(c, 3001, "Node not found: "+err.Error())
			return
		}
		if err == service.ErrNodeInUse {
			response.Error(c, 3003, "Node is in use: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to delete node: "+err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Node deleted successfully"})
}

// AddSubIP godoc
// @Summary Add sub IP
// @Description Add a sub IP to a node
// @Tags Nodes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.AddSubIPRequest true "Sub IP info"
// @Success 200 {object} response.Response
// @Router /nodes/sub-ips/add [post]
func (h *NodeHandler) AddSubIP(c *gin.Context) {
	var req service.AddSubIPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	subIP, err := h.nodeService.AddSubIP(req)
	if err != nil {
		if err == service.ErrNodeNotFound {
			response.Error(c, 3001, "Node not found: "+err.Error())
			return
		}
		response.Error(c, 1001, "Failed to add sub IP: "+err.Error())
		return
	}

	response.Success(c, subIP)
}

// UpdateSubIP godoc
// @Summary Update sub IP
// @Description Update a sub IP
// @Tags Nodes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.UpdateSubIPRequest true "Sub IP info"
// @Success 200 {object} response.Response
// @Router /nodes/sub-ips/update [post]
func (h *NodeHandler) UpdateSubIP(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
		service.UpdateSubIPRequest
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	subIP, err := h.nodeService.UpdateSubIP(req.ID, req.UpdateSubIPRequest)
	if err != nil {
		response.Error(c, 1001, "Failed to update sub IP: "+err.Error())
		return
	}

	response.Success(c, subIP)
}

// DeleteSubIP godoc
// @Summary Delete sub IP
// @Description Delete a sub IP
// @Tags Nodes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]int true "Sub IP ID"
// @Success 200 {object} response.Response
// @Router /nodes/sub-ips/delete [post]
func (h *NodeHandler) DeleteSubIP(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: "+err.Error())
		return
	}

	err := h.nodeService.DeleteSubIP(req.ID)
	if err != nil {
		response.Error(c, 1001, "Failed to delete sub IP: "+err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Sub IP deleted successfully"})
}
