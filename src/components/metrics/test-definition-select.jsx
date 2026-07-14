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
import { useCallback, useEffect, useRef, useState } from "react"
import { Select, message } from "antd"
import * as API from "../../modules/metrics/api-metrics"

const PAGE_SIZE = 50
const SEARCH_DEBOUNCE_MS = 300

function formatDefinitionLabel(definition) {
  const name = definition.testName || definition.testDefinitionId
  const path = definition.testPath
  return path ? `${name} (${path})` : name
}

function toOption(definition) {
  return {
    value: definition.testDefinitionId,
    label: formatDefinitionLabel(definition),
  }
}

function mergeOptions(rows, selected, append, previous) {
  const next = rows.map(toOption)
  const byValue = new Map()
  if (append) {
    previous.forEach((option) => byValue.set(option.value, option))
  }
  next.forEach((option) => byValue.set(option.value, option))
  if (selected) {
    byValue.set(selected.value, selected)
  }
  return Array.from(byValue.values())
}

/**
 * @param {{
 *   groupId: string,
 *   testSessionId: string,
 *   buildId?: string,
 *   value?: string,
 *   onChange?: (testDefinitionId?: string) => void,
 *   style?: import("react").CSSProperties,
 * }} props
 */
export function TestDefinitionSelect({
  groupId,
  testSessionId,
  buildId,
  value,
  onChange,
  style,
}) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)

  const searchTimeoutRef = useRef(null)
  const requestIdRef = useRef(0)
  const selectedOptionRef = useRef(null)
  selectedOptionRef.current = selectedOption

  const fetchDefinitions = useCallback(
    async ({ query = "", page: fetchPage = 1, append = false } = {}) => {
      if (!groupId || !testSessionId) {
        return
      }

      const requestId = ++requestIdRef.current
      setLoading(true)

      try {
        const result = await API.getTestSessionDefinitions(groupId, testSessionId, buildId, {
          query: query || undefined,
          page: fetchPage,
          pageSize: PAGE_SIZE,
        })
        if (requestId !== requestIdRef.current) {
          return
        }

        setPage(fetchPage)
        setHasMore(fetchPage * PAGE_SIZE < (result.paging?.total ?? 0))
        setOptions((previous) =>
          mergeOptions(result.data, selectedOptionRef.current, append, previous)
        )
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return
        }
        message.error(`Failed to fetch test definitions. ${error?.message}`)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [buildId, groupId, testSessionId]
  )

  useEffect(() => {
    setOptions([])
    setSearch("")
    setPage(1)
    setHasMore(false)
    setSelectedOption(null)
    fetchDefinitions({ page: 1 })
  }, [fetchDefinitions])

  useEffect(() => {
    if (!value) {
      setSelectedOption(null)
      return undefined
    }

    if (selectedOptionRef.current?.value === value) {
      return undefined
    }

    let cancelled = false
    API.getTestSessionDefinitions(groupId, testSessionId, buildId, {
      query: value,
      page: 1,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        if (cancelled) {
          return
        }
        const match = result.data.find((definition) => definition.testDefinitionId === value)
        const option = match ? toOption(match) : { value, label: value }
        setSelectedOption(option)
        setOptions((previous) => mergeOptions([], option, true, previous))
      })
      .catch((error) => {
        if (!cancelled) {
          message.error(`Failed to resolve selected test definition. ${error?.message}`)
        }
      })

    return () => {
      cancelled = true
    }
  }, [buildId, groupId, testSessionId, value])

  useEffect(
    () => () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    },
    []
  )

  const handleSearch = useCallback(
    (nextSearch) => {
      setSearch(nextSearch)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      searchTimeoutRef.current = setTimeout(() => {
        fetchDefinitions({ query: nextSearch, page: 1, append: false })
      }, SEARCH_DEBOUNCE_MS)
    },
    [fetchDefinitions]
  )

  const handlePopupScroll = useCallback(
    (event) => {
      const target = event.target
      if (!hasMore || loading) {
        return
      }
      if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 24) {
        fetchDefinitions({ query: search, page: page + 1, append: true })
      }
    },
    [fetchDefinitions, hasMore, loading, page, search]
  )

  const handleChange = useCallback(
    (nextValue, option) => {
      if (!nextValue) {
        setSelectedOption(null)
        onChange?.(undefined)
        return
      }
      const nextSelected = {
        value: nextValue,
        label: option?.label ?? nextValue,
      }
      setSelectedOption(nextSelected)
      onChange?.(nextValue)
    },
    [onChange]
  )

  return (
    <Select
      allowClear
      showSearch
      filterOption={false}
      placeholder="All tests in session"
      style={{ minWidth: 280, ...style }}
      loading={loading}
      value={value}
      options={options}
      onSearch={handleSearch}
      onPopupScroll={handlePopupScroll}
      onChange={handleChange}
      onDropdownVisibleChange={(open) => {
        if (open && options.length === 0) {
          fetchDefinitions({ query: search, page: 1 })
        }
      }}
    />
  )
}
