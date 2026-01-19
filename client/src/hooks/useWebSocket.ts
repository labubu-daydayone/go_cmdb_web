/**
 * WebSocket Hook - 统一封装的 WebSocket 连接管理
 * 使用 Socket.IO 客户端
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface WebSocketState {
  connected: boolean;
  error: Error | null;
  socket: Socket | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = window.location.origin,
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    error: null,
    socket: null,
  });

  const socketRef = useRef<Socket | null>(null);

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket:', url);

    const socket = io(url, {
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      transports: ['websocket', 'polling'],
    });

    // 连接成功
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setState({
        connected: true,
        error: null,
        socket,
      });
    });

    // 连接失败
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setState((prev) => ({
        ...prev,
        connected: false,
        error,
      }));
    });

    // 断开连接
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setState((prev) => ({
        ...prev,
        connected: false,
      }));
    });

    // 重连尝试
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
    });

    // 重连成功
    socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
    });

    // 重连失败
    socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      setState((prev) => ({
        ...prev,
        error: new Error('Reconnection failed'),
      }));
    });

    socketRef.current = socket;
  }, [url, reconnection, reconnectionAttempts, reconnectionDelay]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting WebSocket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        connected: false,
        error: null,
        socket: null,
      });
    }
  }, []);

  // 发送消息
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit: WebSocket not connected');
    }
  }, []);

  // 监听事件
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // 取消监听事件
  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // 自动连接
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}
