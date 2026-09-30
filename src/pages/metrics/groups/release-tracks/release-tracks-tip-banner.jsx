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
import { FlagOutlined } from "@ant-design/icons"
import { UiTipBanner } from "../../../../components/ui-tips/ui-tip-banner"

export function ReleaseTracksTipBanner() {
  return (
    <UiTipBanner
      tipId="releaseTracks"
      title="Release tracks"
      description="A release track is a named line of milestones in this group. Each milestone is a slice of apps and builds. Creating a milestone auto-compares it with the previous one on the same track."
      icon={<FlagOutlined />}
      dismissAriaLabel="Dismiss release tracks tip"
      style={{ marginTop: 0, marginBottom: 0 }}
    />
  )
}
