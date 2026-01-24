/**
 * 节点分组管理 API
 * 根据 API_REFERENCE.md 文档实现
 */
import request from '@/utils/request';
import type { ApiResponse } from '@/utils/response';

/**
 * 节点分组信息
 */
export interface NodeGroup {
  id: number;
  name: string;
  description?: string;
  node_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 节点分组列表响应
 */
export interface NodeGroupListResponse {
  items: NodeGroup[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * 创建节点分组参数
 */
export interface CreateNodeGroupParams {
  name: string;
  description?: string;
}

/**
 * 更新节点分组参数
 */
export interface UpdateNodeGroupParams {
  id: number;
  name?: string;
  description?: string;
}

/**
 * 删除节点分组参数
 */
export interface DeleteNodeGroupParams {
  ids: number[];
}

/**
 * 节点分组 API
 */
export const nodeGroupsAPI = {
  /**
   * 获取节点分组列表
   * GET /api/v1/node-groups
   */
  list: (): Promise<ApiResponse<NodeGroupListResponse>> => {
    return request.get('/api/v1/node-groups');
  },

  /**
   * 创建节点分组
   * POST /api/v1/node-groups/create
   */
  create: (params: CreateNodeGroupParams): Promise<ApiResponse<NodeGroup>> => {
    return request.post('/api/v1/node-groups/create', params);
  },

  /**
   * 更新节点分组
   * POST /api/v1/node-groups/update
   */
  update: (params: UpdateNodeGroupParams): Promise<ApiResponse<NodeGroup>> => {
    return request.post('/api/v1/node-groups/update', params);
  },

  /**
   * 删除节点分组（批量）
   * POST /api/v1/node-groups/delete
   */
  delete: (params: DeleteNodeGroupParams): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/node-groups/delete', params);
  },
};
