# 前端 API 迁移指南

**从 Mock 数据迁移到 API v2.1 规范**

---

## 目录

1. [迁移概述](#1-迁移概述)
2. [新的 API 工具](#2-新的-api-工具)
3. [迁移步骤](#3-迁移步骤)
4. [示例对比](#4-示例对比)
5. [常见问题](#5-常见问题)

---

## 1. 环境配置

在开始迁移之前，请先配置前端连接到后端服务器。

详细配置方法请参考：[环境配置说明](./ENVIRONMENT_CONFIG.md)

### 快速配置

**1. 修改 API 代理配置**

文件：`config/proxy.ts`

```typescript
dev: {
  '/api/': {
    target: 'http://20.2.140.226:8080',  // 后端服务器地址
    changeOrigin: true,
    pathRewrite: { '^': '' },
  },
},
```

**2. 修改 WebSocket 连接地址**

文件：`src/utils/websocket.ts`

```typescript
const SOCKET_URL = process.env.SOCKET_URL || 'http://20.2.140.226:8080';
```

**3. 重启开发服务器**

```bash
npm start
```

---

## 2. 迁移概述

### 2.1 主要变化

| 项目 | 旧方式 | 新方式 |
|------|--------|--------|
| API 路径 | 自定义 | `/api/v1/{resource}/create` |
| 响应格式 | 直接返回数据 | `{ code, message, data }` |
| 错误处理 | 手动处理 | 统一错误处理 |
| 认证方式 | 无 | JWT Bearer Token |
| 数据源 | Mock 数据 | 后端 API |

### 2.2 迁移优势

- ✅ 统一的 API 调用方式
- ✅ 自动错误处理和提示
- ✅ JWT 认证自动添加
- ✅ 类型安全（TypeScript）
- ✅ 代码更简洁易维护

---

## 3. 新的 API 工具

### 3.1 核心工具

```typescript
// src/utils/request.ts
import { get, post, createResourceAPI } from '@/utils/request';
```

### 3.2 API 服务层

```typescript
// src/services/api.ts
import { websitesAPI, nodesAPI, ... } from '@/services/api';
```

---

## 4. 迁移步骤

### 步骤 1：导入新的 API 工具

**旧代码**：
```typescript
import { useState } from 'react';
```

**新代码**：
```typescript
import { useState } from 'react';
import { websitesAPI } from '@/services/api';
```

---

### 步骤 2：替换 request 函数

**旧代码**：
```typescript
const request = async (params: any, sort: any, filter: any) => {
  // 使用 Mock 数据
  let filteredData = [...mockData];
  
  // 手动搜索和筛选
  if (params.keyword) {
    filteredData = filteredData.filter(...);
  }
  
  // 手动分页
  const paginatedData = filteredData.slice(...);
  
  return {
    data: paginatedData,
    success: true,
    total: filteredData.length,
  };
};
```

**新代码**：
```typescript
const request = async (params: any, sort: any, filter: any) => {
  try {
    // 调用 API
    const response = await websitesAPI.list({
      page: params.current,
      pageSize: params.pageSize,
      domain: params.domain,
      status: params.status,
      sortBy: sort?.field,
      order: sort?.order,
    });
    
    // 返回 ProTable 需要的格式
    return {
      data: response.data.items,
      success: response.code === 0,
      total: response.data.total,
    };
  } catch (error) {
    // 错误已由 request 工具自动处理
    return {
      data: [],
      success: false,
      total: 0,
    };
  }
};
```

---

### 步骤 3：替换创建操作

**旧代码**：
```typescript
const handleAdd = async (values: any) => {
  // 手动添加到 Mock 数据
  const newItem = {
    id: Date.now(),
    ...values,
    createdAt: new Date().toISOString(),
  };
  setDataSource([...dataSource, newItem]);
  message.success('添加成功');
};
```

**新代码**：
```typescript
const handleAdd = async (values: any) => {
  try {
    await websitesAPI.create(values);
    message.success('添加成功');
    actionRef.current?.reload(); // 刷新列表
  } catch (error) {
    // 错误已由 request 工具自动处理
  }
};
```

---

### 步骤 4：替换更新操作

**旧代码**：
```typescript
const handleUpdate = async (values: any) => {
  // 手动更新 Mock 数据
  setDataSource(
    dataSource.map((item) =>
      item.id === editingId ? { ...item, ...values } : item
    )
  );
  message.success('更新成功');
};
```

**新代码**：
```typescript
const handleUpdate = async (values: any) => {
  try {
    await websitesAPI.update({
      id: editingId,
      ...values,
    });
    message.success('更新成功');
    actionRef.current?.reload(); // 刷新列表
  } catch (error) {
    // 错误已由 request 工具自动处理
  }
};
```

---

### 步骤 5：替换删除操作

**旧代码**：
```typescript
const handleDelete = async (ids: number[]) => {
  // 手动删除 Mock 数据
  setDataSource(dataSource.filter((item) => !ids.includes(item.id)));
  message.success(`已删除 ${ids.length} 条记录`);
};
```

**新代码**：
```typescript
const handleDelete = async (ids: number[]) => {
  try {
    await websitesAPI.delete(ids);
    message.success(`已删除 ${ids.length} 条记录`);
    actionRef.current?.reload(); // 刷新列表
  } catch (error) {
    // 错误已由 request 工具自动处理
  }
};
```

---

### 步骤 6：替换动作型接口

**旧代码**：
```typescript
const handleClearCache = async (params: any) => {
  // 模拟清除缓存
  console.log('Clearing cache:', params);
  message.success('缓存清除成功');
};
```

**新代码**：
```typescript
const handleClearCache = async (params: any) => {
  try {
    await websitesAPI.clearCache(params);
    message.success('缓存清除成功');
  } catch (error) {
    // 错误已由 request 工具自动处理
  }
};
```

---

## 5. 示例对比

### 5.1 完整的网站列表页面

**旧代码**（使用 Mock 数据）：

```typescript
import { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { message } from 'antd';

const WebsitesPage = () => {
  const [dataSource, setDataSource] = useState([...mockData]);
  
  const request = async (params: any) => {
    let filteredData = [...dataSource];
    
    // 手动搜索
    if (params.domain) {
      filteredData = filteredData.filter((item) =>
        item.domain.includes(params.domain)
      );
    }
    
    // 手动分页
    const { current = 1, pageSize = 15 } = params;
    const startIndex = (current - 1) * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);
    
    return {
      data: paginatedData,
      success: true,
      total: filteredData.length,
    };
  };
  
  const handleAdd = async (values: any) => {
    const newItem = { id: Date.now(), ...values };
    setDataSource([...dataSource, newItem]);
    message.success('添加成功');
  };
  
  const handleDelete = async (ids: number[]) => {
    setDataSource(dataSource.filter((item) => !ids.includes(item.id)));
    message.success('删除成功');
  };
  
  return <ProTable request={request} ... />;
};
```

**新代码**（使用 API v2.1）：

```typescript
import { useRef } from 'react';
import { ProTable, ActionType } from '@ant-design/pro-components';
import { message } from 'antd';
import { websitesAPI } from '@/services/api';

const WebsitesPage = () => {
  const actionRef = useRef<ActionType>();
  
  const request = async (params: any, sort: any) => {
    try {
      const response = await websitesAPI.list({
        page: params.current,
        pageSize: params.pageSize,
        domain: params.domain,
        status: params.status,
        sortBy: sort?.field,
        order: sort?.order,
      });
      
      return {
        data: response.data.items,
        success: response.code === 0,
        total: response.data.total,
      };
    } catch (error) {
      return { data: [], success: false, total: 0 };
    }
  };
  
  const handleAdd = async (values: any) => {
    try {
      await websitesAPI.create(values);
      message.success('添加成功');
      actionRef.current?.reload();
    } catch (error) {
      // 错误已自动处理
    }
  };
  
  const handleDelete = async (ids: number[]) => {
    try {
      await websitesAPI.delete(ids);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      // 错误已自动处理
    }
  };
  
  return <ProTable actionRef={actionRef} request={request} ... />;
};
```

---

### 5.2 代码对比总结

| 项目 | 旧代码 | 新代码 |
|------|--------|--------|
| 数据管理 | `useState` 管理 Mock 数据 | API 调用，无需本地状态 |
| 搜索筛选 | 手动实现 | 后端实现 |
| 分页 | 手动切片 | 后端实现 |
| 错误处理 | 手动 try-catch | 自动处理 |
| 刷新列表 | 手动更新状态 | `actionRef.current?.reload()` |
| 代码量 | ~100 行 | ~50 行 |

---

## 6. 常见问题

### 6.1 如何处理 API 错误？

**问题**：API 调用失败时如何处理？

**答案**：错误已由 `request` 工具自动处理，会显示错误提示。如果需要自定义处理，可以捕获异常：

```typescript
try {
  await websitesAPI.create(values);
  message.success('添加成功');
} catch (error: any) {
  // 自定义错误处理
  console.error('创建失败:', error.message);
}
```

---

### 6.2 如何添加 JWT Token？

**问题**：如何在请求中添加 JWT Token？

**答案**：`request` 工具会自动从 `localStorage` 读取 token 并添加到请求头。登录成功后调用 `setToken(token)` 即可：

```typescript
import { setToken } from '@/utils/request';

const handleLogin = async (values: any) => {
  const response = await authAPI.login(values);
  setToken(response.data.token);
  history.push('/');
};
```

---

### 6.3 如何刷新列表？

**问题**：创建、更新、删除后如何刷新列表？

**答案**：使用 `actionRef.current?.reload()`：

```typescript
const actionRef = useRef<ActionType>();

const handleAdd = async (values: any) => {
  await websitesAPI.create(values);
  actionRef.current?.reload(); // 刷新列表
};

return <ProTable actionRef={actionRef} ... />;
```

---

### 6.4 如何处理分页参数？

**问题**：ProTable 的分页参数如何传递给 API？

**答案**：ProTable 的 `params.current` 对应 API 的 `page`：

```typescript
const request = async (params: any) => {
  const response = await websitesAPI.list({
    page: params.current,      // ProTable 的 current
    pageSize: params.pageSize, // ProTable 的 pageSize
  });
  return { ... };
};
```

---

### 6.5 如何使用动作型接口？

**问题**：如何调用清除缓存、设置状态等动作型接口？

**答案**：使用 API 服务层提供的方法：

```typescript
// 清除缓存
await websitesAPI.clearCache({
  ids: [1, 2, 3],
  type: 'all',
});

// 设置节点状态
await nodesAPI.setStatus(1, 'online');
```

---

### 6.6 如何处理认证失败？

**问题**：Token 过期或无效时如何处理？

**答案**：`request` 工具会自动检测认证错误（code 1001-1004），清除 token 并跳转到登录页。

---

### 6.7 如何迁移现有页面？

**问题**：有很多页面使用 Mock 数据，如何逐步迁移？

**答案**：建议按以下顺序迁移：

1. **优先迁移**：网站管理、域名管理（核心功能）
2. **其次迁移**：节点管理、节点分组（常用功能）
3. **最后迁移**：其他页面

每个页面的迁移步骤：
1. 导入 API 服务
2. 替换 request 函数
3. 替换创建、更新、删除操作
4. 测试功能
5. 删除 Mock 数据

---

## 7. 迁移检查清单

迁移完成后，请检查以下项目：

- [ ] 所有 API 调用使用 `@/services/api` 中的方法
- [ ] 所有请求自动添加 JWT Token
- [ ] 错误处理统一且用户友好
- [ ] 列表刷新使用 `actionRef.current?.reload()`
- [ ] 删除所有 Mock 数据和手动搜索/筛选/分页代码
- [ ] 测试所有 CRUD 操作
- [ ] 测试搜索和筛选功能
- [ ] 测试分页功能
- [ ] 测试错误场景（网络错误、认证失败等）

---

## 7. 需要帮助？

如果在迁移过程中遇到问题，请参考：

1. **API 文档**：`docs/API_SPEC_v2.1.md`
2. **示例代码**：`src/pages/cmdb/websites/index.tsx`（迁移后的完整示例）
3. **工具文档**：`src/utils/request.ts` 中的注释

---

**祝迁移顺利！** 🎉
