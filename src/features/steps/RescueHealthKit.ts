import { requireOptionalNativeModule } from "expo";

export type RescueHealthKitNativeModule = {
  isAvailable: () => boolean;
  requestAuthorization: () => Promise<boolean>;
  getTodayStepCount: () => Promise<number>;
};

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
