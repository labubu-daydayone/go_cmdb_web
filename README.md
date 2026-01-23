# CMDB Web System

一个完整的CMDB（配置管理数据库）Web系统，包含前端管理界面和Go后端API。

## 项目结构

```
go_cmdb_web/
├── backend/              # Go后端API系统
│   ├── cmd/             # 应用入口
│   ├── internal/        # 内部代码
│   ├── pkg/             # 公共包
│   ├── docs/            # 文档
│   ├── scripts/         # 部署脚本
│   └── README.md        # 后端详细文档
├── client/              # 前端项目（原有）
├── client-antd/         # Ant Design前端项目
└── README.md            # 本文件
```

## 快速开始

### 后端API系统

后端是一个完整的CDN控制端管理系统，使用Go语言开发。

#### 使用Docker Compose（推荐）

```bash
cd backend
docker-compose up -d

# 等待服务启动（约30秒）
sleep 30

# 运行数据库迁移
docker exec cdn_control_server ./cdn-control-server --migrate --seed

# 创建管理员账号
docker exec -it cdn_mysql mysql -ucdn_user -pcdn_pass cdn_control -e \
  "INSERT INTO users (username, password_hash, role, status, created_at, updated_at, last_signed_in) 
   VALUES ('admin', SHA2('admin123', 256), 'admin', 'active', NOW(), NOW(), NOW());"

# 测试API
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### 手动安装

详细步骤请查看：[后端部署指南](backend/DEPLOYMENT.md)

### 前端项目

前端项目的启动方式请参考原有文档。

## 核心功能

### 后端API（已实现）

- ✅ JWT认证系统
- ✅ 节点分组管理（自动生成CNAME、创建A记录）
- ✅ 线路分组管理（自动生成CNAME记录）
- ✅ 配置版本追踪（所有变更自动记录）
- ✅ 完整的数据库设计（27张表）
- ✅ Docker部署配置

### 待实现功能

- DNS记录异步同步（Worker）
- ACME证书自动申请
- 网站多域名配置
- 回源配置管理
- 缓存规则管理
- Agent任务管理

详细进度请查看 [后端TODO](backend/todo.md)

## 文档

### 后端文档

- [后端README](backend/README.md) - 后端系统总览
- [快速开始](backend/QUICKSTART.md) - 5分钟快速开始
- [部署指南](backend/DEPLOYMENT.md) - MySQL/Redis配置和管理员账号创建
- [API文档](backend/docs/API.md) - 完整的API接口文档
- [交付说明](backend/DELIVERY.md) - 项目交付内容和技术实现

### 前端文档

前端文档请参考原有项目文档。

## 技术栈

### 后端
- **语言**: Go 1.21+
- **Web框架**: Gin
- **ORM**: GORM
- **数据库**: MySQL 8.0+
- **缓存**: Redis 6.0+
- **认证**: JWT

### 前端
- **框架**: React
- **UI库**: Ant Design Pro
- **构建工具**: Vite

## API接口

### 基础信息

- **基础URL**: `http://localhost:8080/api/v1`
- **认证方式**: JWT Bearer Token
- **HTTP方法**: 仅支持GET和POST

### 已实现的接口

- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/node-groups` - 列出节点分组
- `POST /api/v1/node-groups/create` - 创建节点分组
- `POST /api/v1/node-groups/delete` - 删除节点分组
- `GET /api/v1/line-groups` - 列出线路分组
- `POST /api/v1/line-groups/create` - 创建线路分组
- `POST /api/v1/line-groups/delete` - 删除线路分组
- `GET /api/v1/config/version` - 获取配置版本

完整API文档：[API.md](backend/docs/API.md)

## 开发指南

### 后端开发

```bash
cd backend

# 安装依赖
go mod download

# 配置环境变量
cp ENV_EXAMPLE.md .env
# 编辑.env文件

# 运行迁移
make migrate-seed

# 启动开发服务器
make run
```

### 前端开发

请参考原有项目的开发指南。

## 部署

### 生产环境部署

1. **后端部署**
   ```bash
   cd backend
   make build
   ./bin/cdn-control-server
   ```

2. **使用Docker**
   ```bash
   cd backend
   docker-compose up -d
   ```

详细部署步骤：[DEPLOYMENT.md](backend/DEPLOYMENT.md)

## 贡献

欢迎提交Issue和Pull Request。

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue。

---

**注意**: 
- 后端系统已完成核心功能，可用于开发和测试
- 前端项目保持原有结构
- 详细的后端文档请查看 `backend/` 目录
