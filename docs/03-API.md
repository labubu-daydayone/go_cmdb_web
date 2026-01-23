# CDN控制面板 - API接口文档

## 概述

本文档详细说明CDN控制面板系统的所有API接口,包括48个RESTful API端点的请求格式、响应格式、错误处理以及使用示例。系统遵循R7规则,仅使用GET和POST两种HTTP方法。

### 基础信息

**Base URL**: `http://your-server:port/api/v1`

**认证方式**: 
- 管理端API: JWT Bearer Token
- Agent API: mTLS双向认证

**请求格式**: `application/json`

**响应格式**: `application/json`

---

## 认证接口

### 用户登录

**端点**: `POST /auth/login`

**描述**: 用户登录,获取JWT token。

**请求体**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

**错误响应**:
```json
{
  "code": 401,
  "message": "invalid username or password",
  "data": null
}
```

### 获取当前用户信息

**端点**: `GET /auth/me`

**描述**: 获取当前登录用户的信息。

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## 域名管理接口

### 创建域名Zone

**端点**: `POST /domains`

**描述**: 创建新的域名zone,关联DNS提供商。

**请求体**:
```json
{
  "name": "example.com",
  "dns_provider_id": 1,
  "description": "主域名"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "example.com",
    "dns_provider_id": 1,
    "description": "主域名",
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 查询域名列表

**端点**: `GET /domains?page=1&page_size=20`

**描述**: 分页查询域名zone列表。

**查询参数**:
- `page`: 页码,默认1
- `page_size`: 每页数量,默认20

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 10,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "name": "example.com",
        "dns_provider_id": 1,
        "description": "主域名",
        "created_at": "2024-01-23T00:00:00Z",
        "updated_at": "2024-01-23T00:00:00Z"
      }
    ]
  }
}
```

### 查询单个域名

**端点**: `GET /domains/:id`

**描述**: 查询指定ID的域名zone详情。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "example.com",
    "dns_provider_id": 1,
    "dns_provider": {
      "id": 1,
      "name": "Cloudflare",
      "type": "cloudflare"
    },
    "description": "主域名",
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 更新域名

**端点**: `POST /domains/:id/update`

**描述**: 更新域名zone信息。

**请求体**:
```json
{
  "description": "更新后的描述"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "example.com",
    "dns_provider_id": 1,
    "description": "更新后的描述",
    "updated_at": "2024-01-23T01:00:00Z"
  }
}
```

### 删除域名

**端点**: `POST /domains/:id/delete`

**描述**: 删除域名zone(软删除)。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## DNS记录管理接口

### 创建DNS记录

**端点**: `POST /dns-records`

**描述**: 手动创建DNS记录(通常由系统自动创建)。

**请求体**:
```json
{
  "domain_id": 1,
  "type": "A",
  "name": "test.example.com",
  "value": "1.2.3.4",
  "ttl": 300
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "domain_id": 1,
    "type": "A",
    "name": "test.example.com",
    "value": "1.2.3.4",
    "ttl": 300,
    "status": "pending",
    "created_at": "2024-01-23T00:00:00Z"
  }
}
```

### 查询DNS记录列表

**端点**: `GET /dns-records?domain_id=1&status=pending&page=1&page_size=20`

**描述**: 分页查询DNS记录列表,支持按域名和状态过滤。

**查询参数**:
- `domain_id`: 域名ID(可选)
- `status`: 状态过滤(pending/synced/error,可选)
- `page`: 页码,默认1
- `page_size`: 每页数量,默认20

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 50,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "domain_id": 1,
        "type": "A",
        "name": "test.example.com",
        "value": "1.2.3.4",
        "ttl": 300,
        "status": "synced",
        "cloudflare_record_id": "abc123",
        "created_at": "2024-01-23T00:00:00Z",
        "updated_at": "2024-01-23T00:01:00Z"
      }
    ]
  }
}
```

### 查询单个DNS记录

**端点**: `GET /dns-records/:id`

**描述**: 查询指定ID的DNS记录详情。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "domain_id": 1,
    "domain": {
      "id": 1,
      "name": "example.com"
    },
    "type": "A",
    "name": "test.example.com",
    "value": "1.2.3.4",
    "ttl": 300,
    "status": "synced",
    "cloudflare_record_id": "abc123",
    "last_error": null,
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:01:00Z"
  }
}
```

### 删除DNS记录

**端点**: `POST /dns-records/:id/delete`

**描述**: 删除DNS记录(软删除,由Worker异步删除Cloudflare记录)。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 重试DNS同步

**端点**: `POST /dns-records/:id/retry`

**描述**: 手动重试失败的DNS记录同步。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "pending",
    "updated_at": "2024-01-23T02:00:00Z"
  }
}
```

---

## 节点管理接口

### 创建节点

**端点**: `POST /nodes`

**描述**: 创建新的边缘节点。

**请求体**:
```json
{
  "hostname": "edge-node-01",
  "ip": "10.0.1.100",
  "location": "Beijing",
  "isp": "ChinaNet",
  "enabled": true,
  "description": "北京电信节点"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "hostname": "edge-node-01",
    "ip": "10.0.1.100",
    "location": "Beijing",
    "isp": "ChinaNet",
    "enabled": true,
    "description": "北京电信节点",
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 查询节点列表

**端点**: `GET /nodes?enabled=true&page=1&page_size=20`

**描述**: 分页查询节点列表,支持按启用状态过滤。

**查询参数**:
- `enabled`: 启用状态过滤(true/false,可选)
- `page`: 页码,默认1
- `page_size`: 每页数量,默认20

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 20,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "hostname": "edge-node-01",
        "ip": "10.0.1.100",
        "location": "Beijing",
        "isp": "ChinaNet",
        "enabled": true,
        "description": "北京电信节点",
        "created_at": "2024-01-23T00:00:00Z",
        "updated_at": "2024-01-23T00:00:00Z"
      }
    ]
  }
}
```

### 查询单个节点

**端点**: `GET /nodes/:id`

**描述**: 查询指定ID的节点详情。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "hostname": "edge-node-01",
    "ip": "10.0.1.100",
    "location": "Beijing",
    "isp": "ChinaNet",
    "enabled": true,
    "description": "北京电信节点",
    "sub_ips": [
      {
        "id": 1,
        "sub_ip": "10.0.1.101",
        "enabled": true
      },
      {
        "id": 2,
        "sub_ip": "10.0.1.102",
        "enabled": true
      }
    ],
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 更新节点

**端点**: `POST /nodes/:id/update`

**描述**: 更新节点信息。

**请求体**:
```json
{
  "enabled": false,
  "description": "节点维护中"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "hostname": "edge-node-01",
    "enabled": false,
    "description": "节点维护中",
    "updated_at": "2024-01-23T01:00:00Z"
  }
}
```

### 删除节点

**端点**: `POST /nodes/:id/delete`

**描述**: 删除节点(软删除)。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 节点分组接口

### 创建节点分组

**端点**: `POST /node-groups`

**描述**: 创建节点分组,自动生成CNAME并创建DNS记录(WF-01)。

**请求体**:
```json
{
  "name": "Beijing Telecom Group",
  "domain_id": 1,
  "description": "北京电信节点分组",
  "node_sub_ips": [
    {
      "node_id": 1,
      "sub_ip": "10.0.1.101",
      "enabled": true
    },
    {
      "node_id": 1,
      "sub_ip": "10.0.1.102",
      "enabled": true
    },
    {
      "node_id": 2,
      "sub_ip": "10.0.2.101",
      "enabled": false
    }
  ]
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Beijing Telecom Group",
    "cname": "ng-a1b2c3d4.example.com",
    "domain_id": 1,
    "description": "北京电信节点分组",
    "node_sub_ips": [
      {
        "id": 1,
        "node_id": 1,
        "sub_ip": "10.0.1.101",
        "enabled": true,
        "dns_record_id": 10
      },
      {
        "id": 2,
        "node_id": 1,
        "sub_ip": "10.0.1.102",
        "enabled": true,
        "dns_record_id": 11
      },
      {
        "id": 3,
        "node_id": 2,
        "sub_ip": "10.0.2.101",
        "enabled": false,
        "dns_record_id": null
      }
    ],
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 查询节点分组列表

**端点**: `GET /node-groups?page=1&page_size=20`

**描述**: 分页查询节点分组列表。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 5,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "name": "Beijing Telecom Group",
        "cname": "ng-a1b2c3d4.example.com",
        "domain_id": 1,
        "description": "北京电信节点分组",
        "sub_ip_count": 3,
        "enabled_sub_ip_count": 2,
        "created_at": "2024-01-23T00:00:00Z",
        "updated_at": "2024-01-23T00:00:00Z"
      }
    ]
  }
}
```

### 查询单个节点分组

**端点**: `GET /node-groups/:id`

**描述**: 查询指定ID的节点分组详情。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Beijing Telecom Group",
    "cname": "ng-a1b2c3d4.example.com",
    "domain_id": 1,
    "domain": {
      "id": 1,
      "name": "example.com"
    },
    "description": "北京电信节点分组",
    "node_sub_ips": [
      {
        "id": 1,
        "node_id": 1,
        "node": {
          "id": 1,
          "hostname": "edge-node-01",
          "location": "Beijing"
        },
        "sub_ip": "10.0.1.101",
        "enabled": true,
        "dns_record_id": 10,
        "dns_record": {
          "id": 10,
          "status": "synced"
        }
      }
    ],
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 更新节点分组

**端点**: `POST /node-groups/:id/update`

**描述**: 更新节点分组基本信息。

**请求体**:
```json
{
  "name": "Beijing Telecom Group Updated",
  "description": "更新后的描述"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Beijing Telecom Group Updated",
    "description": "更新后的描述",
    "updated_at": "2024-01-23T01:00:00Z"
  }
}
```

### 删除节点分组

**端点**: `POST /node-groups/:id/delete`

**描述**: 删除节点分组(软删除)。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 添加子IP到节点分组

**端点**: `POST /node-groups/:id/sub-ips`

**描述**: 向节点分组添加子IP。

**请求体**:
```json
{
  "node_id": 3,
  "sub_ip": "10.0.3.101",
  "enabled": true
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 4,
    "node_group_id": 1,
    "node_id": 3,
    "sub_ip": "10.0.3.101",
    "enabled": true,
    "dns_record_id": 12,
    "created_at": "2024-01-23T02:00:00Z"
  }
}
```

### 移除节点分组的子IP

**端点**: `POST /node-groups/:id/sub-ips/:sub_ip_id/remove`

**描述**: 从节点分组移除子IP。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 更新节点分组子IP状态

**端点**: `POST /node-groups/:id/sub-ips/:sub_ip_id/update`

**描述**: 更新节点分组中子IP的启用状态。

**请求体**:
```json
{
  "enabled": false
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "enabled": false,
    "updated_at": "2024-01-23T02:00:00Z"
  }
}
```

---

## 线路分组接口

### 创建线路分组

**端点**: `POST /line-groups`

**描述**: 创建线路分组,自动生成CNAME并创建DNS CNAME记录(WF-02)。

**请求体**:
```json
{
  "name": "Main Line Group",
  "node_group_id": 1,
  "domain_id": 1,
  "description": "主线路分组"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Main Line Group",
    "cname": "lg-x1y2z3w4.example.com",
    "node_group_id": 1,
    "domain_id": 1,
    "description": "主线路分组",
    "dns_record_id": 20,
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 查询线路分组列表

**端点**: `GET /line-groups?page=1&page_size=20`

**描述**: 分页查询线路分组列表。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 3,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "name": "Main Line Group",
        "cname": "lg-x1y2z3w4.example.com",
        "node_group_id": 1,
        "node_group": {
          "id": 1,
          "name": "Beijing Telecom Group",
          "cname": "ng-a1b2c3d4.example.com"
        },
        "domain_id": 1,
        "description": "主线路分组",
        "created_at": "2024-01-23T00:00:00Z",
        "updated_at": "2024-01-23T00:00:00Z"
      }
    ]
  }
}
```

### 查询单个线路分组

**端点**: `GET /line-groups/:id`

**描述**: 查询指定ID的线路分组详情。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Main Line Group",
    "cname": "lg-x1y2z3w4.example.com",
    "node_group_id": 1,
    "node_group": {
      "id": 1,
      "name": "Beijing Telecom Group",
      "cname": "ng-a1b2c3d4.example.com",
      "sub_ip_count": 3
    },
    "domain_id": 1,
    "domain": {
      "id": 1,
      "name": "example.com"
    },
    "description": "主线路分组",
    "dns_record": {
      "id": 20,
      "type": "CNAME",
      "name": "lg-x1y2z3w4.example.com",
      "value": "ng-a1b2c3d4.example.com",
      "status": "synced"
    },
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 更新线路分组

**端点**: `POST /line-groups/:id/update`

**描述**: 更新线路分组,支持切换关联的节点分组(WF-04)。

**请求体**:
```json
{
  "name": "Main Line Group Updated",
  "node_group_id": 2,
  "description": "切换到上海联通节点分组"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Main Line Group Updated",
    "node_group_id": 2,
    "description": "切换到上海联通节点分组",
    "updated_at": "2024-01-23T01:00:00Z"
  }
}
```

### 删除线路分组

**端点**: `POST /line-groups/:id/delete`

**描述**: 删除线路分组(软删除),如果有网站正在使用则拒绝删除。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

**错误响应**:
```json
{
  "code": 400,
  "message": "cannot delete line group: 2 websites are using it",
  "data": null
}
```

---

## 回源管理接口

### 创建回源分组

**端点**: `POST /origin-groups`

**描述**: 创建回源分组,用于管理回源地址。

**请求体**:
```json
{
  "name": "Main Origin Group",
  "description": "主回源分组",
  "origins": [
    {
      "address": "origin1.example.com",
      "port": 80,
      "weight": 100,
      "priority": 1,
      "health_check_enabled": true,
      "health_check_url": "/health"
    },
    {
      "address": "192.168.1.100",
      "port": 8080,
      "weight": 50,
      "priority": 2,
      "health_check_enabled": true,
      "health_check_url": "/health"
    }
  ]
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Main Origin Group",
    "description": "主回源分组",
    "origins": [
      {
        "id": 1,
        "address": "origin1.example.com",
        "port": 80,
        "weight": 100,
        "priority": 1,
        "health_check_enabled": true,
        "health_check_url": "/health"
      },
      {
        "id": 2,
        "address": "192.168.1.100",
        "port": 8080,
        "weight": 50,
        "priority": 2,
        "health_check_enabled": true,
        "health_check_url": "/health"
      }
    ],
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 查询回源分组列表

**端点**: `GET /origin-groups?page=1&page_size=20`

**描述**: 分页查询回源分组列表。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 5,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "name": "Main Origin Group",
        "description": "主回源分组",
        "origin_count": 2,
        "created_at": "2024-01-23T00:00:00Z",
        "updated_at": "2024-01-23T00:00:00Z"
      }
    ]
  }
}
```

### 查询单个回源分组

**端点**: `GET /origin-groups/:id`

**描述**: 查询指定ID的回源分组详情。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Main Origin Group",
    "description": "主回源分组",
    "origins": [
      {
        "id": 1,
        "address": "origin1.example.com",
        "port": 80,
        "weight": 100,
        "priority": 1,
        "health_check_enabled": true,
        "health_check_url": "/health",
        "created_at": "2024-01-23T00:00:00Z"
      }
    ],
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 更新回源分组

**端点**: `POST /origin-groups/:id/update`

**描述**: 更新回源分组信息(不包括origins,origins需单独管理)。

**请求体**:
```json
{
  "name": "Main Origin Group Updated",
  "description": "更新后的描述"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Main Origin Group Updated",
    "description": "更新后的描述",
    "updated_at": "2024-01-23T01:00:00Z"
  }
}
```

### 删除回源分组

**端点**: `POST /origin-groups/:id/delete`

**描述**: 删除回源分组(软删除)。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 缓存规则接口

### 创建缓存规则

**端点**: `POST /cache-rules`

**描述**: 创建缓存规则。

**请求体**:
```json
{
  "name": "Static Files Cache",
  "match_type": "extension",
  "match_value": "jpg,png,gif,css,js",
  "cache_ttl": 86400,
  "priority": 10,
  "description": "静态文件缓存规则"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Static Files Cache",
    "match_type": "extension",
    "match_value": "jpg,png,gif,css,js",
    "cache_ttl": 86400,
    "priority": 10,
    "description": "静态文件缓存规则",
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 查询缓存规则列表

**端点**: `GET /cache-rules?page=1&page_size=20`

**描述**: 分页查询缓存规则列表。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 10,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "name": "Static Files Cache",
        "match_type": "extension",
        "match_value": "jpg,png,gif,css,js",
        "cache_ttl": 86400,
        "priority": 10,
        "description": "静态文件缓存规则",
        "created_at": "2024-01-23T00:00:00Z",
        "updated_at": "2024-01-23T00:00:00Z"
      }
    ]
  }
}
```

### 查询单个缓存规则

**端点**: `GET /cache-rules/:id`

**描述**: 查询指定ID的缓存规则详情。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Static Files Cache",
    "match_type": "extension",
    "match_value": "jpg,png,gif,css,js",
    "cache_ttl": 86400,
    "priority": 10,
    "description": "静态文件缓存规则",
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 更新缓存规则

**端点**: `POST /cache-rules/:id/update`

**描述**: 更新缓存规则。

**请求体**:
```json
{
  "cache_ttl": 172800,
  "description": "延长缓存时间到2天"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "cache_ttl": 172800,
    "description": "延长缓存时间到2天",
    "updated_at": "2024-01-23T01:00:00Z"
  }
}
```

### 删除缓存规则

**端点**: `POST /cache-rules/:id/delete`

**描述**: 删除缓存规则(软删除)。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 网站管理接口

### 创建网站

**端点**: `POST /websites`

**描述**: 创建网站,整合回源、域名、HTTPS、缓存等配置(WF-03)。

**请求体**:
```json
{
  "name": "My Website",
  "line_group_id": 1,
  "origin_group_id": 1,
  "domains": [
    "www.example.com",
    "example.com"
  ],
  "cache_rule_ids": [1, 2],
  "https_enabled": false,
  "description": "我的网站"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "My Website",
    "line_group_id": 1,
    "origin_set_id": 10,
    "description": "我的网站",
    "domains": [
      {
        "id": 1,
        "domain": "www.example.com",
        "cname": "lg-x1y2z3w4.example.com",
        "dns_record_id": 30
      },
      {
        "id": 2,
        "domain": "example.com",
        "cname": "lg-x1y2z3w4.example.com",
        "dns_record_id": 31
      }
    ],
    "https": {
      "id": 1,
      "enabled": false,
      "force_https": false,
      "certificate_id": null
    },
    "cache_rules": [
      {
        "id": 1,
        "name": "Static Files Cache"
      },
      {
        "id": 2,
        "name": "API No Cache"
      }
    ],
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 查询网站列表

**端点**: `GET /websites?page=1&page_size=20`

**描述**: 分页查询网站列表。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 15,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "name": "My Website",
        "line_group_id": 1,
        "line_group": {
          "id": 1,
          "name": "Main Line Group",
          "cname": "lg-x1y2z3w4.example.com"
        },
        "domain_count": 2,
        "https_enabled": false,
        "description": "我的网站",
        "created_at": "2024-01-23T00:00:00Z",
        "updated_at": "2024-01-23T00:00:00Z"
      }
    ]
  }
}
```

### 查询单个网站

**端点**: `GET /websites/:id`

**描述**: 查询指定ID的网站详情。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "My Website",
    "line_group_id": 1,
    "line_group": {
      "id": 1,
      "name": "Main Line Group",
      "cname": "lg-x1y2z3w4.example.com",
      "node_group": {
        "id": 1,
        "name": "Beijing Telecom Group"
      }
    },
    "origin_set_id": 10,
    "origin_set": {
      "id": 10,
      "origins": [
        {
          "id": 100,
          "address": "origin1.example.com",
          "port": 80,
          "weight": 100,
          "priority": 1
        }
      ]
    },
    "description": "我的网站",
    "domains": [
      {
        "id": 1,
        "domain": "www.example.com",
        "cname": "lg-x1y2z3w4.example.com",
        "dns_record": {
          "id": 30,
          "status": "synced"
        }
      }
    ],
    "https": {
      "id": 1,
      "enabled": false,
      "force_https": false,
      "certificate_id": null
    },
    "cache_rules": [
      {
        "id": 1,
        "name": "Static Files Cache",
        "match_type": "extension",
        "cache_ttl": 86400
      }
    ],
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 更新网站基本信息

**端点**: `POST /websites/:id/update`

**描述**: 更新网站名称和描述。

**请求体**:
```json
{
  "name": "My Website Updated",
  "description": "更新后的网站描述"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "My Website Updated",
    "description": "更新后的网站描述",
    "updated_at": "2024-01-23T01:00:00Z"
  }
}
```

### 删除网站

**端点**: `POST /websites/:id/delete`

**描述**: 删除网站(软删除)。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 更新网站线路分组

**端点**: `POST /websites/:id/line-group`

**描述**: 切换网站关联的线路分组,自动更新所有域名的DNS记录(WF-04)。

**请求体**:
```json
{
  "line_group_id": 2
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "line_group_id": 2,
    "updated_at": "2024-01-23T02:00:00Z"
  }
}
```

### 更新网站回源配置

**端点**: `POST /websites/:id/origins`

**描述**: 更新网站回源配置,创建新的origin_set(WF-05)。

**请求体**:
```json
{
  "origins": [
    {
      "address": "new-origin1.example.com",
      "port": 80,
      "weight": 100,
      "priority": 1,
      "health_check_enabled": true,
      "health_check_url": "/health"
    },
    {
      "address": "new-origin2.example.com",
      "port": 80,
      "weight": 50,
      "priority": 2,
      "health_check_enabled": true,
      "health_check_url": "/health"
    }
  ]
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "origin_set_id": 11,
    "origin_set": {
      "id": 11,
      "origins": [
        {
          "id": 200,
          "address": "new-origin1.example.com",
          "port": 80,
          "weight": 100,
          "priority": 1
        },
        {
          "id": 201,
          "address": "new-origin2.example.com",
          "port": 80,
          "weight": 50,
          "priority": 2
        }
      ]
    },
    "updated_at": "2024-01-23T02:00:00Z"
  }
}
```

### 添加域名到网站

**端点**: `POST /websites/:id/domains`

**描述**: 向网站添加新域名,自动创建DNS CNAME记录。

**请求体**:
```json
{
  "domain": "blog.example.com"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 3,
    "website_id": 1,
    "domain": "blog.example.com",
    "cname": "lg-x1y2z3w4.example.com",
    "dns_record_id": 32,
    "created_at": "2024-01-23T02:00:00Z"
  }
}
```

### 移除网站域名

**端点**: `POST /websites/:id/domains/:domain_id/remove`

**描述**: 从网站移除域名,自动删除DNS CNAME记录。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 更新网站HTTPS配置

**端点**: `POST /websites/:id/https`

**描述**: 更新网站HTTPS配置。

**请求体**:
```json
{
  "enabled": true,
  "force_https": true
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "website_id": 1,
    "enabled": true,
    "force_https": true,
    "certificate_id": 5,
    "updated_at": "2024-01-23T02:00:00Z"
  }
}
```

### 添加缓存规则到网站

**端点**: `POST /websites/:id/cache-rules`

**描述**: 向网站添加缓存规则。

**请求体**:
```json
{
  "cache_rule_id": 3
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 10,
    "website_id": 1,
    "cache_rule_id": 3,
    "created_at": "2024-01-23T02:00:00Z"
  }
}
```

### 移除网站缓存规则

**端点**: `POST /websites/:id/cache-rules/:cache_rule_id/remove`

**描述**: 从网站移除缓存规则。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 清除网站缓存

**端点**: `POST /websites/:id/clear-cache`

**描述**: 清除网站在所有边缘节点的缓存。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_ids": [100, 101, 102, 103],
    "message": "Cache clear tasks created for 4 nodes"
  }
}
```

---

## 证书管理接口

### 上传证书

**端点**: `POST /certificates/upload`

**描述**: 手动上传证书和私钥(WF-06)。

**请求体**:
```json
{
  "name": "My Certificate",
  "cert_pem": "-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----",
  "key_pem": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----",
  "auto_renew": false
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "My Certificate",
    "fingerprint_sha256": "a1b2c3d4e5f6...",
    "issuer": "Let's Encrypt",
    "not_before": "2024-01-01T00:00:00Z",
    "not_after": "2024-04-01T00:00:00Z",
    "auto_renew": false,
    "domains": [
      {
        "id": 1,
        "domain": "example.com"
      },
      {
        "id": 2,
        "domain": "*.example.com"
      }
    ],
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 查询证书列表

**端点**: `GET /certificates?page=1&page_size=20`

**描述**: 分页查询证书列表(不含PEM)。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 8,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "name": "My Certificate",
        "fingerprint_sha256": "a1b2c3d4e5f6...",
        "issuer": "Let's Encrypt",
        "not_before": "2024-01-01T00:00:00Z",
        "not_after": "2024-04-01T00:00:00Z",
        "auto_renew": false,
        "domain_count": 2,
        "days_until_expiry": 68,
        "created_at": "2024-01-23T00:00:00Z",
        "updated_at": "2024-01-23T00:00:00Z"
      }
    ]
  }
}
```

### 查询单个证书

**端点**: `GET /certificates/:id`

**描述**: 查询指定ID的证书详情(不含私钥PEM)。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "My Certificate",
    "cert_pem": "-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----",
    "fingerprint_sha256": "a1b2c3d4e5f6...",
    "issuer": "Let's Encrypt",
    "not_before": "2024-01-01T00:00:00Z",
    "not_after": "2024-04-01T00:00:00Z",
    "auto_renew": false,
    "domains": [
      {
        "id": 1,
        "domain": "example.com"
      },
      {
        "id": 2,
        "domain": "*.example.com"
      }
    ],
    "bindings": [
      {
        "id": 1,
        "website_id": 1,
        "website": {
          "id": 1,
          "name": "My Website"
        },
        "active": true
      }
    ],
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 删除证书

**端点**: `POST /certificates/:id/delete`

**描述**: 删除证书,如果有活跃绑定则拒绝删除。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

**错误响应**:
```json
{
  "code": 400,
  "message": "cannot delete certificate: it has 1 active binding",
  "data": null
}
```

### 绑定证书到网站

**端点**: `POST /certificates/:id/bind`

**描述**: 将证书绑定到网站,验证域名覆盖(WF-08)。

**请求体**:
```json
{
  "website_id": 1
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "certificate_id": 1,
    "website_id": 1,
    "active": true,
    "created_at": "2024-01-23T02:00:00Z",
    "updated_at": "2024-01-23T02:00:00Z"
  }
}
```

**错误响应**:
```json
{
  "code": 400,
  "message": "certificate domains do not cover all website domains: blog.example.com is not covered",
  "data": null
}
```

### 解绑证书

**端点**: `POST /certificates/:id/unbind`

**描述**: 解绑证书与网站的绑定关系。

**请求体**:
```json
{
  "website_id": 1
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 创建ACME证书申请

**端点**: `POST /certificates/acme/request`

**描述**: 创建ACME证书申请请求,由Worker异步处理(WF-07)。

**请求体**:
```json
{
  "domains": [
    "example.com",
    "*.example.com"
  ]
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "domains": [
      "example.com",
      "*.example.com"
    ],
    "status": "pending",
    "certificate_id": null,
    "last_error": null,
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:00:00Z"
  }
}
```

### 查询ACME证书申请列表

**端点**: `GET /certificates/acme/requests?status=pending&page=1&page_size=20`

**描述**: 分页查询ACME证书申请列表,支持按状态过滤。

**查询参数**:
- `status`: 状态过滤(pending/processing/completed/error,可选)
- `page`: 页码,默认1
- `page_size`: 每页数量,默认20

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 5,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "domains": [
          "example.com",
          "*.example.com"
        ],
        "status": "completed",
        "certificate_id": 5,
        "certificate": {
          "id": 5,
          "name": "ACME Certificate",
          "not_after": "2024-04-23T00:00:00Z"
        },
        "last_error": null,
        "created_at": "2024-01-23T00:00:00Z",
        "updated_at": "2024-01-23T00:05:00Z"
      }
    ]
  }
}
```

### 查询单个ACME证书申请

**端点**: `GET /certificates/acme/requests/:id`

**描述**: 查询指定ID的ACME证书申请详情。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "domains": [
      "example.com",
      "*.example.com"
    ],
    "status": "completed",
    "certificate_id": 5,
    "certificate": {
      "id": 5,
      "name": "ACME Certificate",
      "fingerprint_sha256": "x1y2z3w4...",
      "not_after": "2024-04-23T00:00:00Z"
    },
    "last_error": null,
    "created_at": "2024-01-23T00:00:00Z",
    "updated_at": "2024-01-23T00:05:00Z"
  }
}
```

---

## 配置版本接口

### 获取当前配置版本

**端点**: `GET /config/version`

**描述**: 获取当前配置版本号。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "version": 42,
    "updated_at": "2024-01-23T02:00:00Z"
  }
}
```

### 查询配置版本历史

**端点**: `GET /config/versions?page=1&page_size=20`

**描述**: 分页查询配置版本历史。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 42,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 42,
        "version": 42,
        "reason": "Update website line group",
        "created_at": "2024-01-23T02:00:00Z"
      },
      {
        "id": 41,
        "version": 41,
        "reason": "Create website",
        "created_at": "2024-01-23T01:30:00Z"
      }
    ]
  }
}
```

---

## Agent API接口

以下接口使用mTLS双向认证,仅供边缘节点访问。

### 获取完整配置

**端点**: `GET /api/v1/agent/config`

**描述**: 获取完整的CDN配置,包括所有网站、节点分组、线路分组等。

**认证**: mTLS(客户端证书CN必须匹配节点hostname)

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "version": 42,
    "websites": [
      {
        "id": 1,
        "name": "My Website",
        "domains": [
          {
            "domain": "www.example.com",
            "cname": "lg-x1y2z3w4.example.com"
          }
        ],
        "line_group": {
          "id": 1,
          "cname": "lg-x1y2z3w4.example.com",
          "node_group_cname": "ng-a1b2c3d4.example.com"
        },
        "origins": [
          {
            "address": "origin1.example.com",
            "port": 80,
            "weight": 100,
            "priority": 1,
            "health_check_enabled": true,
            "health_check_url": "/health"
          }
        ],
        "https": {
          "enabled": true,
          "force_https": true,
          "certificate_id": 5
        },
        "cache_rules": [
          {
            "id": 1,
            "match_type": "extension",
            "match_value": "jpg,png,gif,css,js",
            "cache_ttl": 86400,
            "priority": 10
          }
        ]
      }
    ],
    "node_groups": [
      {
        "id": 1,
        "name": "Beijing Telecom Group",
        "cname": "ng-a1b2c3d4.example.com",
        "sub_ips": [
          "10.0.1.101",
          "10.0.1.102"
        ]
      }
    ],
    "line_groups": [
      {
        "id": 1,
        "name": "Main Line Group",
        "cname": "lg-x1y2z3w4.example.com",
        "node_group_cname": "ng-a1b2c3d4.example.com"
      }
    ],
    "updated_at": "2024-01-23T02:00:00Z"
  }
}
```

### 获取证书列表

**端点**: `GET /api/v1/agent/certificates`

**描述**: 获取所有证书列表(不含PEM)。

**认证**: mTLS

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "certificates": [
      {
        "id": 1,
        "name": "My Certificate",
        "fingerprint_sha256": "a1b2c3d4e5f6...",
        "issuer": "Let's Encrypt",
        "not_before": "2024-01-01T00:00:00Z",
        "not_after": "2024-04-01T00:00:00Z",
        "domains": [
          "example.com",
          "*.example.com"
        ]
      }
    ]
  }
}
```

### 获取单个证书详情

**端点**: `GET /api/v1/agent/certificates/:id`

**描述**: 获取单个证书详情(含PEM和私钥)。

**认证**: mTLS

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "My Certificate",
    "cert_pem": "-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----",
    "key_pem": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----",
    "fingerprint_sha256": "a1b2c3d4e5f6...",
    "issuer": "Let's Encrypt",
    "not_before": "2024-01-01T00:00:00Z",
    "not_after": "2024-04-01T00:00:00Z",
    "domains": [
      "example.com",
      "*.example.com"
    ]
  }
}
```

### 获取待处理任务

**端点**: `GET /api/v1/agent/tasks`

**描述**: 获取当前节点的待处理任务列表。

**认证**: mTLS(根据证书CN自动识别节点)

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "tasks": [
      {
        "id": 100,
        "type": "clear_cache",
        "payload": {
          "website_id": 1,
          "domains": [
            "www.example.com",
            "example.com"
          ]
        },
        "status": "pending",
        "created_at": "2024-01-23T02:00:00Z"
      }
    ]
  }
}
```

### 更新任务状态

**端点**: `POST /api/v1/agent/tasks/:id/status`

**描述**: 更新任务执行状态。

**认证**: mTLS

**请求体**:
```json
{
  "status": "success",
  "result": "Cache cleared for 2 domains"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 100,
    "status": "success",
    "result": "Cache cleared for 2 domains",
    "updated_at": "2024-01-23T02:05:00Z"
  }
}
```

---

## 错误响应格式

所有API错误响应遵循统一格式:

```json
{
  "code": 400,
  "message": "error message description",
  "data": null
}
```

### 常见错误码

| 错误码 | 说明 | 示例 |
|--------|------|------|
| 400 | 请求参数错误 | 缺少必填字段、参数格式错误 |
| 401 | 未认证 | JWT token无效或过期 |
| 403 | 无权限 | 访问被拒绝 |
| 404 | 资源不存在 | 请求的ID对应的资源不存在 |
| 409 | 资源冲突 | CNAME重复、域名已存在 |
| 500 | 服务器内部错误 | 数据库错误、外部API调用失败 |

---

## 认证示例

### JWT认证示例(管理端API)

```bash
# 1. 登录获取token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'

# 响应
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

# 2. 使用token访问API
curl -X GET http://localhost:8080/api/v1/websites \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### mTLS认证示例(Agent API)

```bash
# 使用客户端证书访问Agent API
curl -X GET https://localhost:8443/api/v1/agent/config \
  --cert /path/to/client-cert.pem \
  --key /path/to/client-key.pem \
  --cacert /path/to/ca-cert.pem
```

---

## 总结

本文档详细说明了CDN控制面板系统的48个API接口,包括完整的请求响应格式、错误处理和使用示例。系统遵循RESTful设计原则,仅使用GET和POST两种HTTP方法,所有接口返回统一的JSON格式响应。管理端API使用JWT认证,Agent API使用mTLS双向认证,确保系统的安全性。
