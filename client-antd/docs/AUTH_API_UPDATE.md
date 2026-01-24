# 认证接口调整说明

**日期**: 2025-01-24  
**状态**: 已完成

---

## 调整概述

根据后端接口规范，调整前端认证相关接口路径，确保与后端 API 一致。

---

## 接口路径变更

### 1. 登录接口

**旧路径**: `/api/login/account`  
**新路径**: `/api/v1/auth/login`  
**方法**: POST

**请求参数**:
```typescript
{
  username: string;
  password: string;
}
```

**响应格式**:
```typescript
{
  code: number;        // 0 表示成功
  message: string;     // 响应消息
  data: {
    token: string;     // JWT Token
    user: {
      id: number;
      username: string;
      email?: string;
      role?: string;
    }
  }
}
```

---

### 2. 退出登录接口

**旧路径**: `/api/login/outLogin`  
**新路径**: `/api/v1/auth/logout`  
**方法**: POST

**响应格式**:
```typescript
{
  code: number;
  message: string;
  data: null;
}
```

---

### 3. 获取当前用户接口

**旧路径**: `/api/currentUser`  
**新路径**: `/api/v1/auth/current-user`  
**方法**: GET

**响应格式**:
```typescript
{
  code: number;
  message: string;
  data: {
    id: number;
    username: string;
    email?: string;
    role?: string;
    avatar?: string;
  }
}
```

---

## 已修改的文件

### 1. services/ant-design-pro/api.ts

**修改内容**:
- 登录接口路径: `/api/login/account` → `/api/v1/auth/login`
- 退出登录接口路径: `/api/login/outLogin` → `/api/v1/auth/logout`
- 获取当前用户接口路径: `/api/currentUser` → `/api/v1/auth/current-user`

**注意**: 这个文件是 Ant Design Pro 模板自带的，保留是为了兼容性。

---

### 2. services/auth.ts (新增)

**说明**: 创建了新的认证 API 服务层，使用统一的响应格式。

**导出的 API**:
```typescript
export const authAPI = {
  login: (params: LoginParams) => Promise<ApiResponse<LoginData>>;
  logout: () => Promise<ApiResponse<null>>;
  getCurrentUser: () => Promise<ApiResponse<CurrentUser>>;
};
```

**使用方法**:
```typescript
import { authAPI } from '@/services/auth';

// 登录
const response = await authAPI.login({
  username: 'admin',
  password: '123456',
});

if (response.code === 0) {
  // 登录成功
  const token = response.data.token;
  const user = response.data.user;
  
  // 存储 Token
  localStorage.setItem('token', token);
}

// 获取当前用户
const userResponse = await authAPI.getCurrentUser();
if (userResponse.code === 0) {
  const user = userResponse.data;
}

// 退出登录
await authAPI.logout();
localStorage.removeItem('token');
```

---

## 响应格式说明

### 统一响应格式

所有 API 响应都遵循统一的格式：

```typescript
interface ApiResponse<T> {
  code: number;      // 0 表示成功，非 0 表示失败
  message: string;   // 响应消息
  data: T;          // 响应数据
}
```

### 错误码定义

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或 Token 过期） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## Token 处理

### 存储 Token

登录成功后，将 Token 存储在 localStorage：

```typescript
const response = await authAPI.login({ username, password });
if (response.code === 0) {
  localStorage.setItem('token', response.data.token);
}
```

### 自动添加 Token

`request.ts` 工具会自动从 localStorage 读取 Token 并添加到请求头：

```typescript
const token = localStorage.getItem('token');
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

### Token 过期处理

当 Token 过期（返回 401），`request.ts` 会自动：
1. 清除 localStorage 中的 Token
2. 跳转到登录页面

```typescript
if (response.code === 401) {
  localStorage.removeItem('token');
  window.location.href = '/user/login';
}
```

---

## 登录流程

### 完整登录流程

```
1. 用户输入用户名和密码
   ↓
2. 调用 authAPI.login()
   ↓
3. 后端验证用户名和密码
   ↓
4. 返回 JWT Token 和用户信息
   ↓
5. 前端存储 Token 到 localStorage
   ↓
6. 调用 authAPI.getCurrentUser() 获取完整用户信息
   ↓
7. 跳转到首页或重定向页面
```

### 示例代码

```typescript
const handleLogin = async (values: { username: string; password: string }) => {
  try {
    // 1. 调用登录接口
    const response = await authAPI.login(values);
    
    if (response.code === 0) {
      // 2. 存储 Token
      localStorage.setItem('token', response.data.token);
      
      // 3. 显示成功消息
      message.success('登录成功！');
      
      // 4. 获取用户信息
      const userResponse = await authAPI.getCurrentUser();
      if (userResponse.code === 0) {
        // 5. 存储用户信息到全局状态
        setCurrentUser(userResponse.data);
      }
      
      // 6. 跳转到首页
      window.location.href = '/';
    } else {
      // 登录失败
      message.error(response.message || '登录失败');
    }
  } catch (error) {
    message.error('登录失败，请重试');
  }
};
```

---

## 退出登录流程

### 完整退出流程

```
1. 用户点击退出按钮
   ↓
2. 调用 authAPI.logout()
   ↓
3. 后端清除 Session（如果有）
   ↓
4. 前端清除 localStorage 中的 Token
   ↓
5. 跳转到登录页面
```

### 示例代码

```typescript
const handleLogout = async () => {
  try {
    // 1. 调用退出接口
    await authAPI.logout();
    
    // 2. 清除 Token
    localStorage.removeItem('token');
    
    // 3. 清除用户信息
    setCurrentUser(null);
    
    // 4. 跳转到登录页
    window.location.href = '/user/login';
  } catch (error) {
    // 即使退出接口失败，也要清除本地数据
    localStorage.removeItem('token');
    window.location.href = '/user/login';
  }
};
```

---

## 兼容性说明

### Ant Design Pro 模板

为了保持与 Ant Design Pro 模板的兼容性，保留了 `services/ant-design-pro/api.ts` 文件，但已更新接口路径。

**如果使用模板自带的登录页面**，需要注意：
1. 响应格式可能不同（模板期望 `status: 'ok'`）
2. 需要适配响应格式或修改登录页面代码

**建议**：
- 新开发的页面使用 `services/auth.ts` 中的 `authAPI`
- 使用统一的响应格式处理
- 逐步迁移旧代码

---

## 测试清单

### 登录功能测试

- [ ] 正确的用户名和密码可以登录
- [ ] 错误的用户名或密码显示错误提示
- [ ] 登录成功后 Token 存储到 localStorage
- [ ] 登录成功后跳转到首页
- [ ] 登录成功后可以获取用户信息

### Token 测试

- [ ] 请求自动添加 Authorization 头
- [ ] Token 格式为 `Bearer <token>`
- [ ] Token 过期后自动跳转登录页
- [ ] 退出登录后 Token 被清除

### 退出登录测试

- [ ] 点击退出按钮可以退出
- [ ] 退出后 Token 被清除
- [ ] 退出后跳转到登录页
- [ ] 退出后无法访问需要认证的页面

---

## 常见问题

### Q1: 登录后返回 401？

**A**: 检查以下几点：
1. 用户名和密码是否正确
2. 后端登录接口是否正常工作
3. 后端是否返回了 Token
4. Token 格式是否正确

### Q2: 登录成功但无法访问其他页面？

**A**: 
1. 检查 Token 是否存储到 localStorage
2. 检查 `request.ts` 是否正确添加 Authorization 头
3. 检查后端是否正确验证 Token

### Q3: Token 过期如何处理？

**A**: 
1. `request.ts` 会自动检测 401 响应
2. 自动清除 Token 并跳转到登录页
3. 用户重新登录即可

### Q4: 如何查看 Token？

**A**: 
1. 打开浏览器开发者工具（F12）
2. 切换到 Application 标签
3. 左侧选择 Local Storage
4. 查看 `token` 键的值

---

## 下一步

### 1. 更新登录页面

如果使用 Ant Design Pro 模板的登录页面，需要适配新的响应格式：

**文件**: `src/pages/user/login/index.tsx`

**修改**:
```typescript
// 旧代码
if (msg.status === 'ok') {
  // ...
}

// 新代码
if (msg.code === 0) {
  // 存储 Token
  localStorage.setItem('token', msg.data.token);
  // ...
}
```

### 2. 测试登录功能

```bash
cd client-antd
npm start
```

访问 `http://localhost:8000/user/login` 测试登录功能。

### 3. 验证 Token

登录成功后，打开开发者工具查看：
1. localStorage 中是否有 `token`
2. 后续请求是否携带 Authorization 头

---

## 总结

已完成认证接口的路径调整：

**调整的接口**:
- 登录: `/api/v1/auth/login`
- 退出: `/api/v1/auth/logout`
- 获取当前用户: `/api/v1/auth/current-user`

**新增文件**:
- `src/services/auth.ts`: 统一的认证 API 服务

**响应格式**:
- 使用统一的 `{ code, message, data }` 格式
- 自动处理 Token 和错误

现在可以开始测试登录功能了！
