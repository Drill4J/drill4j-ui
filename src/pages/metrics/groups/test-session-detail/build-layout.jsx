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
import { Outlet, useParams } from "react-router-dom"
import * as API from "../../../../modules/metrics/api-metrics"

export const TestSessionBuildLayout = () => {
  const { groupId, testSessionId, buildId } = useParams()

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

  return <Outlet context={{ session, sessionLoading: loading }} />
}
