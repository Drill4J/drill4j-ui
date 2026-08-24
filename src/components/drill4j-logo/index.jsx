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
import "./drill4j-logo.css"

function Drill4jMark() {
  return (
    <svg
      className="drill4j-logo__mark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="drill4j-logo__brackets"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M41.897 17.235l.034.033 5.6 5.6a1.6 1.6 0 0 1 .034 2.229l-.034.034-5.6 5.6-.034.034a1.6 1.6 0 0 1-2.262-2.262l.034-.035L44.137 24 39.67 19.53a1.6 1.6 0 0 1 2.228-2.296zM6.103 17.235a1.6 1.6 0 0 1 2.262 2.262l-.034.034L3.863 24l4.468 4.468a1.6 1.6 0 0 1-2.228 2.297l-.034-.034-5.6-5.6a1.6 1.6 0 0 1 0-2.263l5.6-5.6.034-.033z"
      />
      <path
        className="drill4j-logo__bit"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.269 28.468a1.6 1.6 0 0 1 2.228-.033l.034.034 11.2 11.2a1.6 1.6 0 0 1 .034 2.228l-.034.034-5.6 5.6a1.595 1.595 0 0 1-1.064.468h-.089a1.595 1.595 0 0 1-1.069-.429l-.04-.039-5.6-5.6-.034-.034a1.6 1.6 0 0 1 2.262-2.262l.034.034L24 44.136l3.337-3.337L17.27 30.73l-.034-.034a1.6 1.6 0 0 1 .034-2.229zm0-11.2a1.6 1.6 0 0 1 2.228-.033l.034.034 11.2 11.2.034.034a1.6 1.6 0 0 1-2.262 2.262l-.034-.034-11.2-11.2-.034-.034a1.6 1.6 0 0 1 .034-2.229zM24.022 0c.385.005.768.148 1.069.43l.04.038 5.6 5.6.034.035a1.6 1.6 0 0 1-2.262 2.262l-.034-.034L24 3.863 20.663 7.2 30.73 17.269l.034.034a1.6 1.6 0 0 1-2.262 2.262l-.034-.034-11.2-11.2-.034-.034a1.6 1.6 0 0 1 0-2.194l.034-.035 5.6-5.6A1.595 1.595 0 0 1 23.978 0h.044z"
      />
    </svg>
  )
}

/**
 * @param {{ onDark?: boolean, collapsed?: boolean, showTagline?: boolean, className?: string }} props
 */
export function Drill4jLogo({
  onDark = false,
  collapsed = false,
  showTagline = true,
  className,
}) {
  const classNames = [
    "drill4j-logo",
    onDark && "drill4j-logo--on-dark",
    collapsed && "drill4j-logo--collapsed",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <span className={classNames} role="img" aria-label="Drill4J">
      <Drill4jMark />
      {!collapsed && (
        <span className="drill4j-logo__text">
          <span className="drill4j-logo__wordmark">DRILL4J</span>
          {showTagline && (
            <span className="drill4j-logo__tagline">Test Impact & Gap Analysis</span>
          )}
        </span>
      )}
    </span>
  )
}
