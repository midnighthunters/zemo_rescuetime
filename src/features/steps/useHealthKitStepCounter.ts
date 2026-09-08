import { AppState } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import { getOnboarded } from "../../storage/rescueStorage";
import RescueHealthKit, {
  isRescueHealthKitLinked,
  type HealthKitAuthorizationRequestStatus
} from "./RescueHealthKit";
import { type PermissionStatus } from "./stepUtils";

const ACTIVE_REFRESH_INTERVAL_MS = 30_000;

const HEALTHKIT_NOT_LINKED =
  "Apple Health support is missing from this build. Install a new device build and try again.";
const HEALTHKIT_UNAVAILABLE =
  "Apple Health is not available here. Step tracking requires a physical Apple device with Health enabled.";
const HEALTHKIT_AUTHORIZATION_FAILED =
  "Apple Health could not be connected. Allow Steps access in Settings or the Health app, then try again.";
const HEALTHKIT_STATUS_FAILED =
  "Apple Health permission status could not be checked. Unlock the device and try again.";
const HEALTHKIT_READ_FAILED =
  "Today's steps could not be read from Apple Health. Unlock the device and try again.";

function getHealthKitErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export type HealthKitStepState = {
  stepsToday: number;
  isAvailable: boolean;
  isLoading: boolean;
  permissionStatus: PermissionStatus;
  error?: string;
  refreshSteps: () => Promise<void>;
  requestPermission: () => Promise<void>;
};

function getHealthKitAvailability() {
  return Boolean(RescueHealthKit?.isAvailable());
}

async function getAuthorizationRequestStatus(): Promise<
  HealthKitAuthorizationRequestStatus | undefined
> {
  if (!RescueHealthKit) {
    throw new Error(HEALTHKIT_NOT_LINKED);
  }

  // Older installed builds do not expose this method. Keep the bridge usable
  // so a JavaScript update can still request access and read steps instead of
  // incorrectly reporting that Apple Health support is missing.
  return RescueHealthKit.getAuthorizationRequestStatus?.();
}

async function requestHealthKitAuthorization() {
  if (!RescueHealthKit) {
    throw new Error(HEALTHKIT_NOT_LINKED);
  }

  await RescueHealthKit.requestAuthorization();
}

async function readStepsToday() {
  if (!RescueHealthKit) {
    throw new Error(HEALTHKIT_NOT_LINKED);
  }

  const steps = await RescueHealthKit.getTodayStepCount();
  return Math.max(0, Math.round(steps));
}

/**
 * Apple Health step access has two intentionally separate operations:
 * requesting authorization and reading steps. A normal refresh must never
 * re-present (or pretend to re-present) Apple's one-time permission sheet.
 */
export function useHealthKitStepCounter(enabled = true): HealthKitStepState {
  const [stepsToday, setStepsToday] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(enabled);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");
  const [error, setError] = useState<string | undefined>();
  const mountedRef = useRef(true);
  const readyToReadRef = useRef(false);
  const operationPromiseRef = useRef<Promise<void> | null>(null);
  const permissionRequestQueuedRef = useRef(false);

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

  const performOperation = useCallback(
    (shouldRequestPermission: boolean): Promise<void> => {
      if (!enabled) {
        return Promise.resolve();
      }

      // Buttons are disabled while loading, and this also protects foreground
      // refreshes from starting a second HealthKit operation concurrently.
      if (operationPromiseRef.current) {
        if (!shouldRequestPermission) {
          return operationPromiseRef.current;
        }

        // An explicit permission request must not be swallowed by the initial
        // status check (the onboarding button can be tapped during that check).
        permissionRequestQueuedRef.current = true;
        return operationPromiseRef.current.then(() => {
          if (!permissionRequestQueuedRef.current || !mountedRef.current) {
            return;
          }

          permissionRequestQueuedRef.current = false;
          return performOperation(true);
        });
      }

      const operation = (async () => {
        if (mountedRef.current) {
          setIsLoading(true);
          setError(undefined);
        }

        if (!isRescueHealthKitLinked()) {
          readyToReadRef.current = false;
          if (mountedRef.current) {
            setIsAvailable(false);
            setPermissionStatus("denied");
            setError(HEALTHKIT_NOT_LINKED);
          }
          return;
        }

        let available = false;
        try {
          available = getHealthKitAvailability();
        } catch {
          available = false;
        }

        if (mountedRef.current) {
          setIsAvailable(available);
        }

        if (!available) {
          readyToReadRef.current = false;
          if (mountedRef.current) {
            setPermissionStatus("denied");
            setError(HEALTHKIT_UNAVAILABLE);
          }
          return;
        }

        if (shouldRequestPermission) {
          try {
            await requestHealthKitAuthorization();
          } catch (caught) {
            readyToReadRef.current = false;
            if (mountedRef.current) {
              setPermissionStatus("undetermined");
              setError(
                getHealthKitErrorMessage(caught, HEALTHKIT_AUTHORIZATION_FAILED)
              );
            }
            return;
          }
        } else {
          let requestStatus: HealthKitAuthorizationRequestStatus | undefined;
          try {
            requestStatus = await getAuthorizationRequestStatus();
          } catch (caught) {
            readyToReadRef.current = false;
            if (mountedRef.current) {
              setPermissionStatus("undetermined");
              setError(getHealthKitErrorMessage(caught, HEALTHKIT_STATUS_FAILED));
            }
            return;
          }

          if (requestStatus === "unknown") {
            readyToReadRef.current = false;
            if (mountedRef.current) {
              setPermissionStatus("undetermined");
              setError(HEALTHKIT_STATUS_FAILED);
            }
            return;
          }

          if (requestStatus === "shouldRequest" || requestStatus === undefined) {
            const hasOnboarded = await getOnboarded().catch(() => false);

            if (!hasOnboarded && requestStatus !== undefined) {
              readyToReadRef.current = false;
              if (mountedRef.current) {
                setPermissionStatus("undetermined");
              }
              return;
            }

            try {
              await requestHealthKitAuthorization();
            } catch (caught) {
              readyToReadRef.current = false;
              if (mountedRef.current) {
                setPermissionStatus("undetermined");
                setError(
                  getHealthKitErrorMessage(
                    caught,
                    HEALTHKIT_AUTHORIZATION_FAILED
                  )
                );
              }
              return;
            }
          }
        }

        // HealthKit intentionally hides read denials. Once its authorization
        // flow has completed, the only correct behavior is to query: denied
        // access returns an empty result rather than an authorization status.
        readyToReadRef.current = true;
        if (mountedRef.current) {
          setPermissionStatus("granted");
        }

        try {
          await fetchSteps();
        } catch (caught) {
          if (mountedRef.current) {
            setError(getHealthKitErrorMessage(caught, HEALTHKIT_READ_FAILED));
          }
        }
      })().finally(() => {
        operationPromiseRef.current = null;
        if (mountedRef.current) {
          setIsLoading(false);
        }
      });

      operationPromiseRef.current = operation;
      return operation;
    },
    [enabled, fetchSteps]
  );

  const refreshSteps = useCallback(
    () => performOperation(false),
    [performOperation]
  );
  const requestPermission = useCallback(
    () => performOperation(true),
    [performOperation]
  );

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    void refreshSteps();
  }, [enabled, refreshSteps]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refreshSilently = () => {
      if (AppState.currentState !== "active" || !readyToReadRef.current) {
        return;
      }

      void fetchSteps().catch(() => {
        // Keep the last valid total during transient protected-data failures.
        // A visible retry still reports the error if the problem continues.
      });
    };

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        // Re-check the full flow after Settings closes so the UI and total are
        // updated immediately, including recovery from a previous error.
        void refreshSteps();
      }
    });
    const timer =
      permissionStatus === "granted"
        ? setInterval(refreshSilently, ACTIVE_REFRESH_INTERVAL_MS)
        : undefined;

    return () => {
      appStateSubscription.remove();
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [enabled, fetchSteps, permissionStatus, refreshSteps]);

  return {
    stepsToday,
    isAvailable,
    isLoading,
    permissionStatus,
    error,
    refreshSteps,
    requestPermission
  };
}
