import { PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag } from 'antd';

export type APIKeyItem = {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  status: 'active' | 'revoked';
  lastUsed: string;
  createdAt: string;
};

const APIKeysPage: React.FC = () => {
  const columns: ProColumns<APIKeyItem>[] = [
    {
      title: '密钥名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'API Key',
      dataIndex: 'key',
      key: 'key',
      copyable: true,
      ellipsis: true,
      render: (key: any) => `${key}`.substring(0, 20) + '...',
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <>
          {permissions.map((p) => (
            <Tag key={p}>{p}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      valueEnum: {
        active: { text: '有效', status: 'Success' },
        revoked: { text: '已撤销', status: 'Error' },
      },
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      valueType: 'dateTime',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      valueType: 'dateTime',
    },
  ];

  return (
    <ProTable<APIKeyItem>
      headerTitle="API 密钥管理"
      rowKey="id"
      toolBarRender={() => [
        <Button key="add" type="primary" icon={<PlusOutlined />}>
          创建 API 密钥
        </Button>,
      ]}
      request={async () => ({
        data: [
          {
            id: '1',
            name: '生产环境密钥',
            key: 'mock_api_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            permissions: ['read', 'write'],
            status: 'active',
            lastUsed: '2024-01-20 15:30:00',
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

export default APIKeysPage;
