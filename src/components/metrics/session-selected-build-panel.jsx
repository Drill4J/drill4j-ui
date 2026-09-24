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
import { message } from "antd"
import { BuildIdentitySummary } from "./build-identity-summary"
import * as API from "../../modules/metrics/api-metrics"

/**
 * Build identity for the selected affected build — same card as build
 * Coverage / Tests / Comparison tabs (`GET /api/metrics/builds/:buildId`).
 *
 * @param {{
 *   groupId: string,
 *   buildId: string,
 * }} props
 */
export function SessionSelectedBuildPanel({ groupId, buildId }) {
  const [build, setBuild] = useState()
  const [loading, setLoading] = useState(true)
  const [sessionStats, setSessionStats] = useState()
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadBuild = async () => {
      setLoading(true)
      try {
        const detail = await API.getBuildDetail(buildId)
        if (!cancelled) {
          setBuild(detail)
        }
      } catch (error) {
        if (!cancelled) {
          setBuild(undefined)
          message.error(`Failed to fetch build details. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBuild()
    return () => {
      cancelled = true
    }
  }, [buildId])

  useEffect(() => {
    let cancelled = false

    const loadStats = async () => {
      setStatsLoading(true)
      try {
        const data = await API.getBuildTestSessionStats(buildId)
        if (!cancelled) {
          setSessionStats(data)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(`Failed to fetch test session stats. ${error?.message}`)
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false)
        }
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [buildId])

  const appId = build?.appId
  const buildBasePath =
    groupId && appId && buildId
      ? `/metrics/${groupId}/apps/${encodeURIComponent(appId)}/builds/${encodeURIComponent(buildId)}`
      : undefined
  const exclusionsHref =
    groupId && appId && buildId
      ? `/metrics/${groupId}/apps/${encodeURIComponent(appId)}/method-ignore-rules?buildId=${encodeURIComponent(buildId)}`
      : undefined

  return (
    <BuildIdentitySummary
      build={build}
      sessionCount={sessionStats?.sessionCount}
      testRunCount={sessionStats?.testRunCount}
      testsHref={buildBasePath ? `${buildBasePath}/tests` : undefined}
      exclusionsHref={exclusionsHref}
      loading={loading}
      statsLoading={statsLoading}
    />
  )
}
