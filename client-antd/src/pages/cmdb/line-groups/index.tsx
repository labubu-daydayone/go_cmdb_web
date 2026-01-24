import { useRef, useState, useEffect } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Space, Drawer, Form, Input, Select, Row, Col } from 'antd';
import { lineGroupsAPI, nodeGroupsAPI, dnsAPI } from '@/services/api';
import { connectWebSocket, subscribe, unsubscribe } from '@/utils/websocket';
import type { WebSocketEvent } from '@/utils/websocket';

/**
 * 线路分组类型
 */
export type LineGroupItem = {
  id: string;
  name: string;
  nodeGroupId: string;
  nodeGroupName?: string;
  cname: string;
  nodeCount: number;
};

/**
 * 线路分组页面
 */
const LineGroupsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LineGroupItem | null>(null);
  const [availableNodeGroups, setAvailableNodeGroups] = useState<Array<{ label: string; value: string }>>([]);
  const [availableDomains, setAvailableDomains] = useState<Array<{ label: string; value: string }>>([]);
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

    // 订阅线路分组相关事件
    const handleGroupCreated = () => {
      message.info('检测到新线路分组创建');
      actionRef.current?.reload();
    };
    const handleGroupUpdated = () => {
      message.info('检测到线路分组更新');
      actionRef.current?.reload();
    };
    const handleGroupDeleted = () => {
      message.info('检测到线路分组删除');
      actionRef.current?.reload();
    };

    subscribe(WebSocketEvent.LINE_GROUP_CREATED, handleGroupCreated);
    subscribe(WebSocketEvent.LINE_GROUP_UPDATED, handleGroupUpdated);
    subscribe(WebSocketEvent.LINE_GROUP_DELETED, handleGroupDeleted);

    return () => {
      unsubscribe(WebSocketEvent.LINE_GROUP_CREATED, handleGroupCreated);
      unsubscribe(WebSocketEvent.LINE_GROUP_UPDATED, handleGroupUpdated);
      unsubscribe(WebSocketEvent.LINE_GROUP_DELETED, handleGroupDeleted);
    };
  }, []);

  /**
   * 加载节点分组列表
   */
  const loadNodeGroups = async () => {
    try {
      const response = await nodeGroupsAPI.list({ page: 1, pageSize: 1000 });
      if (response.code === 0) {
        setAvailableNodeGroups(
          response.data.items.map((item: any) => ({
            label: item.name,
            value: item.id,
          }))
        );
      }
    } catch (error) {
      console.error('加载节点分组失败:', error);
    }
  };

  /**
   * 加载域名列表
   */
  const loadDomains = async () => {
    try {
      const response = await dnsAPI.list({ page: 1, pageSize: 1000 });
      if (response.code === 0) {
        setAvailableDomains(
          response.data.items.map((item: any) => ({
            label: item.domain,
            value: item.domain,
          }))
        );
      }
    } catch (error) {
      console.error('加载域名列表失败:', error);
    }
  };

  /**
   * 生成随机 CNAME 前缀
   */
  const generateCNAMEPrefix = () => {
    const randomStr = Math.random().toString(36).substring(2, 8);
    return randomStr;
  };

  /**
   * 处理删除操作
   */
  const handleDelete = async (id: string) => {
    try {
      await lineGroupsAPI.delete([Number(id)]);
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
      message.warning('请选择要删除的线路分组');
      return;
    }

    try {
      await lineGroupsAPI.delete(selectedRowKeys.map(key => Number(key)));
      message.success(`成功删除 ${selectedRowKeys.length} 个线路分组`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 打开添加线路分组抽屉
   */
  const handleAdd = async () => {
    await loadNodeGroups();
    await loadDomains();
    setEditingGroup(null);
    form.resetFields();
    // 生成默认 CNAME
    const prefix = generateCNAMEPrefix();
    form.setFieldsValue({
      cnamePrefix: prefix,
    });
    setDrawerVisible(true);
  };

  /**
   * 打开编辑线路分组抽屉
   */
  const handleEdit = async (record: LineGroupItem) => {
    await loadNodeGroups();
    await loadDomains();
    setEditingGroup(record);
    
    // 解析 CNAME
    const cnameParts = record.cname.split('.');
    const prefix = cnameParts[0];
    const domain = cnameParts.slice(1).join('.');
    
    form.setFieldsValue({
      name: record.name,
      nodeGroupId: record.nodeGroupId,
      cnamePrefix: prefix,
      cnameDomain: domain,
    });
    setDrawerVisible(true);
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 构建完整的 CNAME
      const cname = `${values.cnamePrefix}.${values.cnameDomain}`;

      const data = {
        name: values.name,
        nodeGroupId: Number(values.nodeGroupId),
        cname,
      };

      if (editingGroup) {
        await lineGroupsAPI.update({
          id: Number(editingGroup.id),
          ...data,
        });
        message.success('更新成功');
      } else {
        await lineGroupsAPI.create(data);
        message.success('添加成功');
      }

      setDrawerVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * ProTable 数据请求
   */
  const request = async (params: any, sort: any, filter: any) => {
    try {
      const response = await lineGroupsAPI.list({
        page: params.current,
        pageSize: params.pageSize,
        name: params.name,
        cname: params.cname,
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
  const columns: ProColumns<LineGroupItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: '线路名称',
      dataIndex: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '节点分组',
      dataIndex: 'nodeGroupName',
      width: 150,
      search: false,
      ellipsis: true,
    },
    {
      title: 'CNAME',
      dataIndex: 'cname',
      width: 250,
      copyable: true,
      ellipsis: true,
    },
    {
      title: '节点数量',
      dataIndex: 'nodeCount',
      width: 120,
      search: false,
      sorter: true,
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
          title="确定要删除这个线路分组吗？"
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
      <ProTable<LineGroupItem>
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
              title={`确定要删除选中的 ${selectedRowKeys.length} 个线路分组吗？`}
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
            添加线路分组
          </Button>,
        ]}
        headerTitle={
          <Space>
            线路分组管理
            {wsConnected && <Tag color="success">实时连接</Tag>}
            {!wsConnected && <Tag color="warning">未连接</Tag>}
          </Space>
        }
      />

      {/* 添加/编辑线路分组抽屉 */}
      <Drawer
        title={editingGroup ? '编辑线路分组' : '添加线路分组'}
        width={600}
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
            label="线路名称"
            rules={[{ required: true, message: '请输入线路名称' }]}
          >
            <Input placeholder="线路1" />
          </Form.Item>

          <Form.Item
            name="nodeGroupId"
            label="节点分组"
            rules={[{ required: true, message: '请选择节点分组' }]}
            tooltip="只能选择一个节点分组"
          >
            <Select
              placeholder="请选择节点分组"
              options={availableNodeGroups}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item label="CNAME" required>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="cnamePrefix"
                  noStyle
                  rules={[{ required: true, message: '请输入前缀' }]}
                >
                  <Input placeholder="cdn1" addonAfter="." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="cnameDomain"
                  noStyle
                  rules={[{ required: true, message: '请选择域名' }]}
                >
                  <Select
                    placeholder="选择域名"
                    options={availableDomains}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default LineGroupsPage;
