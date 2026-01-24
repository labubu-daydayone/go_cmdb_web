# 环境配置说明

本文档说明如何配置前端连接到不同的后端环境（开发、测试、生产）。

---

## 配置文件位置

### 1. API 代理配置

**文件路径**：`config/proxy.ts`

**作用**：配置开发环境下的 API 请求代理，将前端的 `/api/*` 请求转发到后端服务器。

**配置项**：

```typescript
export default {
  dev: {
    '/api/': {
      target: 'http://20.2.140.226:8080',  // 后端服务器地址
      changeOrigin: true,                   // 允许跨域
      pathRewrite: { '^': '' },            // 不重写路径
    },
  },
};
```

**修改方法**：

1. 打开 `config/proxy.ts` 文件
2. 找到 `dev` 配置项
3. 修改 `target` 为你的后端服务器地址
4. 保存文件并重启开发服务器（`npm start`）

---

### 2. WebSocket 连接配置

**文件路径**：`src/utils/websocket.ts`

**作用**：配置 WebSocket（Socket.IO）连接地址，用于实时推送功能。

**配置项**：

```typescript
const SOCKET_URL = process.env.SOCKET_URL || 'http://20.2.140.226:8080';
```

**修改方法**：

**方式 1：直接修改代码**

1. 打开 `src/utils/websocket.ts` 文件
2. 找到第 14 行的 `SOCKET_URL` 配置
3. 修改默认值为你的后端服务器地址
4. 保存文件并重启开发服务器

**方式 2：使用环境变量（推荐）**

1. 在项目根目录创建或编辑 `.env` 文件
2. 添加以下内容：
   ```bash
   SOCKET_URL=http://20.2.140.226:8080
   ```
3. 保存文件并重启开发服务器

---

### 3. API 基础路径配置

**文件路径**：`src/utils/request.ts`

**作用**：配置 API 请求的基础路径前缀。

**配置项**：

```typescript
export const API_BASE_URL = '/api/v1';
```

**说明**：

- 开发环境：请求会通过代理转发到后端服务器（如 `http://20.2.140.226:8080/api/v1`）
- 生产环境：请求会直接发送到当前域名下的 `/api/v1` 路径

**修改方法**：

通常不需要修改此配置。如果后端 API 路径前缀不是 `/api/v1`，可以修改此常量。

---

## 当前配置（测试环境）

当前前端已配置连接到测试环境：

- **后端地址**：`http://20.2.140.226:8080`
- **API 路径**：`/api/v1/*`
- **WebSocket 地址**：`http://20.2.140.226:8080`

---

## 快速切换环境

### 切换到本地开发环境

**修改 `config/proxy.ts`**：

```typescript
dev: {
  '/api/': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    pathRewrite: { '^': '' },
  },
},
```

**修改 `src/utils/websocket.ts`**：

```typescript
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:8080';
```

---

### 切换到测试环境

**修改 `config/proxy.ts`**：

```typescript
dev: {
  '/api/': {
    target: 'http://20.2.140.226:8080',
    changeOrigin: true,
    pathRewrite: { '^': '' },
  },
},
```

**修改 `src/utils/websocket.ts`**：

```typescript
const SOCKET_URL = process.env.SOCKET_URL || 'http://20.2.140.226:8080';
```

---

### 切换到生产环境

生产环境不使用代理，前端会直接请求当前域名下的 `/api/v1` 路径。

**部署前需要确保**：

1. 后端服务部署在与前端相同的域名下
2. 后端 API 路径为 `/api/v1/*`
3. WebSocket 服务部署在与前端相同的域名和端口

---

## 验证配置

### 1. 验证 API 连接

启动开发服务器后，打开浏览器控制台（F12），查看 Network 标签：

1. 登录系统
2. 查看请求的 URL 是否正确转发到后端服务器
3. 检查响应状态码和数据格式

**示例**：

- 请求：`http://localhost:8000/api/v1/websites`
- 实际转发：`http://20.2.140.226:8080/api/v1/websites`

---

### 2. 验证 WebSocket 连接

打开浏览器控制台（F12），查看 Console 标签：

1. 登录系统后，WebSocket 会自动连接
2. 查看是否有 `WebSocket connected` 日志
3. 检查连接的 URL 是否正确

**示例日志**：

```
WebSocket connected: abc123
```

---

## 常见问题

### 1. 修改配置后不生效？

**解决方法**：

1. 停止开发服务器（Ctrl+C）
2. 重新启动：`npm start`
3. 清除浏览器缓存（Ctrl+Shift+Delete）

---

### 2. API 请求 404 错误？

**可能原因**：

1. 后端服务未启动
2. 后端地址配置错误
3. 后端 API 路径不匹配

**解决方法**：

1. 检查 `config/proxy.ts` 中的 `target` 配置
2. 确认后端服务已启动并监听正确的端口
3. 使用 Postman 或 curl 直接测试后端 API

---

### 3. WebSocket 连接失败？

**可能原因**：

1. 后端 WebSocket 服务未启动
2. WebSocket 地址配置错误
3. 防火墙或网络限制

**解决方法**：

1. 检查 `src/utils/websocket.ts` 中的 `SOCKET_URL` 配置
2. 确认后端 WebSocket 服务已启动
3. 检查浏览器控制台的错误信息

---

### 4. 跨域问题（CORS）？

**解决方法**：

1. 确保 `config/proxy.ts` 中设置了 `changeOrigin: true`
2. 确认后端已配置 CORS 允许前端域名
3. 检查后端响应头是否包含正确的 CORS 头

---

## 生产环境部署

### 1. 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

---

### 2. 部署到 Nginx

**Nginx 配置示例**：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://20.2.140.226:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket 代理
    location /socket.io/ {
        proxy_pass http://20.2.140.226:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

### 3. 部署到 Docker

**Dockerfile 示例**：

```dockerfile
FROM nginx:alpine

# 复制构建产物
COPY dist/ /usr/share/nginx/html/

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 总结

**需要修改的文件**：

1. **`config/proxy.ts`** - API 代理配置（必须修改）
2. **`src/utils/websocket.ts`** - WebSocket 连接地址（必须修改）
3. **`.env`** - 环境变量（可选）

**修改后记得**：

1. 重启开发服务器（`npm start`）
2. 清除浏览器缓存
3. 验证 API 和 WebSocket 连接

**当前配置**：

- 后端地址：`http://20.2.140.226:8080`
- 已配置完成，可直接使用 `npm start` 启动
