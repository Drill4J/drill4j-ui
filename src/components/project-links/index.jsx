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
import { Tooltip } from "antd"
import { GithubOutlined, ReadOutlined } from "@ant-design/icons"
import "./project-links.css"

const LINKS = [
  {
    href: "https://github.com/Drill4J/drill4j/issues",
    label: "Report Issues",
    icon: <GithubOutlined />,
  },
  {
    href: "https://drill4j.github.io/",
    label: "Documentation",
    icon: <ReadOutlined />,
  },
]

const LICENSE_HREF = "https://github.com/Drill4J/drill4j/blob/develop/LICENSE"

/**
 * @param {{ onDark?: boolean }} props
 */
export function ProjectLinks({ onDark = false }) {
  const classNames = ["project-links-block", onDark && "project-links-block--on-dark"]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={classNames}>
      <a
        className="project-links__license"
        href={LICENSE_HREF}
        target="_blank"
        rel="noopener noreferrer"
      >
        EPAM © 2020 Apache 2.0 License
      </a>
      <div className="project-links">
        {LINKS.map((link) => (
          <Tooltip key={link.href} title={link.label} placement="top">
            <a
              className="project-links__item"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
