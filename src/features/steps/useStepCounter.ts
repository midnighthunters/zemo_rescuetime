/**
 * Cross-platform step counter.
 *
 * iOS  → Apple HealthKit via react-native-health
 *         Works on iPhone and iPad regardless of hardware pedometer chip.
 *
 * Android → expo-sensors Pedometer (unchanged behaviour)
 */

import { Platform } from "react-native";

import {
  useHealthKitStepCounter,
} from "./useHealthKitStepCounter";
import {
  useExpoSensorStepCounter,
} from "./useExpoSensorStepCounter";
import { type PermissionStatus } from "./stepUtils";

export type StepCountingMode = "full-day" | "live-session" | "unavailable";

export type StepCounterState = {
  stepsToday: number;
  historicalStepsToday: number;
  liveSteps: number;
  isAvailable: boolean;
  isLoading: boolean;
  permissionStatus: PermissionStatus;
  countingMode: StepCountingMode;
  sourceLabel: string;
  error?: string;
  refreshSteps: () => Promise<void>;
};

// ── iOS: HealthKit ────────────────────────────────────────────────────────────

function useIOSStepCounter(): StepCounterState {
  const hk = useHealthKitStepCounter();

  const countingMode: StepCountingMode = hk.isAvailable ? "full-day" : "unavailable";

  return {
    stepsToday: hk.stepsToday,
    historicalStepsToday: hk.stepsToday,
    liveSteps: 0,
    isAvailable: hk.isAvailable,
    isLoading: hk.isLoading,
    permissionStatus: hk.permissionStatus,
    countingMode,
    sourceLabel: hk.isAvailable ? "Apple Health" : "Unavailable",
    error: hk.error,
    refreshSteps: hk.refreshSteps,
  };
}

// ── Unified hook ─────────────────────────────────────────────────────────────

export function useStepCounter(): StepCounterState {
  const iosResult = useIOSStepCounter();
  const androidResult = useExpoSensorStepCounter();

  // React rules: both hooks are always called, we just return the right one.
  return Platform.OS === "ios" ? iosResult : androidResult;
}
