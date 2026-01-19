/**
 * 网站管理 - 网站列表页面
 * 显示所有网站信息和管理功能
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateMockWebsites, Website } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit2, Trash2, Eye, Zap } from 'lucide-react';

type SortField = 'domain' | 'cname' | 'lineGroup' | 'https' | 'status';
type SortOrder = 'asc' | 'desc';

export default function Websites() {
  const [websites] = useState<Website[]>(generateMockWebsites());
  const [selectedWebsites, setSelectedWebsites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('domain');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSelectWebsite = (websiteId: string) => {
    const newSelected = new Set(selectedWebsites);
    if (newSelected.has(websiteId)) {
      newSelected.delete(websiteId);
    } else {
      newSelected.add(websiteId);
    }
    setSelectedWebsites(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedWebsites.size === filteredWebsites.length) {
      setSelectedWebsites(new Set());
    } else {
      setSelectedWebsites(new Set(filteredWebsites.map(w => w.id)));
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

  const baseFilteredWebsites = websites.filter(website => {
    const matchesSearch = website.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || website.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredWebsites = [...baseFilteredWebsites].sort((a, b) => {
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
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getHttpsBadgeColor = (https: string) => {
    return https === 'enabled' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const breadcrumbs = [
    { label: '首页', href: '/' },
    { label: '网站管理' },
    { label: '网站列表' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} currentPage="网站列表">
      <div className="space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">网站列表</h1>
          <Button className="gap-2">
            <Plus size={16} />
            添加网站
          </Button>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜索域名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">非活跃</option>
            <option value="maintenance">维护中</option>
          </select>
        </div>

        {/* 网站列表 */}
        <Card className="border border-border overflow-hidden">
          <div className="px-6 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedWebsites.size > 0 ? `已选择 ${selectedWebsites.size} 个` : `共 ${filteredWebsites.length} 个`}
            </span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-center py-3 px-4 font-semibold text-foreground w-12">
                    <input
                      type="checkbox"
                      checked={selectedWebsites.size === filteredWebsites.length && filteredWebsites.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('domain')}>
                    <div className="flex items-center">
                      域名
                      <SortIcon field="domain" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('cname')}>
                    <div className="flex items-center">
                      CNAME
                      <SortIcon field="cname" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('lineGroup')}>
                    <div className="flex items-center">
                      线路组
                      <SortIcon field="lineGroup" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('https')}>
                    <div className="flex items-center">
                      HTTPS
                      <SortIcon field="https" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      状态
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredWebsites.map((website, index) => (
                  <tr
                    key={website.id}
                    className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                      selectedWebsites.has(website.id) ? 'bg-primary/10' : index % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                    }`}
                  >
                    <td className="text-center py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedWebsites.has(website.id)}
                        onChange={() => handleSelectWebsite(website.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{website.domain}</td>
                    <td className="py-3 px-4 text-muted-foreground">{website.cname}</td>
                    <td className="py-3 px-4 text-muted-foreground">{website.lineGroup}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHttpsBadgeColor(website.https)}`}>
                        {website.https === 'enabled' ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(website.status)}`}>
                        {website.status === 'active' ? '活跃' : website.status === 'inactive' ? '非活跃' : '维护中'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-secondary rounded transition-colors" title="编辑">
                          <Edit2 size={16} className="text-muted-foreground" />
                        </button>
                        <button className="p-1 hover:bg-secondary rounded transition-colors" title="清除缓存">
                          <Zap size={16} className="text-muted-foreground" />
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
    </DashboardLayout>
  );
}
