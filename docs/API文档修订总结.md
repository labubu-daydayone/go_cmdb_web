# API文档修订总结

## 修订日期
2024-01-21

## 修订目标
消除API文档中的歧义与冲突，统一协议规范，确保前后端实现一致、可测试、可上线。

---

## 修订内容

### 1. 路径与版本前缀规范 ✅

**问题**: 文档声明BaseURL为`/api/v1`，但接口示例未带前缀

**修订**:
- 所有HTTP接口路径统一添加 `/api/v1` 前缀
- WebSocket连接路径明确为: `ws://your-domain/ws` (独立路径，不在/api/v1下)

**示例**:
- ✅ `POST /api/v1/auth/login`
- ✅ `POST /api/v1/websites/add`
- ✅ `GET /api/v1/domains`

---

### 2. HTTP状态码与响应code一致性 ✅

**问题**: 文档未明确HTTP状态码是否与body.code同步

**修订**: HTTP状态码与body.code完全同步

| 场景 | HTTP状态码 | body.code | body.message 示例 |
|------|-----------|-----------|------------------|
| 成功 | 200 | 200 | "success" |
| 参数错误 | 400 | 400 | "参数错误" |
| 未认证 | 401 | 401 | "未认证" |
| 无权限 | 403 | 403 | "无权限" |
| 资源不存在 | 404 | 404 | "资源不存在" |
| 服务器错误 | 500 | 500 | "服务器内部错误" |

---

### 3. WebSocket协议与认证规范 ✅

**问题**: 文档认证方式矛盾（HTTP用Bearer Token，WS写"自动使用会话"）

**修订**:
- **技术栈**: Socket.IO
- **连接路径**: `ws://your-domain/ws`
- **认证方式**: Cookie Session认证
  - 登录后服务端下发HttpOnly session cookie
  - WebSocket同域自动带cookie
  - 无需在WS握手时传token

**连接示例**:
```javascript
import io from 'socket.io-client';

const socket = io('ws://your-domain/ws', {
  withCredentials: true  // 自动带cookie
});
```

---

### 4. ID字段类型统一 ✅

**问题**: 文档强调"所有ID为int"，但示例出现string id

**修订**:
- 所有持久化实体ID统一为 **int** 类型
- 移除所有string类型的ID示例

**修正示例**:
```json
// ✅ 正确
{
  "id": 1,
  "websiteId": 1,
  "originConfig": {
    "id": 1
  }
}
```

---

### 5. Website字段结构一致性 ✅

**问题**: 新增和更新接口的originIPs字段结构不一致

**修订**:
- 新增和更新接口使用相同的字段结构
- originIPs统一使用: `{type, protocol, address, weight, enabled}`

**originConfig三选一校验规则**:
- `type="origin"`: 必须有originIPs，禁止redirect/template字段
- `type="redirect"`: 必须有redirectUrl/redirectStatusCode
- `type="template"`: 必须有template

**统一后的结构**:
```json
{
  "originConfig": {
    "type": "origin",
    "originIPs": [
      {
        "type": "primary | backup",
        "protocol": "http | https",
        "address": "192.168.1.100:443",
        "weight": 10,
        "enabled": true
      }
    ]
  }
}
```

---

### 6. 登录接口与用户字段补齐 ✅

**问题**: 登录响应要求user.role，但未定义role枚举

**修订**:

**用户模型**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": "admin"  // admin | readonly
}
```

**用户角色定义**:
- `admin`: 管理员，拥有所有权限
- `readonly`: 只读用户，仅可查看数据

**JWT Claims**:
```json
{
  "uid": 1,
  "sub": "admin",
  "role": "admin",
  "exp": 1737532800,
  "iat": 1737446400
}
```

---

### 7. 时间格式规范化 ✅

**问题**: 文档写"ISO 8601"但示例混用日期和日期时间

**修订**:
- **日期时间**: 统一使用 **RFC3339** 格式（带时区）
  - 格式: `YYYY-MM-DDTHH:mm:ss+08:00`
  - 示例: `2024-01-15T10:30:00+08:00`
  - 适用字段: `createdAt`, `updatedAt`, `issueDate`
- **纯日期**: 使用 `YYYY-MM-DD` 格式
  - 示例: `2024-01-15`
  - 适用字段: `createdDate`, `expiryDate`
- **默认时区**: `Asia/Shanghai` (UTC+8)

---

### 8. WebSocket断线重连机制 ✅

**问题**: 只提供WS不提供HTTP GET，需补齐断线重连机制

**修订**:

**初始数据事件**:
```javascript
socket.on('websites:initial', (data) => {
  // data结构:
  {
    items: Website[],
    total: number,
    version: number  // ← 新增：数据版本号
  }
});
```

**增量更新事件**:
```javascript
socket.on('websites:update', (update) => {
  // update结构:
  {
    eventId: number,  // ← 新增：事件ID（递增）
    type: 'add' | 'update' | 'delete',
    data: Website | { id: number }
  }
});
```

**断线重连**:
```javascript
socket.on('reconnect', () => {
  // 重新请求全量数据
  socket.emit('request:websites');
});
```

---

## 验收标准

- ✅ 所有接口路径包含 `/api/v1` 前缀
- ✅ HTTP状态码与body.code完全一致
- ✅ WebSocket使用socket.io + cookie认证
- ✅ 所有ID字段为int类型
- ✅ Website新增/更新字段结构一致
- ✅ 用户模型包含role字段及枚举定义
- ✅ 时间格式统一为RFC3339（日期时间）或YYYY-MM-DD（纯日期）
- ✅ WebSocket包含version/eventId机制

---

## 影响范围

### 前端需要同步修改的部分

1. **API配置文件** (`client/src/config/api.ts`):
   - 已包含 `/api/v1` 前缀，无需修改

2. **WebSocket连接** (`client/src/hooks/useWebSocket.ts` 或类似文件):
   - 连接路径改为: `ws://your-domain/ws`
   - 添加 `withCredentials: true` 配置
   - 处理 `version` 和 `eventId` 字段

3. **类型定义** (TypeScript类型文件):
   - 确保所有ID字段类型为 `number`
   - 添加 `User` 类型的 `role` 字段: `"admin" | "readonly"`
   - 统一时间字段类型为 `string`（RFC3339或YYYY-MM-DD）

4. **表单验证**:
   - Website新增/更新表单使用相同的originIPs结构
   - 确保originConfig三选一校验逻辑

---

## 后续工作

1. **前端代码同步**: 根据修订后的API文档更新前端代码
2. **后端实现验证**: 确保后端实现与文档完全一致
3. **集成测试**: 编写集成测试验证所有修订点
4. **文档审查**: 团队审查修订后的文档

---

## 修订者
Manus AI Agent

## 审核状态
待审核
