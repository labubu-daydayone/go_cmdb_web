/**
 * 源站分组管理 API
 * 根据 API_REFERENCE.md 文档实现
 */
import request from '@/utils/request';
import type { ApiResponse } from '@/utils/response';

/**
 * 源站分组信息
 */
export interface OriginGroup {
  id: number;
  name: string;
  description?: string;
  origin_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 源站分组列表响应
 */
export interface OriginGroupListResponse {
  items: OriginGroup[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * 创建源站分组参数
 */
export interface CreateOriginGroupParams {
  name: string;
  description?: string;
}

/**
 * 更新源站分组参数
 */
export interface UpdateOriginGroupParams {
  id: number;
  name?: string;
  description?: string;
}

/**
 * 删除源站分组参数
 */
export interface DeleteOriginGroupParams {
  ids: number[];
}

/**
 * 源站分组 API
 */
export const originGroupsAPI = {
  /**
   * 获取源站分组列表
   * GET /api/v1/origin-groups
   */
  list: (): Promise<ApiResponse<OriginGroupListResponse>> => {
    return request.get('/api/v1/origin-groups');
  },

  /**
   * 创建源站分组
   * POST /api/v1/origin-groups/create
   */
  create: (params: CreateOriginGroupParams): Promise<ApiResponse<OriginGroup>> => {
    return request.post('/api/v1/origin-groups/create', params);
  },

  /**
   * 更新源站分组
   * POST /api/v1/origin-groups/update
   */
  update: (params: UpdateOriginGroupParams): Promise<ApiResponse<OriginGroup>> => {
    return request.post('/api/v1/origin-groups/update', params);
  },

  /**
   * 删除源站分组（批量）
   * POST /api/v1/origin-groups/delete
   */
  delete: (params: DeleteOriginGroupParams): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/origin-groups/delete', params);
  },
};
