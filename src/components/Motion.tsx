import type { PropsWithChildren } from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

type MotionViewProps = PropsWithChildren<ViewProps & {
  delay?: number;
  direction?: "up" | "down" | "fade";
  layout?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

type AnimatedProgressFillProps = PropsWithChildren<{
  progress: number;
  style?: StyleProp<ViewStyle>;
}>;

type PulseViewProps = PropsWithChildren<{
  active?: boolean;
  delay?: number;
  duration?: number;
  floatDistance?: number;
  pointerEvents?: "auto" | "box-none" | "box-only" | "none";
  pulseScale?: number;
  style?: StyleProp<ViewStyle>;
}>;

function clampProgress(progress: number) {
  return Math.max(0, Math.min(1, progress));
}

export function MotionView({
  children,
  delay = 0,
  direction = "up",
  layout = false,
  style,
  ...props
}: MotionViewProps) {
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
}

export function AnimatedProgressFill({
  children,
  progress,
  style
}: AnimatedProgressFillProps) {
  return (
    <View style={[{ width: `${clampProgress(progress) * 100}%` }, style]}>
      {children}
    </View>
  );
}

export function PulseView({
  active = true,
  children,
  delay = 0,
  duration = 1800,
  floatDistance = 0,
  pointerEvents,
  pulseScale = 1.04,
  style
}: PulseViewProps) {
  return (
    <View pointerEvents={pointerEvents} style={style}>
      {children}
    </View>
  );
}
