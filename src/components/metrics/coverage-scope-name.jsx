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
import { LinkOutlined } from "@ant-design/icons"
import { Tooltip } from "antd"
import "./coverage-scope-name.css"

/**
 * Plain-text scope name with a chainlink icon that appears on hover.
 * Clicking the icon copies a link to this scope (and applies its filters).
 *
 * @param {{ name: React.ReactNode, onCopyLink?: () => void, ellipsis?: boolean }} props
 */
export function CoverageScopeName({ name, onCopyLink, ellipsis }) {
  return (
    <span className={`coverage-scope-name${ellipsis ? " coverage-scope-name--ellipsis" : ""}`}>
      <span className="coverage-scope-name__text">{name}</span>
      <Tooltip title="Copy link">
        <LinkOutlined
          className="coverage-scope-name__link"
          onClick={(event) => {
            event.stopPropagation()
            onCopyLink?.()
          }}
        />
      </Tooltip>
    </span>
  )
}
