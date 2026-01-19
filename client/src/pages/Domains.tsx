/**
 * 域名管理页面
 * 显示所有域名信息和管理功能
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateMockDomains, generateMockDNSRecords, Domain } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import { ChevronRight, Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';

export default function Domains() {
  const [domains] = useState<Domain[]>(generateMockDomains());
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());

  const handleSelectDomain = (domainId: string) => {
    const newSelected = new Set(selectedDomains);
    if (newSelected.has(domainId)) {
      newSelected.delete(domainId);
    } else {
      newSelected.add(domainId);
    }
    setSelectedDomains(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDomains.size === filteredDomains.length) {
      setSelectedDomains(new Set());
    } else {
      setSelectedDomains(new Set(filteredDomains.map(d => d.id)));
    }
  };

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = domain.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || domain.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const dnsRecords = selectedDomain ? generateMockDNSRecords(selectedDomain.id) : [];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSSLBadgeColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-amber-100 text-amber-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: '首页', href: '/' },
        { label: '域名管理' },
      ]}
      currentPage="域名管理"
    >
      <div className="space-y-6">
        {/* 顶部操作栏 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="搜索域名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">全部状态</option>
              <option value="active">活跃</option>
              <option value="inactive">非活跃</option>
              <option value="expired">已过期</option>
            </select>
            <Button className="gap-2">
              <Plus size={18} />
              添加域名
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 域名列表 */}
          <div className="lg:col-span-2">
            <Card className="border border-border overflow-hidden">
              <div className="px-6 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedDomains.size > 0 ? `已选择 ${selectedDomains.size} 个` : `共 ${filteredDomains.length} 个`}
                </span>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-center py-3 px-4 font-semibold text-foreground w-12">
                        <input
                          type="checkbox"
                          checked={selectedDomains.size === filteredDomains.length && filteredDomains.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">域名</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">状态</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">过期日期</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">SSL</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDomains.map((domain, index) => (
                      <tr
                        key={domain.id}
                        className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                          selectedDomains.has(domain.id) ? 'bg-primary/10' : index % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                        } ${selectedDomain?.id === domain.id ? 'ring-1 ring-primary' : ''}`}
                      >
                        <td className="text-center py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedDomains.has(domain.id)}
                            onChange={() => {
                              handleSelectDomain(domain.id);
                              setSelectedDomain(domain);
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap cursor-pointer" onClick={() => setSelectedDomain(domain)}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🌐</span>
                            <div>
                              <p className="font-medium text-foreground">{domain.name}</p>
                              <p className="text-xs text-muted-foreground">{domain.registrar}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap cursor-pointer" onClick={() => setSelectedDomain(domain)}>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(domain.status)}`}>
                            {domain.status === 'active' ? '活跃' : domain.status === 'inactive' ? '非活跃' : '已过期'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap cursor-pointer" onClick={() => setSelectedDomain(domain)}>{domain.expiryDate}</td>
                        <td className="py-3 px-4 whitespace-nowrap cursor-pointer" onClick={() => setSelectedDomain(domain)}>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSSLBadgeColor(domain.sslStatus)}`}>
                            {domain.sslStatus === 'valid' ? '有效' : domain.sslStatus === 'warning' ? '警告' : '已过期'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button className="p-1 hover:bg-secondary rounded transition-colors" title="查看">
                              <Eye size={16} className="text-muted-foreground" />
                            </button>
                            <button className="p-1 hover:bg-secondary rounded transition-colors" title="编辑">
                              <Edit2 size={16} className="text-muted-foreground" />
                            </button>
                            <button className="p-1 hover:bg-red-100 rounded transition-colors" title="删除">
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* 域名详情 */}
          {selectedDomain && (
            <div className="space-y-4">
              {/* 域名卡片 */}
              <Card className="p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">域名详情</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">域名</p>
                    <p className="font-medium text-foreground">{selectedDomain.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">所有者</p>
                    <p className="font-medium text-foreground">{selectedDomain.owner}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">注册商</p>
                    <p className="font-medium text-foreground">{selectedDomain.registrar}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">DNS 提供商</p>
                    <p className="font-medium text-foreground">{selectedDomain.dnsProvider}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">IP 地址</p>
                    <p className="font-medium text-foreground font-mono text-sm">{selectedDomain.ipAddress}</p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">创建日期</p>
                      <p className="text-sm font-medium text-foreground">{selectedDomain.createdDate}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">过期日期</p>
                      <p className="text-sm font-medium text-foreground">{selectedDomain.expiryDate}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* DNS 记录 */}
              <Card className="p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">DNS 记录</h3>
                <div className="space-y-2">
                  {dnsRecords.map((record) => (
                    <div key={record.id} className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
                          {record.type}
                        </span>
                        <span className="text-xs text-muted-foreground">TTL: {record.ttl}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{record.name}</p>
                      <p className="text-sm font-mono text-foreground break-all">{record.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
