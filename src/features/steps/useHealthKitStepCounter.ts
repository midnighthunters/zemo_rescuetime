/**
 * iOS-only step counter that reads from Apple HealthKit.
 * Replaces expo-sensors Pedometer for iOS so it works on iPad and all iPhone
 * models regardless of whether a hardware step-counter chip is present.
 *
 * Uses react-native-health (wraps HKQuantityTypeIdentifierStepCount).
 *
 * How live updates work:
 *   The native module exposes `initStepCountObserver` which registers an
 *   HKObserverQuery; whenever HealthKit delivers new step data it emits
 *   "change:steps" via NativeEventEmitter. We listen for that event and
 *   re-query the cumulative daily total.
 */

import AppleHealthKit, {
  type HealthKitPermissions,
  type HealthInputOptions,
  type HealthValue,
} from "react-native-health";
import { NativeEventEmitter, NativeModules, AppState } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import { startOfToday } from "../../utils/date";
import { type PermissionStatus } from "./stepUtils";

const PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Steps],
    write: [],
  },
};

// The raw native module – used to call initStepCountObserver and create the emitter.
// It's not typed in react-native-health's index.d.ts so we access it directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NativeHK = NativeModules.AppleHealthKit as any;

export type HealthKitStepState = {
  stepsToday: number;
  isAvailable: boolean;
  isLoading: boolean;
  permissionStatus: PermissionStatus;
  error?: string;
  refreshSteps: () => Promise<void>;
};

export function useHealthKitStepCounter(): HealthKitStepState {
  const [stepsToday, setStepsToday] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");
  const [error, setError] = useState<string | undefined>();

  const initializedRef = useRef(false);

  /** Query today's cumulative step total from HealthKit */
  const fetchSteps = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const options: HealthInputOptions = {
        startDate: startOfToday().toISOString(),
        endDate: new Date().toISOString(),
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(
        options,
        (err: string, result: HealthValue) => {
          if (!err && result != null) {
            setStepsToday(Math.max(0, result.value ?? 0));
            setError(undefined);
          }
          resolve();
        }
      );
    });
  }, []);

  /** (Re-)initialise HealthKit, ask for permission, then load steps */
  const refreshSteps = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    await new Promise<void>((resolve) => {
      AppleHealthKit.initHealthKit(PERMISSIONS, (err: string) => {
        if (err) {
          initializedRef.current = false;
          setIsAvailable(false);
          setPermissionStatus("denied");
          setError("Health permission is needed to count rescue steps.");
          setIsLoading(false);
          resolve();
          return;
        }

        initializedRef.current = true;
        setIsAvailable(true);
        setPermissionStatus("granted");
        setError(undefined);
        resolve();
      });
    });

    if (!initializedRef.current) return;

    await fetchSteps();
    setIsLoading(false);
  }, [fetchSteps]);

  /** First load on mount */
  useEffect(() => {
    void refreshSteps();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Subscribe to HealthKit background step delivery.
   * `initStepCountObserver` registers an HKObserverQuery on the native side;
   * new data arrives as "change:steps" events on the NativeEventEmitter.
   */
  useEffect(() => {
    if (!isAvailable || permissionStatus !== "granted" || !NativeHK) {
      return undefined;
    }

    const emitter = new NativeEventEmitter(NativeHK);

    // Register the native HKObserverQuery
    NativeHK.initStepCountObserver(
      { startDate: startOfToday().toISOString() },
      () => { /* observer registered */ }
    );

    const subscription = emitter.addListener("change:steps", () => {
      // HealthKit pushed new step data — re-query the daily total
      void fetchSteps();
    });

    return () => {
      subscription.remove();
    };
  }, [isAvailable, permissionStatus, fetchSteps]);

  /** Re-fetch when the app returns to the foreground */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && isAvailable && permissionStatus === "granted") {
        void fetchSteps();
      }
    });
    return () => sub.remove();
  }, [isAvailable, permissionStatus, fetchSteps]);

  return {
    stepsToday,
    isAvailable,
    isLoading,
    permissionStatus,
    error,
    refreshSteps,
  };
}
