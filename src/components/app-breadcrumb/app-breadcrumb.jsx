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
import { Breadcrumb } from "antd"
import { Link } from "react-router-dom"
import "./app-breadcrumb.css"

const linkStyle = { color: "var(--d4j-blue, #2f8eea)" }

const currentStyle = {
  color: "var(--d4j-ink, #0c2438)",
  fontWeight: 600,
  fontFamily: "var(--d4j-display, Space Grotesk, sans-serif)",
}

const separatorStyle = {
  color: "var(--d4j-muted, #5a7186)",
  margin: "0 8px",
  userSelect: "none",
}

/**
 * Report Portal–style breadcrumb trail.
 *
 * @param {{
 *   items: Array<{ key?: string, label: import("react").ReactNode, path?: string }>,
 *   rootIcon?: import("react").ReactNode,
 *   style?: import("react").CSSProperties,
 * }} props
 */
export function AppBreadcrumb({ items, rootIcon, style }) {
  if (!items?.length) {
    return null
  }

  return (
    <Breadcrumb
      className="app-breadcrumb"
      style={{ marginBottom: 0, fontSize: 14, minWidth: 0, ...style }}
      separator={<span style={separatorStyle}>&gt;</span>}
      items={items.map((item, index) => {
        const isLast = index === items.length - 1
        const key = item.key ?? `${item.path ?? "crumb"}-${index}`
        const icon =
          index === 0 && rootIcon ? (
            <span className="app-breadcrumb__root-icon">{rootIcon}</span>
          ) : null

        if (isLast || !item.path) {
          return {
            key,
            title: (
              <span style={currentStyle}>
                {icon}
                {item.label}
              </span>
            ),
          }
        }

        return {
          key,
          title: (
            <Link to={item.path} style={linkStyle}>
              {icon}
              {item.label}
            </Link>
          ),
        }
      })}
    />
  )
}

/**
 * Top chrome row used above Metrics / Account / Administration content.
 *
 * @param {{
 *   children: import("react").ReactNode,
 *   className?: string,
 * }} props
 */
export function AppSectionChrome({ children, className }) {
  const classNames = ["app-section-chrome", className].filter(Boolean).join(" ")
  return <div className={classNames}>{children}</div>
}
