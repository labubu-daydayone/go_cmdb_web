import { PlusOutlined, EditOutlined, DeleteOutlined, PlusCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Space, Drawer, Form, Input, InputNumber, Table } from 'antd';
import { useRef, useState } from 'react';

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
 * 生成 mock 数据
 */
const generateMockNodes = (): NodeItem[] => {
  return [
    {
      id: '1',
      name: 'Node-01',
      ip: '192.168.1.10',
      managementPort: 80,
      status: 'online',
      subIPs: [
        { id: 'sub-1-1', ip: '192.168.1.11', enabled: true, createdDate: '2024-01-01' },
        { id: 'sub-1-2', ip: '192.168.1.12', enabled: true, createdDate: '2024-01-02' },
      ],
    },
    {
      id: '2',
      name: 'Node-02',
      ip: '192.168.1.20',
      managementPort: 80,
      status: 'online',
      subIPs: [
        { id: 'sub-2-1', ip: '192.168.1.21', enabled: true, createdDate: '2024-01-03' },
      ],
    },
    {
      id: '3',
      name: 'Node-03',
      ip: '192.168.1.30',
      managementPort: 8080,
      status: 'offline',
      subIPs: [],
    },
  ];
};

/**
 * 节点管理页面
 */
const NodesPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [nodes, setNodes] = useState<NodeItem[]>(generateMockNodes());
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeItem | null>(null);
  const [subIPs, setSubIPs] = useState<SubIP[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  /**
   * 处理删除操作
   */
  const handleDelete = async (id: string) => {
    try {
      setNodes((prev) => prev.filter((n) => n.id !== id));
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
      setNodes((prev) => prev.filter((n) => !selectedRowKeys.includes(n.id)));
      message.success(`成功删除 ${selectedRowKeys.length} 个节点`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  /**
   * 处理编辑操作
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
   * 处理添加节点
   */
  const handleAdd = () => {
    setEditingNode(null);
    form.resetFields();
    setSubIPs([]);
    setDrawerVisible(true);
  };

  /**
   * 添加子 IP
   */
  const handleAddSubIP = () => {
    setSubIPs([
      ...subIPs,
      { id: Date.now().toString(), ip: '', enabled: true, createdDate: new Date().toLocaleDateString('zh-CN') },
    ]);
  };

  /**
   * 删除子 IP
   */
  const handleRemoveSubIP = (id: string) => {
    setSubIPs(subIPs.filter((subIP) => subIP.id !== id));
  };

  /**
   * 更新子 IP
   */
  const handleUpdateSubIP = (id: string, field: keyof SubIP, value: any) => {
    setSubIPs(subIPs.map((subIP) => (subIP.id === id ? { ...subIP, [field]: value } : subIP)));
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingNode) {
        // 编辑模式
        setNodes((prev) =>
          prev.map((n) =>
            n.id === editingNode.id
              ? {
                  ...n,
                  name: values.name,
                  ip: values.ip,
                  managementPort: values.managementPort,
                  subIPs: subIPs.filter((s) => s.ip.trim()),
                }
              : n
          )
        );
        message.success('节点更新成功');
      } else {
        // 添加模式
        const newNode: NodeItem = {
          id: Date.now().toString(),
          name: values.name,
          ip: values.ip,
          managementPort: values.managementPort,
          status: 'online',
          subIPs: subIPs.filter((s) => s.ip.trim()),
        };
        setNodes((prev) => [newNode, ...prev]);
        message.success('节点添加成功');
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
  const columns: ProColumns<NodeItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 200,
      copyable: true,
    },
    {
      title: '端口',
      dataIndex: 'managementPort',
      key: 'managementPort',
      width: 100,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 200,
      valueType: 'select',
      valueEnum: {
        online: { text: '在线', status: 'Success' },
        offline: { text: '离线', status: 'Error' },
        maintenance: { text: '维护中', status: 'Warning' },
      },
      render: (_, record) => {
        const statusMap = {
          online: { color: 'success', text: '在线' },
          offline: { color: 'error', text: '离线' },
          maintenance: { color: 'warning', text: '维护中' },
        };
        const status = statusMap[record.status];
        return (
          <Space>
            <Tag color={status.color}>{status.text}</Tag>
            <Popconfirm
              title={record.status === 'online' ? '禁用节点' : '启用节点'}
              description={record.status === 'online' ? '禁用后所有子IP也将被禁用，是否继续？' : '启用后所有子IP也将被启用，是否继续？'}
              onConfirm={() => {
                const newStatus = record.status === 'online' ? 'offline' : 'online';
                handleToggleNodeStatus(record.id, newStatus);
                message.success(`节点已${newStatus === 'online' ? '启用' : '禁用'}`);
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" type="link">
                {record.status === 'online' ? '禁用' : '启用'}
              </Button>
            </Popconfirm>
          </Space>
        );
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
          title="确定要删除这个节点吗？"
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
   * 切换节点状态
   */
  const handleToggleNodeStatus = (nodeId: string, newStatus: 'online' | 'offline' | 'maintenance') => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === nodeId) {
          // 节点禁用时，所有子 IP 也禁用
          // 节点启用时，所有子 IP 也启用
          const updatedSubIPs = newStatus === 'offline'
            ? (node.subIPs || []).map((subIP) => ({ ...subIP, enabled: false }))
            : newStatus === 'online'
            ? (node.subIPs || []).map((subIP) => ({ ...subIP, enabled: true }))
            : node.subIPs;
          return { ...node, status: newStatus, subIPs: updatedSubIPs };
        }
        return node;
      })
    );
    actionRef.current?.reload();
  };

  /**
   * 切换子 IP 状态
   */
  const handleToggleSubIPStatus = (nodeId: string, subIPId: string) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === nodeId) {
          const updatedSubIPs = (node.subIPs || []).map((subIP) =>
            subIP.id === subIPId ? { ...subIP, enabled: !subIP.enabled } : subIP
          );
          return { ...node, subIPs: updatedSubIPs };
        }
        return node;
      })
    );
    actionRef.current?.reload();
  };

  /**
   * 子 IP 表格列配置
   */
  const getSubIPColumns = (nodeId: string, nodeStatus: string) => [
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: SubIP) => (
        <Space>
          <Tag color={enabled ? 'success' : 'default'}>{enabled ? '启用' : '禁用'}</Tag>
          {nodeStatus !== 'offline' && (
            <Popconfirm
              title={enabled ? '禁用子IP' : '启用子IP'}
              description={`确定要${enabled ? '禁用' : '启用'}该子IP吗？`}
              onConfirm={() => {
                handleToggleSubIPStatus(nodeId, record.id);
                message.success(`子IP已${enabled ? '禁用' : '启用'}`);
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" type="link">
                {enabled ? '禁用' : '启用'}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
    {
      title: '创建日期',
      dataIndex: 'createdDate',
      key: 'createdDate',
    },
  ];

  /**
   * 请求数据
   */
  const request = async (params: any, sort: any, filter: any) => {
    // 使用 mock 数据
    return {
      data: nodes,
      success: true,
      total: nodes.length,
    };
  };

  /**
   * 展开行渲染
   */
  const expandedRowRender = (record: NodeItem) => {
    if (!record.subIPs || record.subIPs.length === 0) {
      return <div style={{ padding: '16px', color: '#999' }}>暂无子 IP</div>;
    }
    return (
      <Table
        columns={getSubIPColumns(record.id, record.status)}
        dataSource={record.subIPs}
        pagination={false}
        rowKey="id"
        size="small"
      />
    );
  };

  return (
    <>
      <ProTable<NodeItem>
        headerTitle="节点管理"
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
              title={`确定要删除选中的 ${selectedRowKeys.length} 个节点吗？`}
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
            添加节点
          </Button>,
        ]}
        request={request}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        expandable={{
          expandedRowRender,
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
        }}
        pagination={{
          defaultPageSize: 15,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      {/* 添加/编辑节点抽屉 */}
      <Drawer
        title={editingNode ? '编辑节点' : '添加节点'}
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setDrawerVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleSubmit}>
                {editingNode ? '保存' : '提交'}
              </Button>
            </Space>
          </div>
        }
        destroyOnClose
      >
        <div style={{ padding: '0 24px' }}>
          <Form form={form} layout="horizontal" labelCol={{ span: 3 }} wrapperCol={{ span: 21 }}>
            {/* 节点名称 */}
            <Form.Item
              name="name"
              label="名称"
              rules={[{ required: true, message: '请输入节点名称' }]}
            >
              <Input placeholder="例如：Node-01" />
            </Form.Item>

            {/* IP 地址 */}
            <Form.Item
              name="ip"
              label="IP"
              rules={[
                { required: true, message: '请输入 IP 地址' },
                {
                  pattern: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                  message: '请输入有效的 IP 地址',
                },
              ]}
            >
              <Input placeholder="192.168.1.1" />
            </Form.Item>

            {/* 端口 */}
            <Form.Item
              name="managementPort"
              label="端口"
              initialValue={80}
              rules={[{ required: true, message: '请输入端口' }]}
            >
              <InputNumber min={1} max={65535} style={{ width: '100%' }} placeholder="80" />
            </Form.Item>

            {/* 子 IP 列表 */}
            <Form.Item label="子IP列表">
              <div>
                <Button
                  type="dashed"
                  icon={<PlusCircleOutlined />}
                  onClick={handleAddSubIP}
                  style={{ marginBottom: 16, width: '100%' }}
                >
                  添加子 IP
                </Button>
                {subIPs.map((subIP, index) => (
                  <div
                    key={subIP.id}
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                    }}
                  >
                    <Space style={{ width: '100%' }}>
                      <Input
                        placeholder="请输入子 IP 地址"
                        value={subIP.ip}
                        onChange={(e) => handleUpdateSubIP(subIP.id, 'ip', e.target.value)}
                        style={{ width: 200 }}
                      />
                      <Button danger onClick={() => handleRemoveSubIP(subIP.id)}>
                        删除
                      </Button>
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

export default NodesPage;
