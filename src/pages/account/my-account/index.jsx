import { Col, Divider, Row } from "antd"
import { UpdatePasswordForm } from "./update-password-form"
import { MyAccountCard } from "./my-account-card"

export const MyAccount = () => (
  <>
    <Row>
      <Col span={24}>
        <MyAccountCard />
      </Col>
    </Row>
    <Row style={{ marginTop: "15px" }}>
      <Col span={24}>
        <Divider orientation="left" orientationMargin={0}>
          Update password
        </Divider>
        <UpdatePasswordForm />
      </Col>
    </Row>
  </>
)
