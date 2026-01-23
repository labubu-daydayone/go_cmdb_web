package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/labubu-daydayone/go_cmdb_web/backend/internal/service"
	"github.com/labubu-daydayone/go_cmdb_web/backend/pkg/response"
)

type WebsiteHandler struct {
websiteService *service.WebsiteService
}

func NewWebsiteHandler() *WebsiteHandler {
return &WebsiteHandler{
websiteService: service.NewWebsiteService(),
}
}

// ListWebsites godoc
// @Summary List websites
// @Description Get list of websites with pagination
// @Tags websites
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param status query string false "Filter by status" Enums(active, inactive)
// @Success 200 {object} Response{data=[]models.Website}
// @Failure 500 {object} Response
// @Security BearerAuth
// @Router /api/v1/websites [get]
func (h *WebsiteHandler) ListWebsites(c *gin.Context) {
page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
status := c.Query("status")

if page < 1 {
page = 1
}
if pageSize < 1 || pageSize > 100 {
pageSize = 10
}

websites, total, err := h.websiteService.ListWebsites(page, pageSize, status)
if err != nil {
	response.Error(c, response.CodeSystemError, err.Error())
return
}

	response.SuccessWithPagination(c, websites, total, page, pageSize)
}

// GetWebsite godoc
// @Summary Get website details
// @Description Get website by ID with all relations
// @Tags websites
// @Accept json
// @Produce json
// @Param id path int true "Website ID"
// @Success 200 {object} Response{data=models.Website}
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Security BearerAuth
// @Router /api/v1/websites/{id} [get]
func (h *WebsiteHandler) GetWebsite(c *gin.Context) {
id, err := strconv.Atoi(c.Param("id"))
if err != nil {
	response.Error(c, response.CodeValidationFailed, "invalid website ID")
return
}

website, err := h.websiteService.GetWebsite(id)
if err != nil {
if err == service.ErrWebsiteNotFound {
	response.NotFoundError(c, "website not found")
return
}
	response.Error(c, response.CodeSystemError, err.Error())
return
}

// Get domains
domains, _ := h.websiteService.GetWebsiteDomains(id)

// Get HTTPS config
https, _ := h.websiteService.GetWebsiteHTTPS(id)

	response.Success(c, gin.H{
		"website": website,
		"domains": domains,
		"https":   https,
	})
}

// CreateWebsite godoc
// @Summary Create website
// @Description Create a new website with domains and HTTPS config (WF-03 workflow)
// @Tags websites
// @Accept json
// @Produce json
// @Param request body service.CreateWebsiteRequest true "Create website request"
// @Success 200 {object} Response{data=service.CreateWebsiteResponse}
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Security BearerAuth
// @Router /api/v1/websites/create [post]
func (h *WebsiteHandler) CreateWebsite(c *gin.Context) {
var req service.CreateWebsiteRequest
if err := c.ShouldBindJSON(&req); err != nil {
	response.Error(c, response.CodeValidationFailed, err.Error())
return
}

	resp, err := h.websiteService.CreateWebsite(req)
	if err != nil {
		code := 5001
		if err == service.ErrLineGroupNotFound {
			code = 3002
		} else if err == service.ErrOriginGroupRequired {
			code = 2002
		} else if err == service.ErrOriginAddressesRequired {
			code = 2003
		} else if err == service.ErrNoPrimaryDomain {
			code = 2004
		}

		response.Error(c, code, err.Error())
		return
	}

	response.Success(c, resp)
}

// UpdateWebsite godoc
// @Summary Update website
// @Description Update website configuration
// @Tags websites
// @Accept json
// @Produce json
// @Param id path int true "Website ID"
// @Param request body service.UpdateWebsiteRequest true "Update website request"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Security BearerAuth
// @Router /api/v1/websites/update [post]
func (h *WebsiteHandler) UpdateWebsite(c *gin.Context) {
var req struct {
ID int `json:"id" binding:"required"`
service.UpdateWebsiteRequest
}

if err := c.ShouldBindJSON(&req); err != nil {
	response.Error(c, response.CodeValidationFailed, err.Error())
return
}

err := h.websiteService.UpdateWebsite(req.ID, req.UpdateWebsiteRequest)
if err != nil {
if err == service.ErrWebsiteNotFound {
	response.NotFoundError(c, "website not found")
return
}
	response.Error(c, response.CodeSystemError, err.Error())
return
}

	response.Success(c, nil)
}

// DeleteWebsite godoc
// @Summary Delete website
// @Description Delete a website and all related data
// @Tags websites
// @Accept json
// @Produce json
// @Param request body map[string]int true "Delete website request"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Security BearerAuth
// @Router /api/v1/websites/delete [post]
func (h *WebsiteHandler) DeleteWebsite(c *gin.Context) {
var req struct {
ID int `json:"id" binding:"required"`
}

if err := c.ShouldBindJSON(&req); err != nil {
response.Error(c, response.CodeValidationFailed, err.Error())
return
}

err := h.websiteService.DeleteWebsite(req.ID)
if err != nil {
if err == service.ErrWebsiteNotFound {
response.NotFoundError(c, "website not found")
return
}
response.Error(c, response.CodeSystemError, err.Error())
return
}

	response.Success(c, nil)
}

// ManageDomains godoc
// @Summary Manage website domains
// @Description Add or remove domains from a website
// @Tags websites
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Manage domains request"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Security BearerAuth
// @Router /api/v1/websites/domains/manage [post]
func (h *WebsiteHandler) ManageDomains(c *gin.Context) {
var req struct {
WebsiteID int    `json:"website_id" binding:"required"`
Action    string `json:"action" binding:"required,oneof=add remove"`
Domain    string `json:"domain" binding:"required"`
IsPrimary bool   `json:"is_primary"`
}

if err := c.ShouldBindJSON(&req); err != nil {
c.JSON(http.StatusBadRequest, Response{
Code:    2001,
Message: err.Error(),
Data:    nil,
})
return
}

var err error
if req.Action == "add" {
err = h.websiteService.AddDomain(req.WebsiteID, req.Domain, req.IsPrimary)
} else {
err = h.websiteService.RemoveDomain(req.WebsiteID, req.Domain)
}

if err != nil {
code := 5001
if err == service.ErrWebsiteNotFound {
code = 3001
} else if err == service.ErrDomainAlreadyExists {
code = 3002
}

response.Error(c, code, err.Error())
return
}

response.Success(c, nil)
}

// ClearCache godoc
// @Summary Clear website cache
// @Description Create agent tasks to clear cache for specified websites
// @Tags websites
// @Accept json
// @Produce json
// @Param request body service.ClearCacheRequest true "Clear cache request"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Security BearerAuth
// @Router /api/v1/websites/clear-cache [post]
func (h *WebsiteHandler) ClearCache(c *gin.Context) {
var req service.ClearCacheRequest
if err := c.ShouldBindJSON(&req); err != nil {
c.JSON(http.StatusBadRequest, Response{
Code:    2001,
Message: err.Error(),
Data:    nil,
})
return
}

err := h.websiteService.ClearCache(req)
if err != nil {
c.JSON(http.StatusInternalServerError, Response{
Code:    5001,
Message: err.Error(),
Data:    nil,
})
return
}

c.JSON(http.StatusOK, Response{
Code:    0,
Message: "success",
Data:    nil,
})
}
