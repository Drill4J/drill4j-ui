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
import { useState } from "react"
import { Typography } from "antd"
import { useParams } from "react-router-dom"
import useAuth from "../../../../modules/auth/hooks/use-auth-hook"
import { GroupSettingsForm } from "../../../../components/metrics/group-settings-form"
import { MetricsDayStatusCalendar } from "../../../../components/metrics/metrics-day-status-calendar"
import { MetricsRefreshForm } from "../../../../components/metrics/metrics-refresh-form"

const { Title } = Typography

const sectionStyle = {
  paddingTop: 16,
  marginTop: 16,
  borderTop: "1px solid rgba(0, 0, 0, 0.06)",
}

/**
 * @param {{
 *   title: string,
 *   children: import("react").ReactNode,
 *   first?: boolean,
 * }} props
 */
function Section({ title, children, first = false }) {
  return (
    <section style={first ? undefined : sectionStyle}>
      <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
        {title}
      </Title>
      {children}
    </section>
  )
}

export const DataManagementPage = () => {
  const { groupId } = useParams()
  const { isAdmin } = useAuth()
  const [statusRefreshKey, setStatusRefreshKey] = useState(0)

  return (
    <>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        Data Management
      </Title>

      <Section title="Metrics update by day" first>
        <MetricsDayStatusCalendar
          groupId={groupId}
          refreshKey={statusRefreshKey}
        />
      </Section>

      <Section title="Trigger metrics update">
        <MetricsRefreshForm
          groupId={groupId}
          disabled={!isAdmin}
          onSuccess={() => setStatusRefreshKey((key) => key + 1)}
        />
      </Section>

      <Section title="Retention & metrics period">
        <GroupSettingsForm groupId={groupId} disabled={!isAdmin} />
      </Section>
    </>
  )
}
