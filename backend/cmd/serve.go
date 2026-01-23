package cmd

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/cdn-control-panel/backend/internal/config"
	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/handler"
	"github.com/cdn-control-panel/backend/internal/middleware"
	"github.com/cdn-control-panel/backend/internal/service"
	"github.com/cdn-control-panel/backend/internal/worker"
	_ "github.com/cdn-control-panel/backend/docs"
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
	ginSwagger "github.com/swaggo/gin-swagger"
	swaggerFiles "github.com/swaggo/files"
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
	
	// DNS services
	domainService := service.NewDomainService()
	dnsProviderService := service.NewDNSProviderService()
	dnsRecordService := service.NewDNSRecordService(domainService)
	
	// Node and API Key services
	nodeService := service.NewNodeService(configVersionService)
	apiKeyService := service.NewAPIKeyService()

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	groupHandler := handler.NewGroupHandler(nodeGroupService, lineGroupService)
	configHandler := handler.NewConfigHandler(configVersionService)
	
	// DNS handlers
	domainHandler := handler.NewDomainHandler(domainService)
	dnsProviderHandler := handler.NewDNSProviderHandler(dnsProviderService)
	dnsRecordHandler := handler.NewDNSRecordHandler(dnsRecordService)
	
	// Node and API Key handlers
	nodeHandler := handler.NewNodeHandler(nodeService)
	apiKeyHandler := handler.NewAPIKeyHandler(apiKeyService)
	
	// Start DNS sync worker
	ctx := context.Background()
	dnsSyncWorker := worker.NewDNSSyncWorker(30 * time.Second)
	go dnsSyncWorker.Start(ctx)
	log.Println("DNS sync worker started")

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

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
			
			// Domains
			domains := protected.Group("/domains")
			{
				domains.GET("", domainHandler.ListDomains)
				domains.POST("/create", domainHandler.CreateDomain)
				domains.POST("/update", domainHandler.UpdateDomain)
				domains.POST("/delete", domainHandler.DeleteDomain)
			}
			
			// DNS
			dns := protected.Group("/dns")
			{
				// DNS Providers
				dns.GET("/providers", dnsProviderHandler.ListProviders)
				dns.POST("/providers/create", dnsProviderHandler.CreateProvider)
				dns.POST("/providers/update", dnsProviderHandler.UpdateProvider)
				dns.POST("/providers/delete", dnsProviderHandler.DeleteProvider)
				
				// DNS Records
				dns.GET("/records", dnsRecordHandler.ListRecords)
				dns.POST("/records/create", dnsRecordHandler.CreateRecord)
				dns.POST("/records/update", dnsRecordHandler.UpdateRecord)
				dns.POST("/records/delete", dnsRecordHandler.DeleteRecord)
				dns.POST("/records/sync", dnsRecordHandler.TriggerSync)
			}
			
			// API Keys
			apiKeys := protected.Group("/api-keys")
			{
				apiKeys.GET("", apiKeyHandler.ListAPIKeys)
				apiKeys.POST("/create", apiKeyHandler.CreateAPIKey)
				apiKeys.POST("/update", apiKeyHandler.UpdateAPIKey)
				apiKeys.POST("/delete", apiKeyHandler.DeleteAPIKey)
			}
			
			// Nodes
			nodes := protected.Group("/nodes")
			{
				nodes.GET("", nodeHandler.ListNodes)
				nodes.POST("/create", nodeHandler.CreateNode)
				nodes.POST("/update", nodeHandler.UpdateNode)
				nodes.POST("/delete", nodeHandler.DeleteNode)
				nodes.POST("/sub-ips/add", nodeHandler.AddSubIP)
				nodes.POST("/sub-ips/update", nodeHandler.UpdateSubIP)
				nodes.POST("/sub-ips/delete", nodeHandler.DeleteSubIP)
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
