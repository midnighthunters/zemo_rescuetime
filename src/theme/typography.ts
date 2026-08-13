import type { TextStyle } from "react-native";

/**
 * Semantic type roles built on the platform system typeface. Weight is used to
 * create hierarchy — body copy is never heavier than `600`.
 */
export const type = {
  largeHeroNumber: {
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -1.4,
    lineHeight: 58,
    fontVariant: ["tabular-nums"]
  },
  heroNumber: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 46,
    fontVariant: ["tabular-nums"]
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.8,
    lineHeight: 40
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 26
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 22
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22
  },
  supportive: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20
  },
  supportiveMedium: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20
  },
  caption: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    lineHeight: 16
  },
  metric: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 27,
    fontVariant: ["tabular-nums"]
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.1,
    lineHeight: 21
  }
} as const satisfies Record<string, TextStyle>;

export type TypeRole = keyof typeof type;

/** Legacy numeric sizes retained for older call sites. */
export const typography = {
  title: type.largeTitle.fontSize,
  heading: type.sectionTitle.fontSize,
  subheading: type.cardTitle.fontSize,
  body: type.body.fontSize,
  small: type.caption.fontSize
} as const;
