package cmd

import (
	"log"

	"github.com/cdn-control-panel/backend/internal/config"
	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/spf13/cobra"
)

var (
	seedData bool
)

// migrateCmd represents the migrate command
var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "运行数据库迁移",
	Long: `运行数据库迁移，创建或更新数据库表结构。

使用GORM的AutoMigrate功能自动创建所有表。

示例:
  cdn-control migrate
  cdn-control migrate --seed  # 同时填充种子数据`,
	Run: func(cmd *cobra.Command, args []string) {
		runMigrate()
	},
}

func init() {
	rootCmd.AddCommand(migrateCmd)

	migrateCmd.Flags().BoolVar(&seedData, "seed", false, "同时填充种子数据")
}

func runMigrate() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	if err := database.Connect(cfg.Database.GetDSN()); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Running database migrations...")

	// Run migrations
	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	log.Println("✓ Migrations completed successfully")

	// Seed data if requested
	if seedData {
		log.Println("Seeding default data...")
		if err := database.SeedDefaultData(); err != nil {
			log.Fatalf("Failed to seed default data: %v", err)
		}
		log.Println("✓ Default data seeded successfully")
	}
}
