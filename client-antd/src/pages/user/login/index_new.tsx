/**
 * 登录页面（使用 API v2.1）
 */

import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { useIntl, history, useModel } from '@umijs/max';
import { message } from 'antd';
import React, { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { authAPI } from '@/services/api';
import { setToken } from '@/utils/request';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const intl = useIntl();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      // 调用登录 API
      const response = await authAPI.login(values);
      
      // 保存 Token
      setToken(response.data.token);
      
      // 更新全局状态
      await setInitialState((s) => ({
        ...s,
        currentUser: response.data.user,
      }));
      
      message.success('登录成功！');
      
      // 跳转到首页
      const urlParams = new URL(window.location.href).searchParams;
      history.push(urlParams.get('redirect') || '/');
    } catch (error: any) {
      // 错误已由 request 工具自动处理
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', height: '100vh' }}>
      <LoginForm
        logo={<img alt="logo" src="/logo.svg" />}
        title="CMDB"
        subTitle={intl.formatMessage({
          id: 'pages.layouts.userLayout.title',
          defaultMessage: '配置管理数据库系统',
        })}
        onFinish={async (values) => {
          await handleSubmit(values as { username: string; password: string });
        }}
      >
        <ProFormText
          name="username"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined />,
          }}
          placeholder="用户名: admin"
          rules={[
            {
              required: true,
              message: '请输入用户名!',
            },
          ]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined />,
          }}
          placeholder="密码"
          rules={[
            {
              required: true,
              message: '请输入密码！',
            },
          ]}
        />
      </LoginForm>
    </div>
  );
};

export default Login;
