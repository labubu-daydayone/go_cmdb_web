import { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Drawer, Form, Input, Select, InputNumber, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

interface CacheRule {
  id: string;
  ruleType: 'directory' | 'suffix' | 'file';
  pattern: string;
  ttl: number;
  forceCache?: boolean;
}

interface CacheSetting {
  id: string;
  name: string;
  rules: CacheRule[];
  addedTime: string;
}

const CacheSettingsPage = () => {
  const [dataSource, setDataSource] = useState<CacheSetting[]>([
    {
      id: '1',
      name: '首页缓存',
      rules: [
        { id: '1-1', ruleType: 'directory', pattern: '/', ttl: 3600 },
      ],
      addedTime: '2026-01-15 10:30:00',
    },
    {
      id: '2',
      name: '图片缓存',
      rules: [
        { id: '2-1', ruleType: 'suffix', pattern: 'png|jpg|gif', ttl: 86400 },
        { id: '2-2', ruleType: 'suffix', pattern: 'webp', ttl: 86400 },
      ],
      addedTime: '2026-01-14 14:20:00',
    },
    {
      id: '3',
      name: 'API缓存',
      rules: [
        { id: '3-1', ruleType: 'directory', pattern: '/api/', ttl: 300 },
      ],
      addedTime: '2026-01-13 09:15:00',
    },
  ]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [rules, setRules] = useState<CacheRule[]>([
    { id: '0', ruleType: 'directory', pattern: '', ttl: 3600 },
  ]);

  const getTypeLabel = (ruleType: string) => {
    switch (ruleType) {
      case 'directory':
        return '目录';
      case 'suffix':
        return '后缀';
      case 'file':
        return '文件';
      default:
        return '';
    }
  };

  const getPlaceholder = (ruleType: string) => {
    switch (ruleType) {
      case 'directory':
        return '/api/';
      case 'suffix':
        return 'png|jpg|txt';
      case 'file':
        return '/down/doc.txt';
      default:
        return '';
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setRules([{ id: '0', ruleType: 'directory', pattern: '', ttl: 3600 }]);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (record: CacheSetting) => {
    setEditingId(record.id);
    setRules([...record.rules]);
    form.setFieldsValue({
      name: record.name,
    });
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    setDataSource(dataSource.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleAddRule = () => {
    const newRule: CacheRule = {
      id: Date.now().toString(),
      ruleType: 'directory',
      pattern: '',
      ttl: 3600,
      forceCache: false,
    };
    setRules([...rules, newRule]);
  };

  const handleRemoveRule = (ruleId: string) => {
    if (rules.length === 1) {
      message.warning('至少需要一个缓存规则');
      return;
    }
    setRules(rules.filter((r) => r.id !== ruleId));
  };

  const handleUpdateRule = (ruleId: string, field: string, value: any) => {
    setRules(
      rules.map((r) =>
        r.id === ruleId ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (rules.some((r) => !r.pattern)) {
        message.error('请填写所有缓存规则');
        return;
      }

      if (editingId) {
        setDataSource(
          dataSource.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  name: values.name,
                  rules: [...rules],
                }
              : item
          )
        );
        message.success('编辑成功');
      } else {
        const newSetting: CacheSetting = {
          id: Date.now().toString(),
          name: values.name,
          rules: rules.map((r) => ({
            ...r,
            id: Date.now().toString() + Math.random(),
          })),
          addedTime: new Date().toLocaleString('zh-CN'),
        };
        setDataSource([newSetting, ...dataSource]);
        message.success('添加成功');
      }

      setDrawerVisible(false);
      form.resetFields();
      setRules([{ id: '0', ruleType: 'directory', pattern: '', ttl: 3600 }]);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const columns = [
    {
      title: '缓存名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '缓存规则',
      dataIndex: 'rules',
      key: 'rules',
      render: (rules: CacheRule[]) => (
        <Space direction="vertical" size="small">
          {rules.map((rule) => (
            <div key={rule.id}>
              <Tag color="blue">{getTypeLabel(rule.ruleType)}</Tag>
              <span style={{ fontFamily: 'monospace' }}>{rule.pattern}</span>
              <span style={{ color: '#999', marginLeft: 8 }}>({rule.ttl}s)</span>
              {rule.forceCache && (
                <Tag color="orange" style={{ marginLeft: 8 }}>
                  强制缓存
                </Tag>
              )}
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: '添加时间',
      dataIndex: 'addedTime',
      key: 'addedTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: CacheSetting) => (
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
        pagination={{
          defaultPageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加缓存规则
          </Button>,
        ]}
      />

      <Drawer
        title={editingId ? '编辑缓存规则' : '添加缓存规则'}
        width={720}
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
            label="缓存名称"
            name="name"
            rules={[{ required: true, message: '请输入缓存名称' }]}
          >
            <Input placeholder="请输入缓存名称" />
          </Form.Item>

          <Form.Item label="缓存规则" required>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    padding: 16,
                    position: 'relative',
                  }}
                >
                  <Space style={{ width: '100%' }}>
                    <Select
                      style={{ width: 80 }}
                      value={rule.ruleType}
                      onChange={(value) => handleUpdateRule(rule.id, 'ruleType', value)}
                    >
                      <Select.Option value="directory">目录</Select.Option>
                      <Select.Option value="suffix">后缀</Select.Option>
                      <Select.Option value="file">文件</Select.Option>
                    </Select>
                    <Input
                      style={{ flex: 1 }}
                      placeholder={getPlaceholder(rule.ruleType)}
                      value={rule.pattern}
                      onChange={(e) => handleUpdateRule(rule.id, 'pattern', e.target.value)}
                    />
                    <span style={{ whiteSpace: 'nowrap' }}>TTL:</span>
                    <InputNumber
                      min={0}
                      style={{ width: 100 }}
                      value={rule.ttl}
                      onChange={(value) => handleUpdateRule(rule.id, 'ttl', value || 3600)}
                      addonAfter="秒"
                    />
                  </Space>
                  {rules.length > 1 && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveRule(rule.id)}
                      style={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  )}
                </div>
              ))}
              <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddRule}>
                添加规则
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default CacheSettingsPage;
