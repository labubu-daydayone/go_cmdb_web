package database

import (
	"fmt"
	"log"

	"github.com/cdn-control-panel/backend/internal/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}

// Connect initializes database connection
func Connect(dsn string) error {
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connected successfully")
	return nil
}

// AutoMigrate runs automatic migration for all models
func AutoMigrate() error {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		// User and API Keys
		&models.User{},
		&models.APIKey{},

		// DNS
		&models.Domain{},
		&models.DomainDNSProvider{},
		&models.DomainDNSRecord{},

		// Nodes
		&models.Node{},
		&models.NodeSubIP{},
		&models.NodeGroup{},
		&models.NodeGroupSubIP{},
		&models.LineGroup{},

		// Origin
		&models.OriginGroup{},
		&models.OriginGroupAddress{},
		&models.OriginSet{},
		&models.OriginAddress{},

		// Cache
		&models.CacheRule{},
		&models.CacheRuleItem{},

		// Certificate and ACME
		&models.ACMEProvider{},
		&models.ACMEAccount{},
		&models.CertificateRequest{},
		&models.Certificate{},
		&models.CertificateDomain{},
		&models.CertificateBinding{},

		// Website
		&models.Website{},
		&models.WebsiteDomain{},
		&models.WebsiteHTTPS{},

		// System
		&models.AgentTask{},
		&models.ConfigVersion{},
	)

	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Add unique constraints that GORM might not handle automatically
	if err := addUniqueConstraints(); err != nil {
		return fmt.Errorf("failed to add unique constraints: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// addUniqueConstraints adds unique constraints that require multiple columns
func addUniqueConstraints() error {
	// node_sub_ips: unique(node_id, ip)
	if err := DB.Exec(`
		ALTER TABLE node_sub_ips 
		ADD UNIQUE INDEX idx_node_sub_ips_unique (node_id, ip)
	`).Error; err != nil {
		// Ignore if already exists
		log.Printf("Warning: Could not add unique constraint on node_sub_ips: %v", err)
	}

	// node_group_sub_ips: unique(node_group_id, sub_ip_id)
	if err := DB.Exec(`
		ALTER TABLE node_group_sub_ips 
		ADD UNIQUE INDEX idx_node_group_sub_ips_unique (node_group_id, sub_ip_id)
	`).Error; err != nil {
		log.Printf("Warning: Could not add unique constraint on node_group_sub_ips: %v", err)
	}

	// origin_group_addresses: unique(origin_group_id, role, protocol, address)
	if err := DB.Exec(`
		ALTER TABLE origin_group_addresses 
		ADD UNIQUE INDEX idx_origin_group_addresses_unique (origin_group_id, role, protocol, address)
	`).Error; err != nil {
		log.Printf("Warning: Could not add unique constraint on origin_group_addresses: %v", err)
	}

	// origin_addresses: unique(origin_set_id, role, protocol, address, weight)
	if err := DB.Exec(`
		ALTER TABLE origin_addresses 
		ADD UNIQUE INDEX idx_origin_addresses_unique (origin_set_id, role, protocol, address, weight)
	`).Error; err != nil {
		log.Printf("Warning: Could not add unique constraint on origin_addresses: %v", err)
	}

	// cache_rule_items: unique(cache_rule_id, rule_type, path)
	if err := DB.Exec(`
		ALTER TABLE cache_rule_items 
		ADD UNIQUE INDEX idx_cache_rule_items_unique (cache_rule_id, rule_type, path)
	`).Error; err != nil {
		log.Printf("Warning: Could not add unique constraint on cache_rule_items: %v", err)
	}

	// certificate_domains: unique(certificate_id, domain)
	if err := DB.Exec(`
		ALTER TABLE certificate_domains 
		ADD UNIQUE INDEX idx_certificate_domains_unique (certificate_id, domain)
	`).Error; err != nil {
		log.Printf("Warning: Could not add unique constraint on certificate_domains: %v", err)
	}

	// certificate_bindings: unique(bind_type, bind_id, is_active)
	// R17: Ensure only one active binding per website
	if err := DB.Exec(`
		ALTER TABLE certificate_bindings 
		ADD UNIQUE INDEX idx_certificate_bindings_unique (bind_type, bind_id, is_active)
	`).Error; err != nil {
		log.Printf("Warning: Could not add unique constraint on certificate_bindings: %v", err)
	}

	// domain_dns_records: unique(domain_id, type, name, value, owner_type, owner_id)
	if err := DB.Exec(`
		ALTER TABLE domain_dns_records 
		ADD UNIQUE INDEX idx_domain_dns_records_unique (domain_id, type, name, value(255), owner_type, owner_id)
	`).Error; err != nil {
		log.Printf("Warning: Could not add unique constraint on domain_dns_records: %v", err)
	}

	return nil
}

// SeedDefaultData inserts default data for development
func SeedDefaultData() error {
	log.Println("Seeding default data...")

	// Seed default ACME providers
	acmeProviders := []models.ACMEProvider{
		{
			Name:         "letsencrypt",
			DirectoryURL: "https://acme-v02.api.letsencrypt.org/directory",
			RequiresEAB:  false,
			Status:       "active",
		},
		{
			Name:         "google_publicca",
			DirectoryURL: "https://dv.acme-v02.api.pki.goog/directory",
			RequiresEAB:  true,
			Status:       "active",
		},
	}

	for _, provider := range acmeProviders {
		var existing models.ACMEProvider
		if err := DB.Where("name = ?", provider.Name).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := DB.Create(&provider).Error; err != nil {
					return fmt.Errorf("failed to seed ACME provider %s: %w", provider.Name, err)
				}
				log.Printf("Seeded ACME provider: %s", provider.Name)
			}
		}
	}

	log.Println("Default data seeded successfully")
	return nil
}
