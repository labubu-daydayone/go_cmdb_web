/**
 * 线路分组管理 API
 * 根据 API_REFERENCE.md 文档实现
 */
import request from '@/utils/request';
import type { ApiResponse } from '@/utils/response';

/**
 * 线路分组信息
 */
export interface LineGroup {
  id: number;
  name: string;
  domain_id: number;
  domain_name?: string;
  cname: string;
  node_group_id?: number;
  node_group_name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 线路分组列表响应
 */
export interface LineGroupListResponse {
  items: LineGroup[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * 创建线路分组参数
 */
export interface CreateLineGroupParams {
  name: string;
  domain_id: number;
  cname: string;
  node_group_id?: number;
}

/**
 * 更新线路分组参数
 */
export interface UpdateLineGroupParams {
  id: number;
  name?: string;
  domain_id?: number;
  cname?: string;
  node_group_id?: number;
}

/**
 * 删除线路分组参数
 */
export interface DeleteLineGroupParams {
  ids: number[];
}

/**
 * 线路分组 API
 */
export const lineGroupsAPI = {
  /**
   * 获取线路分组列表
   * GET /api/v1/line-groups
   */
  list: (): Promise<ApiResponse<LineGroupListResponse>> => {
    return request.get('/api/v1/line-groups');
  },

  /**
   * 创建线路分组
   * POST /api/v1/line-groups/create
   */
  create: (params: CreateLineGroupParams): Promise<ApiResponse<LineGroup>> => {
    return request.post('/api/v1/line-groups/create', params);
  },

  /**
   * 更新线路分组
   * POST /api/v1/line-groups/update
   */
  update: (params: UpdateLineGroupParams): Promise<ApiResponse<LineGroup>> => {
    return request.post('/api/v1/line-groups/update', params);
  },

  /**
   * 删除线路分组（批量）
   * POST /api/v1/line-groups/delete
   */
  delete: (params: DeleteLineGroupParams): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/line-groups/delete', params);
  },
};
