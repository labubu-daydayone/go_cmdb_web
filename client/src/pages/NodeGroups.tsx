/**
 * 节点分组页面
 * 管理节点分组和分组下的子IP
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateMockNodeGroups, NodeGroup } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react';

export default function NodeGroups() {
  const [groups, setGroups] = useState<NodeGroup[]>(generateMockNodeGroups());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const handleSelectGroup = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedGroups.size === filteredGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredGroups.map(g => g.id)));
    }
  };

  const handleToggleExpand = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: NodeGroup = {
        id: `group-${Date.now()}`,
        name: newGroupName,
        description: newGroupDesc,
        subIPs: [],
        createdDate: new Date().toISOString().split('T')[0],
      };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setNewGroupDesc('');
      setShowAddGroupModal(false);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
    setSelectedGroups(prev => {
      const newSet = new Set(prev);
      newSet.delete(groupId);
      return newSet;
    });
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const breadcrumbs = [
    { label: '首页', href: '/' },
    { label: '网站管理' },
    { label: '节点分组' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} currentPage="节点分组">
      <div className="space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">节点分组</h1>
          <Button className="gap-2" onClick={() => setShowAddGroupModal(true)}>
            <Plus size={16} />
            添加分组
          </Button>
        </div>

        {/* 搜索 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜索分组名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* 分组列表 */}
        <Card className="border border-border overflow-hidden">
          <div className="px-6 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedGroups.size > 0 ? `已选择 ${selectedGroups.size} 个` : `共 ${filteredGroups.length} 个`}
            </span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-center py-3 px-4 font-semibold text-foreground w-12">
                    <input
                      type="checkbox"
                      checked={selectedGroups.size === filteredGroups.length && filteredGroups.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground w-12"></th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">分组名称</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">描述</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">子 IP 数量</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">创建时间</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group, index) => (
                  <div key={group.id}>
                    <tr
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                        selectedGroups.has(group.id) ? 'bg-primary/10' : index % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                      }`}
                    >
                      <td className="text-center py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(group.id)}
                          onChange={() => handleSelectGroup(group.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="text-center py-3 px-4">
                        <button
                          onClick={() => handleToggleExpand(group.id)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          title={expandedGroups.has(group.id) ? '收起' : '展开'}
                        >
                          {expandedGroups.has(group.id) ? (
                            <ChevronDown size={16} className="text-muted-foreground" />
                          ) : (
                            <ChevronRight size={16} className="text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{group.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{group.description || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{group.subIPs.length}</td>
                      <td className="py-3 px-4 text-muted-foreground">{group.createdDate}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-secondary rounded transition-colors" title="编辑">
                            <Edit2 size={16} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* 展开的子IP 列表 */}
                    {expandedGroups.has(group.id) && group.subIPs.length > 0 && (
                      <tr className="bg-secondary/5 border-b border-border">
                        <td colSpan={7} className="py-3 px-4">
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-foreground mb-2">子 IP 列表：</div>
                            {group.subIPs.map((subip) => (
                              <div key={subip.id} className="flex items-center justify-between bg-background border border-border rounded px-3 py-2">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={subip.enabled}
                                    disabled
                                    className="w-4 h-4 cursor-not-allowed"
                                  />
                                  <code className="text-xs font-mono text-muted-foreground">{subip.ip}</code>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    subip.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {subip.enabled ? '启用' : '禁用'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </div>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 添加分组模态框 */}
        {showAddGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96 border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">添加节点分组</h2>
                <button
                  onClick={() => {
                    setShowAddGroupModal(false);
                    setNewGroupName('');
                    setNewGroupDesc('');
                  }}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">分组名称</label>
                  <input
                    type="text"
                    placeholder="例如：华东节点"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">描述</label>
                  <input
                    type="text"
                    placeholder="例如：华东数据中心"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddGroupModal(false);
                    setNewGroupName('');
                    setNewGroupDesc('');
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleAddGroup}>添加</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
