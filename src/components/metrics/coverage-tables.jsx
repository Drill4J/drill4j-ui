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
import { CoveragePackageTree } from "./coverage-package-tree"

/**
 * @param {{
 *   buildId: string,
 *   coverageFilters: { branches?: string[], envIds?: string[], testTags?: string[] },
 *   treemapRoots: object[],
 *   treemapLoading: boolean,
 *   scrollToPackageKey?: string | null,
 *   onScrollToPackageHandled?: () => void,
 *   scrollToClassKey?: string | null,
 *   onScrollToClassHandled?: () => void,
 *   scrollToMethod?: { signature: string, classKey: string } | null,
 *   onScrollToMethodHandled?: () => void,
 *   onPackageToggle?: (packageName?: string) => void,
 *   onClassToggle?: (scope: { packageName: string, className?: string }) => void,
 *   onPackageSelect?: (packageName?: string) => void,
 *   onClassSelect?: (scope: { packageName: string, className?: string }) => void,
 *   onMethodSelect?: (scope: { packageName: string, className: string, methodSignature: string }) => void,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   onClassesSortChange?: (sort: { sortBy: string | null, sortOrder: string | null }) => void,
 * }} props
 */
export function CoverageTables({
  buildId,
  coverageFilters,
  treemapRoots,
  treemapLoading,
  scrollToPackageKey,
  onScrollToPackageHandled,
  scrollToClassKey,
  onScrollToClassHandled,
  scrollToMethod,
  onScrollToMethodHandled,
  onPackageToggle,
  onClassToggle,
  onPackageSelect,
  onClassSelect,
  onMethodSelect,
  sortBy,
  sortOrder,
  onClassesSortChange,
}) {
  return (
    <CoveragePackageTree
      buildId={buildId}
      coverageFilters={coverageFilters}
      data={treemapRoots}
      loading={treemapLoading}
      scrollToPackageKey={scrollToPackageKey}
      onScrollToPackageHandled={onScrollToPackageHandled}
      scrollToClassKey={scrollToClassKey}
      onScrollToClassHandled={onScrollToClassHandled}
      scrollToMethod={scrollToMethod}
      onScrollToMethodHandled={onScrollToMethodHandled}
      onPackageToggle={onPackageToggle}
      onClassToggle={onClassToggle}
      onPackageSelect={onPackageSelect}
      onClassSelect={onClassSelect}
      onMethodSelect={onMethodSelect}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onClassesSortChange={onClassesSortChange}
    />
  )
}
