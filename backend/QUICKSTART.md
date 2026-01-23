# Quick Start Guide

这是一个快速开始指南，帮助您在5分钟内运行CDN控制端后端系统。

## 前置要求

- Go 1.21 或更高版本
- MySQL 8.0 或更高版本
- Redis 6.0+ (可选，用于Worker)

## 步骤1: 安装依赖

```bash
cd go-backend
go mod download
```

## 步骤2: 配置环境变量

创建 `.env` 文件（参考 `ENV_EXAMPLE.md`）：

```bash
cat > .env << EOF
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cdn_control

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=your-super-secret-jwt-key-change-this
EOF
```

## 步骤3: 创建数据库

```bash
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS cdn_control CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
```

## 步骤4: 运行数据库迁移

```bash
go run cmd/server/main.go --migrate --seed
```

这将：
- 创建所有27张数据表
- 插入默认的ACME提供商（Let's Encrypt和Google Public CA）

## 步骤5: 创建初始管理员用户

```bash
# 使用Go代码创建用户
go run cmd/server/main.go --create-admin
```

或者直接在MySQL中插入：

```sql
INSERT INTO users (username, password_hash, role, status) 
VALUES ('admin', SHA2('admin123', 256), 'admin', 'active');
```

## 步骤6: 启动服务器

```bash
go run cmd/server/main.go
```

服务器将在 `http://localhost:8080` 启动。

## 步骤7: 测试API

### 登录获取Token

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

响应示例：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 使用Token访问受保护的API

```bash
TOKEN="your-jwt-token-here"

# 获取配置版本
curl -X GET http://localhost:8080/api/v1/config/version \
  -H "Authorization: Bearer $TOKEN"

# 列出节点分组
curl -X GET http://localhost:8080/api/v1/node-groups \
  -H "Authorization: Bearer $TOKEN"
```

## 已实现的API端点

### 认证
- `POST /api/v1/auth/login` - 用户登录

### 节点分组
- `GET /api/v1/node-groups` - 列出所有节点分组
- `POST /api/v1/node-groups/create` - 创建节点分组
- `POST /api/v1/node-groups/delete` - 删除节点分组

### 线路分组
- `GET /api/v1/line-groups` - 列出所有线路分组
- `POST /api/v1/line-groups/create` - 创建线路分组
- `POST /api/v1/line-groups/delete` - 删除线路分组

### 配置版本
- `GET /api/v1/config/version` - 获取最新配置版本

## 下一步

1. **完善其他API模块**：参考 `todo.md` 查看待实现的功能
2. **实现DNS Worker**：异步同步DNS记录到Cloudflare
3. **实现ACME Worker**：自动申请和续期SSL证书
4. **添加单元测试**：确保代码质量
5. **部署到生产环境**：使用Docker或直接编译部署

## 开发模式

```bash
# 使用热重载（需要安装air）
go install github.com/cosmtrek/air@latest
air

# 或者使用go run
go run cmd/server/main.go
```

## 生产部署

```bash
# 编译
go build -o cdn-control-server cmd/server/main.go

# 运行
./cdn-control-server
```

## 故障排除

### 数据库连接失败
- 检查MySQL是否运行：`systemctl status mysql`
- 验证数据库凭证是否正确
- 确保数据库已创建：`SHOW DATABASES;`

### 端口已被占用
- 修改 `.env` 中的 `SERVER_PORT`
- 或者停止占用端口的进程

### JWT验证失败
- 确保 `JWT_SECRET` 配置正确
- 检查Token是否过期（默认24小时）

## 更多信息

- 完整文档：`README.md`
- API规范：`docs/api.md`
- 数据库设计：`docs/database.md`
- 开发指南：`docs/development.md`
