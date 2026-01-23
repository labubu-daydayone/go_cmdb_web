# CDN Control Panel API Documentation

## 概述

本文档描述了CDN控制端后端系统的RESTful API接口。

**基础URL**: `http://localhost:8080/api/v1`

**认证方式**: JWT Bearer Token

## 通用规范

### HTTP方法约束
- **GET**: 仅用于查询操作
- **POST**: 用于所有写操作（创建、更新、删除）

### 响应格式

**成功响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**错误响应**:
```json
{
  "code": 2001,
  "message": "参数验证失败",
  "data": null
}
```

### 错误码

| 范围 | 类型 | 说明 |
|------|------|------|
| 0 | 成功 | 操作成功 |
| 1000-1099 | 认证错误 | Token无效、过期等 |
| 2000-2099 | 参数验证错误 | 参数缺失、格式错误 |
| 3000-3999 | 业务/资源错误 | 资源不存在、冲突等 |
| 5000-5999 | 系统/依赖错误 | 数据库、Redis、外部API错误 |

### 分页参数

GET请求支持以下查询参数：
- `page`: 页码，默认1
- `page_size`: 每页数量，默认20

分页响应格式：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

## 认证接口

### 用户登录

**POST** `/auth/login`

获取JWT Token用于后续API调用。

**请求体**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误码**:
- `1003`: 用户名或密码错误

## 节点分组接口

### 列出节点分组

**GET** `/node-groups`

**查询参数**:
- `page`: 页码
- `page_size`: 每页数量

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "华北节点组",
        "description": "北京、天津节点",
        "domain_id": 1,
        "cname_prefix": "abc123de",
        "cname": "abc123de.example.com",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 20
  }
}
```

### 创建节点分组

**POST** `/node-groups/create`

实现WF-01工作流：
1. 生成随机CNAME前缀
2. 创建节点分组
3. 关联子IP
4. 为每个启用的子IP创建A记录（status=pending）
5. Bump配置版本

**请求体**:
```json
{
  "name": "华北节点组",
  "description": "北京、天津节点",
  "domain_id": 1,
  "sub_ip_ids": [1, 2, 3]
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "华北节点组",
    "cname": "abc123de.example.com",
    ...
  }
}
```

### 删除节点分组

**POST** `/node-groups/delete`

**请求体**:
```json
{
  "id": 1
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "Node group deleted successfully"
  }
}
```

## 线路分组接口

### 列出线路分组

**GET** `/line-groups`

**查询参数**:
- `page`: 页码
- `page_size`: 每页数量

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "电信线路",
        "domain_id": 1,
        "node_group_id": 1,
        "cname_prefix": "cdn1xyz",
        "cname": "cdn1xyz.example.com",
        "status": "active"
      }
    ],
    "total": 5,
    "page": 1,
    "page_size": 20
  }
}
```

### 创建线路分组

**POST** `/line-groups/create`

实现WF-02工作流：
1. 生成随机CNAME前缀
2. 创建线路分组
3. 创建CNAME记录指向节点分组（status=pending）
4. Bump配置版本

**请求体**:
```json
{
  "name": "电信线路",
  "domain_id": 1,
  "node_group_id": 1
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "电信线路",
    "cname": "cdn1xyz.example.com",
    ...
  }
}
```

### 删除线路分组

**POST** `/line-groups/delete`

**请求体**:
```json
{
  "id": 1
}
```

## 配置版本接口

### 获取最新配置版本

**GET** `/config/version`

返回当前最新的配置版本号。

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 10,
    "version": 10,
    "reason": "node_group:create",
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

## 认证说明

除了 `/auth/login` 接口外，所有其他接口都需要在请求头中携带JWT Token：

```
Authorization: Bearer <your-jwt-token>
```

示例：
```bash
curl -X GET http://localhost:8080/api/v1/node-groups \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Token有效期为24小时，过期后需要重新登录获取新Token。

## 待实现的API

以下API接口在需求文档中定义，但尚未实现：

- API密钥管理（api-keys）
- 域名管理（domains）
- DNS提供商配置（dns/providers）
- DNS记录管理（dns/records）
- 节点管理（nodes）
- 回源分组（origin-groups）
- 缓存规则（cache-rules）
- 证书管理（certificates）
- 网站配置（websites）
- Agent接口（agent/config, agent/certificates）

这些接口将在后续版本中实现。
