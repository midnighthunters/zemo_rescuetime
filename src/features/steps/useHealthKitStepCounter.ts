import { AppState } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import { getOnboarded } from "../../storage/rescueStorage";
import RescueHealthKit, { isRescueHealthKitLinked } from "./RescueHealthKit";
import { type PermissionStatus } from "./stepUtils";

const ACTIVE_REFRESH_INTERVAL_MS = 30_000;

const HEALTHKIT_NOT_LINKED =
  "Apple Health support is missing from this build. Install a new device build and try again.";
const HEALTHKIT_UNAVAILABLE =
  "Apple Health is not available here. Step tracking requires a physical Apple device with Health enabled.";
const HEALTHKIT_AUTHORIZATION_FAILED =
  "Apple Health could not be connected. Allow Steps access in Settings > Privacy & Security > Health, then retry.";
const HEALTHKIT_READ_FAILED =
  "Today's steps could not be read from Apple Health. Unlock the device and try again.";

export type HealthKitStepState = {
  stepsToday: number;
  isAvailable: boolean;
  isLoading: boolean;
  permissionStatus: PermissionStatus;
  error?: string;
  refreshSteps: () => Promise<void>;
  requestPermission: () => Promise<void>;
};

function isNativeHealthKitLinked() {
  return isRescueHealthKitLinked();
}

function getHealthKitAvailability() {
  return Promise.resolve(Boolean(RescueHealthKit?.isAvailable()));
}

async function initializeHealthKit() {
  if (!RescueHealthKit) {
    throw new Error(HEALTHKIT_NOT_LINKED);
  }

  const authorized = await RescueHealthKit.requestAuthorization();
  if (!authorized) {
    throw new Error(HEALTHKIT_AUTHORIZATION_FAILED);
  }
}

async function readStepsToday() {
  if (!RescueHealthKit) {
    throw new Error(HEALTHKIT_NOT_LINKED);
  }

  const steps = await RescueHealthKit.getTodayStepCount();
  return Math.max(0, Math.round(steps));
}

export function useHealthKitStepCounter(
  enabled = true
): HealthKitStepState {
  const [stepsToday, setStepsToday] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(enabled);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");
  const [error, setError] = useState<string | undefined>();
  const initializedRef = useRef(false);
  const mountedRef = useRef(true);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchSteps = useCallback(async () => {
    const nextSteps = await readStepsToday();
    if (mountedRef.current) {
      setStepsToday(nextSteps);
      setError(undefined);
    }
  }, []);

  const refreshSteps = useCallback((): Promise<void> => {
    if (!enabled) {
      return Promise.resolve();
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      if (mountedRef.current) {
        setIsLoading(true);
        setError(undefined);
      }

      if (!isNativeHealthKitLinked()) {
        initializedRef.current = false;
        if (mountedRef.current) {
          setIsAvailable(false);
          setPermissionStatus("denied");
          setError(HEALTHKIT_NOT_LINKED);
        }
        return;
      }

      let available = false;
      try {
        available = await getHealthKitAvailability();
      } catch {
        available = false;
      }

      if (mountedRef.current) {
        setIsAvailable(available);
      }

      if (!available) {
        initializedRef.current = false;
        if (mountedRef.current) {
          setPermissionStatus("denied");
          setError(HEALTHKIT_UNAVAILABLE);
        }
        return;
      }

      try {
        await initializeHealthKit();
      } catch {
        initializedRef.current = false;
        if (mountedRef.current) {
          setPermissionStatus("denied");
          setError(HEALTHKIT_AUTHORIZATION_FAILED);
        }
        return;
      }

      initializedRef.current = true;
      if (mountedRef.current) {
        // Apple intentionally does not reveal whether read access was denied.
        // A successful authorization request means HealthKit is connected;
        // denied read data is returned as an empty result.
        setPermissionStatus("granted");
      }

      try {
        await fetchSteps();
      } catch {
        if (mountedRef.current) {
          setError(HEALTHKIT_READ_FAILED);
        }
      }
    })().finally(() => {
      refreshPromiseRef.current = null;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    });

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [enabled, fetchSteps]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const prepare = async () => {
      if (!isNativeHealthKitLinked()) {
        if (!cancelled) {
          setIsAvailable(false);
          setIsLoading(false);
          setPermissionStatus("denied");
          setError(HEALTHKIT_NOT_LINKED);
        }
        return;
      }

      let available = false;
      try {
        available = await getHealthKitAvailability();
      } catch {
        available = false;
      }

      if (cancelled) {
        return;
      }

      setIsAvailable(available);
      if (!available) {
        setPermissionStatus("denied");
        setError(HEALTHKIT_UNAVAILABLE);
        setIsLoading(false);
        return;
      }

      const hasOnboarded = await getOnboarded();
      if (cancelled) {
        return;
      }

      if (hasOnboarded) {
        await refreshSteps();
      } else {
        setIsLoading(false);
      }
    };

    void prepare();
    return () => {
      cancelled = true;
    };
  }, [enabled, refreshSteps]);

  useEffect(() => {
    if (!enabled || !initializedRef.current || permissionStatus !== "granted") {
      return;
    }

    const refreshSilently = () => {
      if (AppState.currentState === "active") {
        void fetchSteps().catch(() => {
          // A transient read error (for example while the device is locked)
          // should not replace a previously valid step total.
        });
      }
    };

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshSilently();
      }
    });
    const timer = setInterval(refreshSilently, ACTIVE_REFRESH_INTERVAL_MS);

    return () => {
      appStateSubscription.remove();
      clearInterval(timer);
    };
  }, [enabled, fetchSteps, permissionStatus]);

  return {
    stepsToday,
    isAvailable,
    isLoading,
    permissionStatus,
    error,
    refreshSteps,
    requestPermission: refreshSteps,
  };
}
