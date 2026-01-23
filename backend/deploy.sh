#!/bin/bash

# CDN Control Panel - 服务器部署脚本
# 使用方法: bash deploy.sh

set -e  # 遇到错误立即退出

echo "================================"
echo "CDN Control Panel 部署脚本"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置变量
DEPLOY_DIR="/opt/cdn-control"
REPO_URL="https://github.com/labubu-daydayone/go_cmdb_web.git"
DB_NAME="cdn_control"
DB_USER="cdn_user"
DB_PASSWORD="cdn_pass_$(date +%s)"  # 随机密码
MYSQL_SOCKET="/data/mysql/run/mysql.sock"
JWT_SECRET=$(openssl rand -hex 32)

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}错误: 请使用root用户运行此脚本${NC}"
   exit 1
fi

echo -e "${YELLOW}步骤1: 检查环境${NC}"
echo "----------------------------------------"

# 检查Go环境
if ! command -v go &> /dev/null; then
    echo -e "${RED}错误: 未找到Go环境${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Go版本: $(go version)${NC}"

# 检查MySQL
if ! mysql -uroot -S ${MYSQL_SOCKET} -e "SELECT VERSION();" &> /dev/null; then
    echo -e "${RED}错误: 无法连接到MySQL${NC}"
    exit 1
fi
MYSQL_VERSION=$(mysql -uroot -S ${MYSQL_SOCKET} -e "SELECT VERSION();" -sN)
echo -e "${GREEN}✓ MySQL版本: ${MYSQL_VERSION}${NC}"

# 检查Redis
if ! redis-cli ping &> /dev/null; then
    echo -e "${RED}错误: 无法连接到Redis${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Redis连接正常${NC}"

# 检查Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}正在安装Git...${NC}"
    yum install -y git || apt-get install -y git
fi
echo -e "${GREEN}✓ Git已安装${NC}"

echo ""
echo -e "${YELLOW}步骤2: 克隆代码${NC}"
echo "----------------------------------------"

# 创建部署目录
if [ -d "${DEPLOY_DIR}" ]; then
    echo -e "${YELLOW}目录已存在，正在备份...${NC}"
    mv ${DEPLOY_DIR} ${DEPLOY_DIR}.backup.$(date +%Y%m%d_%H%M%S)
fi

mkdir -p ${DEPLOY_DIR}
cd ${DEPLOY_DIR}

# 克隆代码
echo "正在克隆代码仓库..."
git clone ${REPO_URL} .
cd backend

echo -e "${GREEN}✓ 代码克隆完成${NC}"

echo ""
echo -e "${YELLOW}步骤3: 配置环境变量${NC}"
echo "----------------------------------------"

# 生成.env文件
cat > .env << EOF
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_SOCKET=${MYSQL_SOCKET}

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=${JWT_SECRET}

# Cloudflare Configuration (可选)
# CLOUDFLARE_API_TOKEN=your_token_here
EOF

echo -e "${GREEN}✓ 环境变量配置完成${NC}"
echo "数据库密码: ${DB_PASSWORD}"

echo ""
echo -e "${YELLOW}步骤4: 创建数据库${NC}"
echo "----------------------------------------"

# 创建数据库和用户
mysql -uroot -S ${MYSQL_SOCKET} << MYSQL_SCRIPT
-- 创建数据库
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';

-- 授权
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;

-- 显示数据库
SHOW DATABASES LIKE '${DB_NAME}';
MYSQL_SCRIPT

echo -e "${GREEN}✓ 数据库创建完成${NC}"

echo ""
echo -e "${YELLOW}步骤5: 下载依赖${NC}"
echo "----------------------------------------"

# 设置Go代理（加速下载）
export GOPROXY=https://goproxy.cn,direct
export GO111MODULE=on

# 下载依赖
go mod download
go mod tidy

echo -e "${GREEN}✓ 依赖下载完成${NC}"

echo ""
echo -e "${YELLOW}步骤6: 运行数据库迁移${NC}"
echo "----------------------------------------"

# 运行迁移和种子数据
go run cmd/main.go migrate --seed

echo -e "${GREEN}✓ 数据库迁移完成${NC}"

echo ""
echo -e "${YELLOW}步骤7: 编译程序${NC}"
echo "----------------------------------------"

# 编译
go build -o cdn-control cmd/main.go

echo -e "${GREEN}✓ 编译完成: ./cdn-control${NC}"

echo ""
echo -e "${YELLOW}步骤8: 创建管理员账号${NC}"
echo "----------------------------------------"

# 创建管理员账号（非交互式）
./cdn-control create-admin -u admin -p admin123 --force

echo -e "${GREEN}✓ 管理员账号创建完成${NC}"

echo ""
echo -e "${YELLOW}步骤9: 创建systemd服务${NC}"
echo "----------------------------------------"

# 创建systemd服务文件
cat > /etc/systemd/system/cdn-control.service << EOF
[Unit]
Description=CDN Control Panel Backend Service
After=network.target mysql.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=${DEPLOY_DIR}/backend
ExecStart=${DEPLOY_DIR}/backend/cdn-control serve
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重载systemd
systemctl daemon-reload

echo -e "${GREEN}✓ systemd服务创建完成${NC}"

echo ""
echo "================================"
echo "部署完成！"
echo "================================"
echo ""
echo -e "${GREEN}部署信息:${NC}"
echo "  部署目录: ${DEPLOY_DIR}/backend"
echo "  数据库名: ${DB_NAME}"
echo "  数据库用户: ${DB_USER}"
echo "  数据库密码: ${DB_PASSWORD}"
echo "  管理员账号: admin"
echo "  管理员密码: admin123"
echo ""
echo -e "${GREEN}启动服务:${NC}"
echo "  systemctl start cdn-control    # 启动服务"
echo "  systemctl enable cdn-control   # 开机自启"
echo "  systemctl status cdn-control   # 查看状态"
echo ""
echo -e "${GREEN}手动启动:${NC}"
echo "  cd ${DEPLOY_DIR}/backend"
echo "  ./cdn-control serve"
echo ""
echo -e "${GREEN}测试API:${NC}"
echo "  curl -X POST http://localhost:8080/api/v1/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"username\":\"admin\",\"password\":\"admin123\"}'"
echo ""
echo -e "${GREEN}查看日志:${NC}"
echo "  journalctl -u cdn-control -f"
echo ""
echo -e "${YELLOW}重要提示:${NC}"
echo "  1. 请保存数据库密码: ${DB_PASSWORD}"
echo "  2. 请修改管理员密码: ./cdn-control create-admin -u admin -p 新密码 --force"
echo "  3. 配置文件位置: ${DEPLOY_DIR}/backend/.env"
echo ""
