import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Space, Drawer, Form, Input, Select, InputNumber } from 'antd';
import { useRef, useState } from 'react';

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
 * 生成 mock 数据
 */
const generateMockOriginGroups = (): OriginGroupItem[] => {
  return [
    {
      id: '1',
      name: '标准回源',
      type: '主源',
      addresses: [
        { id: '1-1', type: '主源', protocol: 'http', ip: '192.168.1.1', port: 80, weight: 10 },
      ],
      description: '默认回源配置',
      status: 'active',
    },
    {
      id: '2',
      name: '高可用回源',
      type: '活跃',
      addresses: [
        { id: '2-1', type: '主源', protocol: 'http', ip: '192.168.1.2', port: 80, weight: 10 },
        { id: '2-2', type: '备源', protocol: 'http', ip: '192.168.1.3', port: 80, weight: 5 },
      ],
      description: '多源站高可用配置',
      status: 'active',
    },
    {
      id: '3',
      name: '加速回源',
      type: '备源',
      addresses: [
        { id: '3-1', type: '备源', protocol: 'https', ip: '192.168.1.3', port: 443, weight: 5 },
      ],
      description: '优化加速的回源配置',
      status: 'inactive',
    },
  ];
};

/**
 * 回源分组管理页面
 */
const OriginGroupsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [originGroups, setOriginGroups] = useState<OriginGroupItem[]>(generateMockOriginGroups());
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OriginGroupItem | null>(null);
  const [addresses, setAddresses] = useState<OriginAddress[]>([
    { id: '1', type: '主源', protocol: 'http', ip: '', port: 80, weight: 10 },
  ]);

  /**
   * 处理删除操作
   */
  const handleDelete = async (id: string) => {
    try {
      setOriginGroups((prev) => prev.filter((g) => g.id !== id));
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
      setOriginGroups((prev) => prev.filter((g) => !selectedRowKeys.includes(g.id)));
      message.success(`成功删除 ${selectedRowKeys.length} 个分组`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  /**
   * 处理编辑操作
   */
  const handleEdit = (record: OriginGroupItem) => {
    setEditingGroup(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setAddresses(record.addresses);
    setDrawerVisible(true);
  };

  /**
   * 处理添加分组
   */
  const handleAdd = () => {
    setEditingGroup(null);
    form.resetFields();
    setAddresses([
      { id: '1', type: '主源', protocol: 'http', ip: '', port: 80, weight: 10 },
    ]);
    setDrawerVisible(true);
  };

  /**
   * 添加回源地址
   */
  const handleAddAddress = () => {
    setAddresses([
      ...addresses,
      { id: Date.now().toString(), type: '主源', protocol: 'http', ip: '', port: 80, weight: 10 },
    ]);
  };

  /**
   * 删除回源地址
   */
  const handleRemoveAddress = (id: string) => {
    if (addresses.length > 1) {
      setAddresses(addresses.filter((addr) => addr.id !== id));
    } else {
      message.warning('至少保留一个回源地址');
    }
  };

  /**
   * 更新回源地址
   */
  const handleUpdateAddress = (id: string, field: keyof OriginAddress, value: any) => {
    setAddresses(
      addresses.map((addr) => (addr.id === id ? { ...addr, [field]: value } : addr))
    );
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证至少有一个有效的回源地址
      const validAddresses = addresses.filter((addr) => addr.ip.trim());
      if (validAddresses.length === 0) {
        message.error('请至少添加一个有效的回源地址');
        return;
      }

      if (editingGroup) {
        // 编辑模式
        setOriginGroups((prev) =>
          prev.map((g) =>
            g.id === editingGroup.id
              ? {
                  ...g,
                  name: values.name,
                  description: values.description,
                  addresses: validAddresses,
                  type: validAddresses[0].type,
                }
              : g
          )
        );
        message.success('分组更新成功');
      } else {
        // 添加模式
        const newGroup: OriginGroupItem = {
          id: Date.now().toString(),
          name: values.name,
          description: values.description,
          addresses: validAddresses,
          type: validAddresses[0].type,
          status: 'active',
        };
        setOriginGroups((prev) => [newGroup, ...prev]);
        message.success('分组添加成功');
      }

      setDrawerVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<OriginGroupItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '地址',
      dataIndex: 'addresses',
      key: 'addresses',
      width: 400,
      hideInSearch: true,
      render: (_, record) => {
        return (
          <div style={{ maxHeight: 100, overflowY: 'auto' }}>
            {record.addresses.map((addr, index) => (
              <div key={addr.id} style={{ marginBottom: 4 }}>
                <Tag color={addr.type === '主源' ? 'blue' : 'orange'}>{addr.type}</Tag>
                <Tag color={addr.protocol === 'https' ? 'green' : 'default'}>{addr.protocol.toUpperCase()}</Tag>
                <span style={{ marginLeft: 8 }}>
                  {addr.ip}:{addr.port} (权重: {addr.weight})
                </span>

              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        inactive: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => {
        const statusMap = {
          active: { color: 'success', text: '启用' },
          inactive: { color: 'default', text: '禁用' },
        };
        const status = statusMap[record.status];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个分组吗？"
          description="删除后无法恢复，是否继续？"
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
    // 使用 mock 数据
    return {
      data: originGroups,
      success: true,
      total: originGroups.length,
    };
  };

  return (
    <>
      <ProTable<OriginGroupItem>
        headerTitle="回源分组"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        form={{
          syncToUrl: true,
        }}
        scroll={{ x: 'max-content' }}
        toolBarRender={() => [
          selectedRowKeys.length > 0 && (
            <Popconfirm
              key="batchDelete"
              title={`确定要删除选中的 ${selectedRowKeys.length} 个分组吗？`}
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button type="primary" danger>
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          ),
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加分组
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

      {/* 添加/编辑分组抽屉 */}
      <Drawer
        title={editingGroup ? '编辑回源分组' : '添加回源分组'}
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setDrawerVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleSubmit}>
                {editingGroup ? '保存' : '提交'}
              </Button>
            </Space>
          </div>
        }
        destroyOnClose
      >
        <div style={{ padding: '0 24px' }}>
          <Form form={form} layout="horizontal" labelCol={{ span: 3 }} wrapperCol={{ span: 21 }}>
            {/* 分组名称 */}
            <Form.Item
              name="name"
              label="分组名称"
              rules={[{ required: true, message: '请输入分组名称' }]}
            >
              <Input placeholder="请输入分组名称" />
            </Form.Item>

            {/* 描述 */}
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={3} placeholder="请输入描述信息" />
            </Form.Item>

            {/* 回源地址列表 */}
            <Form.Item label="回源地址" required>
              <div>
                <Button
                  type="dashed"
                  onClick={handleAddAddress}
                  style={{ marginBottom: 16, width: '100%' }}
                >
                  + 添加回源
                </Button>
                {addresses.map((addr, index) => (
                  <div key={addr.id} style={{ marginBottom: 12 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space wrap style={{ width: '100%' }}>
                        <Select
                          value={addr.type}
                          onChange={(value) => handleUpdateAddress(addr.id, 'type', value)}
                          style={{ width: 95 }}
                        >
                          <Select.Option value="主源">主源</Select.Option>
                          <Select.Option value="备源">备源</Select.Option>
                        </Select>
                        <Select
                          value={addr.protocol}
                          onChange={(value) => handleUpdateAddress(addr.id, 'protocol', value)}
                          style={{ width: 95 }}
                        >
                          <Select.Option value="http">HTTP</Select.Option>
                          <Select.Option value="https">HTTPS</Select.Option>
                        </Select>
                        <Input
                          placeholder="IP 或域名"
                          value={addr.ip ? `${addr.ip}${addr.port && addr.port !== 80 ? ':' + addr.port : ''}` : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const parts = value.split(':');
                            handleUpdateAddress(addr.id, 'ip', parts[0]);
                            if (parts[1]) {
                              handleUpdateAddress(addr.id, 'port', Number(parts[1]));
                            } else {
                              handleUpdateAddress(addr.id, 'port', 80);
                            }
                          }}
                          style={{ width: 200 }}
                        />
                        <InputNumber
                          min={1}
                          max={100}
                          value={addr.weight}
                          onChange={(value) => handleUpdateAddress(addr.id, 'weight', value || 10)}
                          style={{ width: 75 }}
                          placeholder="权重"
                        />
                        {addresses.length > 1 && (
                          <Button danger onClick={() => handleRemoveAddress(addr.id)}>
                            删除
                          </Button>
                        )}
                      </Space>
                    </Space>
                  </div>
                ))}
              </div>
            </Form.Item>
          </Form>
        </div>
      </Drawer>
    </>
  );
};

export default OriginGroupsPage;
