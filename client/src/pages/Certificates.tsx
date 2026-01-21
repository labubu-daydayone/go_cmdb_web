import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui';
import { Pagination } from '@/components/Pagination';
import DashboardLayout from '@/components/DashboardLayout';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Popconfirm } from '@/components/Popconfirm';
import { Toast, ToastType } from '@/components/Toast';
import { useListParams } from '@/hooks/useUrlParams';

interface Certificate {
  id: string;
  domain: string;
  provider: string;
  status: 'valid' | 'expiring' | 'expired';
  expiryDate: string;
  issueDate: string;
  createdAt: string;
  updatedAt: string;
  certificate: string;
  privateKey: string;
}

// 生成模拟证书内容
const generateMockCertificate = () => {
  return `-----BEGIN CERTIFICATE-----
MIIFNzCCBB+gAwIBAgIQM+J05ylxMOen00289SgjANBgkqhkiG9w0BAQsFADA7
MQswCQYDVQQGEwJVUzEeMBwGA1UEChMVR29vZ2xlIFRydXN0IFNlcnZpY2VzMQww
CgYDVQQDEwNXRTExMB4XDTIwMDQxNTE1MjAxNVoXDTIwMDcxNDE1MjAxNVowZDEL
MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDU1vdW50
YWluIFZpZXcxEzARBgNVBAoTCkdvb2dsZSBMTEMxEzARBgNVBAMTCmdvb2dsZS5j
b20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDLYwMTEIMDYxoTUzwH
chNMVR9vZx1FRydXN0IfNlcnZpY2VzMQwwCgYDVQQDEwNXRTExMB4XDTIwMDQxNT
E1MjAxNVoXDTIwMDcxNDE1MjAxNVowZDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCk
NhbGlmb3JuaWExFjAUBgNVBAcTDU1vdW50YWluIFZpZXcxEzARBgNVBAoTCkdvb2
dsZSBMTEMxEzARBgNVBAMTCmdvb2dsZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4
IBDwAwggEKAoIBAQDLYwMTEIMDYxoTUzwHchNMVR9vZx1FRydXN0IfNlcnZpY2Vz
MQwwCgYDVQQDEwNXRTExMB4XDTIwMDQxNTE1MjAxNVoXDTIwMDcxNDE1MjAxNVow
ZDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDU1v
dW50YWluIFZpZXcxEzARBgNVBAoTCkdvb2dsZSBMTEMxEzARBgNVBAMTCmdvb2ds
ZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDLYwMTEIMDYxoT
UzwHchNMVR9vZx1FRydXN0IfNlcnZpY2VzMQwwCgYDVQQDEwNXRTExMB4XDTIwMD
QxNTE1MjAxNVoXDTIwMDcxNDE1MjAxNVowZDELMAkGA1UEBhMCVVMxEzARBgNVBA
gTCkNhbGlmb3JuaWExFjAUBgNVBAcTDU1vdW50YWluIFZpZXcxEzARBgNVBAoTCk
dvb2dsZSBMTEMxEzARBgNVBAMTCmdvb2dsZS5jb20wggEiMA0GCSqGSIb3DQEBAQ
UAA4IBDwAwggEKAoIBAQDLYwMTEIMDYxoTUzwHchNMVR9vZx1FRydXN0IfNlcnZp
Y2VzMQwwCgYDVQQDEwNXRTExMB4XDTIwMDQxNTE1MjAxNVoXDTIwMDcxNDE1MjAx
NVowZDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcT
DU1vdW50YWluIFZpZXcxEzARBgNVBAoTCkdvb2dsZSBMTEMxEzARBgNVBAMTCmdv
b2dsZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDLYwMTEIMD
YxoTUzwHchNMVR9vZx1FRydXN0IfNlcnZpY2VzMQwwCgYDVQQDEwNXRTExMB4XDT
IwMDQxNTE1MjAxNVoXDTIwMDcxNDE1MjAxNVowZDELMAkGA1UEBhMCVVMxEzARBg
NVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDU1vdW50YWluIFZpZXcxEzARBgNVBA
oTCkdvb2dsZSBMTEMxEzARBgNVBAMTCmdvb2dsZS5jb20wggEiMA0GCSqGSIb3DQ
EBAQUAA4IBDwAwggEKAoIBAQDLYwMTEIMDYxoTUzwHchNMVR9vZx1FRydXN0IfNl
cnZpY2VzMQwwCgYDVQQDEwNXRTExMB4XDTIwMDQxNTE1MjAxNVoXDTIwMDcxNDE1
MjAxNVowZDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNV
BAcTDU1vdW50YWluIFZpZXcxEzARBgNVBAoTCkdvb2dsZSBMTEMxEzARBgNVBAMT
CmdvbmdsZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDLYwMT
EIMDYxoTUzwHchNMVR9vZx1FRydXN0IfNlcnZpY2VzMQwwCgYDVQQDEwNXRTExMB
4XDTIwMDQxNTE1MjAxNVoXDTIwMDcxNDE1MjAxNVowZDELMAkGA1UEBhMCVVMxEz
ARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDU1vdW50YWluIFZpZXcxEzARBg
NVBAoTCkdvb2dsZSBMTEMxEzARBgNVBAMTCmdvb2dsZS5jb20wggEiMA0GCSqGSI
b3DQEBAQUAA4IBDwAwggEKAoIBAQDLYwMTEIMDYxoTUzwHchNMVR9vZx1FRydXN0
IfNlcnZpY2VzMQwwCgYDVQQDEwNXRTExMB4XDTIwMDQxNTE1MjAxNVoXDTIwMDcx
NDE1MjAxNVowZDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAU
BgNVBAcTDU1vdW50YWluIFZpZXcxEzARBgNVBAoTCkdvb2dsZSBMTEMxEzARBgNV
BAMTCmdvb2dsZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDL
YwMTEIMDYxoTUzwHchNMVR9vZx1FRydXN0IfNlcnZpY2VzMQwwCgYDVQQDEwNXRT
ExMB4XDTIwMDQxNTE1MjAxNVoXDTIwMDcxNDE1MjAxNVowZDELMAkGA1UEBhMCVV
MxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDU1vdW50YWluIFZpZXcxEz
ARBgNVBAoTCkdvb2dsZSBMTEMxEzARBgNVBAMTCmdvb2dsZS5jb20wggEiMA0GCS
qGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDLYwMTEIMDYxoTUzwHchNMVR9vZx1FRy
dXN0IfNlcnZpY2VzMQwwCgYDVQQDEwNXRTExMB4XDTIwMDQxNTE1MjAxNVoXDTIw
MDcxNDE1MjAxNVowZDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWEx
FjAUBgNVBAcTDU1vdW50YWluIFZpZXcxEzARBgNVBAoTCkdvb2dsZSBMTEMxEzAR
BgNVBAMTCmdvb2dsZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
AQDLYwMTEIMDYxoTUzwHchNMVR9vZx1FRydXN0IfNlcnZpY2VzMQwwCgYDVQQDEw
NXRTEXMB4XDTIwMDQxNTE1MjAxNVoXDTIwMDcxNDE1MjAxNVowZDELMAkGA1UEBh
MCVVMXEZARBGNVBAGXCKNH==
-----END CERTIFICATE-----`;
};

const generateMockPrivateKey = () => {
  return `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA3mssyi2pGcOFczJgXaVFB18Wq7vAtZ0duQNg5eXwffrDlYEO
510KyK1GvbvtHWY0Ps0ZWw/bLVPGAD1ME71I1PkaZTgu9ZZm30i4onklGQNq34
pyDto1Z5WINtomqrr0St9TDOPsBjLm3L0dXqLgM1KAPUSXLyt6ti9/Yd5DPSDn
ZofA+1BfI1Qyhy2N1+kgXxf1bri4hk2x3dqtZyxF4AvXvpUAv7yPo5ATVVmcdj
4ssh0WQgr5sYxvLPC8oUBUk7+wMzIaYI4jGBRRdsplmDmFLYgMnvta6+BnRbl
MDLxtYarlx7ixo+w+rsTTXIqXAyGlP6v2apQIDAQABAo1CAEAZBo1ICRp3WDNCt
oGUlvQXRxBxo8tMmrr0St9TDOPsBjLm3L0dXqLgM1KAPUSXLyt6ti9/Yd5DPSDn
ZofA+1BfI1Qyhy2N1+kgXxf1bri4hk2x3dqtZyxF4AvXvpUAv7yPo5ATVVmcdj
4ssh0WQgr5sYxvLPC8oUBUk7+wMzIaYI4jGBRRdsplmDmFLYgMnvta6+BnRbl
MDLxtYarlx7ixo+w+rsTTXIqXAyGlP6v2apQIDAQABAo1CAEAZBo1ICRp3WDNCt
oGUlvQXRxBxo8tMmrr0St9TDOPsBjLm3L0dXqLgM1KAPUSXLyt6ti9/Yd5DPSDn
ZofA+1BfI1Qyhy2N1+kgXxf1bri4hk2x3dqtZyxF4AvXvpUAv7yPo5ATVVmcdj
4ssh0WQgr5sYxvLPC8oUBUk7+wMzIaYI4jGBRRdsplmDmFLYgMnvta6+BnRbl
MDLxtYarlx7ixo+w+rsTTXIqXAyGlP6v2apQIDAQABAo1CAEAZBo1ICRp3WDNCt
oGUlvQXRxBxo8tMmrr0St9TDOPsBjLm3L0dXqLgM1KAPUSXLyt6ti9/Yd5DPSDn
ZofA+1BfI1Qyhy2N1+kgXxf1bri4hk2x3dqtZyxF4AvXvpUAv7yPo5ATVVmcdj
4ssh0WQgr5sYxvLPC8oUBUk7+wMzIaYI4jGBRRdsplmDmFLYgMnvta6+BnRbl
MDLxtYarlx7ixo+w+rsTTXIqXAyGlP6v2apQIDAQABAo1CAEAZBo1ICRp3WDNCt
oGUlvQXRxBxo8tMmrr0St9TDOPsBjLm3L0dXqLgM1KAPUSXLyt6ti9/Yd5DPSDn
ZofA+1BfI1Qyhy2N1+kgXxf1bri4hk2x3dqtZyxF4AvXvpUAv7yPo5ATVVmcdj
4ssh0WQgr5sYxvLPC8oUBUk7+wMzIaYI4jGBRRdsplmDmFLYgMnvta6+BnRbl
MDLxtYarlx7ixo+w+rsTTXIqXAyGlP6v2apQIDAQABAo1CAEAZBo1ICRp3WDNCt
oGUlvQXRxBxo8tMmrr0St9TDOPsBjLm3L0dXqLgM1KAPUSXLyt6ti9/Yd5DPSDn
ZofA+1BfI1Qyhy2N1+kgXxf1bri4hk2x3dqtZyxF4AvXvpUAv7yPo5ATVVmcdj
4ssh0WQgr5sYxvLPC8oUBUk7+wMzIaYI4jGBRRdsplmDmFLYgMnvta6+BnRbl
MDLxtYarlx7ixo+w+rsTTXIqXAyGlP6v2apQIDAQABAo1CAEAZBo1ICRp3WDNCt
oGUlvQXRxBxo8tMmrr0St9TDOPsBjLm3L0dXqLgM1KAPUSXLyt6ti9/Yd5DPSDn
ZofA+1BfI1Qyhy2N1+kgXxf1bri4hk2x3dqtZyxF4AvXvpUAv7yPo5ATVVmcdj
4ssh0WQgr5sYxvLPC8oUBUk7+wMzIaYI4jGBRRdsplmDmFLYgMnvta6+BnRbl
MDLxtYarlx7ixo+w+rsTTXIqXAyGlP6v2apQIDAQABAo1CAEAZBo1ICRp3WDNCt
oGUlvQXRxBxo8tMmrr0St9TDOPsBjLm3L0dXqLgM1KAPUSXLyt6ti9/Yd5DPSDn
c/0E2h0+C5V/Mg+ArQ9yQX8CgYEArDDj1jPhyb8eTEBExFqhAjVErPd7CwVG80h3
430YuggYEf0c+Xk1XUK8suBaBvGS+bc+qcBsR0LWtg28tEEIGw0VJ62Y3SkkQYi
5o0YgPcsLbhFkMZutfLyEgh85/T9Mg1XDmr6G2Rntgcfzd+ENBMc6+Rihg1FUGV1
2tw2AS0GCyAngrbzC7BQMEOguVSCyuFKVhQ6i95jcv
-----END RSA PRIVATE KEY-----`;
};

const generateMockCertificates = (): Certificate[] => {
  const domains = [
    'suptoon10.com', 'api.example.com', 'www.example.com', 'cdn.example.com',
    'blog.example.com', 'shop.example.com', 'admin.example.com', 'test.example.com',
    'staging.example.com', 'dev.example.com', 'app.example.com', 'mobile.example.com'
  ];
  
  const providers = ['letsencrypt', 'manual', 'auto'];
  
  return domains.map((domain, i) => {
    const daysUntilExpiry = Math.floor(Math.random() * 365) - 30;
    const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);
    const issueDate = new Date(expiryDate.getTime() - 90 * 24 * 60 * 60 * 1000);
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
      provider: providers[i % providers.length],
      status,
      expiryDate: expiryDate.toISOString().split('T')[0] + ' ' + expiryDate.toTimeString().split(' ')[0],
      issueDate: issueDate.toISOString().split('T')[0] + ' ' + issueDate.toTimeString().split(' ')[0],
      createdAt: createdDate.toISOString().split('T')[0],
      updatedAt: updatedDate.toISOString().split('T')[0] + ' ' + updatedDate.toTimeString().split(' ')[0],
      certificate: generateMockCertificate(),
      privateKey: generateMockPrivateKey()
    };
  });
};

export default function Certificates() {
  // 使用 URL 参数同步
  const [urlParams, setUrlParams] = useListParams({
    defaultPage: 1,
    defaultPageSize: 15,
    defaultSearch: '',
    defaultFilters: { status: 'all' },
  });

  const location = useLocation();
  const [certificates, setCertificates] = useState<Certificate[]>(generateMockCertificates());

  // 监听路由变化，重新生成数据
  useEffect(() => {
    setCertificates(generateMockCertificates());
  }, [location.pathname]);
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set());
  const [expandedCerts, setExpandedCerts] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleToggleExpand = (certId: string) => {
    const newExpanded = new Set(expandedCerts);
    if (newExpanded.has(certId)) {
      newExpanded.delete(certId);
    } else {
      newExpanded.add(certId);
    }
    setExpandedCerts(newExpanded);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast({ message: `${label}已复制到剪贴板`, type: 'success' });
    }).catch(() => {
      setToast({ message: `复制失败`, type: 'error' });
    });
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.domain.toLowerCase().includes(urlParams.search.toLowerCase());
    const matchesStatus = urlParams.status === 'all' || cert.status === urlParams.status;
    return matchesSearch && matchesStatus;
  });

  const startIndex = (urlParams.page - 1) * urlParams.pageSize;
  const endIndex = startIndex + urlParams.pageSize;
  const paginatedCertificates = filteredCertificates.slice(startIndex, endIndex);

  const handleUpdateCertificate = (certId: string) => {
    const cert = certificates.find(c => c.id === certId);
    if (cert) {
      setToast({ message: `证书 ${cert.domain} 更新请求已发送`, type: 'success' });
    }
  };

  const handleDeleteCertificate = (certId: string) => {
    const cert = certificates.find(c => c.id === certId);
    setToast({ message: `证书 ${cert?.domain} 删除请求已发送`, type: 'success' });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      valid: { bg: 'bg-green-100', text: 'text-green-800', label: '正常' },
      expiring: { bg: 'bg-orange-100', text: 'text-orange-800', label: '即将过期' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', label: '已过期' }
    };
    const badge = badges[status as keyof typeof badges] || badges.valid;
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} rounded text-xs font-medium`}>
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">证书管理</h1>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="搜索域名..."
            value={urlParams.search}
            onChange={(e) => setUrlParams({ search: e.target.value })}
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={urlParams.status}
            onChange={(e) => setUrlParams({ status: e.target.value })}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">全部状态</option>
            <option value="valid">正常</option>
            <option value="expiring">即将过期</option>
            <option value="expired">已过期</option>
          </select>
        </div>

        {/* 证书列表 */}
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/20 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12"></th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">域名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">提供商</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">证书状态</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">签发时间</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">过期时间</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">更新时间</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCertificates.map((cert) => (
                  <>
                    <tr key={cert.id} className="border-b border-border hover:bg-secondary/10">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleExpand(cert.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {expandedCerts.has(cert.id) ? (
                            <ExpandMoreIcon fontSize="small" />
                          ) : (
                            <ChevronRightIcon fontSize="small" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-foreground">{cert.domain}</td>
                      <td className="px-4 py-3 text-foreground">{cert.provider}</td>
                      <td className="px-4 py-3">{getStatusBadge(cert.status)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cert.issueDate}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cert.expiryDate}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cert.updatedAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateCertificate(cert.id)}
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="更新证书"
                          >
                            更新
                          </button>
                          <Popconfirm
                            title="确定要删除这个证书吗？"
                            onConfirm={() => handleDeleteCertificate(cert.id)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <button className="text-destructive hover:text-destructive/80 transition-colors">
                              删除
                            </button>
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                    {expandedCerts.has(cert.id) && (
                      <tr key={`${cert.id}-details`} className="border-b border-border bg-secondary/5">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-6">
                            {/* 证书内容 */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                                  证书内容
                                  <button
                                    onClick={() => handleCopy(cert.certificate, '证书内容')}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    title="复制证书内容"
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </button>
                                </h3>
                              </div>
                              <div className="bg-background border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all">
                                  {cert.certificate}
                                </pre>
                              </div>
                            </div>

                            {/* 证书私钥 */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                                  证书私钥
                                  <button
                                    onClick={() => handleCopy(cert.privateKey, '证书私钥')}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    title="复制证书私钥"
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </button>
                                </h3>
                              </div>
                              <div className="bg-background border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all">
                                  {cert.privateKey}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <Pagination
            current={urlParams.page}
            total={filteredCertificates.length}
            pageSize={urlParams.pageSize}
            showSizeChanger
            onChange={(page, size) => {
              setUrlParams({ page, pageSize: size });
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
