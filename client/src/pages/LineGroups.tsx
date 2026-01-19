/**
 * 网站管理 - 线路分组页面
 * 显示所有线路分组信息和管理功能
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateMockLineGroups, LineGroup } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit2, Trash2, Network } from 'lucide-react';

type SortField = 'name' | 'description' | 'cname' | 'nodeCount';
type SortOrder = 'asc' | 'desc';

export default function LineGroups() {
  const [lineGroups] = useState<LineGroup[]>(generateMockLineGroups());
  const [selectedLineGroups, setSelectedLineGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSelectLineGroup = (lineGroupId: string) => {
    const newSelected = new Set(selectedLineGroups);
    if (newSelected.has(lineGroupId)) {
      newSelected.delete(lineGroupId);
    } else {
      newSelected.add(lineGroupId);
    }
    setSelectedLineGroups(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLineGroups.size === filteredLineGroups.length) {
      setSelectedLineGroups(new Set());
    } else {
      setSelectedLineGroups(new Set(filteredLineGroups.map(lg => lg.id)));
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

  const baseFilteredLineGroups = lineGroups.filter(lineGroup => {
    const matchesSearch = 
      lineGroup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lineGroup.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredLineGroups = [...baseFilteredLineGroups].sort((a, b) => {
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

  const breadcrumbs = [
    { label: '首页', href: '/' },
    { label: '网站管理' },
    { label: '线路分组' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} currentPage="线路分组">
      <div className="space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">线路分组</h1>
          <Button className="gap-2">
            <Plus size={16} />
            添加线路分组
          </Button>
        </div>

        {/* 搜索 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜索线路分组..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* 线路分组列表 */}
        <Card className="border border-border overflow-hidden">
          <div className="px-6 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedLineGroups.size > 0 ? `已选择 ${selectedLineGroups.size} 个` : `共 ${filteredLineGroups.length} 个`}
            </span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-center py-3 px-4 font-semibold text-foreground w-12">
                    <input
                      type="checkbox"
                      checked={selectedLineGroups.size === filteredLineGroups.length && filteredLineGroups.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      名称
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('description')}>
                    <div className="flex items-center">
                      说明
                      <SortIcon field="description" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('cname')}>
                    <div className="flex items-center">
                      CNAME
                      <SortIcon field="cname" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('nodeCount')}>
                    <div className="flex items-center">
                      节点数
                      <SortIcon field="nodeCount" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredLineGroups.map((lineGroup, index) => (
                  <tr
                    key={lineGroup.id}
                    className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                      selectedLineGroups.has(lineGroup.id) ? 'bg-primary/10' : index % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                    }`}
                  >
                    <td className="text-center py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedLineGroups.has(lineGroup.id)}
                        onChange={() => handleSelectLineGroup(lineGroup.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{lineGroup.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{lineGroup.description}</td>
                    <td className="py-3 px-4 text-muted-foreground">{lineGroup.cname}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        <Network size={14} />
                        {lineGroup.nodeCount}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-secondary rounded transition-colors" title="查看节点">
                          <Network size={16} className="text-muted-foreground" />
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
    </DashboardLayout>
  );
}
