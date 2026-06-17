package com.zemolabs.rescuetime.target

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build

object TargetAchievementNotifier {
  private const val TARGET_CHANNEL_ID = "target-unlocks"
  private const val WATCHER_CHANNEL_ID = "target-watcher"

  fun createWatcherNotification(context: Context): Notification {
    ensureChannel(
        context,
        WATCHER_CHANNEL_ID,
        "Step target watcher",
        NotificationManager.IMPORTANCE_LOW
    )

    return notificationBuilder(context, WATCHER_CHANNEL_ID)
        .setContentTitle("Rescue Animals is watching your step targets")
        .setContentText("You will be notified as soon as a target is reached.")
        .setOngoing(true)
        .setShowWhen(false)
        .setContentIntent(createLaunchPendingIntent(context, "watcher"))
        .build()
  }

  fun showTargetNotification(context: Context, eventId: String, title: String, body: String) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED) {
      return
    }

    ensureChannel(
        context,
        TARGET_CHANNEL_ID,
        "Target unlocks",
        NotificationManager.IMPORTANCE_HIGH
    )

    val notification =
        notificationBuilder(context, TARGET_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(Notification.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(Notification.PRIORITY_HIGH)
            .setVibrate(longArrayOf(0, 220, 120, 220))
            .setContentIntent(createLaunchPendingIntent(context, eventId))
            .build()

    notificationManager(context).notify(notificationId(eventId), notification)
  }

  fun dismiss(context: Context, eventId: String) {
    notificationManager(context).cancel(notificationId(eventId))
  }

  private fun notificationBuilder(context: Context, channelId: String): Notification.Builder {
    val builder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          Notification.Builder(context, channelId)
        } else {
          @Suppress("DEPRECATION") Notification.Builder(context)
        }

    return builder
        .setSmallIcon(context.applicationInfo.icon)
        .setColor(0xFF58C27D.toInt())
        .setContentIntent(createLaunchPendingIntent(context, channelId))
  }

  private fun ensureChannel(
      context: Context,
      channelId: String,
      name: String,
      importance: Int
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val channel = NotificationChannel(channelId, name, importance)
    if (channelId == TARGET_CHANNEL_ID) {
      channel.enableVibration(true)
      channel.vibrationPattern = longArrayOf(0, 220, 120, 220)
    }
    notificationManager(context).createNotificationChannel(channel)
  }

  private fun createLaunchPendingIntent(context: Context, requestKey: String): PendingIntent {
    val intent =
        context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?: Intent().setPackage(context.packageName)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)

    val flags =
        PendingIntent.FLAG_UPDATE_CURRENT or
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0

    return PendingIntent.getActivity(context, notificationId(requestKey), intent, flags)
  }

  private fun notificationManager(context: Context): NotificationManager {
    return context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
  }

  private fun notificationId(value: String): Int {
    return value.hashCode() and 0x7fffffff
  }
}
