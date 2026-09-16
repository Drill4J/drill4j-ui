/**
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Layout, Card } from "antd"
import "../auth/auth-layout.css"

const { Content } = Layout

const ErrorLayout = ({ errorTitle, errorText }) => (
  <Layout className="auth-layout">
    <Content>
      <Card title={errorTitle} style={{ width: 500, maxWidth: "100%" }}>
        <p style={{ color: "var(--d4j-muted, #5a7186)", margin: 0 }}>{errorText}</p>
      </Card>
    </Content>
  </Layout>
)

export default ErrorLayout
