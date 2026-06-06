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

export type AppColors = {
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
  readonly danger: string;
  readonly border: string;
  readonly shadow: string;
  readonly tabBar: string;
  readonly overlay: string;
  readonly white: string;
};

export const lightColors: AppColors = {
  backgroundTop: "#FFF8EA",
  backgroundBottom: "#EAF8F0",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceWarm: "#FFF3D6",
  surfaceSoft: "#EEF9F2",
  text: "#223047",
  muted: "#6D7C91",
  primary: "#26B56F",
  primaryDark: "#117A49",
  secondary: "#FFBF3F",
  coral: "#FF8A5B",
  pro: "#D8951D",
  locked: "#7B86A6",
  danger: "#D85656",
  border: "rgba(34,48,71,0.10)",
  shadow: "#13251F",
  tabBar: "rgba(255,255,255,0.94)",
  overlay: "rgba(23,32,51,0.48)",
  white: "#FFFFFF"
};

export const darkColors: AppColors = {
  backgroundTop: "#071A18",
  backgroundBottom: "#111520",
  surface: "#17211F",
  surfaceElevated: "#1F2A27",
  surfaceWarm: "#2D281A",
  surfaceSoft: "#142A24",
  text: "#F4F7F3",
  muted: "#A9B4AF",
  primary: "#45D18F",
  primaryDark: "#80E4B7",
  secondary: "#F0B84C",
  coral: "#FF8D6E",
  pro: "#F1BD55",
  locked: "#8893A6",
  danger: "#FF7878",
  border: "#2D3B38",
  shadow: "#000000",
  tabBar: "rgba(23,33,31,0.94)",
  overlay: "rgba(0,0,0,0.64)",
  white: "#FFFFFF"
};

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
    gradient: [palette.backgroundTop, palette.backgroundBottom] as const,
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
