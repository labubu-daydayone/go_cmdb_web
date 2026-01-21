import { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, CopyOutlined } from '@ant-design/icons';

interface CertificateItem {
  id: string;
  domain: string;
  provider: string;
  status: 'valid' | 'expiring' | 'expired';
  issueDate: string;
  expiryDate: string;
  updatedAt: string;
  certificate: string;
  privateKey: string;
}

const CertificatesPage = () => {
  const [dataSource, setDataSource] = useState<CertificateItem[]>([
    {
      id: '1',
      domain: 'example.com',
      provider: 'DigiCert Inc',
      status: 'valid',
      issueDate: '2024-01-01',
      expiryDate: '2025-01-01',
      updatedAt: '2024-01-01 10:00:00',
      certificate: `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKSzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA1234567890...
-----END CERTIFICATE-----`,
      privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDVNGBje+6Jivwt
H8FPQj3+Wq+vVfZqCQJxK8X7gFqZQXvPLZqzVfZqCQJxK8X7gFqZQXvPLZqzVfZq
CQJxK8X7gFqZQXvPLZqzVfZqCQJxK8X7gFqZQXvPLZqzVfZqCQJxK8X7gFqZQXvP
LZqzVfZqCQJxK8X7gFqZQXvPLZqzVfZqCQJxK8X7gFqZQXvPLZqzVfZqCQJxK8X7
1234567890...
-----END PRIVATE KEY-----`,
    },
    {
      id: '2',
      domain: 'test.com',
      provider: "Let's Encrypt",
      status: 'expiring',
      issueDate: '2024-11-01',
      expiryDate: '2024-12-31',
      updatedAt: '2024-11-01 14:30:00',
      certificate: `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKSzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjQxMTAxMDAwMDAwWhcNMjQxMjMxMDAwMDAwWjBF
-----END CERTIFICATE-----`,
      privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDVNGBje+6Jivwt
-----END PRIVATE KEY-----`,
    },
    {
      id: '3',
      domain: 'demo.net',
      provider: 'Self-Signed',
      status: 'expired',
      issueDate: '2023-01-01',
      expiryDate: '2024-01-01',
      updatedAt: '2023-01-01 09:00:00',
      certificate: `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKSzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
-----END CERTIFICATE-----`,
      privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDVNGBje+6Jivwt
-----END PRIVATE KEY-----`,
    },
  ]);

  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const handleUpdate = (id: string) => {
    message.success(`证书 ${id} 更新成功`);
  };

  const handleDelete = (id: string) => {
    setDataSource(dataSource.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label}已复制到剪贴板`);
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      valid: { color: 'success', text: '有效' },
      expiring: { color: 'warning', text: '即将过期' },
      expired: { color: 'error', text: '已过期' },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '域名',
      dataIndex: 'domain',
      key: 'domain',
      width: 200,
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      width: 150,
    },
    {
      title: '证书状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_: any, record: CertificateItem) => getStatusTag(record.status),
    },
    {
      title: '签发时间',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 120,
    },
    {
      title: '过期时间',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: CertificateItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleUpdate(record.id)}>
            更新
          </Button>
          <Popconfirm
            title="确定要删除这个证书吗？"
            description="删除后无法恢复，是否继续？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: CertificateItem) => {
    return (
      <div style={{ padding: '16px 0', backgroundColor: '#fafafa' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* 证书内容 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ marginRight: 8 }}>证书内容</strong>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(record.certificate, '证书内容')}
              >
                复制
              </Button>
            </div>
            <div
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                padding: 16,
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {record.certificate}
              </pre>
            </div>
          </div>

          {/* 证书私钥 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ marginRight: 8 }}>证书私钥</strong>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(record.privateKey, '证书私钥')}
              >
                复制
              </Button>
            </div>
            <div
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                padding: 16,
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {record.privateKey}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProTable
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      search={false}
      expandable={{
        expandedRowRender,
        expandedRowKeys,
        onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
      }}
      pagination={{
        defaultPageSize: 15,
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条记录`,
      }}
      toolBarRender={() => [
        <Button key="add" type="primary" icon={<PlusOutlined />}>
          添加证书
        </Button>,
      ]}
    />
  );
};

export default CertificatesPage;
