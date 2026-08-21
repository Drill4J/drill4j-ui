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
import { Col, Divider, Row } from "antd"
import { UpdatePasswordForm } from "./update-password-form"
import { MyAccountCard } from "./my-account-card"
import { PreferencesSection } from "./preferences-section"
import "./my-account.css"

export const MyAccount = () => (
  <div className="my-account-page">
    <MyAccountCard />

    <Row gutter={[48, 24]} style={{ marginTop: 24 }}>
      <Col xs={24} md={12} lg={10}>
        <Divider orientation="left" orientationMargin={0}>
          Update password
        </Divider>
        <UpdatePasswordForm />
      </Col>
      <Col xs={24} md={12} lg={10}>
        <Divider orientation="left" orientationMargin={0}>
          Preferences
        </Divider>
        <PreferencesSection />
      </Col>
    </Row>
  </div>
)
