import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui';
import { generateMockWebsites, Website, OriginIP } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

export default function OriginManagement() {
  const location = useLocation();
  const [websites, setWebsites] = useState<Website[]>(generateMockWebsites());
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(websites[0] || null);

  // 监听路由变化，重新生成数据
  useEffect(() => {
    const newWebsites = generateMockWebsites();
    setWebsites(newWebsites);
    setSelectedWebsite(newWebsites[0] || null);
  }, [location.pathname]);
  const [showAddIPForm, setShowAddIPForm] = useState(false);
  const [newIP, setNewIP] = useState({ ip: '', remark: '' });

  const handleAddOriginIP = () => {
    if (selectedWebsite && newIP.ip.trim()) {
      const updatedWebsites = websites.map(w => {
        if (w.id === selectedWebsite.id && w.originConfig) {
          return {
            ...w,
            originConfig: {
              ...w.originConfig,
              originIPs: [
                ...w.originConfig.originIPs,
                {
                  id: `origin-ip-${Date.now()}`,
                  ip: newIP.ip,
                  remark: newIP.remark,
                  enabled: true,
                },
              ],
            },
          };
        }
        return w;
      });
      setWebsites(updatedWebsites);
      const updated = updatedWebsites.find(w => w.id === selectedWebsite.id);
      if (updated) setSelectedWebsite(updated);
      setNewIP({ ip: '', remark: '' });
      setShowAddIPForm(false);
    }
  };

  const handleDeleteOriginIP = (ipId: string) => {
    if (selectedWebsite && selectedWebsite.originConfig) {
      const updatedWebsites = websites.map(w => {
        if (w.id === selectedWebsite.id && w.originConfig) {
          return {
            ...w,
            originConfig: {
              ...w.originConfig,
              originIPs: w.originConfig.originIPs.filter(ip => ip.id !== ipId),
            },
          };
        }
        return w;
      });
      setWebsites(updatedWebsites);
      const updated = updatedWebsites.find(w => w.id === selectedWebsite.id);
      if (updated) setSelectedWebsite(updated);
    }
  };

  const handleToggleIPEnabled = (ipId: string) => {
    if (selectedWebsite && selectedWebsite.originConfig) {
      const updatedWebsites = websites.map(w => {
        if (w.id === selectedWebsite.id && w.originConfig) {
          return {
            ...w,
            originConfig: {
              ...w.originConfig,
              originIPs: w.originConfig.originIPs.map(ip =>
                ip.id === ipId ? { ...ip, enabled: !ip.enabled } : ip
              ),
            },
          };
        }
        return w;
      });
      setWebsites(updatedWebsites);
      const updated = updatedWebsites.find(w => w.id === selectedWebsite.id);
      if (updated) setSelectedWebsite(updated);
    }
  };

  const breadcrumbs = [
    { label: '首页', href: '/' },
    { label: '网站管理' },
    { label: '回源管理' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} currentPage="回源管理">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">回源管理</h1>

        <div className="grid grid-cols-3 gap-6">
          {/* 网站列表 */}
          <Card className="border border-border overflow-hidden col-span-1">
            <div className="px-6 py-3 border-b border-border font-semibold text-foreground">
              网站列表
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {websites.map(website => (
                <button
                  key={website.id}
                  onClick={() => setSelectedWebsite(website)}
                  className={`w-full text-left px-6 py-3 transition-colors hover:bg-secondary/30 ${
                    selectedWebsite?.id === website.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="font-medium text-foreground">{website.domain}</div>
                  <div className="text-xs text-muted-foreground">{website.cname}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* 回源配置详情 */}
          <div className="col-span-2 space-y-6">
            {selectedWebsite && selectedWebsite.originConfig ? (
              <>
                {/* 基本信息 */}
                <Card className="border border-border p-6 space-y-4">
                  <h2 className="text-lg font-bold text-foreground">{selectedWebsite.domain}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">线路</label>
                      <div className="font-medium text-foreground">{selectedWebsite.lineGroup}</div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">CNAME</label>
                      <div className="font-medium text-foreground text-xs font-mono">{selectedWebsite.cname}</div>
                    </div>
                  </div>
                </Card>

                {/* 回源 IP 列表 */}
                <Card className="border border-border overflow-hidden">
                  <div className="px-6 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">回源 IP ({selectedWebsite.originConfig.originIPs.length})</h3>
                    <Button size="sm" className="gap-2" onClick={() => setShowAddIPForm(true)}>
                      <AddIcon fontSize="small" />
                      添加 IP
                    </Button>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedWebsite.originConfig.originIPs.length > 0 ? (
                      selectedWebsite.originConfig.originIPs.map(ip => (
                        <div key={ip.id} className="px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                          <div className="flex-1">
                            <div className="font-medium text-foreground font-mono">{ip.ip}</div>
                            <div className="text-sm text-muted-foreground">{ip.remark}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={ip.enabled}
                              onChange={() => handleToggleIPEnabled(ip.id)}
                              className="w-4 h-4 cursor-pointer"
                              title={ip.enabled ? '禁用' : '启用'}
                            />
                            <button
                              onClick={() => handleDeleteOriginIP(ip.id)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title="删除"
                            >
                              <DeleteIcon fontSize="small" className="text-red-600"/>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center text-muted-foreground">
                        暂无回源 IP
                      </div>
                    )}
                  </div>
                </Card>

                {/* 重定向配置 */}
                {selectedWebsite.originConfig.redirectEnabled && (
                  <Card className="border border-border p-6 space-y-4">
                    <h3 className="font-semibold text-foreground">重定向配置</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-muted-foreground">重定向地址</label>
                        <div className="font-medium text-foreground break-all">{selectedWebsite.originConfig.redirectUrl}</div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">状态码</label>
                        <div className="font-medium text-foreground">
                          {selectedWebsite.originConfig.redirectStatusCode} ({selectedWebsite.originConfig.redirectStatusCode === 301 ? '永久重定向' : '临时重定向'})
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* 添加 IP 表单 */}
                {showAddIPForm && (
                  <Card className="border border-border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">添加回源 IP</h3>
                      <button
                        onClick={() => {
                          setShowAddIPForm(false);
                          setNewIP({ ip: '', remark: '' });
                        }}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                      >
                        <CloseIcon fontSize="medium" className="text-muted-foreground"/>
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">IP 地址</label>
                        <input
                          type="text"
                          value={newIP.ip}
                          onChange={(e) => setNewIP({ ...newIP, ip: e.target.value })}
                          placeholder="输入 IP 地址"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">备注</label>
                        <input
                          type="text"
                          value={newIP.remark}
                          onChange={(e) => setNewIP({ ...newIP, remark: e.target.value })}
                          placeholder="输入备注（如：主源站、备源站）"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddIPForm(false);
                          setNewIP({ ip: '', remark: '' });
                        }}
                      >
                        取消
                      </Button>
                      <Button onClick={handleAddOriginIP}>添加</Button>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border border-border p-6 text-center text-muted-foreground">
                请选择一个网站查看回源配置
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
