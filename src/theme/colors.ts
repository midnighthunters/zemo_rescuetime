import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { useColorScheme, type ColorSchemeName } from "react-native";

import { STORAGE_KEYS } from "../storage/storageKeys";

/**
 * "Apple Sanctuary Adventure" semantic color tokens.
 *
 * Every value is intentionally paired: a `*Fill` token is a background that is
 * always used together with its matching `*Ink` token, and every `*Text` token
 * is contrast-checked against `surfacePrimary` / `appBackground` for WCAG AA.
 *
 * The legacy aliases at the bottom of the type keep older call sites compiling
 * while the redesign rolls through the app; they resolve to the same palette.
 */
export type AppColors = {
  /* ── Backgrounds ── */
  readonly appBackground: string;
  readonly groupedBackground: string;
  readonly surfacePrimary: string;
  readonly surfaceSecondary: string;
  readonly surfaceBlue: string;
  readonly surfaceAmber: string;
  readonly surfaceDanger: string;
  readonly surfaceNeutral: string;
  readonly cageStage: string;
  readonly sanctuaryStage: string;

  /* ── Text ── */
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly textInverse: string;

  /* ── Brand / semantics ── */
  readonly brandGreen: string;
  readonly brandGreenPressed: string;
  readonly brandGreenText: string;
  readonly brandGreenFill: string;
  readonly brandGreenInk: string;
  readonly brandGreenTint: string;

  readonly stepBlue: string;
  readonly stepBlueText: string;
  readonly stepBlueTint: string;

  readonly rewardAmber: string;
  readonly rewardAmberText: string;
  readonly rewardAmberFill: string;
  readonly rewardAmberInk: string;
  readonly rewardAmberTint: string;

  readonly activeCoral: string;
  readonly activeCoralText: string;
  readonly activeCoralTint: string;

  readonly danger: string;
  readonly dangerText: string;
  readonly dangerFill: string;
  readonly dangerInk: string;

  readonly lockedSurface: string;
  readonly lockedText: string;

  /* ── Lines, shadows, chrome ── */
  readonly separator: string;
  readonly separatorStrong: string;
  readonly shadowColor: string;
  readonly scrim: string;
  readonly tabBar: string;
  readonly tabBarBorder: string;
  readonly trackNeutral: string;

  /* ── Legacy aliases (same palette, older names) ── */
  readonly backgroundTop: string;
  readonly backgroundBottom: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly surfaceWarm: string;
  readonly surfaceSoft: string;
  readonly text: string;
  readonly muted: string;
  readonly primary: string;
  readonly primaryDark: string;
  readonly secondary: string;
  readonly coral: string;
  readonly pro: string;
  readonly locked: string;
  readonly border: string;
  readonly shadow: string;
  readonly overlay: string;
  readonly white: string;
};

const lightBase = {
  appBackground: "#F7F7F2",
  groupedBackground: "#EFF3EE",
  surfacePrimary: "#FFFFFF",
  surfaceSecondary: "#F0F7F2",
  surfaceBlue: "#EDF7FF",
  surfaceAmber: "#FFF5DE",
  surfaceDanger: "#FDEDED",
  surfaceNeutral: "#F2F4F1",
  cageStage: "#D9EEFA",
  sanctuaryStage: "#E4F5E9",

  textPrimary: "#17211E",
  textSecondary: "#5C6862",
  textTertiary: "#6B7772",
  textInverse: "#FFFFFF",

  brandGreen: "#2DBE72",
  brandGreenPressed: "#20985A",
  brandGreenText: "#17804C",
  brandGreenFill: "#17804C",
  brandGreenInk: "#FFFFFF",
  brandGreenTint: "#E4F5EB",

  stepBlue: "#2F8FFF",
  stepBlueText: "#1069CC",
  stepBlueTint: "#E4F1FE",

  rewardAmber: "#F5B83B",
  rewardAmberText: "#8A5E06",
  rewardAmberFill: "#F5B83B",
  rewardAmberInk: "#3A2500",
  rewardAmberTint: "#FDF1D8",

  activeCoral: "#FF8064",
  activeCoralText: "#C2482C",
  activeCoralTint: "#FFECE5",

  danger: "#E05252",
  dangerText: "#BE3B32",
  dangerFill: "#C33B33",
  dangerInk: "#FFFFFF",

  lockedSurface: "#E8ECE9",
  lockedText: "#6B7772",

  separator: "rgba(23,33,30,0.10)",
  separatorStrong: "rgba(23,33,30,0.16)",
  shadowColor: "#132520",
  scrim: "rgba(12,20,17,0.55)",
  tabBar: "rgba(255,255,255,0.97)",
  tabBarBorder: "rgba(23,33,30,0.08)",
  trackNeutral: "rgba(23,33,30,0.10)"
} as const;

const darkBase = {
  appBackground: "#0E1513",
  groupedBackground: "#121C19",
  surfacePrimary: "#18231F",
  surfaceSecondary: "#1E2C27",
  surfaceBlue: "#152A33",
  surfaceAmber: "#2B2416",
  surfaceDanger: "#2C1A19",
  surfaceNeutral: "#1B2521",
  cageStage: "#132B2A",
  sanctuaryStage: "#16302A",

  textPrimary: "#F4F7F5",
  textSecondary: "#AAB5AF",
  textTertiary: "#8B968F",
  textInverse: "#0B1512",

  brandGreen: "#45D18F",
  brandGreenPressed: "#35B478",
  brandGreenText: "#6EDCA6",
  brandGreenFill: "#3ECB8B",
  brandGreenInk: "#06251A",
  brandGreenTint: "rgba(69,209,143,0.16)",

  stepBlue: "#5AAAFF",
  stepBlueText: "#8CC5FF",
  stepBlueTint: "rgba(90,170,255,0.16)",

  rewardAmber: "#F2C25B",
  rewardAmberText: "#F3D289",
  rewardAmberFill: "#F2C25B",
  rewardAmberInk: "#2C2000",
  rewardAmberTint: "rgba(242,194,91,0.16)",

  activeCoral: "#FF9C82",
  activeCoralText: "#FFB6A2",
  activeCoralTint: "rgba(255,156,130,0.16)",

  danger: "#FF7B7B",
  dangerText: "#FF9E9E",
  dangerFill: "#D9453F",
  dangerInk: "#FFFFFF",

  lockedSurface: "#232E29",
  lockedText: "#8B968F",

  separator: "rgba(255,255,255,0.10)",
  separatorStrong: "rgba(255,255,255,0.18)",
  shadowColor: "#000000",
  scrim: "rgba(0,0,0,0.68)",
  tabBar: "rgba(24,35,31,0.97)",
  tabBarBorder: "rgba(255,255,255,0.10)",
  trackNeutral: "rgba(255,255,255,0.12)"
} as const;

type BaseColors = Omit<
  AppColors,
  | "backgroundTop"
  | "backgroundBottom"
  | "surface"
  | "surfaceElevated"
  | "surfaceWarm"
  | "surfaceSoft"
  | "text"
  | "muted"
  | "primary"
  | "primaryDark"
  | "secondary"
  | "coral"
  | "pro"
  | "locked"
  | "border"
  | "shadow"
  | "overlay"
  | "white"
>;

function withLegacyAliases(base: BaseColors): AppColors {
  return {
    ...base,
    backgroundTop: base.appBackground,
    backgroundBottom: base.groupedBackground,
    surface: base.surfacePrimary,
    surfaceElevated: base.surfaceSecondary,
    surfaceWarm: base.surfaceAmber,
    surfaceSoft: base.surfaceSecondary,
    text: base.textPrimary,
    muted: base.textSecondary,
    primary: base.brandGreen,
    primaryDark: base.brandGreenText,
    secondary: base.rewardAmber,
    coral: base.activeCoral,
    pro: base.rewardAmberText,
    locked: base.lockedText,
    border: base.separator,
    shadow: base.shadowColor,
    overlay: base.scrim,
    white: "#FFFFFF"
  };
}

export const lightColors: AppColors = withLegacyAliases(lightBase);
export const darkColors: AppColors = withLegacyAliases(darkBase);

export const colors = lightColors;

export type ThemePreference = "system" | "light" | "dark";

type AppTheme = {
  readonly colors: AppColors;
  readonly gradient: readonly [string, string];
  readonly isDark: boolean;
  readonly isThemeLoading: boolean;
  readonly resolvedColorScheme: "light" | "dark";
  readonly setThemePreference: (preference: ThemePreference) => Promise<void>;
  readonly statusBarStyle: "light" | "dark";
  readonly themePreference: ThemePreference;
};

const ThemeContext = createContext<AppTheme | undefined>(undefined);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function resolveIsDark(
  preference: ThemePreference,
  systemColorScheme: ColorSchemeName
) {
  if (preference === "dark") {
    return true;
  }

  if (preference === "light") {
    return false;
  }

  return systemColorScheme === "dark";
}

function createTheme(
  preference: ThemePreference,
  systemColorScheme: ColorSchemeName,
  isThemeLoading = false,
  setThemePreference: AppTheme["setThemePreference"] = async () => {}
): AppTheme {
  const isDark = resolveIsDark(preference, systemColorScheme);
  const palette = isDark ? darkColors : lightColors;

  return {
    colors: palette,
    gradient: [palette.appBackground, palette.groupedBackground] as const,
    isDark,
    isThemeLoading,
    resolvedColorScheme: isDark ? "dark" : "light",
    setThemePreference,
    statusBarStyle: isDark ? "light" : "dark",
    themePreference: preference
  };
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Add timeout to prevent hanging in production builds
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setIsThemeLoading(false);
      }
    }, 3000);

    AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)
      .then((storedPreference) => {
        if (!mounted || !isThemePreference(storedPreference)) {
          return;
        }

        setThemePreferenceState(storedPreference);
      })
      .catch(() => {
        // Theme persistence is optional; default to the system preference.
      })
      .finally(() => {
        if (mounted) {
          clearTimeout(timeoutId);
          setIsThemeLoading(false);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    setThemePreferenceState(preference);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, preference);
    } catch {
      // Theme persistence is nice to have; the in-memory choice still applies.
    }
  }, []);

  const theme = useMemo(
    () =>
      createTheme(
        themePreference,
        systemColorScheme,
        isThemeLoading,
        setThemePreference
      ),
    [isThemeLoading, setThemePreference, systemColorScheme, themePreference]
  );

  return createElement(ThemeContext.Provider, { value: theme }, children);
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  const systemColorScheme = useColorScheme();

  return context ?? createTheme("system", systemColorScheme);
}
