/**
 * WebSocket 服务器 - 模拟后端实时数据推送
 * 使用 Socket.IO 实现
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface WebsiteUpdate {
  type: 'add' | 'update' | 'delete';
  data: any;
}

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 发送欢迎消息
    socket.emit('connected', {
      message: 'WebSocket connected successfully',
      clientId: socket.id,
    });

    // 监听客户端请求初始数据
    socket.on('request:websites', () => {
      console.log('Client requested websites data');
      // 这里可以发送初始数据
      socket.emit('websites:initial', {
        message: 'Initial data loaded',
        timestamp: new Date().toISOString(),
      });
    });

    // 模拟定期推送网站状态更新
    const updateInterval = setInterval(() => {
      // 随机生成更新类型
      const updateTypes: Array<'add' | 'update' | 'delete'> = ['update', 'update', 'update', 'add', 'delete'];
      const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];

      const update: WebsiteUpdate = {
        type: randomType,
        data: generateMockUpdate(randomType),
      };

      socket.emit('websites:update', update);
      console.log(`Sent ${randomType} update to client ${socket.id}`);
    }, 10000); // 每 10 秒推送一次更新

    // 断开连接时清理
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      clearInterval(updateInterval);
    });

    // 处理错误
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('WebSocket server initialized');
  return io;
}

// 生成模拟更新数据
function generateMockUpdate(type: 'add' | 'update' | 'delete') {
  const domains = [
    'example.com',
    'test.com',
    'demo.com',
    'api.example.com',
    'cdn.example.com',
    'www.test.com',
  ];

  const lineGroups = ['华东线路', '华北线路', '华南线路', '国际线路'];
  const statuses = ['active', 'inactive'];

  if (type === 'add') {
    return {
      id: `website-${Date.now()}`,
      domain: `new-${Date.now()}.com`,
      cname: `cdn-${Date.now()}.example.com`,
      lineGroup: lineGroups[Math.floor(Math.random() * lineGroups.length)],
      https: Math.random() > 0.5,
      status: 'active',
      createdDate: new Date().toLocaleDateString('zh-CN'),
    };
  }

  if (type === 'update') {
    return {
      id: `website-${Math.floor(Math.random() * 1000)}`,
      domain: domains[Math.floor(Math.random() * domains.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      https: Math.random() > 0.5,
      updatedAt: new Date().toISOString(),
    };
  }

  if (type === 'delete') {
    return {
      id: `website-${Math.floor(Math.random() * 1000)}`,
    };
  }

  return {};
}
