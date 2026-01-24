import { useState, useRef, useMemo, useEffect } from 'react';
import { ProTable, ActionType } from '@ant-design/pro-components';
import { Button, Drawer, Form, Input, Transfer, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { TransferDirection } from 'antd/es/transfer';
import { nodeGroupsAPI, nodesAPI } from '@/services/api';
import { connectWebSocket, subscribe, unsubscribe } from '@/utils/websocket';
import type { WebSocketEvent } from '@/utils/websocket';

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

interface NodeItem {
  id: string;
  name: string;
  ip: string;
  subIPs?: Array<{ id: string; ip: string }>;
}

const NodeGroupsPage = () => {
  const actionRef = useRef<ActionType>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [availableNodes, setAvailableNodes] = useState<NodeItem[]>([]);
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

    // 订阅节点分组相关事件
    const handleGroupCreated = () => {
      message.info('检测到新节点分组创建');
      actionRef.current?.reload();
    };
    const handleGroupUpdated = () => {
      message.info('检测到节点分组更新');
      actionRef.current?.reload();
    };
    const handleGroupDeleted = () => {
      message.info('检测到节点分组删除');
      actionRef.current?.reload();
    };

    subscribe(WebSocketEvent.NODE_GROUP_CREATED, handleGroupCreated);
    subscribe(WebSocketEvent.NODE_GROUP_UPDATED, handleGroupUpdated);
    subscribe(WebSocketEvent.NODE_GROUP_DELETED, handleGroupDeleted);

    return () => {
      unsubscribe(WebSocketEvent.NODE_GROUP_CREATED, handleGroupCreated);
      unsubscribe(WebSocketEvent.NODE_GROUP_UPDATED, handleGroupUpdated);
      unsubscribe(WebSocketEvent.NODE_GROUP_DELETED, handleGroupDeleted);
    };
  }, []);

  /**
   * 加载可用节点列表
   */
  const loadAvailableNodes = async () => {
    try {
      const response = await nodesAPI.list({ page: 1, pageSize: 1000 });
      if (response.code === 0) {
        setAvailableNodes(response.data.items);
      }
    } catch (error) {
      console.error('加载节点列表失败:', error);
    }
  };

  // 将节点数据转换为穿梭框数据格式
  const transferDataSource: TransferItem[] = useMemo(() => {
    const items: TransferItem[] = [];
    availableNodes.forEach((node) => {
      // 添加主节点
      items.push({
        key: `node-${node.id}`,
        title: `${node.name} (${node.ip})`,
        description: `主节点 - ${node.ip}`,
      });
      // 添加子 IP
      if (node.subIPs && node.subIPs.length > 0) {
        node.subIPs.forEach((subIP) => {
          items.push({
            key: `subip-${subIP.id}`,
            title: subIP.ip,
            description: `子 IP - ${node.name}`,
          });
        });
      }
    });
    return items;
  }, [availableNodes]);

  const handleAdd = async () => {
    await loadAvailableNodes();
    setEditingId(null);
    form.resetFields();
    setTargetKeys([]);
    setDrawerVisible(true);
  };

  const handleEdit = async (record: NodeGroupItem) => {
    await loadAvailableNodes();
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    // 将已选择的子 IP 转换为 targetKeys
    const keys = record.subIPs.map(subIP => `subip-${subIP.id}`);
    setTargetKeys(keys);
    setDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await nodeGroupsAPI.delete([Number(id)]);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 提取选中的子 IP ID
      const subIPIds = targetKeys
        .filter(key => key.startsWith('subip-'))
        .map(key => Number(key.replace('subip-', '')));

      const data = {
        name: values.name,
        description: values.description,
        subIPIds,
      };

      if (editingId) {
        await nodeGroupsAPI.update({
          id: Number(editingId),
          ...data,
        });
        message.success('编辑成功');
      } else {
        await nodeGroupsAPI.create(data);
        message.success('添加成功');
      }

      setDrawerVisible(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  const handleTransferChange = (
    newTargetKeys: string[],
    direction: TransferDirection,
    moveKeys: string[]
  ) => {
    setTargetKeys(newTargetKeys);
  };

  /**
   * ProTable 数据请求
   */
  const request = async (params: any, sort: any, filter: any) => {
    try {
      const response = await nodeGroupsAPI.list({
        page: params.current,
        pageSize: params.pageSize,
        name: params.name,
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
      title: '分组名称',
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 300,
      search: false,
      ellipsis: true,
    },
    {
      title: '子 IP 数量',
      dataIndex: 'subIPCount',
      width: 120,
      search: false,
      sorter: true,
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
      width: 150,
      fixed: 'right',
      render: (_: any, record: NodeGroupItem) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定要删除这个节点分组吗？"
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
      <ProTable<NodeGroupItem>
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
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '16px 48px' }}>
              <h4>子 IP 列表</h4>
              {record.subIPs && record.subIPs.length > 0 ? (
                <Space wrap>
                  {record.subIPs.map((subIP) => (
                    <Tag key={subIP.id} color="blue">
                      {subIP.ip}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <div style={{ color: '#999' }}>暂无子 IP</div>
              )}
            </div>
          ),
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加节点分组
          </Button>,
        ]}
        headerTitle={
          <Space>
            节点分组管理
            {wsConnected && <Tag color="success">实时连接</Tag>}
            {!wsConnected && <Tag color="warning">未连接</Tag>}
          </Space>
        }
      />

      <Drawer
        title={editingId ? '编辑节点分组' : '添加节点分组'}
        width={800}
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
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="华东节点组" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="华东地区节点集合" />
          </Form.Item>

          <Form.Item label="选择节点和子 IP" required>
            <Transfer
              dataSource={transferDataSource}
              titles={['可用节点', '已选节点']}
              targetKeys={targetKeys}
              onChange={handleTransferChange}
              render={(item) => (
                <div>
                  <div style={{ fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{item.description}</div>
                </div>
              )}
              listStyle={{
                width: 350,
                height: 400,
              }}
              showSearch
              filterOption={(inputValue, item) =>
                item.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                item.description.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default NodeGroupsPage;
