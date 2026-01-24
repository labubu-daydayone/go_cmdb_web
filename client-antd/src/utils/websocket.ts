/**
 * WebSocket 工具类
 * 用于实时数据推送
 */
import { io, Socket } from 'socket.io-client';

// WebSocket 服务器地址
const SOCKET_URL = process.env.SOCKET_URL || 'http://20.2.140.226:8080';

/**
 * WebSocket 事件类型（必须在最前面导出）
 */
export type WebSocketEventType = string;

/**
 * WebSocket 事件常量
 */
export const WebSocketEvent = {
  // 网站相关事件
  WEBSITE_CREATED: 'website:created',
  WEBSITE_UPDATED: 'website:updated',
  WEBSITE_DELETED: 'website:deleted',
  WEBSITE_CACHE_CLEARED: 'website:cache_cleared',
  
  // 节点相关事件
  NODE_CREATED: 'node:created',
  NODE_UPDATED: 'node:updated',
  NODE_DELETED: 'node:deleted',
  NODE_STATUS_CHANGED: 'node:status_changed',
  
  // 节点分组相关事件
  NODE_GROUP_CREATED: 'node_group:created',
  NODE_GROUP_UPDATED: 'node_group:updated',
  NODE_GROUP_DELETED: 'node_group:deleted',
  
  // 回源分组相关事件
  ORIGIN_GROUP_CREATED: 'origin_group:created',
  ORIGIN_GROUP_UPDATED: 'origin_group:updated',
  ORIGIN_GROUP_DELETED: 'origin_group:deleted',
  
  // 线路分组相关事件
  LINE_GROUP_CREATED: 'line_group:created',
  LINE_GROUP_UPDATED: 'line_group:updated',
  LINE_GROUP_DELETED: 'line_group:deleted',
  
  // DNS 相关事件
  DNS_CREATED: 'dns:created',
  DNS_DELETED: 'dns:deleted',
  DNS_RECORD_CREATED: 'dns_record:created',
  DNS_RECORD_UPDATED: 'dns_record:updated',
  DNS_RECORD_DELETED: 'dns_record:deleted',
} as const;

/**
 * WebSocket 管理器
 */
class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  /**
   * 连接 WebSocket
   */
  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // 从 localStorage 获取 Token
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('[WebSocket] No token found, cannot connect');
      throw new Error('No authentication token');
    }

    // 创建 Socket.IO 连接，携带 Token
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    // 连接成功
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      this.reconnectAttempts = 0;
    });

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // 认证错误
    this.socket.on('error', (error) => {
      console.error('[WebSocket] Authentication error:', error);
      // Token 可能过期，清除并跳转到登录页
      if (error === 'Authentication failed' || error === 'No token') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/user/login';
      }
    });

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    return this.socket;
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[WebSocket] Disconnected manually');
    }
  }

  /**
   * 获取当前连接
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * 订阅事件
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * 取消订阅事件
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * 发送事件
   */
  emit(event: string, ...args: any[]): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, ...args);
    } else {
      console.warn('[WebSocket] Cannot emit event, socket not connected');
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}

// 导出单例
export const websocketManager = new WebSocketManager();

// 导出默认实例
export default websocketManager;

// ========== 向后兼容的导出 ==========

/**
 * 连接 WebSocket（向后兼容）
 */
export const connectWebSocket = (): Socket => {
  return websocketManager.connect();
};

/**
 * 订阅事件（向后兼容）
 */
export const subscribe = (event: WebSocketEventType, callback: (...args: any[]) => void): void => {
  websocketManager.on(event, callback);
};

/**
 * 取消订阅事件（向后兼容）
 */
export const unsubscribe = (event: WebSocketEventType, callback?: (...args: any[]) => void): void => {
  websocketManager.off(event, callback);
};
