#!/bin/bash

# 创建管理员账号脚本
# 用法: ./create_admin.sh [username] [password]

set -e

# 默认值
DEFAULT_USERNAME="admin"
DEFAULT_PASSWORD="admin123"

# 从参数获取或使用默认值
USERNAME="${1:-$DEFAULT_USERNAME}"
PASSWORD="${2:-$DEFAULT_PASSWORD}"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}创建管理员账号${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""

# 检查环境变量
if [ -z "$DB_HOST" ]; then
    echo -e "${YELLOW}未设置环境变量，从.env文件加载...${NC}"
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo -e "${RED}错误: 找不到.env文件${NC}"
        echo "请先创建.env文件或设置环境变量"
        exit 1
    fi
fi

# 数据库连接信息
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD}"
DB_NAME="${DB_NAME:-cdn_control}"

echo "数据库连接信息:"
echo "  主机: $DB_HOST:$DB_PORT"
echo "  数据库: $DB_NAME"
echo "  用户: $DB_USER"
echo ""

echo "管理员账号信息:"
echo "  用户名: $USERNAME"
echo "  密码: $PASSWORD"
echo ""

# 计算密码哈希（使用SHA256）
PASSWORD_HASH=$(echo -n "$PASSWORD" | sha256sum | awk '{print $1}')

# 构建MySQL命令
MYSQL_CMD="mysql -h$DB_HOST -P$DB_PORT -u$DB_USER"
if [ -n "$DB_PASSWORD" ]; then
    MYSQL_CMD="$MYSQL_CMD -p$DB_PASSWORD"
fi
MYSQL_CMD="$MYSQL_CMD $DB_NAME"

# 检查数据库连接
echo -e "${YELLOW}检查数据库连接...${NC}"
if ! echo "SELECT 1;" | $MYSQL_CMD > /dev/null 2>&1; then
    echo -e "${RED}错误: 无法连接到数据库${NC}"
    echo "请检查数据库配置和连接信息"
    exit 1
fi
echo -e "${GREEN}✓ 数据库连接成功${NC}"
echo ""

# 检查用户是否已存在
echo -e "${YELLOW}检查用户是否已存在...${NC}"
USER_EXISTS=$(echo "SELECT COUNT(*) FROM users WHERE username='$USERNAME';" | $MYSQL_CMD -N)

if [ "$USER_EXISTS" -gt 0 ]; then
    echo -e "${YELLOW}用户 '$USERNAME' 已存在${NC}"
    read -p "是否更新密码? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SQL="UPDATE users SET password_hash='$PASSWORD_HASH', updated_at=NOW() WHERE username='$USERNAME';"
        echo "$SQL" | $MYSQL_CMD
        echo -e "${GREEN}✓ 密码已更新${NC}"
    else
        echo "操作已取消"
        exit 0
    fi
else
    # 创建新用户
    echo -e "${YELLOW}创建新管理员账号...${NC}"
    SQL="INSERT INTO users (username, password_hash, role, status, created_at, updated_at, last_signed_in) 
         VALUES ('$USERNAME', '$PASSWORD_HASH', 'admin', 'active', NOW(), NOW(), NOW());"
    
    if echo "$SQL" | $MYSQL_CMD; then
        echo -e "${GREEN}✓ 管理员账号创建成功${NC}"
    else
        echo -e "${RED}✗ 创建失败${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}完成！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "您现在可以使用以下信息登录:"
echo "  用户名: $USERNAME"
echo "  密码: $PASSWORD"
echo ""
echo "测试登录:"
echo "  curl -X POST http://localhost:8080/api/v1/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}'"
echo ""
