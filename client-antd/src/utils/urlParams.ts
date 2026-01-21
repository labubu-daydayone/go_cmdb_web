/**
 * URL 参数路由工具函数
 * 用于在 URL 中同步页面状态（分页、搜索、筛选等）
 */

import { history } from '@umijs/max';

/**
 * 从 URL 获取查询参数
 */
export function getUrlParams<T extends Record<string, any>>(): T {
  const searchParams = new URLSearchParams(window.location.search);
  const params: Record<string, any> = {};

  searchParams.forEach((value, key) => {
    // 尝试解析数字
    if (!isNaN(Number(value))) {
      params[key] = Number(value);
    } else if (value === 'true' || value === 'false') {
      // 解析布尔值
      params[key] = value === 'true';
    } else {
      params[key] = value;
    }
  });

  return params as T;
}

/**
 * 更新 URL 参数（保留其他参数）
 */
export function updateUrlParams(params: Record<string, any>, replace = false) {
  const searchParams = new URLSearchParams(window.location.search);

  // 更新参数
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      // 删除空值参数
      searchParams.delete(key);
    } else {
      searchParams.set(key, String(value));
    }
  });

  const newSearch = searchParams.toString();
  const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`;

  if (replace) {
    history.replace(newUrl);
  } else {
    history.push(newUrl);
  }
}

/**
 * 设置 URL 参数（替换所有参数）
 */
export function setUrlParams(params: Record<string, any>, replace = false) {
  const searchParams = new URLSearchParams();

  // 设置参数
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const newSearch = searchParams.toString();
  const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`;

  if (replace) {
    history.replace(newUrl);
  } else {
    history.push(newUrl);
  }
}

/**
 * 清除 URL 参数
 */
export function clearUrlParams(replace = true) {
  const newUrl = window.location.pathname;

  if (replace) {
    history.replace(newUrl);
  } else {
    history.push(newUrl);
  }
}

/**
 * 获取单个 URL 参数
 */
export function getUrlParam(key: string): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get(key);
}

/**
 * Hook: 使用 URL 参数状态
 * 类似 useState，但状态同步到 URL
 */
export function useUrlParamsState<T extends Record<string, any>>(
  defaultValues: T,
): [T, (params: Partial<T>) => void] {
  const urlParams = getUrlParams<T>();
  const currentParams = { ...defaultValues, ...urlParams };

  const setParams = (params: Partial<T>) => {
    updateUrlParams(params, true);
  };

  return [currentParams, setParams];
}
