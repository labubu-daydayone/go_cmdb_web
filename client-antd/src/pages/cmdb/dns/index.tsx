import { useState } from 'react';
import { useNavigate } from '@umijs/max';
import { ProTable } from '@ant-design/pro-components';
import { Button, Drawer, Form, Input, Switch, Space, message, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, EyeOutlined, EyeInvisibleOutlined, CopyOutlined, FileTextOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface DNSConfig {
  id: string;
  domain: string;
  token: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const DNSConfigPage = () => {
  const [dataSource, setDataSource] = useState<DNSConfig[]>([
    {
      id: '1',
      domain: 'example.com',
      token: 'dns_token_mock_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      status: 'active',
      createdAt: '2024-01-01 10:00:00',
    },
    {
      id: '2',
      domain: 'test.com',
      token: 'dns_token_mock_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      status: 'active',
      createdAt: '2024-01-02 11:00:00',
    },
  ]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [showTokens, setShowTokens] = useState<Set<string>>(new Set());

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (record: DNSConfig) => {
    setEditingId(record.id);
    form.setFieldsValue({
      domain: record.domain,
      token: record.token,
      status: record.status === 'active',
    });
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    setDataSource(dataSource.filter((item) => item.id !== id));
    message.success('删除成功');
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
                  domain: values.domain,
                  token: values.token,
                  status: values.status ? 'active' : 'inactive',
                }
              : item
          )
        );
        message.success('编辑成功');
      } else {
        const newConfig: DNSConfig = {
          id: Date.now().toString(),
          domain: values.domain,
          token: values.token,
          status: values.status ? 'active' : 'inactive',
          createdAt: new Date().toLocaleString('zh-CN'),
        };
        setDataSource([newConfig, ...dataSource]);
        message.success('添加成功');
      }

      setDrawerVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const toggleShowToken = (id: string) => {
    const newShowTokens = new Set(showTokens);
    if (newShowTokens.has(id)) {
      newShowTokens.delete(id);
    } else {
      newShowTokens.add(id);
    }
    setShowTokens(newShowTokens);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    message.success('Token 已复制到剪贴板');
  };

  const columns = [
    {
      title: '域名',
      dataIndex: 'domain',
      key: 'domain',
      width: 200,
      render: (domain: string, record: DNSConfig) => (
        <Space>
          <span>{domain}</span>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => {
              // 跳转到解析记录页面
              navigate(`/website/dns/records/${record.id}`);
            }}
            title="查看解析记录"
          />
        </Space>
      ),
    },
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      render: (token: string, record: DNSConfig) => (
        <Space>
          <Text code style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {showTokens.has(record.id) ? token : '••••••••••••••••'}
          </Text>
          <Button
            type="text"
            size="small"
            icon={showTokens.has(record.id) ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => toggleShowToken(record.id)}
          />
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyToken(token)}
          />
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
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
      render: (_: any, record: DNSConfig) => (
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
            添加 DNS 配置
          </Button>,
        ]}
      />

      <Drawer
        title={editingId ? '编辑 DNS 配置' : '添加 DNS 配置'}
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
            label="域名"
            name="domain"
            rules={[{ required: true, message: '请输入域名' }]}
          >
            <Input placeholder="请输入域名，如：example.com" />
          </Form.Item>

          <Form.Item
            label="Token"
            name="token"
            rules={[{ required: true, message: '请输入 Token' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入 DNS Token"
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default DNSConfigPage;
