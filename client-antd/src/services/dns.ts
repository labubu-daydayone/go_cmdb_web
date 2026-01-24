/**
 * DNS 管理 API
 * 根据 API_REFERENCE.md 文档实现
 */
import request from '@/utils/request';
import type { ApiResponse } from '@/utils/response';

/**
 * DNS 记录信息
 */
export interface DNSRecord {
  id: number;
  domain_id: number;
  domain_name?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  value: string;
  ttl: number;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
  updated_at: string;
}

/**
 * DNS 记录列表响应
 */
export interface DNSRecordListResponse {
  items: DNSRecord[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * DNS 记录列表查询参数
 */
export interface DNSRecordListParams {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'success' | 'failed';
}

/**
 * 创建 DNS 记录参数
 */
export interface CreateDNSRecordParams {
  domain_id: number;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  value: string;
  ttl?: number;
}

/**
 * 删除 DNS 记录参数
 */
export interface DeleteDNSRecordParams {
  id: number;
}

/**
 * 重试 DNS 记录参数
 */
export interface RetryDNSRecordParams {
  id: number;
}

/**
 * DNS API
 */
export const dnsAPI = {
  /**
   * 获取 DNS 记录列表
   * GET /api/v1/dns/records
   */
  listRecords: (params?: DNSRecordListParams): Promise<ApiResponse<DNSRecordListResponse>> => {
    return request.get('/api/v1/dns/records', { params });
  },

  /**
   * 获取 DNS 记录详情
   * GET /api/v1/dns/records/:id
   */
  getRecord: (id: number): Promise<ApiResponse<DNSRecord>> => {
    return request.get(`/api/v1/dns/records/${id}`);
  },

  /**
   * 创建 DNS 记录
   * POST /api/v1/dns/records/create
   */
  createRecord: (params: CreateDNSRecordParams): Promise<ApiResponse<DNSRecord>> => {
    return request.post('/api/v1/dns/records/create', params);
  },

  /**
   * 删除 DNS 记录
   * POST /api/v1/dns/records/delete
   */
  deleteRecord: (params: DeleteDNSRecordParams): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/dns/records/delete', params);
  },

  /**
   * 重试 DNS 记录
   * POST /api/v1/dns/records/retry
   */
  retryRecord: (params: RetryDNSRecordParams): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/dns/records/retry', params);
  },
};
