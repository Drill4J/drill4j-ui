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

/** Global on/off for all UI tips. Absent or anything other than "0" means enabled. */
export const UI_TIPS_ENABLED_KEY = "uiTips.enabled"

/**
 * Browser-local UI tip / promo dismiss flags.
 * Add new tip ids here as more tips are introduced.
 */
export const UI_TIPS = {
  trendsPromo: {
    key: "uiTips.trendsPromo.dismissed",
    /** Older keys still cleared / checked for compatibility. */
    legacyKeys: ["metrics.trendsPromo.dismissed"],
  },
  compareBuilds: {
    key: "uiTips.compareBuilds.dismissed",
  },
  whatIsGroup: {
    key: "uiTips.whatIsGroup.dismissed",
  },
  whatIsApp: {
    key: "uiTips.whatIsApp.dismissed",
  },
  whatIsBuild: {
    key: "uiTips.whatIsBuild.dismissed",
  },
}

function storageKeysForTip(tipId) {
  const tip = UI_TIPS[tipId]
  if (!tip) {
    return []
  }
  return [tip.key, ...(tip.legacyKeys || [])]
}

/** Default: tips are enabled. */
export function areUiTipsEnabled() {
  try {
    return localStorage.getItem(UI_TIPS_ENABLED_KEY) !== "0"
  } catch {
    return true
  }
}

export function setUiTipsEnabled(enabled) {
  try {
    localStorage.setItem(UI_TIPS_ENABLED_KEY, enabled ? "1" : "0")
  } catch {
    // Ignore storage errors.
  }
}

export function isUiTipDismissed(tipId) {
  try {
    return storageKeysForTip(tipId).some(
      (key) => localStorage.getItem(key) === "1"
    )
  } catch {
    return false
  }
}

/** Tips must be enabled globally and this tip must not be dismissed. */
export function shouldShowUiTip(tipId) {
  return areUiTipsEnabled() && !isUiTipDismissed(tipId)
}

export function dismissUiTip(tipId) {
  const tip = UI_TIPS[tipId]
  if (!tip) {
    return
  }
  try {
    localStorage.setItem(tip.key, "1")
  } catch {
    // Ignore quota / private-mode errors; dismiss still works for this session.
  }
}

export function hasDismissedUiTips() {
  return Object.keys(UI_TIPS).some((tipId) => isUiTipDismissed(tipId))
}

/** Clears all known UI tip dismiss flags in this browser (does not change the global enable toggle). */
export function resetAllUiTips() {
  try {
    Object.keys(UI_TIPS).forEach((tipId) => {
      storageKeysForTip(tipId).forEach((key) => localStorage.removeItem(key))
    })
  } catch {
    // Ignore storage errors.
  }
}
