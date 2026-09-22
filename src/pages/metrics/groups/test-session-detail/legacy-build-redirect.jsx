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
import { Navigate, useParams, useSearchParams } from "react-router-dom"

/** Legacy `/test-sessions/:id/builds/:buildId` → session page with `?buildId=`. */
export function TestSessionLegacyBuildRedirect() {
  const { groupId, testSessionId, buildId } = useParams()
  const [searchParams] = useSearchParams()

  const params = new URLSearchParams(searchParams)
  if (buildId) {
    params.set("buildId", buildId)
  }
  const query = params.toString()

  return (
    <Navigate
      to={`/metrics/${groupId}/test-sessions/${encodeURIComponent(testSessionId)}${
        query ? `?${query}` : ""
      }`}
      replace
    />
  )
}
