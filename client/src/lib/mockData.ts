/**
 * 假数据生成工具
 * 用于 CMDB 后台系统的数据模拟
 */

export interface Domain {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'expired';
  registrar: string;
  expiryDate: string;
  createdDate: string;
  owner: string;
  ipAddress: string;
  dnsProvider: string;
  sslStatus: 'valid' | 'expired' | 'warning';
}

export interface DashboardStats {
  totalDomains: number;
  activeDomains: number;
  expiringSoon: number;
  sslWarnings: number;
  uptime: number;
  lastUpdated: string;
}

export interface DomainRecord {
  id: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  value: string;
  ttl: number;
}

export interface ServerInfo {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'maintenance';
  cpu: number;
  memory: number;
  disk: number;
  os: string;
  lastCheck: string;
}

export interface Website {
  id: string;
  domain: string;
  cname: string;
  lineGroup: string;
  https: 'enabled' | 'disabled';
  status: 'active' | 'inactive' | 'maintenance';
  createdDate: string;
}

export interface LineGroup {
  id: string;
  name: string;
  description: string;
  cname: string;
  nodeCount: number;
  createdDate: string;
}

// 生成假域名数据
export const generateMockDomains = (): Domain[] => {
  const statuses: Array<'active' | 'inactive' | 'expired'> = ['active', 'active', 'active', 'inactive', 'expired'];
  const registrars = ['GoDaddy', 'Namecheap', 'Domain.com', 'Alibaba Cloud', 'Tencent Cloud'];
  const dnsProviders = ['CloudFlare', 'Route 53', 'Alibaba Cloud DNS', 'Tencent Cloud DNS', 'Google DNS'];
  const sslStatuses: Array<'valid' | 'expired' | 'warning'> = ['valid', 'valid', 'valid', 'warning', 'expired'];
  
  const domains = [
    'example.com',
    'myapp.io',
    'company.cn',
    'service.net',
    'platform.org',
    'cloud.dev',
    'api.tech',
    'data.ai',
    'web.store',
    'mobile.app',
  ];

  return domains.map((domain, index) => ({
    id: `domain-${index + 1}`,
    name: domain,
    status: statuses[index % statuses.length],
    registrar: registrars[index % registrars.length],
    expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdDate: new Date(Date.now() - Math.random() * 1000 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    owner: `Owner ${index + 1}`,
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    dnsProvider: dnsProviders[index % dnsProviders.length],
    sslStatus: sslStatuses[index % sslStatuses.length],
  }));
};

// 生成仪表板统计数据
export const generateDashboardStats = (): DashboardStats => {
  const domains = generateMockDomains();
  const activeDomains = domains.filter(d => d.status === 'active').length;
  const expiringSoon = domains.filter(d => {
    const expiryDate = new Date(d.expiryDate);
    const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 30 && daysUntilExpiry > 0;
  }).length;
  const sslWarnings = domains.filter(d => d.sslStatus !== 'valid').length;

  return {
    totalDomains: domains.length,
    activeDomains,
    expiringSoon,
    sslWarnings,
    uptime: 99.98,
    lastUpdated: new Date().toISOString(),
  };
};

// 生成 DNS 记录
export const generateMockDNSRecords = (domainId: string): DomainRecord[] => {
  const recordTypes: Array<'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS'> = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'];
  
  return [
    {
      id: `${domainId}-record-1`,
      type: 'A',
      name: '@',
      value: '192.168.1.1',
      ttl: 3600,
    },
    {
      id: `${domainId}-record-2`,
      type: 'CNAME',
      name: 'www',
      value: 'example.com',
      ttl: 3600,
    },
    {
      id: `${domainId}-record-3`,
      type: 'MX',
      name: '@',
      value: 'mail.example.com',
      ttl: 3600,
    },
    {
      id: `${domainId}-record-4`,
      type: 'TXT',
      name: '@',
      value: 'v=spf1 include:_spf.google.com ~all',
      ttl: 3600,
    },
    {
      id: `${domainId}-record-5`,
      type: 'NS',
      name: '@',
      value: 'ns1.cloudflare.com',
      ttl: 172800,
    },
  ];
};

// 生成服务器信息
export const generateMockServers = (): ServerInfo[] => {
  const statuses: Array<'online' | 'offline' | 'maintenance'> = ['online', 'online', 'online', 'offline', 'maintenance'];
  const osTypes = ['Ubuntu 22.04', 'CentOS 8', 'Debian 11', 'Windows Server 2022', 'Alpine Linux'];
  
  return [
    {
      id: 'server-1',
      name: 'Web Server 1',
      ip: '192.168.1.10',
      status: 'online',
      cpu: 45,
      memory: 62,
      disk: 78,
      os: 'Ubuntu 22.04',
      lastCheck: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'server-2',
      name: 'Database Server',
      ip: '192.168.1.20',
      status: 'online',
      cpu: 72,
      memory: 85,
      disk: 92,
      os: 'CentOS 8',
      lastCheck: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'server-3',
      name: 'Cache Server',
      ip: '192.168.1.30',
      status: 'online',
      cpu: 28,
      memory: 45,
      disk: 34,
      os: 'Debian 11',
      lastCheck: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    },
    {
      id: 'server-4',
      name: 'Backup Server',
      ip: '192.168.1.40',
      status: 'offline',
      cpu: 0,
      memory: 0,
      disk: 0,
      os: 'Ubuntu 22.04',
      lastCheck: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'server-5',
      name: 'Dev Server',
      ip: '192.168.1.50',
      status: 'maintenance',
      cpu: 15,
      memory: 32,
      disk: 45,
      os: 'Ubuntu 22.04',
      lastCheck: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];
};

// 生成网站列表
export const generateMockWebsites = (): Website[] => {
  const lineGroups = ['华东线路', '华北线路', '华南线路', '国际线路'];
  const domains = ['example.com', 'myapp.io', 'company.cn', 'service.net', 'platform.org', 'cloud.dev', 'api.tech', 'data.ai', 'web.store', 'mobile.app'];
  
  return domains.map((domain, index) => ({
    id: `website-${index + 1}`,
    domain,
    cname: `${domain.split('.')[0]}.cdn.example.com`,
    lineGroup: lineGroups[index % lineGroups.length],
    https: index % 2 === 0 ? 'enabled' : 'disabled',
    status: ['active', 'active', 'active', 'inactive', 'maintenance'][index % 5] as 'active' | 'inactive' | 'maintenance',
    createdDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));
};

// 生成线路分组
export const generateMockLineGroups = (): LineGroup[] => {
  return [
    {
      id: 'line-1',
      name: '华东线路',
      description: '覆盖上海、浙江、江苏等地区',
      cname: 'east.cdn.example.com',
      nodeCount: 12,
      createdDate: '2025-01-01',
    },
    {
      id: 'line-2',
      name: '华北线路',
      description: '覆盖北京、天津、河北等地区',
      cname: 'north.cdn.example.com',
      nodeCount: 8,
      createdDate: '2025-01-02',
    },
    {
      id: 'line-3',
      name: '华南线路',
      description: '覆盖广东、深圳、福建等地区',
      cname: 'south.cdn.example.com',
      nodeCount: 10,
      createdDate: '2025-01-03',
    },
    {
      id: 'line-4',
      name: '国际线路',
      description: '覆盖香港、新加坡、日本等地区',
      cname: 'intl.cdn.example.com',
      nodeCount: 6,
      createdDate: '2025-01-04',
    },
  ];
};

// 生成时间序列数据（用于图表）
export const generateTimeSeriesData = (days: number = 30) => {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      requests: Math.floor(Math.random() * 10000) + 5000,
      errors: Math.floor(Math.random() * 500) + 50,
      uptime: 99 + Math.random() * 1,
    });
  }
  
  return data;
};
