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
import { FilterOutlined } from "@ant-design/icons"
import { Skeleton, Typography } from "antd"
import { Link } from "react-router-dom"
import dayjs from "dayjs"
import {
  BaselineCompareVs,
  ComparisonBuildCard,
} from "./baseline-build-select"
import { formatCompactCount } from "../../modules/metrics/format-count"
import "./build-identity-summary.css"

const { Text } = Typography

function MetaFact({ label, children }) {
  return (
    <span className="build-identity-summary__fact">
      <span className="build-identity-summary__fact-label">{label}</span>
      <span className="build-identity-summary__fact-value">{children}</span>
    </span>
  )
}

function StatFact({ label, children }) {
  return (
    <span className="build-identity-summary__stat">
      <span className="build-identity-summary__stat-label">{label}</span>
      <span className="build-identity-summary__stat-value">{children}</span>
    </span>
  )
}

/**
 * Build identity band — version hero, quiet meta, compact stats.
 * On the Comparison tab, expands into current | vs | baseline.
 *
 * @param {{
 *   build?: {
 *     buildId?: string,
 *     buildVersion?: string,
 *     branch?: string,
 *     commitSha?: string,
 *     commitAuthor?: string,
 *     commitMessage?: string,
 *     committedAt?: string,
 *     totalClasses?: number,
 *     totalMethods?: number,
 *     totalProbes?: number,
 *     appEnvIds?: string[],
 *   } | null,
 *   sessionCount?: number,
 *   testRunCount?: number,
 *   testsHref?: string,
 *   exclusionsHref?: string,
 *   loading?: boolean,
 *   statsLoading?: boolean,
 *   compareMode?: boolean,
 *   baselineBuild?: {
 *     buildId?: string,
 *     buildVersion?: string,
 *     branch?: string,
 *     commitSha?: string,
 *     identityRatio?: number,
 *   } | null,
 *   baselineBuildId?: string,
 *   baselineLoading?: boolean,
 *   onBaselineSelect?: () => void,
 * }} props
 */
export function BuildIdentitySummary({
  build,
  sessionCount,
  testRunCount,
  testsHref,
  exclusionsHref,
  loading = false,
  statsLoading = false,
  compareMode = false,
  baselineBuild,
  baselineBuildId,
  baselineLoading = false,
  onBaselineSelect,
}) {
  if (loading) {
    return (
      <div className="build-identity-summary build-identity-summary--loading">
        <Skeleton active title={{ width: "28%" }} paragraph={{ rows: 2 }} />
      </div>
    )
  }

  const committedAt = build?.committedAt
    ? dayjs(build.committedAt).format("YYYY-MM-DD HH:mm")
    : undefined

  const metaFacts = [
    build?.branch
      ? { key: "branch", label: "Branch", value: build.branch }
      : null,
    build?.commitSha
      ? {
          key: "commit",
          label: "Commit",
          value: (
            <Text
              className="build-identity-summary__commit"
              copyable={{ text: build.commitSha }}
              ellipsis={{ tooltip: build.commitSha }}
            >
              {build.commitSha}
            </Text>
          ),
        }
      : null,
    committedAt ? { key: "committedAt", label: "Committed", value: committedAt } : null,
    build?.commitAuthor
      ? { key: "author", label: "Author", value: build.commitAuthor }
      : null,
  ].filter(Boolean)

  const envLabel = build?.appEnvIds?.length ? build.appEnvIds.join(", ") : undefined
  const hasBaseline = Boolean(baselineBuild?.buildId || baselineBuildId)

  const scannedClasses = (
    exclusionsHref ? (
      <Link
        className="build-identity-summary__exclusions"
        to={exclusionsHref}
        aria-label="Configure exclusion rules"
        title="Configure exclusion rules"
      >
        <span className="build-identity-summary__exclusions-label">
          Scanned classes
        </span>
        <span className="build-identity-summary__exclusions-count">
          {formatCompactCount(build?.totalClasses)}
        </span>
        <FilterOutlined className="build-identity-summary__exclusions-icon" aria-hidden />
      </Link>
    ) : (
      <span className="build-identity-summary__exclusions build-identity-summary__exclusions--static">
        <span className="build-identity-summary__exclusions-label">
          Scanned classes
        </span>
        <span className="build-identity-summary__exclusions-count">
          {formatCompactCount(build?.totalClasses)}
        </span>
      </span>
    )
  )

  const currentPanel = (
    <div className="build-identity-summary__current">
      <div className="build-identity-summary__hero">
        <span className="build-identity-summary__eyebrow">
          {compareMode ? "Current" : "Build"}
        </span>
        <h2 className="build-identity-summary__version">
          {build?.buildVersion || build?.buildId || "Untitled build"}
        </h2>
      </div>

      {metaFacts.length > 0 ? (
        <div className="build-identity-summary__meta">
          {metaFacts.map((fact) => (
            <MetaFact key={fact.key} label={fact.label}>
              {fact.value}
            </MetaFact>
          ))}
        </div>
      ) : null}

      {build?.commitMessage && !compareMode ? (
        <p className="build-identity-summary__message" title={build.commitMessage}>
          {build.commitMessage}
        </p>
      ) : null}

      <div className="build-identity-summary__stats-row">
        <div className="build-identity-summary__stats">
          <StatFact label="Test Sessions">
            {statsLoading ? (
              "…"
            ) : testsHref ? (
              <Link className="build-identity-summary__link" to={testsHref}>
                {sessionCount ?? "—"}
              </Link>
            ) : (
              sessionCount ?? "—"
            )}
          </StatFact>
          <StatFact label="Total Tests Executed">
            {statsLoading ? "…" : (testRunCount ?? "—")}
          </StatFact>
          {envLabel ? <StatFact label="Environments">{envLabel}</StatFact> : null}
          <span className="build-identity-summary__stats-tail">{scannedClasses}</span>
        </div>
      </div>
    </div>
  )

  if (!compareMode) {
    return <div className="build-identity-summary">{currentPanel}</div>
  }

  return (
    <div className="build-identity-summary build-identity-summary--compare">
      {currentPanel}
      <BaselineCompareVs />
      <div className="build-identity-summary__baseline">
        <ComparisonBuildCard
          role="baseline"
          build={hasBaseline ? baselineBuild : null}
          fallbackId={baselineBuildId}
          loading={baselineLoading}
          empty={!hasBaseline && !baselineLoading}
          onSelect={onBaselineSelect}
          onChange={onBaselineSelect}
        />
      </div>
    </div>
  )
}
