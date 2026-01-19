'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateMockWebsites, Website } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit2, Trash2, Zap, X } from 'lucide-react';

type SortField = 'domain' | 'cname' | 'lineGroup' | 'https' | 'status';
type SortOrder = 'asc' | 'desc';
type ConfigTab = 'origin' | 'redirect' | 'template' | 'https' | 'cache';

interface FormData {
  domain: string;
  lineGroup: string;
  https: boolean;
  originIPs: { ip: string; remark: string }[];
  redirectUrl: string;
  redirectStatusCode: 301 | 302;
  template: string;
  httpsForceRedirect: boolean;
  hstsEnabled: boolean;
  certificateType: 'manual' | 'auto';
  certificateData: string;
  cacheRules: string;
}

export default function Websites() {
  const [websites, setWebsites] = useState<Website[]>(generateMockWebsites());
  const [selectedWebsites, setSelectedWebsites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('domain');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [configTab, setConfigTab] = useState<ConfigTab>('origin');
  const [templatePage, setTemplatePage] = useState(1);
  const [listPage, setListPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState<FormData>({
    domain: '',
    lineGroup: '线路1',
    https: false,
    originIPs: [{ ip: '', remark: '' }],
    redirectUrl: '',
    redirectStatusCode: 301,
    template: '',
    httpsForceRedirect: false,
    hstsEnabled: false,
    certificateType: 'auto',
    certificateData: '',
    cacheRules: '',
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
    setEditingId(null);
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
      httpsForceRedirect: false,
      hstsEnabled: false,
      certificateType: 'auto',
      certificateData: '',
      cacheRules: '',
    });
  };

  const handleAddWebsite = () => {
    if (formData.domain.trim()) {
      if (editingId) {
        // 编辑模式
        setWebsites(websites.map(w => w.id === editingId ? { ...w, domain: formData.domain, lineGroup: formData.lineGroup, https: formData.https } : w));
      } else {
        // 添加模式
        const newWebsite: Website = {
          id: `website-${Date.now()}`,
          domain: formData.domain,
          cname: `cdn-${Date.now()}.example.com`,
          lineGroup: formData.lineGroup,
          https: formData.https,
          status: 'active',
          createdDate: new Date().toLocaleDateString('zh-CN'),
        };
        setWebsites([newWebsite, ...websites]);
      }
      resetForm();
    }
  };

  const handleEditWebsite = (website: Website) => {
    setFormData({
      domain: website.domain,
      lineGroup: website.lineGroup,
      https: website.https,
      originIPs: [{ ip: '', remark: '' }],
      redirectUrl: '',
      redirectStatusCode: 301,
      template: '',
      httpsForceRedirect: false,
      hstsEnabled: false,
      certificateType: 'auto',
      certificateData: '',
      cacheRules: '',
    });
    setEditingId(website.id);
    setShowAddForm(true);
    setConfigTab('origin');
  };

  const handleDeleteWebsite = (websiteId: string) => {
    setWebsites(websites.filter(w => w.id !== websiteId));
  };

  const filteredWebsites = websites.filter(w => {
    const matchesSearch = w.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedWebsites = [...filteredWebsites].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const paginatedWebsites = sortedWebsites.slice((listPage - 1) * itemsPerPage, listPage * itemsPerPage);
  const totalPages = Math.ceil(sortedWebsites.length / itemsPerPage);

  const mockTemplates = [
    { id: '1', name: '标准回源', type: '主源', address: '192.168.1.1' },
    { id: '2', name: '高可用回源', type: '活跃', address: '192.168.1.2' },
    { id: '3', name: '加速回源', type: '备源', address: '192.168.1.3' },
  ];

  const paginatedTemplates = mockTemplates.slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
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
                      checked={selectedWebsites.size === paginatedWebsites.length && paginatedWebsites.length > 0}
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
                {paginatedWebsites.map((website, index) => (
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
                    <td className="px-6 py-3 flex gap-2">
                      <button onClick={() => handleEditWebsite(website)} className="p-1 hover:bg-secondary rounded transition-colors" title="编辑">
                        <Edit2 size={16} className="text-primary" />
                      </button>
                      <button onClick={() => handleDeleteWebsite(website.id)} className="p-1 hover:bg-secondary rounded transition-colors" title="删除">
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{listPage} / {totalPages}</span>
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
        </Card>
      </div>

      {/* H5 风格的表单 - 上滑动画 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 flex items-end z-50 animate-in fade-in duration-200">
          <Card className="w-full rounded-t-2xl border-0 p-0 h-2/3 overflow-y-auto bg-background animate-in slide-in-from-bottom duration-300">
            {/* 表单头部 */}
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">{editingId ? '编辑网站' : '添加网站'}</h2>
              <button onClick={resetForm} className="p-1 hover:bg-secondary rounded transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-6 pb-24 space-y-3" style={{paddingTop: '0px', paddingBottom: '0px'}}>
              {editingId ? (
                // 编辑表单
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">线路组</label>
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
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">域名</label>
                      <input
                        type="text"
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        placeholder="输入域名"
                        className="w-full px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">回源地址</label>
                      <input
                        type="text"
                        placeholder="输入回源地址"
                        className="w-full px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* 编辑表单的 Tab */}
                  <div className="flex gap-2 border-b border-border overflow-x-auto">
                    <button
                      onClick={() => setConfigTab('https')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
                        configTab === 'https'
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      HTTPS配置
                    </button>
                    <button
                      onClick={() => setConfigTab('cache')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
                        configTab === 'cache'
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      缓存规则
                    </button>
                  </div>

                  {/* HTTPS 配置内容 */}
                  {configTab === 'https' && (
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.httpsForceRedirect}
                          onChange={(e) => setFormData({ ...formData, httpsForceRedirect: e.target.checked })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-xs font-medium text-foreground">HTTPS强制跳转</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hstsEnabled}
                          onChange={(e) => setFormData({ ...formData, hstsEnabled: e.target.checked })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-xs font-medium text-foreground">开启HSTS</span>
                      </label>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-foreground">证书配置</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="certificateType"
                              value="manual"
                              checked={formData.certificateType === 'manual'}
                              onChange={(e) => setFormData({ ...formData, certificateType: 'manual' })}
                              className="w-4 h-4"
                            />
                            <span className="text-xs text-foreground">手动</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="certificateType"
                              value="auto"
                              checked={formData.certificateType === 'auto'}
                              onChange={(e) => setFormData({ ...formData, certificateType: 'auto' })}
                              className="w-4 h-4"
                            />
                            <span className="text-xs text-foreground">自动</span>
                          </label>
                        </div>
                      </div>
                      {formData.certificateType === 'manual' && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">证书</label>
                            <textarea
                              value={formData.certificateData}
                              onChange={(e) => setFormData({ ...formData, certificateData: e.target.value })}
                              placeholder="输入证书内容（PEM/CRT 格式）"
                              className="w-full px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">私钥</label>
                            <textarea
                              placeholder="输入私钥内容（KEY 格式）"
                              className="w-full px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 缓存规则内容 */}
                  {configTab === 'cache' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">指定目录</label>
                        <input
                          type="text"
                          placeholder="例如：/api /static"
                          className="w-full px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">指定文件名</label>
                        <input
                          type="text"
                          placeholder="例如：js,png,css,jpg"
                          className="w-full px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">缓存规则</label>
                        <textarea
                          value={formData.cacheRules}
                          onChange={(e) => setFormData({ ...formData, cacheRules: e.target.value })}
                          placeholder="输入缓存规则"
                          className="w-full px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // 添加表单
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">域名</label>
                    <textarea
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="输入域名"
                      className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-6 items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-foreground whitespace-nowrap">线路：</label>
                      <select
                        value={formData.lineGroup}
                        onChange={(e) => setFormData({ ...formData, lineGroup: e.target.value })}
                        className="w-32 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option>线路1</option>
                        <option>线路2</option>
                        <option>线路3</option>
                        <option>线路4</option>
                      </select>
                    </div>
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

                  {/* 配置切换按钮 */}
                  <div className="flex gap-2 border-b border-border overflow-x-auto">
                    <button
                      onClick={() => setConfigTab('origin')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
                        configTab === 'origin'
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      回源配置
                    </button>
                    <button
                      onClick={() => setConfigTab('redirect')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
                        configTab === 'redirect'
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      重定向
                    </button>
                    <button
                      onClick={() => setConfigTab('template')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
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
                    <div className="space-y-3">
                      <div>
                        <button onClick={handleAddOriginIP} className="text-primary text-xs hover:text-primary/80 font-medium">
                          + 添加回源
                        </button>
                      </div>
                      {formData.originIPs.map((ip, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <input
                            type="text"
                            value={ip.ip}
                            onChange={(e) => handleOriginIPChange(index, 'ip', e.target.value)}
                            placeholder="输入 IP 地址"
                            className="flex-1 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="text"
                            value={ip.remark}
                            onChange={(e) => handleOriginIPChange(index, 'remark', e.target.value)}
                            placeholder="备注（如：主源站）"
                            className="flex-1 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            onClick={() => handleRemoveOriginIP(index)}
                            className="p-1 hover:bg-secondary rounded transition-colors"
                          >
                            <X size={16} className="text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 重定向内容 */}
                  {configTab === 'redirect' && (
                    <div className="space-y-3">
                      <div className="flex gap-2 items-end">
                        <input
                          type="text"
                          value={formData.redirectUrl}
                          onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                          placeholder="输入重定向 URL"
                          className="flex-1 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <select
                          value={formData.redirectStatusCode}
                          onChange={(e) => setFormData({ ...formData, redirectStatusCode: parseInt(e.target.value) as 301 | 302 })}
                          className="w-20 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                            <th className="text-left py-2 px-2 font-medium text-foreground w-48">名称</th>
                            <th className="text-left py-2 px-2 font-medium text-foreground w-24">类型</th>
                            <th className="text-left py-2 px-2 font-medium text-foreground">地址</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTemplates.map((group) => (
                            <tr key={group.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                              <td className="py-2 px-2 text-foreground w-48">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="template"
                                    value={group.id}
                                    checked={formData.template === group.id}
                                    onChange={() => setFormData({ ...formData, template: group.id })}
                                    className="w-4 h-4 rounded-full border-border"
                                  />
                                  <span>{group.name}</span>
                                </label>
                              </td>
                              <td className="py-2 px-2 text-muted-foreground w-24">{group.type}</td>
                              <td className="py-2 px-2 text-muted-foreground">{group.address}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setTemplatePage(Math.max(1, templatePage - 1))}
                          disabled={templatePage === 1}
                          className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          上一页
                        </button>
                        <button
                          onClick={() => setTemplatePage(templatePage + 1)}
                          className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-secondary"
                        >
                          下一页
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-border rounded-lg text-foreground text-xs hover:bg-secondary transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddWebsite}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 transition-colors"
              >
                {editingId ? '保存' : '添加'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
