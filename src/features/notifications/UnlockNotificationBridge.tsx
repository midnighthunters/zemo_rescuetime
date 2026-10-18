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
  const { focusUnlockEvent, isLoading, rescueProgress } = useRescue();
  const queuedEventIdRef = useRef<string | undefined>(undefined);

  const openUnlockCard = useCallback(
    (eventId: string) => {
      if (rescueProgress.seenUnlockEventIds?.includes(eventId)) {
        clearLastUnlockNotificationResponse();
        return;
      }
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
    [focusUnlockEvent, isLoading, rescueProgress.seenUnlockEventIds]
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    void configureUnlockNotifications().catch(() => {});

    const lastResponse = Notifications.getLastNotificationResponse();
    const lastEventId = getUnlockEventIdFromNotificationResponse(lastResponse);
    if (lastEventId) {
      if (rescueProgress.seenUnlockEventIds?.includes(lastEventId)) {
        clearLastUnlockNotificationResponse();
      } else {
        openUnlockCard(lastEventId);
      }
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const eventId = getUnlockEventIdFromNotificationResponse(response);
        if (eventId) {
          if (rescueProgress.seenUnlockEventIds?.includes(eventId)) {
            clearLastUnlockNotificationResponse();
          } else {
            openUnlockCard(eventId);
          }
        }
      }
    );

    return () => subscription.remove();
  }, [openUnlockCard, rescueProgress.seenUnlockEventIds]);

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
