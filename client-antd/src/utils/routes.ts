/**
 * 路由工具函数
 */

/**
 * 路由信息接口
 */
export interface RouteInfo {
  title: string;
  path: string;
  keywords: string[];
  icon?: string;
  category?: string;
}

/**
 * 所有路由信息
 */
export const allRoutes: RouteInfo[] = [
  // 欢迎页
  {
    title: '欢迎页',
    path: '/welcome',
    keywords: ['欢迎', 'welcome', '首页', 'home'],
    icon: 'smile',
    category: '首页',
  },

  // 域名管理
  {
    title: '域名列表',
    path: '/domain/list',
    keywords: ['域名', 'domain', 'list', '列表'],
    icon: 'global',
    category: '域名管理',
  },
  {
    title: '证书管理',
    path: '/domain/certificates',
    keywords: ['证书', 'certificate', 'ssl', 'https', 'tls'],
    icon: 'safety',
    category: '域名管理',
  },

  // 网站管理
  {
    title: '网站列表',
    path: '/website/list',
    keywords: ['网站', 'website', 'site', '列表'],
    icon: 'cloud',
    category: '网站管理',
  },
  {
    title: '回源分组',
    path: '/website/origin-groups',
    keywords: ['回源', 'origin', '源站', '分组', 'group'],
    icon: 'cluster',
    category: '网站管理',
  },
  {
    title: '线路分组',
    path: '/website/line-groups',
    keywords: ['线路', 'line', '分组', 'group', '路由'],
    icon: 'branches',
    category: '网站管理',
  },
  {
    title: '节点管理',
    path: '/website/nodes',
    keywords: ['节点', 'node', '服务器', 'server'],
    icon: 'hdd',
    category: '网站管理',
  },
  {
    title: '节点分组',
    path: '/website/node-groups',
    keywords: ['节点分组', 'node group', '分组'],
    icon: 'apartment',
    category: '网站管理',
  },
  {
    title: '缓存设置',
    path: '/website/cache',
    keywords: ['缓存', 'cache', '设置'],
    icon: 'database',
    category: '网站管理',
  },
  {
    title: 'DNS设置',
    path: '/website/dns',
    keywords: ['dns', '解析', 'domain name system'],
    icon: 'api',
    category: '网站管理',
  },

  // 系统设置
  {
    title: 'API密钥',
    path: '/system/api-keys',
    keywords: ['api', 'key', '密钥', 'token', '令牌'],
    icon: 'key',
    category: '系统设置',
  },
];

/**
 * 搜索路由
 * @param keyword 搜索关键词
 * @returns 匹配的路由列表
 */
export function searchRoutes(keyword: string): RouteInfo[] {
  if (!keyword) {
    return [];
  }

  const lowerKeyword = keyword.toLowerCase();
  
  return allRoutes.filter((route) => {
    return (
      route.title.toLowerCase().includes(lowerKeyword) ||
      route.path.toLowerCase().includes(lowerKeyword) ||
      route.keywords.some((k) => k.toLowerCase().includes(lowerKeyword)) ||
      (route.category && route.category.toLowerCase().includes(lowerKeyword))
    );
  });
}

/**
 * 根据路径获取路由信息
 * @param path 路由路径
 * @returns 路由信息
 */
export function getRouteByPath(path: string): RouteInfo | undefined {
  return allRoutes.find((route) => route.path === path);
}

/**
 * 获取面包屑导航
 * @param path 当前路径
 * @returns 面包屑数组
 */
export function getBreadcrumb(path: string): Array<{ title: string; path?: string }> {
  const breadcrumbs: Array<{ title: string; path?: string }> = [
    { title: '首页', path: '/welcome' },
  ];

  // 解析路径
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts.length === 0) {
    return breadcrumbs;
  }

  // 第一级路径
  const firstLevel = `/${pathParts[0]}`;
  const firstRoute = getRouteByPath(firstLevel);
  if (firstRoute) {
    breadcrumbs.push({ title: firstRoute.category || firstRoute.title });
  }

  // 当前页面
  const currentRoute = getRouteByPath(path);
  if (currentRoute && currentRoute.path !== firstLevel) {
    breadcrumbs.push({ title: currentRoute.title, path });
  }

  return breadcrumbs;
}

/**
 * 按分类分组路由
 * @returns 分组后的路由
 */
export function getRoutesByCategory(): Record<string, RouteInfo[]> {
  const grouped: Record<string, RouteInfo[]> = {};

  allRoutes.forEach((route) => {
    const category = route.category || '其他';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(route);
  });

  return grouped;
}
