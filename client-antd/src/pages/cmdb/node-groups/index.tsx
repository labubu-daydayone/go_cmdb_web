import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Drawer, Form, Input, Table, Tag } from 'antd';
import { useRef, useState } from 'react';

/**
 * 子 IP 类型
 */
type SubIP = {
  id: string;
  ip: string;
  createdDate: string;
};

/**
 * 节点分组类型
 */
export type NodeGroupItem = {
  id: string;
  name: string;
  description: string;
  subIPs: SubIP[];
  createdDate: string;
};

/**
 * 生成 mock 数据
 */
const generateMockNodeGroups = (): NodeGroupItem[] => {
  return [
    {
      id: '1',
      name: '节点分组1',
      description: '默认节点分组',
      subIPs: [
        { id: 'sub-1-1', ip: '192.168.1.11', createdDate: '2024-01-01' },
        { id: 'sub-1-2', ip: '192.168.1.12', createdDate: '2024-01-02' },
        { id: 'sub-1-3', ip: '192.168.1.13', createdDate: '2024-01-03' },
      ],
      createdDate: '2024-01-01',
    },
    {
      id: '2',
      name: '节点分组2',
      description: '备用节点分组',
      subIPs: [
        { id: 'sub-2-1', ip: '192.168.2.11', createdDate: '2024-01-05' },
        { id: 'sub-2-2', ip: '192.168.2.12', createdDate: '2024-01-06' },
      ],
      createdDate: '2024-01-05',
    },
    {
      id: '3',
      name: '节点分组3',
      description: '高可用节点分组',
      subIPs: [
        { id: 'sub-3-1', ip: '192.168.3.11', createdDate: '2024-01-10' },
      ],
      createdDate: '2024-01-10',
    },
  ];
};

/**
 * 节点分组页面
 */
const NodeGroupsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [nodeGroups, setNodeGroups] = useState<NodeGroupItem[]>(generateMockNodeGroups());
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<NodeGroupItem | null>(null);
  const [subIPs, setSubIPs] = useState<SubIP[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  /**
   * 处理删除操作
   */
  const handleDelete = async (id: string) => {
    try {
      setNodeGroups((prev) => prev.filter((g) => g.id !== id));
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
      setNodeGroups((prev) => prev.filter((g) => !selectedRowKeys.includes(g.id)));
      message.success(`成功删除 ${selectedRowKeys.length} 个节点分组`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  /**
   * 处理编辑操作
   */
  const handleEdit = (record: NodeGroupItem) => {
    setEditingGroup(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setSubIPs(record.subIPs || []);
    setDrawerVisible(true);
  };

  /**
   * 处理添加
   */
  const handleAdd = () => {
    setEditingGroup(null);
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
      { id: Date.now().toString(), ip: '', createdDate: new Date().toLocaleDateString('zh-CN') },
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
  const handleUpdateSubIP = (id: string, value: string) => {
    setSubIPs(subIPs.map((subIP) => (subIP.id === id ? { ...subIP, ip: value } : subIP)));
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingGroup) {
        // 编辑模式
        setNodeGroups((prev) =>
          prev.map((g) =>
            g.id === editingGroup.id
              ? {
                  ...g,
                  name: values.name,
                  description: values.description,
                  subIPs: subIPs.filter((s) => s.ip.trim()),
                }
              : g
          )
        );
        message.success('节点分组更新成功');
      } else {
        // 添加模式
        const newGroup: NodeGroupItem = {
          id: Date.now().toString(),
          name: values.name,
          description: values.description,
          subIPs: subIPs.filter((s) => s.ip.trim()),
          createdDate: new Date().toLocaleDateString('zh-CN'),
        };
        setNodeGroups((prev) => [newGroup, ...prev]);
        message.success('节点分组添加成功');
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
  const columns: ProColumns<NodeGroupItem>[] = [
    {
      title: '分组名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: true,
    },
    {
      title: '子 IP 数量',
      dataIndex: 'subIPs',
      key: 'subIPCount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.subIPs.length,
      sorter: (a, b) => a.subIPs.length - b.subIPs.length,
    },
    {
      title: '创建时间',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 150,
      hideInSearch: true,
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
          title="确定要删除这个节点分组吗？"
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
   * 子 IP 表格列配置
   */
  const subIPColumns = [
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
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
    return {
      data: nodeGroups,
      success: true,
      total: nodeGroups.length,
    };
  };

  /**
   * 展开行渲染
   */
  const expandedRowRender = (record: NodeGroupItem) => {
    if (!record.subIPs || record.subIPs.length === 0) {
      return <div style={{ padding: '16px', color: '#999' }}>暂无子 IP</div>;
    }
    return (
      <Table
        columns={subIPColumns}
        dataSource={record.subIPs}
        pagination={false}
        rowKey="id"
        size="small"
      />
    );
  };

  return (
    <>
      <ProTable<NodeGroupItem>
        headerTitle="节点分组"
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
              title={`确定要删除选中的 ${selectedRowKeys.length} 个节点分组吗？`}
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

      {/* 添加/编辑节点分组抽屉 */}
      <Drawer
        title={editingGroup ? '编辑节点分组' : '添加节点分组'}
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
          <Form form={form} layout="horizontal" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
            {/* 分组名称 */}
            <Form.Item
              name="name"
              label="分组名称"
              rules={[{ required: true, message: '请输入分组名称' }]}
            >
              <Input placeholder="例如：节点分组1" />
            </Form.Item>

            {/* 描述 */}
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={3} placeholder="请输入描述信息" />
            </Form.Item>

            {/* 子 IP 列表 */}
            <Form.Item label="子 IP 列表">
              <div>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddSubIP}
                  style={{ marginBottom: 16, width: '100%' }}
                >
                  添加子 IP
                </Button>
                {subIPs.map((subIP) => (
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
                        onChange={(e) => handleUpdateSubIP(subIP.id, e.target.value)}
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

export default NodeGroupsPage;
