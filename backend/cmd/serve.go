package cmd

import (
	"fmt"
	"log"

	"github.com/cdn-control-panel/backend/internal/config"
	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/handler"
	"github.com/cdn-control-panel/backend/internal/middleware"
	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
)

var (
	serverHost string
	serverPort string
)

// serveCmd represents the serve command
var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "启动API服务器",
	Long: `启动CDN Control Panel API服务器。

服务器将监听指定的主机和端口，提供RESTful API接口。

示例:
  cdn-control serve
  cdn-control serve --host 0.0.0.0 --port 8080`,
	Run: func(cmd *cobra.Command, args []string) {
		runServer()
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)

	serveCmd.Flags().StringVar(&serverHost, "host", "0.0.0.0", "服务器监听主机")
	serveCmd.Flags().StringVar(&serverPort, "port", "8080", "服务器监听端口")
}

func runServer() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Override with command line flags if provided
	if serverHost != "0.0.0.0" {
		cfg.Server.Host = serverHost
	}
	if serverPort != "8080" {
		cfg.Server.Port = serverPort
	}

	// Connect to database
	if err := database.Connect(cfg.Database.GetDSN()); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize services
	authService := service.NewAuthService(cfg.JWT.Secret)
	configVersionService := service.NewConfigVersionService()
	nodeGroupService := service.NewNodeGroupService(configVersionService)
	lineGroupService := service.NewLineGroupService(configVersionService)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	groupHandler := handler.NewGroupHandler(nodeGroupService, lineGroupService)
	configHandler := handler.NewConfigHandler(configVersionService)

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		// Protected routes (require JWT)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(authService))
		{
			// Node groups
			nodeGroups := protected.Group("/node-groups")
			{
				nodeGroups.GET("", groupHandler.ListNodeGroups)
				nodeGroups.POST("/create", groupHandler.CreateNodeGroup)
				nodeGroups.POST("/delete", groupHandler.DeleteNodeGroup)
			}

			// Line groups
			lineGroups := protected.Group("/line-groups")
			{
				lineGroups.GET("", groupHandler.ListLineGroups)
				lineGroups.POST("/create", groupHandler.CreateLineGroup)
				lineGroups.POST("/delete", groupHandler.DeleteLineGroup)
			}

			// Config version
			config := protected.Group("/config")
			{
				config.GET("/version", configHandler.GetVersion)
			}
		}
	}

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
