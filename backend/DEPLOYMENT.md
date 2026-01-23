# CDN Control Panel - 部署配置指南

本文档详细说明如何配置MySQL、Redis以及创建管理员账号。

## 目录

- [方式1: 使用Docker Compose（推荐）](#方式1-使用docker-compose推荐)
- [方式2: 手动安装配置](#方式2-手动安装配置)
- [创建管理员账号](#创建管理员账号)
- [验证部署](#验证部署)
- [常见问题](#常见问题)

---

## 方式1: 使用Docker Compose（推荐）

这是最简单的部署方式，一键启动MySQL、Redis和应用服务器。

### 步骤1: 准备配置文件

确保已有`docker-compose.yml`文件（项目已包含）。

### 步骤2: 启动服务

```bash
cd backend
docker-compose up -d
```

这将启动：
- **MySQL 8.0** (端口3306)
- **Redis 7** (端口6379)
- **CDN Control Server** (端口8080)

### 步骤3: 等待服务就绪

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

等待MySQL完成初始化（约10-30秒）。

### 步骤4: 运行数据库迁移

```bash
# 进入应用容器
docker exec -it cdn_control_server sh

# 运行迁移和种子数据
./cdn-control-server --migrate --seed

# 退出容器
exit
```

### 步骤5: 创建管理员账号

```bash
# 方式A: 使用脚本（推荐）
docker exec -it cdn_mysql mysql -ucdn_user -pcdn_pass cdn_control < backend/scripts/create_admin.sql

# 方式B: 手动执行SQL
docker exec -it cdn_mysql mysql -ucdn_user -pcdn_pass cdn_control -e \
  "INSERT INTO users (username, password_hash, role, status, created_at, updated_at, last_signed_in) 
   VALUES ('admin', SHA2('admin123', 256), 'admin', 'active', NOW(), NOW(), NOW());"
```

### Docker Compose配置说明

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123      # root密码
      MYSQL_DATABASE: cdn_control       # 数据库名
      MYSQL_USER: cdn_user              # 应用用户
      MYSQL_PASSWORD: cdn_pass          # 应用密码
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql       # 数据持久化

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data                # 数据持久化

  app:
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: cdn_user
      DB_PASSWORD: cdn_pass
      DB_NAME: cdn_control
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: your-super-secret-jwt-key
```

### 停止和清理

```bash
# 停止服务
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止并删除容器和数据卷（⚠️ 会删除所有数据）
docker-compose down -v
```

---

## 方式2: 手动安装配置

如果不使用Docker，可以手动安装MySQL和Redis。

### 安装MySQL 8.0

#### Ubuntu/Debian

```bash
# 更新包列表
sudo apt update

# 安装MySQL
sudo apt install mysql-server -y

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置（可选）
sudo mysql_secure_installation
```

#### CentOS/RHEL

```bash
# 安装MySQL仓库
sudo yum install mysql-server -y

# 启动MySQL服务
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 获取临时root密码
sudo grep 'temporary password' /var/log/mysqld.log
```

#### macOS

```bash
# 使用Homebrew安装
brew install mysql

# 启动MySQL
brew services start mysql
```

### 配置MySQL

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE cdn_control CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建应用用户
CREATE USER 'cdn_user'@'localhost' IDENTIFIED BY 'your_secure_password';
CREATE USER 'cdn_user'@'%' IDENTIFIED BY 'your_secure_password';

# 授权
GRANT ALL PRIVILEGES ON cdn_control.* TO 'cdn_user'@'localhost';
GRANT ALL PRIVILEGES ON cdn_control.* TO 'cdn_user'@'%';
FLUSH PRIVILEGES;

# 退出
EXIT;
```

### 安装Redis

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install redis-server -y

# 启动Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 测试连接
redis-cli ping
```

#### CentOS/RHEL

```bash
sudo yum install redis -y

# 启动Redis
sudo systemctl start redis
sudo systemctl enable redis
```

#### macOS

```bash
brew install redis
brew services start redis
```

### 配置Redis（可选）

编辑Redis配置文件：

```bash
# Ubuntu/Debian
sudo nano /etc/redis/redis.conf

# CentOS/RHEL
sudo nano /etc/redis.conf
```

推荐配置：

```conf
# 绑定地址（生产环境建议只绑定127.0.0.1）
bind 127.0.0.1

# 设置密码（推荐）
requirepass your_redis_password

# 持久化
save 900 1
save 300 10
save 60 10000
```

重启Redis使配置生效：

```bash
sudo systemctl restart redis
```

### 配置应用环境变量

创建`.env`文件：

```bash
cd backend
cat > .env << EOF
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=cdn_user
DB_PASSWORD=your_secure_password
DB_NAME=cdn_control

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
EOF
```

### 运行数据库迁移

```bash
cd backend

# 下载依赖
go mod download

# 运行迁移和种子数据
go run cmd/server/main.go --migrate --seed
```

---

## 创建管理员账号

提供了三种方式创建管理员账号。

### 方式1: 使用Shell脚本（推荐）

```bash
cd backend/scripts

# 使用默认账号（admin/admin123）
./create_admin.sh

# 或指定自定义账号
./create_admin.sh myusername mypassword
```

脚本会：
- 自动读取`.env`配置
- 检查数据库连接
- 检查用户是否已存在
- 创建新用户或更新密码
- 显示登录测试命令

### 方式2: 直接执行SQL

```bash
# 登录MySQL
mysql -u cdn_user -p cdn_control

# 执行SQL
INSERT INTO users (username, password_hash, role, status, created_at, updated_at, last_signed_in) 
VALUES ('admin', SHA2('admin123', 256), 'admin', 'active', NOW(), NOW(), NOW());

# 退出
EXIT;
```

### 方式3: 使用Go程序（TODO）

未来版本将提供Go命令行工具：

```bash
# 计划中的功能
go run cmd/server/main.go --create-admin --username=admin --password=admin123
```

### 密码哈希说明

系统使用SHA256哈希存储密码。如果需要手动计算密码哈希：

```bash
# Linux/macOS
echo -n "your_password" | sha256sum

# 或使用MySQL
mysql -e "SELECT SHA2('your_password', 256);"
```

---

## 验证部署

### 1. 检查服务状态

```bash
# 检查MySQL
mysql -u cdn_user -p -e "SELECT VERSION();"

# 检查Redis
redis-cli ping

# 检查应用服务器
curl http://localhost:8080/health
```

### 2. 测试API

```bash
# 登录获取Token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# 应该返回类似：
# {
#   "code": 0,
#   "message": "success",
#   "data": {
#     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
#   }
# }
```

### 3. 使用测试脚本

```bash
cd backend
./test_api.sh
```

---

## 常见问题

### Q1: 无法连接到MySQL

**错误**: `Error 2002: Can't connect to local MySQL server`

**解决方案**:
```bash
# 检查MySQL是否运行
sudo systemctl status mysql

# 启动MySQL
sudo systemctl start mysql

# 检查端口
netstat -tlnp | grep 3306
```

### Q2: 密码认证失败

**错误**: `Access denied for user 'cdn_user'@'localhost'`

**解决方案**:
```bash
# 重置用户密码
mysql -u root -p
ALTER USER 'cdn_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Q3: Redis连接失败

**错误**: `Could not connect to Redis`

**解决方案**:
```bash
# 检查Redis是否运行
sudo systemctl status redis

# 测试连接
redis-cli ping

# 如果设置了密码
redis-cli -a your_password ping
```

### Q4: 数据库迁移失败

**错误**: `Error 1050: Table already exists`

**解决方案**:
```bash
# 删除所有表重新迁移（⚠️ 会丢失数据）
mysql -u cdn_user -p cdn_control -e "DROP DATABASE cdn_control; CREATE DATABASE cdn_control;"
go run cmd/server/main.go --migrate --seed
```

### Q5: 端口被占用

**错误**: `bind: address already in use`

**解决方案**:
```bash
# 查找占用端口的进程
sudo lsof -i :8080

# 杀死进程
sudo kill -9 <PID>

# 或修改.env中的SERVER_PORT
```

### Q6: JWT Token验证失败

**错误**: `Invalid token`

**解决方案**:
- 确保`.env`中的`JWT_SECRET`没有改变
- Token有效期为24小时，过期需要重新登录
- 检查请求头格式：`Authorization: Bearer <token>`

---

## 生产环境建议

### 安全配置

1. **使用强密码**
   - MySQL root密码至少16位
   - 应用用户密码至少12位
   - Redis密码至少16位
   - JWT_SECRET使用随机生成的32字节hex

2. **网络隔离**
   - MySQL只监听127.0.0.1
   - Redis只监听127.0.0.1
   - 使用防火墙限制访问

3. **SSL/TLS**
   - 启用MySQL SSL连接
   - 使用Redis TLS
   - 应用服务器使用HTTPS

### 性能优化

1. **MySQL配置**
   ```conf
   [mysqld]
   innodb_buffer_pool_size = 1G
   max_connections = 200
   query_cache_size = 64M
   ```

2. **Redis配置**
   ```conf
   maxmemory 512mb
   maxmemory-policy allkeys-lru
   ```

### 监控和备份

1. **数据库备份**
   ```bash
   # 每日备份
   mysqldump -u cdn_user -p cdn_control > backup_$(date +%Y%m%d).sql
   ```

2. **日志监控**
   ```bash
   # 查看应用日志
   tail -f /var/log/cdn-control.log
   
   # 查看MySQL慢查询
   tail -f /var/log/mysql/slow-query.log
   ```

---

## 下一步

部署完成后，您可以：

1. 阅读 [API文档](docs/API.md) 了解接口使用
2. 查看 [开发指南](README.md) 了解如何扩展功能
3. 运行 [测试脚本](test_api.sh) 验证功能
4. 开发前端管理界面

如有问题，请查看项目README或提交Issue。
