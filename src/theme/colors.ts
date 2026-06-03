import { useColorScheme } from "react-native";

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

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const palette = isDark ? darkColors : lightColors;
  const statusBarStyle: "light" | "dark" = isDark ? "light" : "dark";

  return {
    colors: palette,
    gradient: [palette.backgroundTop, palette.backgroundBottom] as const,
    isDark,
    statusBarStyle
  };
}
