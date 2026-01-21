# CMDB系统 API接口文档

## 说明
- **所有接口统一使用 POST 方法**（包括查询、创建、更新、删除操作）
- **所有ID字段类型为 int**（整数）
- 基础URL: `/api/v1`
- 认证方式: Bearer Token (在请求头中携带: `Authorization: Bearer <token>`)

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

### 2.1 获取网站列表
**接口**: `POST /websites/list`

**请求体**:
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "string",
  "status": "all | active | inactive"
}
```

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
        "cname": "example.cdn.com",
        "lineGroup": "线路1",
        "https": true,
        "status": "active",
        "createdDate": "2024-01-15"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 15
  }
}
```

### 2.2 添加网站
**接口**: `POST /websites/add`

**请求体**:
```json
{
  "domain": "string",
  "lineGroup": "string",
  "https": boolean
}
```

### 2.3 更新网站
**接口**: `POST /websites/update`

**请求体**:
```json
{
  "id": 1,
  "domain": "string",
  "lineGroup": "string",
  "https": boolean,
  "status": "active | inactive"
}
```

### 2.4 删除网站
**接口**: `POST /websites/delete`

**请求体**:
```json
{
  "id": 1
}
```

### 2.5 批量清除缓存
**接口**: `POST /websites/clear-cache`

**请求体**:
```json
{
  "ids": [1, 2, 3]
}
```

---

## 3. 域名管理

### 3.1 获取域名列表
**接口**: `POST /domains/list`

**请求体**:
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "string",
  "status": "all | active | inactive | expired"
}
```

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
**接口**: `POST /domains/add`

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
**接口**: `POST /certificates/list`

**请求体**:
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "string",
  "status": "all | valid | expiring | expired"
}
```

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
**接口**: `POST /api-keys/list`

**请求体**:
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "string"
}
```

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
**接口**: `POST /api-keys/add`

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
**接口**: `POST /nodes/list`

**请求体**:
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "string",
  "status": "all | online | offline | maintenance",
  "enabled": "all | true | false"
}
```

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
**接口**: `POST /nodes/add`

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
**接口**: `POST /line-groups/list`

**请求体**:
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "string"
}
```

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
**接口**: `POST /line-groups/add`

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
**接口**: `POST /node-groups/list`

**请求体**:
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "string"
}
```

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
**接口**: `POST /node-groups/add`

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
**接口**: `POST /origin-groups/list`

**请求体**:
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "string",
  "status": "all | active | inactive"
}
```

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
**接口**: `POST /origin-groups/add`

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
**接口**: `POST /dns-config/list`

**请求体**:
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "string",
  "status": "all | active | inactive"
}
```

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
**接口**: `POST /dns-config/add`

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
**接口**: `POST /cache-settings/list`

**请求体**:
```json
{
  "page": 1,
  "pageSize": 15,
  "search": "string"
}
```

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
**接口**: `POST /cache-settings/add`

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
1. **所有接口都使用POST方法**
2. **所有ID字段都是int类型**
3. 时间格式统一使用ISO 8601格式（YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss）
4. 所有请求需要在Header中携带Token: `Authorization: Bearer <token>`
5. 响应数据中的code为200表示成功，其他值表示失败
