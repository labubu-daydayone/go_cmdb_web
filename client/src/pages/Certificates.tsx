import { useState } from 'react';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui';
import { Pagination } from '@/components/Pagination';
import DashboardLayout from '@/components/DashboardLayout';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { Popconfirm } from '@/components/Popconfirm';
import { Toast, ToastType } from '@/components/Toast';

interface Certificate {
  id: string;
  domain: string;
  status: 'valid' | 'expiring' | 'expired';
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

const generateMockCertificates = (): Certificate[] => {
  const domains = [
    'example.com', 'api.example.com', 'www.example.com', 'cdn.example.com',
    'blog.example.com', 'shop.example.com', 'admin.example.com', 'test.example.com',
    'staging.example.com', 'dev.example.com', 'app.example.com', 'mobile.example.com'
  ];
  
  return domains.map((domain, i) => {
    const daysUntilExpiry = Math.floor(Math.random() * 365);
    const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);
    const createdDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const updatedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    let status: 'valid' | 'expiring' | 'expired';
    if (daysUntilExpiry < 0) {
      status = 'expired';
    } else if (daysUntilExpiry < 30) {
      status = 'expiring';
    } else {
      status = 'valid';
    }
    
    return {
      id: `cert-${i + 1}`,
      domain,
      status,
      expiryDate: expiryDate.toISOString().split('T')[0],
      createdAt: createdDate.toISOString().split('T')[0],
      updatedAt: updatedDate.toISOString().split('T')[0]
    };
  });
};

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>(generateMockCertificates());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const itemsPerPage = 10;

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCertificates = filteredCertificates.slice(startIndex, startIndex + itemsPerPage);

  const handleUpdateCertificate = (certId: string) => {
    const cert = certificates.find(c => c.id === certId);
    if (cert) {
      const updatedCert = {
        ...cert,
        updatedAt: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'valid' as const
      };
      setCertificates(certificates.map(c => c.id === certId ? updatedCert : c));
      setToast({ message: `证书 ${cert.domain} 已更新`, type: 'success' });
    }
  };

  const handleDeleteCertificate = (certId: string) => {
    const cert = certificates.find(c => c.id === certId);
    setCertificates(certificates.filter(c => c.id !== certId));
    setToast({ message: `证书 ${cert?.domain} 已删除`, type: 'success' });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      valid: { bg: 'bg-green-100', text: 'text-green-800', label: '有效' },
      expiring: { bg: 'bg-orange-100', text: 'text-orange-800', label: '即将过期' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', label: '已过期' }
    };
    const badge = badges[status as keyof typeof badges] || badges.valid;
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} rounded text-xs`}>
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">证书管理</h1>
        </div>

        {/* 搜索和筛选 */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="搜索域名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">全部状态</option>
              <option value="valid">有效</option>
              <option value="expiring">即将过期</option>
              <option value="expired">已过期</option>
            </select>
          </div>
        </Card>

        {/* 证书列表 */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">域名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">证书状态</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">过期时间</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">创建时间</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">更新时间</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-secondary/10">
                    <td className="px-4 py-3 text-foreground font-medium">{cert.domain}</td>
                    <td className="px-4 py-3">{getStatusBadge(cert.status)}</td>
                    <td className="px-4 py-3 text-foreground">{cert.expiryDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cert.createdAt}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cert.updatedAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateCertificate(cert.id)}
                          className="p-2 hover:bg-secondary rounded transition-colors"
                          title="更新证书"
                        >
                          <RefreshIcon fontSize="small" />
                        </button>
                        <Popconfirm
                          title="确认删除"
                          description={`确定要删除 ${cert.domain} 的证书吗？`}
                          onConfirm={() => handleDeleteCertificate(cert.id)}
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
              current={currentPage}
              total={filteredCertificates.length}
              onChange={(page) => setCurrentPage(page)}
              pageSize={itemsPerPage}
              showSizeChanger={true}
            />
          </div>
        </Card>

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
