/**
 * 统一的 API 请求工具
 * 符合 API v2.1 规范
 */

import { message } from 'antd';
import { history } from '@umijs/max';

// API 基础路径
export const API_BASE_URL = '/api/v1';

// 统一响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页响应
export interface PageResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 业务错误码
export enum ErrorCode {
  SUCCESS = 0,
  // 认证/权限错误 (1000-1099)
  UNAUTHORIZED = 1001,
  INVALID_TOKEN = 1002,
  TOKEN_EXPIRED = 1003,
  FORBIDDEN = 1004,
  // 参数错误 (2000-2099)
  PARAM_MISSING = 2001,
  PARAM_FORMAT_ERROR = 2002,
  PARAM_INVALID = 2003,
  // 业务错误 (3000-3999)
  RESOURCE_NOT_FOUND = 3001,
  RESOURCE_EXISTS = 3002,
  OPERATION_NOT_ALLOWED = 3003,
  // 系统错误 (5000-5999)
  INTERNAL_ERROR = 5001,
  DATABASE_ERROR = 5002,
  EXTERNAL_ERROR = 5003,
}

// 错误消息映射
const ERROR_MESSAGES: Record<number, string> = {
  [ErrorCode.UNAUTHORIZED]: '未登录或登录已过期',
  [ErrorCode.INVALID_TOKEN]: 'Token 无效',
  [ErrorCode.TOKEN_EXPIRED]: 'Token 已过期',
  [ErrorCode.FORBIDDEN]: '无权限访问',
  [ErrorCode.PARAM_MISSING]: '参数缺失',
  [ErrorCode.PARAM_FORMAT_ERROR]: '参数格式错误',
  [ErrorCode.PARAM_INVALID]: '参数值非法',
  [ErrorCode.RESOURCE_NOT_FOUND]: '资源不存在',
  [ErrorCode.RESOURCE_EXISTS]: '资源已存在',
  [ErrorCode.OPERATION_NOT_ALLOWED]: '当前状态不允许操作',
  [ErrorCode.INTERNAL_ERROR]: '系统内部错误',
  [ErrorCode.DATABASE_ERROR]: '数据库错误',
  [ErrorCode.EXTERNAL_ERROR]: '外部服务错误',
};

/**
 * 获取 JWT Token
 */
export function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * 设置 JWT Token
 */
export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

/**
 * 清除 JWT Token
 */
export function clearToken(): void {
  localStorage.removeItem('token');
}

/**
 * 统一的 HTTP 请求函数
 */
export async function request<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  // 构建完整 URL
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  // 构建请求头
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 添加 JWT Token
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // 发送请求
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // 解析响应
    const data: ApiResponse<T> = await response.json();

    // 检查业务错误码
    if (data.code !== ErrorCode.SUCCESS) {
      handleError(data.code, data.message);
      throw new Error(data.message);
    }

    return data;
  } catch (error: any) {
    // 网络错误或其他异常
    message.error(error.message || '网络请求失败');
    throw error;
  }
}

/**
 * GET 请求
 */
export async function get<T = any>(
  url: string,
  params?: Record<string, any>,
): Promise<ApiResponse<T>> {
  // 构建查询参数
  const queryString = params
    ? '?' +
      Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';

  return request<T>(url + queryString, {
    method: 'GET',
  });
}

/**
 * POST 请求
 */
export async function post<T = any>(
  url: string,
  data?: any,
): Promise<ApiResponse<T>> {
  return request<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 错误处理
 */
function handleError(code: number, message: string): void {
  // 使用预定义的错误消息或服务器返回的消息
  const errorMessage = ERROR_MESSAGES[code] || message;

  // 认证错误，跳转到登录页
  if (code >= 1001 && code <= 1004) {
    clearToken();
    history.push('/user/login');
    message.error(errorMessage);
    return;
  }

  // 其他错误，显示提示
  message.error(errorMessage);
}

/**
 * 资源 API 工具类
 */
export class ResourceAPI {
  private resource: string;

  constructor(resource: string) {
    this.resource = resource;
  }

  /**
   * 获取列表
   */
  async list<T = any>(params?: Record<string, any>): Promise<ApiResponse<PageResponse<T>>> {
    return get<PageResponse<T>>(`/${this.resource}`, params);
  }

  /**
   * 获取详情
   */
  async get<T = any>(id: number): Promise<ApiResponse<T>> {
    return get<T>(`/${this.resource}/${id}`);
  }

  /**
   * 创建
   */
  async create<T = any>(data: any): Promise<ApiResponse<T>> {
    return post<T>(`/${this.resource}/create`, data);
  }

  /**
   * 更新
   */
  async update<T = any>(data: any): Promise<ApiResponse<T>> {
    return post<T>(`/${this.resource}/update`, data);
  }

  /**
   * 删除
   */
  async delete(ids: number[]): Promise<ApiResponse<null>> {
    return post<null>(`/${this.resource}/delete`, { ids });
  }

  /**
   * 动作型接口
   */
  async action<T = any>(action: string, data?: any): Promise<ApiResponse<T>> {
    return post<T>(`/${this.resource}/${action}`, data);
  }
}

/**
 * 创建资源 API 实例
 */
export function createResourceAPI(resource: string): ResourceAPI {
  return new ResourceAPI(resource);
}
