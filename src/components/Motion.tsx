import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import type { StyleProp, ViewProps, ViewStyle } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

type MotionViewProps = PropsWithChildren<ViewProps & {
  delay?: number;
  direction?: "up" | "down" | "fade";
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
  style,
  ...props
}: MotionViewProps) {
  const entering =
    direction === "down"
      ? FadeInUp.duration(400).delay(delay).easing(Easing.bezier(0.25, 0.1, 0.25, 1))
      : direction === "fade"
        ? FadeIn.duration(350).delay(delay).easing(Easing.bezier(0.25, 0.1, 0.25, 1))
        : FadeInDown.duration(400).delay(delay).easing(Easing.bezier(0.25, 0.1, 0.25, 1));

  return (
    <Animated.View
      entering={entering}
      layout={LinearTransition.springify().damping(20).stiffness(180).mass(0.8)}
      style={style}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

export function AnimatedProgressFill({
  children,
  progress,
  style
}: AnimatedProgressFillProps) {
  const fill = useSharedValue(clampProgress(progress));

  useEffect(() => {
    fill.value = withTiming(clampProgress(progress), {
      duration: 820,
      easing: Easing.out(Easing.cubic)
    });
  }, [fill, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%` as `${number}%`
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
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
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      pulse.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
      return;
    }

    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration,
            easing: Easing.bezier(0.45, 0.05, 0.55, 0.95)
          }),
          withTiming(0, {
            duration,
            easing: Easing.bezier(0.45, 0.05, 0.55, 0.95)
          })
        ),
        -1,
        false
      )
    );
  }, [active, delay, duration, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -floatDistance * pulse.value },
      { scale: 1 + (pulseScale - 1) * pulse.value }
    ]
  }), [floatDistance, pulseScale]);

  return (
    <Animated.View pointerEvents={pointerEvents} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
