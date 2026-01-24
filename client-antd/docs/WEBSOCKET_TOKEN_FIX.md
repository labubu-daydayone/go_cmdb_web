# WebSocket Token 认证修复

## 问题描述

### 问题 1: WebSocket 连接未携带 Token

错误日志:
```
2026/01/24 14:16:37 [WebSocket] Handshake rejected: No token
[GIN] 2026/01/24 - 14:16:37 | 401 | GET "/socket.io/"
```

原因: WebSocket 连接时没有携带 Token 进行认证。

### 问题 2: 登录请求带 token=123 参数

错误 URL: `http://192.168.1.116:8002/api/v1/auth/login?token=123`

原因: 可能来自浏览器缓存。

## 修复方案

### 1. WebSocket 连接携带 Token

修改 src/utils/websocket.ts，在连接时携带 Token。

### 2. 清除浏览器缓存

清除 Local Storage 和 Session Storage，强制刷新页面。

### 3. 重新启动前端

停止服务器，清除缓存，重新启动。

## 验证方法

检查 Console 日志应该显示 "[WebSocket] Connected successfully"
检查后端日志应该显示连接成功，不应该有 401 错误
检查登录请求不应该带 token=123 参数

## 修复记录

修复日期: 2026-01-24
修复内容: 修改 WebSocket 连接逻辑，添加 Token 认证
