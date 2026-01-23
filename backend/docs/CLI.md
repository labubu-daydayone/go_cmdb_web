# 命令行工具文档

CDN Control Panel 使用 [Cobra](https://github.com/spf13/cobra) 框架提供强大的命令行工具。

## 安装

```bash
# 方式1: 直接运行（开发环境）
go run cmd/main.go [command]

# 方式2: 编译后使用
go build -o cdn-control cmd/main.go
./cdn-control [command]

# 方式3: 使用Makefile
make build
./bin/cdn-control [command]
```

## 命令概览

```bash
cdn-control [command] [flags]
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `serve` | 启动API服务器 |
| `migrate` | 运行数据库迁移 |
| `create-admin` | 创建管理员账号 |
| `help` | 查看帮助信息 |

## 命令详解

### serve - 启动服务器

启动CDN Control Panel API服务器。

**用法**:
```bash
cdn-control serve [flags]
```

**标志**:
- `--host string`: 服务器监听主机 (默认 "0.0.0.0")
- `--port string`: 服务器监听端口 (默认 "8080")
- `--config string`: 配置文件路径 (默认 ".env")

**示例**:
```bash
# 使用默认配置启动
cdn-control serve

# 指定主机和端口
cdn-control serve --host 127.0.0.1 --port 9000

# 使用自定义配置文件
cdn-control serve --config /path/to/.env
```

**Makefile快捷方式**:
```bash
make run
```

---

### migrate - 数据库迁移

运行数据库迁移，创建或更新数据库表结构。

**用法**:
```bash
cdn-control migrate [flags]
```

**标志**:
- `--seed`: 同时填充种子数据
- `--config string`: 配置文件路径 (默认 ".env")

**示例**:
```bash
# 仅运行迁移
cdn-control migrate

# 迁移并填充种子数据
cdn-control migrate --seed

# 使用自定义配置文件
cdn-control migrate --config /path/to/.env
```

**Makefile快捷方式**:
```bash
make migrate        # 仅迁移
make seed           # 迁移+种子
make migrate-seed   # 迁移+种子（同上）
```

**种子数据内容**:
- ACME提供商（Let's Encrypt、Google Public CA）

---

### create-admin - 创建管理员账号

创建一个新的管理员账号或更新现有账号的密码。

**用法**:
```bash
cdn-control create-admin [flags]
```

**标志**:
- `-u, --username string`: 用户名
- `-p, --password string`: 密码
- `-r, --role string`: 角色 (admin/user，默认 "admin")
- `-f, --force`: 强制更新已存在的用户
- `--config string`: 配置文件路径 (默认 ".env")

**示例**:

#### 交互式创建（推荐）
```bash
cdn-control create-admin
```

程序会提示输入：
```
================================
创建管理员账号
================================

请输入用户名 [admin]: admin
请输入密码: ********
请再次输入密码: ********

✓ 管理员账号创建成功

================================
账号信息
================================
用户名: admin
密码:   admin123
角色:   admin

测试登录:
  curl -X POST http://localhost:8080/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"username":"admin","password":"admin123"}'
```

#### 命令行参数创建
```bash
# 创建管理员账号
cdn-control create-admin --username admin --password admin123

# 简写形式
cdn-control create-admin -u admin -p admin123

# 创建普通用户
cdn-control create-admin -u user1 -p pass123 --role user

# 强制更新已存在的用户
cdn-control create-admin -u admin -p newpass --force
```

**Makefile快捷方式**:
```bash
make create-admin  # 交互式创建
```

**安全提示**:
- 交互式输入密码时不会显示在屏幕上
- 避免在命令行中直接输入密码（会被记录在shell历史中）
- 生产环境建议使用强密码

---

### help - 查看帮助

查看命令帮助信息。

**用法**:
```bash
cdn-control help [command]
```

**示例**:
```bash
# 查看所有命令
cdn-control help

# 查看特定命令的帮助
cdn-control help serve
cdn-control help migrate
cdn-control help create-admin
```

---

## 全局标志

以下标志可用于所有命令：

- `--config string`: 配置文件路径 (默认 ".env")
- `-h, --help`: 查看帮助信息

**示例**:
```bash
# 使用自定义配置文件
cdn-control --config /etc/cdn-control/.env serve
cdn-control --config /etc/cdn-control/.env migrate
```

---

## 配置文件

命令行工具使用 `.env` 文件作为配置。

**配置文件位置**:
1. 当前目录的 `.env` 文件
2. 通过 `--config` 标志指定的路径

**配置示例**:
```env
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=cdn_user
DB_PASSWORD=your_password
DB_NAME=cdn_control

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
```

详细配置说明请查看 [ENV_EXAMPLE.md](../ENV_EXAMPLE.md)

---

## 完整工作流示例

### 初始部署

```bash
# 1. 编译程序
make build

# 2. 运行数据库迁移和种子数据
./bin/cdn-control migrate --seed

# 3. 创建管理员账号
./bin/cdn-control create-admin

# 4. 启动服务器
./bin/cdn-control serve
```

### 开发环境

```bash
# 1. 运行迁移
make migrate-seed

# 2. 创建管理员账号
make create-admin

# 3. 启动开发服务器
make run
```

### Docker环境

```bash
# 1. 启动容器
docker-compose up -d

# 2. 运行迁移
docker exec cdn_control_server ./cdn-control migrate --seed

# 3. 创建管理员账号
docker exec -it cdn_control_server ./cdn-control create-admin

# 或使用一行命令（非交互式）
docker exec cdn_control_server ./cdn-control create-admin -u admin -p admin123
```

---

## 常见问题

### Q: 如何更改管理员密码？

```bash
# 使用 --force 标志强制更新
cdn-control create-admin -u admin -p new_password --force

# 或交互式更新（会提示是否更新）
cdn-control create-admin
```

### Q: 如何创建多个管理员？

```bash
cdn-control create-admin -u admin1 -p pass1
cdn-control create-admin -u admin2 -p pass2
```

### Q: 如何在脚本中自动创建账号？

```bash
# 使用命令行参数（非交互式）
cdn-control create-admin -u admin -p admin123 --force

# 或使用环境变量
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=admin123
# 然后在代码中读取环境变量
```

### Q: 配置文件找不到怎么办？

```bash
# 方式1: 确保在正确的目录运行
cd /path/to/backend
cdn-control serve

# 方式2: 使用 --config 指定路径
cdn-control --config /path/to/.env serve
```

### Q: 如何查看命令的详细帮助？

```bash
cdn-control help [command]
# 或
cdn-control [command] --help
```

---

## 与旧版本的对比

### 旧版本（使用flag）

```bash
go run cmd/server/main.go --migrate --seed
go run cmd/server/main.go
```

### 新版本（使用Cobra）

```bash
go run cmd/main.go migrate --seed
go run cmd/main.go serve
go run cmd/main.go create-admin
```

**优势**:
- ✅ 更清晰的命令结构
- ✅ 子命令支持
- ✅ 更好的帮助系统
- ✅ 交互式输入
- ✅ 命令自动补全（可扩展）
- ✅ 更易于扩展新命令

---

## 下一步

- 查看 [API文档](API.md) 了解API接口
- 查看 [部署指南](../DEPLOYMENT.md) 了解生产部署
- 查看 [快速开始](../QUICKSTART.md) 了解开发流程
