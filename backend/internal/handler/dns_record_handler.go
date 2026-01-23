package handler

import (
	"net/http"
	"strconv"

	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type DNSRecordHandler struct {
	recordService *service.DNSRecordService
}

func NewDNSRecordHandler(recordService *service.DNSRecordService) *DNSRecordHandler {
	return &DNSRecordHandler{
		recordService: recordService,
	}
}

// ListRecords godoc
// @Summary 获取DNS记录列表
// @Description 获取DNS记录列表，支持分页和筛选
// @Tags DNS记录
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(50)
// @Param domain_id query int false "域名ID筛选"
// @Param type query string false "记录类型筛选" Enums(A, AAAA, CNAME, TXT)
// @Param status query string false "状态筛选" Enums(pending, active, error)
// @Param owner_type query string false "所有者类型筛选" Enums(node_group, line_group, website_domain, acme_challenge)
// @Param owner_id query int false "所有者ID筛选"
// @Success 200 {object} response.Response{data=object}
// @Router /dns/records [get]
func (h *DNSRecordHandler) ListRecords(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))
	domainID, _ := strconv.Atoi(c.Query("domain_id"))
	recordType := c.Query("type")
	status := c.Query("status")
	ownerType := c.Query("owner_type")
	ownerID, _ := strconv.Atoi(c.Query("owner_id"))

	filter := service.DNSRecordFilter{
		DomainID:  domainID,
		Type:      recordType,
		Status:    status,
		OwnerType: ownerType,
		OwnerID:   ownerID,
		Page:      page,
		PageSize:  pageSize,
	}

	records, total, err := h.recordService.ListRecords(filter)
	if err != nil {
		response.Error(c, 1001, "Failed to list records: " + err.Error())
		return
	}

	response.SuccessWithPagination(c, records, total, page, pageSize)
}

// CreateRecord godoc
// @Summary 创建DNS记录
// @Description 手动创建DNS记录（status=pending）
// @Tags DNS记录
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.CreateDNSRecordRequest true "创建DNS记录请求"
// @Success 200 {object} response.Response{data=models.DomainDNSRecord}
// @Router /dns/records/create [post]
func (h *DNSRecordHandler) CreateRecord(c *gin.Context) {
	var req service.CreateDNSRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: " + err.Error())
		return
	}

	record, err := h.recordService.CreateRecord(req)
	if err != nil {
		if err == service.ErrInvalidFQDN {
			response.Error(c, 2003, "Invalid FQDN for this zone: " + err.Error())
			return
		}
		if err == service.ErrDNSRecordAlreadyExists {
			response.Error(c, 3002, "DNS record already exists: " + err.Error())
			return
		}
		if err == service.ErrDomainNotFound {
			response.Error(c, 3001, "Domain not found: " + err.Error())
			return
		}
		response.Error(c, 1001, "Failed to create record: " + err.Error())
		return
	}

	response.Success(c, record)
}

// UpdateRecord godoc
// @Summary 更新DNS记录
// @Description 更新DNS记录（将重新设置status=pending触发同步）
// @Tags DNS记录
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body object{id=int,updates=service.UpdateDNSRecordRequest} true "更新DNS记录请求"
// @Success 200 {object} response.Response
// @Router /dns/records/update [post]
func (h *DNSRecordHandler) UpdateRecord(c *gin.Context) {
	var req struct {
		ID      int                                   `json:"id" binding:"required"`
		Updates service.UpdateDNSRecordRequest `json:"updates"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: " + err.Error())
		return
	}

	if err := h.recordService.UpdateRecord(req.ID, req.Updates); err != nil {
		if err == service.ErrDNSRecordNotFound {
			response.Error(c, 3001, "DNS record not found: " + err.Error())
			return
		}
		response.Error(c, 1001, "Failed to update record: " + err.Error())
		return
	}

	response.Success(c, nil)
}

// DeleteRecord godoc
// @Summary 删除DNS记录
// @Description 删除DNS记录
// @Tags DNS记录
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body object{id=int} true "删除DNS记录请求"
// @Success 200 {object} response.Response
// @Router /dns/records/delete [post]
func (h *DNSRecordHandler) DeleteRecord(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 2001, "Invalid request: " + err.Error())
		return
	}

	if err := h.recordService.DeleteRecord(req.ID); err != nil {
		if err == service.ErrDNSRecordNotFound {
			response.Error(c, 3001, "DNS record not found: " + err.Error())
			return
		}
		response.Error(c, 1001, "Failed to delete record: " + err.Error())
		return
	}

	response.Success(c, nil)
}

// TriggerSync godoc
// @Summary 手动触发DNS同步
// @Description 手动触发DNS记录同步到Cloudflare
// @Tags DNS记录
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body object{id=int} false "触发同步请求（不传id则同步所有error记录）"
// @Success 200 {object} response.Response
// @Router /dns/records/sync [post]
func (h *DNSRecordHandler) TriggerSync(c *gin.Context) {
	var req struct {
		ID *int `json:"id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		// If no body, trigger sync for all error records
		if err := h.recordService.TriggerSync(nil); err != nil {
			response.Error(c, 1001, "Failed to trigger sync: " + err.Error())
			return
		}
		response.Success(c, map[string]interface{}{
			"message": "Triggered sync for all error records",
		})
		return
	}

	if err := h.recordService.TriggerSync(req.ID); err != nil {
		if err == service.ErrDNSRecordNotFound {
			response.Error(c, 3001, "DNS record not found: " + err.Error())
			return
		}
		response.Error(c, 1001, "Failed to trigger sync: " + err.Error())
		return
	}

	response.Success(c, map[string]interface{}{
		"message": "Sync triggered successfully",
	})
}
