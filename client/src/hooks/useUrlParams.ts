import { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearch } from 'wouter';

/**
 * URL 参数同步 Hook
 * 自动同步状态到 URL 参数，并从 URL 参数恢复状态
 */
export const useUrlParams = <T extends Record<string, any>>(
  defaultParams: T
): [T, (newParams: Partial<T>) => void] => {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();

  // 从 URL 解析参数
  const parseUrlParams = useCallback((): T => {
    const params = new URLSearchParams(searchString);
    const result: any = { ...defaultParams };

    Object.keys(defaultParams).forEach((key) => {
      const value = params.get(key);
      if (value !== null) {
        // 根据默认值的类型进行转换
        const defaultValue = defaultParams[key];
        if (typeof defaultValue === 'number') {
          result[key] = Number(value);
        } else if (typeof defaultValue === 'boolean') {
          result[key] = value === 'true';
        } else {
          result[key] = value;
        }
      }
    });

    return result;
  }, [searchString, defaultParams]);

  const [params, setParams] = useState<T>(parseUrlParams);

  // 当 URL 变化时更新状态
  useEffect(() => {
    setParams(parseUrlParams());
  }, [searchString, parseUrlParams]);

  // 更新参数并同步到 URL
  const updateParams = useCallback(
    (newParams: Partial<T>) => {
      const updatedParams = { ...params, ...newParams };
      setParams(updatedParams);

      // 构建新的 URL 参数
      const searchParams = new URLSearchParams();
      Object.entries(updatedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // 过滤掉默认值
          if (value !== defaultParams[key as keyof T]) {
            searchParams.set(key, String(value));
          }
        }
      });

      // 更新 URL
      const newSearch = searchParams.toString();
      const basePath = location.split('?')[0];
      setLocation(newSearch ? `${basePath}?${newSearch}` : basePath);
    },
    [params, defaultParams, location, setLocation]
  );

  return [params, updateParams];
};

/**
 * 分页参数 Hook
 * 专门用于处理分页相关的 URL 参数
 */
export const usePaginationParams = (
  defaultPage: number = 1,
  defaultPageSize: number = 15
) => {
  return useUrlParams({
    page: defaultPage,
    pageSize: defaultPageSize,
  });
};

/**
 * 搜索参数 Hook
 * 专门用于处理搜索相关的 URL 参数
 */
export const useSearchParams = (defaultSearch: string = '') => {
  return useUrlParams({
    search: defaultSearch,
  });
};

/**
 * 筛选参数 Hook
 * 专门用于处理筛选相关的 URL 参数
 */
export const useFilterParams = <T extends Record<string, any>>(
  defaultFilters: T
) => {
  return useUrlParams(defaultFilters);
};

/**
 * 组合参数 Hook
 * 同时处理分页、搜索和筛选参数
 */
export const useListParams = <T extends Record<string, any>>(config: {
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSearch?: string;
  defaultFilters?: T;
}) => {
  const {
    defaultPage = 1,
    defaultPageSize = 15,
    defaultSearch = '',
    defaultFilters = {} as T,
  } = config;

  return useUrlParams({
    page: defaultPage,
    pageSize: defaultPageSize,
    search: defaultSearch,
    ...defaultFilters,
  });
};
