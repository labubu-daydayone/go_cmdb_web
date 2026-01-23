# CDN控制面板系统

一个完整的CDN（内容分发网络）控制面板系统，提供CDN配置管理、证书管理、节点管理、DNS管理等核心功能。系统采用Go语言开发，支持边缘节点通过mTLS认证拉取配置和证书。

## 项目概述

本系统实现了完整的CDN管理功能，包括：

- **网站配置管理**: 支持多域名、回源配置、HTTPS配置、缓存规则配置
- **节点管理**: 边缘节点管理、节点分组、线路分组、流量调度
- **DNS管理**: 自动化DNS记录管理、异步同步机制、Cloudflare集成
- **证书管理**: 手动上传证书、ACME自动申请、证书自动续期
- **Agent API**: 边缘节点配置拉取、证书下载、任务管理
- **自动化Worker**: DNS同步Worker、ACME验证Worker

## 项目结构

```
go_cmdb_web/
├── backend/              # Go后端API系统（主要开发目录）
│   ├── cmd/             # 命令行入口
│   ├── internal/        # 内部代码
│   │   ├── models/     # 数据模型（15个表）
│   │   ├── service/    # 业务逻辑层（14个Service）
│   │   ├── handler/    # API处理器
│   │   ├── worker/     # 后台Worker（2个）
│   │   └── middleware/ # 中间件
│   ├── docs/           # 完整的项目文档
│   │   ├── 01-ARCHITECTURE.md    # 架构设计文档
│   │   ├── 02-FEATURES.md        # 核心功能实现文档
│   │   ├── 03-API.md             # API接口文档（48个端点）
│   │   └── 04-DEPLOYMENT.md      # 部署和运维文档
│   ├── scripts/        # 部署脚本
│   ├── Makefile        # 构建脚本
│   └── todo.md         # 任务进度追踪（197/200完成）
├── client/             # 前端项目（原有）
├── client-antd/        # Ant Design前端项目
└── README.md           # 本文件
```

## 核心特性

### 完整的工作流支持

系统实现了8个完整的工作流（WF-01到WF-08），覆盖CDN管理的所有核心场景：

- **WF-01**: 创建节点分组，自动生成CNAME和DNS记录
- **WF-02**: 创建线路分组，实现流量调度
- **WF-03**: 创建网站，整合回源、域名、HTTPS、缓存配置
- **WF-04**: 更新网站线路分组，实现流量切换
- **WF-05**: 更新回源配置，遵循Origin Set不可变原则
- **WF-06**: 手动上传证书，自动解析证书信息
- **WF-07**: ACME自动申请证书，使用DNS-01验证
- **WF-08**: 绑定证书到网站，验证域名覆盖

### 异步DNS同步机制

所有DNS记录创建时状态为pending，由DNS Sync Worker异步同步到Cloudflare。这种设计避免了DNS API故障影响主流程，提高了系统可用性和响应速度。

### ACME证书自动化

通过ACME Worker自动处理证书申请和续期，使用DNS-01验证方式支持通配符域名。系统自动扫描30天内到期的证书并触发续期流程。

### 配置版本追踪

系统维护全局配置版本号，每次配置变更都会增加版本号。边缘节点通过比较版本号判断是否需要更新配置，避免频繁的全量配置拉取。

### mTLS双向认证

边缘节点通过mTLS双向认证访问Agent API，基于客户端证书验证节点身份，确保配置和证书的安全传输。

## 技术栈

### 后端
- **语言**: Go 1.21+
- **框架**: Gin Web Framework
- **数据库**: MySQL 5.7+ / MySQL 8.0+ / TiDB 5.0+
- **ORM**: GORM
- **认证**: JWT + mTLS
- **DNS**: Cloudflare API
- **证书**: Lego ACME客户端 + Let's Encrypt

### 前端
- **框架**: React
- **UI库**: Ant Design Pro
- **构建工具**: Vite

## 快速开始

### 后端API系统

#### 前置要求

- Go 1.21+
- MySQL 5.7+ 或 MySQL 8.0+
- Cloudflare账号和API Token

#### 安装步骤

1. **克隆代码仓库**

```bash
git clone https://github.com/labubu-daydayone/go_cmdb_web.git
cd go_cmdb_web/backend
```

2. **配置环境变量**

创建`.env`文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=cdn_user
DB_PASSWORD=your_password
DB_NAME=cdn_control

# 服务器配置
SERVER_PORT=8080

# JWT配置
JWT_SECRET=your_jwt_secret_key_here

# Cloudflare配置
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# ACME配置
ACME_EMAIL=admin@example.com

# Worker配置
DNS_SYNC_WORKER_ENABLED=true
ACME_WORKER_ENABLED=true
```

3. **初始化数据库**

```sql
CREATE DATABASE cdn_control CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cdn_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cdn_control.* TO 'cdn_user'@'%';
FLUSH PRIVILEGES;
```

4. **运行服务**

```bash
# 编译并运行
make run

# 或使用Docker Compose
docker-compose up -d
```

5. **验证服务**

```bash
# 检查健康状态
curl http://localhost:8080/api/v1/health
```

### 前端项目

前端项目的启动方式请参考原有文档。

## API接口

系统提供48个RESTful API端点，详细文档请参考 [backend/docs/03-API.md](backend/docs/03-API.md)。

### 认证

管理端API使用JWT认证：

```bash
# 登录获取token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'

# 使用token访问API
curl -X GET http://localhost:8080/api/v1/websites \
  -H "Authorization: Bearer <token>"
```

### 主要接口模块

| 模块 | 接口数量 | 说明 |
|------|---------|------|
| 认证管理 | 2 | 登录、获取当前用户 |
| 域名管理 | 5 | CRUD域名zone |
| DNS记录管理 | 6 | CRUD DNS记录、重试同步 |
| 节点管理 | 5 | CRUD边缘节点 |
| 节点分组管理 | 8 | CRUD节点分组、管理子IP |
| 线路分组管理 | 5 | CRUD线路分组 |
| 回源管理 | 5 | CRUD回源分组 |
| 缓存规则管理 | 5 | CRUD缓存规则 |
| 网站管理 | 12 | CRUD网站、管理域名、更新配置、清除缓存 |
| 证书管理 | 9 | 上传证书、ACME申请、绑定解绑 |
| 配置版本管理 | 2 | 查询当前版本、版本历史 |
| Agent API | 5 | 配置拉取、证书下载、任务管理 |

## 部署指南

系统支持多种部署方式，详细文档请参考 [backend/docs/04-DEPLOYMENT.md](backend/docs/04-DEPLOYMENT.md)。

### 二进制部署

```bash
cd backend

# 编译
make build-linux

# 上传到服务器
scp bin/cdn-control-backend-linux-amd64 root@your-server:/opt/cdn-control/backend/

# 启动服务（使用systemd）
systemctl start cdn-control
```

### Docker部署

```bash
cd backend

# 使用Docker Compose启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend
```

### 当前生产环境

- **服务器**: root@20.2.140.226
- **部署路径**: /opt/cdn-control/backend/
- **二进制文件**: cdn-control-backend
- **日志**: server.log

## 完整文档

项目提供完整的技术文档，位于`backend/docs/`目录：

- **[架构设计文档](backend/docs/01-ARCHITECTURE.md)** - 系统架构、数据模型、工作流设计、认证机制、核心模块设计
- **[核心功能实现文档](backend/docs/02-FEATURES.md)** - 8个工作流详解、14个Service层实现、2个Worker实现、关键技术实现
- **[API接口文档](backend/docs/03-API.md)** - 48个API端点的完整说明、请求响应格式、错误处理、使用示例
- **[部署和运维文档](backend/docs/04-DEPLOYMENT.md)** - 部署流程、配置管理、监控日志、备份恢复、故障排查

## 项目状态

当前项目完成度：**98.50%** (197/200任务)

### 已完成功能

- ✅ 15个数据库模型和迁移
- ✅ 14个核心Service层
- ✅ 48个RESTful API端点
- ✅ 2个自动化Worker（DNS同步、ACME验证）
- ✅ 8个完整工作流（WF-01到WF-08）
- ✅ JWT和mTLS认证
- ✅ Agent API（5个端点）
- ✅ 配置版本管理系统
- ✅ 完整的项目文档（4个文档，共约20000字）

### 待完成功能

- ⏳ 单元测试（核心业务逻辑）
- ⏳ 集成测试（API端点）

详细进度请查看 [backend/todo.md](backend/todo.md)

## 开发指南

### 后端开发

```bash
cd backend

# 安装依赖
go mod download

# 运行测试
go test ./...

# 编译
make build

# 运行
make run
```

### 代码结构

系统采用分层架构设计：

- **Handler层**: 处理HTTP请求，参数验证，调用Service层
- **Service层**: 实现业务逻辑，事务管理，调用Model层
- **Model层**: 数据模型定义，数据库操作
- **Worker层**: 后台任务处理，定时扫描和执行

### 添加新功能

1. 在`internal/models/`中定义数据模型
2. 在`internal/service/`中实现业务逻辑
3. 在`internal/handler/`中实现API处理器
4. 在`cmd/serve.go`中注册路由
5. 更新API文档和todo.md

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证。

## 联系方式

- 项目主页: https://github.com/labubu-daydayone/go_cmdb_web
- 问题反馈: https://github.com/labubu-daydayone/go_cmdb_web/issues

## 致谢

感谢所有为本项目做出贡献的开发者！

---

**注意**: 
- 后端系统已完成98.50%的功能，可直接投入生产环境使用
- 完整的技术文档位于`backend/docs/`目录
- 详细的API接口文档和使用示例请参考文档
