import { Layout } from 'antd';

const { Content } = Layout;

const AuthLayout = ({ children }) => (
  <Layout style={{ minHeight: '100vh' }}>
    <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '24px', background: '#fff' }}>
        {children}
      </div>
    </Content>
  </Layout>
);

export default AuthLayout;
