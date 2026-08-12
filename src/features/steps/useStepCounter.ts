/** Cross-platform step counter. iOS uses HealthKit; Android uses Pedometer. */

import { Platform } from "react-native";

import { useHealthKitStepCounter } from "./useHealthKitStepCounter";
import { useExpoSensorStepCounter } from "./useExpoSensorStepCounter";
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
  requestPermission: () => Promise<void>;
};

// ── iOS: HealthKit ────────────────────────────────────────────────────────────

function useIOSStepCounter(enabled: boolean): StepCounterState {
  const hk = useHealthKitStepCounter(enabled);

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
    requestPermission: hk.requestPermission,
  };
}

// ── Unified hook ─────────────────────────────────────────────────────────────

export function useStepCounter(): StepCounterState {
  const isIOS = Platform.OS === "ios";
  const isAndroid = Platform.OS === "android";

  // Both hooks remain mounted to satisfy the Rules of Hooks, but only the
  // active platform is allowed to touch its native module or ask permission.
  const iosResult = useIOSStepCounter(isIOS);
  const androidResult = useExpoSensorStepCounter(isAndroid);

  return isIOS ? iosResult : androidResult;
}
