import { useState } from 'react';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui';
import { Pagination } from '@/components/Pagination';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { Popconfirm } from '@/components/Popconfirm';
import { Toast, ToastType } from '@/components/Toast';

interface ApiKey {
  id: string;
  name: string;
  account: string;
  accountType: string;
  apiKey: string;
  createdAt: string;
}

const generateMockApiKeys = (): ApiKey[] => {
  const accountTypes = ['cloudflare', 'aws', 'aliyun', 'tencent'];
  return Array.from({ length: 15 }, (_, i) => ({
    id: `key-${i + 1}`,
    name: `API密钥 ${i + 1}`,
    account: `account${i + 1}@example.com`,
    accountType: accountTypes[i % accountTypes.length],
    apiKey: `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));
};

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(generateMockApiKeys());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    account: '',
    accountType: 'cloudflare',
    apiKey: ''
  });

  const itemsPerPage = 10;

  const filteredKeys = apiKeys.filter(key =>
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.accountType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredKeys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedKeys = filteredKeys.slice(startIndex, startIndex + itemsPerPage);

  const handleAddKey = () => {
    setShowAddForm(true);
    setEditingKeyId(null);
    setFormData({
      name: '',
      account: '',
      accountType: 'cloudflare',
      apiKey: ''
    });
  };

  const handleEditKey = (key: ApiKey) => {
    setShowAddForm(true);
    setEditingKeyId(key.id);
    setFormData({
      name: key.name,
      account: key.account,
      accountType: key.accountType,
      apiKey: key.apiKey
    });
  };

  const handleSubmit = () => {
    if (editingKeyId) {
      setApiKeys(apiKeys.map(k => 
        k.id === editingKeyId 
          ? { ...k, ...formData }
          : k
      ));
      setToast({ message: '密钥更新成功', type: 'success' });
    } else {
      const newKey: ApiKey = {
        id: `key-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setApiKeys([newKey, ...apiKeys]);
      setToast({ message: '密钥添加成功', type: 'success' });
    }
    setShowAddForm(false);
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== keyId));
    setToast({ message: '密钥删除成功', type: 'success' });
  };

  const handleCopyKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setToast({ message: '密钥已复制到剪贴板', type: 'success' });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">密钥管理</h1>
          <Button
            onClick={handleAddKey}
            className="flex items-center gap-2"
          >
            <AddIcon fontSize="small" />
            添加密钥
          </Button>
        </div>

        {/* 搜索栏 */}
        <Card className="p-4">
          <input
            type="text"
            placeholder="搜索名称、账号或类型..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Card>

        {/* 密钥列表 */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">名称</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">账号</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">账号类型</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">密钥</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">创建时间</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-secondary/10">
                    <td className="px-4 py-3 text-foreground">{key.name}</td>
                    <td className="px-4 py-3 text-foreground">{key.account}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {key.accountType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-secondary px-2 py-1 rounded">
                          {maskApiKey(key.apiKey)}
                        </code>
                        <button
                          onClick={() => handleCopyKey(key.apiKey)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          title="复制密钥"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{key.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditKey(key)}
                          className="p-2 hover:bg-secondary rounded transition-colors"
                          title="编辑"
                        >
                          <EditIcon fontSize="small" />
                        </button>
                        <Popconfirm
                          title="确认删除"
                          description="确定要删除这个密钥吗？"
                          onConfirm={() => handleDeleteKey(key.id)}
                        >
                          <button
                            className="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors"
                            title="删除"
                          >
                            <DeleteIcon fontSize="small" />
                          </button>
                        </Popconfirm>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="border-t border-border p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </Card>

        {/* 添加/编辑表单 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">
                  {editingKeyId ? '编辑密钥' : '添加密钥'}
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="请输入密钥名称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    账号
                  </label>
                  <input
                    type="text"
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="请输入账号"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    运营商类型
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="cloudflare">Cloudflare</option>
                    <option value="aws">AWS</option>
                    <option value="aliyun">阿里云</option>
                    <option value="tencent">腾讯云</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    API密钥
                  </label>
                  <input
                    type="text"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-ring font-mono text-xs"
                    placeholder="请输入API密钥"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.account || !formData.apiKey}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingKeyId ? '保存' : '添加'}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Toast 通知 */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
