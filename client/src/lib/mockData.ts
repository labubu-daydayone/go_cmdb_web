// 数据接口定义

export interface Domain {
  id: string;
  name: string;
  registrar: string;
  status: 'active' | 'inactive' | 'expired';
  expiryDate: string;
  sslStatus: 'valid' | 'warning' | 'expired';
  createdDate: string;
}

export interface Website {
  id: string;
  domain: string;
  cname: string;
  lineGroup: string;
  https: boolean;
  status: 'active' | 'inactive';
  createdDate: string;
}

export interface Server {
  id: string;
  name: string;
  ip: string;
  cpu: number;
  memory: number;
  disk: number;
  status: 'online' | 'offline' | 'maintenance';
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

export interface DNSConfig {
  id: string;
  domain: string;
  token: string;
  createdDate: string;
  status: 'active' | 'inactive';
}

export interface SubIP {
  id: string;
  ip: string;
  enabled: boolean;
  createdDate: string;
}

export interface Node {
  id: string;
  name: string;
  ip: string;
  managementPort: number;
  enabled: boolean;
  status: 'online' | 'offline' | 'maintenance';
  lineGroupId: string;
  createdDate: string;
  subIPs?: SubIP[];
}

export interface NodeGroup {
  id: string;
  name: string;
  description?: string;
  subIPs: SubIP[];
  createdDate: string;
}

// 生成假域名数据
export const generateMockDomains = (): Domain[] => {
  const statuses: Array<'active' | 'inactive' | 'expired'> = ['active', 'active', 'active', 'inactive', 'expired'];
  const registrars = ['GoDaddy', 'Namecheap', 'Domain.com', 'Alibaba Cloud', 'Tencent Cloud'];
  const domains = ['example.com', 'myapp.io', 'company.cn', 'service.net', 'platform.org', 'cloud.dev', 'api.tech', 'data.ai', 'web.store', 'mobile.app'];

  return domains.map((domain, index) => ({
    id: `domain-${index + 1}`,
    name: domain,
    registrar: registrars[index % registrars.length],
    status: statuses[index % statuses.length],
    expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    sslStatus: ['valid', 'valid', 'valid', 'warning', 'expired'][index % 5] as 'valid' | 'warning' | 'expired',
    createdDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));
};

// 生成假网站数据
export const generateMockWebsites = (): Website[] => {
  const domains = ['example.com', 'myapp.io', 'company.cn', 'service.net', 'platform.org', 'cloud.dev', 'api.tech', 'data.ai', 'web.store', 'mobile.app'];
  const lineGroups = ['线路1', '线路2', '线路3', '线路4'];

  return domains.map((domain, index) => ({
    id: `website-${index + 1}`,
    domain,
    cname: `cdn-${index + 1}.example.com`,
    lineGroup: lineGroups[index % lineGroups.length],
    https: index % 2 === 0,
    status: index % 3 === 0 ? 'inactive' : 'active',
    createdDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));
};

// 生成假服务器数据
export const generateMockServers = (): Server[] => {
  const servers = [];
  for (let i = 1; i <= 10; i++) {
    servers.push({
      id: `server-${i}`,
      name: `服务器 ${i}`,
      ip: `192.168.1.${i + 100}`,
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      status: ['online', 'online', 'online', 'offline', 'maintenance'][i % 5] as 'online' | 'offline' | 'maintenance',
      createdDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  }
  return servers;
};

// 生成假线路分组数据
export const generateMockLineGroups = (): LineGroup[] => {
  const groups = [
    { name: '华东线路', description: '上海、浙江、江苏等地区' },
    { name: '华北线路', description: '北京、天津、河北等地区' },
    { name: '华南线路', description: '广东、深圳、福建等地区' },
    { name: '国际线路', description: '新加坡、日本、香港等地区' },
  ];

  return groups.map((group, index) => ({
    id: `line-${index + 1}`,
    name: group.name,
    description: group.description,
    cname: `${group.name.toLowerCase()}.cdn.example.com`,
    nodeCount: Math.floor(Math.random() * 5) + 3,
    createdDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));
};

// 生成 DNS 配置
export const generateMockDNSConfigs = (): DNSConfig[] => {
  const domains = ['example.com', 'myapp.io', 'company.cn', 'service.net', 'platform.org'];
  return domains.map((domain, index) => ({
    id: `dns-${index + 1}`,
    domain,
    token: `token_${Math.random().toString(36).substring(2, 15)}`,
    createdDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: index % 2 === 0 ? 'active' : 'inactive',
  }));
};

// 生成节点列表
export const generateMockNodes = (): Node[] => {
  const lineGroupIds = ['line-1', 'line-2', 'line-3', 'line-4'];
  const nodes: Node[] = [];

  for (let i = 1; i <= 12; i++) {
    const subIPCount = Math.floor(Math.random() * 3) + 1;
    const subIPs: SubIP[] = [];
    for (let j = 1; j <= subIPCount; j++) {
      subIPs.push({
        id: `subip-${i}-${j}`,
        ip: `192.168.${Math.floor(i / 4) + 1}.${(i % 4) * 50 + 10 + j}`,
        enabled: j % 2 === 0,
        createdDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    nodes.push({
      id: `node-${i}`,
      name: `节点 ${i}`,
      ip: `192.168.${Math.floor(i / 4) + 1}.${(i % 4) * 50 + 10}`,
      managementPort: 8080 + i,
      enabled: i % 3 !== 0,
      status: ['online', 'online', 'offline', 'maintenance'][i % 4] as 'online' | 'offline' | 'maintenance',
      lineGroupId: lineGroupIds[i % lineGroupIds.length],
      createdDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subIPs,
    });
  }

  return nodes;
};

// 生成节点分组
export const generateMockNodeGroups = (): NodeGroup[] => {
  const groupNames = ['东中国节点', '西南节点', '华东节点', '华北节点'];
  const groups: NodeGroup[] = [];

  for (let i = 0; i < groupNames.length; i++) {
    const subIPCount = Math.floor(Math.random() * 4) + 2;
    const subIPs: SubIP[] = [];
    for (let j = 1; j <= subIPCount; j++) {
      subIPs.push({
        id: `group-subip-${i}-${j}`,
        ip: `10.${i}.${j}.${Math.floor(Math.random() * 256)}`,
        enabled: j % 2 === 0,
        createdDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    groups.push({
      id: `group-${i + 1}`,
      name: groupNames[i],
      description: `${groupNames[i]}数据中心`,
      subIPs,
      createdDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  }

  return groups;
};

// 生成时间序列数据（用于图表）
export const generateTimeSeriesData = (days: number = 30) => {
  const data = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    data.push({
      date: dateStr,
      requests: Math.floor(Math.random() * 20000) + 5000,
      errors: Math.floor(Math.random() * 500),
    });
  }

  return data;
};
