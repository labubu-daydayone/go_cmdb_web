/**
 * 网站管理 API
 * 根据 API_REFERENCE.md 文档实现
 */
import request from '@/utils/request';
import type { ApiResponse } from '@/utils/response';

/**
 * 网站信息
 */
export interface Website {
  id: number;
  line_group_id: number;
  line_group_name?: string;
  cache_rule_id: number;
  origin_mode: 'group' | 'manual';
  origin_group_id?: number;
  origin_group_name?: string;
  status: 'active' | 'inactive';
  domains: string[];
  primary_domain: string;
  cname: string;
  https_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 网站列表响应
 */
export interface WebsiteListResponse {
  items: Website[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 网站列表查询参数
 */
export interface WebsiteListParams {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive';
}

/**
 * 创建网站参数
 */
export interface CreateWebsiteParams {
  line_group_id: number;
  cache_rule_id?: number;
  origin_mode: 'group' | 'manual';
  origin_group_id?: number;
  domains: string[];
  https?: {
    enabled: boolean;
    force_redirect?: boolean;
    hsts?: boolean;
    cert_mode?: 'select' | 'auto';
    certificate_id?: number;
  };
}

/**
 * 更新网站参数
 */
export interface UpdateWebsiteParams {
  id: number;
  line_group_id?: number;
  cache_rule_id?: number;
  origin_mode?: 'group' | 'manual';
  origin_group_id?: number;
  domains?: string[];
  status?: 'active' | 'inactive';
  https?: {
    enabled?: boolean;
    force_redirect?: boolean;
    hsts?: boolean;
    cert_mode?: 'select' | 'auto';
    certificate_id?: number;
  };
}

/**
 * 删除网站参数
 */
export interface DeleteWebsiteParams {
  ids: number[];
}

/**
 * 网站 API
 */
export const websitesAPI = {
  /**
   * 获取网站列表
   * GET /api/v1/websites
   */
  list: (params?: WebsiteListParams): Promise<ApiResponse<WebsiteListResponse>> => {
    return request.get('/api/v1/websites', { params });
  },

  /**
   * 获取网站详情
   * GET /api/v1/websites/:id
   */
  get: (id: number): Promise<ApiResponse<Website>> => {
    return request.get(`/api/v1/websites/${id}`);
  },

  /**
   * 创建网站
   * POST /api/v1/websites/create
   */
  create: (params: CreateWebsiteParams): Promise<ApiResponse<Website>> => {
    return request.post('/api/v1/websites/create', params);
  },

  /**
   * 更新网站
   * POST /api/v1/websites/update
   */
  update: (params: UpdateWebsiteParams): Promise<ApiResponse<Website>> => {
    return request.post('/api/v1/websites/update', params);
  },

  /**
   * 删除网站（批量）
   * POST /api/v1/websites/delete
   */
  delete: (params: DeleteWebsiteParams): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/websites/delete', params);
  },
};
