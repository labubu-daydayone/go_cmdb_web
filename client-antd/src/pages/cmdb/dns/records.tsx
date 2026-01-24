import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from '@umijs/max';
import { ProTable, ActionType } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Breadcrumb, Space, Card } from 'antd';
import { ReloadOutlined, ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import { dnsAPI } from '@/services/api';
import { connectWebSocket, subscribe, unsubscribe } from '@/utils/websocket';

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
 * DNS 解析记录页面
 */
const DNSRecords: React.FC = () => {
  const [searchParams] = useSearchParams();
  const domainId = searchParams.get('domainId');
  const domainParam = searchParams.get('domain');
  const navigate = useNavigate();
  const actionRef = useRef<ActionType>();
  const [domainName, setDomainName] = useState<string>(domainParam || '');
  const [wsConnected, setWsConnected] = useState(false);

  /**
   * 初始化 WebSocket 连接
   */
  useEffect(() => {
    try {
      connectWebSocket();
      setWsConnected(true);
    } catch (error) {
      console.warn('WebSocket 连接失败:', error);
      setWsConnected(false);
    }

    // 订阅 DNS 解析记录相关事件
    const handleRecordCreated = () => {
      actionRef.current?.reload();
    };
    const handleRecordUpdated = () => {
      actionRef.current?.reload();
    };
    const handleRecordDeleted = () => {
      actionRef.current?.reload();
    };

    subscribe(WebSocketEvent.DNS_RECORD_CREATED, handleRecordCreated);
    subscribe(WebSocketEvent.DNS_RECORD_UPDATED, handleRecordUpdated);
    subscribe(WebSocketEvent.DNS_RECORD_DELETED, handleRecordDeleted);

    return () => {
      unsubscribe(WebSocketEvent.DNS_RECORD_CREATED, handleRecordCreated);
      unsubscribe(WebSocketEvent.DNS_RECORD_UPDATED, handleRecordUpdated);
      unsubscribe(WebSocketEvent.DNS_RECORD_DELETED, handleRecordDeleted);
    };
  }, []);

  const handleRefresh = () => {
    actionRef.current?.reload();
  };

  const handleBack = () => {
    navigate('/cmdb/dns');
  };

  /**
   * ProTable 数据请求
   */
  const request = async (params: any, sort: any, filter: any) => {
    if (!domainId) {
      return {
        data: [],
        success: false,
        total: 0,
      };
    }

    try {
      const response = await dnsAPI.getRecords(Number(domainId), {
        page: params.current,
        pageSize: params.pageSize,
        type: params.type,
        name: params.name,
        status: params.status,
        sortBy: sort && Object.keys(sort).length > 0 ? Object.keys(sort)[0] : undefined,
        order: sort && Object.keys(sort).length > 0 ? (sort[Object.keys(sort)[0]] === 'ascend' ? 'asc' : 'desc') : undefined,
      });

      return {
        data: response.data.items,
        success: response.code === 0,
        total: response.data.total,
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  const columns: ProColumns<DNSRecord>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: '记录类型',
      dataIndex: 'type',
      width: 120,
      valueType: 'select',
      valueEnum: {
        CNAME: { text: 'CNAME' },
        A: { text: 'A' },
        AAAA: { text: 'AAAA' },
        MX: { text: 'MX' },
        TXT: { text: 'TXT' },
      },
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          CNAME: 'blue',
          A: 'green',
          AAAA: 'cyan',
          MX: 'orange',
          TXT: 'purple',
        };
        return <Tag color={colorMap[record.type]}>{record.type}</Tag>;
      },
    },
    {
      title: '主机记录',
      dataIndex: 'name',
      width: 250,
      copyable: true,
      ellipsis: true,
    },
    {
      title: '记录值',
      dataIndex: 'value',
      width: 250,
      search: false,
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'TTL',
      dataIndex: 'ttl',
      width: 100,
      search: false,
      sorter: true,
      render: (text) => `${text}s`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        active: { text: '正常', status: 'Success' },
        pending: { text: '待生效', status: 'Processing' },
        error: { text: '错误', status: 'Error' },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      search: false,
      sorter: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      search: false,
      sorter: true,
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Breadcrumb
          items={[
            {
              href: '/',
              title: <HomeOutlined />,
            },
            {
              href: '/cmdb/dns',
              title: 'DNS 设置',
            },
            {
              title: domainName || '解析记录',
            },
          ]}
        />

        <ProTable<DNSRecord>
          columns={columns}
          actionRef={actionRef}
          request={request}
          rowKey="id"
          search={{
            labelWidth: 'auto',
          }}
          pagination={{
            defaultPageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1400 }}
          toolBarRender={() => [
            <Button key="back" icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回
            </Button>,
            <Button key="refresh" icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>,
          ]}
          headerTitle={
            <Space>
              {domainName} - DNS 解析记录
              {wsConnected && <Tag color="success">实时连接</Tag>}
              {!wsConnected && <Tag color="warning">未连接</Tag>}
            </Space>
          }
        />
      </Space>
    </Card>
  );
};

export default DNSRecords;
