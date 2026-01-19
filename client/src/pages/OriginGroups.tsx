/**
 * 回源分组管理页面
 * 用于管理和配置回源分组
 */

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/mui';
import { Card } from '@/components/mui/Card';
import { Pencil, Trash2 } from 'lucide-react';

interface OriginGroup {
  id: string;
  name: string;
  type: string;
  address: string;
  description: string;
  status: 'active' | 'inactive';
}

export default function OriginGroups() {
  const [groups, setGroups] = useState<OriginGroup[]>([
    {
      id: '1',
      name: '标准回源',
      type: '主源',
      address: '192.168.1.1',
      description: '使用标准回源配置',
      status: 'active',
    },
    {
      id: '2',
      name: '高可用回源',
      type: '活跃',
      address: '192.168.1.2',
      description: '多源站高可用配置',
      status: 'active',
    },
    {
      id: '3',
      name: '加速回源',
      type: '备源',
      address: '192.168.1.3',
      description: '优化加速的回源配置',
      status: 'inactive',
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '主源',
    address: '',
    description: '',
  });

  const handleAddGroup = () => {
    if (formData.name.trim() && formData.address.trim()) {
      const newGroup: OriginGroup = {
        id: String(groups.length + 1),
        ...formData,
        status: 'active',
      };
      setGroups([...groups, newGroup]);
      resetForm();
    }
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter((g) => g.id !== id));
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      name: '',
      type: '主源',
      address: '',
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left py-3 px-4 font-medium text-foreground">名称</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">类型</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">地址</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">描述</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 text-foreground font-medium">{group.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{group.type}</td>
                    <td className="py-3 px-4 text-muted-foreground">{group.address}</td>
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
                          <Pencil size={16} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">地址</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="输入 IP 地址"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
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
