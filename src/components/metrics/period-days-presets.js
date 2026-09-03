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

/** @typedef {'unset' | 'custom' | number} PeriodPresetKey */

/** Preset day values offered in period selects (excludes unset/custom). */
export const PERIOD_DAY_PRESETS = [
  { days: 14, label: "2 weeks (14 days)" },
  { days: 30, label: "1 month (30 days)" },
  { days: 60, label: "2 months (60 days)" },
  { days: 90, label: "3 months (90 days)" },
  { days: 180, label: "6 months (180 days)" },
]

/**
 * @param {number | null | undefined} days
 * @returns {PeriodPresetKey}
 */
export function resolvePeriodPresetKey(days) {
  if (days === undefined) {
    return "custom"
  }
  if (days == null) {
    return "unset"
  }
  if (PERIOD_DAY_PRESETS.some((preset) => preset.days === days)) {
    return days
  }
  return "custom"
}
