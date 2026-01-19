import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface CacheRule {
  id: string;
  ruleType: 'file' | 'directory';
  pattern: string;
  ttl: number;
}

interface CacheSetting {
  id: string;
  name: string;
  rules: CacheRule[];
  addedTime: string;
}

const mockCacheSettings: CacheSetting[] = [
  {
    id: '1',
    name: '首页缓存',
    rules: [
      { id: '1-1', ruleType: 'directory', pattern: '/', ttl: 3600 },
    ],
    addedTime: '2026-01-15 10:30:00',
  },
  {
    id: '2',
    name: '图片缓存',
    rules: [
      { id: '2-1', ruleType: 'file', pattern: 'png|jpg|gif', ttl: 86400 },
      { id: '2-2', ruleType: 'file', pattern: 'webp', ttl: 86400 },
    ],
    addedTime: '2026-01-14 14:20:00',
  },
  {
    id: '3',
    name: 'API缓存',
    rules: [
      { id: '3-1', ruleType: 'directory', pattern: '/api/', ttl: 300 },
    ],
    addedTime: '2026-01-13 09:15:00',
  },
];

interface FormData {
  name: string;
  rules: CacheRule[];
}

export default function CacheSettings() {
  const [settings, setSettings] = useState<CacheSetting[]>(mockCacheSettings);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [listPage, setListPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    rules: [{ id: '0', ruleType: 'directory', pattern: '', ttl: 3600 }],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      rules: [{ id: '0', ruleType: 'directory', pattern: '', ttl: 3600 }],
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleAddRule = () => {
    const newRule: CacheRule = {
      id: Date.now().toString(),
      ruleType: 'directory',
      pattern: '',
      ttl: 3600,
    };
    setFormData({
      ...formData,
      rules: [...formData.rules, newRule],
    });
  };

  const handleRemoveRule = (ruleId: string) => {
    if (formData.rules.length === 1) {
      alert('至少需要一个缓存规则');
      return;
    }
    setFormData({
      ...formData,
      rules: formData.rules.filter((r) => r.id !== ruleId),
    });
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<CacheRule>) => {
    setFormData({
      ...formData,
      rules: formData.rules.map((r) =>
        r.id === ruleId ? { ...r, ...updates } : r
      ),
    });
  };

  const handleAddSetting = () => {
    if (!formData.name) {
      alert('请填写缓存名称');
      return;
    }

    if (formData.rules.some((r) => !r.pattern)) {
      alert('请填写所有缓存规则');
      return;
    }

    if (editingId) {
      setSettings(
        settings.map((s) =>
          s.id === editingId
            ? {
                ...s,
                name: formData.name,
                rules: formData.rules.map((r) => ({
                  ...r,
                  id: r.id.startsWith('0') ? Date.now().toString() + Math.random() : r.id,
                })),
              }
            : s
        )
      );
    } else {
      const newSetting: CacheSetting = {
        id: Date.now().toString(),
        name: formData.name,
        rules: formData.rules.map((r) => ({
          ...r,
          id: Date.now().toString() + Math.random(),
        })),
        addedTime: new Date().toLocaleString('zh-CN'),
      };
      setSettings([newSetting, ...settings]);
    }

    resetForm();
  };

  const handleEditSetting = (setting: CacheSetting) => {
    setFormData({
      name: setting.name,
      rules: [...setting.rules],
    });
    setEditingId(setting.id);
    setShowAddForm(true);
  };

  const handleDeleteSetting = (id: string) => {
    if (confirm('确定要删除此缓存规则吗？')) {
      setSettings(settings.filter((s) => s.id !== id));
    }
  };

  const filteredSettings = settings.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSettings = filteredSettings.slice(
    (listPage - 1) * itemsPerPage,
    listPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredSettings.length / itemsPerPage);

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: '网站管理' },
        { label: '缓存规则' },
      ]}
      currentPage="缓存规则"
    >
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">缓存规则</h1>
            <p className="text-sm text-muted-foreground mt-1">共 {settings.length} 个</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>添加缓存规则</Button>
        </div>

        {/* 搜索 */}
        <div className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setListPage(1);
            }}
            placeholder="搜索缓存规则..."
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 缓存规则列表 */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-6 py-3 text-left font-semibold text-foreground">缓存名称</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">缓存规则</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">添加时间</th>
                  <th className="px-6 py-3 text-center font-semibold text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSettings.length > 0 ? (
                  paginatedSettings.map((setting) => (
                    <tr key={setting.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-3 text-foreground font-medium">{setting.name}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        <div className="space-y-1">
                          {setting.rules.map((rule) => (
                            <div key={rule.id} className="text-xs">
                              <span className="inline-block bg-secondary/50 px-2 py-1 rounded mr-2">
                                {rule.ruleType === 'directory' ? '目录' : '文件'}
                              </span>
                              <span className="font-mono">{rule.pattern}</span>
                              <span className="text-muted-foreground ml-2">({rule.ttl}s)</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">{setting.addedTime}</td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditSetting(setting)}
                            className="p-1 hover:bg-secondary rounded transition-colors"
                            title="编辑"
                          >
                            <Edit2 size={16} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteSetting(setting.id)}
                            className="p-1 hover:bg-secondary rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      暂无缓存规则
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {listPage} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setListPage(Math.max(1, listPage - 1))}
                  disabled={listPage === 1}
                  className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => setListPage(Math.min(totalPages, listPage + 1))}
                  disabled={listPage === totalPages}
                  className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* 添加/编辑表单 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/30 flex items-end z-50 animate-in fade-in duration-200">
            <Card className="w-1/2 rounded-t-2xl border-0 p-0 h-auto max-h-2/3 overflow-y-auto bg-background animate-in slide-in-from-bottom duration-300 ml-auto">
              {/* 表单头部 */}
              <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">
                  {editingId ? '编辑缓存规则' : '添加缓存规则'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              {/* 表单内容 */}
              <div className="p-6 space-y-6">
                {/* 缓存名称 - label和input在一行 */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-foreground w-32 flex-shrink-0">
                    缓存名称: <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：首页缓存"
                    className="w-48 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* 匹配规则 */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-4">
                    匹配规则:
                  </label>

                  {/* 规则行 */}
                  <div className="space-y-3">
                    {formData.rules.map((rule, index) => (
                      <div key={rule.id} className="flex items-center gap-4">
                        {/* 类型 */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-foreground w-12 flex-shrink-0">
                            类型:
                          </label>
                          <select
                            value={rule.ruleType}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, {
                                ruleType: e.target.value as 'file' | 'directory',
                              })
                            }
                            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="directory">目录</option>
                            <option value="file">文件</option>
                          </select>
                        </div>

                        {/* 规则 */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-foreground w-12 flex-shrink-0">
                            规则:
                          </label>
                          <input
                            type="text"
                            value={rule.pattern}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, { pattern: e.target.value })
                            }
                            placeholder={
                              rule.ruleType === 'directory'
                                ? '/api/'
                                : 'png|jpg'
                            }
                            className="w-40 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        {/* TTL */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-foreground w-12 flex-shrink-0">
                            TTL:
                          </label>
                          <input
                            type="number"
                            value={rule.ttl}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, { ttl: parseInt(e.target.value) })
                            }
                            min="1"
                            className="w-24 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        {/* 删除按钮 */}
                        <button
                          onClick={() => handleRemoveRule(rule.id)}
                          className="p-1 hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                          title="删除规则"
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* 添加规则按钮 */}
                  <button
                    onClick={handleAddRule}
                    className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    添加规则
                  </button>
                </div>
              </div>

              {/* 表单按钮 */}
              <div className="border-t border-border px-6 py-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>
                  取消
                </Button>
                <Button onClick={handleAddSetting}>
                  {editingId ? '更新' : '添加'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
