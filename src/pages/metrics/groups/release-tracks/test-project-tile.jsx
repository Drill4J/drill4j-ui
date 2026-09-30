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

function sumField(rows, field) {
  return rows.reduce((total, row) => total + (row[field] ?? 0), 0)
}

/**
 * @param {{
 *   project: {
 *     testProjectId: string,
 *     testTypeId?: string | null,
 *     testTypeName?: string,
 *     apps: {
 *       appId: string,
 *       impacted?: number,
 *       neverExecuted?: number,
 *       passed?: number,
 *       failed?: number,
 *     }[],
 *   },
 * }} props
 */
export function TestProjectTile({ project }) {
  const apps = project.apps ?? []
  const appCount = apps.length
  const impacted = sumField(apps, "impacted")
  const neverExecuted = sumField(apps, "neverExecuted")
  const passed = sumField(apps, "passed")
  const failed = sumField(apps, "failed")
  const neverRatio = impacted > 0 ? neverExecuted / impacted : 0
  const tone =
    neverExecuted <= 0 ? "clear" : neverRatio >= 0.2 ? "warn" : neverRatio > 0 ? "soft" : "clear"
  const typeLabel = project.testTypeName || "Other"

  return (
    <article className={`release-tracks-test-tile release-tracks-test-tile--${tone}`}>
      <header className="release-tracks-test-tile__heading">
        <div className="release-tracks-test-tile__title-block">
          <h3 className="release-tracks-test-tile__name">{project.testProjectId}</h3>
          <span className="release-tracks-test-tile__type">{typeLabel}</span>
        </div>
        <span className="release-tracks-test-tile__meta">
          {appCount} {appCount === 1 ? "app" : "apps"}
        </span>
      </header>

      <div className="release-tracks-test-tile__hero">
        <div className="release-tracks-test-tile__hero-value">
          <span className="release-tracks-test-tile__hero-num">{neverExecuted.toLocaleString()}</span>
          <span className="release-tracks-test-tile__hero-den">/{impacted.toLocaleString()}</span>
        </div>
        <span className="release-tracks-test-tile__hero-label">Never executed</span>
      </div>

      <ul className="release-tracks-test-tile__aside">
        <li className="release-tracks-test-tile__aside-item release-tracks-test-tile__aside-item--failed">
          <b>{failed.toLocaleString()}</b>
          <span>failed</span>
        </li>
        <li className="release-tracks-test-tile__aside-item">
          <b>{passed.toLocaleString()}</b>
          <span>passed</span>
        </li>
      </ul>
    </article>
  )
}
