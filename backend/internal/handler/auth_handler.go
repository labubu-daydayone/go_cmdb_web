package handler

import (
	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// LoginRequest represents login request
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents login response
type LoginResponse struct {
	Token string `json:"token"`
}

// Login godoc
// @Summary 用户登录
// @Description 使用用户名和密码登录，返回JWT token
// @Tags 认证
// @Accept json
// @Produce json
// @Param request body LoginRequest true "登录请求"
// @Success 200 {object} response.Response{data=LoginResponse} "登录成功"
// @Failure 400 {object} response.Response "参数错误"
// @Failure 401 {object} response.Response "用户名或密码错误"
// @Failure 500 {object} response.Response "系统错误"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "Invalid request parameters")
		return
	}

	token, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		if err == service.ErrInvalidCredentials {
			response.Error(c, response.CodeAuthInvalidCredentials, "Invalid username or password")
		} else {
			response.SystemError(c, "Login failed")
		}
		return
	}

	response.Success(c, LoginResponse{Token: token})
}
