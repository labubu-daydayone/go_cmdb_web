# 配置指南速查表

本文档提供MySQL、Redis配置和管理员账号创建的快速参考。

## 目录

- [方式1: Docker Compose（最简单）](#方式1-docker-compose最简单)
- [方式2: 手动配置](#方式2-手动配置)
- [创建管理员账号](#创建管理员账号)

---

## 方式1: Docker Compose（最简单）

### 一键启动所有服务

```bash
cd backend
docker-compose up -d
```

### 运行数据库迁移

```bash
# 等待MySQL启动（约30秒）
sleep 30

# 运行迁移和种子数据
docker exec cdn_control_server ./cdn-control-server --migrate --seed
```

### 创建管理员账号

```bash
docker exec -it cdn_mysql mysql -ucdn_user -pcdn_pass cdn_control -e \
  "INSERT INTO users (username, password_hash, role, status, created_at, updated_at, last_signed_in) 
   VALUES ('admin', SHA2('admin123', 256), 'admin', 'active', NOW(), NOW(), NOW());"
```

### 测试登录

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 服务信息

- **应用服务器**: http://localhost:8080
- **MySQL**: localhost:3306
  - 数据库: `cdn_control`
  - 用户: `cdn_user`
  - 密码: `cdn_pass`
- **Redis**: localhost:6379

---

## 方式2: 手动配置

### 步骤1: 安装MySQL

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
```

#### CentOS/RHEL
```bash
sudo yum install mysql-server -y
sudo systemctl start mysqld
```

#### macOS
```bash
brew install mysql
brew services start mysql
```

### 步骤2: 配置MySQL

```bash
# 登录MySQL
mysql -u root -p

# 执行以下SQL
CREATE DATABASE cdn_control CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cdn_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cdn_control.* TO 'cdn_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 步骤3: 安装Redis

#### Ubuntu/Debian
```bash
sudo apt install redis-server -y
sudo systemctl start redis-server
```

#### CentOS/RHEL
```bash
sudo yum install redis -y
sudo systemctl start redis
```

#### macOS
```bash
brew install redis
brew services start redis
```

### 步骤4: 配置环境变量

```bash
cd backend
cat > .env << EOF
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

DB_HOST=localhost
DB_PORT=3306
DB_USER=cdn_user
DB_PASSWORD=your_password
DB_NAME=cdn_control

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=$(openssl rand -hex 32)
EOF
```

### 步骤5: 运行迁移

```bash
go mod download
go run cmd/server/main.go --migrate --seed
```

---

## 创建管理员账号

### 方式A: 使用Shell脚本（推荐）

```bash
cd backend/scripts

# 使用默认账号（admin/admin123）
./create_admin.sh

# 或指定自定义账号
./create_admin.sh myusername mypassword
```

**脚本功能**：
- ✅ 自动读取`.env`配置
- ✅ 检查数据库连接
- ✅ 检查用户是否已存在
- ✅ 创建新用户或更新密码
- ✅ 显示登录测试命令

### 方式B: 直接执行SQL

```bash
# 本地MySQL
mysql -u cdn_user -p cdn_control -e \
  "INSERT INTO users (username, password_hash, role, status, created_at, updated_at, last_signed_in) 
   VALUES ('admin', SHA2('admin123', 256), 'admin', 'active', NOW(), NOW(), NOW());"

# Docker MySQL
docker exec -it cdn_mysql mysql -ucdn_user -pcdn_pass cdn_control -e \
  "INSERT INTO users (username, password_hash, role, status, created_at, updated_at, last_signed_in) 
   VALUES ('admin', SHA2('admin123', 256), 'admin', 'active', NOW(), NOW(), NOW());"
```

### 方式C: 手动计算密码哈希

```bash
# 计算密码哈希
echo -n "your_password" | sha256sum

# 或使用MySQL
mysql -e "SELECT SHA2('your_password', 256);"

# 然后手动插入
mysql -u cdn_user -p cdn_control
INSERT INTO users (username, password_hash, role, status, created_at, updated_at, last_signed_in) 
VALUES ('admin', '你计算的哈希值', 'admin', 'active', NOW(), NOW(), NOW());
```

---

## 验证部署

### 检查服务状态

```bash
# MySQL
mysql -u cdn_user -p -e "SELECT VERSION();"

# Redis
redis-cli ping

# 应用服务器
curl http://localhost:8080/health
```

### 测试登录

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**成功响应**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 使用Token访问API

```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:8080/api/v1/config/version \
  -H "Authorization: Bearer $TOKEN"
```

---

## 常见问题

### MySQL连接失败

```bash
# 检查MySQL状态
sudo systemctl status mysql

# 启动MySQL
sudo systemctl start mysql

# 检查端口
netstat -tlnp | grep 3306
```

### Redis连接失败

```bash
# 检查Redis状态
sudo systemctl status redis

# 测试连接
redis-cli ping
```

### 密码认证失败

```bash
# 重置MySQL用户密码
mysql -u root -p
ALTER USER 'cdn_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### 端口被占用

```bash
# 查找占用进程
sudo lsof -i :8080

# 杀死进程
sudo kill -9 <PID>

# 或修改.env中的SERVER_PORT
```

---

## 快速命令参考

```bash
# Docker Compose
docker-compose up -d              # 启动所有服务
docker-compose ps                 # 查看服务状态
docker-compose logs -f            # 查看日志
docker-compose stop               # 停止服务
docker-compose down               # 停止并删除容器

# 数据库操作
make migrate                      # 运行迁移
make seed                         # 填充种子数据
make migrate-seed                 # 迁移+种子

# 应用操作
make run                          # 启动服务器
make build                        # 编译
make test                         # 运行测试
./test_api.sh                     # 测试API

# 管理员账号
./scripts/create_admin.sh         # 创建管理员
./scripts/create_admin.sh user pw # 自定义账号
```

---

## 下一步

配置完成后：

1. 查看 [API文档](docs/API.md) 了解接口使用
2. 阅读 [快速开始](QUICKSTART.md) 了解开发流程
3. 查看 [部署指南](DEPLOYMENT.md) 了解生产部署

如有问题，请查看 [DEPLOYMENT.md](DEPLOYMENT.md) 的常见问题章节。
