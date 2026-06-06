package com.annusmirabilis.rescueanimalssteps.target

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class TargetAchievementBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED && TargetAchievementStore.isEnabled(context)) {
      TargetAchievementService.applyEnabledState(context, true)
    }
  }
}
