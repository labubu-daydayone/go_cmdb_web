# 禁用 Mock 数据说明

**日期**: 2025-01-24  
**状态**: 已完成

---

## 问题描述

前端启动后仍然使用 Mock 数据，而不是调用真实的 API 接口。

---

## 根本原因

UmiJS 框架默认启用了 Mock 功能，会自动拦截 API 请求并返回 Mock 数据。

**配置位置**: `config/config.ts` 第 168-170 行

```typescript
mock: {
  include: ['mock/**/*', 'src/pages/**/_mock.ts'],
},
```

当 Mock 功能启用时，UmiJS 会：
1. 自动扫描 `mock/**/*` 目录下的所有文件
2. 自动扫描 `src/pages/**/_mock.ts` 文件
3. 拦截匹配的 API 请求
4. 返回 Mock 数据而不是调用真实 API

---

## 解决方案

### 方案 1：注释 Mock 配置（已采用）

**文件**: `config/config.ts`

```typescript
// Mock 功能已禁用，使用真实 API
// mock: {
//   include: ['mock/**/*', 'src/pages/**/_mock.ts'],
// },
```

### 方案 2：设置环境变量

**文件**: `.env` 或 `.env.local`

```bash
MOCK=none
```

### 方案 3：重命名 mock 目录（已采用）

```bash
mv mock mock.bak
```

将 `mock` 目录重命名为 `mock.bak`，这样 UmiJS 就找不到 Mock 文件了。

---

## 已执行的修复

### 1. 注释 Mock 配置

**文件**: `config/config.ts`

```typescript
// Mock 功能已禁用，使用真实 API
// mock: {
//   include: ['mock/**/*', 'src/pages/**/_mock.ts'],
// },
```

### 2. 创建 .env 文件

**文件**: `.env`

```bash
# 禁用 UmiJS Mock 功能，使用真实 API
MOCK=none
```

### 3. 创建 .env.local 文件

**文件**: `.env.local`

```bash
# 本地开发环境配置
MOCK=none
```

### 4. 更新 .gitignore

添加了以下规则，避免本地环境配置被提交：

```
# local env files
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 5. 重命名 mock 目录

```bash
mv mock mock.bak
```

将原有的 Mock 文件目录重命名为 `mock.bak`，避免 UmiJS 扫描到这些文件。

---

## 验证方法

### 1. 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
npm start
```

### 2. 检查网络请求

打开浏览器开发者工具（F12），切换到 Network 标签：

1. 访问任意页面（如网站管理）
2. 查看 Network 面板中的请求
3. 确认请求地址为 `http://localhost:8000/api/v1/...`
4. 点击请求查看响应，确认是真实 API 返回的数据

### 3. 检查控制台日志

如果 API 调用失败，控制台会显示错误信息：
- 401: 未登录或 Token 过期
- 404: API 路径不存在
- 500: 服务器错误

### 4. 检查代理配置

确认代理配置正确：

**文件**: `config/proxy.ts`

```typescript
dev: {
  '/api/': {
    target: 'http://20.2.140.226:8080',
    changeOrigin: true,
    pathRewrite: { '^': '' },
  },
},
```

---

## 常见问题

### Q1: 重启后还是 Mock 数据？

**A**: 确保以下几点：
1. 已注释 `config/config.ts` 中的 `mock` 配置
2. 已设置 `MOCK=none` 环境变量
3. 已重命名或删除 `mock` 目录
4. 完全重启了开发服务器（Ctrl+C 后重新 `npm start`）

### Q2: 请求返回 404？

**A**: 检查以下几点：
1. 后端服务是否正常运行（`http://20.2.140.226:8080`）
2. API 路径是否正确（应为 `/api/v1/...`）
3. 代理配置是否正确

### Q3: 请求返回 401？

**A**: 
1. 确认已登录并获取 JWT Token
2. 检查 Token 是否存储在 localStorage
3. 检查 Token 是否过期
4. 检查 `request.ts` 是否正确添加 Authorization 头

### Q4: 如何临时启用 Mock？

**A**: 
1. 取消注释 `config/config.ts` 中的 `mock` 配置
2. 将 `mock.bak` 重命名回 `mock`
3. 重启开发服务器

---

## 启动前端

### 1. 确保后端服务运行

```bash
# SSH 连接到测试服务器
ssh root@20.2.140.226

# 检查后端服务状态
# 确保服务运行在 8080 端口
```

### 2. 启动前端开发服务器

```bash
cd client-antd
npm start
```

### 3. 访问前端

打开浏览器访问 `http://localhost:8000`

---

## 总结

通过以下三个步骤彻底禁用了 UmiJS 的 Mock 功能：

1. 注释 `config/config.ts` 中的 `mock` 配置
2. 设置 `MOCK=none` 环境变量
3. 重命名 `mock` 目录为 `mock.bak`

现在前端会直接调用真实的 API 接口，所有请求会通过代理转发到 `http://20.2.140.226:8080`。

---

## 相关文档

- [环境配置说明](./ENVIRONMENT_CONFIG.md)
- [API 迁移完成报告](./API_MIGRATION_COMPLETE.md)
- [WebSocket 使用指南](./WEBSOCKET_GUIDE.md)
- [API 迁移指南](./API_MIGRATION_GUIDE.md)
