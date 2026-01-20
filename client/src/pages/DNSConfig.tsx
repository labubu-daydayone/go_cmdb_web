/**
 * DNS 配置页面
 * 管理 DNS 配置信息
 */

import { useState } from 'react';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui';
import { Pagination } from '@/components/Pagination';
import { generateMockDNSConfigs, DNSConfig } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Popconfirm } from '@/components/Popconfirm';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function DNSConfigPage() {
  const [dnsConfigs, setDnsConfigs] = useState<DNSConfig[]>(generateMockDNSConfigs());
  const [selectedConfigs, setSelectedConfigs] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newToken, setNewToken] = useState('');
  const [showTokens, setShowTokens] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // 分页数据
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedConfigs = dnsConfigs.slice(startIndex, endIndex);

  const handleSelectConfig = (configId: string) => {
    const newSelected = new Set(selectedConfigs);
    if (newSelected.has(configId)) {
      newSelected.delete(configId);
    } else {
      newSelected.add(configId);
    }
    setSelectedConfigs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedConfigs.size === dnsConfigs.length) {
      setSelectedConfigs(new Set());
    } else {
      setSelectedConfigs(new Set(dnsConfigs.map(c => c.id)));
    }
  };

  const handleAddConfig = () => {
    if (newDomain.trim() && newToken.trim()) {
      const newConfig: DNSConfig = {
        id: `dns-${Date.now()}`,
        domain: newDomain,
        token: newToken,
        createdDate: new Date().toISOString().split('T')[0],
        status: 'active',
      };
      setDnsConfigs([...dnsConfigs, newConfig]);
      setNewDomain('');
      setNewToken('');
      setShowAddModal(false);
    }
  };

  const handleDeleteConfig = (configId: string) => {
    setDnsConfigs(dnsConfigs.filter(c => c.id !== configId));
    setSelectedConfigs(prev => {
      const newSet = new Set(prev);
      newSet.delete(configId);
      return newSet;
    });
  };

  const toggleShowToken = (configId: string) => {
    const newSet = new Set(showTokens);
    if (newSet.has(configId)) {
      newSet.delete(configId);
    } else {
      newSet.add(configId);
    }
    setShowTokens(newSet);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
  };

  const breadcrumbs = [
    { label: '首页', href: '/' },
    { label: 'DNS 配置' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} currentPage="DNS 配置">
      <div className="space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">DNS 配置</h1>
          <Button className="gap-2" onClick={() => setShowAddModal(true)}>
            <AddIcon fontSize="small" />
            添加配置
          </Button>
        </div>

        {/* DNS 配置列表 */}
        <Card className="border border-border overflow-hidden">
          {selectedConfigs.size > 0 && (
            <div className="px-6 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
              </span>
            </div>
          )}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-center py-3 px-2 font-semibold text-foreground w-12">
                    <input
                      type="checkbox"
                      checked={selectedConfigs.size === dnsConfigs.length && dnsConfigs.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">域名</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Token</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">状态</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">创建时间</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedConfigs.map((config, index) => (
                  <tr
                    key={config.id}
                    className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                      selectedConfigs.has(config.id) ? 'bg-primary/10' : index % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                    }`}
                  >
                    <td className="text-center py-3 px-2">
                      <input
                        type="checkbox"
                        checked={selectedConfigs.has(config.id)}
                        onChange={() => handleSelectConfig(config.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{config.domain}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-secondary/50 px-2 py-1 rounded font-mono">
                          {showTokens.has(config.id) ? config.token : '••••••••••••••••'}
                        </code>
                        <button
                          onClick={() => toggleShowToken(config.id)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          title={showTokens.has(config.id) ? '隐藏' : '显示'}
                        >
                          {showTokens.has(config.id) ? (
                            <VisibilityOffIcon fontSize="small" className="text-muted-foreground"/>
                          ) : (
                            <VisibilityIcon fontSize="small" className="text-muted-foreground"/>
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(config.token)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          title="复制"
                        >
                          <ContentCopyIcon fontSize="small" className="text-muted-foreground"/>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(config.status)}`}>
                        {config.status === 'active' ? '活跃' : '非活跃'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{config.createdDate}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Popconfirm
                          title="确认删除？"
                          description="删除后无法恢复，是否继续？"
                          onConfirm={() => handleDeleteConfig(config.id)}
                        >
                          <button
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="删除"
                          >
                            <DeleteIcon fontSize="small" className="text-red-600"/>
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
            total={dnsConfigs.length}
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

        {/* 添加配置模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50" onClick={() => { setShowAddModal(false); setNewDomain(''); setNewToken(''); }}>
            <Card className="w-[800px] h-full rounded-none flex flex-col border-0 p-0" onClick={(e) => e.stopPropagation()}>
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">添加 DNS 配置</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewDomain('');
                    setNewToken('');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {/* 可滚动内容区域 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">域名</label>
                  <input
                    type="text"
                    placeholder="例如：example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Token</label>
                  <input
                    type="text"
                    placeholder="输入 Token"
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* 底部按钮栏 */}
              <div className="border-t border-border p-6 pt-4 flex gap-2 justify-end bg-background">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewDomain('');
                    setNewToken('');
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleAddConfig}>添加</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
