import React from 'react';
import { Layout, Card } from 'antd';

const { Content } = Layout;

const ErrorLayout = ({ errorTitle, errorText }) => (
  <Layout style={{ minHeight: '100vh' }}>
    <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Card title={errorTitle} style={{ width: 300 }}>
        <p>{errorText}</p>
      </Card>
    </Content>
  </Layout>
);

export default ErrorLayout;
