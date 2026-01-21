import { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Drawer, Form, Input, Select, Space, message, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, CopyOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface APIKey {
  id: string;
  name: string;
  account: string;
  accountType: string;
  apiKey: string;
  createdAt: string;
}

const APIKeysPage = () => {
  const [dataSource, setDataSource] = useState<APIKey[]>([
    {
      id: '1',
      name: '生产环境密钥',
      account: 'admin@example.com',
      accountType: 'CloudFlare',
      apiKey: 'mock_api_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      createdAt: '2024-01-01 10:00:00',
    },
    {
      id: '2',
      name: '测试环境密钥',
      account: 'test@example.com',
      accountType: 'AWS',
      apiKey: 'mock_api_key_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      createdAt: '2024-01-02 11:00:00',
    },
  ]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '••••••••••••' + key.substring(key.length - 4);
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (record: APIKey) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      account: record.account,
      accountType: record.accountType,
      apiKey: record.apiKey,
    });
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    setDataSource(dataSource.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    message.success('API Key 已复制到剪贴板');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingId) {
        setDataSource(
          dataSource.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  name: values.name,
                  account: values.account,
                  accountType: values.accountType,
                  apiKey: values.apiKey,
                }
              : item
          )
        );
        message.success('编辑成功');
      } else {
        const newKey: APIKey = {
          id: Date.now().toString(),
          name: values.name,
          account: values.account,
          accountType: values.accountType,
          apiKey: values.apiKey,
          createdAt: new Date().toLocaleString('zh-CN'),
        };
        setDataSource([newKey, ...dataSource]);
        message.success('添加成功');
      }

      setDrawerVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
      width: 200,
    },
    {
      title: '账号类型',
      dataIndex: 'accountType',
      key: 'accountType',
      width: 120,
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: '密钥',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (key: string) => (
        <Space>
          <Text code style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {maskApiKey(key)}
          </Text>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyKey(key)}
          />
        </Space>
      ),
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
      render: (_: any, record: APIKey) => (
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
            添加密钥
          </Button>,
        ]}
      />

      <Drawer
        title={editingId ? '编辑密钥' : '添加密钥'}
        width={600}
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
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入密钥名称" />
          </Form.Item>

          <Form.Item
            label="账号"
            name="account"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input placeholder="请输入账号，如：admin@example.com" />
          </Form.Item>

          <Form.Item
            label="账号类型"
            name="accountType"
            rules={[{ required: true, message: '请选择账号类型' }]}
          >
            <Select placeholder="请选择账号类型">
              <Select.Option value="CloudFlare">CloudFlare</Select.Option>
              <Select.Option value="AWS">AWS</Select.Option>
              <Select.Option value="阿里云">阿里云</Select.Option>
              <Select.Option value="腾讯云">腾讯云</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入 API Key"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default APIKeysPage;
