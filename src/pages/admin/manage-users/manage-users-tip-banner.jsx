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
import { UserOutlined } from "@ant-design/icons"
import { message } from "antd"
import { UiTipBanner } from "../../../components/ui-tips/ui-tip-banner"

function signupUrl() {
  return `${window.location.origin}/sign-up`
}

/**
 * Admin tip: manage user registrations.
 */
export function ManageUsersTipBanner() {
  const handleCopySignupLink = async () => {
    const url = signupUrl()
    try {
      await navigator.clipboard.writeText(url)
      message.success("Sign-up link copied")
    } catch {
      message.error("Could not copy sign-up link")
    }
  }

  return (
    <UiTipBanner
      tipId="manageUsers"
      title="User registrations"
      description={
        <>
          <p>
            Manage user registrations: reset passwords, block users, or change
            roles. To create an account for someone else, ask them to use the
            sign-up form — once they are done, the new user appears here for you
            to confirm their registration.
          </p>
        </>
      }
      icon={<UserOutlined />}
      actionLabel="Copy sign-up link"
      onAction={handleCopySignupLink}
      dismissAriaLabel="Dismiss users tip"
      style={{ marginTop: 0, marginBottom: 16 }}
    />
  )
}
