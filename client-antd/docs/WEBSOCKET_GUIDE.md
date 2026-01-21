# WebSocket 使用指南

**Socket.IO 实时通信集成**

---

## 目录

1. [概述](#1-概述)
2. [安装依赖](#2-安装依赖)
3. [基本用法](#3-基本用法)
4. [事件列表](#4-事件列表)
5. [实战示例](#5-实战示例)
6. [最佳实践](#6-最佳实践)

---

## 1. 概述

### 1.1 为什么使用 WebSocket？

- ✅ **实时更新**：数据变化立即推送到前端
- ✅ **减少轮询**：不需要定时刷新列表
- ✅ **多人协作**：多个用户同时操作，实时同步
- ✅ **降低延迟**：服务器主动推送，响应更快

### 1.2 使用场景

| 场景 | 说明 |
|------|------|
| 列表实时更新 | 其他用户创建/更新/删除数据时，当前用户的列表自动更新 |
| 状态变化通知 | 节点上线/离线、缓存清除完成等状态变化实时通知 |
| 多人协作 | 多个运维人员同时操作，避免冲突 |

---

## 2. 安装依赖

```bash
npm install socket.io-client
```

或

```bash
yarn add socket.io-client
```

---

## 3. 基本用法

### 3.1 连接 WebSocket

```typescript
import { connectWebSocket, disconnectWebSocket } from '@/utils/websocket';
import { useEffect } from 'react';

const MyComponent = () => {
  useEffect(() => {
    // 组件挂载时连接
    const socket = connectWebSocket();
    
    // 组件卸载时断开
    return () => {
      disconnectWebSocket();
    };
  }, []);
  
  return <div>...</div>;
};
```

---

### 3.2 订阅事件

```typescript
import { subscribe, unsubscribe, WebSocketEvent } from '@/utils/websocket';
import { useEffect } from 'react';

const WebsitesPage = () => {
  const actionRef = useRef<ActionType>();
  
  useEffect(() => {
    // 订阅网站创建事件
    const handleWebsiteCreated = (data: any) => {
      console.log('新网站创建:', data);
      actionRef.current?.reload(); // 刷新列表
    };
    
    subscribe(WebSocketEvent.WEBSITE_CREATED, handleWebsiteCreated);
    
    // 组件卸载时取消订阅
    return () => {
      unsubscribe(WebSocketEvent.WEBSITE_CREATED, handleWebsiteCreated);
    };
  }, []);
  
  return <ProTable actionRef={actionRef} ... />;
};
```

---

### 3.3 发送消息

```typescript
import { emit } from '@/utils/websocket';

const handleAction = () => {
  // 发送自定义消息
  emit('custom:action', { data: 'example' });
};
```

---

## 4. 事件列表

### 4.1 网站管理事件

| 事件 | 说明 | 数据格式 |
|------|------|----------|
| `website:created` | 网站创建 | `{ id, domain, ... }` |
| `website:updated` | 网站更新 | `{ id, domain, ... }` |
| `website:deleted` | 网站删除 | `{ ids: [1, 2, 3] }` |
| `website:cache_cleared` | 缓存清除完成 | `{ ids, type, ... }` |

---

### 4.2 域名管理事件

| 事件 | 说明 | 数据格式 |
|------|------|----------|
| `domain:created` | 域名创建 | `{ id, domain, ... }` |
| `domain:deleted` | 域名删除 | `{ ids: [1, 2, 3] }` |

---

### 4.3 节点管理事件

| 事件 | 说明 | 数据格式 |
|------|------|----------|
| `node:created` | 节点创建 | `{ id, name, ip, ... }` |
| `node:updated` | 节点更新 | `{ id, name, ip, ... }` |
| `node:deleted` | 节点删除 | `{ ids: [1, 2, 3] }` |
| `node:status_changed` | 节点状态变化 | `{ id, status }` |

---

### 4.4 节点分组事件

| 事件 | 说明 | 数据格式 |
|------|------|----------|
| `node_group:created` | 节点分组创建 | `{ id, name, ... }` |
| `node_group:updated` | 节点分组更新 | `{ id, name, ... }` |
| `node_group:deleted` | 节点分组删除 | `{ ids: [1, 2, 3] }` |

---

### 4.5 回源分组事件

| 事件 | 说明 | 数据格式 |
|------|------|----------|
| `origin_group:created` | 回源分组创建 | `{ id, name, ... }` |
| `origin_group:updated` | 回源分组更新 | `{ id, name, ... }` |
| `origin_group:deleted` | 回源分组删除 | `{ ids: [1, 2, 3] }` |

---

### 4.6 线路分组事件

| 事件 | 说明 | 数据格式 |
|------|------|----------|
| `line_group:created` | 线路分组创建 | `{ id, name, ... }` |
| `line_group:updated` | 线路分组更新 | `{ id, name, ... }` |
| `line_group:deleted` | 线路分组删除 | `{ ids: [1, 2, 3] }` |

---

### 4.7 DNS 设置事件

| 事件 | 说明 | 数据格式 |
|------|------|----------|
| `dns:created` | DNS 配置创建 | `{ id, domain, ... }` |
| `dns:deleted` | DNS 配置删除 | `{ ids: [1, 2, 3] }` |
| `dns_record:created` | DNS 记录创建 | `{ id, domainId, ... }` |
| `dns_record:updated` | DNS 记录更新 | `{ id, domainId, ... }` |
| `dns_record:deleted` | DNS 记录删除 | `{ ids: [1, 2, 3] }` |

---

### 4.8 缓存设置事件

| 事件 | 说明 | 数据格式 |
|------|------|----------|
| `cache_rule:created` | 缓存规则创建 | `{ id, name, ... }` |
| `cache_rule:updated` | 缓存规则更新 | `{ id, name, ... }` |
| `cache_rule:deleted` | 缓存规则删除 | `{ ids: [1, 2, 3] }` |

---

## 5. 实战示例

### 5.1 网站列表实时更新

```typescript
import { useRef, useEffect } from 'react';
import { ProTable, ActionType } from '@ant-design/pro-components';
import { connectWebSocket, subscribe, unsubscribe, WebSocketEvent } from '@/utils/websocket';
import { websitesAPI } from '@/services/api';

const WebsitesPage = () => {
  const actionRef = useRef<ActionType>();
  
  useEffect(() => {
    // 连接 WebSocket
    connectWebSocket();
    
    // 订阅网站相关事件
    const handleWebsiteCreated = (data: any) => {
      console.log('新网站创建:', data);
      actionRef.current?.reload();
    };
    
    const handleWebsiteUpdated = (data: any) => {
      console.log('网站更新:', data);
      actionRef.current?.reload();
    };
    
    const handleWebsiteDeleted = (data: any) => {
      console.log('网站删除:', data);
      actionRef.current?.reload();
    };
    
    subscribe(WebSocketEvent.WEBSITE_CREATED, handleWebsiteCreated);
    subscribe(WebSocketEvent.WEBSITE_UPDATED, handleWebsiteUpdated);
    subscribe(WebSocketEvent.WEBSITE_DELETED, handleWebsiteDeleted);
    
    // 组件卸载时取消订阅
    return () => {
      unsubscribe(WebSocketEvent.WEBSITE_CREATED, handleWebsiteCreated);
      unsubscribe(WebSocketEvent.WEBSITE_UPDATED, handleWebsiteUpdated);
      unsubscribe(WebSocketEvent.WEBSITE_DELETED, handleWebsiteDeleted);
    };
  }, []);
  
  const request = async (params: any) => {
    const response = await websitesAPI.list(params);
    return {
      data: response.data.items,
      success: response.code === 0,
      total: response.data.total,
    };
  };
  
  return <ProTable actionRef={actionRef} request={request} ... />;
};
```

---

### 5.2 节点状态实时监控

```typescript
import { useEffect, useState } from 'react';
import { Badge } from 'antd';
import { subscribe, unsubscribe, WebSocketEvent } from '@/utils/websocket';

const NodeStatusMonitor = ({ nodeId }: { nodeId: number }) => {
  const [status, setStatus] = useState('unknown');
  
  useEffect(() => {
    const handleStatusChanged = (data: any) => {
      if (data.id === nodeId) {
        setStatus(data.status);
      }
    };
    
    subscribe(WebSocketEvent.NODE_STATUS_CHANGED, handleStatusChanged);
    
    return () => {
      unsubscribe(WebSocketEvent.NODE_STATUS_CHANGED, handleStatusChanged);
    };
  }, [nodeId]);
  
  return (
    <Badge
      status={status === 'online' ? 'success' : 'error'}
      text={status === 'online' ? '在线' : '离线'}
    />
  );
};
```

---

### 5.3 缓存清除进度通知

```typescript
import { useEffect } from 'react';
import { message } from 'antd';
import { subscribe, unsubscribe, WebSocketEvent } from '@/utils/websocket';

const CacheClearNotification = () => {
  useEffect(() => {
    const handleCacheCleared = (data: any) => {
      message.success(`已清除 ${data.ids.length} 个网站的缓存`);
    };
    
    subscribe(WebSocketEvent.WEBSITE_CACHE_CLEARED, handleCacheCleared);
    
    return () => {
      unsubscribe(WebSocketEvent.WEBSITE_CACHE_CLEARED, handleCacheCleared);
    };
  }, []);
  
  return null;
};
```

---

## 6. 最佳实践

### 6.1 在布局组件中连接

**推荐**：在全局布局组件中连接 WebSocket，避免重复连接。

```typescript
// src/layouts/BasicLayout.tsx
import { useEffect } from 'react';
import { connectWebSocket, disconnectWebSocket } from '@/utils/websocket';

const BasicLayout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, []);
  
  return <div>{children}</div>;
};
```

---

### 6.2 避免重复订阅

**问题**：组件多次渲染导致重复订阅。

**解决**：使用 `useEffect` 的依赖数组，并在清理函数中取消订阅。

```typescript
useEffect(() => {
  const handler = (data: any) => {
    // 处理事件
  };
  
  subscribe('event:name', handler);
  
  return () => {
    unsubscribe('event:name', handler);
  };
}, []); // 空依赖数组，只执行一次
```

---

### 6.3 错误处理

**问题**：WebSocket 连接失败或断开。

**解决**：`websocket.ts` 已内置自动重连机制，无需手动处理。

---

### 6.4 性能优化

**问题**：频繁刷新列表导致性能问题。

**解决**：使用防抖或节流。

```typescript
import { debounce } from 'lodash';

const handleEvent = debounce((data: any) => {
  actionRef.current?.reload();
}, 1000); // 1秒内只刷新一次
```

---

### 6.5 安全性

**问题**：WebSocket 认证。

**解决**：`websocket.ts` 已自动添加 JWT Token，无需手动处理。

---

## 7. 调试技巧

### 7.1 查看 WebSocket 连接状态

```typescript
import { getSocket } from '@/utils/websocket';

const socket = getSocket();
console.log('Connected:', socket?.connected);
console.log('Socket ID:', socket?.id);
```

---

### 7.2 监听所有事件

```typescript
const socket = getSocket();
socket?.onAny((event, ...args) => {
  console.log('WebSocket Event:', event, args);
});
```

---

### 7.3 Chrome DevTools

1. 打开 Chrome DevTools
2. 切换到 **Network** 标签
3. 筛选 **WS**（WebSocket）
4. 查看 WebSocket 连接和消息

---

**祝开发顺利！** 🎉
