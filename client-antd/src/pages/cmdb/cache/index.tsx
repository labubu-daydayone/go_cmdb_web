import { PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag } from 'antd';

export type CacheItem = {
  id: string;
  name: string;
  path: string;
  ttl: number;
  status: 'enabled' | 'disabled';
  createdAt: string;
};

const CachePage: React.FC = () => {
  const columns: ProColumns<CacheItem>[] = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: 'TTL (秒)',
      dataIndex: 'ttl',
      key: 'ttl',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      valueEnum: {
        enabled: { text: '启用', status: 'Success' },
        disabled: { text: '禁用', status: 'Default' },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      valueType: 'dateTime',
    },
  ];

  return (
    <ProTable<CacheItem>
      headerTitle="缓存设置"
      rowKey="id"
      toolBarRender={() => [
        <Button key="add" type="primary" icon={<PlusOutlined />}>
          添加缓存规则
        </Button>,
      ]}
      request={async () => ({
        data: [
          {
            id: '1',
            name: '静态资源缓存',
            path: '/static/*',
            ttl: 86400,
            status: 'enabled',
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

export default CachePage;
