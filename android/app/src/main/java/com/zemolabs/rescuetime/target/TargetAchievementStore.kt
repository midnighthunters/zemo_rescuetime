package com.zemolabs.rescuetime.target

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.max
import kotlin.math.roundToInt

object TargetAchievementStore {
  private const val PREFS_NAME = "target_achievement_watcher"
  private const val KEY_ENABLED = "enabled"
  private const val KEY_PLAN_JSON = "plan_json"
  private const val KEY_DATE = "date"
  private const val KEY_CURRENT_ANIMAL_ID = "current_animal_id"
  private const val KEY_ACTIVE_STEPS = "active_steps"
  private const val KEY_DAILY_STEPS = "daily_steps"
  private const val KEY_SENSOR_BASELINE = "sensor_baseline"
  private const val KEY_DAILY_SENSOR_BASELINE = "daily_sensor_baseline"
  private const val KEY_LAST_SENSOR_TOTAL = "last_sensor_total"
  private const val KEY_CLAIMED_TARGETS = "claimed_targets"
  private const val KEY_RESCUE_NOTIFIED = "rescue_notified"
  private const val KEY_NATIVE_EVENTS = "native_events"

  @Synchronized
  fun syncPlan(context: Context, planJson: String): Boolean {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val plan = JSONObject(planJson)
    val currentAnimal = plan.optJSONObject("currentAnimal")
    val enabled = plan.optBoolean("enabled", false) && currentAnimal != null
    val dateKey = plan.optString("dateKey", todayKey()).ifBlank { todayKey() }
    val currentAnimalId = currentAnimal?.optString("id").orEmpty()
    val previousAnimalId = prefs.getString(KEY_CURRENT_ANIMAL_ID, null)
    val previousDate = prefs.getString(KEY_DATE, null)
    val animalChanged = currentAnimalId != previousAnimalId
    val dayChanged = dateKey != previousDate
    val planActiveSteps = max(0, plan.optInt("activeStepsToday", 0))
    val storedActiveSteps =
        if (!animalChanged && !dayChanged) prefs.getInt(KEY_ACTIVE_STEPS, 0) else 0
    val activeSteps = max(storedActiveSteps, planActiveSteps)
    val planDailySteps = max(0, plan.optInt("stepsToday", activeSteps))
    val storedDailySteps = if (!dayChanged) prefs.getInt(KEY_DAILY_STEPS, 0) else 0
    val dailySteps = max(storedDailySteps, planDailySteps)
    val claimedTargets =
        if (animalChanged) {
          readIntSet(plan.optJSONArray("claimedTargetSteps"))
        } else {
          readIntSet(plan.optJSONArray("claimedTargetSteps")) +
              readIntSet(prefs.getString(KEY_CLAIMED_TARGETS, null))
        }
    val pendingEventIds = readStringSet(plan.optJSONArray("pendingEventIds"))
    val rescueEventId = if (currentAnimalId.isBlank()) "" else "rescue:$currentAnimalId"
    val rescueNotified =
        !animalChanged &&
            (prefs.getBoolean(KEY_RESCUE_NOTIFIED, false) ||
                pendingEventIds.contains(rescueEventId) ||
                (currentAnimal?.optBoolean("rescued", false) ?: false))
    val lastSensorTotal = getNullableFloat(prefs.getString(KEY_LAST_SENSOR_TOTAL, null))
    val editor =
        prefs
            .edit()
            .putBoolean(KEY_ENABLED, enabled)
            .putString(KEY_PLAN_JSON, planJson)
            .putString(KEY_DATE, dateKey)
            .putString(KEY_CURRENT_ANIMAL_ID, currentAnimalId)
            .putInt(KEY_ACTIVE_STEPS, activeSteps)
            .putInt(KEY_DAILY_STEPS, dailySteps)
            .putString(KEY_CLAIMED_TARGETS, JSONArray(claimedTargets.toList()).toString())
            .putBoolean(KEY_RESCUE_NOTIFIED, rescueNotified)

    if (lastSensorTotal != null) {
      editor.putString(KEY_SENSOR_BASELINE, (lastSensorTotal - activeSteps).toString())
      editor.putString(KEY_DAILY_SENSOR_BASELINE, (lastSensorTotal - dailySteps).toString())
    } else {
      editor.remove(KEY_SENSOR_BASELINE)
      editor.remove(KEY_DAILY_SENSOR_BASELINE)
    }

    editor.apply()
    return enabled
  }

  @Synchronized
  fun evaluateStepTotal(context: Context, rawSensorTotal: Float): Boolean {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    if (!prefs.getBoolean(KEY_ENABLED, false)) {
      return false
    }

    val planJson = prefs.getString(KEY_PLAN_JSON, null) ?: return false
    val plan = JSONObject(planJson)
    val currentAnimal = plan.optJSONObject("currentAnimal") ?: return false
    val currentAnimalId = currentAnimal.optString("id")
    if (currentAnimalId.isBlank()) {
      return false
    }

    val dateKey = todayKey()
    val previousDate = prefs.getString(KEY_DATE, null)
    var activeSteps = prefs.getInt(KEY_ACTIVE_STEPS, 0)
    var dailySteps = prefs.getInt(KEY_DAILY_STEPS, activeSteps)
    var baseline = getNullableFloat(prefs.getString(KEY_SENSOR_BASELINE, null))
    var dailyBaseline = getNullableFloat(prefs.getString(KEY_DAILY_SENSOR_BASELINE, null))
    val lastSensorTotal = getNullableFloat(prefs.getString(KEY_LAST_SENSOR_TOTAL, null))

    if (previousDate != dateKey) {
      activeSteps = 0
      dailySteps = 0
      baseline = rawSensorTotal
      dailyBaseline = rawSensorTotal
    } else if (lastSensorTotal != null && rawSensorTotal < lastSensorTotal) {
      baseline = rawSensorTotal - activeSteps
      dailyBaseline = rawSensorTotal - dailySteps
    } else {
      if (baseline == null) {
        baseline = rawSensorTotal - activeSteps
      }
      if (dailyBaseline == null) {
        dailyBaseline = rawSensorTotal - dailySteps
      }
    }

    val resolvedBaseline = baseline ?: rawSensorTotal - activeSteps
    val resolvedDailyBaseline = dailyBaseline ?: rawSensorTotal - dailySteps
    baseline = resolvedBaseline
    dailyBaseline = resolvedDailyBaseline

    val computedActiveSteps = max(0, (rawSensorTotal - resolvedBaseline).roundToInt())
    activeSteps = max(activeSteps, computedActiveSteps)
    val computedDailySteps = max(0, (rawSensorTotal - resolvedDailyBaseline).roundToInt())
    dailySteps = max(dailySteps, computedDailySteps)

    val editor =
        prefs
            .edit()
            .putString(KEY_DATE, dateKey)
            .putInt(KEY_ACTIVE_STEPS, activeSteps)
            .putInt(KEY_DAILY_STEPS, dailySteps)
            .putString(KEY_SENSOR_BASELINE, baseline.toString())
            .putString(KEY_DAILY_SENSOR_BASELINE, dailyBaseline.toString())
            .putString(KEY_LAST_SENSOR_TOTAL, rawSensorTotal.toString())
    editor.apply()

    evaluateTargets(context, plan, currentAnimal, activeSteps)
    return true
  }

  @Synchronized
  fun getStepSnapshotJson(context: Context): String {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val activeSteps = max(0, prefs.getInt(KEY_ACTIVE_STEPS, 0))
    val dailySteps = max(activeSteps, prefs.getInt(KEY_DAILY_STEPS, activeSteps))

    return JSONObject()
        .put("dateKey", prefs.getString(KEY_DATE, todayKey()) ?: todayKey())
        .put("currentAnimalId", prefs.getString(KEY_CURRENT_ANIMAL_ID, "") ?: "")
        .put("activeStepsToday", activeSteps)
        .put("stepsToday", dailySteps)
        .toString()
  }

  @Synchronized
  fun getNativeEventsJson(context: Context): String {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    return prefs.getString(KEY_NATIVE_EVENTS, "[]") ?: "[]"
  }

  @Synchronized
  fun markNativeEventsConsumed(context: Context, eventIdsJson: String) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val consumedIds = readStringSet(JSONArray(eventIdsJson))
    if (consumedIds.isEmpty()) {
      return
    }

    val currentEvents = JSONArray(prefs.getString(KEY_NATIVE_EVENTS, "[]"))
    val nextEvents = JSONArray()
    for (index in 0 until currentEvents.length()) {
      val event = currentEvents.optJSONObject(index) ?: continue
      if (!consumedIds.contains(event.optString("id"))) {
        nextEvents.put(event)
      }
    }

    prefs.edit().putString(KEY_NATIVE_EVENTS, nextEvents.toString()).apply()
  }

  fun isEnabled(context: Context): Boolean {
    return context
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getBoolean(KEY_ENABLED, false)
  }

  private fun evaluateTargets(
      context: Context,
      plan: JSONObject,
      currentAnimal: JSONObject,
      activeSteps: Int
  ) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val animalId = currentAnimal.optString("id")
    val animalName = currentAnimal.optString("name")
    var claimedTargets = readIntSet(prefs.getString(KEY_CLAIMED_TARGETS, null)).toMutableSet()
    val rewardTargets = currentAnimal.optJSONArray("rewardTargets") ?: JSONArray()
    var changed = false

    for (index in 0 until rewardTargets.length()) {
      val target = rewardTargets.optJSONObject(index) ?: continue
      val stepTarget = target.optInt("stepTarget", 0)
      if (stepTarget <= 0 || activeSteps < stepTarget || claimedTargets.contains(stepTarget)) {
        continue
      }

      val rewardId = target.optString("rewardId")
      val eventId = "reward:$animalId:$rewardId"
      val notificationTitle =
          target.optString("notificationTitle").ifBlank { "${target.optString("title")} unlocked" }
      val notificationBody =
          target.optString("notificationBody").ifBlank {
            String.format(
                Locale.US,
                "%s reached %,d steps. Tap to view the unlock card.",
                animalName,
                stepTarget
            )
          }
      val event =
          JSONObject()
              .put("id", eventId)
              .put("type", "reward")
              .put("animalId", animalId)
              .put("rewardId", rewardId)
              .put("stepTarget", stepTarget)
              .put("createdAt", isoNow())

      appendNativeEvent(prefs, event)
      TargetAchievementNotifier.showTargetNotification(
          context = context,
          eventId = eventId,
          title = notificationTitle,
          body = notificationBody
      )
      claimedTargets.add(stepTarget)
      changed = true
    }

    val unlockSteps = currentAnimal.optInt("unlockSteps", 0)
    val rescueEventId = "rescue:$animalId"
    val rescueNotified =
        prefs.getBoolean(KEY_RESCUE_NOTIFIED, false) ||
            readStringSet(plan.optJSONArray("pendingEventIds")).contains(rescueEventId) ||
            currentAnimal.optBoolean("rescued", false)

    if (unlockSteps > 0 && activeSteps >= unlockSteps && !rescueNotified) {
      val event =
          JSONObject()
              .put("id", rescueEventId)
              .put("type", "rescue")
              .put("animalId", animalId)
              .put("stepTarget", unlockSteps)
              .put("createdAt", isoNow())
      val notificationTitle =
          currentAnimal.optString("rescueNotificationTitle").ifBlank {
            "$animalName rescue unlocked"
          }
      val notificationBody =
          currentAnimal.optString("rescueNotificationBody").ifBlank {
            String.format(
                Locale.US,
                "%,d steps complete. Tap to view the rescue card.",
                unlockSteps
            )
          }
      appendNativeEvent(prefs, event)
      TargetAchievementNotifier.showTargetNotification(
          context = context,
          eventId = rescueEventId,
          title = notificationTitle,
          body = notificationBody
      )
      prefs.edit().putBoolean(KEY_RESCUE_NOTIFIED, true).apply()
    }

    if (changed) {
      prefs
          .edit()
          .putString(KEY_CLAIMED_TARGETS, JSONArray(claimedTargets.toList()).toString())
          .apply()
    }
  }

  private fun appendNativeEvent(prefs: android.content.SharedPreferences, event: JSONObject) {
    val eventId = event.optString("id")
    val currentEvents = JSONArray(prefs.getString(KEY_NATIVE_EVENTS, "[]"))
    for (index in 0 until currentEvents.length()) {
      if (currentEvents.optJSONObject(index)?.optString("id") == eventId) {
        return
      }
    }

    currentEvents.put(event)
    prefs.edit().putString(KEY_NATIVE_EVENTS, currentEvents.toString()).apply()
  }

  private fun readIntSet(raw: String?): Set<Int> {
    if (raw.isNullOrBlank()) {
      return emptySet()
    }

    return readIntSet(JSONArray(raw))
  }

  private fun readIntSet(array: JSONArray?): Set<Int> {
    if (array == null) {
      return emptySet()
    }

    val values = mutableSetOf<Int>()
    for (index in 0 until array.length()) {
      values.add(array.optInt(index))
    }
    return values
  }

  private fun readStringSet(array: JSONArray?): Set<String> {
    if (array == null) {
      return emptySet()
    }

    val values = mutableSetOf<String>()
    for (index in 0 until array.length()) {
      val value = array.optString(index)
      if (value.isNotBlank()) {
        values.add(value)
      }
    }
    return values
  }

  private fun getNullableFloat(raw: String?): Float? {
    return raw?.toFloatOrNull()
  }

  private fun todayKey(): String = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

  private fun isoNow(): String = java.time.Instant.now().toString()
}
