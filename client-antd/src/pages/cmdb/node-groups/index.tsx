import { useState, useMemo } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Drawer, Form, Input, Transfer, Space, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { TransferDirection } from 'antd/es/transfer';

interface SubIP {
  id: string;
  ip: string;
  createdAt: string;
}

interface NodeGroupItem {
  id: string;
  name: string;
  description: string;
  subIPCount: number;
  subIPs: SubIP[];
  createdAt: string;
}

interface TransferItem {
  key: string;
  title: string;
  description: string;
  disabled?: boolean;
}

// Mock 节点数据（用于穿梭框）
const mockAvailableNodes = [
  { id: 'node-1', name: 'Node-01', ip: '192.168.1.10', subIPs: ['192.168.1.11', '192.168.1.12'] },
  { id: 'node-2', name: 'Node-02', ip: '192.168.1.20', subIPs: ['192.168.1.21'] },
  { id: 'node-3', name: 'Node-03', ip: '192.168.1.30', subIPs: [] },
  { id: 'node-4', name: 'Node-04', ip: '192.168.1.40', subIPs: ['192.168.1.41', '192.168.1.42', '192.168.1.43'] },
  { id: 'node-5', name: 'Node-05', ip: '192.168.1.50', subIPs: ['192.168.1.51'] },
];

const NodeGroupsPage = () => {
  const [dataSource, setDataSource] = useState<NodeGroupItem[]>([
    {
      id: '1',
      name: '华东节点组',
      description: '华东地区节点集合',
      subIPCount: 3,
      subIPs: [
        { id: 'sub-1-1', ip: '192.168.1.11', createdAt: '2024-01-01' },
        { id: 'sub-1-2', ip: '192.168.1.12', createdAt: '2024-01-01' },
        { id: 'sub-1-3', ip: '192.168.1.21', createdAt: '2024-01-02' },
      ],
      createdAt: '2024-01-01 10:00:00',
    },
    {
      id: '2',
      name: '华北节点组',
      description: '华北地区节点集合',
      subIPCount: 2,
      subIPs: [
        { id: 'sub-2-1', ip: '192.168.1.41', createdAt: '2024-01-03' },
        { id: 'sub-2-2', ip: '192.168.1.42', createdAt: '2024-01-03' },
      ],
      createdAt: '2024-01-02 11:00:00',
    },
  ]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  // 将节点数据转换为穿梭框数据格式
  const transferDataSource: TransferItem[] = useMemo(() => {
    const items: TransferItem[] = [];
    mockAvailableNodes.forEach((node) => {
      // 添加主节点
      items.push({
        key: `node-${node.id}`,
        title: `${node.name} (${node.ip})`,
        description: `主节点 - ${node.ip}`,
      });
      // 添加子 IP
      node.subIPs.forEach((subIP, index) => {
        items.push({
          key: `subip-${node.id}-${index}`,
          title: subIP,
          description: `${node.name} 的子IP`,
        });
      });
    });
    return items;
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setTargetKeys([]);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (record: NodeGroupItem) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    // 这里应该根据实际的节点数据设置 targetKeys
    // 简化处理：假设 subIPs 的 IP 地址可以匹配到 transferDataSource 中的 key
    setTargetKeys([]);
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    setDataSource(dataSource.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleTransferChange = (
    newTargetKeys: string[],
    direction: TransferDirection,
    moveKeys: string[]
  ) => {
    setTargetKeys(newTargetKeys);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (targetKeys.length === 0) {
        message.warning('请至少选择一个节点');
        return;
      }

      if (editingId) {
        setDataSource(
          dataSource.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  name: values.name,
                  description: values.description,
                  subIPCount: targetKeys.length,
                }
              : item
          )
        );
        message.success('编辑成功');
      } else {
        const newGroup: NodeGroupItem = {
          id: Date.now().toString(),
          name: values.name,
          description: values.description,
          subIPCount: targetKeys.length,
          subIPs: targetKeys.map((key, index) => ({
            id: `${Date.now()}-${index}`,
            ip: transferDataSource.find((item) => item.key === key)?.title || key,
            createdAt: new Date().toISOString().split('T')[0],
          })),
          createdAt: new Date().toLocaleString('zh-CN'),
        };
        setDataSource([newGroup, ...dataSource]);
        message.success('添加成功');
      }

      setDrawerVisible(false);
      form.resetFields();
      setTargetKeys([]);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const columns = [
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
    },
    {
      title: '子 IP 数量',
      dataIndex: 'subIPCount',
      key: 'subIPCount',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: NodeGroupItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除？"
            description="删除后无法恢复，是否继续？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        search={false}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '16px 0' }}>
              <strong>子 IP 列表：</strong>
              <div style={{ marginTop: 8 }}>
                {record.subIPs.map((subIP) => (
                  <div key={subIP.id} style={{ padding: '4px 0' }}>
                    {subIP.ip} - {subIP.createdAt}
                  </div>
                ))}
              </div>
            </div>
          ),
        }}
        pagination={{
          defaultPageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加分组
          </Button>,
        ]}
      />

      <Drawer
        title={editingId ? '编辑节点分组' : '添加节点分组'}
        width={800}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
            <Button type="primary" onClick={handleSubmit}>
              {editingId ? '保存' : '提交'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="分组名称"
            name="name"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} placeholder="请输入描述信息" />
          </Form.Item>

          <Form.Item label="选择节点" required>
            <Transfer
              dataSource={transferDataSource}
              titles={['可选节点', '已选节点']}
              targetKeys={targetKeys}
              onChange={handleTransferChange}
              render={(item) => item.title}
              showSearch
              filterOption={(inputValue, item) =>
                item.title.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                (item.description?.toLowerCase().indexOf(inputValue.toLowerCase()) ?? -1) !== -1
              }
              listStyle={{
                width: 350,
                height: 400,
              }}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default NodeGroupsPage;
