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
import { KeyOutlined } from "@ant-design/icons"
import { UiTipBanner } from "../../../components/ui-tips/ui-tip-banner"

/**
 * Admin tip: manage API keys for all users.
 */
export function ManageApiKeysTipBanner() {
  return (
    <UiTipBanner
      tipId="manageApiKeys"
      title="API keys for all users"
      description={
        <>
          <p>
            Manage API keys for <b>all registered users</b>. To generate a new
            key for yourself, use{" "}
            <b>My API Keys</b> under Account.
          </p>
          <p>
            <b>Attention:</b> deleting an API key will prevent API clients from
            reporting for corresponding agents and will interrupt reporting from
            the associated testing environment and CI/CD pipeline. Notify people
            responsible for those components so they can create a new API key.
          </p>
        </>
      }
      icon={<KeyOutlined />}
      to="/my-api-keys"
      actionLabel="My API Keys"
      dismissAriaLabel="Dismiss API keys tip"
    />
  )
}
