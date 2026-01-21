import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Space, Tag, message, Popconfirm } from 'antd';
import { useRef, useState } from 'react';

/**
 * 域名数据类型
 */
export type DomainItem = {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'expired';
  sslStatus: 'valid' | 'expiring' | 'expired' | 'none';
  expiryDate: string;
  registrar: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * 域名管理页面
 * 显示所有域名信息和管理功能
 */
const DomainsPage: React.FC = () => {
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
      message.success(`成功删除 ${selectedRowKeys.length} 个域名`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<DomainItem>[] = [
    {
      title: '域名',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      copyable: true,
      ellipsis: true,
      formItemProps: {
        rules: [
          {
            required: true,
            message: '请输入域名',
          },
        ],
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        active: {
          text: '正常',
          status: 'Success',
        },
        inactive: {
          text: '未激活',
          status: 'Default',
        },
        expired: {
          text: '已过期',
          status: 'Error',
        },
      },
      render: (_, record) => {
        const statusMap = {
          active: { color: 'success', text: '正常' },
          inactive: { color: 'default', text: '未激活' },
          expired: { color: 'error', text: '已过期' },
        };
        const status = statusMap[record.status];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: 'SSL 状态',
      dataIndex: 'sslStatus',
      key: 'sslStatus',
      width: 120,
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
        none: {
          text: '未配置',
          status: 'Default',
        },
      },
      render: (_, record) => {
        const sslStatusMap = {
          valid: { color: 'success', text: '有效' },
          expiring: { color: 'warning', text: '即将过期' },
          expired: { color: 'error', text: '已过期' },
          none: { color: 'default', text: '未配置' },
        };
        const sslStatus = sslStatusMap[record.sslStatus];
        return <Tag color={sslStatus.color}>{sslStatus.text}</Tag>;
      },
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      valueType: 'date',
      sorter: true,
    },
    {
      title: '注册商',
      dataIndex: 'registrar',
      key: 'registrar',
      width: 150,
      ellipsis: true,
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
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 220,
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            message.info(`查看域名: ${record.name}`);
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
            message.info(`编辑域名: ${record.name}`);
          }}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个域名吗？"
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
    const mockData: DomainItem[] = [
      {
        id: '1',
        name: 'example.com',
        status: 'active',
        sslStatus: 'valid',
        expiryDate: '2025-12-31',
        registrar: 'GoDaddy',
        createdAt: '2024-01-01 10:00:00',
        updatedAt: '2024-06-15 14:30:00',
      },
      {
        id: '2',
        name: 'test.com',
        status: 'active',
        sslStatus: 'expiring',
        expiryDate: '2025-02-28',
        registrar: 'Namecheap',
        createdAt: '2024-02-10 11:20:00',
        updatedAt: '2024-07-20 16:45:00',
      },
      {
        id: '3',
        name: 'demo.net',
        status: 'expired',
        sslStatus: 'expired',
        expiryDate: '2024-10-15',
        registrar: 'Cloudflare',
        createdAt: '2023-10-15 09:30:00',
        updatedAt: '2024-10-15 12:00:00',
      },
    ];

    return {
      data: mockData,
      success: true,
      total: mockData.length,
    };
  };

  return (
    <ProTable<DomainItem>
      headerTitle="域名管理"
      actionRef={actionRef}
      rowKey="id"
      search={{
        labelWidth: 'auto',
      }}
      form={{
        syncToUrl: true,
      }}
      toolBarRender={() => [
        selectedRowKeys.length > 0 && (
          <Popconfirm
            key="batchDelete"
            title={`确定要删除选中的 ${selectedRowKeys.length} 个域名吗？`}
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
            message.info('打开添加域名对话框');
          }}
        >
          添加域名
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

export default DomainsPage;
