import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateMockWebsites, Website } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit2, Trash2, Zap, X } from 'lucide-react';

type SortField = 'domain' | 'cname' | 'lineGroup' | 'https' | 'status';
type SortOrder = 'asc' | 'desc';
type ConfigTab = 'origin' | 'redirect' | 'template';

export default function Websites() {
  const [websites, setWebsites] = useState<Website[]>(generateMockWebsites());
  const [selectedWebsites, setSelectedWebsites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('domain');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [configTab, setConfigTab] = useState<ConfigTab>('origin');
  const [templatePage, setTemplatePage] = useState(1);
  const [formData, setFormData] = useState({
    domain: '',
    lineGroup: '线路1',
    https: false,
    originIPs: [{ ip: '', remark: '' }],
    redirectUrl: '',
    redirectStatusCode: 301 as 301 | 302,
    template: '',
  });

  const handleSelectWebsite = (websiteId: string) => {
    const newSelected = new Set(selectedWebsites);
    if (newSelected.has(websiteId)) {
      newSelected.delete(websiteId);
    } else {
      newSelected.add(websiteId);
    }
    setSelectedWebsites(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedWebsites.size === filteredWebsites.length) {
      setSelectedWebsites(new Set());
    } else {
      setSelectedWebsites(new Set(filteredWebsites.map(w => w.id)));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAddOriginIP = () => {
    setFormData({
      ...formData,
      originIPs: [...formData.originIPs, { ip: '', remark: '' }],
    });
  };

  const handleRemoveOriginIP = (index: number) => {
    setFormData({
      ...formData,
      originIPs: formData.originIPs.filter((_, i) => i !== index),
    });
  };

  const handleOriginIPChange = (index: number, field: 'ip' | 'remark', value: string) => {
    const newIPs = [...formData.originIPs];
    newIPs[index][field] = value;
    setFormData({ ...formData, originIPs: newIPs });
  };

  const resetForm = () => {
    setShowAddForm(false);
    setConfigTab('origin');
    setTemplatePage(1);
    setFormData({
      domain: '',
      lineGroup: '线路1',
      https: false,
      originIPs: [{ ip: '', remark: '' }],
      redirectUrl: '',
      redirectStatusCode: 301,
      template: '',
    });
  };

  const handleAddWebsite = () => {
    if (formData.domain.trim()) {
      const newWebsite: Website = {
        id: `website-${Date.now()}`,
        domain: formData.domain,
        cname: `cdn-${Date.now()}.example.com`,
        lineGroup: formData.lineGroup,
        https: formData.https,
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0],
      };
      setWebsites([...websites, newWebsite]);
      resetForm();
    }
  };

  const handleDeleteWebsite = (websiteId: string) => {
    setWebsites(websites.filter(w => w.id !== websiteId));
    setSelectedWebsites(new Set(Array.from(selectedWebsites).filter(id => id !== websiteId)));
  };

  const filteredWebsites = websites
    .filter(w => w.domain.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(w => filterStatus === 'all' || w.status === filterStatus)
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // 分页数据
  const templatesData = [
    { id: '1', name: '标准回源', type: '主源', address: '192.168.1.1' },
    { id: '2', name: '高可用回源', type: '活跃', address: '192.168.1.2' },
    { id: '3', name: '加速回源', type: '备源', address: '192.168.1.3' },
    { id: '4', name: '备用回源', type: '备源', address: '192.168.1.4' },
    { id: '5', name: '灾备回源', type: '备源', address: '192.168.1.5' },
    { id: '6', name: '跨域回源', type: '活跃', address: '192.168.1.6' },
  ];
  const itemsPerPage = 3;
  const totalPages = Math.ceil(templatesData.length / itemsPerPage);
  const paginatedTemplates = templatesData.slice(
    (templatePage - 1) * itemsPerPage,
    templatePage * itemsPerPage
  );

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: '网站管理' },
        { label: '网站列表' },
      ]}
      currentPage="网站列表"
    >
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">网站列表</h1>
            <p className="text-sm text-muted-foreground mt-1">共 {websites.length} 个</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>添加网站</Button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索域名..."
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">非活跃</option>
          </select>
        </div>

        {/* 网站列表表格 */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedWebsites.size === filteredWebsites.length && filteredWebsites.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-secondary/50"
                    onClick={() => handleSort('domain')}
                  >
                    域名 {sortField === 'domain' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-secondary/50"
                    onClick={() => handleSort('cname')}
                  >
                    CNAME {sortField === 'cname' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-secondary/50"
                    onClick={() => handleSort('lineGroup')}
                  >
                    线路 {sortField === 'lineGroup' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-secondary/50"
                    onClick={() => handleSort('https')}
                  >
                    HTTPS {sortField === 'https' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-secondary/50"
                    onClick={() => handleSort('status')}
                  >
                    状态 {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredWebsites.map((website, index) => (
                  <tr
                    key={website.id}
                    className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                      selectedWebsites.has(website.id) ? 'bg-primary/10' : index % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                    }`}
                  >
                    <td className="px-6 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedWebsites.has(website.id)}
                        onChange={() => handleSelectWebsite(website.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-3 font-medium text-foreground">{website.domain}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs font-mono">{website.cname}</td>
                    <td className="px-6 py-3 text-muted-foreground">{website.lineGroup}</td>
                    <td className="px-6 py-3">
                      {website.https ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">有效</span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">无</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {website.status === 'active' ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">活跃</span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">非活跃</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-secondary rounded transition-colors" title="编辑">
                          <Edit2 size={16} className="text-muted-foreground" />
                        </button>
                        <button className="p-1 hover:bg-secondary rounded transition-colors" title="清除缓存">
                          <Zap size={16} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteWebsite(website.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* H5 风格的表单 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/30 flex items-end z-50">
            <Card className="w-full rounded-t-2xl border-0 p-0 h-2/3 overflow-y-auto bg-background/80">
              {/* 表单头部 */}
              <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">添加网站</h2>
                <button onClick={resetForm} className="p-1 hover:bg-secondary rounded transition-colors">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              {/* 表单内容 */}
              <div className="p-6 space-y-6 pb-24">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">域名</label>
                    <textarea
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="输入域名"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-2">线路</label>
                      <select
                        value={formData.lineGroup}
                        onChange={(e) => setFormData({ ...formData, lineGroup: e.target.value })}
                        className="w-full px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option>线路1</option>
                        <option>线路2</option>
                        <option>线路3</option>
                        <option>线路4</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.https}
                          onChange={(e) => setFormData({ ...formData, https: e.target.checked })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-xs font-medium text-foreground">HTTPS</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 配置切换按钮 */}
                <div className="flex gap-2 border-b border-border">
                  <button
                    onClick={() => setConfigTab('origin')}
                    className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 ${
                      configTab === 'origin'
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    回源配置
                  </button>
                  <button
                    onClick={() => setConfigTab('redirect')}
                    className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 ${
                      configTab === 'redirect'
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    重定向
                  </button>
                  <button
                    onClick={() => setConfigTab('template')}
                    className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 ${
                      configTab === 'template'
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    使用分组
                  </button>
                </div>

                {/* 回源配置内容 */}
                {configTab === 'origin' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-foreground">添加回源</label>
                      <button
                        onClick={handleAddOriginIP}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Plus size={14} />
                        添加回源
                      </button>
                    </div>
                    {formData.originIPs.map((ip, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={ip.ip}
                            onChange={(e) => handleOriginIPChange(index, 'ip', e.target.value)}
                            placeholder="输入 IP 地址"
                            className="flex-1 px-3 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="text"
                            value={ip.remark}
                            onChange={(e) => handleOriginIPChange(index, 'remark', e.target.value)}
                            placeholder="备注（如：主源站）"
                            className="flex-1 px-3 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          {formData.originIPs.length > 1 && (
                            <button
                              onClick={() => handleRemoveOriginIP(index)}
                              className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-xs"
                            >
                              删除
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 重定向配置内容 */}
                {configTab === 'redirect' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.redirectUrl}
                        onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                        placeholder="输入重定向 URL"
                        className="flex-1 px-3 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <select
                        value={formData.redirectStatusCode}
                        onChange={(e) => setFormData({ ...formData, redirectStatusCode: parseInt(e.target.value) as 301 | 302 })}
                        className="px-3 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value={301}>301</option>
                        <option value={302}>302</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 使用分组内容 */}
                {configTab === 'template' && (
                  <div className="space-y-3">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-medium text-foreground">名称</th>
                          <th className="text-left py-2 px-2 font-medium text-foreground">类型</th>
                          <th className="text-left py-2 px-2 font-medium text-foreground">地址</th>
                          <th className="text-left py-2 px-2 font-medium text-foreground">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTemplates.map((group) => (
                          <tr
                            key={group.id}
                            className="border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                            onClick={() => setFormData({ ...formData, template: group.id })}
                          >
                            <td className="py-2 px-2 text-foreground">{group.name}</td>
                            <td className="py-2 px-2 text-muted-foreground">{group.type}</td>
                            <td className="py-2 px-2 text-muted-foreground">{group.address}</td>
                            <td className="py-2 px-2">
                              <button className="text-primary text-xs hover:text-primary/80">使用</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* 分页 */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => setTemplatePage(Math.max(1, templatePage - 1))}
                        disabled={templatePage === 1}
                        className="px-2 py-1 text-xs border border-border rounded hover:bg-secondary disabled:opacity-50"
                      >
                        上一页
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {templatePage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setTemplatePage(Math.min(totalPages, templatePage + 1))}
                        disabled={templatePage === totalPages}
                        className="px-2 py-1 text-xs border border-border rounded hover:bg-secondary disabled:opacity-50"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 底部按钮 */}
              <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm} className="text-sm">
                  取消
                </Button>
                <Button onClick={handleAddWebsite} className="text-sm">添加</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
