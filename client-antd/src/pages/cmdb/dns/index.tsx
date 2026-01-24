import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@umijs/max';
import { ProTable, ActionType } from '@ant-design/pro-components';
import { Button, Drawer, Form, Input, Switch, Space, message, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, EyeOutlined, EyeInvisibleOutlined, CopyOutlined, FileTextOutlined } from '@ant-design/icons';
import { dnsAPI } from '@/services/api';
import { connectWebSocket, subscribe, unsubscribe } from '@/utils/websocket';

const { Text } = Typography;

interface DNSConfig {
  id: string;
  domain: string;
  token: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const DNSConfigPage = () => {
  const actionRef = useRef<ActionType>();
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [showTokens, setShowTokens] = useState<Set<string>>(new Set());
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

    // 订阅 DNS 相关事件
    const handleDNSCreated = () => {
      message.info('检测到新 DNS 配置创建');
      actionRef.current?.reload();
    };
    const handleDNSDeleted = () => {
      message.info('检测到 DNS 配置删除');
      actionRef.current?.reload();
    };

    subscribe(WebSocketEvent.DNS_CREATED, handleDNSCreated);
    subscribe(WebSocketEvent.DNS_DELETED, handleDNSDeleted);

    return () => {
      unsubscribe(WebSocketEvent.DNS_CREATED, handleDNSCreated);
      unsubscribe(WebSocketEvent.DNS_DELETED, handleDNSDeleted);
    };
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (record: DNSConfig) => {
    setEditingId(record.id);
    form.setFieldsValue({
      domain: record.domain,
      token: record.token,
      status: record.status === 'active',
    });
    setDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dnsAPI.delete([Number(id)]);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingId) {
        await dnsAPI.update({
          id: Number(editingId),
          domain: values.domain,
          token: values.token,
          status: values.status ? 'active' : 'inactive',
        });
        message.success('编辑成功');
      } else {
        await dnsAPI.create({
          domain: values.domain,
          token: values.token,
          status: values.status ? 'active' : 'inactive',
        });
        message.success('添加成功');
      }

      setDrawerVisible(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  const toggleShowToken = (id: string) => {
    const newShowTokens = new Set(showTokens);
    if (newShowTokens.has(id)) {
      newShowTokens.delete(id);
    } else {
      newShowTokens.add(id);
    }
    setShowTokens(newShowTokens);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  const viewRecords = (record: DNSConfig) => {
    navigate(`/cmdb/dns/records?domainId=${record.id}&domain=${record.domain}`);
  };

  /**
   * ProTable 数据请求
   */
  const request = async (params: any, sort: any, filter: any) => {
    try {
      const response = await dnsAPI.list({
        page: params.current,
        pageSize: params.pageSize,
        domain: params.domain,
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: '域名',
      dataIndex: 'domain',
      width: 200,
      copyable: true,
      ellipsis: true,
      render: (text: string, record: DNSConfig) => (
        <a onClick={() => viewRecords(record)}>{text}</a>
      ),
    },
    {
      title: 'Token',
      dataIndex: 'token',
      width: 300,
      search: false,
      render: (text: string, record: DNSConfig) => {
        const isVisible = showTokens.has(record.id);
        return (
          <Space>
            <Text code style={{ maxWidth: 200 }} ellipsis>
              {isVisible ? text : '••••••••••••••••••••'}
            </Text>
            <Button
              type="text"
              size="small"
              icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => toggleShowToken(record.id)}
            />
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(text)}
            />
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        inactive: { text: '停用', status: 'Default' },
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
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_: any, record: DNSConfig) => [
        <a key="records" onClick={() => viewRecords(record)}>
          <FileTextOutlined /> 解析记录
        </a>,
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定要删除这个 DNS 配置吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <a style={{ color: 'red' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<DNSConfig>
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
        scroll={{ x: 1200 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加 DNS 配置
          </Button>,
        ]}
        headerTitle={
          <Space>
            DNS 设置
            {wsConnected && <Tag color="success">实时连接</Tag>}
            {!wsConnected && <Tag color="warning">未连接</Tag>}
          </Space>
        }
      />

      <Drawer
        title={editingId ? '编辑 DNS 配置' : '添加 DNS 配置'}
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              {editingId ? '保存' : '添加'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="domain"
            label="域名"
            rules={[{ required: true, message: '请输入域名' }]}
          >
            <Input placeholder="example.com" />
          </Form.Item>

          <Form.Item
            name="token"
            label="Token"
            rules={[{ required: true, message: '请输入 Token' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="dns_token_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </Form.Item>

          <Form.Item name="status" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default DNSConfigPage;
