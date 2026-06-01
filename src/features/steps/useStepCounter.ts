import { Pedometer } from "expo-sensors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import { getDevSettings, saveDevSettings } from "../../storage/rescueStorage";
import { getLocalDateKey, startOfToday } from "../../utils/date";
import { normalizePermissionStatus, type PermissionStatus } from "./stepUtils";

export type StepCounterState = {
  stepsToday: number;
  sensorStepsToday: number;
  mockSteps: number;
  isAvailable: boolean;
  isLoading: boolean;
  permissionStatus: PermissionStatus;
  error?: string;
  refreshSteps: () => Promise<void>;
  addMockSteps: (amount: number) => Promise<void>;
  resetMockSteps: () => Promise<void>;
};

export function useStepCounter(): StepCounterState {
  const [sensorStepsToday, setSensorStepsToday] = useState(0);
  const [liveSteps, setLiveSteps] = useState(0);
  const [mockSteps, setMockSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");
  const [error, setError] = useState<string | undefined>();
  const dateKeyRef = useRef(getLocalDateKey());

  const persistMockSteps = useCallback(async (nextMockSteps: number) => {
    const current = await getDevSettings();
    await saveDevSettings({
      ...current,
      mockSteps: nextMockSteps,
      mockStepsDate: getLocalDateKey()
    });
  }, []);

  const refreshSteps = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const available = Platform.OS !== "web" && (await Pedometer.isAvailableAsync());
      setIsAvailable(available);

      if (!available) {
        setPermissionStatus("denied");
        setSensorStepsToday(0);
        setLiveSteps(0);
        setError("Step tracking is not available on this device.");
        return;
      }

      const pedometerWithPermissions = Pedometer as typeof Pedometer & {
        getPermissionsAsync?: () => Promise<{ status?: string }>;
        requestPermissionsAsync?: () => Promise<{ status?: string }>;
      };

      const currentPermission =
        await pedometerWithPermissions.getPermissionsAsync?.();
      let normalized = normalizePermissionStatus(currentPermission?.status);

      if (normalized === "undetermined") {
        const requested =
          await pedometerWithPermissions.requestPermissionsAsync?.();
        normalized = normalizePermissionStatus(requested?.status);
      }

      setPermissionStatus(normalized);

      if (normalized !== "granted") {
        setSensorStepsToday(0);
        setLiveSteps(0);
        setError("Motion permission is needed to count rescue steps.");
        return;
      }

      const result = await Pedometer.getStepCountAsync(startOfToday(), new Date());
      setSensorStepsToday(Math.max(0, result.steps));
      setLiveSteps(0);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not read today's step count."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    getDevSettings().then((settings) => {
      if (!mounted) {
        return;
      }

      const today = getLocalDateKey();
      setMockSteps(settings.mockStepsDate === today ? settings.mockSteps ?? 0 : 0);
    });

    refreshSteps();

    return () => {
      mounted = false;
    };
  }, [refreshSteps]);

  useEffect(() => {
    if (!isAvailable || permissionStatus !== "granted") {
      return undefined;
    }

    const subscription = Pedometer.watchStepCount(({ steps }) => {
      setLiveSteps(Math.max(0, steps));
    });

    return () => {
      subscription.remove();
    };
  }, [isAvailable, permissionStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshSteps();
      }
    });

    return () => subscription.remove();
  }, [refreshSteps]);

  useEffect(() => {
    const timer = setInterval(() => {
      const today = getLocalDateKey();
      if (today === dateKeyRef.current) {
        return;
      }

      dateKeyRef.current = today;
      setLiveSteps(0);
      setMockSteps(0);
      persistMockSteps(0);
      refreshSteps();
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, [persistMockSteps, refreshSteps]);

  const addMockSteps = useCallback(
    async (amount: number) => {
      if (!__DEV__) {
        return;
      }

      setMockSteps((current) => {
        const next = Math.max(0, current + amount);
        persistMockSteps(next);
        return next;
      });
    },
    [persistMockSteps]
  );

  const resetMockSteps = useCallback(async () => {
    if (!__DEV__) {
      return;
    }

    setMockSteps(0);
    await persistMockSteps(0);
  }, [persistMockSteps]);

  const stepsToday = useMemo(
    () => Math.max(0, sensorStepsToday + liveSteps + mockSteps),
    [liveSteps, mockSteps, sensorStepsToday]
  );

  return {
    stepsToday,
    sensorStepsToday,
    mockSteps,
    isAvailable,
    isLoading,
    permissionStatus,
    error,
    refreshSteps,
    addMockSteps,
    resetMockSteps
  };
}
