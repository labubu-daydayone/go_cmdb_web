/**
 * 网站管理 - 线路分组页面
 * 显示所有线路分组信息和管理功能
 */

import { useState } from 'react';
import { Card } from '@/components/mui/Card';
import { Button, MultiSelect } from '@/components/mui';
import { Pagination } from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import type { MultiSelectOption } from '@/components/mui/MultiSelect';
import { generateMockLineGroups, LineGroup } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Popconfirm } from '@/components/Popconfirm';
import HubIcon from '@mui/icons-material/Hub';
import CloseIcon from '@mui/icons-material/Close';

type SortField = 'name' | 'description' | 'cname' | 'nodeCount';
type SortOrder = 'asc' | 'desc';

interface NodeGroup {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  cnamePrefix: string;
  domain: string;
  nodeGroups: NodeGroup[];
}

export default function LineGroups() {
  const [lineGroups] = useState<LineGroup[]>(generateMockLineGroups());
  const [selectedLineGroups, setSelectedLineGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    cnamePrefix: '',
    domain: '',
    nodeGroups: [],
  });

  // 可用的节点分组列表
  const availableNodeGroups: NodeGroup[] = [
    { id: '1', name: '节点分组1' },
    { id: '2', name: '节点分组2' },
    { id: '3', name: '节点分组3' },
    { id: '4', name: '节点分组4' },
    { id: '5', name: '节点分组5' },
    { id: '6', name: '节点分组6' },
  ];

  // 转换为 MultiSelect 选项格式
  const nodeGroupOptions: MultiSelectOption[] = availableNodeGroups.map(ng => ({
    label: ng.name,
    value: ng.id,
  }));

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

  const sortedLineGroups = [...baseFilteredLineGroups].sort((a, b) => {
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

  // 分页
  const {
    currentPage,
    itemsPerPage: pageSize,
    paginatedData: filteredLineGroups,
    totalPages,
    handlePageChange,
    handleItemsPerPageChange: handlePageSizeChange,
  } = usePagination({ data: sortedLineGroups, initialItemsPerPage: 15 });

  const totalItems = sortedLineGroups.length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-muted-foreground text-xs">⇅</span>;
    }
    return <span className="ml-1 text-primary text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  // 生成随机 CNAME 前缀
  const generateCNAMEPrefix = () => {
    const randomStr = Math.random().toString(36).substring(2, 8);
    return randomStr; // 只生成随机字符，不带前缀
  };

  const handleAddNodeGroup = (nodeGroup: NodeGroup) => {
    const exists = formData.nodeGroups.find(ng => ng.id === nodeGroup.id);
    if (exists) {
      setFormData({
        ...formData,
        nodeGroups: formData.nodeGroups.filter(ng => ng.id !== nodeGroup.id),
      });
    } else {
      setFormData({
        ...formData,
        nodeGroups: [...formData.nodeGroups, nodeGroup],
      });
    }
  };

  const handleRemoveNodeGroup = (nodeGroupId: string) => {
    setFormData({
      ...formData,
      nodeGroups: formData.nodeGroups.filter(ng => ng.id !== nodeGroupId),
    });
  };

  const handleEdit = (lineGroup: LineGroup) => {
    setEditingId(lineGroup.id);
    setFormData({
      name: lineGroup.name,
      cnamePrefix: lineGroup.cname.split('.')[0] || '',
      domain: lineGroup.cname.split('.').slice(1).join('.') || '',
      nodeGroups: [],
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    console.log('Submit form:', formData, 'Editing ID:', editingId);
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', cnamePrefix: '', domain: '', nodeGroups: [] });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', cnamePrefix: '', domain: '', nodeGroups: [] });
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
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <AddIcon fontSize="small" />
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
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-center py-3 px-2 font-semibold text-foreground w-12">
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
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    节点组
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
                    <td className="text-center py-3 px-2">
                      <input
                        type="checkbox"
                        checked={selectedLineGroups.has(lineGroup.id)}
                        onChange={() => handleSelectLineGroup(lineGroup.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{lineGroup.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <span className="text-xs">{lineGroup.nodeGroups || '节点分组1, 节点分组2'}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{lineGroup.cname}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        <HubIcon fontSize="small" />
                        {lineGroup.nodeCount}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-1 hover:bg-secondary rounded transition-colors" 
                          title="编辑"
                          onClick={() => handleEdit(lineGroup)}
                        >
                          <EditIcon fontSize="small" className="text-muted-foreground"/>
                        </button>
                        <Popconfirm
                          title="确认删除？"
                          description="删除后无法恢复，是否继续？"
                          onConfirm={() => console.log('Delete line group', lineGroup.id)}
                        >
                          <button className="p-1 hover:bg-secondary rounded transition-colors" title="删除">
                            <DeleteIcon fontSize="small" className="text-destructive"/>
                          </button>
                        </Popconfirm>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={pageSize}
            showSizeChanger
            onChange={(page, size) => {
              handlePageChange(page);
              handlePageSizeChange(size);
            }}
            onShowSizeChange={(current, size) => {
              handlePageChange(1);
              handlePageSizeChange(size);
            }}
          />
        </Card>

        {/* 添加线路分组表单 - 上滑动设计 */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50" onClick={handleCancel}>
            <div
              className="w-[800px] h-full bg-background flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">{editingId ? '编辑线路分组' : '添加线路分组'}</h2>
                <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              {/* 可滚动内容区域 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 名称 */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-foreground whitespace-nowrap">名称：</label>
                  <input
                    type="text"
                    placeholder="输入线路分组名称"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-48 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* 解析记录和DNS域名 */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-foreground whitespace-nowrap">解析记录：</label>
                  <input
                    type="text"
                    placeholder="前缀"
                    value={formData.cnamePrefix}
                    onChange={(e) => setFormData({ ...formData, cnamePrefix: e.target.value })}
                    className="w-32 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">.</span>
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-40 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- 请选择域名 --</option>
                    <option value="example.com">example.com</option>
                    <option value="api.example.com">api.example.com</option>
                    <option value="cdn.example.com">cdn.example.com</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, cnamePrefix: generateCNAMEPrefix() })}
                    className="text-xs"
                  >
                    生成
                  </Button>
                </div>

                {/* 添加节点分组 - Material UI 多选选择器 */}
                <div>
                  <MultiSelect
                    label="添加节点分组"
                    placeholder="请选择节点分组"
                    value={formData.nodeGroups.map(ng => ng.id)}
                    onChange={(selectedIds) => {
                      const selectedNodeGroups = availableNodeGroups.filter(ng => selectedIds.includes(ng.id));
                      setFormData({ ...formData, nodeGroups: selectedNodeGroups });
                    }}
                    options={nodeGroupOptions}
                    fullWidth
                    size="small"
                  />
                </div>
              </div>

              {/* 底部按钮栏 */}
              <div className="border-t border-border p-6 pt-4 flex gap-2 justify-end bg-background">
                <Button variant="outline" onClick={handleCancel}>
                  取消
                </Button>
                <Button onClick={handleSubmit}>
                  {editingId ? '保存' : '添加'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
