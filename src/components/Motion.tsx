import { useEffect, useMemo, useRef, type PropsWithChildren } from "react";
import {
  Animated,
  type StyleProp,
  type ViewProps,
  type ViewStyle
} from "react-native";

import { duration, easing, useReduceMotion } from "../theme/motion";

type MotionViewProps = PropsWithChildren<
  ViewProps & {
    delay?: number;
    direction?: "up" | "down" | "fade";
    /** Kept for API compatibility with the previous implementation. */
    layout?: boolean;
    style?: StyleProp<ViewStyle>;
  }
>;

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
  return Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
}

/**
 * One-shot entrance: opacity plus a small translation. Never re-runs on state
 * changes, so cards do not re-animate while steps tick upward.
 */
export function MotionView({
  children,
  delay = 0,
  direction = "up",
  layout: _layout = false,
  style,
  ...props
}: MotionViewProps) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return undefined;
    }

    const animation = Animated.timing(progress, {
      delay,
      duration: duration.enter,
      easing: easing.standard,
      toValue: 1,
      useNativeDriver: true
    });

    animation.start();

    return () => animation.stop();
  }, [delay, progress, reduceMotion]);

  const animatedStyle = useMemo(() => {
    if (reduceMotion) {
      return null;
    }

    const offset = direction === "fade" ? 0 : direction === "down" ? -10 : 10;

    return {
      opacity: progress,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [offset, 0]
          })
        }
      ]
    };
  }, [direction, progress, reduceMotion]);

  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
}

/**
 * Animates a progress fill width whenever a new value arrives. Width cannot run
 * on the native driver, so this deliberately stays a layout animation on a
 * single small view.
 */
export function AnimatedProgressFill({
  children,
  progress,
  style
}: AnimatedProgressFillProps) {
  const reduceMotion = useReduceMotion();
  const clamped = clampProgress(progress);
  const value = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(clamped);
      return undefined;
    }

    const animation = Animated.timing(value, {
      duration: duration.progress,
      easing: easing.decelerate,
      toValue: clamped,
      useNativeDriver: false
    });

    animation.start();

    return () => animation.stop();
  }, [clamped, reduceMotion, value]);

  const width = value.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  return <Animated.View style={[style, { width }]}>{children}</Animated.View>;
}

/**
 * A restrained settle: two low-amplitude breaths, then rest. Used only for
 * celebratory or empty states — never as ambient motion on a busy screen.
 */
export function PulseView({
  active = true,
  children,
  delay = 0,
  duration: pulseDuration = 1600,
  floatDistance = 0,
  pointerEvents,
  pulseScale = 1.03,
  style
}: PulseViewProps) {
  const reduceMotion = useReduceMotion();
  const value = useRef(new Animated.Value(0)).current;
  const shouldAnimate = active && !reduceMotion;

  useEffect(() => {
    if (!shouldAnimate) {
      value.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          duration: pulseDuration / 2,
          easing: easing.standard,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(value, {
          duration: pulseDuration / 2,
          easing: easing.standard,
          toValue: 0,
          useNativeDriver: true
        })
      ]),
      { iterations: 2 }
    );

    animation.start();

    return () => animation.stop();
  }, [delay, pulseDuration, shouldAnimate, value]);

  const animatedStyle = shouldAnimate
    ? {
        transform: [
          {
            scale: value.interpolate({
              inputRange: [0, 1],
              outputRange: [1, pulseScale]
            })
          },
          {
            translateY: value.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -floatDistance]
            })
          }
        ]
      }
    : null;

  return (
    <Animated.View pointerEvents={pointerEvents} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
