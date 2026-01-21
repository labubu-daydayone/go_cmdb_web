# CMDB系统 API接口文档

## 说明
- **HTTP方法规范**：
  - **网站列表查询**：使用 **WebSocket** 实时推送（不使用HTTP GET）
  - **其他列表查询**：使用 **GET** 方法
  - **创建/更新/删除**：使用 **POST** 方法（不使用PUT/DELETE）
- **所有ID字段类型为 int**（整数）
- 基础URL: `/api/v1`
- 认证方式: Bearer Token (在请求头中携带: `Authorization: Bearer <token>`)
- **实时更新**: 网站列表使用WebSocket实现实时数据推送和更新（详见WebSocket章节）

## 统一响应格式

### HTTP状态码与响应code同步规范

**重要**: HTTP状态码与响应体中的`code`字段保持一致，确保客户端可以通过任一方式判断请求结果。

| 场景 | HTTP状态码 | body.code | body.message 示例 |
|------|-----------|-----------|------------------|
| 成功 | 200 | 200 | "success" |
| 参数错误 | 400 | 400 | "参数错误" |
| 未认证 | 401 | 401 | "未认证" |
| 无权限 | 403 | 403 | "无权限" |
| 资源不存在 | 404 | 404 | "资源不存在" |
| 服务器错误 | 500 | 500 | "服务器内部错误" |

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "错误信息",
  "data": null
}
```

### 列表响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "pageSize": 15
  }
}
```

---

## WebSocket 实时更新

### 技术栈
- **协议**: Socket.IO
- **连接路径**: `ws://your-domain/ws`
- **认证方式**: Cookie Session认证

### 认证机制

1. **登录后获取Session Cookie**:
   - 用户通过 `POST /api/v1/auth/login` 登录成功后，服务端会下发HttpOnly session cookie
   - Cookie会自动存储在浏览器中

2. **WebSocket自动带上Cookie**:
   - WebSocket连接时，同域请求会自动带上session cookie
   - 无需在WS握手时手动传递token

3. **客户端连接示例**:
```javascript
import io from 'socket.io-client';

const socket = io('ws://your-domain/ws', {
  withCredentials: true  // 自动带cookie
});
```

### 连接地址
```
ws://your-domain/ws
```

### 网站列表实时更新

#### 连接后自动事件
- `connected`: 连接成功确认
- `websites:initial`: 初始数据加载

#### 请求初始数据
客户端发送:
```javascript
socket.emit('request:websites');
```

服务端响应:
```javascript
socket.on('websites:initial', (data) => {
  // data 结构:
  {
    items: Website[],      // 网站列表
    total: number,         // 总数
    version: number        // 数据版本号（用于断线重连后对比）
  }
});
```

#### 监听增量更新事件
```javascript
socket.on('websites:update', (update) => {
  // update 结构:
  {
    eventId: number,       // 事件ID（递增，用于断线重连后对比）
    type: 'add' | 'update' | 'delete',
    data: Website | { id: number }  // 删除时只返回id
  }
});
```

#### 断线重连机制
```javascript
socket.on('reconnect', () => {
  // 重连后重新请求全量数据
  socket.emit('request:websites');
});
```

#### 更新类型说明

**添加网站** (`type: 'add'`):
```json
{
  "type": "add",
  "data": {
    "id": 1,
    "domain": "example.com",
    "cname": "cdn.example.com",
    "lineGroup": "线路1",
    "https": true,
    "status": "active",
    "createdDate": "2024-01-15"
  }
}
```

**更新网站** (`type: 'update'`):
```json
{
  "type": "update",
  "data": {
    "id": 1,
    "domain": "new-example.com",
    "https": false
  }
}
```

**删除网站** (`type: 'delete'`):
```json
{
  "type": "delete",
  "data": {
    "id": 1
  }
}
```

---

## 1. 认证接口

### 1.1 用户登录
**接口**: `POST /api/v1/auth/login`

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"  // 用户角色: admin=管理员 | readonly=只读用户
    }
  }
}
```

**字段说明**:
- `token`: JWT令牌，用于后续请求认证
- `user.id`: 用户ID（int类型）
- `user.username`: 用户名
- `user.email`: 用户邮箱
- `user.role`: 用户角色
  - `admin`: 管理员，拥有所有权限
  - `readonly`: 只读用户，仅可查看数据

**JWT Claims 结构**:
```json
{
  "uid": 1,                    // 用户ID
  "sub": "admin",              // 用户名
  "role": "admin",             // 用户角色
  "exp": 1737532800,           // 过期时间（Unix时间戳）
  "iat": 1737446400            // 签发时间（Unix时间戳）
}
```

---

## 2. 网站管理

> **重要**: 网站列表使用 **WebSocket** 实时推送，不使用HTTP GET接口。详见WebSocket章节。

### 2.1 获取网站列表
**方式**: **WebSocket**

**说明**: 
- 网站列表通过WebSocket实时推送，不提供HTTP GET接口
- 客户端连接WebSocket后，发送 `request:websites` 事件请求初始数据
- 服务端通过 `websites:initial` 事件返回完整列表
- 后续更新通过 `websites:update` 事件实时推送

**请求初始数据**:
```javascript
socket.emit('request:websites');
```

**接收初始数据**:
```javascript
socket.on('websites:initial', (data) => {
  // data 结构:
  {
    items: [
      {
        id: 1,
        domain: "example.com",
        cname: "example.cdn.com",
        lineGroup: "线路1",
        https: true,
        status: "active",
        createdDate: "2024-01-15",
        originConfig: {
          type: "origin",
          originIPs: [
            {
              ip: "192.168.1.100",
              remark: "主服务器"
            }
          ]
        },
        httpsConfig: {
          forceRedirect: true,
          hstsEnabled: true,
          certificateType: "auto"
        },
        cacheRules: "静态资源缓存"
      }
    ],
    total: 50
  }
});
```

**实时更新**:
```javascript
socket.on('websites:update', (update) => {
  // update.type: 'add' | 'update' | 'delete'
  // update.data: Website对象或更新数据
});
```

### 2.2 获取单个网站详情
**接口**: `GET /websites/:id`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "domain": "example.com",
    "cname": "example.cdn.com",
    "lineGroup": "线路1",
    "https": true,
    "status": "active",
    "createdDate": "2024-01-15",
    "originConfig": {
      "id": 1,
      "websiteId": 1,
      "originIPs": [
        {
          "id": "origin-1-0",
          "type": "primary",
          "protocol": "https",
          "address": "192.168.1.100:443",
          "weight": 10,
          "enabled": true
        },
        {
          "id": "origin-1-1",
          "type": "backup",
          "protocol": "http",
          "address": "192.168.1.101:80",
          "weight": 5,
          "enabled": true
        }
      ],
      "redirectEnabled": false,
      "redirectUrl": "",
      "redirectStatusCode": 301,
      "createdDate": "2024-01-15"
    },
    "httpsConfig": {
      "forceRedirect": true,
      "hstsEnabled": true,
      "certificateType": "auto",
      "certificateData": "",
      "privateKeyData": ""
    },
    "cacheRules": "首页缓存"
  }
}
```

**字段说明**:
- `originConfig`: 回源配置对象
  - `originIPs`: 回源IP列表（手动回源时使用）
    - `type`: 类型 (primary=主源 | backup=备源)
    - `protocol`: 协议 (http | https)
    - `address`: 地址 (如: 8.8.8.8:80)
    - `weight`: 权重 (整数，默认值为10)
    - `enabled`: 是否启用
  - `redirectEnabled`: 是否启用重定向
  - `redirectUrl`: 重定向URL
  - `redirectStatusCode`: 重定向状态码 (301 | 302)
- `httpsConfig`: HTTPS配置对象（可选，仅当https=true时有效）
  - `forceRedirect`: 强制HTTPS跳转
  - `hstsEnabled`: 启用HSTS
  - `certificateType`: 证书类型 (manual=手动 | auto=自动)
  - `certificateData`: 证书内容（仅manual时需要）
  - `privateKeyData`: 私钥内容（仅manual时需要）
- `cacheRules`: 缓存规则名称（可选）

### 2.3 添加网站
**接口**: `POST /websites`

**请求体**:
```json
{
  "domain": "string",
  "lineGroup": "string",
  "https": boolean,
  "originConfig": {
    "type": "origin | redirect | template",  // 回源类型（三选一）
    // 当 type = "origin" (手动回源) 时，只需要 originIPs
    "originIPs": [
      {
        "type": "primary | backup",  // 主源 | 备源
        "protocol": "http | https",  // 协议
        "address": "string",          // 地址 (如: 8.8.8.8:80)
        "weight": number              // 权重
      }
    ],
    // 当 type = "redirect" (重定向) 时，只需要 redirectUrl 和 redirectStatusCode
    "redirectUrl": "string",
    "redirectStatusCode": 301 | 302,  // 301=永久重定向, 302=临时重定向
    // 当 type = "template" (使用分组) 时，只需要 template
    "template": "string"  // 回源分组名称
  },
  "httpsConfig": {
    "forceRedirect": boolean,
    "hstsEnabled": boolean,
    "certificateType": "manual | auto",
    "certificateData": "string",
    "privateKeyData": "string"
  },
  "cacheRules": "string"
}
```

**originConfig 字段说明** (三选一):

1. **手动回源** (`type: "origin"`):
   ```json
   {
     "type": "origin",
     "originIPs": [
       {
         "type": "primary",
         "protocol": "https",
         "address": "192.168.1.100:443",
         "weight": 10
       }
     ]
   }
   ```

2. **重定向** (`type: "redirect"`):
   ```json
   {
     "type": "redirect",
     "redirectUrl": "https://new-site.com",
     "redirectStatusCode": 301
   }
   ```

3. **使用分组** (`type: "template"`):
   ```json
   {
     "type": "template",
     "template": "回源分组1"
   }
   ```

**字段数据来源说明**:

| 字段 | 数据来源 | 接口 | 说明 |
|------|---------|------|------|
| `lineGroup` | 线路分组 | `GET /api/v1/line-groups` | 从线路分组列表中选择 |
| `originConfig.template` | 回源分组 | `GET /api/v1/origin-groups` | 从回源分组列表中选择 |
| `cacheRules` | 缓存设置 | `GET /api/v1/cache-settings` | 从缓存设置列表中选择 |

**默认值**:
- 默认回源配置类型: `template` (使用分组)
- 默认HTTPS: `false`
- 默认强制HTTPS重定向: `false`
- 默认HSTS: `false`
- 默认证书类型: `auto`

### 2.4 更新网站
**接口**: `POST /api/v1/websites/update`

**请求体**:
```json
{
  "id": 1,
  "domain": "string",
  "lineGroup": "string",
  "https": boolean,
  "status": "active | inactive",
  "originConfig": {
    "type": "origin | redirect | template",  // 回源类型（三选一）
    // 当 type = "origin" (手动回源) 时，只需要 originIPs
    "originIPs": [
      {
        "type": "primary | backup",  // 主源 | 备源
        "protocol": "http | https",  // 协议
        "address": "string",          // 地址 (如: 8.8.8.8:80)
        "weight": number,             // 权重
        "enabled": boolean            // 是否启用
      }
    ],
    // 当 type = "redirect" (重定向) 时，只需要 redirectUrl 和 redirectStatusCode
    "redirectUrl": "string",
    "redirectStatusCode": 301 | 302,  // 301=永久重定向, 302=临时重定向
    // 当 type = "template" (使用分组) 时，只需要 template
    "template": "string"  // 回源分组名称
  },
  "httpsConfig": {
    "forceRedirect": boolean,
    "hstsEnabled": boolean,
    "certificateType": "manual | auto",
    "certificateData": "string",
    "privateKeyData": "string"
  },
  "cacheRules": "string"
}
```

**字段说明**:
- `originConfig`: 回源配置对象（三种模式三选一）
  - `type="origin"`: 手动回源，必须有originIPs，禁止redirect/template字段
  - `type="redirect"`: 重定向，必须有redirectUrl/redirectStatusCode
  - `type="template"`: 使用分组，必须有template
- `httpsConfig`: HTTPS配置对象（可选，仅当https=true时有效）
- `cacheRules`: 缓存规则名称（可选）

### 2.5 删除网站
**接口**: `POST /api/v1/websites/delete`

**请求体**:
```json
{
  "id": 1
}
```

### 2.6 清除缓存
**接口**: `POST /api/v1/websites/clear-cache`

**请求体**:
```json
{
  "websiteId": 1,
  "type": "all | url | directory",
  "url": "string",
  "directory": "string"
}
```

### 2.7 批量清除缓存
**接口**: `POST /api/v1/websites/batch-clear-cache`

**请求体**:
```json
{
  "websiteIds": [1, 2, 3]
}
```

---

## 3. 域名管理

### 3.1 获取域名列表
**接口**: `GET /api/v1/domains`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| search | string | 否 | 搜索域名 |
| status | string | 否 | 状态筛选：all, active, inactive, expired |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "example.com",
        "registrar": "GoDaddy",
        "status": "active",
        "expiryDate": "2025-12-31",
        "sslStatus": "valid",
        "createdDate": "2024-01-15"
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 15
  }
}
```

### 3.2 添加域名
**接口**: `POST /api/v1/domains`

**请求体**:
```json
{
  "name": "string",
  "registrar": "string",
  "expiryDate": "string"
}
```

### 3.3 更新域名
**接口**: `POST /api/v1/domains/update`

**请求体**:
```json
{
  "id": 1,
  "name": "string",
  "registrar": "string",
  "expiryDate": "string",
  "status": "active | inactive | expired"
}
```

### 3.4 删除域名
**接口**: `POST /api/v1/domains/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 4. 证书管理

### 4.1 获取证书列表
**接口**: `GET /api/v1/certificates`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| search | string | 否 | 搜索域名 |
| status | string | 否 | 状态筛选：all, valid, expiring, expired |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "domain": "example.com",
        "provider": "letsencrypt",
        "status": "valid",
        "issueDate": "2024-01-15T10:30:00+08:00",
        "expiryDate": "2025-01-15T10:30:00+08:00",
        "updatedAt": "2024-01-20T15:20:15+08:00",
        "certificate": "-----BEGIN CERTIFICATE-----\n...",
        "privateKey": "-----BEGIN RSA PRIVATE KEY-----\n..."
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 15
  }
}
```

### 4.2 更新证书
**接口**: `POST /api/v1/certificates/update`

**请求体**:
```json
{
  "id": 1,
  "certificate": "string",
  "privateKey": "string"
}
```

### 4.3 删除证书
**接口**: `POST /api/v1/certificates/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 5. API密钥管理

### 5.1 获取API密钥列表
**接口**: `GET /api/v1/api-keys`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| search | string | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "生产环境密钥",
        "account": "admin@example.com",
        "accountType": "管理员",
        "apiKey": "sk_live_xxxxxxxxxxxxx",
        "createdDate": "2024-01-15"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 15
  }
}
```

### 5.2 添加API密钥
**接口**: `POST /api/v1/api-keys`

**请求体**:
```json
{
  "name": "string",
  "account": "string",
  "accountType": "string"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "apiKey": "sk_live_xxxxxxxxxxxxx"
  }
}
```

### 5.3 删除API密钥
**接口**: `POST /api/v1/api-keys/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 6. 节点管理

### 6.1 获取节点列表
**接口**: `GET /api/v1/nodes`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| search | string | 否 | 搜索关键词 |
| status | string | 否 | 状态筛选：all, online, offline, maintenance |
| enabled | string | 否 | 启用状态：all, true, false |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "节点 1",
        "ip": "192.168.1.100",
        "managementPort": 8080,
        "enabled": true,
        "status": "online",
        "lineGroupId": 1,
        "createdDate": "2024-01-15",
        "subIPs": [
          {
            "id": 1,
            "ip": "192.168.1.101",
            "enabled": true,
            "createdDate": "2024-01-15"
          }
        ]
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 15
  }
}
```

### 6.2 添加节点
**接口**: `POST /api/v1/nodes`

**请求体**:
```json
{
  "name": "string",
  "ip": "string",
  "managementPort": 8080,
  "lineGroupId": 1,
  "subIPs": [
    {
      "ip": "string"
    }
  ]
}
```

### 6.3 更新节点
**接口**: `POST /api/v1/nodes/update`

**请求体**:
```json
{
  "id": 1,
  "name": "string",
  "ip": "string",
  "managementPort": 8080,
  "enabled": boolean,
  "status": "online | offline | maintenance"
}
```

### 6.4 删除节点
**接口**: `POST /api/v1/nodes/delete`

**请求体**:
```json
{
  "id": 1
}
```

### 6.5 添加子IP
**接口**: `POST /api/v1/nodes/add-subip`

**请求体**:
```json
{
  "nodeId": 1,
  "subIPs": [
    {
      "ip": "string"
    }
  ]
}
```

### 6.6 删除子IP
**接口**: `POST /api/v1/nodes/delete-subip`

**请求体**:
```json
{
  "nodeId": 1,
  "subIPId": 1
}
```

### 6.7 切换子IP状态
**接口**: `POST /api/v1/nodes/toggle-subip`

**请求体**:
```json
{
  "nodeId": 1,
  "subIPId": 1,
  "enabled": boolean
}
```

---

## 7. 线路分组

### 7.1 获取线路分组列表
**接口**: `GET /api/v1/line-groups`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| search | string | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "线路1",
        "description": "主线路",
        "cname": "line1.cdn.com",
        "nodeCount": 5,
        "createdDate": "2024-01-15"
      }
    ],
    "total": 8,
    "page": 1,
    "pageSize": 15
  }
}
```

### 7.2 添加线路分组
**接口**: `POST /api/v1/line-groups`

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "cname": "string"
}
```

### 7.3 更新线路分组
**接口**: `POST /api/v1/line-groups/update`

**请求体**:
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "cname": "string"
}
```

### 7.4 删除线路分组
**接口**: `POST /api/v1/line-groups/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 8. 节点分组

### 8.1 获取节点分组列表
**接口**: `GET /api/v1/node-groups`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| search | string | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "分组1",
        "description": "主节点分组",
        "subIPs": [
          {
            "id": 1,
            "ip": "192.168.1.101",
            "enabled": true,
            "createdDate": "2024-01-15"
          }
        ],
        "createdDate": "2024-01-15"
      }
    ],
    "total": 6,
    "page": 1,
    "pageSize": 15
  }
}
```

### 8.2 添加节点分组
**接口**: `POST /api/v1/node-groups`

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "subIPs": [
    {
      "ip": "string"
    }
  ]
}
```

### 8.3 更新节点分组
**接口**: `POST /api/v1/node-groups/update`

**请求体**:
```json
{
  "id": 1,
  "name": "string",
  "description": "string"
}
```

### 8.4 删除节点分组
**接口**: `POST /api/v1/node-groups/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 9. 回源分组

### 9.1 获取回源分组列表
**接口**: `GET /api/v1/origin-groups`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| search | string | 否 | 搜索关键词 |
| status | string | 否 | 状态筛选：all, active, inactive |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "回源组1",
        "type": "主源",
        "addresses": [
          {
            "id": 1,
            "type": "主源",
            "protocol": "https",
            "ip": "192.168.1.100",
            "port": 443,
            "weight": 100,
            "remark": "主服务器"
          }
        ],
        "description": "主回源组",
        "status": "active"
      }
    ],
    "total": 12,
    "page": 1,
    "pageSize": 15
  }
}
```

### 9.2 添加回源分组
**接口**: `POST /api/v1/origin-groups`

**请求体**:
```json
{
  "name": "string",
  "type": "string",
  "description": "string",
  "addresses": [
    {
      "type": "主源 | 备源 | 活跃",
      "protocol": "http | https",
      "ip": "string",
      "port": 80,
      "weight": 100,
      "remark": "string"
    }
  ]
}
```

### 9.3 更新回源分组
**接口**: `POST /api/v1/origin-groups/update`

**请求体**:
```json
{
  "id": 1,
  "name": "string",
  "type": "string",
  "description": "string",
  "status": "active | inactive",
  "addresses": [
    {
      "id": 1,
      "type": "主源 | 备源 | 活跃",
      "protocol": "http | https",
      "ip": "string",
      "port": 80,
      "weight": 100,
      "remark": "string"
    }
  ]
}
```

### 9.4 删除回源分组
**接口**: `POST /api/v1/origin-groups/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 10. DNS配置

### 10.1 获取DNS配置列表
**接口**: `GET /api/v1/dns-config`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| search | string | 否 | 搜索域名 |
| status | string | 否 | 状态筛选：all, active, inactive |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "domain": "example.com",
        "token": "token_abc123xyz",
        "createdDate": "2024-01-15",
        "status": "active"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 15
  }
}
```

### 10.2 添加DNS配置
**接口**: `POST /api/v1/dns-config`

**请求体**:
```json
{
  "domain": "string",
  "token": "string"
}
```

### 10.3 删除DNS配置
**接口**: `POST /api/v1/dns-config/delete`

**请求体**:
```json
{
  "id": 1
}
```

### 10.4 获取DNS解析记录
**接口**: `GET /api/v1/dns-records/:domainId`

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| domainId | int | 是 | DNS配置ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "domain": "example.com",
    "records": [
      {
        "id": 1,
        "domainId": 1,
        "type": "CNAME",
        "host": "www",
        "value": "cdn-node-1.example.com",
        "ttl": 600,
        "status": "active",
        "createdAt": "2024-01-15T10:30:00+08:00",
        "updatedAt": "2024-01-15T10:30:00+08:00"
      },
      {
        "id": 2,
        "domainId": 1,
        "type": "CNAME",
        "host": "@",
        "value": "cdn-node-2.example.com",
        "ttl": 600,
        "status": "active",
        "createdAt": "2024-01-15T11:00:00+08:00",
        "updatedAt": "2024-01-15T11:00:00+08:00"
      }
    ]
  }
}
```

**字段说明**:
- `type`: 记录类型 (CNAME | A | AAAA | TXT)
- `host`: 主机记录 (@表示根域名, www表示子域名)
- `value`: 记录值 (对于CNAME记录，这里是CDN节点域名)
- `ttl`: 生存时间(秒)
- `status`: 状态
  - `active`: 正常
  - `pending`: 待生效
  - `error`: 错误

**功能说明**:
- 这些CNAME记录由系统自动管理，用于CDN加速服务
- 当添加新网站时，系统会自动创建CNAME解析记录
- 记录状态“待生效”表示DNS解析正在传播中，通常需要几分钟到几小时

---

## 11. 缓存设置

### 11.1 获取缓存设置列表
**接口**: `GET /api/v1/cache-settings`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| search | string | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "静态资源缓存",
        "rules": [
          {
            "id": 1,
            "ruleType": "suffix",
            "pattern": ".jpg,.png,.css,.js",
            "ttl": 86400,
            "forceCache": false
          }
        ],
        "addedTime": "2024-01-15"
      }
    ],
    "total": 8,
    "page": 1,
    "pageSize": 15
  }
}
```

### 11.2 添加缓存设置
**接口**: `POST /api/v1/cache-settings`

**请求体**:
```json
{
  "name": "string",
  "rules": [
    {
      "ruleType": "directory | suffix | file",
      "pattern": "string",
      "ttl": 86400,
      "forceCache": false
    }
  ]
}
```

### 11.3 更新缓存设置
**接口**: `POST /api/v1/cache-settings/update`

**请求体**:
```json
{
  "id": 1,
  "name": "string",
  "rules": [
    {
      "id": 1,
      "ruleType": "directory | suffix | file",
      "pattern": "string",
      "ttl": 86400,
      "forceCache": false
    }
  ]
}
```

### 11.4 删除缓存设置
**接口**: `POST /api/v1/cache-settings/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 附录

### HTTP状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 通用查询参数说明
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 15 | 每页数量 |
| search | string | 否 | "" | 搜索关键词 |

### 注意事项
1. **查询操作使用GET方法**，其他操作使用POST方法
2. **所有ID字段都是int类型**
3. **时间格式规范**:
   - **日期时间**: 统一使用 **RFC3339** 格式（带时区）
     - 格式: `YYYY-MM-DDTHH:mm:ss+08:00`
     - 示例: `2024-01-15T10:30:00+08:00`
     - 适用字段: `createdAt`, `updatedAt`, `issueDate`
   - **纯日期**: 使用 `YYYY-MM-DD` 格式
     - 示例: `2024-01-15`
     - 适用字段: `createdDate`, `expiryDate`
   - **默认时区**: `Asia/Shanghai` (UTC+8)
4. 所有请求需要在Header中携带Token: `Authorization: Bearer <token>`
5. 响应数据中的code为200表示成功，其他值表示失败
6. **网站列表支持WebSocket实时更新**，详见WebSocket章节
