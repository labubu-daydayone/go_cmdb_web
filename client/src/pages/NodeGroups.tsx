import { useState } from 'react';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui';
import { Pagination } from '@/components/Pagination';
import { generateMockNodeGroups, NodeGroup } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Popconfirm } from '@/components/Popconfirm';
import Transfer, { TransferItem } from '@/components/Transfer';
import { generateMockNodes } from '@/lib/mockData';
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
  const [selectedNodeKeys, setSelectedNodeKeys] = useState<string[]>([]);
  
  // 获取所有节点作为穿梭框数据源
  const allNodes = generateMockNodes();
  const nodeTransferData: TransferItem[] = allNodes.map(node => ({
    key: node.id,
    title: `${node.name} (${node.ip})`,
    disabled: false,
  }));

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

  const sortedGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const filteredGroups = sortedGroups.slice(startIndex, endIndex);

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
                        <Popconfirm
                          title="确认删除？"
                          description="删除后无法恢复，是否继续？"
                          onConfirm={() => handleDeleteGroup(group.id)}
                        >
                          <button
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="删除"
                          >
                            <DeleteIcon fontSize="small" className="text-red-600"/>
                          </button>
                        </Popconfirm>
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
          <Pagination
            current={currentPage}
            total={sortedGroups.length}
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

        {showAddGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50" onClick={() => { setShowAddGroupModal(false); setNewGroupName(''); setNewGroupDesc(''); setSelectedNodeKeys([]); }}>
            <Card className="w-[800px] h-full rounded-none flex flex-col border-0 p-0" onClick={(e) => e.stopPropagation()}>
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">添加分组</h2>
                <button
                  onClick={() => {
                    setShowAddGroupModal(false);
                    setNewGroupName('');
                    setNewGroupDesc('');
                    setSelectedNodeKeys([]);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {/* 可滚动内容区域 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap">分组名称:</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="输入分组名称"
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap">描述:</label>
                  <textarea
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="输入分组描述"
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">选择节点</label>
                  <Transfer
                    dataSource={nodeTransferData}
                    targetKeys={selectedNodeKeys}
                    onChange={setSelectedNodeKeys}
                    titles={['可选节点', '已选节点']}
                    height={350}
                  />
                </div>
              </div>

              {/* 底部按钮栏 */}
              <div className="border-t border-border p-6 pt-4 flex gap-2 justify-end bg-background">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddGroupModal(false);
                    setNewGroupName('');
                    setNewGroupDesc('');
                    setSelectedNodeKeys([]);
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
