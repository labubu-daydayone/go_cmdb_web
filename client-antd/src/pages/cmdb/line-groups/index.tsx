import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Space, Drawer, Form, Input, Select, Row, Col } from 'antd';
import { useRef, useState } from 'react';

/**
 * 线路分组类型
 */
export type LineGroupItem = {
  id: string;
  name: string;
  nodeGroups: string[];
  cname: string;
  nodeCount: number;
};

/**
 * 生成 mock 数据
 */
const generateMockLineGroups = (): LineGroupItem[] => {
  return [
    {
      id: '1',
      name: '线路1',
      nodeGroups: ['节点分组1', '节点分组2'],
      cname: 'cdn1.example.com',
      nodeCount: 10,
    },
    {
      id: '2',
      name: '线路2',
      nodeGroups: ['节点分组3'],
      cname: 'cdn2.example.com',
      nodeCount: 5,
    },
    {
      id: '3',
      name: '线路3',
      nodeGroups: ['节点分组1', '节点分组3', '节点分组4'],
      cname: 'cdn3.example.com',
      nodeCount: 15,
    },
  ];
};

/**
 * 线路分组页面
 */
const LineGroupsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lineGroups, setLineGroups] = useState<LineGroupItem[]>(generateMockLineGroups());
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LineGroupItem | null>(null);

  // 可用的节点分组列表
  const availableNodeGroups = [
    { label: '节点分组1', value: '节点分组1' },
    { label: '节点分组2', value: '节点分组2' },
    { label: '节点分组3', value: '节点分组3' },
    { label: '节点分组4', value: '节点分组4' },
    { label: '节点分组5', value: '节点分组5' },
    { label: '节点分组6', value: '节点分组6' },
  ];

  // 可用的域名列表（来自 DNS 设置）
  const availableDomains = [
    { label: 'example.com', value: 'example.com' },
    { label: 'test.com', value: 'test.com' },
    { label: 'api.example.com', value: 'api.example.com' },
    { label: 'cdn.example.com', value: 'cdn.example.com' },
  ];

  // 生成随机 CNAME 前缀
  const generateCNAMEPrefix = () => {
    const randomStr = Math.random().toString(36).substring(2, 8);
    return randomStr;
  };

  /**
   * 处理删除操作
   */
  const handleDelete = async (id: string) => {
    try {
      setLineGroups((prev) => prev.filter((g) => g.id !== id));
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
      setLineGroups((prev) => prev.filter((g) => !selectedRowKeys.includes(g.id)));
      message.success(`成功删除 ${selectedRowKeys.length} 个线路分组`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  /**
   * 处理编辑操作
   */
  const handleEdit = (record: LineGroupItem) => {
    setEditingGroup(record);
    form.setFieldsValue({
      name: record.name,
      nodeGroup: record.nodeGroups[0], // 单选，取第一个
      cnamePrefix: record.cname.split('.')[0],
      domain: record.cname.split('.').slice(1).join('.'),
    });
    setDrawerVisible(true);
  };

  /**
   * 处理添加
   */
  const handleAdd = () => {
    setEditingGroup(null);
    form.resetFields();
    // 生成随机 CNAME 前缀
    const randomPrefix = Math.random().toString(36).substring(2, 8);
    form.setFieldsValue({
      cnamePrefix: randomPrefix,
      domain: 'example.com',
    });
    setDrawerVisible(true);
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const cname = `${values.cnamePrefix}.${values.domain}`;

      if (editingGroup) {
        // 编辑模式
        setLineGroups((prev) =>
          prev.map((g) =>
            g.id === editingGroup.id
              ? {
                  ...g,
                  name: values.name,
                  nodeGroups: [values.nodeGroup], // 单选，转为数组
                  cname,
                }
              : g
          )
        );
        message.success('线路分组更新成功');
      } else {
        // 添加模式
        const newGroup: LineGroupItem = {
          id: Date.now().toString(),
          name: values.name,
          nodeGroups: [values.nodeGroup], // 单选，转为数组
          cname,
          nodeCount: Math.floor(Math.random() * 20) + 1,
        };
        setLineGroups((prev) => [newGroup, ...prev]);
        message.success('线路分组添加成功');
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
  const columns: ProColumns<LineGroupItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '节点组',
      dataIndex: 'nodeGroups',
      key: 'nodeGroups',
      width: 250,
      hideInSearch: true,
      render: (_, record) => (
        <Space size={[0, 4]} wrap>
          {record.nodeGroups.map((group, index) => (
            <Tag key={index} color="blue">
              {group}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'CNAME',
      dataIndex: 'cname',
      key: 'cname',
      width: 200,
      copyable: true,
    },
    {
      title: '节点数量',
      dataIndex: 'nodeCount',
      key: 'nodeCount',
      width: 120,
      hideInSearch: true,
      sorter: (a, b) => a.nodeCount - b.nodeCount,
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
          title="确定要删除这个线路分组吗？"
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
    return {
      data: lineGroups,
      success: true,
      total: lineGroups.length,
    };
  };

  return (
    <>
      <ProTable<LineGroupItem>
        headerTitle="线路分组"
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
              title={`确定要删除选中的 ${selectedRowKeys.length} 个线路分组吗？`}
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

      {/* 添加/编辑线路分组抽屉 */}
      <Drawer
        title={editingGroup ? '编辑线路分组' : '添加线路分组'}
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
          <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            {/* 名称 */}
            <Form.Item
              name="name"
              label="名称"
              rules={[{ required: true, message: '请输入线路分组名称' }]}
            >
              <Input placeholder="输入线路分组名称" style={{ width: 240 }} />
            </Form.Item>

            {/* 解析记录 */}
            <Form.Item label="解析记录" required>
              <Row gutter={8} align="middle">
                <Col>
                  <Form.Item
                    name="cnamePrefix"
                    noStyle
                    rules={[{ required: true, message: '请输入前缀' }]}
                  >
                    <Input placeholder="前缀" style={{ width: 140 }} />
                  </Form.Item>
                </Col>
                <Col>
                  <span style={{ color: '#999' }}>.</span>
                </Col>
                <Col>
                  <Form.Item
                    name="domain"
                    noStyle
                    rules={[{ required: true, message: '请选择域名' }]}
                  >
                    <Select
                      placeholder="-- 请选择域名 --"
                      options={availableDomains}
                      style={{ width: 180 }}
                    />
                  </Form.Item>
                </Col>
                <Col>
                  <Button
                    onClick={() => {
                      form.setFieldsValue({ cnamePrefix: generateCNAMEPrefix() });
                    }}
                  >
                    生成
                  </Button>
                </Col>
              </Row>
            </Form.Item>

            {/* 添加节点分组 */}
            <Form.Item
              name="nodeGroup"
              label="添加节点分组"
              rules={[{ required: true, message: '请选择节点分组' }]}
            >
              <Select
                placeholder="请选择节点分组"
                options={availableNodeGroups}
              />
            </Form.Item>
          </Form>
        </div>
      </Drawer>
    </>
  );
};

export default LineGroupsPage;
