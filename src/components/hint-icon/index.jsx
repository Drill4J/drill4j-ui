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
import { TitleHelpTooltip } from "../metrics/title-help-tooltip"

/**
 * Light-themed (i) help tooltip. Thin wrapper around {@link TitleHelpTooltip}
 * for filter bars and legacy call sites that may pass a style wrapper.
 *
 * @param {{
 *   title: import("react").ReactNode,
 *   style?: import("react").CSSProperties,
 *   ariaLabel?: string,
 * }} props
 */
export function HintIcon({ title, style, ariaLabel }) {
  const tooltip = (
    <TitleHelpTooltip
      title={title}
      ariaLabel={ariaLabel}
      className="title-help-tooltip__trigger--flush"
    />
  )

  if (!style) {
    return tooltip
  }

  return <span style={style}>{tooltip}</span>
}
