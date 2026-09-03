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
import { Typography } from "antd"
import { TitleHelpTooltip } from "./title-help-tooltip"

const { Title } = Typography

const APP_STRUCTURE_HELP = (
  <div style={{ width: 420, lineHeight: 1.55 }}>
    <p style={{ margin: "0 0 8px" }}>
      Interactive treemap of packages, classes, and methods. Tile size reflects
      probe count; colors show coverage.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        <b>Click</b> a package, class, or method to scroll to it in
        the tables below.
      </li>
      <li style={{ marginBottom: 8 }}>
        <b>Double-click</b> a package or class to drill into it. Use the
        breadcrumbs above the map to go back up.
      </li>
      <li>
        Use <b>max depth</b> to set how many nested levels are shown. Optionally
        highlight tiles below a coverage threshold, or switch to a colorblind
        palette.
      </li>
    </ul>
  </div>
)

const PACKAGE_TREE_HELP = (
  <div style={{ width: 420, lineHeight: 1.55 }}>
    <p style={{ margin: "0 0 8px" }}>
      Nested tables of packages → classes → methods, with coverage for each row.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        Expand package rows for nested packages. Use{" "}
        <b>N classes (show)</b> / <b>N methods (show)</b> to open classes and
        load methods.
      </li>
      <li>
        Hover a name and click the chain-link icon to copy a link to that
        package, class, or method. Opening the link expands and scrolls to the
        same row.
      </li>
    </ul>
  </div>
)

export function CoverageAppStructureTitle() {
  return (
    <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
      App structure
      <TitleHelpTooltip
        title={APP_STRUCTURE_HELP}
        ariaLabel="How to use the app structure treemap"
      />
    </Title>
  )
}

export function CoveragePackagesTitle() {
  return (
    <Title level={5} style={{ marginTop: 0 }}>
      Packages / classes / methods
      <TitleHelpTooltip
        title={PACKAGE_TREE_HELP}
        ariaLabel="How to use the packages classes methods table"
      />
    </Title>
  )
}
