/**
 * 认证相关 API
 */
import request from '@/utils/request';
import type { ApiResponse } from '@/utils/response';

/**
 * 登录参数
 */
export interface LoginParams {
  username: string;
  password: string;
}

/**
 * 登录响应数据
 */
export interface LoginData {
  token: string;
  user: {
    id: number;
    username: string;
    email?: string;
    role?: string;
  };
}

/**
 * 当前用户信息
 */
export interface CurrentUser {
  id: number;
  username: string;
  email?: string;
  role?: string;
  avatar?: string;
}

/**
 * 认证 API
 */
export const authAPI = {
  /**
   * 登录
   */
  login: (params: LoginParams): Promise<ApiResponse<LoginData>> => {
    return request.post('/api/v1/auth/login', params);
  },

  /**
   * 退出登录
   */
  logout: (): Promise<ApiResponse<null>> => {
    return request.post('/api/v1/auth/logout', {});
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: (): Promise<ApiResponse<CurrentUser>> => {
    return request.get('/api/v1/me');
  },
};
