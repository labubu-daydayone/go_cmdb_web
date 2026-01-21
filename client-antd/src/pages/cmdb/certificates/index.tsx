import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Typography } from 'antd';
import { useRef, useState } from 'react';

const { Paragraph } = Typography;

/**
 * 证书数据类型
 */
export type CertificateItem = {
  id: string;
  name: string;
  domain: string;
  type: 'self-signed' | 'ca-signed' | 'lets-encrypt';
  status: 'valid' | 'expiring' | 'expired';
  issuer: string;
  validFrom: string;
  validTo: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * 证书管理页面
 */
const CertificatesPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  /**
   * 处理删除操作
   */
  const handleDelete = async (id: string) => {
    try {
      // TODO: 调用删除 API
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('删除失败');
    }
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async () => {
    try {
      // TODO: 调用批量删除 API
      message.success(`成功删除 ${selectedRowKeys.length} 个证书`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<CertificateItem>[] = [
    {
      title: '证书名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
      formItemProps: {
        rules: [
          {
            required: true,
            message: '请输入证书名称',
          },
        ],
      },
    },
    {
      title: '域名',
      dataIndex: 'domain',
      key: 'domain',
      width: 200,
      copyable: true,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      valueType: 'select',
      valueEnum: {
        'self-signed': {
          text: '自签名',
          status: 'Default',
        },
        'ca-signed': {
          text: 'CA签名',
          status: 'Success',
        },
        'lets-encrypt': {
          text: "Let's Encrypt",
          status: 'Processing',
        },
      },
      render: (_, record) => {
        const typeMap = {
          'self-signed': { color: 'default', text: '自签名' },
          'ca-signed': { color: 'success', text: 'CA签名' },
          'lets-encrypt': { color: 'processing', text: "Let's Encrypt" },
        };
        const type = typeMap[record.type];
        return <Tag color={type.color}>{type.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        valid: {
          text: '有效',
          status: 'Success',
        },
        expiring: {
          text: '即将过期',
          status: 'Warning',
        },
        expired: {
          text: '已过期',
          status: 'Error',
        },
      },
      render: (_, record) => {
        const statusMap = {
          valid: { color: 'success', text: '有效' },
          expiring: { color: 'warning', text: '即将过期' },
          expired: { color: 'error', text: '已过期' },
        };
        const status = statusMap[record.status];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '签发机构',
      dataIndex: 'issuer',
      key: 'issuer',
      width: 150,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '生效日期',
      dataIndex: 'validFrom',
      key: 'validFrom',
      width: 120,
      valueType: 'date',
      hideInSearch: true,
    },
    {
      title: '到期日期',
      dataIndex: 'validTo',
      key: 'validTo',
      width: 120,
      valueType: 'date',
      sorter: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            message.info(`查看证书: ${record.name}`);
          }}
        >
          查看
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            message.info(`编辑证书: ${record.name}`);
          }}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个证书吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  /**
   * 请求数据
   */
  const request = async (params: any, sort: any, filter: any) => {
    // TODO: 调用实际的 API
    // 模拟数据
    const mockData: CertificateItem[] = [
      {
        id: '1',
        name: 'example.com SSL',
        domain: 'example.com',
        type: 'ca-signed',
        status: 'valid',
        issuer: 'DigiCert Inc',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        createdAt: '2024-01-01 10:00:00',
        updatedAt: '2024-01-01 10:00:00',
      },
      {
        id: '2',
        name: 'test.com SSL',
        domain: 'test.com',
        type: 'lets-encrypt',
        status: 'expiring',
        issuer: "Let's Encrypt",
        validFrom: '2024-11-01',
        validTo: '2025-02-01',
        createdAt: '2024-11-01 12:00:00',
        updatedAt: '2024-11-01 12:00:00',
      },
      {
        id: '3',
        name: 'demo.net SSL',
        domain: 'demo.net',
        type: 'self-signed',
        status: 'expired',
        issuer: 'Self-Signed',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        createdAt: '2023-01-01 09:00:00',
        updatedAt: '2023-01-01 09:00:00',
      },
    ];

    return {
      data: mockData,
      success: true,
      total: mockData.length,
    };
  };

  return (
    <ProTable<CertificateItem>
      headerTitle="证书管理"
      actionRef={actionRef}
      rowKey="id"
      search={{
        labelWidth: 'auto',
      }}
      scroll={{ x: 'max-content' }}
      toolBarRender={() => [
        selectedRowKeys.length > 0 && (
          <Popconfirm
            key="batchDelete"
            title={`确定要删除选中的 ${selectedRowKeys.length} 个证书吗？`}
            onConfirm={handleBatchDelete}
            okText="确定"
            cancelText="取消"
          >
            <Button type="primary" danger>
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        ),
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            message.info('打开添加证书对话框');
          }}
        >
          添加证书
        </Button>,
      ]}
      request={request}
      columns={columns}
      rowSelection={{
        selectedRowKeys,
        onChange: setSelectedRowKeys,
      }}
      pagination={{
        defaultPageSize: 15,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条记录`,
      }}
    />
  );
};

export default CertificatesPage;
