package cmd

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"
	"syscall"

	"github.com/cdn-control-panel/backend/internal/config"
	"github.com/cdn-control-panel/backend/internal/database"
	"github.com/cdn-control-panel/backend/internal/models"
	"github.com/cdn-control-panel/backend/internal/utils"
	"github.com/spf13/cobra"
	"golang.org/x/term"
)

var (
	username string
	password string
	role     string
	force    bool
)

// createAdminCmd represents the create-admin command
var createAdminCmd = &cobra.Command{
	Use:   "create-admin",
	Short: "创建管理员账号",
	Long: `创建一个新的管理员账号或更新现有账号的密码。

如果不提供用户名和密码参数，将以交互式方式提示输入。
密码输入时不会显示在屏幕上，确保安全。

示例:
  cdn-control create-admin
  cdn-control create-admin --username admin --password admin123
  cdn-control create-admin -u admin -p admin123 --role admin
  cdn-control create-admin --force  # 强制更新已存在的用户`,
	Run: func(cmd *cobra.Command, args []string) {
		runCreateAdmin()
	},
}

func init() {
	rootCmd.AddCommand(createAdminCmd)

	createAdminCmd.Flags().StringVarP(&username, "username", "u", "", "用户名")
	createAdminCmd.Flags().StringVarP(&password, "password", "p", "", "密码")
	createAdminCmd.Flags().StringVarP(&role, "role", "r", "admin", "角色 (admin/user)")
	createAdminCmd.Flags().BoolVarP(&force, "force", "f", false, "强制更新已存在的用户")
}

func runCreateAdmin() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	if err := database.Connect(cfg.Database.GetDSN()); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("================================")
	fmt.Println("创建管理员账号")
	fmt.Println("================================")
	fmt.Println()

	// Get username
	if username == "" {
		username = promptInput("请输入用户名 [admin]: ")
		if username == "" {
			username = "admin"
		}
	}

	// Get password
	if password == "" {
		password = promptPassword("请输入密码: ")
		if password == "" {
			log.Fatal("密码不能为空")
		}

		// Confirm password
		confirmPassword := promptPassword("请再次输入密码: ")
		if password != confirmPassword {
			log.Fatal("两次输入的密码不一致")
		}
	}

	// Validate role
	if role != "admin" && role != "user" {
		log.Fatalf("无效的角色: %s (必须是 admin 或 user)", role)
	}

	// Check if user exists
	var existingUser models.User
	err = database.DB.Where("username = ?", username).First(&existingUser).Error

	if err == nil {
		// User exists
		if !force {
			fmt.Printf("\n用户 '%s' 已存在\n", username)
			if !promptConfirm("是否更新密码？") {
				fmt.Println("操作已取消")
				return
			}
		}

		// Update password
		passwordHash := utils.HashPassword(password)
		existingUser.PasswordHash = passwordHash
		existingUser.Role = role

		if err := database.DB.Save(&existingUser).Error; err != nil {
			log.Fatalf("更新用户失败: %v", err)
		}

		fmt.Println()
		fmt.Println("✓ 用户密码已更新")
	} else {
		// Create new user
		passwordHash := utils.HashPassword(password)

		user := models.User{
			Username:     username,
			PasswordHash: passwordHash,
			Role:         role,
			Status:       "active",
		}

		if err := database.DB.Create(&user).Error; err != nil {
			log.Fatalf("创建用户失败: %v", err)
		}

		fmt.Println()
		fmt.Println("✓ 管理员账号创建成功")
	}

	// Display info
	fmt.Println()
	fmt.Println("================================")
	fmt.Println("账号信息")
	fmt.Println("================================")
	fmt.Printf("用户名: %s\n", username)
	fmt.Printf("密码:   %s\n", password)
	fmt.Printf("角色:   %s\n", role)
	fmt.Println()

	// Display test command
	fmt.Println("测试登录:")
	fmt.Printf("  curl -X POST http://localhost:8080/api/v1/auth/login \\\n")
	fmt.Printf("    -H 'Content-Type: application/json' \\\n")
	fmt.Printf("    -d '{\"username\":\"%s\",\"password\":\"%s\"}'\n", username, password)
	fmt.Println()
}

// promptInput prompts for input from stdin
func promptInput(prompt string) string {
	fmt.Print(prompt)
	reader := bufio.NewReader(os.Stdin)
	input, _ := reader.ReadString('\n')
	return strings.TrimSpace(input)
}

// promptPassword prompts for password input without echoing
func promptPassword(prompt string) string {
	fmt.Print(prompt)
	bytePassword, err := term.ReadPassword(int(syscall.Stdin))
	fmt.Println()
	if err != nil {
		log.Fatalf("读取密码失败: %v", err)
	}
	return string(bytePassword)
}

// promptConfirm prompts for yes/no confirmation
func promptConfirm(prompt string) bool {
	fmt.Printf("%s (y/n): ", prompt)
	reader := bufio.NewReader(os.Stdin)
	input, _ := reader.ReadString('\n')
	input = strings.TrimSpace(strings.ToLower(input))
	return input == "y" || input == "yes"
}
