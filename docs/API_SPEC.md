# CMDB / CDN 控制面 API 文档

## API & WebSocket 接口规范（v2.0）

**认证方案**：统一 JWT（Bearer Token）  
**WebSocket 实现**：Socket.IO  
**状态**：已定稿，可直接开发

---

## 1. 总体规范

1. **统一认证方式**：JWT（Bearer Token）
2. **HTTP API 与 WebSocket 使用同一套 JWT**
3. **不使用 Cookie Session**
4. **WebSocket 技术栈统一为 Socket.IO**
5. **所有 HTTP API 路径统一使用 `/api/v1` 前缀**
6. **HTTP 状态码用于协议层语义**
7. **body.code 用于业务错误码**
8. **成功时 body.code = 0**
9. **所有 ID 类型均为 int**
10. **时间格式统一使用 RFC3339**
11. **只使用 GET 和 POST 方法**（禁用 PUT、DELETE、PATCH）

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

### 3.2 认证 / 权限错误（1000–1099）

| code | 含义 | HTTP |
|------|------|------|
| 1001 | 未登录 / Token 缺失 | 401 |
| 1002 | Token 无效 | 401 |
| 1003 | Token 过期 | 401 |
| 1004 | 无权限 | 403 |

### 3.3 参数错误（2000–2099）

| code | 含义 | HTTP |
|------|------|------|
| 2001 | 参数缺失 | 400 |
| 2002 | 参数格式错误 | 400 |
| 2003 | 参数值非法 | 400 |

### 3.4 业务错误（3000–3999）

| code | 含义 | HTTP |
|------|------|------|
| 3001 | 资源不存在 | 404 |
| 3002 | 资源已存在 | 409 |
| 3003 | 当前状态不允许操作 | 409 |

### 3.5 系统错误（5000–5999）

| code | 含义 | HTTP |
|------|------|------|
| 5001 | 内部服务错误 | 500 |
| 5002 | 数据库错误 | 500 |
| 5003 | 外部依赖失败 | 502 |

---

## 4. 认证接口

### 4.1 用户登录

**接口**

```
POST /api/v1/auth/login
```

**请求体**

```json
{
  "username": "string",
  "password": "string"
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "jwt-token-string",
    "expireAt": "2024-01-16T10:30:00+08:00",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

**失败响应**

```json
{
  "code": 1001,
  "message": "invalid username or password",
  "data": null
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

### 5.2 JWT 使用方式

**HTTP API**

```
Authorization: Bearer <JWT>
```

**WebSocket（Socket.IO）**

```javascript
io("https://your-domain/ws", {
  auth: {
    token: "<JWT>"
  }
});
```

---

## 6. HTTP API 规范

### 6.1 路径规范

所有 HTTP API 必须使用完整路径：

```
/api/v1/xxx
```

### 6.2 方法规范

**只允许使用 GET 和 POST 方法**：

- **GET**：用于查询数据（列表、详情）
- **POST**：用于所有写操作（创建、更新、删除）

**禁止使用**：PUT、DELETE、PATCH

### 6.3 鉴权规则

- `/api/v1/auth/login`：无需鉴权
- 其余所有接口：
  - 必须校验 JWT
  - 校验失败返回：
    - HTTP 401 / 403
    - 对应业务错误码（1001–1004）

---

## 7. WebSocket（Socket.IO）规范

### 7.1 连接地址

```
https://your-domain/ws
```

### 7.2 认证规则

- 客户端在连接时通过 `auth.token` 传递 JWT
- 服务端在 connection 阶段校验 JWT
- 校验失败立即断开连接

### 7.3 网站列表实时同步

**连接成功事件**

```
event: "connected"
data: { "ok": true }
```

**请求初始数据**

```javascript
socket.emit("request:websites");
```

**初始数据响应**

```
event: "websites:initial"
data: {
  "items": [],
  "total": 50,
  "version": 1024
}
```

**实时更新事件**

```
event: "websites:update"
data: {
  "eventId": 1025,
  "type": "add | update | delete",
  "data": {}
}
```

### 7.4 断线重连规则

1. 客户端保存 `lastEventId`
2. 重连后发送：

```javascript
socket.emit("request:websites", { lastEventId });
```

3. 服务端：
   - 若可补发 → 返回增量更新
   - 否则 → 返回全量 `websites:initial`

---

## 8. 网站管理 API

### 8.1 获取网站列表

**接口**

```
GET /api/v1/websites
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |
| domain | string | 否 | 域名搜索（模糊匹配） |
| cname | string | 否 | CNAME 搜索（模糊匹配） |
| lineGroup | string | 否 | 线路分组筛选 |
| status | string | 否 | 状态筛选：active / inactive |
| https | bool | 否 | HTTPS 筛选 |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "domain": "example.com",
        "cname": "cdn.example.com",
        "lineGroup": "线路1",
        "originConfig": {
          "type": "origin",
          "groupId": 1
        },
        "cacheRuleId": 1,
        "https": true,
        "httpsForceRedirect": true,
        "hsts": false,
        "status": "active",
        "createdAt": "2024-01-15T10:30:00+08:00",
        "updatedAt": "2024-01-15T10:30:00+08:00"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 15
  }
}
```

### 8.2 添加网站

**接口**

```
POST /api/v1/websites/create
```

**请求体**

```json
{
  "domain": "example.com\nwww.example.com\napi.example.com",
  "lineGroup": "线路1",
  "originConfig": {
    "type": "origin",
    "groupId": 1
  },
  "cacheRuleId": 1,
  "https": true,
  "httpsForceRedirect": true,
  "hsts": false
}
```

**字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| domain | string | 是 | 域名列表，每行一个，支持批量添加 |
| lineGroup | string | 是 | 线路分组（来自线路分组数据） |
| originConfig | object | 是 | 回源配置 |
| originConfig.type | string | 是 | 回源类型：origin / redirect / template |
| originConfig.groupId | int | 否 | 回源分组 ID（type=origin 时必填） |
| originConfig.url | string | 否 | 跳转 URL（type=redirect 时必填） |
| originConfig.statusCode | int | 否 | 跳转状态码（type=redirect 时必填） |
| cacheRuleId | int | 是 | 缓存规则 ID（来自缓存设置列表） |
| https | bool | 否 | 是否启用 HTTPS，默认 false |
| httpsForceRedirect | bool | 否 | HTTPS 强制跳转，默认 false |
| hsts | bool | 否 | HSTS，默认 false |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "createdCount": 3,
    "websites": [
      {
        "id": 1,
        "domain": "example.com",
        ...
      },
      {
        "id": 2,
        "domain": "www.example.com",
        ...
      },
      {
        "id": 3,
        "domain": "api.example.com",
        ...
      }
    ]
  }
}
```

### 8.3 更新网站

**接口**

```
POST /api/v1/websites/update
```

**请求体**

```json
{
  "id": 1,
  "domain": "example.com",
  "lineGroup": "线路2",
  "originConfig": {
    "type": "origin",
    "groupId": 2
  },
  "cacheRuleId": 2,
  "https": true,
  "httpsForceRedirect": true,
  "hsts": true
}
```

**字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 网站 ID |
| domain | string | 是 | 域名（单个） |
| 其他字段 | - | 否 | 与添加网站相同，未传字段不更新 |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "domain": "example.com",
    ...
  }
}
```

### 8.4 删除网站

**接口**

```
POST /api/v1/websites/delete
```

**请求体**

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deletedCount": 3
  }
}
```

### 8.5 清除缓存

**接口**

```
POST /api/v1/websites/clear-cache
```

**请求体**

```json
{
  "websiteIds": [1, 2, 3],
  "type": "all",
  "url": "",
  "directory": ""
}
```

**字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| websiteIds | int[] | 是 | 网站 ID 列表 |
| type | string | 是 | 清除类型：all / url / directory |
| url | string | 否 | 指定 URL（type=url 时必填） |
| directory | string | 否 | 指定目录（type=directory 时必填） |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "clearedCount": 3
  }
}
```

---

## 9. 域名管理 API

### 9.1 获取域名列表

**接口**

```
GET /api/v1/domains
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |
| keyword | string | 否 | 关键词搜索 |
| status | string | 否 | 状态筛选 |

**成功响应**

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
        "createdAt": "2024-01-15T10:30:00+08:00"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 15
  }
}
```

### 9.2 添加域名

**接口**

```
POST /api/v1/domains/create
```

**请求体**

```json
{
  "domain": "example.com"
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "domain": "example.com",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00+08:00"
  }
}
```

### 9.3 删除域名

**接口**

```
POST /api/v1/domains/delete
```

**请求体**

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deletedCount": 3
  }
}
```

---

## 10. 节点管理 API

### 10.1 获取节点列表

**接口**

```
GET /api/v1/nodes
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |
| name | string | 否 | 节点名称搜索 |
| ip | string | 否 | IP 地址搜索 |
| status | string | 否 | 状态筛选：online / offline / maintenance |

**成功响应**

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
        "managementPort": 22,
        "status": "online",
        "subIPs": [
          {
            "id": 1,
            "ip": "192.168.1.11",
            "enabled": true,
            "createdDate": "2024-01-15"
          }
        ],
        "createdAt": "2024-01-15T10:30:00+08:00"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 15
  }
}
```

### 10.2 添加节点

**接口**

```
POST /api/v1/nodes/create
```

**请求体**

```json
{
  "name": "Node-01",
  "ip": "192.168.1.10",
  "managementPort": 22,
  "subIPs": [
    {
      "ip": "192.168.1.11",
      "enabled": true
    }
  ]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Node-01",
    ...
  }
}
```

### 10.3 更新节点

**接口**

```
POST /api/v1/nodes/update
```

**请求体**

```json
{
  "id": 1,
  "name": "Node-01-Updated",
  "subIPs": [
    {
      "id": 1,
      "ip": "192.168.1.11",
      "enabled": true
    },
    {
      "ip": "192.168.1.12",
      "enabled": true
    }
  ]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Node-01-Updated",
    ...
  }
}
```

### 10.4 删除节点

**接口**

```
POST /api/v1/nodes/delete
```

**请求体**

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deletedCount": 3
  }
}
```

### 10.5 启用/禁用节点

**接口**

```
POST /api/v1/nodes/toggle-status
```

**请求体**

```json
{
  "id": 1,
  "status": "online"
}
```

**字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 节点 ID |
| status | string | 是 | 目标状态：online / offline |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "online",
    "subIPsUpdated": 3
  }
}
```

**说明**：
- 禁用节点时，所有子 IP 也会被禁用
- 启用节点时，所有子 IP 也会被启用

---

## 11. 节点分组 API

### 11.1 获取节点分组列表

**接口**

```
GET /api/v1/node-groups
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "华东节点组",
        "description": "华东地区节点",
        "subIPs": [
          {
            "nodeId": 1,
            "nodeName": "Node-01",
            "ip": "192.168.1.11"
          }
        ],
        "subIPCount": 5,
        "createdAt": "2024-01-15T10:30:00+08:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 15
  }
}
```

### 11.2 添加节点分组

**接口**

```
POST /api/v1/node-groups/create
```

**请求体**

```json
{
  "name": "华东节点组",
  "description": "华东地区节点",
  "subIPIds": [1, 2, 3]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "华东节点组",
    ...
  }
}
```

### 11.3 更新节点分组

**接口**

```
POST /api/v1/node-groups/update
```

**请求体**

```json
{
  "id": 1,
  "name": "华东节点组-更新",
  "description": "华东地区节点（更新）",
  "subIPIds": [1, 2, 3, 4]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "华东节点组-更新",
    ...
  }
}
```

### 11.4 删除节点分组

**接口**

```
POST /api/v1/node-groups/delete
```

**请求体**

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deletedCount": 3
  }
}
```

---

## 12. 回源分组 API

### 12.1 获取回源分组列表

**接口**

```
GET /api/v1/origin-groups
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "主回源组",
        "description": "主要回源服务器组",
        "addresses": [
          {
            "id": 1,
            "type": "primary",
            "protocol": "http",
            "address": "192.168.1.100:80",
            "weight": 10,
            "ttl": 300
          }
        ],
        "createdAt": "2024-01-15T10:30:00+08:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 15
  }
}
```

### 12.2 添加回源分组

**接口**

```
POST /api/v1/origin-groups/create
```

**请求体**

```json
{
  "name": "主回源组",
  "description": "主要回源服务器组",
  "addresses": [
    {
      "type": "primary",
      "protocol": "http",
      "address": "192.168.1.100:80",
      "weight": 10,
      "ttl": 300
    },
    {
      "type": "backup",
      "protocol": "https",
      "address": "192.168.1.101:443",
      "weight": 5,
      "ttl": 600
    }
  ]
}
```

**字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 回源分组名称 |
| description | string | 否 | 描述 |
| addresses | array | 是 | 回源地址列表 |
| addresses[].type | string | 是 | 类型：primary / backup |
| addresses[].protocol | string | 是 | 协议：http / https |
| addresses[].address | string | 是 | 地址（IP:端口 或 域名:端口） |
| addresses[].weight | int | 是 | 权重 |
| addresses[].ttl | int | 是 | TTL（秒） |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "主回源组",
    ...
  }
}
```

### 12.3 更新回源分组

**接口**

```
POST /api/v1/origin-groups/update
```

**请求体**

```json
{
  "id": 1,
  "name": "主回源组-更新",
  "addresses": [
    {
      "id": 1,
      "type": "primary",
      "protocol": "http",
      "address": "192.168.1.100:80",
      "weight": 10,
      "ttl": 300
    },
    {
      "type": "backup",
      "protocol": "https",
      "address": "192.168.1.102:443",
      "weight": 5,
      "ttl": 600
    }
  ]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "主回源组-更新",
    ...
  }
}
```

### 12.4 删除回源分组

**接口**

```
POST /api/v1/origin-groups/delete
```

**请求体**

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deletedCount": 3
  }
}
```

---

## 13. 线路分组 API

### 13.1 获取线路分组列表

**接口**

```
GET /api/v1/line-groups
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "电信线路",
        "cnamePrefix": "ct",
        "domain": "example.com",
        "cname": "ct.example.com",
        "nodeGroup": "华东节点组",
        "createdAt": "2024-01-15T10:30:00+08:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 15
  }
}
```

### 13.2 添加线路分组

**接口**

```
POST /api/v1/line-groups/create
```

**请求体**

```json
{
  "name": "电信线路",
  "cnamePrefix": "ct",
  "domain": "example.com",
  "nodeGroupId": 1
}
```

**字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 线路分组名称 |
| cnamePrefix | string | 是 | CNAME 前缀 |
| domain | string | 是 | 域名（来自 DNS 设置列表） |
| nodeGroupId | int | 是 | 节点分组 ID（单选） |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "电信线路",
    "cname": "ct.example.com",
    ...
  }
}
```

### 13.3 更新线路分组

**接口**

```
POST /api/v1/line-groups/update
```

**请求体**

```json
{
  "id": 1,
  "name": "电信线路-更新",
  "cnamePrefix": "ct-new",
  "domain": "example.com",
  "nodeGroupId": 2
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "电信线路-更新",
    ...
  }
}
```

### 13.4 删除线路分组

**接口**

```
POST /api/v1/line-groups/delete
```

**请求体**

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deletedCount": 3
  }
}
```

---

## 14. DNS 设置 API

### 14.1 获取 DNS 配置列表

**接口**

```
GET /api/v1/dns
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**

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
        "recordCount": 10,
        "createdAt": "2024-01-15T10:30:00+08:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 15
  }
}
```

### 14.2 获取域名解析记录

**接口**

```
GET /api/v1/dns/:domainId/records
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| domainId | int | 是 | 域名 ID |

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "domain": "example.com",
    "items": [
      {
        "id": 1,
        "type": "CNAME",
        "host": "www.example.com",
        "value": "cdn.example.com",
        "ttl": 600,
        "status": "active",
        "createdAt": "2024-01-15T10:30:00+08:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 15
  }
}
```

### 14.3 添加 DNS 配置

**接口**

```
POST /api/v1/dns/create
```

**请求体**

```json
{
  "domain": "example.com"
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "domain": "example.com",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00+08:00"
  }
}
```

### 14.4 删除 DNS 配置

**接口**

```
POST /api/v1/dns/delete
```

**请求体**

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deletedCount": 3
  }
}
```

---

## 15. 缓存设置 API

### 15.1 获取缓存规则列表

**接口**

```
GET /api/v1/cache-rules
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 15 |

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "静态资源缓存",
        "description": "图片、CSS、JS 等静态资源缓存规则",
        "rules": [
          {
            "path": "*.jpg",
            "ttl": 86400
          },
          {
            "path": "*.css",
            "ttl": 3600
          }
        ],
        "createdAt": "2024-01-15T10:30:00+08:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 15
  }
}
```

### 15.2 添加缓存规则

**接口**

```
POST /api/v1/cache-rules/create
```

**请求体**

```json
{
  "name": "静态资源缓存",
  "description": "图片、CSS、JS 等静态资源缓存规则",
  "rules": [
    {
      "path": "*.jpg",
      "ttl": 86400
    },
    {
      "path": "*.css",
      "ttl": 3600
    }
  ]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "静态资源缓存",
    ...
  }
}
```

### 15.3 更新缓存规则

**接口**

```
POST /api/v1/cache-rules/update
```

**请求体**

```json
{
  "id": 1,
  "name": "静态资源缓存-更新",
  "rules": [
    {
      "path": "*.jpg",
      "ttl": 172800
    }
  ]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "静态资源缓存-更新",
    ...
  }
}
```

### 15.4 删除缓存规则

**接口**

```
POST /api/v1/cache-rules/delete
```

**请求体**

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deletedCount": 3
  }
}
```

---

## 16. 数据关联规则

### 16.1 添加网站

**默认数据源**：
1. **回源配置**：来自「回源分组」列表
2. **缓存规则**：来自「缓存设置」列表
3. **线路配置**：来自「线路分组」列表

**示例流程**：
1. 用户选择「使用分组」（默认选项）
2. 下拉框显示所有回源分组
3. 用户选择「主回源组」（groupId: 1）
4. 提交时发送：`originConfig: { type: "origin", groupId: 1 }`

### 16.2 线路分组

**数据源**：
1. **域名选择**：来自「DNS 设置」列表
2. **节点分组**：来自「节点分组」列表（单选）

**示例流程**：
1. 用户选择域名：example.com
2. 用户选择节点分组：华东节点组（nodeGroupId: 1）
3. 系统自动生成 CNAME：`{cnamePrefix}.{domain}`

### 16.3 节点分组

**数据源**：
1. **子 IP 选择**：来自「节点管理」的所有子 IP

**示例流程**：
1. 穿梭框左侧显示所有可用子 IP
2. 用户选择需要的子 IP
3. 提交时发送：`subIPIds: [1, 2, 3]`

---

## 17. ID 类型规范

1. **所有持久化对象 ID 类型必须为 int**
2. **禁止 string / 混合类型 ID**
3. **前端临时 ID 如需使用**：
   - 字段名必须为 `clientId`
   - 明确不入库、不参与接口交互

---

## 18. 时间格式规范

- **时间字段统一使用 RFC3339**：

```
2024-01-15T10:30:00+08:00
```

- **纯日期字段**：

```
YYYY-MM-DD
```

---

## 19. 强制验收标准

1. ✅ 成功响应 `code = 0`
2. ✅ 错误响应使用 `100x / 200x / 300x / 500x`
3. ✅ HTTP 状态码与业务语义匹配
4. ✅ HTTP / WebSocket 使用同一 JWT
5. ✅ WebSocket 使用 Socket.IO
6. ✅ 所有 API 路径包含 `/api/v1`
7. ✅ 前后端 ID 类型完全一致（int）
8. ✅ **只使用 GET 和 POST 方法**
9. ✅ 所有写操作（创建、更新、删除）使用 POST
10. ✅ 搜索和筛选参数通过 URL 查询参数传递
11. ✅ 分页参数：`page`、`pageSize`
12. ✅ 批量操作使用 `ids` 数组

---

## 20. 前端实现要求

### 20.1 URL 参数路由

所有列表页面必须支持 URL 参数同步：

**示例**：

```
/website/list?page=2&pageSize=20&domain=example&status=active
/website/nodes?name=node-01&status=online
/website/dns?keyword=example
```

**要求**：
- 搜索条件同步到 URL
- 分页参数同步到 URL
- 筛选条件同步到 URL
- 刷新页面保持状态
- 可以分享 URL

### 20.2 搜索功能

**模糊搜索**（不区分大小写）：
- 域名搜索
- 节点名称搜索
- IP 地址搜索

**精确筛选**：
- 状态筛选
- 线路分组筛选
- HTTPS 筛选

### 20.3 批量操作

**支持的批量操作**：
- 批量删除
- 批量清除缓存

**要求**：
- 使用 Checkbox 多选
- 显示选中数量
- 二次确认（Popconfirm）

---

## 21. 结论

本文档为 **最终接口与协议规范 v2.0**。

前端、后端、测试均需严格按此执行，任何新增功能不得破坏本规范。

**主要更新**：
1. ✅ 添加完整的 CRUD API
2. ✅ 添加搜索和筛选参数
3. ✅ 添加批量操作 API
4. ✅ 添加节点启用/禁用 API
5. ✅ 添加清除缓存 API
6. ✅ 添加 DNS 解析记录 API
7. ✅ 明确数据关联规则
8. ✅ 明确只使用 GET 和 POST 方法
9. ✅ 明确 URL 参数路由要求
10. ✅ 明确前端实现要求
