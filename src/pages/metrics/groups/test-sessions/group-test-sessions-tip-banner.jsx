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
import { ExperimentOutlined } from "@ant-design/icons"
import { UiTipBanner } from "../../../../components/ui-tips/ui-tip-banner"

/**
 * Tip for the group-wide test sessions list.
 */
export function GroupTestSessionsTipBanner() {
  return (
    <UiTipBanner
      tipId="groupTestSessions"
      title="Test Sessions"
      description="This page lists all test sessions in the group — across every app, not limited to a single application or build."
      icon={<ExperimentOutlined />}
      dismissAriaLabel="Dismiss group test sessions tip"
      style={{ marginTop: 0, marginBottom: 0 }}
    />
  )
}
