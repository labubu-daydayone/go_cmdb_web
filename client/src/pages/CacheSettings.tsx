import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface CacheSetting {
  id: string;
  name: string;
  description: string;
  ttl: number;
  pattern: string;
  addedTime: string;
}

const mockCacheSettings: CacheSetting[] = [
  {
    id: '1',
    name: '首页缓存',
    description: '首页静态内容缓存',
    ttl: 3600,
    pattern: '/',
    addedTime: '2026-01-15 10:30:00',
  },
  {
    id: '2',
    name: '图片缓存',
    description: '图片资源长期缓存',
    ttl: 86400,
    pattern: '*.jpg|*.png|*.gif',
    addedTime: '2026-01-14 14:20:00',
  },
  {
    id: '3',
    name: 'API缓存',
    description: 'API 接口响应缓存',
    ttl: 300,
    pattern: '/api/*',
    addedTime: '2026-01-13 09:15:00',
  },
];

interface FormData {
  name: string;
  description: string;
  ttl: number;
  pattern: string;
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
    description: '',
    ttl: 3600,
    pattern: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ttl: 3600,
      pattern: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleAddSetting = () => {
    if (!formData.name || !formData.pattern) {
      alert('请填写必填字段');
      return;
    }

    if (editingId) {
      setSettings(
        settings.map((s) =>
          s.id === editingId
            ? {
                ...s,
                name: formData.name,
                description: formData.description,
                ttl: formData.ttl,
                pattern: formData.pattern,
              }
            : s
        )
      );
    } else {
      const newSetting: CacheSetting = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        ttl: formData.ttl,
        pattern: formData.pattern,
        addedTime: new Date().toLocaleString('zh-CN'),
      };
      setSettings([newSetting, ...settings]);
    }

    resetForm();
  };

  const handleEditSetting = (setting: CacheSetting) => {
    setFormData({
      name: setting.name,
      description: setting.description,
      ttl: setting.ttl,
      pattern: setting.pattern,
    });
    setEditingId(setting.id);
    setShowAddForm(true);
  };

  const handleDeleteSetting = (id: string) => {
    if (confirm('确定要删除此缓存设置吗？')) {
      setSettings(settings.filter((s) => s.id !== id));
    }
  };

  const filteredSettings = settings.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.pattern.toLowerCase().includes(searchTerm.toLowerCase())
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
        { label: '缓存设置' },
      ]}
      currentPage="缓存设置"
    >
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">缓存设置</h1>
            <p className="text-sm text-muted-foreground mt-1">共 {settings.length} 个</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>添加缓存设置</Button>
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
            placeholder="搜索缓存设置..."
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 缓存设置列表 */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-6 py-3 text-left font-semibold text-foreground">名称</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">说明</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">匹配规则</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">缓存时长(秒)</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">添加时间</th>
                  <th className="px-6 py-3 text-center font-semibold text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSettings.length > 0 ? (
                  paginatedSettings.map((setting) => (
                    <tr key={setting.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-3 text-foreground font-medium">{setting.name}</td>
                      <td className="px-6 py-3 text-muted-foreground">{setting.description}</td>
                      <td className="px-6 py-3 text-muted-foreground font-mono text-xs">{setting.pattern}</td>
                      <td className="px-6 py-3 text-foreground">{setting.ttl}</td>
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
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      暂无缓存设置
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
            <Card className="w-full rounded-t-2xl border-0 p-0 h-auto max-h-2/3 overflow-y-auto bg-background animate-in slide-in-from-bottom duration-300">
              {/* 表单头部 */}
              <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">
                  {editingId ? '编辑缓存设置' : '添加缓存设置'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              {/* 表单内容 */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    缓存名称 <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：首页缓存"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    说明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="缓存设置的说明信息"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    匹配规则 <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pattern}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    placeholder="例如：/*.jpg|*.png 或 /api/*"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">支持通配符 * 和 | 分隔多个规则</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    缓存时长(秒)
                  </label>
                  <input
                    type="number"
                    value={formData.ttl}
                    onChange={(e) => setFormData({ ...formData, ttl: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
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
