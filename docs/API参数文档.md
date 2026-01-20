# CMDB API 参数文档

## 基础信息

- **API 基础地址**: `http://localhost:8080/api/v1`
- **WebSocket 地址**: `ws://localhost:8080/ws`
- **认证方式**: Bearer Token (JWT)
- **请求头**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`

## 通用参数

### 分页参数

所有列表接口都支持以下分页参数：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 当前页码，从 1 开始 |
| pageSize | number | 否 | 15 | 每页显示数量，可选值：15, 20, 50, 100 |

### 搜索参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| search | string | 否 | 搜索关键词，支持模糊匹配 |

### 排序参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sortBy | string | 否 | 排序字段名 |
| sortOrder | string | 否 | 排序方向，可选值：asc（升序）、desc（降序） |

### 筛选参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | string | 否 | 状态筛选 |
| type | string | 否 | 类型筛选 |

---

## 1. 用户管理 (Users)

### 1.1 获取用户列表

**接口**: `GET /users`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索用户名、邮箱 |
| role | string | 否 | 角色筛选：admin, user |
| status | string | 否 | 状态筛选：active, inactive |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "username": "admin",
        "email": "admin@cmdb.local",
        "role": "admin",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 15
  }
}
```

### 1.2 创建用户

**接口**: `POST /users`

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "admin | user"
}
```

### 1.3 更新用户

**接口**: `PUT /users/:id`

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "role": "admin | user",
  "status": "active | inactive"
}
```

### 1.4 修改密码

**接口**: `PUT /users/:id/password`

**请求体**:
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

---

## 2. 域名管理 (Domains)

### 2.1 获取域名列表

**接口**: `GET /domains`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索域名 |
| status | string | 否 | 状态筛选：active, expired, pending |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "domain": "example.com",
        "status": "active",
        "expiryDate": "2025-12-31",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 15
  }
}
```

### 2.2 创建域名

**接口**: `POST /domains`

**请求体**:
```json
{
  "domain": "string",
  "registrar": "string",
  "expiryDate": "string (YYYY-MM-DD)"
}
```

---

## 3. 证书管理 (Certificates)

### 3.1 获取证书列表

**接口**: `GET /certificates`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索域名 |
| status | string | 否 | 状态筛选：valid, expiring, expired |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "domain": "example.com",
        "status": "valid",
        "expiryDate": "2025-06-30",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 15
  }
}
```

### 3.2 更新证书

**接口**: `PUT /certificates/:id`

**请求体**:
```json
{
  "certificate": "string (PEM format)",
  "privateKey": "string (PEM format)",
  "expiryDate": "string (YYYY-MM-DD)"
}
```

### 3.3 续期证书

**接口**: `POST /certificates/:id/renew`

---

## 4. 网站管理 (Websites)

### 4.1 获取网站列表

**接口**: `GET /websites`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索域名 |
| status | string | 否 | 状态筛选：active, inactive |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "domain": "example.com",
        "status": "active",
        "lineGroup": "线路组1",
        "cacheRule": "缓存规则1",
        "httpsEnabled": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 80,
    "page": 1,
    "pageSize": 15
  }
}
```

### 4.2 创建网站

**接口**: `POST /websites`

**请求体**:
```json
{
  "domain": "string",
  "lineGroupId": "string",
  "cacheRuleId": "string",
  "httpsEnabled": boolean,
  "httpsForce": boolean,
  "hsts": boolean,
  "originConfig": {
    "type": "group | redirect | custom",
    "groupId": "string",
    "redirectUrl": "string",
    "customIPs": ["string"]
  }
}
```

### 4.3 清除缓存

**接口**: `POST /websites/:id/cache`

**请求体**:
```json
{
  "type": "all | url | directory",
  "target": "string (URL或目录路径)"
}
```

---

## 5. 回源分组 (Origin Groups)

### 5.1 获取回源分组列表

**接口**: `GET /origin-groups`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索名称或地址 |
| status | string | 否 | 状态筛选：active, inactive |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "name": "标准回源",
        "address": "192.168.1.100",
        "description": "标准回源服务器",
        "status": "active"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 15
  }
}
```

### 5.2 创建回源分组

**接口**: `POST /origin-groups`

**请求体**:
```json
{
  "name": "string",
  "address": "string",
  "description": "string",
  "port": number,
  "weight": number
}
```

---

## 6. 线路分组 (Line Groups)

### 6.1 获取线路分组列表

**接口**: `GET /line-groups`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索名称或CNAME |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "name": "电信线路",
        "nodeGroup": "节点组1",
        "cname": "ct.example.com",
        "nodeCount": 10
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 15
  }
}
```

### 6.2 创建线路分组

**接口**: `POST /line-groups`

**请求体**:
```json
{
  "name": "string",
  "nodeGroupId": "string",
  "description": "string"
}
```

---

## 7. 节点管理 (Nodes)

### 7.1 获取节点列表

**接口**: `GET /nodes`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索节点名称或IP |
| status | string | 否 | 状态筛选：online, offline, maintenance |
| enabled | boolean | 否 | 启用状态筛选 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "name": "节点 1",
        "ip": "192.168.1.60",
        "port": 8081,
        "status": "online",
        "enabled": true,
        "subIPs": [
          {
            "id": "1-1",
            "ip": "192.168.1.61",
            "enabled": true
          }
        ]
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 15
  }
}
```

### 7.2 创建节点

**接口**: `POST /nodes`

**请求体**:
```json
{
  "name": "string",
  "ip": "string",
  "port": number,
  "location": "string",
  "description": "string"
}
```

### 7.3 切换节点状态

**接口**: `PUT /nodes/:id/status`

**请求体**:
```json
{
  "enabled": boolean
}
```

### 7.4 获取子IP列表

**接口**: `GET /nodes/:nodeId/sub-ips`

### 7.5 添加子IP

**接口**: `POST /nodes/:nodeId/sub-ips`

**请求体**:
```json
{
  "ip": "string",
  "enabled": boolean
}
```

---

## 8. 节点分组 (Node Groups)

### 8.1 获取节点分组列表

**接口**: `GET /node-groups`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索名称 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "name": "华东节点组",
        "description": "华东地区节点",
        "nodeCount": 15
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 15
  }
}
```

### 8.2 创建节点分组

**接口**: `POST /node-groups`

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "nodeIds": ["string"]
}
```

---

## 9. 缓存设置 (Cache Settings)

### 9.1 获取缓存设置列表

**接口**: `GET /cache-settings`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索名称 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "name": "静态资源缓存",
        "ttl": 3600,
        "rules": ["*.js", "*.css", "*.png"]
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 15
  }
}
```

### 9.2 创建缓存设置

**接口**: `POST /cache-settings`

**请求体**:
```json
{
  "name": "string",
  "ttl": number,
  "rules": ["string"],
  "description": "string"
}
```

---

## 10. DNS 配置 (DNS Config)

### 10.1 获取DNS配置列表

**接口**: `GET /dns-config`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索域名或记录 |
| type | string | 否 | 记录类型：A, AAAA, CNAME, MX, TXT |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "domain": "example.com",
        "type": "A",
        "value": "192.168.1.1",
        "ttl": 600
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 15
  }
}
```

### 10.2 创建DNS记录

**接口**: `POST /dns-config`

**请求体**:
```json
{
  "domain": "string",
  "type": "A | AAAA | CNAME | MX | TXT",
  "value": "string",
  "ttl": number,
  "priority": number
}
```

---

## 11. 密钥管理 (API Keys)

### 11.1 获取密钥列表

**接口**: `GET /api-keys`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索名称、账号或类型 |
| type | string | 否 | 类型筛选：cloudflare, aws, aliyun, tencent |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "name": "Cloudflare API",
        "account": "user@example.com",
        "type": "cloudflare",
        "key": "sk_****abc123",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 15
  }
}
```

### 11.2 创建密钥

**接口**: `POST /api-keys`

**请求体**:
```json
{
  "name": "string",
  "account": "string",
  "type": "cloudflare | aws | aliyun | tencent",
  "key": "string",
  "secret": "string"
}
```

---

## 12. 服务器管理 (Servers)

### 12.1 获取服务器列表

**接口**: `GET /servers`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| search | string | 否 | 搜索名称或IP |
| status | string | 否 | 状态筛选：online, offline, maintenance |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "name": "服务器 1",
        "ip": "192.168.1.100",
        "status": "online",
        "cpu": 45.5,
        "memory": 60.2,
        "disk": 75.8
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 15
  }
}
```

### 12.2 获取服务器统计

**接口**: `GET /servers/:id/stats`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| period | string | 否 | 时间周期：1h, 24h, 7d, 30d |

---

## 13. 仪表板 (Dashboard)

### 13.1 获取概览数据

**接口**: `GET /dashboard/overview`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalWebsites": 100,
    "totalNodes": 50,
    "totalDomains": 80,
    "totalServers": 20,
    "onlineServers": 18,
    "offlineServers": 2
  }
}
```

### 13.2 获取统计数据

**接口**: `GET /dashboard/stats`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| period | string | 否 | 时间周期：1h, 24h, 7d, 30d |

### 13.3 获取最近活动

**接口**: `GET /dashboard/activities`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| limit | number | 否 | 返回数量，默认 10 |

---

## 错误响应格式

所有接口在发生错误时，返回统一的错误格式：

```json
{
  "code": 400,
  "message": "错误描述",
  "errors": [
    {
      "field": "字段名",
      "message": "字段错误信息"
    }
  ]
}
```

## 常见错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 删除成功（无内容返回） |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或 token 失效） |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
