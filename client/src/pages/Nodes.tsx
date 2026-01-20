/**
 * 节点列表页面
 * 显示所有节点信息和管理功能，支持展开显示子IP
 */

import { useState } from 'react';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui';
import { generateMockNodes, Node } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';

type SortField = 'name' | 'ip' | 'managementPort' | 'status';
type SortOrder = 'asc' | 'desc';

export default function Nodes() {
  const [nodes, setNodes] = useState<Node[]>(generateMockNodes());
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showAddSubIPModal, setShowAddSubIPModal] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newSubIP, setNewSubIP] = useState('');

  const handleSelectNode = (nodeId: string) => {
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(nodeId)) {
      newSelected.delete(nodeId);
    } else {
      newSelected.add(nodeId);
    }
    setSelectedNodes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNodes.size === filteredNodes.length) {
      setSelectedNodes(new Set());
    } else {
      setSelectedNodes(new Set(filteredNodes.map(n => n.id)));
    }
  };

  const handleToggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleAddSubIP = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setShowAddSubIPModal(true);
  };

  const handleSaveSubIP = () => {
    if (selectedNodeId && newSubIP.trim()) {
      setNodes(nodes.map(node => {
        if (node.id === selectedNodeId) {
          const subIPs = node.subIPs || [];
          return {
            ...node,
            subIPs: [
              ...subIPs,
              {
                id: `subip-${Date.now()}`,
                ip: newSubIP,
                enabled: true,
                createdDate: new Date().toISOString().split('T')[0],
              },
            ],
          };
        }
        return node;
      }));
      setNewSubIP('');
      setShowAddSubIPModal(false);
      setSelectedNodeId(null);
    }
  };

  const handleDeleteSubIP = (nodeId: string, subIPId: string) => {
    setNodes(nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          subIPs: (node.subIPs || []).filter(subip => subip.id !== subIPId),
        };
      }
      return node;
    }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const baseFilteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.ip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || node.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredNodes = [...baseFilteredNodes].sort((a, b) => {
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

  const handleToggleSubIPEnabled = (nodeId: string, subIPId: string) => {
    setNodes(nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          subIPs: (node.subIPs || []).map(subip => 
            subip.id === subIPId ? { ...subip, enabled: !subip.enabled } : subip
          )
        };
      }
      return node;
    }));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-700';
      case 'offline':
        return 'bg-red-100 text-red-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const breadcrumbs = [
    { label: '首页', href: '/' },
    { label: '网站管理' },
    { label: '节点列表' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} currentPage="节点列表">
      <div className="space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">节点列表</h1>
          <Button className="gap-2">
            <AddIcon fontSize="small" />
            添加节点
          </Button>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜索节点名称或 IP..."
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
            <option value="online">在线</option>
            <option value="offline">离线</option>
            <option value="maintenance">维护中</option>
          </select>
        </div>

        {/* 节点列表 */}
        <Card className="border border-border overflow-hidden">
          <div className="px-6 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedNodes.size > 0 ? `已选择 ${selectedNodes.size} 个` : `共 ${filteredNodes.length} 个`}
            </span>
          </div>
          <div className="space-y-0">
            {/* 表头 */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-secondary/20 border-b border-border font-semibold text-sm text-muted-foreground">
              <div className="col-span-1 text-center">
                <input
                  type="checkbox"
                  checked={selectedNodes.size === filteredNodes.length && filteredNodes.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
              </div>
              <div className="col-span-1 text-center"></div>
              <div className="col-span-2 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center">
                  名称
                  <SortIcon field="name" />
                </div>
              </div>
              <div className="col-span-2 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('ip')}>
                <div className="flex items-center">
                  IP
                  <SortIcon field="ip" />
                </div>
              </div>
              <div className="col-span-1 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('managementPort')}>
                <div className="flex items-center">
                  端口
                  <SortIcon field="managementPort" />
                </div>
              </div>
              <div className="col-span-1">启用</div>
              <div className="col-span-2 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center">
                  状态
                  <SortIcon field="status" />
                </div>
              </div>
              <div className="col-span-2">操作</div>
            </div>

            {/* 节点行 */}
            {filteredNodes.map((node, index) => (
              <div key={node.id}>
                <div
                  className={`grid grid-cols-12 gap-4 px-6 py-3 border-b border-border hover:bg-secondary/30 transition-colors ${
                    selectedNodes.has(node.id) ? 'bg-primary/10' : index % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                  }`}
                >
                  <div className="col-span-1 text-center">
                    <input
                      type="checkbox"
                      checked={selectedNodes.has(node.id)}
                      onChange={() => handleSelectNode(node.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => handleToggleExpand(node.id)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                      title={expandedNodes.has(node.id) ? '收起' : '展开'}
                    >
                      {expandedNodes.has(node.id) ? (
                        <ExpandMoreIcon fontSize="small" className="text-muted-foreground"/>
                      ) : (
                        <ChevronRightIcon fontSize="small" className="text-muted-foreground"/>
                      )}
                    </button>
                  </div>
                  <div className="col-span-2 font-medium text-foreground">{node.name}</div>
                  <div className="col-span-2 text-muted-foreground font-mono text-xs">{node.ip}</div>
                  <div className="col-span-1 text-muted-foreground">{node.managementPort}</div>
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={node.enabled}
                      disabled
                      className="w-4 h-4 cursor-not-allowed"
                    />
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(node.status)}`}>
                      {node.status === 'online' ? '在线' : node.status === 'offline' ? '离线' : '维护中'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <button
                      onClick={() => handleAddSubIP(node.id)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                      title="添加子IP"
                    >
                      <AddIcon fontSize="small" className="text-muted-foreground"/>
                    </button>
                    <button className="p-1 hover:bg-secondary rounded transition-colors" title="编辑">
                      <EditIcon fontSize="small" className="text-muted-foreground"/>
                    </button>
                    <button className="p-1 hover:bg-red-100 rounded transition-colors" title="删除">
                      <DeleteIcon fontSize="small" className="text-red-600"/>
                    </button>
                  </div>
                </div>

                {/* 展开的子IP 列表 */}
                {expandedNodes.has(node.id) && (node.subIPs || []).length > 0 && (
                  <div className="bg-secondary/5 border-b border-border px-6 py-3">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-foreground mb-2">子 IP 列表：</div>
                      {(node.subIPs || []).map((subip) => (
                        <div key={subip.id} className="flex items-center justify-between bg-background border border-border rounded px-3 py-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={subip.enabled}
                              onChange={() => handleToggleSubIPEnabled(node.id, subip.id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <code className="text-xs font-mono text-muted-foreground">{subip.ip}</code>
                            <span className="text-xs text-muted-foreground">({subip.createdDate})</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              subip.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {subip.enabled ? '已启用' : '已禁用'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteSubIP(node.id, subip.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="删除"
                          >
                            <DeleteIcon fontSize="small" className="text-red-600"/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* 添加子IP 模态框 */}
        {showAddSubIPModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96 border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">添加子 IP</h2>
                <button
                  onClick={() => {
                    setShowAddSubIPModal(false);
                    setSelectedNodeId(null);
                    setNewSubIP('');
                  }}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <CloseIcon fontSize="medium" className="text-muted-foreground"/>
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">IP 地址</label>
                <input
                  type="text"
                  placeholder="例如：192.168.1.100"
                  value={newSubIP}
                  onChange={(e) => setNewSubIP(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddSubIPModal(false);
                    setSelectedNodeId(null);
                    setNewSubIP('');
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleSaveSubIP}>添加</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
