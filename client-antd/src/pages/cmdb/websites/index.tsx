import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Tabs, Space, Input, Select, InputNumber, Drawer, Form, Checkbox, Row, Col, Modal, Radio, Alert } from 'antd';
import { useRef, useState, useEffect } from 'react';
import { websitesAPI } from '@/services/api';
import { connectWebSocket, subscribe, unsubscribe } from '@/utils/websocket';

const { TabPane } = Tabs;

/**
 * 网站数据类型
 */
export type WebsiteItem = {
  id: string;
  domain: string;
  cname: string;
  lineGroup: string;
  https: boolean;
  httpsForceRedirect?: boolean;
  hstsEnabled?: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  cacheRules?: string;
};

/**
 * 回源 IP 配置
 */
type OriginIP = {
  type: 'primary' | 'backup';
  protocol: 'http' | 'https';
  address: string;
  weight: number;
};

/**
 * 网站管理页面
 */
const WebsitesPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addDrawerVisible, setAddDrawerVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [currentWebsite, setCurrentWebsite] = useState<WebsiteItem | null>(null);
  const [addFormTab, setAddFormTab] = useState<'group' | 'redirect' | 'manual'>('group');
  const [editFormTab, setEditFormTab] = useState<'group' | 'redirect' | 'manual'>('group');
  
  // 添加表单状态
  const [addOriginIPs, setAddOriginIPs] = useState<OriginIP[]>([
    { type: 'primary', protocol: 'http', address: '', weight: 10 },
  ]);
  const [addRedirectUrl, setAddRedirectUrl] = useState('');
  const [addRedirectStatusCode, setAddRedirectStatusCode] = useState<301 | 302>(301);
  const [addSelectedTemplate, setAddSelectedTemplate] = useState('');
  
  // 编辑表单状态
  const [editOriginIPs, setEditOriginIPs] = useState<OriginIP[]>([
    { type: 'primary', protocol: 'http', address: '', weight: 10 },
  ]);
  const [editRedirectUrl, setEditRedirectUrl] = useState('');
  const [editRedirectStatusCode, setEditRedirectStatusCode] = useState<301 | 302>(301);
  const [editSelectedTemplate, setEditSelectedTemplate] = useState('');
  
  // 清除缓存相关状态
  const [clearCacheModalVisible, setClearCacheModalVisible] = useState(false);
  const [clearCacheWebsiteId, setClearCacheWebsiteId] = useState<string>('');
  const [clearCacheWebsiteDomain, setClearCacheWebsiteDomain] = useState<string>('');
  const [clearCacheType, setClearCacheType] = useState<'all' | 'url' | 'directory'>('all');
  const [clearCacheUrl, setClearCacheUrl] = useState('');
  const [clearCacheDirectory, setClearCacheDirectory] = useState('');

  // 批量清除缓存 Modal 状态
  const [batchClearCacheModalVisible, setBatchClearCacheModalVisible] = useState(false);
  const [batchClearCacheType, setBatchClearCacheType] = useState<'all' | 'url' | 'directory'>('all');
  const [batchClearCacheUrl, setBatchClearCacheUrl] = useState('');
  const [batchClearCacheDirectory, setBatchClearCacheDirectory] = useState('');
  
  // WebSocket 连接状态
  const [wsConnected, setWsConnected] = useState(false);

  /**
   * 初始化 WebSocket 连接
   */
  useEffect(() => {
    try {
      connectWebSocket();
      setWsConnected(true);
      message.success('实时连接已建立');
    } catch (error) {
      console.warn('WebSocket 连接失败:', error);
      setWsConnected(false);
    }

    // 订阅网站相关事件
    const handleWebsiteCreated = () => {
      message.info('检测到新网站创建');
      actionRef.current?.reload();
    };
    const handleWebsiteUpdated = () => {
      message.info('检测到网站更新');
      actionRef.current?.reload();
    };
    const handleWebsiteDeleted = () => {
      message.info('检测到网站删除');
      actionRef.current?.reload();
    };
    const handleCacheCleared = () => {
      message.info('缓存清除完成');
    };

    subscribe(WebSocketEvent.WEBSITE_CREATED, handleWebsiteCreated);
    subscribe(WebSocketEvent.WEBSITE_UPDATED, handleWebsiteUpdated);
    subscribe(WebSocketEvent.WEBSITE_DELETED, handleWebsiteDeleted);
    subscribe(WebSocketEvent.WEBSITE_CACHE_CLEARED, handleCacheCleared);

    return () => {
      unsubscribe(WebSocketEvent.WEBSITE_CREATED, handleWebsiteCreated);
      unsubscribe(WebSocketEvent.WEBSITE_UPDATED, handleWebsiteUpdated);
      unsubscribe(WebSocketEvent.WEBSITE_DELETED, handleWebsiteDeleted);
      unsubscribe(WebSocketEvent.WEBSITE_CACHE_CLEARED, handleCacheCleared);
    };
  }, []);

  /**
   * 处理删除操作
   */
  const handleDelete = async (id: string) => {
    try {
      await websitesAPI.delete([Number(id)]);
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
      message.warning('请选择要删除的网站');
      return;
    }

    try {
      await websitesAPI.delete(selectedRowKeys.map(key => Number(key)));
      message.success(`已删除 ${selectedRowKeys.length} 个网站`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 打开添加网站抽屉
   */
  const handleAdd = () => {
    addForm.resetFields();
    setAddFormTab('group');
    setAddOriginIPs([{ type: 'primary', protocol: 'http', address: '', weight: 10 }]);
    setAddRedirectUrl('');
    setAddRedirectStatusCode(301);
    setAddSelectedTemplate('');
    setAddDrawerVisible(true);
  };

  /**
   * 提交添加表单
   */
  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      
      // 构建请求数据
      const data: any = {
        domain: values.domain,
        lineGroup: values.lineGroup,
        https: values.https || false,
        httpsForceRedirect: values.httpsForceRedirect || false,
        hstsEnabled: values.hstsEnabled || false,
        cacheRules: values.cacheRules || '',
      };

      // 根据不同的回源方式添加配置
      if (addFormTab === 'group') {
        data.originGroupId = addSelectedTemplate;
      } else if (addFormTab === 'redirect') {
        data.redirectUrl = addRedirectUrl;
        data.redirectStatusCode = addRedirectStatusCode;
      } else if (addFormTab === 'manual') {
        data.originIPs = addOriginIPs.filter(ip => ip.address.trim() !== '');
      }

      await websitesAPI.create(data);
      message.success('添加成功');
      setAddDrawerVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 打开编辑网站抽屉
   */
  const handleEdit = (record: WebsiteItem) => {
    setCurrentWebsite(record);
    editForm.setFieldsValue({
      domain: record.domain,
      lineGroup: record.lineGroup,
      https: record.https,
      httpsForceRedirect: record.httpsForceRedirect,
      hstsEnabled: record.hstsEnabled,
      cacheRules: record.cacheRules,
    });
    setEditFormTab('group');
    setEditOriginIPs([{ type: 'primary', protocol: 'http', address: '', weight: 10 }]);
    setEditRedirectUrl('');
    setEditRedirectStatusCode(301);
    setEditSelectedTemplate('');
    setEditDrawerVisible(true);
  };

  /**
   * 提交编辑表单
   */
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      // 构建请求数据
      const data: any = {
        id: Number(currentWebsite?.id),
        domain: values.domain,
        lineGroup: values.lineGroup,
        https: values.https || false,
        httpsForceRedirect: values.httpsForceRedirect || false,
        hstsEnabled: values.hstsEnabled || false,
        cacheRules: values.cacheRules || '',
      };

      // 根据不同的回源方式添加配置
      if (editFormTab === 'group') {
        data.originGroupId = editSelectedTemplate;
      } else if (editFormTab === 'redirect') {
        data.redirectUrl = editRedirectUrl;
        data.redirectStatusCode = editRedirectStatusCode;
      } else if (editFormTab === 'manual') {
        data.originIPs = editOriginIPs.filter(ip => ip.address.trim() !== '');
      }

      await websitesAPI.update(data);
      message.success('更新成功');
      setEditDrawerVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 打开清除缓存 Modal
   */
  const handleClearCache = (record: WebsiteItem) => {
    setClearCacheWebsiteId(record.id);
    setClearCacheWebsiteDomain(record.domain);
    setClearCacheType('all');
    setClearCacheUrl('');
    setClearCacheDirectory('');
    setClearCacheModalVisible(true);
  };

  /**
   * 提交清除缓存
   */
  const handleClearCacheSubmit = async () => {
    try {
      const params: any = {
        ids: [Number(clearCacheWebsiteId)],
        type: clearCacheType,
      };

      if (clearCacheType === 'url') {
        if (!clearCacheUrl.trim()) {
          message.warning('请输入要清除的 URL');
          return;
        }
        params.url = clearCacheUrl;
      } else if (clearCacheType === 'directory') {
        if (!clearCacheDirectory.trim()) {
          message.warning('请输入要清除的目录');
          return;
        }
        params.directory = clearCacheDirectory;
      }

      await websitesAPI.clearCache(params);
      message.success('缓存清除成功');
      setClearCacheModalVisible(false);
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 打开批量清除缓存 Modal
   */
  const handleBatchClearCache = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要清除缓存的网站');
      return;
    }
    setBatchClearCacheType('all');
    setBatchClearCacheUrl('');
    setBatchClearCacheDirectory('');
    setBatchClearCacheModalVisible(true);
  };

  /**
   * 提交批量清除缓存
   */
  const handleBatchClearCacheSubmit = async () => {
    try {
      const params: any = {
        ids: selectedRowKeys.map(key => Number(key)),
        type: batchClearCacheType,
      };

      if (batchClearCacheType === 'url') {
        if (!batchClearCacheUrl.trim()) {
          message.warning('请输入要清除的 URL');
          return;
        }
        params.url = batchClearCacheUrl;
      } else if (batchClearCacheType === 'directory') {
        if (!batchClearCacheDirectory.trim()) {
          message.warning('请输入要清除的目录');
          return;
        }
        params.directory = batchClearCacheDirectory;
      }

      await websitesAPI.clearCache(params);
      message.success(`已清除 ${selectedRowKeys.length} 个网站的缓存`);
      setBatchClearCacheModalVisible(false);
      setSelectedRowKeys([]);
    } catch (error) {
      // 错误已由 request 工具自动处理
    }
  };

  /**
   * 添加回源 IP
   */
  const handleAddOriginIP = (isEdit: boolean = false) => {
    const newIP: OriginIP = { type: 'primary', protocol: 'http', address: '', weight: 10 };
    if (isEdit) {
      setEditOriginIPs([...editOriginIPs, newIP]);
    } else {
      setAddOriginIPs([...addOriginIPs, newIP]);
    }
  };

  /**
   * 删除回源 IP
   */
  const handleRemoveOriginIP = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      const newIPs = editOriginIPs.filter((_, i) => i !== index);
      if (newIPs.length === 0) {
        newIPs.push({ type: 'primary', protocol: 'http', address: '', weight: 10 });
      }
      setEditOriginIPs(newIPs);
    } else {
      const newIPs = addOriginIPs.filter((_, i) => i !== index);
      if (newIPs.length === 0) {
        newIPs.push({ type: 'primary', protocol: 'http', address: '', weight: 10 });
      }
      setAddOriginIPs(newIPs);
    }
  };

  /**
   * 更新回源 IP
   */
  const handleUpdateOriginIP = (index: number, field: keyof OriginIP, value: any, isEdit: boolean = false) => {
    if (isEdit) {
      const newIPs = [...editOriginIPs];
      newIPs[index] = { ...newIPs[index], [field]: value };
      setEditOriginIPs(newIPs);
    } else {
      const newIPs = [...addOriginIPs];
      newIPs[index] = { ...newIPs[index], [field]: value };
      setAddOriginIPs(newIPs);
    }
  };

  /**
   * ProTable 数据请求
   */
  const request = async (params: any, sort: any, filter: any) => {
    try {
      const response = await websitesAPI.list({
        page: params.current,
        pageSize: params.pageSize,
        domain: params.domain,
        status: params.status,
        lineGroup: params.lineGroup,
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
  const columns: ProColumns<WebsiteItem>[] = [
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
    },
    {
      title: 'CNAME',
      dataIndex: 'cname',
      width: 250,
      search: false,
      copyable: true,
      ellipsis: true,
    },
    {
      title: '线路分组',
      dataIndex: 'lineGroup',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'HTTPS',
      dataIndex: 'https',
      width: 100,
      search: false,
      render: (_, record) => (
        <Tag color={record.https ? 'success' : 'default'}>
          {record.https ? '已启用' : '未启用'}
        </Tag>
      ),
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
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <a key="cache" onClick={() => handleClearCache(record)}>
          清除缓存
        </a>,
        <Popconfirm
          key="delete"
          title="确定要删除这个网站吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <a style={{ color: 'red' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  /**
   * 回源分组模板（TODO: 从 API 获取）
   */
  const mockTemplates = [
    { id: 't1', name: '默认回源组', type: 'IP', address: '192.168.1.100' },
    { id: 't2', name: '备用回源组', type: 'IP', address: '192.168.1.101' },
  ];

  /**
   * 渲染回源配置表单
   */
  const renderOriginConfig = (isEdit: boolean = false) => {
    const currentTab = isEdit ? editFormTab : addFormTab;
    const setCurrentTab = isEdit ? setEditFormTab : setAddFormTab;
    const originIPs = isEdit ? editOriginIPs : addOriginIPs;
    const redirectUrl = isEdit ? editRedirectUrl : addRedirectUrl;
    const setRedirectUrl = isEdit ? setEditRedirectUrl : setAddRedirectUrl;
    const redirectStatusCode = isEdit ? editRedirectStatusCode : addRedirectStatusCode;
    const setRedirectStatusCode = isEdit ? setEditRedirectStatusCode : setAddRedirectStatusCode;
    const selectedTemplate = isEdit ? editSelectedTemplate : addSelectedTemplate;
    const setSelectedTemplate = isEdit ? setEditSelectedTemplate : setAddSelectedTemplate;

    return (
      <Tabs activeKey={currentTab} onChange={(key) => setCurrentTab(key as any)}>
        <TabPane tab="选择回源分组" key="group">
          <Form.Item label="回源分组" required>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                placeholder="请选择回源分组"
                value={selectedTemplate}
                onChange={setSelectedTemplate}
              >
                {mockTemplates.map((t) => (
                  <Select.Option key={t.id} value={t.id}>
                    {t.name} ({t.type}: {t.address})
                  </Select.Option>
                ))}
              </Select>
              <Button
                type="dashed"
                style={{ width: '100%' }}
                onClick={() => {
                  message.info('添加源站组功能');
                  // TODO: 打开添加源站组对话框
                }}
              >
                + 添加新的回源分组
              </Button>
            </Space>
          </Form.Item>
        </TabPane>

        <TabPane tab="301/302 跳转" key="redirect">
          <Form.Item label="跳转 URL" required>
            <Input
              placeholder="https://example.com"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="状态码" required>
            <Radio.Group
              value={redirectStatusCode}
              onChange={(e) => setRedirectStatusCode(e.target.value)}
            >
              <Radio value={301}>301 永久跳转</Radio>
              <Radio value={302}>302 临时跳转</Radio>
            </Radio.Group>
          </Form.Item>
        </TabPane>

        <TabPane tab="手动配置回源 IP" key="manual">
          <Alert
            message="回源 IP 配置说明"
            description="可以配置多个回源 IP，支持主备和权重设置。地址格式：IP:端口，例如 192.168.1.100:80"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          {originIPs.map((ip, index) => (
            <div key={index} style={{ marginBottom: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 4 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="类型" style={{ marginBottom: 8 }}>
                    <Select
                      value={ip.type}
                      onChange={(value) => handleUpdateOriginIP(index, 'type', value, isEdit)}
                    >
                      <Select.Option value="primary">主</Select.Option>
                      <Select.Option value="backup">备</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="协议" style={{ marginBottom: 8 }}>
                    <Select
                      value={ip.protocol}
                      onChange={(value) => handleUpdateOriginIP(index, 'protocol', value, isEdit)}
                    >
                      <Select.Option value="http">HTTP</Select.Option>
                      <Select.Option value="https">HTTPS</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="地址 (IP:端口)" style={{ marginBottom: 8 }}>
                    <Input
                      placeholder="192.168.1.100:80"
                      value={ip.address}
                      onChange={(e) => handleUpdateOriginIP(index, 'address', e.target.value, isEdit)}
                    />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="权重" style={{ marginBottom: 8 }}>
                    <InputNumber
                      min={1}
                      max={100}
                      value={ip.weight}
                      onChange={(value) => handleUpdateOriginIP(index, 'weight', value || 10, isEdit)}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Button
                danger
                size="small"
                onClick={() => handleRemoveOriginIP(index, isEdit)}
                disabled={originIPs.length === 1}
              >
                删除
              </Button>
            </div>
          ))}
          <Button type="dashed" onClick={() => handleAddOriginIP(isEdit)} style={{ width: '100%' }}>
            + 添加回源 IP
          </Button>
        </TabPane>
      </Tabs>
    );
  };

  return (
    <>
      <ProTable<WebsiteItem>
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
            <a onClick={handleBatchClearCache}>批量清除缓存</a>
            <Popconfirm
              title={`确定要删除选中的 ${selectedRowKeys.length} 个网站吗？`}
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
            添加网站
          </Button>,
        ]}
        headerTitle={
          <Space>
            网站管理
            {wsConnected && <Tag color="success">实时连接</Tag>}
            {!wsConnected && <Tag color="warning">未连接</Tag>}
          </Space>
        }
      />

      {/* 添加网站抽屉 */}
      <Drawer
        title="添加网站"
        width={720}
        open={addDrawerVisible}
        onClose={() => setAddDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setAddDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleAddSubmit}>
              提交
            </Button>
          </Space>
        }
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="domain"
            label="域名"
            rules={[{ required: true, message: '请输入域名' }]}
          >
            <Input placeholder="example.com" />
          </Form.Item>

          <Form.Item
            name="lineGroup"
            label="线路分组"
            rules={[{ required: true, message: '请选择线路分组' }]}
          >
            <Select placeholder="请选择线路分组">
              <Select.Option value="线路1">线路1</Select.Option>
              <Select.Option value="线路2">线路2</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="回源配置" required>
            {renderOriginConfig(false)}
          </Form.Item>

          <Form.Item name="https" valuePropName="checked">
            <Checkbox>启用 HTTPS</Checkbox>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.https !== currentValues.https}
          >
            {({ getFieldValue }) => {
              const httpsEnabled = getFieldValue('https');
              return (
                <>
                  <Form.Item name="httpsForceRedirect" valuePropName="checked">
                    <Checkbox disabled={!httpsEnabled}>强制 HTTPS 跳转</Checkbox>
                  </Form.Item>
                  <Form.Item name="hstsEnabled" valuePropName="checked">
                    <Checkbox disabled={!httpsEnabled}>启用 HSTS</Checkbox>
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>

          <Form.Item name="cacheRules" label="缓存规则">
            <Select placeholder="请选择缓存规则" allowClear>
              <Select.Option value="首页缓存">首页缓存</Select.Option>
              <Select.Option value="图片缓存">图片缓存</Select.Option>
              <Select.Option value="API缓存">API缓存</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 编辑网站抽屉 */}
      <Drawer
        title="编辑网站"
        width={720}
        open={editDrawerVisible}
        onClose={() => setEditDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setEditDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleEditSubmit}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="域名">
            <Input value={currentWebsite?.domain} disabled />
          </Form.Item>

          <Form.Item
            name="lineGroup"
            label="线路分组"
            rules={[{ required: true, message: '请选择线路分组' }]}
          >
            <Select placeholder="请选择线路分组">
              <Select.Option value="线路1">线路1</Select.Option>
              <Select.Option value="线路2">线路2</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="回源配置" required>
            {renderOriginConfig(true)}
          </Form.Item>

          <Form.Item name="https" valuePropName="checked">
            <Checkbox>启用 HTTPS</Checkbox>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.https !== currentValues.https}
          >
            {({ getFieldValue }) => {
              const httpsEnabled = getFieldValue('https');
              return (
                <>
                  <Form.Item name="httpsForceRedirect" valuePropName="checked">
                    <Checkbox disabled={!httpsEnabled}>强制 HTTPS 跳转</Checkbox>
                  </Form.Item>
                  <Form.Item name="hstsEnabled" valuePropName="checked">
                    <Checkbox disabled={!httpsEnabled}>启用 HSTS</Checkbox>
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>

          <Form.Item name="cacheRules" label="缓存规则">
            <Select placeholder="请选择缓存规则" allowClear>
              <Select.Option value="首页缓存">首页缓存</Select.Option>
              <Select.Option value="图片缓存">图片缓存</Select.Option>
              <Select.Option value="API缓存">API缓存</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 清除缓存 Modal */}
      <Modal
        title={`清除缓存 - ${clearCacheWebsiteDomain}`}
        open={clearCacheModalVisible}
        onOk={handleClearCacheSubmit}
        onCancel={() => setClearCacheModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="清除类型">
            <Radio.Group value={clearCacheType} onChange={(e) => setClearCacheType(e.target.value)}>
              <Space direction="vertical">
                <Radio value="all">全部缓存</Radio>
                <Radio value="url">指定 URL</Radio>
                <Radio value="directory">指定目录</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          {clearCacheType === 'url' && (
            <Form.Item label="URL" required>
              <Input
                placeholder="https://example.com/path/to/file.jpg"
                value={clearCacheUrl}
                onChange={(e) => setClearCacheUrl(e.target.value)}
              />
            </Form.Item>
          )}

          {clearCacheType === 'directory' && (
            <Form.Item label="目录" required>
              <Input
                placeholder="/images/"
                value={clearCacheDirectory}
                onChange={(e) => setClearCacheDirectory(e.target.value)}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 批量清除缓存 Modal */}
      <Modal
        title={`批量清除缓存 (${selectedRowKeys.length} 个网站)`}
        open={batchClearCacheModalVisible}
        onOk={handleBatchClearCacheSubmit}
        onCancel={() => setBatchClearCacheModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="清除类型">
            <Radio.Group value={batchClearCacheType} onChange={(e) => setBatchClearCacheType(e.target.value)}>
              <Space direction="vertical">
                <Radio value="all">全部缓存</Radio>
                <Radio value="url">指定 URL</Radio>
                <Radio value="directory">指定目录</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          {batchClearCacheType === 'url' && (
            <Form.Item label="URL" required>
              <Input
                placeholder="https://example.com/path/to/file.jpg"
                value={batchClearCacheUrl}
                onChange={(e) => setBatchClearCacheUrl(e.target.value)}
              />
            </Form.Item>
          )}

          {batchClearCacheType === 'directory' && (
            <Form.Item label="目录" required>
              <Input
                placeholder="/images/"
                value={batchClearCacheDirectory}
                onChange={(e) => setBatchClearCacheDirectory(e.target.value)}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default WebsitesPage;
