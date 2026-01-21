# CMDB / CDN 控制面 API 文档

**API & WebSocket 接口规范（v2.1）**

**认证方案**：统一 JWT（Bearer Token）  
**WebSocket 实现**：Socket.IO（默认路径）  
**状态**：最终规范，可直接开发

---

## 目录

1. [总体规范](#1-总体规范)
2. [统一响应格式](#2-统一响应格式)
3. [业务错误码规范](#3-业务错误码规范)
4. [认证接口](#4-认证接口)
5. [JWT 规范](#5-jwt-规范)
6. [HTTP API 通用规范](#6-http-api-通用规范)
7. [接口路径风格统一规范](#7-接口路径风格统一规范)
8. [WebSocket 规范](#8-websocket-规范)
9. [网站管理 API](#9-网站管理-api)
10. [域名管理 API](#10-域名管理-api)
11. [节点管理 API](#11-节点管理-api)
12. [节点分组 API](#12-节点分组-api)
13. [回源分组 API](#13-回源分组-api)
14. [线路分组 API](#14-线路分组-api)
15. [DNS 设置 API](#15-dns-设置-api)
16. [缓存设置 API](#16-缓存设置-api)
17. [数据关联规则](#17-数据关联规则)
18. [强制验收标准](#18-强制验收标准)

---

## 1. 总体规范

1. **统一认证方式**：JWT（Bearer Token）
2. **HTTP API 与 WebSocket 使用同一套 JWT**
3. **不使用 Cookie Session**
4. **WebSocket 技术栈统一为 Socket.IO**（默认 `/socket.io/`）
5. **所有 HTTP API 路径统一使用 `/api/v1` 前缀**
6. **HTTP 状态码用于协议层语义**
7. **body.code 用于业务错误码**
8. **成功时 body.code = 0**
9. **所有 ID 类型均为 int**
10. **时间格式统一使用 RFC3339**
11. **只使用 GET 和 POST 方法**
12. **所有写操作使用 POST**
13. **接口路径风格必须统一**

---

## 2. 统一响应格式

### 2.1 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 2.2 失败响应

```json
{
  "code": 1001,
  "message": "error message",
  "data": null
}
```

---

## 3. 业务错误码规范

### 3.1 错误码分段

| 范围 | 说明 |
|------|------|
| 0 | 成功 |
| 1000–1099 | 认证 / 权限错误 |
| 2000–2099 | 参数校验错误 |
| 3000–3999 | 业务状态 / 资源错误 |
| 5000–5999 | 系统 / 依赖错误 |

### 3.2 认证 / 权限错误

| code | 含义 | HTTP |
|------|------|------|
| 1001 | 未登录 / Token 缺失 | 401 |
| 1002 | Token 无效 | 401 |
| 1003 | Token 过期 | 401 |
| 1004 | 无权限 | 403 |

### 3.3 参数错误

| code | 含义 | HTTP |
|------|------|------|
| 2001 | 参数缺失 | 400 |
| 2002 | 参数格式错误 | 400 |
| 2003 | 参数值非法 | 400 |

### 3.4 业务错误

| code | 含义 | HTTP |
|------|------|------|
| 3001 | 资源不存在 | 404 |
| 3002 | 资源已存在 | 409 |
| 3003 | 当前状态不允许操作 | 409 |

### 3.5 系统错误

| code | 含义 | HTTP |
|------|------|------|
| 5001 | 内部服务错误 | 500 |
| 5002 | 数据库错误 | 500 |
| 5003 | 外部依赖失败 | 502 |

---

## 4. 认证接口

### 4.1 用户登录

**接口**: `POST /api/v1/auth/login`

**请求**:

```json
{
  "username": "string",
  "password": "string"
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "jwt-token",
    "expireAt": "2024-01-16T10:30:00+08:00",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

---

## 5. JWT 规范

### 5.1 JWT Claims

| 字段 | 类型 | 说明 |
|------|------|------|
| uid | int | 用户 ID |
| sub | string | 用户名 |
| role | string | 用户角色 |
| iat | int | 签发时间 |
| exp | int | 过期时间 |

### 5.2 使用方式

**HTTP**:

```
Authorization: Bearer <JWT>
```

**WebSocket（Socket.IO）**:

```javascript
io("https://your-domain", {
  auth: { token: "<JWT>" }
});
```

---

## 6. HTTP API 通用规范

### 6.1 路径规范

所有接口必须使用完整路径：

```
/api/v1/{resource}
```

### 6.2 方法规范

- **GET**：查询（列表、详情）
- **POST**：写操作（创建、更新、删除、动作）

**禁止使用 PUT / DELETE / PATCH**

---

## 7. 接口路径风格统一规范

### 7.1 资源写操作（CRUD）

统一使用：

```
POST /{resource}/create
POST /{resource}/update
POST /{resource}/delete
```

**resource 必须使用复数名词**。

### 7.2 动作型接口

统一使用：

```
POST /{resource}/{action-name}
```

**action-name 使用 kebab-case**。

示例：

```
POST /websites/clear-cache
POST /nodes/set-status
```

### 7.3 幂等性约定

- **create**：非幂等
- **update**：幂等
- **delete**：幂等
- **动作型接口**：需单独说明

---

## 8. WebSocket 规范

### 8.1 连接方式

```
https://your-domain
```

Socket.IO 默认使用 `/socket.io/` 路径。

### 8.2 认证规则

- 连接时通过 `auth.token` 传递 JWT
- 校验失败流程：
  1. 发送 `error` 事件
  2. 断开连接

```json
{
  "code": 1001,
  "message": "unauthorized"
}
```

### 8.3 HTTP 与 WebSocket 职责

**HTTP `/websites`**：
- 首次加载
- 分页、搜索、刷新

**WebSocket**：
- 实时增量同步
- 不承担分页和搜索

### 8.4 网站列表事件

**connected**:

```json
{ "ok": true }
```

**request**:

```javascript
socket.emit("request:websites", { lastEventId });
```

**initial**:

```json
{
  "items": [],
  "total": 50,
  "version": 1024
}
```

**update**:

```json
{
  "eventId": 1025,
  "type": "add | update | delete",
  "data": {}
}
```

**规则**：
- **add**：data 为完整对象
- **update**：data 为 patch，必须包含 id
- **delete**：data 仅包含 id

**eventId 仅在 websites 模块内递增**。

---

## 9. 网站管理 API

### 9.1 获取网站列表

**接口**: `GET /api/v1/websites`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15，最大 100 |
| domain | string | 否 | 域名搜索（模糊匹配） |
| status | string | 否 | 状态筛选：active, inactive |
| lineGroup | string | 否 | 线路分组筛选 |
| sortBy | string | 否 | 排序字段 |
| order | string | 否 | 排序方式：asc, desc |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "domain": "example.com",
        "status": "active",
        "https": true,
        "httpsForceRedirect": true,
        "hsts": false,
        "originConfig": {
          "type": "origin",
          "groupId": 1
        },
        "cacheRules": [1, 2],
        "lineGroup": "线路1",
        "createdAt": "2024-01-16T10:30:00+08:00",
        "updatedAt": "2024-01-16T10:30:00+08:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 15
  }
}
```

### 9.2 添加网站

**接口**: `POST /api/v1/websites/create`

**请求**:

```json
{
  "domains": ["example.com", "www.example.com"],
  "https": true,
  "httpsForceRedirect": true,
  "hsts": false,
  "originConfig": {
    "type": "origin",
    "groupId": 1
  },
  "cacheRules": [1, 2],
  "lineGroup": "线路1"
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| domains | array | 是 | 域名列表，支持批量添加 |
| https | boolean | 否 | 是否启用 HTTPS |
| httpsForceRedirect | boolean | 否 | HTTPS 强制跳转 |
| hsts | boolean | 否 | 启用 HSTS |
| originConfig | object | 是 | 回源配置 |
| originConfig.type | string | 是 | 回源类型：origin, redirect, template |
| originConfig.groupId | int | 条件 | type=origin 时必填 |
| originConfig.url | string | 条件 | type=redirect 时必填 |
| originConfig.statusCode | int | 条件 | type=redirect 时必填 |
| originConfig.templateId | int | 条件 | type=template 时必填 |
| cacheRules | array | 否 | 缓存规则 ID 列表 |
| lineGroup | string | 否 | 线路分组 |

**originConfig 三选一规则**:

| type | 必须字段 |
|------|----------|
| origin | groupId |
| redirect | url, statusCode |
| template | templateId |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "ids": [1, 2]
  }
}
```

### 9.3 更新网站

**接口**: `POST /api/v1/websites/update`

**请求**:

```json
{
  "id": 1,
  "domain": "example.com",
  "https": true,
  "httpsForceRedirect": true,
  "hsts": false,
  "originConfig": {
    "type": "origin",
    "groupId": 1
  },
  "cacheRules": [1, 2],
  "lineGroup": "线路1"
}
```

**更新规则**:
1. 未传字段不更新
2. 数组字段默认全量覆盖
3. 增量操作需使用独立接口

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 9.4 删除网站

**接口**: `POST /api/v1/websites/delete`

**请求**:

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 9.5 清除缓存

**接口**: `POST /api/v1/websites/clear-cache`

**请求**:

```json
{
  "ids": [1, 2, 3],
  "type": "all",
  "url": "https://example.com/path/to/file.html",
  "directory": "/images/"
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 网站 ID 列表 |
| type | string | 是 | 清除类型：all, url, directory |
| url | string | 条件 | type=url 时必填 |
| directory | string | 条件 | type=directory 时必填 |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 10. 域名管理 API

### 10.1 获取域名列表

**接口**: `GET /api/v1/domains`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |
| keyword | string | 否 | 关键词搜索 |
| status | string | 否 | 状态筛选 |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "domain": "example.com",
        "status": "active",
        "recordCount": 5,
        "createdAt": "2024-01-16T10:30:00+08:00"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 15
  }
}
```

### 10.2 添加域名

**接口**: `POST /api/v1/domains/create`

**请求**:

```json
{
  "domain": "example.com"
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1
  }
}
```

### 10.3 删除域名

**接口**: `POST /api/v1/domains/delete`

**请求**:

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 11. 节点管理 API

### 11.1 获取节点列表

**接口**: `GET /api/v1/nodes`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |
| name | string | 否 | 节点名称搜索 |
| ip | string | 否 | IP 地址搜索 |
| status | string | 否 | 状态筛选：online, offline |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Node-01",
        "ip": "192.168.1.10",
        "status": "online",
        "subIPs": [
          {
            "id": 1,
            "ip": "192.168.1.11",
            "port": 80,
            "enabled": true
          }
        ],
        "createdAt": "2024-01-16T10:30:00+08:00"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 15
  }
}
```

### 11.2 添加节点

**接口**: `POST /api/v1/nodes/create`

**请求**:

```json
{
  "name": "Node-01",
  "ip": "192.168.1.10",
  "subIPs": [
    {
      "ip": "192.168.1.11",
      "port": 80
    }
  ]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1
  }
}
```

### 11.3 更新节点

**接口**: `POST /api/v1/nodes/update`

**请求**:

```json
{
  "id": 1,
  "name": "Node-01",
  "ip": "192.168.1.10",
  "subIPs": [
    {
      "id": 1,
      "ip": "192.168.1.11",
      "port": 80,
      "enabled": true
    }
  ]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 11.4 删除节点

**接口**: `POST /api/v1/nodes/delete`

**请求**:

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 11.5 设置节点状态

**接口**: `POST /api/v1/nodes/set-status`

**请求**:

```json
{
  "id": 1,
  "status": "online"
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 节点 ID |
| status | string | 是 | 状态：online, offline |

**行为说明**:
- 禁用节点时，所有子 IP 也禁用
- 启用节点时，所有子 IP 也启用

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 12. 节点分组 API

### 12.1 获取节点分组列表

**接口**: `GET /api/v1/node-groups`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "节点分组1",
        "description": "描述",
        "subIPs": [
          {
            "nodeId": 1,
            "nodeName": "Node-01",
            "ip": "192.168.1.11",
            "port": 80
          }
        ],
        "subIPCount": 3,
        "createdAt": "2024-01-16T10:30:00+08:00"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 15
  }
}
```

### 12.2 添加节点分组

**接口**: `POST /api/v1/node-groups/create`

**请求**:

```json
{
  "name": "节点分组1",
  "description": "描述",
  "subIPIds": [1, 2, 3]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1
  }
}
```

### 12.3 更新节点分组

**接口**: `POST /api/v1/node-groups/update`

**请求**:

```json
{
  "id": 1,
  "name": "节点分组1",
  "description": "描述",
  "subIPIds": [1, 2, 3]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 12.4 删除节点分组

**接口**: `POST /api/v1/node-groups/delete`

**请求**:

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 13. 回源分组 API

### 13.1 获取回源分组列表

**接口**: `GET /api/v1/origin-groups`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "回源分组1",
        "description": "描述",
        "addresses": [
          {
            "id": 1,
            "type": "主源",
            "protocol": "HTTP",
            "address": "192.168.1.100:80",
            "weight": 10
          }
        ],
        "createdAt": "2024-01-16T10:30:00+08:00"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 15
  }
}
```

### 13.2 添加回源分组

**接口**: `POST /api/v1/origin-groups/create`

**请求**:

```json
{
  "name": "回源分组1",
  "description": "描述",
  "addresses": [
    {
      "type": "主源",
      "protocol": "HTTP",
      "address": "192.168.1.100:80",
      "weight": 10
    }
  ]
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分组名称 |
| description | string | 否 | 描述 |
| addresses | array | 是 | 回源地址列表 |
| addresses[].type | string | 是 | 类型：主源, 备源 |
| addresses[].protocol | string | 是 | 协议：HTTP, HTTPS |
| addresses[].address | string | 是 | 地址：IP:端口 或 域名:端口 |
| addresses[].weight | int | 否 | 权重 |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1
  }
}
```

### 13.3 更新回源分组

**接口**: `POST /api/v1/origin-groups/update`

**请求**:

```json
{
  "id": 1,
  "name": "回源分组1",
  "description": "描述",
  "addresses": [
    {
      "id": 1,
      "type": "主源",
      "protocol": "HTTP",
      "address": "192.168.1.100:80",
      "weight": 10
    }
  ]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 13.4 删除回源分组

**接口**: `POST /api/v1/origin-groups/delete`

**请求**:

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 14. 线路分组 API

### 14.1 获取线路分组列表

**接口**: `GET /api/v1/line-groups`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "线路分组1",
        "cname": "prefix.example.com",
        "nodeGroupId": 1,
        "nodeGroupName": "节点分组1",
        "createdAt": "2024-01-16T10:30:00+08:00"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 15
  }
}
```

### 14.2 添加线路分组

**接口**: `POST /api/v1/line-groups/create`

**请求**:

```json
{
  "name": "线路分组1",
  "cnamePrefix": "prefix",
  "domain": "example.com",
  "nodeGroupId": 1
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分组名称 |
| cnamePrefix | string | 是 | CNAME 前缀 |
| domain | string | 是 | 域名（来自 DNS 设置） |
| nodeGroupId | int | 是 | 节点分组 ID（单选） |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "cname": "prefix.example.com"
  }
}
```

### 14.3 更新线路分组

**接口**: `POST /api/v1/line-groups/update`

**请求**:

```json
{
  "id": 1,
  "name": "线路分组1",
  "cnamePrefix": "prefix",
  "domain": "example.com",
  "nodeGroupId": 1
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 14.4 删除线路分组

**接口**: `POST /api/v1/line-groups/delete`

**请求**:

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 15. DNS 设置 API

### 15.1 获取 DNS 配置列表

**接口**: `GET /api/v1/dns`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |
| keyword | string | 否 | 关键词搜索 |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "domain": "example.com",
        "recordCount": 5,
        "status": "active",
        "createdAt": "2024-01-16T10:30:00+08:00"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 15
  }
}
```

### 15.2 获取域名解析记录

**接口**: `GET /api/v1/dns/{domainId}/records`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| domainId | int | 是 | 域名 ID |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "domain": "example.com",
    "items": [
      {
        "id": 1,
        "domainId": 1,
        "name": "www",
        "type": "CNAME",
        "value": "cdn.example.com",
        "ttl": 600,
        "status": "active",
        "createdAt": "2024-01-16T10:30:00+08:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 15
  }
}
```

**DNS Record 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 记录 ID |
| domainId | int | 域名 ID |
| name | string | 相对主机记录（@, www, api, *） |
| type | string | 记录类型（A, CNAME, MX, TXT） |
| value | string | 记录值 |
| ttl | int | TTL（秒） |
| status | string | 状态：active, pending, error |
| createdAt | string | 创建时间 |

**注意**:
- `name` 表示相对主机记录
- 允许：`@`、`www`、`api`、`*`
- 禁止完整域名
- 废弃字段：`host`

### 15.3 添加 DNS 配置

**接口**: `POST /api/v1/dns/create`

**请求**:

```json
{
  "domain": "example.com"
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1
  }
}
```

### 15.4 删除 DNS 配置

**接口**: `POST /api/v1/dns/delete`

**请求**:

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 16. 缓存设置 API

### 16.1 获取缓存规则列表

**接口**: `GET /api/v1/cache-rules`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "缓存规则1",
        "path": "/static/*",
        "ttl": 3600,
        "enabled": true,
        "createdAt": "2024-01-16T10:30:00+08:00"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 15
  }
}
```

### 16.2 添加缓存规则

**接口**: `POST /api/v1/cache-rules/create`

**请求**:

```json
{
  "name": "缓存规则1",
  "path": "/static/*",
  "ttl": 3600,
  "enabled": true
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1
  }
}
```

### 16.3 更新缓存规则

**接口**: `POST /api/v1/cache-rules/update`

**请求**:

```json
{
  "id": 1,
  "name": "缓存规则1",
  "path": "/static/*",
  "ttl": 3600,
  "enabled": true
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 16.4 删除缓存规则

**接口**: `POST /api/v1/cache-rules/delete`

**请求**:

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 17. 数据关联规则

### 17.1 添加网站

**回源配置**：来自「回源分组」  
**缓存规则**：来自「缓存设置」  
**线路配置**：来自「线路分组」

### 17.2 线路分组

**域名选择**：来自「DNS 设置」  
**节点分组**：来自「节点分组」（单选）

### 17.3 节点分组

**子 IP 选择**：来自「节点管理」的所有子 IP

---

## 18. 强制验收标准

1. ✅ 成功响应 `code = 0`
2. ✅ 错误响应使用 `100x / 200x / 300x / 500x`
3. ✅ HTTP 状态码与业务语义匹配
4. ✅ HTTP / WebSocket 使用同一 JWT
5. ✅ WebSocket 使用 Socket.IO（默认路径 `/socket.io/`）
6. ✅ 所有 API 路径包含 `/api/v1`
7. ✅ 前后端 ID 类型完全一致（int）
8. ✅ **只使用 GET 和 POST 方法**
9. ✅ 所有写操作（创建、更新、删除）使用 POST
10. ✅ **接口路径风格统一**：
    - 写操作：`POST /{resource}/create`、`POST /{resource}/update`、`POST /{resource}/delete`
    - 动作型：`POST /{resource}/{action-name}`（kebab-case）
11. ✅ 搜索和筛选参数通过 URL 查询参数传递
12. ✅ 分页参数：`page`（默认 1）、`pageSize`（默认 15，最大 100）
13. ✅ 批量操作使用 `ids` 数组
14. ✅ DNS Record 使用 `name` 字段（废弃 `host`）
15. ✅ 时间格式统一使用 RFC3339
16. ✅ 默认排序：`createdAt desc`

---

## 附录

### A. 列表接口通用约定

- **page** 默认 1
- **pageSize** 默认 15，最大 100
- **默认排序**：`createdAt desc`
- **可选参数**：
  - `sortBy`：排序字段
  - `order`：排序方式（asc / desc）

### B. 更新接口字段规则

1. 未传字段不更新
2. 数组字段默认全量覆盖
3. 增量操作需使用独立接口

### C. originConfig 三选一规则

| type | 必须字段 |
|------|----------|
| origin | groupId |
| redirect | url, statusCode |
| template | templateId |

---

**文档版本**: v2.1  
**最后更新**: 2024-01-16  
**状态**: 最终规范，可直接开发
