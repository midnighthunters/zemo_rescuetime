package com.annusmirabilis.rescueanimalssteps.target

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TargetAchievementModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "TargetAchievementModule"

  @ReactMethod
  fun syncPlan(planJson: String, promise: Promise) {
    try {
      val enabled = TargetAchievementStore.syncPlan(reactContext, planJson)
      TargetAchievementService.applyEnabledState(reactContext, enabled)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("TARGET_ACHIEVEMENT_SYNC_FAILED", error)
    }
  }

  @ReactMethod
  fun getNativeEvents(promise: Promise) {
    try {
      promise.resolve(TargetAchievementStore.getNativeEventsJson(reactContext))
    } catch (error: Exception) {
      promise.reject("TARGET_ACHIEVEMENT_EVENTS_FAILED", error)
    }
  }

  @ReactMethod
  fun getStepSnapshot(promise: Promise) {
    try {
      promise.resolve(TargetAchievementStore.getStepSnapshotJson(reactContext))
    } catch (error: Exception) {
      promise.reject("TARGET_ACHIEVEMENT_STEP_SNAPSHOT_FAILED", error)
    }
  }

  @ReactMethod
  fun markNativeEventsConsumed(eventIdsJson: String, promise: Promise) {
    try {
      TargetAchievementStore.markNativeEventsConsumed(reactContext, eventIdsJson)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("TARGET_ACHIEVEMENT_CONSUME_FAILED", error)
    }
  }

  @ReactMethod
  fun dismissNotification(eventId: String, promise: Promise) {
    try {
      TargetAchievementNotifier.dismiss(reactContext, eventId)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("TARGET_ACHIEVEMENT_DISMISS_FAILED", error)
    }
  }
}
