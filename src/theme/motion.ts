import { useEffect, useState } from "react";
import { AccessibilityInfo, Easing } from "react-native";

/**
 * Motion language: short, purposeful transitions. Nothing loops forever, and
 * every duration stays inside the 180–260 ms press/state window unless it is a
 * one-time celebration.
 */
export const duration = {
  press: 120,
  state: 200,
  enter: 260,
  progress: 420,
  celebrate: 520
} as const;

export const easing = {
  standard: Easing.bezier(0.22, 0.61, 0.36, 1),
  decelerate: Easing.out(Easing.cubic),
  accelerate: Easing.in(Easing.cubic),
  settle: Easing.out(Easing.back(1.15))
} as const;

export const pressScale = 0.975;

/**
 * Tracks the platform "Reduce Motion" setting. Every animated component in the
 * app checks this and falls back to an instant state change.
 */
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {
        // Reduce Motion is unavailable on some targets; assume motion is fine.
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduceMotion(Boolean(enabled))
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
