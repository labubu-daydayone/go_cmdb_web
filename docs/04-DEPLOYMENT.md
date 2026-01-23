# CDN控制面板 - 部署和运维文档

## 概述

本文档详细说明CDN控制面板系统的部署流程、配置管理、运维监控以及故障排查方法。系统采用Go语言开发,支持Docker容器化部署和传统二进制部署两种方式。

---

## 系统要求

### 硬件要求

**最低配置**适用于开发测试环境,包括2核CPU、4GB内存、20GB磁盘空间以及100Mbps网络带宽。

**推荐配置**适用于生产环境,包括4核CPU、8GB内存、50GB磁盘空间(SSD)以及1Gbps网络带宽。

**高可用配置**适用于大规模生产环境,包括8核CPU、16GB内存、100GB磁盘空间(SSD)、10Gbps网络带宽以及多台服务器组成集群。

### 软件要求

**操作系统**支持Ubuntu 20.04/22.04 LTS、CentOS 7/8、Debian 10/11以及其他主流Linux发行版。

**数据库**要求MySQL 5.7+或MySQL 8.0+,也支持TiDB 5.0+(兼容MySQL协议)。

**Go环境**(仅编译时需要)要求Go 1.21+版本。

**Docker**(可选,用于容器化部署)要求Docker 20.10+和Docker Compose 2.0+版本。

### 外部依赖

**DNS提供商**目前支持Cloudflare,需要API Token和Zone ID。

**ACME服务**使用Let's Encrypt,无需额外配置。

**证书管理**需要为边缘节点生成mTLS客户端证书,使用内部CA或公共CA签发。

---

## 编译构建

### 源码获取

系统代码托管在GitHub仓库,可通过以下命令克隆代码:

```bash
# 克隆代码仓库
git clone https://github.com/labubu-daydayone/go_cmdb_web.git
cd go_cmdb_web/backend

# 查看最新版本
git tag -l
git checkout v1.0.0  # 切换到稳定版本
```

### 依赖安装

系统使用Go Modules管理依赖,首次构建时会自动下载所有依赖包:

```bash
# 下载依赖
go mod download

# 验证依赖
go mod verify
```

### 编译二进制

系统提供Makefile简化编译流程,支持多种编译选项:

```bash
# 编译当前平台二进制
make build

# 编译Linux amd64平台二进制
make build-linux

# 编译所有平台二进制
make build-all

# 编译并运行
make run

# 清理编译产物
make clean
```

编译完成后,二进制文件位于`bin/`目录下,文件名为`cdn-control-backend`。

### 交叉编译

如果需要在本地编译生产环境的二进制,可以使用交叉编译:

```bash
# 编译Linux amd64平台
GOOS=linux GOARCH=amd64 go build -o bin/cdn-control-backend-linux-amd64 ./cmd/main.go

# 编译Linux arm64平台
GOOS=linux GOARCH=arm64 go build -o bin/cdn-control-backend-linux-arm64 ./cmd/main.go
```

---

## 配置管理

### 环境变量配置

系统所有配置通过环境变量管理,支持`.env`文件和系统环境变量两种方式。

**数据库配置**包括以下环境变量:

```bash
# MySQL连接配置
DB_HOST=localhost           # 数据库主机
DB_PORT=3306               # 数据库端口
DB_USER=cdn_user           # 数据库用户名
DB_PASSWORD=your_password  # 数据库密码
DB_NAME=cdn_control        # 数据库名称
DB_CHARSET=utf8mb4         # 字符集
DB_PARSE_TIME=true         # 解析时间类型
DB_LOC=Local               # 时区

# 连接池配置
DB_MAX_IDLE_CONNS=10       # 最大空闲连接数
DB_MAX_OPEN_CONNS=100      # 最大打开连接数
DB_CONN_MAX_LIFETIME=3600  # 连接最大生命周期(秒)
```

**服务器配置**包括以下环境变量:

```bash
# HTTP服务器配置
SERVER_HOST=0.0.0.0        # 监听地址
SERVER_PORT=8080           # 监听端口
SERVER_MODE=release        # 运行模式: debug/release

# HTTPS配置(可选)
SERVER_TLS_ENABLED=false   # 是否启用TLS
SERVER_TLS_CERT=/path/to/cert.pem
SERVER_TLS_KEY=/path/to/key.pem
```

**JWT认证配置**包括以下环境变量:

```bash
# JWT配置
JWT_SECRET=your_jwt_secret_key_here  # JWT签名密钥(必须修改)
JWT_EXPIRE_HOURS=24                  # Token有效期(小时)
```

**mTLS认证配置**包括以下环境变量:

```bash
# mTLS配置(Agent API)
MTLS_ENABLED=true                    # 是否启用mTLS
MTLS_CA_CERT=/path/to/ca-cert.pem   # CA证书路径
MTLS_SERVER_CERT=/path/to/server-cert.pem
MTLS_SERVER_KEY=/path/to/server-key.pem
AGENT_API_PORT=8443                  # Agent API端口
```

**DNS提供商配置**包括以下环境变量:

```bash
# Cloudflare配置
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token  # API Token
CLOUDFLARE_ZONE_ID=your_zone_id                 # Zone ID(可选,可在数据库中配置)
```

**ACME配置**包括以下环境变量:

```bash
# ACME配置
ACME_EMAIL=admin@example.com         # ACME账号邮箱
ACME_SERVER=https://acme-v02.api.letsencrypt.org/directory  # ACME服务器URL
ACME_DNS_PROPAGATION_TIMEOUT=30      # DNS传播等待时间(秒)
```

**Worker配置**包括以下环境变量:

```bash
# DNS Sync Worker配置
DNS_SYNC_WORKER_ENABLED=true         # 是否启用DNS同步Worker
DNS_SYNC_WORKER_INTERVAL=30          # 扫描间隔(秒)

# ACME Worker配置
ACME_WORKER_ENABLED=true             # 是否启用ACME Worker
ACME_WORKER_INTERVAL=300             # 扫描间隔(秒)
ACME_WORKER_MAX_CONCURRENT=5         # 最大并发处理数
```

### 配置文件示例

创建`.env`文件用于本地开发和测试:

```bash
# .env文件示例
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=cdn_user
DB_PASSWORD=SecurePassword123
DB_NAME=cdn_control

# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
SERVER_MODE=release

# JWT配置
JWT_SECRET=change_this_to_a_random_secret_key_at_least_32_chars
JWT_EXPIRE_HOURS=24

# Cloudflare配置
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here

# ACME配置
ACME_EMAIL=admin@example.com

# Worker配置
DNS_SYNC_WORKER_ENABLED=true
DNS_SYNC_WORKER_INTERVAL=30
ACME_WORKER_ENABLED=true
ACME_WORKER_INTERVAL=300
```

**安全提示**: `.env`文件包含敏感信息,不应提交到版本控制系统。项目已在`.gitignore`中排除该文件。

---

## 数据库初始化

### 创建数据库

首先创建MySQL数据库和用户:

```sql
-- 创建数据库
CREATE DATABASE cdn_control CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户并授权
CREATE USER 'cdn_user'@'%' IDENTIFIED BY 'SecurePassword123';
GRANT ALL PRIVILEGES ON cdn_control.* TO 'cdn_user'@'%';
FLUSH PRIVILEGES;
```

### 运行数据库迁移

系统使用GORM的AutoMigrate功能自动创建和更新表结构。首次启动时会自动执行迁移:

```bash
# 启动服务,自动执行数据库迁移
./bin/cdn-control-backend serve
```

如果需要手动执行迁移,可以使用以下命令:

```bash
# 执行数据库迁移
./bin/cdn-control-backend migrate
```

### 初始化数据

系统启动后需要创建初始管理员用户:

```bash
# 方式1: 通过API创建用户(需要先禁用认证或使用特殊初始化接口)
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": "admin"
  }'

# 方式2: 直接在数据库中插入用户(密码需要bcrypt哈希)
# 使用在线工具生成bcrypt哈希: https://bcrypt-generator.com/
# 密码: admin123 -> $2a$10$...
```

---

## 部署方式

### 方式一: 二进制部署

二进制部署是最简单直接的部署方式,适合单机部署和快速测试。

**步骤1: 上传二进制文件**

```bash
# 在本地编译
make build-linux

# 上传到服务器
scp bin/cdn-control-backend-linux-amd64 root@20.2.140.226:/opt/cdn-control/backend/
```

**步骤2: 配置环境变量**

在服务器上创建`.env`文件或配置系统环境变量:

```bash
# 创建部署目录
mkdir -p /opt/cdn-control/backend
cd /opt/cdn-control/backend

# 创建.env文件
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_USER=cdn_user
DB_PASSWORD=SecurePassword123
DB_NAME=cdn_control
SERVER_PORT=8080
JWT_SECRET=your_production_jwt_secret_key_here
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
ACME_EMAIL=admin@example.com
EOF

# 设置文件权限
chmod 600 .env
```

**步骤3: 启动服务**

```bash
# 直接启动(前台运行)
./cdn-control-backend-linux-amd64 serve

# 后台运行
nohup ./cdn-control-backend-linux-amd64 serve > server.log 2>&1 &

# 查看日志
tail -f server.log
```

**步骤4: 配置systemd服务**(推荐)

创建systemd服务文件实现开机自启和进程管理:

```bash
# 创建服务文件
cat > /etc/systemd/system/cdn-control.service << 'EOF'
[Unit]
Description=CDN Control Panel Backend
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/cdn-control/backend
EnvironmentFile=/opt/cdn-control/backend/.env
ExecStart=/opt/cdn-control/backend/cdn-control-backend-linux-amd64 serve
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# 重载systemd配置
systemctl daemon-reload

# 启动服务
systemctl start cdn-control

# 设置开机自启
systemctl enable cdn-control

# 查看服务状态
systemctl status cdn-control

# 查看日志
journalctl -u cdn-control -f
```

### 方式二: Docker部署

Docker部署提供了更好的隔离性和可移植性,适合容器化环境。

**步骤1: 构建Docker镜像**

项目提供Dockerfile用于构建镜像:

```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o cdn-control-backend ./cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/cdn-control-backend .

EXPOSE 8080 8443
CMD ["./cdn-control-backend", "serve"]
```

构建镜像:

```bash
# 构建镜像
docker build -t cdn-control-backend:v1.0.0 .

# 查看镜像
docker images | grep cdn-control
```

**步骤2: 运行容器**

```bash
# 运行容器
docker run -d \
  --name cdn-control-backend \
  --restart unless-stopped \
  -p 8080:8080 \
  -p 8443:8443 \
  -e DB_HOST=mysql \
  -e DB_PORT=3306 \
  -e DB_USER=cdn_user \
  -e DB_PASSWORD=SecurePassword123 \
  -e DB_NAME=cdn_control \
  -e JWT_SECRET=your_jwt_secret \
  -e CLOUDFLARE_API_TOKEN=your_token \
  -e ACME_EMAIL=admin@example.com \
  cdn-control-backend:v1.0.0

# 查看容器日志
docker logs -f cdn-control-backend

# 查看容器状态
docker ps | grep cdn-control
```

**步骤3: 使用Docker Compose**(推荐)

Docker Compose可以同时管理应用和数据库:

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: cdn-control-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: cdn_control
      MYSQL_USER: cdn_user
      MYSQL_PASSWORD: SecurePassword123
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - cdn-network

  backend:
    image: cdn-control-backend:v1.0.0
    container_name: cdn-control-backend
    restart: unless-stopped
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: cdn_user
      DB_PASSWORD: SecurePassword123
      DB_NAME: cdn_control
      SERVER_PORT: 8080
      JWT_SECRET: your_jwt_secret_key_here
      CLOUDFLARE_API_TOKEN: your_cloudflare_api_token
      ACME_EMAIL: admin@example.com
      DNS_SYNC_WORKER_ENABLED: "true"
      ACME_WORKER_ENABLED: "true"
    ports:
      - "8080:8080"
      - "8443:8443"
    networks:
      - cdn-network

volumes:
  mysql_data:

networks:
  cdn-network:
    driver: bridge
```

启动服务:

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down

# 停止并删除数据
docker-compose down -v
```

### 方式三: 生产环境部署(当前方式)

根据项目上下文,当前生产环境采用以下部署方式:

**部署服务器**: root@20.2.140.226

**部署路径**: /opt/cdn-control/backend/

**部署流程**:

```bash
# 1. 在本地编译
cd /home/ubuntu/go_cmdb_web/backend
go build -o cdn-control-backend ./cmd/main.go

# 2. 上传到服务器
scp cdn-control-backend root@20.2.140.226:/opt/cdn-control/backend/

# 3. SSH到服务器
ssh root@20.2.140.226

# 4. 停止旧进程
cd /opt/cdn-control/backend
pkill -f cdn-control-backend

# 5. 启动新进程
nohup ./cdn-control-backend serve > server.log 2>&1 &

# 6. 验证服务
curl http://localhost:8080/api/v1/health
tail -f server.log
```

---

## 反向代理配置

生产环境建议使用Nginx作为反向代理,提供负载均衡、SSL终止、访问控制等功能。

### Nginx配置示例

```nginx
# /etc/nginx/sites-available/cdn-control
upstream cdn_backend {
    server 127.0.0.1:8080;
    # 多实例负载均衡
    # server 127.0.0.1:8081;
    # server 127.0.0.1:8082;
}

# HTTP服务器(重定向到HTTPS)
server {
    listen 80;
    server_name cdn-control.example.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS服务器
server {
    listen 443 ssl http2;
    server_name cdn-control.example.com;

    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/cdn-control.crt;
    ssl_certificate_key /etc/nginx/ssl/cdn-control.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 日志配置
    access_log /var/log/nginx/cdn-control-access.log;
    error_log /var/log/nginx/cdn-control-error.log;

    # 反向代理配置
    location /api/ {
        proxy_pass http://cdn_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件(如果有前端)
    location / {
        root /var/www/cdn-control-frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

启用配置:

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/cdn-control /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重载配置
systemctl reload nginx
```

---

## 监控和日志

### 应用日志

系统使用结构化日志,支持多种日志级别和输出格式。

**日志级别**包括DEBUG(调试信息)、INFO(一般信息)、WARN(警告信息)、ERROR(错误信息)和FATAL(致命错误)。

**日志输出**:

```bash
# 查看实时日志(systemd)
journalctl -u cdn-control -f

# 查看实时日志(Docker)
docker logs -f cdn-control-backend

# 查看实时日志(二进制部署)
tail -f /opt/cdn-control/backend/server.log
```

**日志示例**:

```
2024-01-23T10:00:00.123Z INFO  [HTTP] Request: GET /api/v1/websites
2024-01-23T10:00:00.125Z INFO  [Service] WebsiteService.List: page=1, page_size=20
2024-01-23T10:00:00.130Z INFO  [HTTP] Response: 200 OK, duration=7ms
2024-01-23T10:00:05.456Z INFO  [Worker] DNS Sync Worker: scanning pending records
2024-01-23T10:00:05.500Z INFO  [Worker] DNS Sync Worker: synced 5 records
2024-01-23T10:05:00.789Z INFO  [Worker] ACME Worker: scanning pending requests
2024-01-23T10:05:01.234Z INFO  [ACME] Processing certificate request #123 for domains: [example.com, *.example.com]
2024-01-23T10:05:35.678Z INFO  [ACME] Certificate issued successfully: fingerprint=a1b2c3d4...
```

### 健康检查

系统提供健康检查接口用于监控服务状态:

```bash
# 检查服务健康状态
curl http://localhost:8080/api/v1/health

# 响应示例
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": "2h30m15s",
  "database": "connected",
  "workers": {
    "dns_sync": "running",
    "acme": "running"
  }
}
```

### 性能监控

建议集成Prometheus和Grafana进行性能监控:

**Prometheus配置**:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'cdn-control'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/api/v1/metrics'
    scrape_interval: 15s
```

**监控指标**包括:
- HTTP请求数量和延迟
- 数据库连接池状态
- Worker执行次数和耗时
- DNS同步成功率
- ACME证书申请成功率
- 内存和CPU使用率

### 告警配置

配置告警规则及时发现问题:

**告警场景**包括:
- 服务不可用(健康检查失败)
- DNS同步失败率超过10%
- ACME证书申请失败
- 证书即将过期(30天内)
- 数据库连接失败
- 内存使用率超过80%
- CPU使用率超过90%

---

## 备份和恢复

### 数据库备份

定期备份数据库是保证数据安全的关键:

```bash
# 手动备份
mysqldump -h localhost -u cdn_user -p cdn_control > cdn_control_backup_$(date +%Y%m%d_%H%M%S).sql

# 自动备份(crontab)
# 每天凌晨2点自动备份
0 2 * * * /usr/bin/mysqldump -h localhost -u cdn_user -pSecurePassword123 cdn_control | gzip > /backup/cdn_control_$(date +\%Y\%m\%d).sql.gz

# 保留最近30天的备份
0 3 * * * find /backup -name "cdn_control_*.sql.gz" -mtime +30 -delete
```

### 数据库恢复

从备份恢复数据库:

```bash
# 恢复未压缩的备份
mysql -h localhost -u cdn_user -p cdn_control < cdn_control_backup_20240123.sql

# 恢复压缩的备份
gunzip < cdn_control_20240123.sql.gz | mysql -h localhost -u cdn_user -p cdn_control
```

### 配置备份

备份系统配置文件和证书:

```bash
# 备份配置和证书
tar -czf cdn_control_config_$(date +%Y%m%d).tar.gz \
  /opt/cdn-control/backend/.env \
  /opt/cdn-control/backend/certs/ \
  /etc/systemd/system/cdn-control.service

# 恢复配置
tar -xzf cdn_control_config_20240123.tar.gz -C /
```

---

## 故障排查

### 常见问题

**问题1: 服务启动失败**

症状: 服务无法启动,日志显示数据库连接错误。

原因: 数据库配置错误或数据库服务未启动。

解决方法:
```bash
# 检查数据库服务状态
systemctl status mysql

# 测试数据库连接
mysql -h localhost -u cdn_user -p -e "SELECT 1"

# 检查环境变量配置
cat /opt/cdn-control/backend/.env | grep DB_
```

**问题2: DNS同步失败**

症状: DNS记录状态一直为pending或error,日志显示Cloudflare API错误。

原因: Cloudflare API Token无效或权限不足。

解决方法:
```bash
# 验证API Token
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer your_api_token"

# 检查Token权限(需要Zone.DNS编辑权限)

# 手动重试失败的DNS记录
curl -X POST http://localhost:8080/api/v1/dns-records/{id}/retry \
  -H "Authorization: Bearer your_jwt_token"
```

**问题3: ACME证书申请失败**

症状: certificate_request状态为error,日志显示DNS验证失败。

原因: DNS TXT记录未正确创建或DNS传播时间不足。

解决方法:
```bash
# 检查DNS TXT记录是否存在
dig _acme-challenge.example.com TXT

# 增加DNS传播等待时间
# 修改环境变量: ACME_DNS_PROPAGATION_TIMEOUT=60

# 手动重试证书申请
# 将certificate_request的status改为pending
UPDATE certificate_requests SET status='pending', last_error=NULL WHERE id=123;
```

**问题4: Worker未运行**

症状: DNS记录和证书申请一直处于pending状态,没有被处理。

原因: Worker未启用或Worker进程崩溃。

解决方法:
```bash
# 检查Worker配置
cat /opt/cdn-control/backend/.env | grep WORKER

# 确保Worker已启用
DNS_SYNC_WORKER_ENABLED=true
ACME_WORKER_ENABLED=true

# 重启服务
systemctl restart cdn-control

# 查看Worker日志
journalctl -u cdn-control -f | grep Worker
```

**问题5: mTLS认证失败**

症状: 边缘节点无法访问Agent API,返回401或403错误。

原因: 客户端证书无效或节点hostname不匹配。

解决方法:
```bash
# 验证客户端证书
openssl x509 -in client-cert.pem -text -noout | grep "Subject:"

# 确保CN与节点hostname匹配
# Subject: CN=edge-node-01

# 检查节点是否存在且active
mysql -u cdn_user -p cdn_control -e "SELECT id, hostname, enabled FROM nodes WHERE hostname='edge-node-01'"

# 测试mTLS连接
curl -X GET https://localhost:8443/api/v1/agent/config \
  --cert client-cert.pem \
  --key client-key.pem \
  --cacert ca-cert.pem
```

### 日志分析

**查看错误日志**:

```bash
# systemd部署
journalctl -u cdn-control -p err -n 100

# Docker部署
docker logs cdn-control-backend 2>&1 | grep ERROR | tail -n 100

# 二进制部署
grep ERROR /opt/cdn-control/backend/server.log | tail -n 100
```

**查看慢查询**:

```bash
# 查看数据库慢查询
mysql -u cdn_user -p cdn_control -e "SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10"

# 分析慢查询
mysqldumpslow /var/log/mysql/mysql-slow.log
```

### 性能调优

**数据库优化**:

```sql
-- 添加索引
CREATE INDEX idx_dns_records_status ON domain_dns_records(status);
CREATE INDEX idx_certificates_not_after ON certificates(not_after);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);

-- 分析表
ANALYZE TABLE domain_dns_records;
ANALYZE TABLE certificates;
ANALYZE TABLE agent_tasks;

-- 优化表
OPTIMIZE TABLE domain_dns_records;
```

**连接池调优**:

```bash
# 增加数据库连接池大小
DB_MAX_IDLE_CONNS=20
DB_MAX_OPEN_CONNS=200
DB_CONN_MAX_LIFETIME=3600
```

**Worker调优**:

```bash
# 调整Worker扫描间隔
DNS_SYNC_WORKER_INTERVAL=15  # 减少到15秒
ACME_WORKER_INTERVAL=180     # 减少到3分钟

# 增加ACME并发处理数
ACME_WORKER_MAX_CONCURRENT=10
```

---

## 升级和迁移

### 版本升级

升级系统到新版本的流程:

```bash
# 1. 备份数据库和配置
mysqldump -u cdn_user -p cdn_control > backup_before_upgrade.sql
cp /opt/cdn-control/backend/.env backup_env

# 2. 下载新版本二进制
wget https://github.com/labubu-daydayone/go_cmdb_web/releases/download/v1.1.0/cdn-control-backend-linux-amd64
chmod +x cdn-control-backend-linux-amd64

# 3. 停止服务
systemctl stop cdn-control

# 4. 替换二进制
mv cdn-control-backend-linux-amd64 /opt/cdn-control/backend/cdn-control-backend-linux-amd64
cd /opt/cdn-control/backend

# 5. 运行数据库迁移(如果有)
./cdn-control-backend-linux-amd64 migrate

# 6. 启动服务
systemctl start cdn-control

# 7. 验证服务
curl http://localhost:8080/api/v1/health
systemctl status cdn-control

# 8. 如果升级失败,回滚
# systemctl stop cdn-control
# 恢复旧版本二进制和数据库备份
# systemctl start cdn-control
```

### 数据迁移

从其他系统迁移数据到本系统:

```bash
# 1. 导出旧系统数据为JSON或CSV格式

# 2. 编写数据转换脚本
# 参考: scripts/migrate_data.go

# 3. 导入数据
go run scripts/migrate_data.go --input old_data.json --output new_data.sql

# 4. 执行SQL导入
mysql -u cdn_user -p cdn_control < new_data.sql

# 5. 验证数据完整性
mysql -u cdn_user -p cdn_control -e "SELECT COUNT(*) FROM websites"
```

---

## 安全加固

### 系统安全

**防火墙配置**:

```bash
# 仅开放必要端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8080/tcp  # API(如果需要外部访问)
ufw enable

# 限制SSH访问
# 编辑 /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

**定期更新**:

```bash
# 更新系统软件包
apt update && apt upgrade -y

# 更新Go依赖
go get -u ./...
go mod tidy
```

### 应用安全

**JWT密钥管理**:

```bash
# 生成强随机密钥
openssl rand -base64 32

# 定期轮换JWT密钥(需要重新登录所有用户)
```

**API访问控制**:

```nginx
# Nginx限流配置
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://cdn_backend;
}
```

**数据库安全**:

```sql
-- 限制数据库用户权限
REVOKE ALL PRIVILEGES ON cdn_control.* FROM 'cdn_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON cdn_control.* TO 'cdn_user'@'%';

-- 禁用远程root登录
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;
```

---

## 总结

本文档详细介绍了CDN控制面板系统的部署流程、配置管理、运维监控以及故障排查方法。系统支持多种部署方式,包括二进制部署、Docker部署和systemd服务管理。通过合理的配置和监控,可以确保系统稳定运行。建议在生产环境中使用Nginx反向代理、配置SSL证书、启用监控告警以及定期备份数据,以保证系统的安全性和可用性。
