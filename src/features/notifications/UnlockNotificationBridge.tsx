import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useRescue } from "../../state/RescueProvider";
import {
  clearLastUnlockNotificationResponse,
  configureUnlockNotifications,
  dismissUnlockNotification,
  getUnlockEventIdFromNotificationResponse
} from "./unlockNotifications";

export function UnlockNotificationBridge() {
  const { focusUnlockEvent, isLoading } = useRescue();
  const queuedEventIdRef = useRef<string | undefined>(undefined);

  const openUnlockCard = useCallback(
    (eventId: string) => {
      queuedEventIdRef.current = eventId;
      router.replace("/(tabs)/home");

      if (isLoading) {
        return;
      }

      focusUnlockEvent(eventId);
      void dismissUnlockNotification(eventId).catch(() => {});
      clearLastUnlockNotificationResponse();
      queuedEventIdRef.current = undefined;
    },
    [focusUnlockEvent, isLoading]
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    void configureUnlockNotifications().catch(() => {});

    const lastResponse = Notifications.getLastNotificationResponse();
    const lastEventId = getUnlockEventIdFromNotificationResponse(lastResponse);
    if (lastEventId) {
      openUnlockCard(lastEventId);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const eventId = getUnlockEventIdFromNotificationResponse(response);
        if (eventId) {
          openUnlockCard(eventId);
        }
      }
    );

    return () => subscription.remove();
  }, [openUnlockCard]);

  useEffect(() => {
    const queuedEventId = queuedEventIdRef.current;
    if (isLoading || !queuedEventId) {
      return;
    }

    focusUnlockEvent(queuedEventId);
    void dismissUnlockNotification(queuedEventId).catch(() => {});
    clearLastUnlockNotificationResponse();
    queuedEventIdRef.current = undefined;
  }, [focusUnlockEvent, isLoading]);

  return null;
}
