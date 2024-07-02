import React, { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import axios from 'axios';
import { Link } from 'react-router-dom';

const SignInForm = () => {
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    try {
      const response = await axios.post('/api/sign-in', {
        username: values.username,
        password: values.password,
      });
      console.log('SignIn response:', response.data);
      message.success('Logged in successfully!');
    } catch (error) {
      console.error('SignIn error:', error.response);
      setError(error.response?.data?.message || 'Something went wrong!');
    }
  };

  return (
    <Form
      name="normal_login"
      className="login-form"
      initialValues={{ remember: true }}
      onFinish={onFinish}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: 'Please input your Username!' }]}
      >
        <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Username" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please input your Password!' }]}
      >
        <Input
          prefix={<LockOutlined className="site-form-item-icon" />}
          type="password"
          placeholder="Password"
        />
      </Form.Item>

      {error && (
        <Form.Item>
          <span style={{ color: 'red' }}>{error}</span>
        </Form.Item>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" className="login-form-button">
          Log in
        </Button>
        Or <Link to="/sign-up">register now!</Link>
      </Form.Item>
      <Form.Item>
        <Link to="/forgot-password">Forgot password</Link>
      </Form.Item>
    </Form>
  );
};

export default SignInForm;
