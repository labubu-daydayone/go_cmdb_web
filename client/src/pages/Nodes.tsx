/**
 * 节点列表页面
 * 显示所有节点信息和管理功能，支持展开显示子IP
 */

import { useState } from 'react';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui';
import { Pagination } from '@/components/Pagination';
import { generateMockNodes, Node } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Popconfirm } from '@/components/Popconfirm';
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
  // 子IP分页状态：为每个节点单独维护分页信息
  const [subIPPages, setSubIPPages] = useState<Record<string, { currentPage: number; pageSize: number }>>({});

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

  const sortedNodes = [...baseFilteredNodes].sort((a, b) => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const filteredNodes = sortedNodes.slice(startIndex, endIndex);

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
          <div className="space-y-0 overflow-x-auto">
            {/* 表头 */}
            <div className="grid grid-cols-11 gap-4 px-6 py-3 bg-secondary/20 border-b border-border font-semibold text-sm text-muted-foreground min-w-[900px]">
              <div className="col-span-1 flex items-center gap-1 px-2">
                <input
                  type="checkbox"
                  checked={selectedNodes.size === filteredNodes.length && filteredNodes.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 cursor-pointer flex-shrink-0"
                />
              </div>
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
                  className={`grid grid-cols-11 gap-4 px-6 py-3 border-b border-border hover:bg-secondary/30 transition-colors min-w-[900px] ${
                    selectedNodes.has(node.id) ? 'bg-primary/10' : index % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                  }`}
                >
                  <div className="col-span-1 flex items-center gap-1 px-2">
                    <input
                      type="checkbox"
                      checked={selectedNodes.has(node.id)}
                      onChange={() => handleSelectNode(node.id)}
                      className="w-4 h-4 cursor-pointer flex-shrink-0"
                    />
                    <button
                      onClick={() => handleToggleExpand(node.id)}
                      className="p-0.5 hover:bg-secondary rounded transition-colors flex-shrink-0"
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
                    <Popconfirm
                      title="确认删除？"
                      description="删除后无法恢复，是否继续？"
                      onConfirm={() => console.log('Delete node', node.id)}
                    >
                      <button className="p-1 hover:bg-red-100 rounded transition-colors" title="删除">
                        <DeleteIcon fontSize="small" className="text-red-600"/>
                      </button>
                    </Popconfirm>
                  </div>
                </div>

                {/* 展开的子IP 列表 */}
                {expandedNodes.has(node.id) && (node.subIPs || []).length > 0 && (() => {
                  const subIPs = node.subIPs || [];
                  const pageInfo = subIPPages[node.id] || { currentPage: 1, pageSize: 10 };
                  const startIndex = (pageInfo.currentPage - 1) * pageInfo.pageSize;
                  const endIndex = startIndex + pageInfo.pageSize;
                  const paginatedSubIPs = subIPs.slice(startIndex, endIndex);
                  const totalPages = Math.ceil(subIPs.length / pageInfo.pageSize);

                  return (
                  <div className="bg-secondary/5 border-b border-border px-6 py-3">
                    <div className="space-y-2 overflow-x-auto">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-foreground">子 IP 列表（共 {subIPs.length} 个）</div>
                        {subIPs.length > pageInfo.pageSize && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>每页显示</span>
                            <select
                              value={pageInfo.pageSize}
                              onChange={(e) => {
                                const newPageSize = Number(e.target.value);
                                setSubIPPages({
                                  ...subIPPages,
                                  [node.id]: { currentPage: 1, pageSize: newPageSize }
                                });
                              }}
                              className="border border-border rounded px-2 py-1 bg-background"
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                              <option value={50}>50</option>
                            </select>
                            <span>条</span>
                          </div>
                        )}
                      </div>
                      {paginatedSubIPs.map((subip) => (
                        <div key={subip.id} className="flex items-center justify-between bg-background border border-border rounded px-3 py-2">
                          <div className="flex items-center gap-3">
                            <code className="text-xs font-mono text-muted-foreground">{subip.ip}</code>
                            <span className="text-xs text-muted-foreground">({subip.createdDate})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleSubIPEnabled(node.id, subip.id)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                subip.enabled 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              title={subip.enabled ? '点击禁用' : '点击启用'}
                            >
                              {subip.enabled ? '已启用' : '已禁用'}
                            </button>
                            <Popconfirm
                              title="删除子IP？"
                              description="确认删除该子IP？"
                              onConfirm={() => handleDeleteSubIP(node.id, subip.id)}
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
                      ))}
                      {/* 子IP分页控件 */}
                      {subIPs.length > pageInfo.pageSize && (
                        <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                          <span className="text-xs text-muted-foreground">
                            {startIndex + 1}-{Math.min(endIndex, subIPs.length)} 条，共 {subIPs.length} 条
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSubIPPages({
                                  ...subIPPages,
                                  [node.id]: { ...pageInfo, currentPage: Math.max(1, pageInfo.currentPage - 1) }
                                });
                              }}
                              disabled={pageInfo.currentPage === 1}
                              className="px-2 py-1 border border-border rounded text-xs hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              上一页
                            </button>
                            <span className="text-xs text-muted-foreground">
                              {pageInfo.currentPage} / {totalPages}
                            </span>
                            <button
                              onClick={() => {
                                setSubIPPages({
                                  ...subIPPages,
                                  [node.id]: { ...pageInfo, currentPage: Math.min(totalPages, pageInfo.currentPage + 1) }
                                });
                              }}
                              disabled={pageInfo.currentPage === totalPages}
                              className="px-2 py-1 border border-border rounded text-xs hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              下一页
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })()}
              </div>
            ))}
          </div>
          <Pagination
            current={currentPage}
            total={sortedNodes.length}
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

        {/* 添加子IP 模态框 */}
        {showAddSubIPModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50" onClick={() => { setShowAddSubIPModal(false); setSelectedNodeId(null); setNewSubIP(''); }}>
            <Card className="w-[600px] h-full rounded-none flex flex-col border-0 p-0" onClick={(e) => e.stopPropagation()}>
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">添加子 IP</h2>
                <button
                  onClick={() => {
                    setShowAddSubIPModal(false);
                    setSelectedNodeId(null);
                    setNewSubIP('');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {/* 可滚动内容区域 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
              </div>

              {/* 底部按钮栏 */}
              <div className="border-t border-border p-6 pt-4 flex gap-2 justify-end bg-background">
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
