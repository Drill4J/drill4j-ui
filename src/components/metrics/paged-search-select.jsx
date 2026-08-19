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
import { useCallback, useEffect, useState } from "react"
import { Select, message } from "antd"

const DEFAULT_PAGE_SIZE = 50
const SEARCH_DEBOUNCE_MS = 300

export function stringOption(value) {
  return { value, label: value }
}

function labelsFromValues(values) {
  return values.map((entry) => ({ value: entry, label: entry }))
}

/**
 * Server-paged searchable Select.
 *
 * Open → page 1. Type → new request with `query`. Scroll → next page.
 * Close without selecting discards the search.
 *
 * `loadPage` must return `{ data, paging: { total } }` for
 * `{ query?: string, page: number, pageSize: number }`.
 *
 * @param {{
 *   loadPage: (params: { query?: string, page: number, pageSize: number }) => Promise<{ data: unknown[], paging: { total: number } }>,
 *   toOption: (row: unknown) => { value: string, label: string },
 *   value?: string | string[],
 *   onChange?: (value?: string | string[]) => void,
 *   placeholder?: string,
 *   pageSize?: number,
 *   mode?: "multiple",
 *   size?: "small" | "middle" | "large",
 *   valueEqualsLabel?: boolean,
 *   defaultOpen?: boolean,
 *   style?: import("react").CSSProperties,
 * }} props
 */
export function PagedSearchSelect({
  loadPage,
  toOption,
  value,
  onChange,
  placeholder,
  pageSize = DEFAULT_PAGE_SIZE,
  mode,
  size,
  valueEqualsLabel = false,
  defaultOpen = false,
  style,
}) {
  const isMultiple = mode === "multiple"
  const [open, setOpen] = useState(defaultOpen)
  const [search, setSearch] = useState("")
  const [options, setOptions] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState()
  const [selectedOptions, setSelectedOptions] = useState([])

  useEffect(() => {
    if (valueEqualsLabel) {
      return undefined
    }
    if (isMultiple) {
      return undefined
    }
    if (!value) {
      setSelectedOption(undefined)
      return undefined
    }
    if (selectedOption?.value === value) {
      return undefined
    }

    let cancelled = false
    loadPage({ query: value, page: 1, pageSize })
      .then((result) => {
        if (cancelled) {
          return
        }
        const match = result.data.find((row) => toOption(row).value === value)
        if (match) {
          setSelectedOption(toOption(match))
        }
      })
      .catch((error) => {
        if (!cancelled) {
          message.error(`Failed to resolve selected option. ${error?.message}`)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isMultiple, loadPage, pageSize, selectedOption?.value, toOption, value, valueEqualsLabel])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    let cancelled = false
    const timeoutId = setTimeout(
      () => {
        setLoading(true)
        loadPage({
          query: search || undefined,
          page: 1,
          pageSize,
        })
          .then((result) => {
            if (cancelled) {
              return
            }
            setPage(1)
            setHasMore(pageSize < result.paging.total)
            setOptions(result.data.map(toOption))
          })
          .catch((error) => {
            if (!cancelled) {
              message.error(`Failed to fetch options. ${error?.message}`)
            }
          })
          .finally(() => {
            if (!cancelled) {
              setLoading(false)
            }
          })
      },
      search ? SEARCH_DEBOUNCE_MS : 0
    )

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [loadPage, open, pageSize, search, toOption])

  const handlePopupScroll = useCallback(
    (event) => {
      const target = event.target
      if (!hasMore || loading) {
        return
      }
      if (target.scrollTop + target.offsetHeight < target.scrollHeight - 24) {
        return
      }

      const nextPage = page + 1
      setLoading(true)
      loadPage({
        query: search || undefined,
        page: nextPage,
        pageSize,
      })
        .then((result) => {
          setPage(nextPage)
          setHasMore(nextPage * pageSize < result.paging.total)
          setOptions((previous) => [...previous, ...result.data.map(toOption)])
        })
        .catch((error) => {
          message.error(`Failed to fetch options. ${error?.message}`)
        })
        .finally(() => {
          setLoading(false)
        })
    },
    [hasMore, loadPage, loading, page, pageSize, search, toOption]
  )

  const handleChange = useCallback(
    (nextOption) => {
      if (isMultiple) {
        if (!nextOption || nextOption.length === 0) {
          setSelectedOptions([])
          onChange?.(undefined)
          return
        }
        const nextSelected = nextOption.map((option) => ({
          value: option.value,
          label: option.label,
        }))
        setSelectedOptions(nextSelected)
        onChange?.(nextSelected.map((option) => option.value))
        return
      }
      if (!nextOption) {
        setSelectedOption(undefined)
        onChange?.(undefined)
        return
      }
      setSelectedOption({ value: nextOption.value, label: nextOption.label })
      onChange?.(nextOption.value)
    },
    [isMultiple, onChange]
  )

  const selectValue = (() => {
    if (isMultiple) {
      if (valueEqualsLabel) {
        return Array.isArray(value) ? labelsFromValues(value) : []
      }
      return selectedOptions
    }
    if (!value) {
      return undefined
    }
    if (valueEqualsLabel) {
      return { value, label: value }
    }
    return {
      value,
      label: selectedOption?.value === value ? selectedOption.label : "",
    }
  })()

  return (
    <Select
      allowClear
      showSearch
      labelInValue
      filterOption={false}
      mode={mode}
      size={size}
      maxTagCount={isMultiple ? "responsive" : undefined}
      placeholder={placeholder}
      style={{ minWidth: 280, ...style }}
      loading={loading}
      open={open}
      searchValue={open ? search : ""}
      value={selectValue}
      options={options}
      onSearch={(nextSearch) => {
        if (open) {
          setSearch(nextSearch)
        }
      }}
      onPopupScroll={handlePopupScroll}
      onChange={handleChange}
      onDropdownVisibleChange={(nextOpen) => {
        setOpen(nextOpen)
        setSearch("")
      }}
    />
  )
}
