/**
 * 表格搜索和筛选工具函数
 * 用于处理 ProTable 的搜索、筛选和分页功能
 */

/**
 * 通用的表格数据筛选函数
 * @param data 原始数据数组
 * @param params 搜索和筛选参数
 * @param searchFields 需要搜索的字段列表
 * @returns 筛选后的数据和分页结果
 */
export function filterTableData<T extends Record<string, any>>(
  data: T[],
  params: Record<string, any>,
  searchFields?: string[],
) {
  let filteredData = [...data];

  // 遍历所有参数进行筛选
  Object.entries(params).forEach(([key, value]) => {
    // 跳过分页参数
    if (key === 'current' || key === 'pageSize') {
      return;
    }

    // 跳过空值
    if (value === undefined || value === null || value === '') {
      return;
    }

    // 如果是搜索字段，使用模糊匹配
    if (searchFields && searchFields.includes(key)) {
      filteredData = filteredData.filter((item) => {
        const fieldValue = item[key];
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(String(value).toLowerCase());
        }
        return String(fieldValue).includes(String(value));
      });
    } else {
      // 否则使用精确匹配
      filteredData = filteredData.filter((item) => item[key] === value);
    }
  });

  return filteredData;
}

/**
 * 分页数据
 * @param data 筛选后的数据
 * @param params 分页参数
 * @returns 分页后的数据
 */
export function paginateData<T>(data: T[], params: Record<string, any>) {
  const { current = 1, pageSize = 15 } = params;
  const startIndex = (current - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
}

/**
 * ProTable 的 request 函数生成器
 * @param getData 获取数据的函数
 * @param searchFields 需要模糊搜索的字段列表
 * @returns ProTable 的 request 函数
 */
export function createTableRequest<T extends Record<string, any>>(
  getData: () => T[],
  searchFields?: string[],
) {
  return async (params: any, sort: any, filter: any) => {
    const data = getData();

    // 筛选数据
    const filteredData = filterTableData(data, params, searchFields);

    // 分页数据
    const paginatedData = paginateData(filteredData, params);

    return {
      data: paginatedData,
      success: true,
      total: filteredData.length,
    };
  };
}
