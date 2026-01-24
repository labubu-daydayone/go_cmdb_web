import { useRef, useState, useEffect } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Space, Drawer, Form, Input, InputNumber, Table, Switch } from 'antd';
import { nodesAPI } from '@/services/api';
import { connectWebSocket, subscribe, unsubscribe, WebSocketEvent } from '@/utils/websocket';

/**
 * 子 IP 类型
 */
type SubIP = {
  id: string;
  ip: string;
  enabled: boolean;
  createdDate?: string;
};

/**
 * 节点类型
 */
export type NodeItem = {
  id: string;
  name: string;
  ip: string;
  managementPort: number;
  status: 'online' | 'offline' | 'maintenance';
  subIPs?: SubIP[];
};

/**
 * 节点管理页面
 */
const NodesPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeItem | null>(null);
  const [subIPs, setSubIPs] = useState<SubIP[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
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

    // 订阅节点相关事件
    const handleNodeCreated = () => {
      message.info('检测到新节点创建');
      actionRef.current?.reload();
    };
    const handleNodeUpdated = () => {
      message.info('检测到节点更新');
      actionRef.current?.reload();
    };
    const handleNodeDeleted = () => {
      message.info('检测到节点删除');
      actionRef.current?.reload();
    };
    const handleNodeStatusChanged = () => {
      actionRef.current?.reload();
    };

    subscribe(WebSocketEvent.NODE_CREATED, handleNodeCreated);
    subscribe(WebSocketEvent.NODE_UPDATED, handleNodeUpdated);
    subscribe(WebSocketEvent.NODE_DELETED, handleNodeDeleted);
    subscribe(WebSocketEvent.NODE_STATUS_CHANGED, handleNodeStatusChanged);

    return () => {
      unsubscribe(WebSocketEvent.NODE_CREATED, handleNodeCreated);
      unsubscribe(WebSocketEvent.NODE_UPDATED, handleNodeUpdated);
      unsubscribe(WebSocketEvent.NODE_DELETED, handleNodeDeleted);
      unsubscribe(WebSocketEvent.NODE_STATUS_CHANGED, handleNodeStatusChanged);
    };
  }, []);

  /**
   * 处理删除操作
   */
  const handleDelete = async (id: string) => {
    try {
      await nodesAPI.delete([Number(id)]);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的节点');
      return;
    }

    try {
      await nodesAPI.delete(selectedRowKeys.map(key => Number(key)));
      message.success(`成功删除 ${selectedRowKeys.length} 个节点`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 设置节点状态
   */
  const handleSetStatus = async (id: string, status: 'online' | 'offline' | 'maintenance') => {
    try {
      await nodesAPI.setStatus(Number(id), status);
      message.success('状态更新成功');
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 打开添加节点抽屉
   */
  const handleAdd = () => {
    setEditingNode(null);
    form.resetFields();
    setSubIPs([]);
    setDrawerVisible(true);
  };

  /**
   * 打开编辑节点抽屉
   */
  const handleEdit = (record: NodeItem) => {
    setEditingNode(record);
    form.setFieldsValue({
      name: record.name,
      ip: record.ip,
      managementPort: record.managementPort,
    });
    setSubIPs(record.subIPs || []);
    setDrawerVisible(true);
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const data = {
        ...values,
        subIPs: subIPs.map(s => ({ ip: s.ip, enabled: s.enabled })),
      };

      if (editingNode) {
        await nodesAPI.update({
          id: Number(editingNode.id),
          ...data,
        });
        message.success('更新成功');
      } else {
        await nodesAPI.create(data);
        message.success('添加成功');
      }

      setDrawerVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 添加子 IP
   */
  const handleAddSubIP = () => {
    const newSubIP: SubIP = {
      id: `temp-${Date.now()}`,
      ip: '',
      enabled: true,
    };
    setSubIPs([...subIPs, newSubIP]);
  };

  /**
   * 删除子 IP
   */
  const handleRemoveSubIP = (id: string) => {
    setSubIPs(subIPs.filter(s => s.id !== id));
  };

  /**
   * 更新子 IP
   */
  const handleUpdateSubIP = (id: string, field: keyof SubIP, value: any) => {
    setSubIPs(subIPs.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  /**
   * ProTable 数据请求
   */
  const request = async (params: any, sort: any, filter: any) => {
    try {
      const response = await nodesAPI.list({
        page: params.current,
        pageSize: params.pageSize,
        name: params.name,
        ip: params.ip,
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

  /**
   * 子 IP 表格列定义
   */
  const subIPColumns = [
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建日期',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 150,
    },
  ];

  /**
   * 表格列定义
   */
  const columns: ProColumns<NodeItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: '节点名称',
      dataIndex: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      width: 150,
      copyable: true,
    },
    {
      title: '管理端口',
      dataIndex: 'managementPort',
      width: 120,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: {
        online: { text: '在线', status: 'Success' },
        offline: { text: '离线', status: 'Error' },
        maintenance: { text: '维护中', status: 'Warning' },
      },
    },
    {
      title: '子 IP 数量',
      key: 'subIPCount',
      width: 120,
      search: false,
      render: (_, record) => record.subIPs?.length || 0,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 280,
      fixed: 'right',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm
          key="online"
          title="确定要设置为在线状态吗？"
          onConfirm={() => handleSetStatus(record.id, 'online')}
          okText="确定"
          cancelText="取消"
          disabled={record.status === 'online'}
        >
          <a style={{ color: record.status === 'online' ? '#ccc' : undefined }}>上线</a>
        </Popconfirm>,
        <Popconfirm
          key="offline"
          title="确定要设置为离线状态吗？"
          onConfirm={() => handleSetStatus(record.id, 'offline')}
          okText="确定"
          cancelText="取消"
          disabled={record.status === 'offline'}
        >
          <a style={{ color: record.status === 'offline' ? '#ccc' : undefined }}>下线</a>
        </Popconfirm>,
        <Popconfirm
          key="delete"
          title="确定要删除这个节点吗？"
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
      <ProTable<NodeItem>
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
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
          expandedRowRender: (record) => (
            <div style={{ padding: '16px 48px' }}>
              <h4>子 IP 列表</h4>
              {record.subIPs && record.subIPs.length > 0 ? (
                <Table
                  columns={subIPColumns}
                  dataSource={record.subIPs}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <div style={{ color: '#999', padding: '16px 0' }}>暂无子 IP</div>
              )}
            </div>
          ),
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        tableAlertRender={({ selectedRowKeys }) => (
          <Space>
            <span>已选择 {selectedRowKeys.length} 项</span>
            <a onClick={() => setSelectedRowKeys([])}>取消选择</a>
          </Space>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <Popconfirm
              title={`确定要删除选中的 ${selectedRowKeys.length} 个节点吗？`}
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <a style={{ color: 'red' }}>批量删除</a>
            </Popconfirm>
          </Space>
        )}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={handleAdd}>
            添加节点
          </Button>,
        ]}
        headerTitle={
          <Space>
            节点管理
            {wsConnected && <Tag color="success">实时连接</Tag>}
            {!wsConnected && <Tag color="warning">未连接</Tag>}
          </Space>
        }
      />

      {/* 添加/编辑节点抽屉 */}
      <Drawer
        title={editingNode ? '编辑节点' : '添加节点'}
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              {editingNode ? '保存' : '添加'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="节点名称"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="Node-01" />
          </Form.Item>

          <Form.Item
            name="ip"
            label="IP 地址"
            rules={[
              { required: true, message: '请输入 IP 地址' },
              { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入有效的 IP 地址' },
            ]}
          >
            <Input placeholder="192.168.1.10" />
          </Form.Item>

          <Form.Item
            name="managementPort"
            label="管理端口"
            rules={[{ required: true, message: '请输入管理端口' }]}
            initialValue={80}
          >
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="子 IP 列表">
            <Space direction="vertical" style={{ width: '100%' }}>
              {subIPs.map((subIP, index) => (
                <Space key={subIP.id} style={{ width: '100%' }}>
                  <Input
                    placeholder="192.168.1.11"
                    value={subIP.ip}
                    onChange={(e) => handleUpdateSubIP(subIP.id, 'ip', e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Switch
                    checked={subIP.enabled}
                    onChange={(checked) => handleUpdateSubIP(subIP.id, 'enabled', checked)}
                    checkedChildren="启用"
                    unCheckedChildren="停用"
                  />
                  <Button danger onClick={() => handleRemoveSubIP(subIP.id)}>
                    删除
                  </Button>
                </Space>
              ))}
              <Button type="dashed" onClick={handleAddSubIP} style={{ width: '100%' }}>
                + 添加子 IP
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default NodesPage;
