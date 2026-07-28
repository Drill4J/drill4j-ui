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
import { useEffect, useState } from "react"
import { message, Tabs } from "antd"
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import * as API from "../../../../modules/metrics/api-metrics"

const TAB_ITEMS = [
  { key: "results", label: "Results", path: "" },
  { key: "coverage", label: "Coverage", path: "coverage" },
]

function resolveActiveTab(pathname, basePath) {
  const suffix = pathname.slice(basePath.length).replace(/^\//, "")
  if (!suffix) {
    return "results"
  }
  const match = TAB_ITEMS.find((tab) => tab.path === suffix)
  return match?.key ?? "results"
}

export const TestSessionBuildLayout = () => {
  const { groupId, testSessionId, buildId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const sessionBuildBasePath = `/metrics/${groupId}/test-sessions/${encodeURIComponent(testSessionId)}/builds/${encodeURIComponent(buildId)}`

  const [session, setSession] = useState()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadSession = async () => {
      setLoading(true)
      try {
        const detail = await API.getTestSessionDetail(groupId, testSessionId, buildId)
        if (!cancelled) {
          setSession(detail)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch test session. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSession()
    return () => {
      cancelled = true
    }
  }, [groupId, testSessionId, buildId])

  const activeKey = resolveActiveTab(location.pathname, sessionBuildBasePath)

  const handleTabChange = (key) => {
    const tab = TAB_ITEMS.find((item) => item.key === key)
    if (!tab) {
      return
    }
    const target = tab.path ? `${sessionBuildBasePath}/${tab.path}` : sessionBuildBasePath
    navigate({ pathname: target, search: location.search })
  }

  return (
    <>
      <Tabs
        activeKey={activeKey}
        items={TAB_ITEMS.map(({ key, label }) => ({ key, label }))}
        onChange={handleTabChange}
        style={{ marginBottom: 16 }}
      />
      <Outlet context={{ session, sessionLoading: loading }} />
    </>
  )
}
