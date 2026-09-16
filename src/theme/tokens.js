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

/**
 * Brand / surface palette — cool slate base + happy mint,
 * with sky blue, honey warn, and rose danger tuned to the same family.
 */
export const colors = {
  ink: "#0c2438",
  inkSoft: "#16324a",
  mist: "#e8f1f7",
  paper: "#f6fafc",
  line: "#d3dee8",
  muted: "#5a7186",
  /** Primary actions / links — soft sky (less neon than #007fff). */
  blue: "#2f8eea",
  blueDeep: "#1a6fc7",
  blueSoft: "#cfe4fb",
  blueMist: "#eaf4fc",
  /** Info bridge between blue and mint. */
  cyan: "#1aabb8",
  /** Success + coverage “own” — happy mint. */
  mint: "#1bbf9a",
  mintDeep: "#149a7c",
  coverageOwn: "#2f8eea",
  coverageOther: "#90caf9",
  coverageGap: "#f0a04b",
  /** Alerts — soft honey gold (not orange). */
  warn: "#c9992e",
  warnDeep: "#a67b1f",
  warnSoft: "#e6c56a",
  warnBg: "#fff8e8",
  warnBorder: "#efd89a",
  /** Danger / destructive — cool rose. */
  danger: "#e4565c",
  dangerHover: "#d3484e",
  dangerActive: "#bf3d43",
  dangerBg: "#fef1f2",
  dangerBorder: "#f5c2c5",
  successBg: "#e8f8f3",
  successBorder: "#a8e6d4",
  infoBg: "#e8f6f8",
  infoBorder: "#a5dce3",
  surface: "#ffffff",
  text: "#0c2438",
}

/** rgba helpers for Ant token shadows / hovers (blue #2f8eea). */
const blueRgb = "47, 142, 234"
const dangerRgb = "228, 86, 92"

export const fonts = {
  body: "'Figtree', 'Segoe UI', sans-serif",
  display: "'Space Grotesk', 'Figtree', 'Segoe UI', sans-serif",
}

/** Ant Design 5 theme config for ConfigProvider. */
export const antdTheme = {
  token: {
    colorPrimary: colors.blue,
    colorInfo: colors.cyan,
    colorSuccess: colors.mint,
    colorWarning: colors.warn,
    colorError: colors.danger,
    colorErrorHover: colors.dangerHover,
    colorErrorActive: colors.dangerActive,
    colorErrorBg: colors.dangerBg,
    colorErrorBgHover: "#fde4e6",
    colorErrorBorder: colors.dangerBorder,
    colorErrorText: colors.danger,
    colorWarningBg: colors.warnBg,
    colorWarningBorder: colors.warnBorder,
    colorWarningText: colors.warnDeep,
    colorSuccessBg: colors.successBg,
    colorSuccessBorder: colors.successBorder,
    colorInfoBg: colors.infoBg,
    colorInfoBorder: colors.infoBorder,
    colorLink: colors.blue,
    colorLinkHover: colors.blueDeep,
    colorText: colors.text,
    colorTextSecondary: colors.muted,
    colorTextTertiary: colors.muted,
    colorBorder: colors.line,
    colorBorderSecondary: colors.line,
    colorBgContainer: colors.surface,
    colorBgLayout: colors.paper,
    colorBgElevated: colors.surface,
    borderRadius: 10,
    borderRadiusLG: 12,
    borderRadiusSM: 8,
    fontFamily: fonts.body,
    fontSize: 14,
    controlHeight: 36,
    wireframe: false,
  },
  components: {
    Layout: {
      siderBg: colors.ink,
      bodyBg: colors.paper,
      headerBg: colors.paper,
      triggerBg: colors.inkSoft,
      lightSiderBg: colors.ink,
    },
    Menu: {
      darkItemBg: colors.ink,
      darkSubMenuItemBg: colors.ink,
      darkPopupBg: colors.inkSoft,
      darkItemSelectedBg: `rgba(${blueRgb}, 0.35)`,
      darkItemHoverBg: "rgba(255, 255, 255, 0.06)",
      darkItemColor: "rgba(255, 255, 255, 0.72)",
      darkItemSelectedColor: "#ffffff",
      darkGroupTitleColor: "rgba(255, 255, 255, 0.4)",
      itemBorderRadius: 8,
      itemMarginInline: 8,
      iconSize: 16,
    },
    Table: {
      headerBg: colors.mist,
      headerColor: colors.muted,
      borderColor: colors.line,
      rowHoverBg: `rgba(${blueRgb}, 0.04)`,
      headerBorderRadius: 10,
    },
    Card: {
      colorBgContainer: colors.surface,
      colorBorderSecondary: colors.line,
      borderRadiusLG: 12,
      paddingLG: 20,
    },
    Button: {
      borderRadius: 10,
      controlHeight: 36,
      fontWeight: 600,
      primaryShadow: `0 2px 8px rgba(${blueRgb}, 0.22)`,
      dangerShadow: `0 2px 8px rgba(${dangerRgb}, 0.22)`,
      defaultBorderColor: colors.line,
      defaultColor: colors.text,
    },
    Modal: {
      contentBg: colors.surface,
      headerBg: colors.surface,
      titleColor: colors.text,
      titleFontSize: 18,
      titleLineHeight: 1.3,
      borderRadiusLG: 14,
      paddingContentHorizontalLG: 24,
      paddingMD: 20,
      footerBg: colors.surface,
    },
    Popconfirm: {
      borderRadiusLG: 12,
      colorText: colors.text,
      colorTextHeading: colors.text,
      zIndexPopup: 1060,
    },
    Popover: {
      borderRadiusLG: 12,
      colorBgElevated: colors.surface,
    },
    Dropdown: {
      borderRadiusLG: 12,
      colorBgElevated: colors.surface,
      controlItemBgHover: `rgba(${blueRgb}, 0.06)`,
      controlItemBgActive: `rgba(${blueRgb}, 0.1)`,
      paddingBlock: 6,
    },
    Message: {
      contentBg: colors.surface,
      contentPadding: "10px 16px",
      borderRadiusLG: 12,
      zIndexPopup: 1090,
    },
    Notification: {
      width: 384,
      borderRadiusLG: 12,
      colorBgElevated: colors.surface,
      zIndexPopup: 1090,
    },
    Alert: {
      borderRadiusLG: 12,
      colorErrorBg: colors.dangerBg,
      colorErrorBorder: colors.dangerBorder,
      colorWarningBg: colors.warnBg,
      colorWarningBorder: colors.warnBorder,
      colorSuccessBg: colors.successBg,
      colorSuccessBorder: colors.successBorder,
      colorInfoBg: colors.infoBg,
      colorInfoBorder: colors.infoBorder,
    },
    Tabs: {
      itemSelectedColor: colors.blueDeep,
      inkBarColor: colors.blue,
      itemHoverColor: colors.blue,
      titleFontSize: 14,
    },
    Tag: {
      borderRadiusSM: 6,
      defaultBg: colors.mist,
    },
    Breadcrumb: {
      itemColor: colors.muted,
      lastItemColor: colors.text,
      linkColor: colors.blue,
      linkHoverColor: colors.blueDeep,
      separatorColor: colors.line,
    },
    Input: {
      borderRadius: 10,
      activeBorderColor: colors.blue,
      hoverBorderColor: colors.cyan,
    },
    Select: {
      borderRadius: 10,
      optionSelectedBg: `rgba(${blueRgb}, 0.08)`,
    },
    Typography: {
      fontFamilyCode: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    },
  },
}
