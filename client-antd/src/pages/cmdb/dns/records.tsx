import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@umijs/max';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Breadcrumb, Space, Card } from 'antd';
import { ReloadOutlined, ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';

/**
 * DNS 解析记录数据类型
 */
export type DNSRecord = {
  id: string;
  type: 'CNAME' | 'A' | 'AAAA' | 'MX' | 'TXT';
  name: string;
  value: string;
  ttl: number;
  status: 'active' | 'pending' | 'error';
  createdAt: string;
  updatedAt: string;
};

/**
 * 生成 mock DNS 解析记录
 */
const generateMockRecords = (domain: string): DNSRecord[] => {
  return [
    {
      id: '1',
      type: 'CNAME',
      name: `www.${domain}`,
      value: `cdn.example.com`,
      ttl: 600,
      status: 'active',
      createdAt: '2024-01-01 10:00:00',
      updatedAt: '2024-01-01 10:00:00',
    },
    {
      id: '2',
      type: 'CNAME',
      name: `api.${domain}`,
      value: `api-cdn.example.com`,
      ttl: 300,
      status: 'active',
      createdAt: '2024-01-02 11:00:00',
      updatedAt: '2024-01-02 11:00:00',
    },
    {
      id: '3',
      type: 'A',
      name: domain,
      value: '192.168.1.100',
      ttl: 3600,
      status: 'active',
      createdAt: '2024-01-03 12:00:00',
      updatedAt: '2024-01-03 12:00:00',
    },
    {
      id: '4',
      type: 'CNAME',
      name: `cdn.${domain}`,
      value: `cdn-backup.example.com`,
      ttl: 600,
      status: 'pending',
      createdAt: '2024-01-04 13:00:00',
      updatedAt: '2024-01-04 13:00:00',
    },
  ];
};

/**
 * DNS 解析记录页面
 */
const DNSRecords: React.FC = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [domainName, setDomainName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadRecords = () => {
    setLoading(true);
    // 模拟 API 调用延迟
    setTimeout(() => {
      if (domainId) {
        // 根据 domainId 获取域名（这里简化处理）
        const domain = domainId === '1' ? 'example.com' : domainId === '2' ? 'test.com' : 'demo.net';
        setDomainName(domain);
        setRecords(generateMockRecords(domain));
      }
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadRecords();
  }, [domainId]);

  const handleRefresh = () => {
    loadRecords();
  };

  const handleBack = () => {
    navigate('/website/dns');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '正常';
      case 'pending':
        return '待生效';
      case 'error':
        return '错误';
      default:
        return '未知';
    }
  };

  const columns: ProColumns<DNSRecord>[] = [
    {
      title: '记录类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: any) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '主机记录',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '记录值',
      dataIndex: 'value',
      key: 'value',
      width: 250,
    },
    {
      title: 'TTL',
      dataIndex: 'ttl',
      key: 'ttl',
      width: 100,
      render: (ttl: number) => `${ttl}s`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 面包屑导航 */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            href: '/',
            title: <HomeOutlined />,
          },
          {
            href: '/website/dns',
            title: 'DNS 设置',
          },
          {
            title: `${domainName} 的解析记录`,
          },
        ]}
      />

      <Card>
        <ProTable<DNSRecord>
          headerTitle={
            <Space>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
              >
                返回
              </Button>
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                {domainName} 的解析记录
              </span>
            </Space>
          }
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          search={false}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ['15', '20', '50', '100'],
          }}
          toolBarRender={() => [
            <Button
              key="refresh"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>,
          ]}
          options={false}
        />
      </Card>
    </div>
  );
};

export default DNSRecords;
