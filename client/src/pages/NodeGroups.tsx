import { useState } from 'react';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui';
import { generateMockNodeGroups, NodeGroup } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';

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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">节点分组</h1>
          <Button className="gap-2" onClick={() => setShowAddGroupModal(true)}>
            <AddIcon fontSize="small" />
            添加分组
          </Button>
        </div>

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

        <Card className="border border-border overflow-hidden">
          <div className="px-6 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedGroups.size > 0 ? `已选择 ${selectedGroups.size} 个` : `共 ${filteredGroups.length} 个`}
            </span>
          </div>
          <div className="overflow-x-auto w-full">
            <div className="w-full text-sm overflow-x-auto">
              <div className="grid grid-cols-11 gap-4 px-6 py-3 border-b border-border bg-secondary/30 font-semibold text-foreground min-w-[900px]">
                <div className="col-span-1 flex items-center gap-1 px-2">
                  <input
                    type="checkbox"
                    checked={selectedGroups.size === filteredGroups.length && filteredGroups.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                </div>
                <div className="col-span-2">分组名称</div>
                <div className="col-span-3">描述</div>
                <div className="col-span-2">子 IP 数量</div>
                <div className="col-span-1">创建时间</div>
                <div className="col-span-2">操作</div>
              </div>

              {filteredGroups.map((group, index) => (
                <div key={group.id}>
                  <div
                    className={`grid grid-cols-11 gap-4 px-6 py-3 border-b border-border hover:bg-secondary/30 transition-colors min-w-[900px] ${
                      selectedGroups.has(group.id) ? 'bg-primary/10' : index % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                    }`}
                  >
                    <div className="col-span-1 flex items-center gap-1 px-2">
                      <input
                        type="checkbox"
                        checked={selectedGroups.has(group.id)}
                        onChange={() => handleSelectGroup(group.id)}
                        className="w-4 h-4 cursor-pointer flex-shrink-0"
                      />
                      <button
                        onClick={() => handleToggleExpand(group.id)}
                        className="p-0.5 hover:bg-secondary rounded transition-colors flex-shrink-0"
                        title={expandedGroups.has(group.id) ? '收起' : '展开'}
                      >
                        {expandedGroups.has(group.id) ? (
                          <ExpandMoreIcon fontSize="small" className="text-muted-foreground"/>
                        ) : (
                          <ChevronRightIcon fontSize="small" className="text-muted-foreground"/>
                        )}
                      </button>
                    </div>
                    <div className="col-span-2 font-medium text-foreground">{group.name}</div>
                    <div className="col-span-3 text-muted-foreground">{group.description || '-'}</div>
                    <div className="col-span-2 text-muted-foreground">{group.subIPs.length}</div>
                    <div className="col-span-1 text-muted-foreground">{group.createdDate}</div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-secondary rounded transition-colors" title="编辑">
                          <EditIcon fontSize="small" className="text-muted-foreground"/>
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="删除"
                        >
                          <DeleteIcon fontSize="small" className="text-red-600"/>
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedGroups.has(group.id) && group.subIPs.length > 0 && (
                    <div className="bg-secondary/5 border-b border-border px-6 py-3">
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-foreground mb-2">子 IP 列表：</div>
                        {group.subIPs.map((subip) => (
                          <div key={subip.id} className="flex items-center justify-between bg-background border border-border rounded px-3 py-2">
                            <div className="flex items-center gap-3">
                              <code className="text-xs font-mono text-muted-foreground">{subip.ip}</code>
                              <span className="text-xs text-muted-foreground">({subip.createdDate})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {showAddGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96 border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">添加分组</h2>
                <button
                  onClick={() => {
                    setShowAddGroupModal(false);
                    setNewGroupName('');
                    setNewGroupDesc('');
                  }}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <CloseIcon fontSize="medium" className="text-muted-foreground"/>
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">分组名称</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="输入分组名称"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">描述</label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="输入分组描述"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
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
