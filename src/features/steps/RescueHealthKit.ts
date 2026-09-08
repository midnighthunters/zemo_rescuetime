import { requireOptionalNativeModule } from "expo";

export type RescueHealthKitNativeModule = {
  isAvailable: () => boolean;
  getAuthorizationRequestStatus?: () => Promise<
    HealthKitAuthorizationRequestStatus
  >;
  requestAuthorization: () => Promise<void>;
  getTodayStepCount: () => Promise<number>;
};

export type HealthKitAuthorizationRequestStatus =
  | "shouldRequest"
  | "unnecessary"
  | "unknown";

const RescueHealthKit =
  requireOptionalNativeModule<RescueHealthKitNativeModule>("RescueHealthKit");

export function isRescueHealthKitLinked(): boolean {
  return (
    RescueHealthKit !== null &&
    typeof RescueHealthKit.isAvailable === "function" &&
    typeof RescueHealthKit.requestAuthorization === "function" &&
    typeof RescueHealthKit.getTodayStepCount === "function"
  );
}

export default RescueHealthKit;
