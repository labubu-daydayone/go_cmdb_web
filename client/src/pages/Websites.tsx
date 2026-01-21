'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui';
import { Pagination } from '@/components/Pagination';
import { generateMockWebsites, Website } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Popconfirm } from '@/components/Popconfirm';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CloseIcon from '@mui/icons-material/Close';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ClearIcon from '@mui/icons-material/Clear';
import { useWebsiteUpdates } from '@/hooks/useWebsiteUpdates';
import { Toast, ToastType } from '@/components/Toast';
import { useListParams } from '@/hooks/useUrlParams';

type SortField = 'domain' | 'cname' | 'lineGroup' | 'https' | 'status';
type SortOrder = 'asc' | 'desc';
type ConfigTab = 'https' | 'cache';
type AddFormTab = 'group' | 'redirect' | 'manual';

interface FormData {
  domain: string;
  lineGroup: string;
  https: boolean;
  originIPs: {
    type: 'primary' | 'backup';
    protocol: 'http' | 'https';
    address: string;
    weight: number;
  }[];
  redirectUrl: string;
  redirectStatusCode: 301 | 302;
  template: string;
  httpsForceRedirect: boolean;
  hstsEnabled: boolean;
  certificateType: 'manual' | 'auto';
  certificateData: string;
  privateKeyData: string;
  cacheRules: string;
}

export default function Websites() {
  const [websites, setWebsites] = useState<Website[]>(generateMockWebsites());
  const [wsConnected, setWsConnected] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);

  // WebSocket 回调函数
  const handleAdd = useCallback((website: Website) => {
    console.log('Adding new website:', website);
    setWebsites((prev) => [website, ...prev]);
    setUpdateCount((prev) => prev + 1);
  }, []);

  const handleUpdate = useCallback((websiteId: string, updates: Partial<Website>) => {
    console.log('Updating website:', websiteId, updates);
    setWebsites((prev) =>
      prev.map((w) => (w.id === websiteId ? { ...w, ...updates } : w))
    );
    setUpdateCount((prev) => prev + 1);
  }, []);

  const handleDelete = useCallback((websiteId: string) => {
    console.log('Deleting website:', websiteId);
    setWebsites((prev) => prev.filter((w) => w.id !== websiteId));
    setUpdateCount((prev) => prev + 1);
  }, []);

  const handleConnected = useCallback(() => {
    console.log('WebSocket connected');
    setWsConnected(true);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('WebSocket error:', error);
    setWsConnected(false);
  }, []);

  // 使用 WebSocket Hook
  const { connected } = useWebsiteUpdates({
    onAdd: handleAdd,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    onConnected: handleConnected,
    onError: handleError,
  });

  // 同步连接状态
  useState(() => {
    setWsConnected(connected);
  });
  
  // 使用 URL 参数同步
  const [urlParams, setUrlParams] = useListParams({
    defaultPage: 1,
    defaultPageSize: 15,
    defaultSearch: '',
    defaultFilters: { status: 'all' },
  });
  
  const [selectedWebsites, setSelectedWebsites] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('domain');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [configTab, setConfigTab] = useState<ConfigTab>('https');
  const [addFormTab, setAddFormTab] = useState<AddFormTab>('group');
  const [editFormTab, setEditFormTab] = useState<AddFormTab>('group');
  const [templatePage, setTemplatePage] = useState(1);
  
  const [formData, setFormData] = useState<FormData>({
    domain: '',
    lineGroup: '线路1',
    https: false,
    originIPs: [{ type: 'primary', protocol: 'http', address: '', weight: 10 }],
    redirectUrl: '',
    redirectStatusCode: 301,
    template: '',
    httpsForceRedirect: false,
    hstsEnabled: false,
    certificateType: 'auto',
    certificateData: '',
    privateKeyData: '',
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
      originIPs: [...formData.originIPs, { type: 'primary', protocol: 'http', address: '', weight: 10 }],
    });
  };

  const handleRemoveOriginIP = (index: number) => {
    setFormData({
      ...formData,
      originIPs: formData.originIPs.filter((_, i) => i !== index),
    });
  };

  const handleOriginIPChange = (index: number, field: 'type' | 'protocol' | 'address' | 'weight', value: string | number) => {
    const newIPs = [...formData.originIPs];
    if (field === 'weight') {
      newIPs[index][field] = typeof value === 'number' ? value : parseInt(value) || 1;
    } else {
      newIPs[index][field] = value as any;
    }
    setFormData({ ...formData, originIPs: newIPs });
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setAddFormTab('manual');
    setTemplatePage(1);
    setFormData({
      domain: '',
      lineGroup: '线路1',
      https: false,
      originIPs: [{ type: 'primary', protocol: 'http', address: '', weight: 10 }],
      redirectUrl: '',
      redirectStatusCode: 301,
      template: '',
      httpsForceRedirect: false,
      hstsEnabled: false,
      certificateType: 'auto',
      certificateData: '',
      privateKeyData: '',
      cacheRules: '',
    });
  };

  const handleAddWebsite = () => {
    if (formData.domain.trim()) {
      // 构建 originConfig，根据 tab 类型决定发送哪些字段
      const originConfig: any = {
        id: `origin-config-${Date.now()}`,
        websiteId: editingId || `website-${Date.now()}`,
        redirectEnabled: false,
        redirectUrl: '',
        redirectStatusCode: 301 as 301 | 302,
        createdDate: new Date().toLocaleDateString('zh-CN'),
      };

      // 根据当前tab设置对应的字段
      const currentTab = editingId ? editFormTab : addFormTab;
      
      if (currentTab === 'group') {
        // 使用分组
        originConfig.type = 'template';
        originConfig.template = formData.template;
        originConfig.originIPs = [];
      } else if (currentTab === 'redirect') {
        // 重定向
        originConfig.type = 'redirect';
        originConfig.redirectEnabled = true;
        originConfig.redirectUrl = formData.redirectUrl;
        originConfig.redirectStatusCode = formData.redirectStatusCode;
        originConfig.originIPs = [];
      } else if (currentTab === 'manual') {
        // 手动回源
        originConfig.type = 'origin';
        originConfig.originIPs = formData.originIPs.map((ip, index) => ({
          id: `origin-${Date.now()}-${index}`,
          type: ip.type,
          protocol: ip.protocol,
          address: ip.address,
          weight: ip.weight,
          enabled: true,
        }));
      }

      // 构建 httpsConfig
      const httpsConfig = formData.https ? {
        forceRedirect: formData.httpsForceRedirect,
        hstsEnabled: formData.hstsEnabled,
        certificateType: formData.certificateType,
        certificateData: formData.certificateType === 'manual' ? formData.certificateData : '',
        privateKeyData: formData.certificateType === 'manual' ? formData.privateKeyData : '',
      } : undefined;

      if (editingId) {
        // 编辑模式
        setWebsites(websites.map(w => w.id === editingId ? {
          ...w,
          domain: formData.domain,
          lineGroup: formData.lineGroup,
          https: formData.https,
          originConfig,
          httpsConfig,
          cacheRules: formData.cacheRules || undefined,
        } : w));
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
          originConfig,
          httpsConfig,
          cacheRules: formData.cacheRules || undefined,
        };
        setWebsites([newWebsite, ...websites]);
      }
      resetForm();
    }
  };

  const handleEditWebsite = (website: Website) => {
    // 读取回源配置，如果没有则使用默认值
    const originConfig = website.originConfig || {
      originIPs: [],
      redirectEnabled: false,
      redirectUrl: '',
      redirectStatusCode: 301 as 301 | 302,
    };

    // 读取HTTPS配置，如果没有则使用默认值
    const httpsConfig = website.httpsConfig || {
      forceRedirect: false,
      hstsEnabled: false,
      certificateType: 'auto' as 'manual' | 'auto',
      certificateData: '',
      privateKeyData: '',
    };

    setFormData({
      domain: website.domain,
      lineGroup: website.lineGroup,
      https: website.https,
      // 从 originConfig 中读取回源IP，如果为空则提供一个默认项
      originIPs: originConfig.originIPs.length > 0 
        ? originConfig.originIPs.map(ip => ({ 
            type: ip.type, 
            protocol: ip.protocol, 
            address: ip.address, 
            weight: ip.weight 
          }))
        : [{ type: 'primary', protocol: 'http', address: '', weight: 10 }],
      redirectUrl: originConfig.redirectUrl || '',
      redirectStatusCode: originConfig.redirectStatusCode || 301,
      template: '',
      // 从 httpsConfig 中读取HTTPS配置
      httpsForceRedirect: httpsConfig.forceRedirect,
      hstsEnabled: httpsConfig.hstsEnabled,
      certificateType: httpsConfig.certificateType,
      certificateData: httpsConfig.certificateData || '',
      privateKeyData: httpsConfig.privateKeyData || '',
      // 读取缓存规则
      cacheRules: website.cacheRules || '',
    });
    
    // 根据originConfig.type字段设置tab
    if (originConfig.type === 'redirect') {
      setEditFormTab('redirect');
    } else if (originConfig.type === 'origin') {
      setEditFormTab('manual');
    } else if (originConfig.type === 'template') {
      setEditFormTab('group');
    } else {
      // 如果没有type字段，使用旧逻辑兼容
      if (originConfig.redirectEnabled) {
        setEditFormTab('redirect');
      } else if (originConfig.originIPs && originConfig.originIPs.length > 0) {
        setEditFormTab('manual');
      } else {
        setEditFormTab('group');
      }
    }
    
    setEditingId(website.id);
    setShowAddForm(true);
  };

  const handleDeleteWebsite = (websiteId: string) => {
    setWebsites(websites.filter(w => w.id !== websiteId));
  };

  // 清除缓存对话框状态
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [clearCacheWebsiteId, setClearCacheWebsiteId] = useState<string>('');
  const [clearCacheType, setClearCacheType] = useState<'all' | 'url' | 'directory'>('all');
  const [clearCacheUrl, setClearCacheUrl] = useState('');
  const [clearCacheDirectory, setClearCacheDirectory] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleOpenClearCacheDialog = (websiteId: string) => {
    setClearCacheWebsiteId(websiteId);
    setClearCacheType('all');
    setClearCacheUrl('');
    setClearCacheDirectory('');
    setClearCacheDialogOpen(true);
  };

  const handleClearCache = () => {
    const website = websites.find(w => w.id === clearCacheWebsiteId);
    let message = '';
    
    switch (clearCacheType) {
      case 'all':
        message = `已清除网站 ${website?.domain} 的所有缓存`;
        break;
      case 'url':
        message = `已清除 URL: ${clearCacheUrl} 的缓存`;
        break;
      case 'directory':
        message = `已清除目录: ${clearCacheDirectory} 的缓存`;
        break;
    }
    
    console.log('Clearing cache:', { websiteId: clearCacheWebsiteId, type: clearCacheType, url: clearCacheUrl, directory: clearCacheDirectory });
    // TODO: 调用清除缓存 API
    setToast({ message, type: 'success' });
    setClearCacheDialogOpen(false);
  };

  const handleBatchClearCache = () => {
    console.log('Batch clearing cache for websites:', Array.from(selectedWebsites));
    // TODO: 调用批量清除缓存 API
    setToast({ message: `已清除 ${selectedWebsites.size} 个网站的缓存`, type: 'success' });
    setSelectedWebsites(new Set());
  };

  const filteredWebsites = websites.filter(w => {
    const matchesSearch = w.domain.toLowerCase().includes(urlParams.search.toLowerCase());
    const matchesStatus = urlParams.status === 'all' || w.status === urlParams.status;
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

  const startIndex = (urlParams.page - 1) * urlParams.pageSize;
  const endIndex = startIndex + urlParams.pageSize;
  const paginatedWebsites = sortedWebsites.slice(startIndex, endIndex);

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">网站列表</h1>
              {/* WebSocket 连接状态指示器 */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/30">
                {wsConnected ? (
                  <>
                    <WifiIcon fontSize="small" className="text-green-600"/>
                    <span className="text-xs text-green-600 font-medium">实时连接</span>
                  </>
                ) : (
                  <>
                    <WifiOffIcon fontSize="small" className="text-gray-400"/>
                    <span className="text-xs text-gray-400 font-medium">离线</span>
                  </>
                )}
              </div>
              {/* 更新计数 */}
              {updateCount > 0 && (
                <div className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {updateCount} 次更新
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Popconfirm
              title="确认批量清除缓存？"
              description={`将清除 ${selectedWebsites.size} 个网站的缓存，是否继续？`}
              onConfirm={handleBatchClearCache}
            >
              <Button
                variant="outline"
                disabled={selectedWebsites.size === 0}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                批量清除缓存 ({selectedWebsites.size})
              </Button>
            </Popconfirm>
            <Button onClick={() => setShowAddForm(true)}>添加网站</Button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex gap-4">
          <input
            type="text"
            value={urlParams.search}
            onChange={(e) => setUrlParams({ search: e.target.value })}
            placeholder="搜索域名..."
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={urlParams.status}
            onChange={(e) => setUrlParams({ status: e.target.value })}
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
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="w-12 px-2 py-3 text-center">
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
                    <td className="w-12 px-2 py-3 text-center">
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
                        <EditIcon fontSize="small" className="text-primary"/>
                      </button>
                      <button 
                        className="p-1 hover:bg-secondary rounded transition-colors" 
                        title="清除缓存"
                        onClick={() => handleOpenClearCacheDialog(website.id)}
                      >
                        <ClearIcon fontSize="small" className="text-orange-600"/>
                      </button>
                      <Popconfirm
                        title="确认删除？"
                        description="删除后无法恢复，是否继续？"
                        onConfirm={() => handleDeleteWebsite(website.id)}
                      >
                        <button className="p-1 hover:bg-secondary rounded transition-colors" title="删除">
                          <DeleteIcon fontSize="small" className="text-destructive"/>
                        </button>
                      </Popconfirm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <Pagination
            current={urlParams.page}
            total={sortedWebsites.length}
            pageSize={urlParams.pageSize}
            showSizeChanger
            onChange={(page, size) => {
              setUrlParams({ page, pageSize: size });
            }}
          />
        </Card>
      </div>

      {/* H5 风格的表单 - 上滑动画 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50" onClick={resetForm}>
          <Card className="w-[800px] h-full rounded-none border-0 p-0 flex flex-col bg-background" onClick={(e) => e.stopPropagation()}>
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{editingId ? '编辑网站' : '添加网站'}</h2>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            {/* 可滚动内容区域 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {editingId ? (
                // 编辑表单
                <div className="space-y-3">
                  {/* 第一排：域名 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-foreground w-16 flex-shrink-0">域名：</label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="输入域名"
                      className="flex-1 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  {/* 线路配置和缓存规则 */}
                  <div className="flex items-center gap-4">
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
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-foreground whitespace-nowrap">缓存规则：</label>
                      <select
                        value={formData.cacheRules}
                        onChange={(e) => setFormData({ ...formData, cacheRules: e.target.value })}
                        className="w-40 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- 请选择缓存规则 --</option>
                        <option value="首页缓存">首页缓存</option>
                        <option value="图片缓存">图片缓存</option>
                        <option value="API缓存">API缓存</option>
                      </select>
                    </div>
                  </div>

                  {/* HTTPS配置 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.https}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setFormData({ 
                              ...formData, 
                              https: enabled,
                              // 如果禁用HTTPS，同时禁用强制跳转和HSTS
                              httpsForceRedirect: enabled ? formData.httpsForceRedirect : false,
                              hstsEnabled: enabled ? formData.hstsEnabled : false
                            });
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-xs font-medium text-foreground">启用HTTPS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.httpsForceRedirect}
                          onChange={(e) => setFormData({ ...formData, httpsForceRedirect: e.target.checked })}
                          disabled={!formData.https}
                          className="w-4 h-4 rounded border-border disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className={`text-xs font-medium ${formData.https ? 'text-foreground' : 'text-muted-foreground'}`}>HTTPS强制跳转</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hstsEnabled}
                          onChange={(e) => setFormData({ ...formData, hstsEnabled: e.target.checked })}
                          disabled={!formData.https}
                          className="w-4 h-4 rounded border-border disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className={`text-xs font-medium ${formData.https ? 'text-foreground' : 'text-muted-foreground'}`}>HSTS</span>
                      </label>
                    </div>
                  </div>

                   {/* 回源配置标题 */}
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-foreground">回源配置</h3>
                  </div>
                  {/* 配置切换按钮 */}
                  <div className="flex gap-2 border-b border-border overflow-x-auto">
                    <button
                      onClick={() => setEditFormTab('group')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
                        editFormTab === 'group'
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      使用分组
                    </button>
                    <button
                      onClick={() => setEditFormTab('redirect')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
                        editFormTab === 'redirect'
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      重定向
                    </button>
                    <button
                      onClick={() => setEditFormTab('manual')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
                        editFormTab === 'manual'
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      手动回源
                    </button>
                  </div>
                  {/* 使用分组内容 */}
                  {editFormTab === 'group' && (
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
                                    name="editTemplate"
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

                  {/* 重定向内容 */}
                  {editFormTab === 'redirect' && (
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

                  {/* 回源配置内容 */}
                  {editFormTab === 'manual' && (
                    <div className="space-y-3">
                      <div>
                        <button onClick={handleAddOriginIP} className="text-primary text-xs hover:text-primary/80 font-medium">
                          + 添加回源
                        </button>
                      </div>
                      {formData.originIPs.map((ip, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <select
                            value={ip.type}
                            onChange={(e) => handleOriginIPChange(index, 'type', e.target.value)}
                            className="w-24 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="primary">主源</option>
                            <option value="backup">备源</option>
                          </select>
                          <select
                            value={ip.protocol}
                            onChange={(e) => handleOriginIPChange(index, 'protocol', e.target.value)}
                            className="w-24 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="http">HTTP</option>
                            <option value="https">HTTPS</option>
                          </select>
                          <input
                            type="text"
                            value={ip.address}
                            onChange={(e) => handleOriginIPChange(index, 'address', e.target.value)}
                            placeholder="地址 (如: 8.8.8.8:80)"
                            className="flex-1 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="number"
                            value={ip.weight}
                            onChange={(e) => handleOriginIPChange(index, 'weight', e.target.value)}
                            placeholder="权重"
                            min="1"
                            className="w-20 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            onClick={() => handleRemoveOriginIP(index)}
                            className="p-1 hover:bg-secondary rounded transition-colors"
                          >
                            <CloseIcon fontSize="small" className="text-destructive"/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 证书配置 */}
                  <div className="space-y-3">
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
                  {/* 线路配置和缓存规则 */}
                  <div className="flex items-center gap-4">
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
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-foreground whitespace-nowrap">缓存规则：</label>
                      <select
                        value={formData.cacheRules}
                        onChange={(e) => setFormData({ ...formData, cacheRules: e.target.value })}
                        className="w-40 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- 请选择缓存规则 --</option>
                        <option value="首页缓存">首页缓存</option>
                        <option value="图片缓存">图片缓存</option>
                        <option value="API缓存">API缓存</option>
                      </select>
                    </div>
                  </div>

                  {/* HTTPS配置 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.https}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setFormData({ 
                              ...formData, 
                              https: enabled,
                              // 如果禁用HTTPS，同时禁用强制跳转和HSTS
                              httpsForceRedirect: enabled ? formData.httpsForceRedirect : false,
                              hstsEnabled: enabled ? formData.hstsEnabled : false
                            });
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-xs font-medium text-foreground">启用HTTPS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.httpsForceRedirect}
                          onChange={(e) => setFormData({ ...formData, httpsForceRedirect: e.target.checked })}
                          disabled={!formData.https}
                          className="w-4 h-4 rounded border-border disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className={`text-xs font-medium ${formData.https ? 'text-foreground' : 'text-muted-foreground'}`}>HTTPS强制跳转</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hstsEnabled}
                          onChange={(e) => setFormData({ ...formData, hstsEnabled: e.target.checked })}
                          disabled={!formData.https}
                          className="w-4 h-4 rounded border-border disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className={`text-xs font-medium ${formData.https ? 'text-foreground' : 'text-muted-foreground'}`}>HSTS</span>
                      </label>
                    </div>
                  </div>

                   {/* 回源配置标题 */}
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-foreground">回源配置</h3>
                  </div>
                  {/* 配置切换按钮 */}
                  <div className="flex gap-2 border-b border-border overflow-x-auto">
                    <button
                      onClick={() => setAddFormTab('group')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
                        addFormTab === 'group'
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      使用分组
                    </button>
                    <button
                      onClick={() => setAddFormTab('redirect')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
                        addFormTab === 'redirect'
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      重定向
                    </button>
                    <button
                      onClick={() => setAddFormTab('manual')}
                      className={`flex-1 px-4 py-2 font-medium text-center text-xs transition-colors border-b-2 whitespace-nowrap ${
                        addFormTab === 'manual'
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      手动回源
                    </button>
                  </div>
                  {/* 使用分组内容 */}
                  {addFormTab === 'group' && (
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

                  {/* 重定向内容 */}
                  {addFormTab === 'redirect' && (
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

                  {/* 回源配置内容 */}
                  {addFormTab === 'manual' && (
                    <div className="space-y-3">
                      <div>
                        <button onClick={handleAddOriginIP} className="text-primary text-xs hover:text-primary/80 font-medium">
                          + 添加回源
                        </button>
                      </div>
                      {formData.originIPs.map((ip, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <select
                            value={ip.type}
                            onChange={(e) => handleOriginIPChange(index, 'type', e.target.value)}
                            className="w-24 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="primary">主源</option>
                            <option value="backup">备源</option>
                          </select>
                          <select
                            value={ip.protocol}
                            onChange={(e) => handleOriginIPChange(index, 'protocol', e.target.value)}
                            className="w-24 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="http">HTTP</option>
                            <option value="https">HTTPS</option>
                          </select>
                          <input
                            type="text"
                            value={ip.address}
                            onChange={(e) => handleOriginIPChange(index, 'address', e.target.value)}
                            placeholder="地址 (如: 8.8.8.8:80)"
                            className="flex-1 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="number"
                            value={ip.weight}
                            onChange={(e) => handleOriginIPChange(index, 'weight', e.target.value)}
                            placeholder="权重"
                            min="1"
                            className="w-20 px-2 py-1 border border-border rounded-lg bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            onClick={() => handleRemoveOriginIP(index)}
                            className="p-1 hover:bg-secondary rounded transition-colors"
                          >
                            <CloseIcon fontSize="small" className="text-destructive"/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 底部按钮栏 */}
            <div className="border-t border-border p-6 pt-4 flex gap-2 justify-end bg-background">
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

      {/* 清除缓存对话框 */}
      {clearCacheDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">清除缓存</h3>
              <button onClick={() => setClearCacheDialogOpen(false)} className="p-1 hover:bg-secondary rounded transition-colors">
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 清除类型选择 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  清除类型
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="clearCacheType"
                      value="all"
                      checked={clearCacheType === 'all'}
                      onChange={(e) => setClearCacheType(e.target.value as 'all' | 'url' | 'directory')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">清除所有缓存</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="clearCacheType"
                      value="url"
                      checked={clearCacheType === 'url'}
                      onChange={(e) => setClearCacheType(e.target.value as 'all' | 'url' | 'directory')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">指定 URL 清除</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="clearCacheType"
                      value="directory"
                      checked={clearCacheType === 'directory'}
                      onChange={(e) => setClearCacheType(e.target.value as 'all' | 'url' | 'directory')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">清除目录</span>
                  </label>
                </div>
              </div>

              {/* URL 输入框 */}
              {clearCacheType === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    URL 地址
                  </label>
                  <input
                    type="text"
                    value={clearCacheUrl}
                    onChange={(e) => setClearCacheUrl(e.target.value)}
                    placeholder="例如: https://example.com/path/to/file.html"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* 目录输入框 */}
              {clearCacheType === 'directory' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    目录路径
                  </label>
                  <input
                    type="text"
                    value={clearCacheDirectory}
                    onChange={(e) => setClearCacheDirectory(e.target.value)}
                    placeholder="例如: /images/ 或 /static/"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* 提示信息 */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  {clearCacheType === 'all' && '将清除该网站的所有缓存，需要重新生成。'}
                  {clearCacheType === 'url' && '将清除指定 URL 的缓存。'}
                  {clearCacheType === 'directory' && '将清除指定目录下的所有缓存。'}
                </p>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setClearCacheDialogOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearCache}
                disabled={(
                  (clearCacheType === 'url' && !clearCacheUrl) ||
                  (clearCacheType === 'directory' && !clearCacheDirectory)
                )}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认清除
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
    </DashboardLayout>
  );
}
