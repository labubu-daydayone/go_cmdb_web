/**
 * 网站列表实时更新 Hook
 * 封装 WebSocket 连接和网站数据更新逻辑
 */

import { useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { Website } from '@/lib/mockData';

interface WebsiteUpdate {
  type: 'add' | 'update' | 'delete';
  data: any;
}

interface UseWebsiteUpdatesOptions {
  onAdd?: (website: Website) => void;
  onUpdate?: (websiteId: string, updates: Partial<Website>) => void;
  onDelete?: (websiteId: string) => void;
  onConnected?: () => void;
  onError?: (error: Error) => void;
}

export function useWebsiteUpdates(options: UseWebsiteUpdatesOptions = {}) {
  const { onAdd, onUpdate, onDelete, onConnected, onError } = options;

  const { connected, error, emit, on, off } = useWebSocket({
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  // 处理连接成功
  useEffect(() => {
    if (connected) {
      console.log('Website updates WebSocket connected');
      
      // 请求初始数据
      emit('request:websites');
      
      // 通知上层连接成功
      onConnected?.();
    }
  }, [connected, emit, onConnected]);

  // 处理错误
  useEffect(() => {
    if (error) {
      console.error('Website updates WebSocket error:', error);
      onError?.(error);
    }
  }, [error, onError]);

  // 处理网站更新消息
  const handleWebsiteUpdate = useCallback(
    (update: WebsiteUpdate) => {
      console.log('Received website update:', update);

      switch (update.type) {
        case 'add':
          if (onAdd && update.data) {
            onAdd(update.data as Website);
          }
          break;

        case 'update':
          if (onUpdate && update.data?.id) {
            const { id, ...updates } = update.data;
            onUpdate(id, updates);
          }
          break;

        case 'delete':
          if (onDelete && update.data?.id) {
            onDelete(update.data.id);
          }
          break;

        default:
          console.warn('Unknown update type:', update.type);
      }
    },
    [onAdd, onUpdate, onDelete]
  );

  // 监听网站更新事件
  useEffect(() => {
    on('websites:update', handleWebsiteUpdate);

    // 监听初始数据加载
    on('websites:initial', (data: any) => {
      console.log('Received initial websites data:', data);
    });

    // 监听连接确认
    on('connected', (data: any) => {
      console.log('WebSocket connection confirmed:', data);
    });

    return () => {
      off('websites:update', handleWebsiteUpdate);
      off('websites:initial');
      off('connected');
    };
  }, [on, off, handleWebsiteUpdate]);

  return {
    connected,
    error,
  };
}
