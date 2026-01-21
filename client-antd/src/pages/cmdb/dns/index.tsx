import { PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button } from 'antd';

export type DNSItem = {
  id: string;
  domain: string;
  recordType: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT';
  value: string;
  ttl: number;
  createdAt: string;
};

const DNSPage: React.FC = () => {
  const columns: ProColumns<DNSItem>[] = [
    {
      title: '域名',
      dataIndex: 'domain',
      key: 'domain',
    },
    {
      title: '记录类型',
      dataIndex: 'recordType',
      key: 'recordType',
      valueEnum: {
        A: { text: 'A' },
        AAAA: { text: 'AAAA' },
        CNAME: { text: 'CNAME' },
        MX: { text: 'MX' },
        TXT: { text: 'TXT' },
      },
    },
    {
      title: '记录值',
      dataIndex: 'value',
      key: 'value',
      copyable: true,
    },
    {
      title: 'TTL',
      dataIndex: 'ttl',
      key: 'ttl',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      valueType: 'dateTime',
    },
  ];

  return (
    <ProTable<DNSItem>
      headerTitle="DNS 配置"
      rowKey="id"
      toolBarRender={() => [
        <Button key="add" type="primary" icon={<PlusOutlined />}>
          添加 DNS 记录
        </Button>,
      ]}
      request={async () => ({
        data: [
          {
            id: '1',
            domain: 'example.com',
            recordType: 'A',
            value: '192.168.1.1',
            ttl: 3600,
            createdAt: '2024-01-01 10:00:00',
          },
        ],
        success: true,
        total: 1,
      })}
      columns={columns}
    />
  );
};

export default DNSPage;
