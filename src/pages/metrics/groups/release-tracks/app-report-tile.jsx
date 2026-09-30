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
import { formatCoveragePercent } from "../../../../modules/metrics/coverage-segments"
import { getCoverageColor } from "../../../../components/charts/treemap-canvas/colors"
import { changeCoverageRatio, coverageRatio } from "./quality-gate"

const COVERAGE_SCALE = "VIVID"
const ALERT_COLOR = "#FF9900"

function coverageColor(ratio) {
  return getCoverageColor(ratio, COVERAGE_SCALE)
}

function buildVersionLabel(buildId) {
  if (!buildId) {
    return undefined
  }
  const parts = String(buildId).split(":")
  return parts[parts.length - 1] || buildId
}

/**
 * @param {{
 *   app: {
 *     appId: string,
 *     buildId: string,
 *     baselineBuildId?: string | null,
 *     coverage?: object,
 *     changeCoverage?: object,
 *     impactedTests?: number,
 *     coverageByTestType?: {
 *       testTypeId?: string | null,
 *       testTypeName: string,
 *       probesCovered?: number,
 *       probesTotal?: number,
 *     }[],
 *   },
 *   showChangeCoverage?: boolean,
 *   gateAlert?: boolean,
 *   gateMuted?: boolean,
 * }} props
 */
export function AppReportTile({
  app,
  showChangeCoverage = false,
  gateAlert = false,
  gateMuted = false,
}) {
  const version = buildVersionLabel(app.buildId)
  const baselineVersion = buildVersionLabel(app.baselineBuildId)
  const compareLabel = baselineVersion ? `${version} vs ${baselineVersion}` : version
  const title = baselineVersion ? `${app.appId} ${compareLabel}` : app.appId

  const changeRatio = changeCoverageRatio(app.changeCoverage)
  const totalRatio = coverageRatio(app.coverage)
  const accentColor = gateAlert
    ? ALERT_COLOR
    : getCoverageColor(showChangeCoverage ? changeRatio : totalRatio, COVERAGE_SCALE)
  const tileClass = [
    "release-tracks-app-tile",
    gateAlert ? "release-tracks-app-tile--alert" : "",
    gateMuted ? "release-tracks-app-tile--ok" : "",
  ]
    .filter(Boolean)
    .join(" ")
  const typeCoverage = (app.coverageByTestType ?? []).slice(0, 3).map((entry) => ({
    ...entry,
    ratio: coverageRatio(entry),
  }))

  return (
    <article className={tileClass} style={{ borderLeftColor: accentColor }}>
      <h3 className="release-tracks-app-tile__heading" title={title}>
        <span className="release-tracks-app-tile__name">{app.appId}</span>
        <span className="release-tracks-app-tile__compare">{compareLabel}</span>
      </h3>
      <dl className="release-tracks-app-tile__metrics">
        {showChangeCoverage ? (
          <div className="release-tracks-app-tile__metric release-tracks-app-tile__metric--primary">
            <dt>Change coverage</dt>
            <dd style={{ color: accentColor }}>{formatCoveragePercent(changeRatio)}</dd>
          </div>
        ) : null}
        <div
          className={`release-tracks-app-tile__metric ${
            showChangeCoverage
              ? "release-tracks-app-tile__metric--secondary"
              : "release-tracks-app-tile__metric--primary"
          }`}
        >
          <dt>Coverage</dt>
          <dd style={{ color: gateAlert ? accentColor : coverageColor(totalRatio) }}>
            {formatCoveragePercent(totalRatio)}
          </dd>
        </div>
        {showChangeCoverage ? (
          <div className="release-tracks-app-tile__metric release-tracks-app-tile__metric--impact">
            <dt>Impacted</dt>
            <dd>{(app.impactedTests ?? 0).toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>
      {typeCoverage.length > 0 ? (
        <ul className="release-tracks-app-tile__types">
          {typeCoverage.map((entry) => (
            <li key={entry.testTypeId ?? "unmarked"}>
              <span>{entry.testTypeName}</span>
              <b style={{ color: coverageColor(entry.ratio) }}>
                {formatCoveragePercent(entry.ratio)}
              </b>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
