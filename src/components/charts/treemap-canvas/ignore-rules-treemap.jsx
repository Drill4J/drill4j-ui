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

import { IGNORE_COLORS } from "./colors"
import { ignorePaintStrategy } from "./paint-strategies"
import { withTreemapPaint } from "./with-treemap-paint"

function IgnoreRulesModeChrome() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
      <Typography.Text type="secondary">
        Right-click a package, class, or method for exclusion actions.
      </Typography.Text>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span
          style={{
            width: 12,
            height: 12,
            background: IGNORE_COLORS.ITEM_IGNORED,
            border: `1px solid ${IGNORE_COLORS.BORDER_DEFAULT}`,
          }}
        />
        Excluded method
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span
          style={{
            width: 12,
            height: 12,
            background: IGNORE_COLORS.CONTAINER,
            border: `2px solid ${IGNORE_COLORS.BORDER_WITH_IGNORED}`,
            boxSizing: "border-box",
          }}
        />
        Contains excluded methods
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span
          style={{
            width: 12,
            height: 12,
            background: IGNORE_COLORS.ITEM_NORMAL,
            border: `1px solid ${IGNORE_COLORS.BORDER_DEFAULT}`,
          }}
        />
        Not excluded
      </span>
    </div>
  )
}

/**
 * Treemap specialized for method-ignore-rules: ignore paint + legend chrome.
 * Built via {@link withTreemapPaint} — use the same helper for future use cases.
 */
export const IgnoreRulesTreemap = withTreemapPaint(ignorePaintStrategy, {
  showColorbar: false,
  modeChrome: <IgnoreRulesModeChrome />,
})
