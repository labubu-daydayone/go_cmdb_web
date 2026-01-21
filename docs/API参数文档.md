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

### 连接地址
```
ws://your-domain/
```

### 认证
WebSocket连接会自动使用HTTP会话进行认证，无需额外传递token。

### 网站列表实时更新

#### 连接后自动事件
- `connected`: 连接成功确认
- `websites:initial`: 初始数据加载

#### 请求初始数据
客户端发送:
```javascript
socket.emit('request:websites');
```

#### 监听更新事件
```javascript
socket.on('websites:update', (update) => {
  // update 结构:
  {
    type: 'add' | 'update' | 'delete',
    data: {
      // Website对象或更新数据
    }
  }
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
**接口**: `POST /auth/login`

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
      "role": "admin"
    }
  }
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
      "id": "origin-config-1",
      "websiteId": "website-1",
      "originIPs": [
        {
          "id": "origin-1-0",
          "ip": "192.168.1.100",
          "remark": "主源站",
          "enabled": true
        },
        {
          "id": "origin-1-1",
          "ip": "192.168.1.101",
          "remark": "备源站",
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
    "type": "origin | redirect | template",
    "originIPs": [
      {
        "ip": "string",
        "remark": "string"
      }
    ],
    "redirectUrl": "string",
    "redirectStatusCode": 301 | 302,
    "template": "string"
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

### 2.4 更新网站
**接口**: `POST /websites/update`

**请求体**:
```json
{
  "id": 1,
  "domain": "string",
  "lineGroup": "string",
  "https": boolean,
  "status": "active | inactive",
  "originConfig": {
    "type": "origin | redirect | template",
    "originIPs": [
      {
        "ip": "string",
        "remark": "string"
      }
    ],
    "redirectUrl": "string",
    "redirectStatusCode": 301 | 302,
    "template": "string"
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

### 2.5 删除网站
**接口**: `POST /websites/delete`

**请求体**:
```json
{
  "id": 1
}
```

### 2.6 清除缓存
**接口**: `POST /websites/clear-cache`

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
**接口**: `POST /websites/batch-clear-cache`

**请求体**:
```json
{
  "websiteIds": [1, 2, 3]
}
```

---

## 3. 域名管理

### 3.1 获取域名列表
**接口**: `GET /domains`

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
**接口**: `POST /domains`

**请求体**:
```json
{
  "name": "string",
  "registrar": "string",
  "expiryDate": "string"
}
```

### 3.3 更新域名
**接口**: `POST /domains/update`

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
**接口**: `POST /domains/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 4. 证书管理

### 4.1 获取证书列表
**接口**: `GET /certificates`

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
        "issueDate": "2024-01-15 10:30:00",
        "expiryDate": "2025-01-15 10:30:00",
        "updatedAt": "2024-01-20 15:20:15",
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
**接口**: `POST /certificates/update`

**请求体**:
```json
{
  "id": 1,
  "certificate": "string",
  "privateKey": "string"
}
```

### 4.3 删除证书
**接口**: `POST /certificates/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 5. API密钥管理

### 5.1 获取API密钥列表
**接口**: `GET /api-keys`

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
        "createdAt": "2024-01-15"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 15
  }
}
```

### 5.2 添加API密钥
**接口**: `POST /api-keys`

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
**接口**: `POST /api-keys/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 6. 节点管理

### 6.1 获取节点列表
**接口**: `GET /nodes`

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
**接口**: `POST /nodes`

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
**接口**: `POST /nodes/update`

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
**接口**: `POST /nodes/delete`

**请求体**:
```json
{
  "id": 1
}
```

### 6.5 添加子IP
**接口**: `POST /nodes/add-subip`

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
**接口**: `POST /nodes/delete-subip`

**请求体**:
```json
{
  "nodeId": 1,
  "subIPId": 1
}
```

### 6.7 切换子IP状态
**接口**: `POST /nodes/toggle-subip`

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
**接口**: `GET /line-groups`

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
**接口**: `POST /line-groups`

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "cname": "string"
}
```

### 7.3 更新线路分组
**接口**: `POST /line-groups/update`

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
**接口**: `POST /line-groups/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 8. 节点分组

### 8.1 获取节点分组列表
**接口**: `GET /node-groups`

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
**接口**: `POST /node-groups`

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
**接口**: `POST /node-groups/update`

**请求体**:
```json
{
  "id": 1,
  "name": "string",
  "description": "string"
}
```

### 8.4 删除节点分组
**接口**: `POST /node-groups/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 9. 回源分组

### 9.1 获取回源分组列表
**接口**: `GET /origin-groups`

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
**接口**: `POST /origin-groups`

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
**接口**: `POST /origin-groups/update`

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
**接口**: `POST /origin-groups/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 10. DNS配置

### 10.1 获取DNS配置列表
**接口**: `GET /dns-config`

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
**接口**: `POST /dns-config`

**请求体**:
```json
{
  "domain": "string",
  "token": "string"
}
```

### 10.3 删除DNS配置
**接口**: `POST /dns-config/delete`

**请求体**:
```json
{
  "id": 1
}
```

---

## 11. 缓存设置

### 11.1 获取缓存设置列表
**接口**: `GET /cache-settings`

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
**接口**: `POST /cache-settings`

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
**接口**: `POST /cache-settings/update`

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
**接口**: `POST /cache-settings/delete`

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
3. 时间格式统一使用ISO 8601格式（YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss）
4. 所有请求需要在Header中携带Token: `Authorization: Bearer <token>`
5. 响应数据中的code为200表示成功，其他值表示失败
6. **网站列表支持WebSocket实时更新**，详见WebSocket章节
