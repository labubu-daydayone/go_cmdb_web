/**
 * 域名管理页面
 * 显示所有域名信息和管理功能
 */

import { useState } from 'react';
import { Card } from '@/components/mui/Card';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/mui';
import { generateMockDomains, Domain } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

type SortField = 'name' | 'status' | 'expiryDate' | 'sslStatus';
type SortOrder = 'asc' | 'desc';

export default function Domains() {
  const [domains] = useState<Domain[]>(generateMockDomains());
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
    if (selectedDomains.size === sortedDomains.length) {
      setSelectedDomains(new Set());
    } else {
      setSelectedDomains(new Set(sortedDomains.map(d => d.id)));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const baseFilteredDomains = domains.filter(domain => {
    const matchesSearch = domain.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || domain.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedDomains = [...baseFilteredDomains].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // 分页数据
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const filteredDomains = sortedDomains.slice(startIndex, endIndex);

  const dnsRecords = selectedDomain ? [
    { id: '1', type: 'A', name: selectedDomain.name, value: '192.168.1.1', ttl: 3600 },
    { id: '2', type: 'CNAME', name: `www.${selectedDomain.name}`, value: selectedDomain.name, ttl: 3600 },
    { id: '3', type: 'MX', name: selectedDomain.name, value: `mail.${selectedDomain.name}`, ttl: 3600 },
  ] : [];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-muted-foreground text-xs">⇅</span>;
    }
    return <span className="ml-1 text-primary text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

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
              <SearchIcon fontSize="small" className="absolute left-3 top-3 text-muted-foreground" />
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
              <AddIcon fontSize="small" />
              添加域名
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 域名列表 */}
          <div className="w-full">
            <Card className="border border-border overflow-hidden">
              <div className="px-6 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedDomains.size > 0 ? `已选择 ${selectedDomains.size} 个` : `共 ${sortedDomains.length} 个`}
                </span>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-center py-3 px-4 font-semibold text-foreground w-12">
                        <input
                          type="checkbox"
                          checked={selectedDomains.size === sortedDomains.length && sortedDomains.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('name')}>
                        <div className="flex items-center">
                          域名
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('status')}>
                        <div className="flex items-center">
                          状态
                          <SortIcon field="status" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('expiryDate')}>
                        <div className="flex items-center">
                          过期日期
                          <SortIcon field="expiryDate" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('sslStatus')}>
                        <div className="flex items-center">
                          SSL
                          <SortIcon field="sslStatus" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">操作</th>
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
                        <td className="py-3 px-4 cursor-pointer" onClick={() => setSelectedDomain(domain)}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🌐</span>
                            <div>
                              <p className="font-medium text-foreground">{domain.name}</p>
                              <p className="text-xs text-muted-foreground">{domain.registrar}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 cursor-pointer" onClick={() => setSelectedDomain(domain)}>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(domain.status)}`}>
                            {domain.status === 'active' ? '活跃' : domain.status === 'inactive' ? '非活跃' : '已过期'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground cursor-pointer" onClick={() => setSelectedDomain(domain)}>{domain.expiryDate}</td>
                        <td className="py-3 px-4 cursor-pointer" onClick={() => setSelectedDomain(domain)}>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSSLBadgeColor(domain.sslStatus)}`}>
                            {domain.sslStatus === 'valid' ? '有效' : domain.sslStatus === 'warning' ? '警告' : '已过期'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1 hover:bg-secondary rounded transition-colors" title="查看">
                              <VisibilityIcon fontSize="small" className="text-muted-foreground"/>
                            </button>
                            <button className="p-1 hover:bg-secondary rounded transition-colors" title="编辑">
                              <EditIcon fontSize="small" className="text-muted-foreground"/>
                            </button>
                            <button className="p-1 hover:bg-red-100 rounded transition-colors" title="删除">
                              <DeleteIcon fontSize="small" className="text-red-600"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 分页 */}
              <Pagination
                current={currentPage}
                total={sortedDomains.length}
                pageSize={pageSize}
                showSizeChanger
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                onShowSizeChange={(current, size) => {
                  setCurrentPage(1);
                  setPageSize(size);
                }}
              />
            </Card>
          </div>

          {/* 域名详情 */}
          {selectedDomain && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 域名卡片 */}
              <Card className="p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">域名详情</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">域名</p>
                    <p className="font-medium text-foreground">{selectedDomain.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">注册商</p>
                    <p className="font-medium text-foreground">{selectedDomain.registrar}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">SSL 状态</p>
                    <p className="font-medium text-foreground">{selectedDomain.sslStatus}</p>
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
                  {dnsRecords.map((record: any) => (
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
