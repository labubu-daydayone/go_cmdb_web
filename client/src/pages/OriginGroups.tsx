/**
 * 回源分组管理页面
 * 用于管理和配置回源分组
 */

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/mui';
import { Card } from '@/components/mui/Card';
import { Pagination } from '@/components/Pagination';
import { Popconfirm } from '@/components/Popconfirm';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

interface OriginAddress {
  id: string;
  type: string; // 主源/备源/活跃
  protocol: string; // http/https
  ip: string;
  port?: number;
  weight?: number;
  remark?: string;
}

interface OriginGroup {
  id: string;
  name: string;
  type: string;
  addresses: OriginAddress[];
  description: string;
  status: 'active' | 'inactive';
}

export default function OriginGroups() {
  const [groups, setGroups] = useState<OriginGroup[]>([
    {
      id: '1',
      name: '标准回源',
      type: '主源',
      addresses: [{ id: '1-1', type: '主源', protocol: 'http', ip: '192.168.1.1', port: 80, weight: 1, remark: '主要回源地址' }],
      description: '使用标准回源配置',
      status: 'active',
    },
    {
      id: '2',
      name: '高可用回源',
      type: '活跃',
      addresses: [
        { id: '2-1', type: '主源', protocol: 'http', ip: '192.168.1.2', port: 80, weight: 1, remark: '主要回源' },
        { id: '2-2', type: '备源', protocol: 'http', ip: '192.168.1.3', port: 80, weight: 1, remark: '备用回源' }
      ],
      description: '多源站高可用配置',
      status: 'active',
    },
    {
      id: '3',
      name: '加速回源',
      type: '备源',
      addresses: [{ id: '3-1', type: '备源', protocol: 'https', ip: '192.168.1.3', port: 443, weight: 1, remark: 'HTTPS回源' }],
      description: '优化加速的回源配置',
      status: 'inactive',
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const handleSelectAll = () => {
    if (selectedGroups.size === groups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(groups.map(g => g.id)));
    }
  };

  const handleSelectGroup = (id: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGroups(newSelected);
  };
  const [formData, setFormData] = useState({
    name: '',
    type: '主源',
    addresses: [{ id: '1', type: '主源', protocol: 'http', ip: '', port: 80, weight: 1, remark: '' }] as OriginAddress[],
    description: '',
  });

  const handleAddGroup = () => {
    if (formData.name.trim() && formData.addresses.some(addr => addr.ip.trim())) {
      const newGroup: OriginGroup = {
        id: String(groups.length + 1),
        ...formData,
        addresses: formData.addresses.filter(addr => addr.ip.trim()),
        status: 'active',
      };
      setGroups([...groups, newGroup]);
      resetForm();
    }
  };

  const handleAddAddress = () => {
    setFormData({
      ...formData,
      addresses: [
        ...formData.addresses,
        { id: Date.now().toString(), type: '主源', protocol: 'http', ip: '', port: 80, weight: 1, remark: '' }
      ]
    });
  };

  const handleRemoveAddress = (id: string) => {
    if (formData.addresses.length > 1) {
      setFormData({
        ...formData,
        addresses: formData.addresses.filter(addr => addr.id !== id)
      });
    }
  };

  const handleUpdateAddress = (id: string, field: keyof OriginAddress, value: any) => {
    setFormData({
      ...formData,
      addresses: formData.addresses.map(addr =>
        addr.id === id ? { ...addr, [field]: value } : addr
      )
    });
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter((g) => g.id !== id));
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      name: '',
      type: '主源',
      addresses: [{ id: '1', type: '主源', protocol: 'http', ip: '', port: 80, weight: 1, remark: '' }],
      description: '',
    });
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: '网站管理' },
        { label: '回源分组' },
      ]}
      currentPage="回源分组"
    >
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">回源分组</h1>
            <p className="text-sm text-muted-foreground mt-1">管理和配置回源分组</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>添加分组</Button>
        </div>

        {/* 分组列表 */}
        <Card className="overflow-hidden">
          <div className="px-6 py-3 border-b border-border bg-secondary/10">
            <span className="text-sm text-muted-foreground">
              {selectedGroups.size > 0 ? `已选择 ${selectedGroups.size} 个` : `共 ${groups.length} 个分组`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="w-12 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedGroups.size === groups.length && groups.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">名称</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">类型</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">地址</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">描述</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const startIndex = (currentPage - 1) * pageSize;
                  const endIndex = startIndex + pageSize;
                  const paginatedGroups = groups.slice(startIndex, endIndex);
                  return paginatedGroups.map((group) => (
                  <tr key={group.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="w-12 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedGroups.has(group.id)}
                        onChange={() => handleSelectGroup(group.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">{group.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{group.type}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="space-y-1">
                        {group.addresses.map((addr, idx) => (
                          <div key={addr.id} className="text-xs">
                            <code className="font-mono">{addr.ip}</code>
                            {addr.port && addr.port !== 80 && <span className="text-muted-foreground">:{addr.port}</span>}
                            {addr.remark && <span className="text-muted-foreground ml-2">({addr.remark})</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{group.description}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          group.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {group.status === 'active' ? '活跃' : '非活跃'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-secondary rounded transition-colors">
                          <CreateIcon fontSize="small" className="text-muted-foreground"/>
                        </button>
                        <Popconfirm
                          title="确认删除？"
                          description="删除后无法恢复，是否继续？"
                          onConfirm={() => handleDeleteGroup(group.id)}
                        >
                          <button className="p-1 hover:bg-secondary rounded transition-colors">
                            <DeleteIcon fontSize="small" className="text-destructive"/>
                          </button>
                        </Popconfirm>
                      </div>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          
          {/* 分页 */}
          <Pagination
            current={currentPage}
            total={groups.length}
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

        {/* 添加分组表单 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <Card className="w-full h-1/2 rounded-t-lg rounded-b-none flex flex-col">
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">添加回源分组</h2>
                <button
                  onClick={resetForm}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {/* 可滚动内容区域 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {/* 分组名称：标签和输入框在同一行 */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap">分组名称：</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入分组名称"
                    className="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* 回源地址列表 */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">回源地址</label>
                  <div className="space-y-2">
                    {formData.addresses.map((address, index) => (
                      <div key={address.id} className="flex items-center gap-2 text-sm ml-[31px]">
                        <span className="text-muted-foreground">类型：</span>
                        <select
                          value={address.type}
                          onChange={(e) => handleUpdateAddress(address.id, 'type', e.target.value)}
                          className="w-[70px] px-2 py-1 border border-border rounded bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="主源">主源</option>
                          <option value="备源">备源</option>
                        </select>
                        <span className="text-muted-foreground">协议：</span>
                        <select
                          value={address.protocol}
                          onChange={(e) => handleUpdateAddress(address.id, 'protocol', e.target.value)}
                          className="px-2 py-1 border border-border rounded bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="http">http</option>
                          <option value="https">https</option>
                        </select>
                        <span className="text-muted-foreground">地址：</span>
                        <input
                          type="text"
                          value={address.ip ? `${address.ip}${address.port && address.port !== 80 ? ':' + address.port : ''}` : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const parts = value.split(':');
                            handleUpdateAddress(address.id, 'ip', parts[0]);
                            if (parts[1]) {
                              handleUpdateAddress(address.id, 'port', Number(parts[1]));
                            } else {
                              handleUpdateAddress(address.id, 'port', 80);
                            }
                          }}
                          placeholder="8.8.8.8:80"
                          className="w-40 px-2 py-1 border border-border rounded bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="number"
                          value={address.weight || 1}
                          onChange={(e) => handleUpdateAddress(address.id, 'weight', Number(e.target.value))}
                          placeholder="1"
                          className="w-16 px-2 py-1 border border-border rounded bg-background text-foreground text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                          {formData.addresses.length > 1 && (
                            <Popconfirm
                              title="删除地址？"
                              description="确认删除该回源地址？"
                              onConfirm={() => handleRemoveAddress(address.id)}
                            >
                              <button
                                className="text-red-600 hover:text-red-700 p-1"
                                title="删除地址"
                              >
                                <DeleteIcon fontSize="small" />
                              </button>
                            </Popconfirm>
                          )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddAddress}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      + 添加地址
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap pt-2">描述：</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="输入分组描述"
                    className="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* 底部按钮栏 */}
              <div className="border-t border-border p-6 pt-4 flex gap-2 justify-end bg-background">
                <Button variant="outline" onClick={resetForm} className="text-sm">
                  取消
                </Button>
                <Button onClick={handleAddGroup} className="text-sm">
                  添加
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
