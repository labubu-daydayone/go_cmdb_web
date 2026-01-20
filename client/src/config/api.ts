/**
 * API 配置文件
 * 统一管理所有接口地址和基础配置
 */

// API 基础地址
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// WebSocket 地址
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/ws';

/**
 * API 端点配置
 */
export const API_ENDPOINTS = {
  // 用户相关
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },

  // 用户管理
  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    changePassword: (id: string) => `/users/${id}/password`,
  },

  // 域名管理
  domains: {
    list: '/domains',
    detail: (id: string) => `/domains/${id}`,
    create: '/domains',
    update: (id: string) => `/domains/${id}`,
    delete: (id: string) => `/domains/${id}`,
    checkStatus: (id: string) => `/domains/${id}/status`,
  },

  // 证书管理
  certificates: {
    list: '/certificates',
    detail: (id: string) => `/certificates/${id}`,
    create: '/certificates',
    update: (id: string) => `/certificates/${id}`,
    delete: (id: string) => `/certificates/${id}`,
    renew: (id: string) => `/certificates/${id}/renew`,
  },

  // 网站管理
  websites: {
    list: '/websites',
    detail: (id: string) => `/websites/${id}`,
    create: '/websites',
    update: (id: string) => `/websites/${id}`,
    delete: (id: string) => `/websites/${id}`,
    clearCache: (id: string) => `/websites/${id}/cache`,
    deploy: (id: string) => `/websites/${id}/deploy`,
  },

  // 回源分组
  originGroups: {
    list: '/origin-groups',
    detail: (id: string) => `/origin-groups/${id}`,
    create: '/origin-groups',
    update: (id: string) => `/origin-groups/${id}`,
    delete: (id: string) => `/origin-groups/${id}`,
  },

  // 线路分组
  lineGroups: {
    list: '/line-groups',
    detail: (id: string) => `/line-groups/${id}`,
    create: '/line-groups',
    update: (id: string) => `/line-groups/${id}`,
    delete: (id: string) => `/line-groups/${id}`,
  },

  // 节点管理
  nodes: {
    list: '/nodes',
    detail: (id: string) => `/nodes/${id}`,
    create: '/nodes',
    update: (id: string) => `/nodes/${id}`,
    delete: (id: string) => `/nodes/${id}`,
    toggleStatus: (id: string) => `/nodes/${id}/status`,
    subIPs: {
      list: (nodeId: string) => `/nodes/${nodeId}/sub-ips`,
      create: (nodeId: string) => `/nodes/${nodeId}/sub-ips`,
      update: (nodeId: string, subIPId: string) => `/nodes/${nodeId}/sub-ips/${subIPId}`,
      delete: (nodeId: string, subIPId: string) => `/nodes/${nodeId}/sub-ips/${subIPId}`,
      toggleStatus: (nodeId: string, subIPId: string) => `/nodes/${nodeId}/sub-ips/${subIPId}/status`,
    },
  },

  // 节点分组
  nodeGroups: {
    list: '/node-groups',
    detail: (id: string) => `/node-groups/${id}`,
    create: '/node-groups',
    update: (id: string) => `/node-groups/${id}`,
    delete: (id: string) => `/node-groups/${id}`,
  },

  // 缓存设置
  cacheSettings: {
    list: '/cache-settings',
    detail: (id: string) => `/cache-settings/${id}`,
    create: '/cache-settings',
    update: (id: string) => `/cache-settings/${id}`,
    delete: (id: string) => `/cache-settings/${id}`,
  },

  // DNS 配置
  dnsConfig: {
    list: '/dns-config',
    detail: (id: string) => `/dns-config/${id}`,
    create: '/dns-config',
    update: (id: string) => `/dns-config/${id}`,
    delete: (id: string) => `/dns-config/${id}`,
  },

  // 密钥管理
  apiKeys: {
    list: '/api-keys',
    detail: (id: string) => `/api-keys/${id}`,
    create: '/api-keys',
    update: (id: string) => `/api-keys/${id}`,
    delete: (id: string) => `/api-keys/${id}`,
  },

  // 服务器管理
  servers: {
    list: '/servers',
    detail: (id: string) => `/servers/${id}`,
    create: '/servers',
    update: (id: string) => `/servers/${id}`,
    delete: (id: string) => `/servers/${id}`,
    stats: (id: string) => `/servers/${id}/stats`,
  },

  // 仪表板
  dashboard: {
    overview: '/dashboard/overview',
    stats: '/dashboard/stats',
    recentActivities: '/dashboard/activities',
  },
};

/**
 * 构建完整的 API URL
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, any>): string => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();
    
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
};

/**
 * HTTP 请求方法
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

/**
 * 响应状态码
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
