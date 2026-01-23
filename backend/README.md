# CDN Control Panel - Go Backend

这是一个完整的CDN控制端后端系统，使用Go语言实现，提供RESTful API接口。

## 技术栈

- **语言**: Go 1.21+
- **Web框架**: Gin
- **ORM**: GORM
- **数据库**: MySQL 8.0+
- **缓存/队列**: Redis
- **认证**: JWT (Bearer Token)
- **DNS提供商**: Cloudflare
- **ACME**: go-acme (DNS-01验证)

## 项目结构

```
go-backend/
├── cmd/
│   ├── server/          # HTTP服务器入口
│   └── worker/          # Worker进程入口
├── internal/
│   ├── config/          # 配置管理
│   ├── models/          # GORM数据模型
│   ├── repository/      # 数据访问层
│   ├── service/         # 业务逻辑层
│   ├── handler/         # HTTP处理器
│   ├── middleware/      # 中间件（认证、日志等）
│   ├── worker/          # 后台任务
│   └── utils/           # 工具函数
├── pkg/
│   ├── cloudflare/      # Cloudflare API客户端
│   ├── acme/            # ACME客户端封装
│   └── response/        # 统一响应格式
├── migrations/          # 数据库迁移脚本
├── docs/                # API文档
├── go.mod
├── go.sum
└── README.md
```

## 核心功能模块

### 1. 用户认证
- JWT会话管理
- Bearer Token认证

### 2. API密钥管理
- Cloudflare凭证管理
- 多provider支持（可扩展）

### 3. DNS管理
- Zone管理（domains表）
- DNS记录异步同步机制（pending/active/error）
- 支持A/AAAA/CNAME/TXT记录类型

### 4. 节点管理
- 节点和子IP管理
- 节点分组（自动生成A记录）
- 线路分组（自动生成CNAME）

### 5. 回源配置
- 回源分组（可复用）
- 回源快照（每网站独占）
- 支持HTTP/HTTPS协议
- 主备地址和权重配置

### 6. 缓存规则
- 规则模板管理
- 支持目录/后缀/文件三种类型
- TTL和强制缓存配置

### 7. SSL证书管理
- ACME自动申请（Let's Encrypt/Google Public CA）
- DNS-01验证
- 手动上传证书
- 证书绑定到网站

### 8. 网站配置
- 多域名支持
- 回源模式（group/manual/redirect）
- HTTPS配置
- 证书绑定

### 9. 配置版本追踪
- 所有配置变更自动记录
- 版本号递增
- 变更原因记录

### 10. Agent任务管理
- 缓存清理任务
- 配置应用任务
- 任务状态追踪

## API规范

### 请求方法
- 仅支持 **GET** 和 **POST** 方法
- GET用于查询操作
- POST用于所有写操作（创建、更新、删除）

### 响应格式

**成功响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**错误响应**:
```json
{
  "code": 2001,
  "message": "参数验证失败",
  "data": null
}
```

### 错误码段
- **1000-1099**: 认证错误
- **2000-2099**: 参数验证错误
- **3000-3999**: 业务/资源错误
- **5000-5999**: 系统/依赖错误

## 核心规则

### R1: 配置版本追踪
所有影响边缘配置的写操作必须bump config_versions（插入新行，version递增）

### R2: DNS异步同步
所有DNS变更必须先写入domain_dns_records.status=pending，由worker异步同步

### R3: Handler隔离
HTTP Handler禁止直接调用Cloudflare API，必须通过service层

### R4: Worker专职
Cloudflare同步只能由dns_worker执行（读取pending/error状态）

### R5: Proxied默认关闭
Cloudflare proxied默认为0（关闭橙云）

### R9: 节点分组映射
node_group → node映射通过sub_ip反查，不新增node_group_nodes表

### R11-R13: 回源快照
- origin_set不允许复用（每个website独占）
- website变更回源必须创建新的origin_set
- origin_addresses不做全局唯一，允许重复

### R14-R18: 证书管理
- certificates表不允许存domain/san字段
- 证书覆盖域名唯一来源：certificate_domains
- certificates.fingerprint全局唯一
- 一个website只能存在一个active证书绑定

## 快速开始

### 环境要求
- Go 1.21+
- MySQL 8.0+
- Redis 6.0+

### 配置文件
复制 `.env.example` 到 `.env` 并配置：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cdn_control

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key
```

### 运行服务器
```bash
cd go-backend
go mod download
go run cmd/server/main.go
```

### 运行Worker
```bash
go run cmd/worker/main.go
```

### 数据库迁移
```bash
# 自动迁移（开发环境）
go run cmd/server/main.go --migrate

# 生产环境使用migrations/目录下的SQL脚本
mysql -u root -p cdn_control < migrations/001_initial_schema.sql
```

## 开发指南

### 添加新功能
1. 在 `internal/models/` 定义数据模型
2. 在 `internal/repository/` 实现数据访问
3. 在 `internal/service/` 实现业务逻辑
4. 在 `internal/handler/` 实现HTTP处理器
5. 在 `cmd/server/main.go` 注册路由

### 测试
```bash
# 运行所有测试
go test ./...

# 运行特定模块测试
go test ./internal/service/...
```

## API文档

启动服务器后访问：
- Swagger UI: http://localhost:8080/swagger/index.html
- OpenAPI JSON: http://localhost:8080/swagger/doc.json

## License

MIT
