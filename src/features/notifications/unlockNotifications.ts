import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { STORAGE_KEYS } from "../../storage/storageKeys";
import { dismissNativeTargetAchievementNotification } from "./targetAchievementWatcher";

const UNLOCK_CHANNEL_ID = "target-unlocks";
const UNLOCK_NOTIFICATION_KIND = "rescue-target-unlock";

type NotificationRecord = Record<string, string>;

export type UnlockNotificationPayload = {
  eventId: string;
  eventType: "reward" | "rescue";
  animalId: string;
  title: string;
  body: string;
};

let hasConfiguredNotifications = false;

function createNotificationIdentifier(eventId: string) {
  return `unlock-${eventId.replace(/[^a-zA-Z0-9_.-]/g, "-")}`;
}

async function readNotificationRecords(): Promise<NotificationRecord> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.UNLOCK_NOTIFICATIONS);
    return raw ? (JSON.parse(raw) as NotificationRecord) : {};
  } catch {
    return {};
  }
}

async function saveNotificationRecords(records: NotificationRecord) {
  await AsyncStorage.setItem(
    STORAGE_KEYS.UNLOCK_NOTIFICATIONS,
    JSON.stringify(records)
  );
}

function isUnlockNotificationData(data: Record<string, unknown> | undefined) {
  return data?.kind === UNLOCK_NOTIFICATION_KIND;
}

export async function configureUnlockNotifications() {
  if (Platform.OS === "web" || hasConfiguredNotifications) {
    return;
  }

  hasConfiguredNotifications = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      priority: Notifications.AndroidNotificationPriority.HIGH,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(UNLOCK_CHANNEL_ID, {
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#58C27D",
      name: "Target unlocks",
      sound: "default",
      vibrationPattern: [0, 220, 120, 220]
    }).catch(() => {
      // Channel setup should not block the in-app unlock card.
    });
  }
}

async function ensureNotificationPermission() {
  if (Platform.OS === "web") {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.status === "granted") {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.status === "granted";
}

export async function requestStartupNotificationPermission() {
  if (Platform.OS === "web") {
    return false;
  }

  await configureUnlockNotifications();
  return ensureNotificationPermission();
}

export async function presentUnlockNotification(
  payload: UnlockNotificationPayload
) {
  if (Platform.OS === "web") {
    return;
  }

  await configureUnlockNotifications();

  const records = await readNotificationRecords();
  if (records[payload.eventId]) {
    return;
  }

  const canNotify = await ensureNotificationPermission();
  if (!canNotify) {
    return;
  }

  const identifier = createNotificationIdentifier(payload.eventId);
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      autoDismiss: true,
      body: payload.body,
      color: "#58C27D",
      data: {
        animalId: payload.animalId,
        eventType: payload.eventType,
        href: "/(tabs)/home",
        kind: UNLOCK_NOTIFICATION_KIND,
        unlockEventId: payload.eventId
      },
      priority: Notifications.AndroidNotificationPriority.HIGH,
      sound: true,
      title: payload.title
    },
    identifier,
    trigger: Platform.OS === "android" ? { channelId: UNLOCK_CHANNEL_ID } : null
  });

  await saveNotificationRecords({
    ...records,
    [payload.eventId]: notificationId
  });
}

export function getUnlockEventIdFromNotificationResponse(
  response: Notifications.NotificationResponse | null | undefined
) {
  const data = response?.notification.request.content.data;
  const eventId = data?.unlockEventId;

  return isUnlockNotificationData(data) && typeof eventId === "string"
    ? eventId
    : undefined;
}

export function clearLastUnlockNotificationResponse() {
  try {
    Notifications.clearLastNotificationResponse();
  } catch {
    // Some environments do not expose notification response clearing.
  }
}

export async function dismissUnlockNotification(eventId: string) {
  if (Platform.OS === "web") {
    return;
  }

  await dismissNativeTargetAchievementNotification(eventId).catch(() => {});

  const records = await readNotificationRecords();
  const identifier = records[eventId] ?? createNotificationIdentifier(eventId);

  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {}),
    Notifications.dismissNotificationAsync(identifier).catch(() => {})
  ]);

  const presented = await Notifications.getPresentedNotificationsAsync().catch(
    () => []
  );

  await Promise.all(
    presented
      .filter((notification) => {
        const data = notification.request.content.data;
        return (
          notification.request.identifier === identifier ||
          (isUnlockNotificationData(data) && data.unlockEventId === eventId)
        );
      })
      .map((notification) =>
        Notifications.dismissNotificationAsync(
          notification.request.identifier
        ).catch(() => {})
      )
  );

  if (records[eventId]) {
    const { [eventId]: _dismissed, ...nextRecords } = records;
    await saveNotificationRecords(nextRecords);
  }
}
