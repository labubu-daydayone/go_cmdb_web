import { useRef, useState, useEffect } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Space, Drawer, Form, Input, Select, InputNumber } from 'antd';
import { originGroupsAPI } from '@/services/api';
import { connectWebSocket, subscribe, unsubscribe } from '@/utils/websocket';

/**
 * 回源地址类型
 */
type OriginAddress = {
  id: string;
  type: '主源' | '备源';
  protocol: 'http' | 'https';
  ip: string;
  port: number;
  weight: number;
};

/**
 * 回源分组类型
 */
export type OriginGroupItem = {
  id: string;
  name: string;
  type: '主源' | '备源' | '活跃';
  addresses: OriginAddress[];
  description: string;
  status: 'active' | 'inactive';
};

/**
 * 回源分组管理页面
 */
const OriginGroupsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OriginGroupItem | null>(null);
  const [addresses, setAddresses] = useState<OriginAddress[]>([
    { id: '1', type: '主源', protocol: 'http', ip: '', port: 80, weight: 10 },
  ]);
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

    // 订阅回源分组相关事件
    const handleGroupCreated = () => {
      message.info('检测到新回源分组创建');
      actionRef.current?.reload();
    };
    const handleGroupUpdated = () => {
      message.info('检测到回源分组更新');
      actionRef.current?.reload();
    };
    const handleGroupDeleted = () => {
      message.info('检测到回源分组删除');
      actionRef.current?.reload();
    };

    subscribe(WebSocketEvent.ORIGIN_GROUP_CREATED, handleGroupCreated);
    subscribe(WebSocketEvent.ORIGIN_GROUP_UPDATED, handleGroupUpdated);
    subscribe(WebSocketEvent.ORIGIN_GROUP_DELETED, handleGroupDeleted);

    return () => {
      unsubscribe(WebSocketEvent.ORIGIN_GROUP_CREATED, handleGroupCreated);
      unsubscribe(WebSocketEvent.ORIGIN_GROUP_UPDATED, handleGroupUpdated);
      unsubscribe(WebSocketEvent.ORIGIN_GROUP_DELETED, handleGroupDeleted);
    };
  }, []);

  /**
   * 处理删除操作
   */
  const handleDelete = async (id: string) => {
    try {
      await originGroupsAPI.delete([Number(id)]);
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
      message.warning('请选择要删除的回源分组');
      return;
    }

    try {
      await originGroupsAPI.delete(selectedRowKeys.map(key => Number(key)));
      message.success(`成功删除 ${selectedRowKeys.length} 个回源分组`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 打开添加回源分组抽屉
   */
  const handleAdd = () => {
    setEditingGroup(null);
    form.resetFields();
    setAddresses([{ id: '1', type: '主源', protocol: 'http', ip: '', port: 80, weight: 10 }]);
    setDrawerVisible(true);
  };

  /**
   * 打开编辑回源分组抽屉
   */
  const handleEdit = (record: OriginGroupItem) => {
    setEditingGroup(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      description: record.description,
      status: record.status,
    });
    setAddresses(record.addresses || [{ id: '1', type: '主源', protocol: 'http', ip: '', port: 80, weight: 10 }]);
    setDrawerVisible(true);
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 验证至少有一个地址
      const validAddresses = addresses.filter(addr => addr.ip.trim() !== '');
      if (validAddresses.length === 0) {
        message.warning('请至少添加一个回源地址');
        return;
      }

      const data = {
        name: values.name,
        type: values.type,
        description: values.description,
        status: values.status,
        addresses: validAddresses.map(addr => ({
          type: addr.type,
          protocol: addr.protocol,
          address: `${addr.ip}:${addr.port}`,
          weight: addr.weight,
        })),
      };

      if (editingGroup) {
        await originGroupsAPI.update({
          id: Number(editingGroup.id),
          ...data,
        });
        message.success('更新成功');
      } else {
        await originGroupsAPI.create(data);
        message.success('添加成功');
      }

      setDrawerVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 添加回源地址
   */
  const handleAddAddress = () => {
    const newAddress: OriginAddress = {
      id: `${Date.now()}`,
      type: '主源',
      protocol: 'http',
      ip: '',
      port: 80,
      weight: 10,
    };
    setAddresses([...addresses, newAddress]);
  };

  /**
   * 删除回源地址
   */
  const handleRemoveAddress = (id: string) => {
    if (addresses.length === 1) {
      message.warning('至少保留一个回源地址');
      return;
    }
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  /**
   * 更新回源地址
   */
  const handleUpdateAddress = (id: string, field: keyof OriginAddress, value: any) => {
    setAddresses(addresses.map(addr => addr.id === id ? { ...addr, [field]: value } : addr));
  };

  /**
   * ProTable 数据请求
   */
  const request = async (params: any, sort: any, filter: any) => {
    try {
      const response = await originGroupsAPI.list({
        page: params.current,
        pageSize: params.pageSize,
        name: params.name,
        type: params.type,
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
   * 表格列定义
   */
  const columns: ProColumns<OriginGroupItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: '分组名称',
      dataIndex: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: {
        '主源': { text: '主源', status: 'Success' },
        '备源': { text: '备源', status: 'Warning' },
        '活跃': { text: '活跃', status: 'Processing' },
      },
    },
    {
      title: '回源地址',
      key: 'addresses',
      width: 300,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.addresses.map((addr, index) => (
            <Tag key={index} color={addr.type === '主源' ? 'blue' : 'orange'}>
              {addr.protocol}://{addr.ip}:{addr.port} (权重: {addr.weight})
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 200,
      search: false,
      ellipsis: true,
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
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定要删除这个回源分组吗？"
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
      <ProTable<OriginGroupItem>
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
              title={`确定要删除选中的 ${selectedRowKeys.length} 个回源分组吗？`}
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
            添加回源分组
          </Button>,
        ]}
        headerTitle={
          <Space>
            回源分组管理
            {wsConnected && <Tag color="success">实时连接</Tag>}
            {!wsConnected && <Tag color="warning">未连接</Tag>}
          </Space>
        }
      />

      {/* 添加/编辑回源分组抽屉 */}
      <Drawer
        title={editingGroup ? '编辑回源分组' : '添加回源分组'}
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              {editingGroup ? '保存' : '添加'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="标准回源" />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
            initialValue="主源"
          >
            <Select>
              <Select.Option value="主源">主源</Select.Option>
              <Select.Option value="备源">备源</Select.Option>
              <Select.Option value="活跃">活跃</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="回源地址" required>
            <Space direction="vertical" style={{ width: '100%' }}>
              {addresses.map((addr) => (
                <div key={addr.id} style={{ padding: 16, border: '1px solid #d9d9d9', borderRadius: 4 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Select
                        value={addr.type}
                        onChange={(value) => handleUpdateAddress(addr.id, 'type', value)}
                        style={{ width: 100 }}
                      >
                        <Select.Option value="主源">主源</Select.Option>
                        <Select.Option value="备源">备源</Select.Option>
                      </Select>
                      <Select
                        value={addr.protocol}
                        onChange={(value) => handleUpdateAddress(addr.id, 'protocol', value)}
                        style={{ width: 100 }}
                      >
                        <Select.Option value="http">HTTP</Select.Option>
                        <Select.Option value="https">HTTPS</Select.Option>
                      </Select>
                    </Space>
                    <Space>
                      <Input
                        placeholder="IP 地址"
                        value={addr.ip}
                        onChange={(e) => handleUpdateAddress(addr.id, 'ip', e.target.value)}
                        style={{ width: 200 }}
                      />
                      <InputNumber
                        placeholder="端口"
                        value={addr.port}
                        onChange={(value) => handleUpdateAddress(addr.id, 'port', value || 80)}
                        min={1}
                        max={65535}
                        style={{ width: 100 }}
                      />
                      <InputNumber
                        placeholder="权重"
                        value={addr.weight}
                        onChange={(value) => handleUpdateAddress(addr.id, 'weight', value || 10)}
                        min={1}
                        max={100}
                        style={{ width: 100 }}
                      />
                    </Space>
                    <Button danger onClick={() => handleRemoveAddress(addr.id)}>
                      删除
                    </Button>
                  </Space>
                </div>
              ))}
              <Button type="dashed" onClick={handleAddAddress} style={{ width: '100%' }}>
                + 添加回源地址
              </Button>
            </Space>
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="默认回源配置" />
          </Form.Item>

          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default OriginGroupsPage;
