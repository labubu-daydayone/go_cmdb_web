/**
 * API 服务层
 * 符合 API v2.1 规范
 */

import { createResourceAPI, post, get, ApiResponse, PageResponse } from '@/utils/request';

// ==================== 认证 API ====================

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expireAt: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

export const authAPI = {
  /**
   * 用户登录
   */
  login: (params: LoginParams): Promise<ApiResponse<LoginResponse>> => {
    return post<LoginResponse>('/auth/login', params);
  },
};

// ==================== 网站管理 API ====================

export interface Website {
  id: number;
  domain: string;
  status: string;
  https: boolean;
  httpsForceRedirect: boolean;
  hsts: boolean;
  originConfig: {
    type: string;
    groupId?: number;
    url?: string;
    statusCode?: number;
    templateId?: number;
  };
  cacheRules: number[];
  lineGroup: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClearCacheParams {
  ids: number[];
  type: 'all' | 'url' | 'directory';
  url?: string;
  directory?: string;
}

const websitesResource = createResourceAPI('websites');

export const websitesAPI = {
  list: (params?: Record<string, any>) => websitesResource.list<Website>(params),
  create: (data: any) => websitesResource.create(data),
  update: (data: any) => websitesResource.update(data),
  delete: (ids: number[]) => websitesResource.delete(ids),
  clearCache: (data: ClearCacheParams) => websitesResource.action('clear-cache', data),
};

// ==================== 域名管理 API ====================

export interface Domain {
  id: number;
  domain: string;
  status: string;
  recordCount: number;
  createdAt: string;
}

const domainsResource = createResourceAPI('domains');

export const domainsAPI = {
  list: (params?: Record<string, any>) => domainsResource.list<Domain>(params),
  create: (data: any) => domainsResource.create(data),
  delete: (ids: number[]) => domainsResource.delete(ids),
};

// ==================== 节点管理 API ====================

export interface SubIP {
  id: number;
  ip: string;
  port: number;
  enabled: boolean;
}

export interface Node {
  id: number;
  name: string;
  ip: string;
  status: string;
  subIPs: SubIP[];
  createdAt: string;
}

const nodesResource = createResourceAPI('nodes');

export const nodesAPI = {
  list: (params?: Record<string, any>) => nodesResource.list<Node>(params),
  create: (data: any) => nodesResource.create(data),
  update: (data: any) => nodesResource.update(data),
  delete: (ids: number[]) => nodesResource.delete(ids),
  setStatus: (id: number, status: string) =>
    nodesResource.action('set-status', { id, status }),
};

// ==================== 节点分组 API ====================

export interface NodeGroup {
  id: number;
  name: string;
  description: string;
  subIPs: Array<{
    nodeId: number;
    nodeName: string;
    ip: string;
    port: number;
  }>;
  subIPCount: number;
  createdAt: string;
}

const nodeGroupsResource = createResourceAPI('node-groups');

export const nodeGroupsAPI = {
  list: (params?: Record<string, any>) => nodeGroupsResource.list<NodeGroup>(params),
  create: (data: any) => nodeGroupsResource.create(data),
  update: (data: any) => nodeGroupsResource.update(data),
  delete: (ids: number[]) => nodeGroupsResource.delete(ids),
};

// ==================== 回源分组 API ====================

export interface OriginGroup {
  id: number;
  name: string;
  description: string;
  addresses: Array<{
    id: number;
    type: string;
    protocol: string;
    address: string;
    weight: number;
  }>;
  createdAt: string;
}

const originGroupsResource = createResourceAPI('origin-groups');

export const originGroupsAPI = {
  list: (params?: Record<string, any>) => originGroupsResource.list<OriginGroup>(params),
  create: (data: any) => originGroupsResource.create(data),
  update: (data: any) => originGroupsResource.update(data),
  delete: (ids: number[]) => originGroupsResource.delete(ids),
};

// ==================== 线路分组 API ====================

export interface LineGroup {
  id: number;
  name: string;
  cname: string;
  nodeGroupId: number;
  nodeGroupName: string;
  createdAt: string;
}

const lineGroupsResource = createResourceAPI('line-groups');

export const lineGroupsAPI = {
  list: (params?: Record<string, any>) => lineGroupsResource.list<LineGroup>(params),
  create: (data: any) => lineGroupsResource.create(data),
  update: (data: any) => lineGroupsResource.update(data),
  delete: (ids: number[]) => lineGroupsResource.delete(ids),
};

// ==================== DNS 设置 API ====================

export interface DNSConfig {
  id: number;
  domain: string;
  recordCount: number;
  status: string;
  createdAt: string;
}

export interface DNSRecord {
  id: number;
  domainId: number;
  name: string;
  type: string;
  value: string;
  ttl: number;
  status: string;
  createdAt: string;
}

const dnsResource = createResourceAPI('dns');

export const dnsAPI = {
  list: (params?: Record<string, any>) => dnsResource.list<DNSConfig>(params),
  create: (data: any) => dnsResource.create(data),
  delete: (ids: number[]) => dnsResource.delete(ids),
  getRecords: (domainId: number, params?: Record<string, any>): Promise<ApiResponse<PageResponse<DNSRecord>>> => {
    return get<PageResponse<DNSRecord>>(`/dns/${domainId}/records`, params);
  },
};

// ==================== 缓存设置 API ====================

export interface CacheRule {
  id: number;
  name: string;
  path: string;
  ttl: number;
  enabled: boolean;
  createdAt: string;
}

const cacheRulesResource = createResourceAPI('cache-rules');

export const cacheRulesAPI = {
  list: (params?: Record<string, any>) => cacheRulesResource.list<CacheRule>(params),
  create: (data: any) => cacheRulesResource.create(data),
  update: (data: any) => cacheRulesResource.update(data),
  delete: (ids: number[]) => cacheRulesResource.delete(ids),
};
