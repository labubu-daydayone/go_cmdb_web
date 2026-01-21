/**
 * CMDB 仪表板页面 - Material UI 版本
 * 显示关键指标、统计信息和系统状态
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '@/components/mui/Card';
import { generateMockServers, generateTimeSeriesData } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StorageIcon from '@mui/icons-material/Storage';

export default function Dashboard() {
  const location = useLocation();
  const [stats] = useState({
    totalDomains: 10,
    activeDomains: 8,
    expiringDomains: 2,
    sslWarnings: 1,
  });
  const [servers, setServers] = useState(generateMockServers());
  const [timeSeriesData, setTimeSeriesData] = useState(generateTimeSeriesData(30));

  // 监听路由变化，重新生成数据
  useEffect(() => {
    setServers(generateMockServers());
    setTimeSeriesData(generateTimeSeriesData(30));
  }, [location.pathname]);
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());

  const handleSelectServer = (serverId: string) => {
    const newSelected = new Set(selectedServers);
    if (newSelected.has(serverId)) {
      newSelected.delete(serverId);
    } else {
      newSelected.add(serverId);
    }
    setSelectedServers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedServers.size === servers.length) {
      setSelectedServers(new Set());
    } else {
      setSelectedServers(new Set(servers.map(s => s.id)));
    }
  };

  const onlineServers = servers.filter(s => s.status === 'online').length;
  const offlineServers = servers.filter(s => s.status === 'offline').length;
  const maintenanceServers = servers.filter(s => s.status === 'maintenance').length;

  const serverStatusData = [
    { name: '在线', value: onlineServers, color: '#10B981' },
    { name: '离线', value: offlineServers, color: '#EF4444' },
    { name: '维护中', value: maintenanceServers, color: '#F59E0B' },
  ];

  return (
    <DashboardLayout currentPage="仪表板">
      <div className="space-y-6">
        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 总域名数 */}
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">总域名数</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalDomains}</p>
                <p className="text-xs text-muted-foreground mt-2">已配置的域名</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-xl">🌐</span>
              </div>
            </div>
          </Card>

          {/* 活跃域名 */}
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">活跃域名</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeDomains}</p>
                <p className="text-xs text-muted-foreground mt-2">正常运行中</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon fontSize="medium" className="text-green-600"/>
              </div>
            </div>
          </Card>

          {/* 即将过期 */}
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">即将过期</p>
                <p className="text-3xl font-bold text-amber-600">{stats.expiringDomains}</p>
                <p className="text-xs text-muted-foreground mt-2">30天内过期</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <ScheduleIcon fontSize="medium" className="text-amber-600"/>
              </div>
            </div>
          </Card>

          {/* SSL 警告 */}
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">SSL 警告</p>
                <p className="text-3xl font-bold text-red-600">{stats.sslWarnings}</p>
                <p className="text-xs text-muted-foreground mt-2">需要处理</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ErrorOutlineIcon fontSize="medium" className="text-red-600"/>
              </div>
            </div>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 请求趋势 */}
          <Card className="col-span-1 lg:col-span-2 p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">请求趋势（30天）</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#2563EB" 
                  name="请求数"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="errors" 
                  stroke="#EF4444" 
                  name="错误数"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* 服务器状态 */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">服务器状态</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serverStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serverStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* 服务器列表 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">服务器列表</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-auto text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-center py-3 px-4 font-semibold text-foreground w-12">
                    <input
                      type="checkbox"
                      checked={selectedServers.size === servers.length && servers.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">服务器名称</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">IP 地址</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">状态</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">CPU</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">内存</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">磁盘</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">操作系统</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server, index) => (
                  <tr 
                    key={server.id} 
                    className={`border-b border-border hover:bg-secondary/50 transition-colors ${
                      selectedServers.has(server.id) ? 'bg-primary/10' : index % 2 === 0 ? 'bg-background' : 'bg-secondary/20'
                    }`}
                  >
                    <td className="text-center py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedServers.has(server.id)}
                        onChange={() => handleSelectServer(server.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{server.name}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{server.ip}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        server.status === 'online' 
                          ? 'bg-green-100 text-green-700'
                          : server.status === 'offline'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          server.status === 'online' 
                            ? 'bg-green-600'
                            : server.status === 'offline'
                            ? 'bg-red-600'
                            : 'bg-amber-600'
                        }`} />
                        {server.status === 'online' ? '在线' : server.status === 'offline' ? '离线' : '维护中'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${server.cpu}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{server.cpu}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${server.memory}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{server.memory}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${server.disk}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{server.disk}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{server.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
