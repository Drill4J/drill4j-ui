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
import { useNavigate, useParams } from "react-router-dom"
import { TestSessionsListView } from "../../../../components/metrics/test-sessions-list-view"

export const BuildTestsPage = () => {
  const { groupId, buildId } = useParams()
  const navigate = useNavigate()

  const handleRowClick = (session) => {
    navigate(
      `/metrics/${groupId}/test-sessions/${encodeURIComponent(session.testSessionId)}/builds/${encodeURIComponent(buildId)}`
    )
  }

  return (
    <TestSessionsListView groupId={groupId} buildId={buildId} onRowClick={handleRowClick} />
  )
}
