import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppSettings, DevSettings, RescueProgress } from "../data/types";

import { STORAGE_KEYS } from "./storageKeys";

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function getOnboarded() {
  return readJson<boolean>(STORAGE_KEYS.ONBOARDED, false);
}

export async function setOnboarded(value: boolean) {
  await writeJson(STORAGE_KEYS.ONBOARDED, value);
}

export function getRescueProgress() {
  return readJson<RescueProgress | null>(STORAGE_KEYS.PROGRESS, null);
}

export async function saveRescueProgress(progress: RescueProgress) {
  await writeJson(STORAGE_KEYS.PROGRESS, progress);
}

export async function clearRescueProgress() {
  await AsyncStorage.removeItem(STORAGE_KEYS.PROGRESS);
}

export function getAppSettings() {
  return readJson<AppSettings>(STORAGE_KEYS.APP_SETTINGS, {});
}

export async function saveAppSettings(settings: AppSettings) {
  await writeJson(STORAGE_KEYS.APP_SETTINGS, settings);
}

export function getDevSettings() {
  return readJson<DevSettings>(STORAGE_KEYS.DEV_SETTINGS, {});
}

export async function saveDevSettings(settings: DevSettings) {
  await writeJson(STORAGE_KEYS.DEV_SETTINGS, settings);
}

export async function clearAllLocalRescueData() {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ONBOARDED,
    STORAGE_KEYS.PROGRESS,
    STORAGE_KEYS.STEP_BASELINE,
    STORAGE_KEYS.DEV_SETTINGS,
    STORAGE_KEYS.APP_SETTINGS,
    STORAGE_KEYS.UNLOCK_NOTIFICATIONS
  ]);
}
