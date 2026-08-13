import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export type SizeClass = "compact" | "regular" | "large";

export type ResponsiveLayout = {
  readonly width: number;
  readonly height: number;
  readonly sizeClass: SizeClass;
  readonly isCompact: boolean;
  readonly isRegular: boolean;
  readonly isLarge: boolean;
  /** Horizontal screen padding for the current size class. */
  readonly gutter: number;
  /** Readable content width; long-form content is centered on iPad. */
  readonly contentMaxWidth: number;
  /** Columns for the animal collection grid. */
  readonly gridColumns: number;
  /** True when vertical space is tight (small phones, large text). */
  readonly isShort: boolean;
};

const COMPACT_MAX_WIDTH = 380;
const REGULAR_MAX_WIDTH = 700;

/**
 * Semantic breakpoints. Nothing in the app hardcodes a device width; screens ask
 * for a size class and derive padding, columns, and max width from it.
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { height, width } = useWindowDimensions();

  return useMemo(() => {
    const sizeClass: SizeClass =
      width < COMPACT_MAX_WIDTH
        ? "compact"
        : width < REGULAR_MAX_WIDTH
          ? "regular"
          : "large";

    const gutter = sizeClass === "compact" ? 20 : sizeClass === "regular" ? 24 : 32;
    const contentMaxWidth =
      sizeClass === "large" ? (width >= 900 ? 760 : 640) : width;
    const gridColumns =
      sizeClass === "large" ? (width >= 1000 ? 4 : 3) : 2;

    return {
      contentMaxWidth,
      gridColumns,
      gutter,
      height,
      isCompact: sizeClass === "compact",
      isLarge: sizeClass === "large",
      isRegular: sizeClass === "regular",
      isShort: height < 700,
      sizeClass,
      width
    };
  }, [height, width]);
}

/** Vertical space the floating tab bar occupies, excluding safe-area inset. */
export const TAB_BAR_HEIGHT = 62;
export const TAB_BAR_MARGIN = 12;

export function getTabBarClearance(bottomInset: number) {
  return TAB_BAR_HEIGHT + TAB_BAR_MARGIN * 2 + Math.max(bottomInset - 4, 0);
}
