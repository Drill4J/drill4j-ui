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
import { Typography } from "antd"
import { useNavigate, useParams } from "react-router-dom"
import { TestSessionsFiltersBar } from "../../../../components/metrics/test-sessions-filters-bar"
import { TestSessionsListView } from "../../../../components/metrics/test-sessions-list-view"
import { useTestSessionsSearchParams } from "../build-detail/use-test-sessions-search-params"

const { Title } = Typography

export const TestSessionsPage = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const {
    testTaskIds,
    createdBys,
    results,
    updateQueryParams,
    clearFilters,
  } = useTestSessionsSearchParams()

  const handleRowClick = (session) => {
    navigate(`/metrics/${groupId}/test-sessions/${encodeURIComponent(session.testSessionId)}`)
  }

  return (
    <>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        Test Sessions
      </Title>
      <TestSessionsFiltersBar
        groupId={groupId}
        testTaskIds={testTaskIds}
        createdBys={createdBys}
        results={results}
        onTestTaskIdsChange={(value) => updateQueryParams({ testTaskIds: value, page: 1 })}
        onCreatedBysChange={(value) => updateQueryParams({ createdBys: value, page: 1 })}
        onResultsChange={(value) => updateQueryParams({ results: value, page: 1 })}
        onClear={clearFilters}
      />
      <TestSessionsListView groupId={groupId} onRowClick={handleRowClick} />
    </>
  )
}
