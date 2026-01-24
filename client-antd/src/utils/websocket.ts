/**
 * WebSocket 工具（Socket.IO）
 * 符合 API v2.1 规范
 */

import { io, Socket } from 'socket.io-client';
import { message } from 'antd';
import { getToken } from './request';

// WebSocket 连接实例
let socket: Socket | null = null;

// WebSocket 连接配置
const SOCKET_URL = process.env.SOCKET_URL || 'http://20.2.140.226:8080';

/**
 * 连接 WebSocket
 */
export function connectWebSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const token = getToken();
  if (!token) {
    console.warn('No token found, WebSocket connection skipped');
    throw new Error('未登录');
  }

  // 创建 Socket.IO 连接
  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // 连接成功
  socket.on('connect', () => {
    console.log('WebSocket connected:', socket?.id);
  });

  // 连接错误
  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    message.error('实时连接失败');
  });

  // 断开连接
  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // 服务器主动断开，需要重新连接
      socket?.connect();
    }
  });

  // 认证错误
  socket.on('error', (error: any) => {
    console.error('WebSocket error:', error);
    if (error.code === 1001 || error.code === 1002 || error.code === 1003) {
      message.error('认证失败，请重新登录');
      disconnectWebSocket();
    }
  });

  return socket;
}

/**
 * 断开 WebSocket
 */
export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * 获取 WebSocket 实例
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * 订阅事件
 */
export function subscribe(event: string, callback: (data: any) => void): void {
  const ws = getSocket();
  if (ws) {
    ws.on(event, callback);
  } else {
    console.warn(`Cannot subscribe to ${event}: WebSocket not connected`);
  }
}

/**
 * 取消订阅
 */
export function unsubscribe(event: string, callback?: (data: any) => void): void {
  const ws = getSocket();
  if (ws) {
    if (callback) {
      ws.off(event, callback);
    } else {
      ws.off(event);
    }
  }
}

/**
 * 发送消息
 */
export function emit(event: string, data?: any): void {
  const ws = getSocket();
  if (ws) {
    ws.emit(event, data);
  } else {
    console.warn(`Cannot emit ${event}: WebSocket not connected`);
  }
}

/**
 * WebSocket 事件类型
 */
export enum WebSocketEvent {
  // 网站管理事件
  WEBSITE_CREATED = 'website:created',
  WEBSITE_UPDATED = 'website:updated',
  WEBSITE_DELETED = 'website:deleted',
  WEBSITE_CACHE_CLEARED = 'website:cache_cleared',

  // 域名管理事件
  DOMAIN_CREATED = 'domain:created',
  DOMAIN_DELETED = 'domain:deleted',

  // 节点管理事件
  NODE_CREATED = 'node:created',
  NODE_UPDATED = 'node:updated',
  NODE_DELETED = 'node:deleted',
  NODE_STATUS_CHANGED = 'node:status_changed',

  // 节点分组事件
  NODE_GROUP_CREATED = 'node_group:created',
  NODE_GROUP_UPDATED = 'node_group:updated',
  NODE_GROUP_DELETED = 'node_group:deleted',

  // 回源分组事件
  ORIGIN_GROUP_CREATED = 'origin_group:created',
  ORIGIN_GROUP_UPDATED = 'origin_group:updated',
  ORIGIN_GROUP_DELETED = 'origin_group:deleted',

  // 线路分组事件
  LINE_GROUP_CREATED = 'line_group:created',
  LINE_GROUP_UPDATED = 'line_group:updated',
  LINE_GROUP_DELETED = 'line_group:deleted',

  // DNS 设置事件
  DNS_CREATED = 'dns:created',
  DNS_DELETED = 'dns:deleted',
  DNS_RECORD_CREATED = 'dns_record:created',
  DNS_RECORD_UPDATED = 'dns_record:updated',
  DNS_RECORD_DELETED = 'dns_record:deleted',

  // 缓存设置事件
  CACHE_RULE_CREATED = 'cache_rule:created',
  CACHE_RULE_UPDATED = 'cache_rule:updated',
  CACHE_RULE_DELETED = 'cache_rule:deleted',
}

/**
 * 使用 WebSocket 的 Hook
 */
export function useWebSocket() {
  return {
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    getSocket,
    subscribe,
    unsubscribe,
    emit,
  };
}
