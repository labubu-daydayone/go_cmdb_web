/**
 * 回源分组管理页面
 * 用于管理和配置回源分组
 */

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/mui';
import { Card } from '@/components/mui/Card';
import { Pagination } from '@/components/Pagination';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

interface OriginAddress {
  id: string;
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
      addresses: [{ id: '1-1', ip: '192.168.1.1', port: 80, weight: 1, remark: '主要回源地址' }],
      description: '使用标准回源配置',
      status: 'active',
    },
    {
      id: '2',
      name: '高可用回源',
      type: '活跃',
      addresses: [
        { id: '2-1', ip: '192.168.1.2', port: 80, weight: 1, remark: '主要回源' },
        { id: '2-2', ip: '192.168.1.3', port: 80, weight: 1, remark: '备用回源' }
      ],
      description: '多源站高可用配置',
      status: 'active',
    },
    {
      id: '3',
      name: '加速回源',
      type: '备源',
      addresses: [{ id: '3-1', ip: '192.168.1.3', port: 443, weight: 1, remark: 'HTTPS回源' }],
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
    addresses: [{ id: '1', ip: '', port: 80, weight: 1, remark: '' }] as OriginAddress[],
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
        { id: Date.now().toString(), ip: '', port: 80, weight: 1, remark: '' }
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
      addresses: [{ id: '1', ip: '', port: 80, weight: 1, remark: '' }],
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
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                        >
                          <DeleteIcon fontSize="small" className="text-destructive"/>
                        </button>
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
            <Card className="w-full h-1/2 rounded-t-lg rounded-b-none space-y-4 p-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">添加回源分组</h2>
                <button
                  onClick={resetForm}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">分组名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入分组名称"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="主源">主源</option>
                    <option value="备源">备源</option>
                    <option value="活跃">活跃</option>
                  </select>
                </div>

                {/* 回源地址列表 */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-2">回源地址</label>
                  <div className="space-y-3">
                    {formData.addresses.map((address, index) => (
                      <div key={address.id} className="border border-border rounded-lg p-3 space-y-2 bg-secondary/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-foreground">地址 {index + 1}</span>
                          {formData.addresses.length > 1 && (
                            <button
                              onClick={() => handleRemoveAddress(address.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="删除地址"
                            >
                              <DeleteIcon fontSize="small" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={address.ip}
                              onChange={(e) => handleUpdateAddress(address.id, 'ip', e.target.value)}
                              placeholder="IP 地址"
                              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              value={address.port || 80}
                              onChange={(e) => handleUpdateAddress(address.id, 'port', Number(e.target.value))}
                              placeholder="端口"
                              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              value={address.weight || 1}
                              onChange={(e) => handleUpdateAddress(address.id, 'weight', Number(e.target.value))}
                              placeholder="权重"
                              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={address.remark || ''}
                              onChange={(e) => handleUpdateAddress(address.id, 'remark', e.target.value)}
                              placeholder="备注（可选）"
                              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleAddAddress}
                      className="w-full border border-dashed border-border rounded-lg p-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      + 添加地址
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="输入分组描述"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-background border-t border-border px-0 py-4 flex gap-2 justify-end -mx-6 px-6">
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
