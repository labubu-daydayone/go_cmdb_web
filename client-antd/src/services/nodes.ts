/**
 * 节点管理 API
 * 根据 API_REFERENCE.md 文档实现
 */
import request from '@/utils/request';
import type { ApiResponse } from '@/utils/response';

/**
 * 节点信息
 */
export interface Node {
  id: number;
  name: string;
  main_ip: string;
  node_group_id?: number;
  node_group_name?: string;
  status: 'active' | 'inactive' | 'maintenance';
  sub_ips?: SubIP[];
  created_at: string;
  updated_at: string;
}

/**
 * 子IP信息
 */
export interface SubIP {
  id: number;
  node_id: number;
  ip: string;
  enabled: boolean;
  created_at: string;
}

/**
 * 节点列表响应
 */
export interface NodeListResponse {
  items: Node[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 节点列表查询参数
 */
export interface NodeListParams {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive' | 'maintenance';
}

/**
 * 创建节点参数
 */
export interface CreateNodeParams {
  name: string;
  main_ip: string;
  node_group_id?: number;
  status?: 'active' | 'inactive' | 'maintenance';
}

/**
 * 更新节点参数
 */
export interface UpdateNodeParams {
  id: number;
  name?: string;
  main_ip?: string;
  node_group_id?: number;
  status?: 'active' | 'inactive' | 'maintenance';
}

/**
 * 删除节点参数
 */
export interface DeleteNodeParams {
  ids: number[];
}

/**
 * 添加子IP参数
 */
export interface AddSubIPParams {
  node_id: number;
  ips: string[];
}

/**
 * 删除子IP参数
 */
export interface DeleteSubIPParams {
  ids: number[];
}

/**
 * 切换子IP状态参数
 */
export interface ToggleSubIPParams {
  id: number;
  enabled: boolean;
}

/**
 * 节点 API
 */
export const nodesAPI = {
  /**
   * 获取节点列表
   * GET /api/v1/nodes
   */
  list: (params?: NodeListParams): Promise<ApiResponse<NodeListResponse>> => {
    return request.get('/api/v1/nodes', { params });
  },

  /**
   * 创建节点
   * POST /api/v1/nodes/create
   */
  create: (params: CreateNodeParams): Promise<ApiResponse<Node>> => {
    return request.post('/api/v1/nodes/create', params);
  },

  /**
   * 更新节点
   * POST /api/v1/nodes/update
   */
  update: (params: UpdateNodeParams): Promise<ApiResponse<Node>> => {
    return request.post('/api/v1/nodes/update', params);
  },

  /**
   * 删除节点（批量）
   * POST /api/v1/nodes/delete
   */
  delete: (params: DeleteNodeParams): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/nodes/delete', params);
  },

  /**
   * 添加子IP
   * POST /api/v1/nodes/sub-ips/add
   */
  addSubIPs: (params: AddSubIPParams): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/nodes/sub-ips/add', params);
  },

  /**
   * 删除子IP
   * POST /api/v1/nodes/sub-ips/delete
   */
  deleteSubIPs: (params: DeleteSubIPParams): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/nodes/sub-ips/delete', params);
  },

  /**
   * 切换子IP状态
   * POST /api/v1/nodes/sub-ips/toggle
   */
  toggleSubIP: (params: ToggleSubIPParams): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/nodes/sub-ips/toggle', params);
  },
};
