import { PlusOutlined, EditOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Tabs, Space, Input, Select, InputNumber, Drawer, Form, Checkbox, Row, Col, Modal, Radio, Alert } from 'antd';
import { useRef, useState, useEffect } from 'react';

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
 * 生成 mock 数据
 */
const generateMockWebsites = (): WebsiteItem[] => {
  return [
    {
      id: '1',
      domain: 'example.com',
      cname: 'example.cdn.example.com',
      lineGroup: '线路1',
      https: true,
      httpsForceRedirect: true,
      hstsEnabled: false,
      status: 'active',
      createdAt: '2024-01-01 10:00:00',
      cacheRules: '首页缓存',
    },
    {
      id: '2',
      domain: 'test.com',
      cname: 'test.cdn.example.com',
      lineGroup: '线路2',
      https: false,
      httpsForceRedirect: false,
      hstsEnabled: false,
      status: 'active',
      createdAt: '2024-01-15 14:30:00',
      cacheRules: '图片缓存',
    },
    {
      id: '3',
      domain: 'demo.net',
      cname: 'demo.cdn.example.com',
      lineGroup: '线路1',
      https: true,
      httpsForceRedirect: false,
      hstsEnabled: true,
      status: 'inactive',
      createdAt: '2024-02-01 09:00:00',
      cacheRules: 'API缓存',
    },
  ];
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
  
  // 使用 mock 数据模拟 Socket.IO
  const [websites, setWebsites] = useState<WebsiteItem[]>(generateMockWebsites());
  const [wsConnected, setWsConnected] = useState(true); // mock 始终连接

  /**
   * 模拟 WebSocket 连接
   */
  useEffect(() => {
    // 模拟连接成功
    message.success('实时连接已建立（Mock 模式）');
    setWsConnected(true);

    // 模拟每 30 秒更新一次连接状态
    const interval = setInterval(() => {
      console.log('Mock WebSocket heartbeat');
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /**
   * 处理删除操作
   */
  const handleDelete = async (id: string) => {
    try {
      // 模拟删除
      setWebsites((prev) => prev.filter((w) => w.id !== id));
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('删除失败');
    }
  };

  /**
   * 打开清除缓存对话框
   */
  const openClearCacheModal = (id: string, domain: string) => {
    setClearCacheWebsiteId(id);
    setClearCacheWebsiteDomain(domain);
    setClearCacheType('all');
    setClearCacheUrl('');
    setClearCacheDirectory('');
    setClearCacheModalVisible(true);
  };

  /**
   * 处理清除缓存
   */
  const handleClearCache = async () => {
    // 验证输入
    if (clearCacheType === 'url' && !clearCacheUrl) {
      message.error('请输入要清除的 URL 地址');
      return;
    }
    if (clearCacheType === 'directory' && !clearCacheDirectory) {
      message.error('请输入要清除的目录路径');
      return;
    }

    try {
      let successMessage = '';
      switch (clearCacheType) {
        case 'all':
          successMessage = `已清除网站 ${clearCacheWebsiteDomain} 的所有缓存`;
          break;
        case 'url':
          successMessage = `已清除 URL: ${clearCacheUrl} 的缓存`;
          break;
        case 'directory':
          successMessage = `已清除目录: ${clearCacheDirectory} 的缓存`;
          break;
      }

      // 模拟清除缓存 API 调用
      console.log('Clearing cache:', {
        websiteId: clearCacheWebsiteId,
        type: clearCacheType,
        url: clearCacheUrl,
        directory: clearCacheDirectory,
      });

      message.success(successMessage);
      setClearCacheModalVisible(false);
    } catch (error) {
      message.error('清除缓存失败');
    }
  };

  /**
   * 批量清除缓存 - 打开 Modal
   */
  const handleBatchClearCacheClick = () => {
    setBatchClearCacheModalVisible(true);
    setBatchClearCacheType('all');
    setBatchClearCacheUrl('');
    setBatchClearCacheDirectory('');
  };

  /**
   * 批量清除缓存 - 确认
   */
  const handleBatchClearCacheConfirm = async () => {
    try {
      console.log('Batch clearing cache:', {
        websites: selectedRowKeys,
        type: batchClearCacheType,
        url: batchClearCacheUrl,
        directory: batchClearCacheDirectory,
      });
      
      let successMessage = '';
      if (batchClearCacheType === 'all') {
        successMessage = `已清除 ${selectedRowKeys.length} 个网站的所有缓存`;
      } else if (batchClearCacheType === 'url') {
        successMessage = `已清除 ${selectedRowKeys.length} 个网站的 URL: ${batchClearCacheUrl}`;
      } else if (batchClearCacheType === 'directory') {
        successMessage = `已清除 ${selectedRowKeys.length} 个网站的目录: ${batchClearCacheDirectory}`;
      }
      
      message.success(successMessage);
      setBatchClearCacheModalVisible(false);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('批量清除缓存失败');
    }
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async () => {
    try {
      // 模拟批量删除
      setWebsites((prev) => prev.filter((w) => !selectedRowKeys.includes(w.id)));
      message.success(`成功删除 ${selectedRowKeys.length} 个网站`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  /**
   * 处理添加回源 IP
   */
  const handleAddOriginIP = (isEdit: boolean = false) => {
    const newIP = { type: 'primary' as const, protocol: 'http' as const, address: '', weight: 10 };
    if (isEdit) {
      setEditOriginIPs([...editOriginIPs, newIP]);
    } else {
      setAddOriginIPs([...addOriginIPs, newIP]);
    }
  };

  /**
   * 处理删除回源 IP
   */
  const handleRemoveOriginIP = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditOriginIPs(editOriginIPs.filter((_, i) => i !== index));
    } else {
      setAddOriginIPs(addOriginIPs.filter((_, i) => i !== index));
    }
  };

  /**
   * 处理回源 IP 变更
   */
  const handleOriginIPChange = (
    index: number,
    field: keyof OriginIP,
    value: string | number,
    isEdit: boolean = false
  ) => {
    const ips = isEdit ? [...editOriginIPs] : [...addOriginIPs];
    ips[index] = { ...ips[index], [field]: value };
    if (isEdit) {
      setEditOriginIPs(ips);
    } else {
      setAddOriginIPs(ips);
    }
  };

  /**
   * 处理添加网站
   */
  const handleAddWebsite = async () => {
    try {
      const values = await addForm.validateFields();
      const newWebsite: WebsiteItem = {
        id: Date.now().toString(),
        domain: values.domain,
        cname: `${values.domain}.cdn.example.com`,
        lineGroup: values.lineGroup || '线路1',
        https: values.https || false,
        httpsForceRedirect: values.httpsForceRedirect || false,
        hstsEnabled: values.hstsEnabled || false,
        status: 'active',
        createdAt: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        cacheRules: values.cacheRules,
      };

      // 模拟添加
      setWebsites((prev) => [newWebsite, ...prev]);
      message.success(`网站 ${newWebsite.domain} 添加成功`);
      setAddDrawerVisible(false);
      resetAddForm();
      actionRef.current?.reload();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 处理编辑网站
   */
  const handleEditWebsite = async () => {
    if (!currentWebsite) return;

    try {
      const values = await editForm.validateFields();
      // 模拟更新
      setWebsites((prev) =>
        prev.map((w) =>
          w.id === currentWebsite.id
            ? {
                ...w,
                domain: values.domain,
                lineGroup: values.lineGroup,
                https: values.https,
                httpsForceRedirect: values.httpsForceRedirect,
                hstsEnabled: values.hstsEnabled,
                cname: `${values.domain}.cdn.example.com`,
                cacheRules: values.cacheRules,
              }
            : w
        )
      );

      message.success(`网站 ${values.domain} 更新成功`);
      setEditDrawerVisible(false);
      setCurrentWebsite(null);
      resetEditForm();
      actionRef.current?.reload();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 重置添加表单
   */
  const resetAddForm = () => {
    setAddFormTab('group');
    setAddOriginIPs([{ type: 'primary', protocol: 'http', address: '', weight: 10 }]);
    setAddRedirectUrl('');
    setAddRedirectStatusCode(301);
    setAddSelectedTemplate('');
    addForm.resetFields();
  };

  /**
   * 重置编辑表单
   */
  const resetEditForm = () => {
    setEditFormTab('group');
    setEditOriginIPs([{ type: 'primary', protocol: 'http', address: '', weight: 10 }]);
    setEditRedirectUrl('');
    setEditRedirectStatusCode(301);
    setEditSelectedTemplate('');
  };

  /**
   * 打开编辑抽屉
   */
  const openEditDrawer = (record: WebsiteItem) => {
    setCurrentWebsite(record);
    editForm.setFieldsValue(record);
    // 模拟加载回源设置数据
    setEditFormTab('manual');
    setEditOriginIPs([
      { type: 'primary', protocol: 'http', address: '192.168.1.100', weight: 10 },
      { type: 'backup', protocol: 'https', address: '192.168.1.101', weight: 5 },
    ]);
    setEditDrawerVisible(true);
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<WebsiteItem>[] = [
    {
      title: '域名',
      dataIndex: 'domain',
      key: 'domain',
      width: 250,
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'CNAME',
      dataIndex: 'cname',
      key: 'cname',
      width: 300,
      copyable: true,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '线路',
      dataIndex: 'lineGroup',
      key: 'lineGroup',
      width: 150,
      valueType: 'select',
      valueEnum: {
        '线路1': { text: '线路1' },
        '线路2': { text: '线路2' },
        '线路3': { text: '线路3' },
      },
    },
    {
      title: 'HTTPS',
      dataIndex: 'https',
      key: 'https',
      width: 100,
      valueType: 'select',
      valueEnum: {
        true: { text: '有效', status: 'Success' },
        false: { text: '无', status: 'Default' },
      },
      render: (_, record) => {
        return record.https ? <Tag color="success">有效</Tag> : <Tag color="default">无</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        active: { text: '活跃', status: 'Success' },
        inactive: { text: '非活跃', status: 'Error' },
      },
      render: (_, record) => {
        const statusMap = {
          active: { color: 'success', text: '活跃' },
          inactive: { color: 'error', text: '非活跃' },
        };
        const status = statusMap[record.status];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => openEditDrawer(record)}
        >
          编辑
        </Button>,
        <Button
          key="clear"
          type="link"
          size="small"
          icon={<ClearOutlined />}
          onClick={() => openClearCacheModal(record.id, record.domain)}
          style={{ color: '#ff9800' }}
        >
          清除缓存
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个网站吗？"
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
      data: websites,
      success: true,
      total: websites.length,
    };
  };

  /**
   * 模拟的回源分组模板
   */
  const mockTemplates = [
    { id: 't1', name: '默认回源组', type: 'IP', address: '192.168.1.100' },
    { id: 't2', name: '备用回源组', type: 'IP', address: '192.168.1.101' },
    { id: 't3', name: 'CDN回源组', type: '域名', address: 'origin.example.com' },
  ];

  /**
   * 渲染回源配置 Tabs
   */
  const renderOriginTabs = (isEdit: boolean = false) => {
    const activeTab = isEdit ? editFormTab : addFormTab;
    const setActiveTab = isEdit ? setEditFormTab : setAddFormTab;
    const originIPs = isEdit ? editOriginIPs : addOriginIPs;
    const redirectUrl = isEdit ? editRedirectUrl : addRedirectUrl;
    const setRedirectUrl = isEdit ? setEditRedirectUrl : setAddRedirectUrl;
    const redirectStatusCode = isEdit ? editRedirectStatusCode : addRedirectStatusCode;
    const setRedirectStatusCode = isEdit ? setEditRedirectStatusCode : setAddRedirectStatusCode;
    const selectedTemplate = isEdit ? editSelectedTemplate : addSelectedTemplate;
    const setSelectedTemplate = isEdit ? setEditSelectedTemplate : setAddSelectedTemplate;

    return (
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as any)}>
        <TabPane tab="使用分组" key="group">
          <div style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                style={{ width: '100%' }}
                placeholder="选择回源分组"
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
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
                onClick={() => {
                  message.info('添加源站组功能（Mock 模式）');
                  // TODO: 打开添加源站组对话框
                }}
              >
                添加源站组
              </Button>
            </Space>
          </div>
        </TabPane>
        <TabPane tab="重定向" key="redirect">
          <div style={{ marginTop: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入重定向 URL"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
              />
              <Select
                value={redirectStatusCode}
                onChange={setRedirectStatusCode}
                style={{ width: 100 }}
              >
                <Select.Option value={301}>301</Select.Option>
                <Select.Option value={302}>302</Select.Option>
              </Select>
            </Space.Compact>
          </div>
        </TabPane>
        <TabPane tab="手动回源" key="manual">
          <div style={{ marginTop: 16 }}>
            <Button
              type="dashed"
              onClick={() => handleAddOriginIP(isEdit)}
              style={{ marginBottom: 16, width: '100%' }}
            >
              + 添加回源
            </Button>
            {originIPs.map((ip, index) => (
              <div key={index} style={{ marginBottom: 12 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space wrap style={{ width: '100%' }}>
                    <Select
                      value={ip.type}
                      onChange={(value) => handleOriginIPChange(index, 'type', value, isEdit)}
                      style={{ width: 100 }}
                    >
                      <Select.Option value="primary">主源</Select.Option>
                      <Select.Option value="backup">备源</Select.Option>
                    </Select>
                    <Select
                      value={ip.protocol}
                      onChange={(value) => handleOriginIPChange(index, 'protocol', value, isEdit)}
                      style={{ width: 100 }}
                    >
                      <Select.Option value="http">HTTP</Select.Option>
                      <Select.Option value="https">HTTPS</Select.Option>
                    </Select>
                    <Input
                      placeholder="IP 或域名"
                      value={ip.address}
                      onChange={(e) => handleOriginIPChange(index, 'address', e.target.value, isEdit)}
                      style={{ width: 200 }}
                    />
                    <InputNumber
                      min={1}
                      max={100}
                      value={ip.weight}
                      onChange={(value) => handleOriginIPChange(index, 'weight', value || 10, isEdit)}
                      style={{ width: 80 }}
                      placeholder="权重"
                    />
                    {originIPs.length > 1 && (
                      <Button danger onClick={() => handleRemoveOriginIP(index, isEdit)}>
                        删除
                      </Button>
                    )}
                  </Space>
                </Space>
              </div>
            ))}
          </div>
        </TabPane>
      </Tabs>
    );
  };

  /**
   * 渲染表单内容
   */
  const renderFormContent = (form: any, isEdit: boolean = false) => {
    return (
      <div style={{ padding: '0 24px' }}>
        <Form form={form} layout="horizontal" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
          {/* 域名 */}
          {isEdit ? (
            <Form.Item
              name="domain"
              label="域名"
              rules={[{ required: true, message: '请输入域名' }]}
            >
              <Input placeholder="请输入域名，例如：example.com" />
            </Form.Item>
          ) : (
            <Form.Item
              name="domain"
              label="域名"
              rules={[{ required: true, message: '请输入域名' }]}
              extra="每行一个域名，支持批量添加"
            >
              <Input.TextArea
                rows={4}
                placeholder="请输入域名，每行一个，例如：&#10;example.com&#10;www.example.com&#10;api.example.com"
              />
            </Form.Item>
          )}

          {/* 线路配置（数据来自线路分组） */}
          <Form.Item
            name="lineGroup"
            label="线路配置"
            rules={[{ required: true, message: '请选择线路组' }]}
            tooltip="数据来源：线路分组"
          >
            <Select placeholder="请选择线路分组" style={{ width: 200 }}>
              <Select.Option value="线路1">线路1</Select.Option>
              <Select.Option value="线路2">线路2</Select.Option>
              <Select.Option value="线路3">线路3</Select.Option>
            </Select>
          </Form.Item>

          {/* 缓存规则 */}
          <Form.Item name="cacheRules" label="缓存规则">
            <Select placeholder="请选择缓存规则" style={{ width: 200 }}>
              <Select.Option value="首页缓存">首页缓存</Select.Option>
              <Select.Option value="图片缓存">图片缓存</Select.Option>
              <Select.Option value="API缓存">API缓存</Select.Option>
              <Select.Option value="静态资源缓存">静态资源缓存</Select.Option>
              <Select.Option value="视频缓存">视频缓存</Select.Option>
            </Select>
          </Form.Item>

          {/* HTTPS 配置 - 横向排列 */}
          <Form.Item label="HTTPS 配置">
            <Space size="large">
              <Form.Item name="https" valuePropName="checked" noStyle>
                <Checkbox
                  onChange={(e) => {
                    // 当取消 HTTPS 时，同时取消跳转和 HSTS
                    if (!e.target.checked) {
                      form.setFieldsValue({
                        httpsForceRedirect: false,
                        hstsEnabled: false,
                      });
                    }
                  }}
                >
                  启用 HTTPS
                </Checkbox>
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.https !== curr.https}>
                {({ getFieldValue }) => (
                  <Form.Item name="httpsForceRedirect" valuePropName="checked" noStyle>
                    <Checkbox disabled={!getFieldValue('https')}>
                      HTTPS 跳转
                    </Checkbox>
                  </Form.Item>
                )}
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.https !== curr.https}>
                {({ getFieldValue }) => (
                  <Form.Item name="hstsEnabled" valuePropName="checked" noStyle>
                    <Checkbox disabled={!getFieldValue('https')}>
                      HSTS
                    </Checkbox>
                  </Form.Item>
                )}
              </Form.Item>
            </Space>
          </Form.Item>

          {/* 回源设置 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>回源设置</div>
            {renderOriginTabs(isEdit)}
          </div>
        </Form>
      </div>
    );
  };

  return (
    <>
      <ProTable<WebsiteItem>
        headerTitle={
          <Space>
            网站管理
            {wsConnected && <Tag color="success">实时连接 (Mock)</Tag>}
            {!wsConnected && <Tag color="error">连接断开</Tag>}
          </Space>
        }
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        scroll={{ x: 'max-content' }}
        toolBarRender={() => [
          selectedRowKeys.length > 0 && (
            <Button
              key="batchClearCache"
              icon={<ClearOutlined />}
              style={{ color: '#ff9800', borderColor: '#ff9800' }}
              onClick={handleBatchClearCacheClick}
            >
              批量清除缓存 ({selectedRowKeys.length})
            </Button>
          ),
          selectedRowKeys.length > 0 && (
            <Popconfirm
              key="batchDelete"
              title={`确定要删除选中的 ${selectedRowKeys.length} 个网站吗？`}
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button type="primary" danger>
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          ),
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddDrawerVisible(true)}
          >
            添加网站
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

      {/* 添加网站抽屉 */}
      <Drawer
        title="添加网站"
        width={720}
        open={addDrawerVisible}
        onClose={() => {
          setAddDrawerVisible(false);
          resetAddForm();
        }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setAddDrawerVisible(false);
                resetAddForm();
              }}>
                取消
              </Button>
              <Button onClick={resetAddForm}>
                重置
              </Button>
              <Button type="primary" onClick={handleAddWebsite}>
                提交
              </Button>
            </Space>
          </div>
        }
        destroyOnClose
      >
        {renderFormContent(addForm, false)}
      </Drawer>

      {/* 编辑网站抽屉 */}
      <Drawer
        title="编辑网站"
        width={720}
        open={editDrawerVisible}
        onClose={() => {
          setEditDrawerVisible(false);
          setCurrentWebsite(null);
          resetEditForm();
        }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setEditDrawerVisible(false);
                setCurrentWebsite(null);
                resetEditForm();
              }}>
                取消
              </Button>
              <Button type="primary" onClick={handleEditWebsite}>
                保存
              </Button>
            </Space>
          </div>
        }
        destroyOnClose
      >
        {renderFormContent(editForm, true)}
      </Drawer>

      {/* 清除缓存对话框 */}
      <Modal
        title="清除缓存"
        open={clearCacheModalVisible}
        onOk={handleClearCache}
        onCancel={() => setClearCacheModalVisible(false)}
        okText="确认清除"
        cancelText="取消"
        okButtonProps={{
          disabled:
            (clearCacheType === 'url' && !clearCacheUrl) ||
            (clearCacheType === 'directory' && !clearCacheDirectory),
          danger: true,
        }}
        width={520}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 清除类型选择 */}
          <div>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>清除类型</div>
            <Radio.Group
              value={clearCacheType}
              onChange={(e) => setClearCacheType(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="all">清除所有缓存</Radio>
                <Radio value="url">指定 URL 清除</Radio>
                <Radio value="directory">清除目录</Radio>
              </Space>
            </Radio.Group>
          </div>

          {/* URL 输入框 */}
          {clearCacheType === 'url' && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>URL 地址</div>
              <Input
                value={clearCacheUrl}
                onChange={(e) => setClearCacheUrl(e.target.value)}
                placeholder="例如: https://example.com/path/to/file.html"
              />
            </div>
          )}

          {/* 目录输入框 */}
          {clearCacheType === 'directory' && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>目录路径</div>
              <Input
                value={clearCacheDirectory}
                onChange={(e) => setClearCacheDirectory(e.target.value)}
                placeholder="例如: /images/ 或 /static/"
              />
            </div>
          )}

          {/* 提示信息 */}
          <Alert
            message={
              clearCacheType === 'all'
                ? '将清除该网站的所有缓存，需要重新生成。'
                : clearCacheType === 'url'
                ? '将清除指定 URL 的缓存。'
                : '将清除指定目录下的所有缓存。'
            }
            type="warning"
            showIcon
          />
        </Space>
      </Modal>

      {/* 批量清除缓存 Modal */}
      <Modal
        title={`批量清除缓存 (${selectedRowKeys.length} 个网站)`}
        open={batchClearCacheModalVisible}
        onOk={handleBatchClearCacheConfirm}
        onCancel={() => setBatchClearCacheModalVisible(false)}
        okText="确认清除"
        cancelText="取消"
        okButtonProps={{
          disabled:
            (batchClearCacheType === 'url' && !batchClearCacheUrl) ||
            (batchClearCacheType === 'directory' && !batchClearCacheDirectory),
          danger: true,
        }}
        width={520}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 清除类型选择 */}
          <div>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>清除类型</div>
            <Radio.Group
              value={batchClearCacheType}
              onChange={(e) => setBatchClearCacheType(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="all">清除所有缓存</Radio>
                <Radio value="url">指定 URL 清除</Radio>
                <Radio value="directory">清除目录</Radio>
              </Space>
            </Radio.Group>
          </div>

          {/* URL 输入框 */}
          {batchClearCacheType === 'url' && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>URL 地址</div>
              <Input
                value={batchClearCacheUrl}
                onChange={(e) => setBatchClearCacheUrl(e.target.value)}
                placeholder="例如: https://example.com/path/to/file.html"
              />
            </div>
          )}

          {/* 目录输入框 */}
          {batchClearCacheType === 'directory' && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>目录路径</div>
              <Input
                value={batchClearCacheDirectory}
                onChange={(e) => setBatchClearCacheDirectory(e.target.value)}
                placeholder="例如: /images/ 或 /static/"
              />
            </div>
          )}

          {/* 提示信息 */}
          <Alert
            message={
              batchClearCacheType === 'all'
                ? `将清除 ${selectedRowKeys.length} 个网站的所有缓存，需要重新生成。`
                : batchClearCacheType === 'url'
                ? `将清除 ${selectedRowKeys.length} 个网站的指定 URL 缓存。`
                : `将清除 ${selectedRowKeys.length} 个网站的指定目录缓存。`
            }
            type="warning"
            showIcon
          />
        </Space>
      </Modal>
    </>
  );
};

export default WebsitesPage;
