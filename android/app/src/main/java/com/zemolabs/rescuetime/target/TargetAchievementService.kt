package com.zemolabs.rescuetime.target

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder

class TargetAchievementService : Service(), SensorEventListener {
  private var sensorManager: SensorManager? = null
  private var stepCounter: Sensor? = null
  private var isRegistered = false

  override fun onCreate() {
    super.onCreate()
    sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
    stepCounter = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (!TargetAchievementStore.isEnabled(this)) {
      stopSelf()
      return START_NOT_STICKY
    }

    if (!startInForeground()) {
      stopSelf()
      return START_NOT_STICKY
    }

    if (sensorManager == null) {
      sensorManager = getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    }
    if (stepCounter == null) {
      stepCounter = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    }

    val sensor = stepCounter
    val manager = sensorManager
    if (sensor == null || manager == null) {
      stopSelf()
      return START_NOT_STICKY
    }

    if (!isRegistered) {
      isRegistered = manager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
    }

    return START_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    super.onTaskRemoved(rootIntent)
    // Foreground service runs with android:stopWithTask="false" and START_STICKY.
    // Do not call startForegroundService from background context on Android 12+.
  }

  override fun onDestroy() {
    if (isRegistered) {
      sensorManager?.unregisterListener(this)
      isRegistered = false
    }
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onSensorChanged(event: SensorEvent) {
    val total = event.values.firstOrNull() ?: return
    TargetAchievementStore.evaluateStepTotal(this, total)
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

  private fun startInForeground(): Boolean {
    return try {
      val notification = TargetAchievementNotifier.createWatcherNotification(this)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(
            WATCHER_NOTIFICATION_ID,
            notification,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
        )
      } else {
        startForeground(WATCHER_NOTIFICATION_ID, notification)
      }
      true
    } catch (e: Exception) {
      android.util.Log.e("TargetAchievementService", "Failed to startForeground", e)
      false
    }
  }

  companion object {
    private const val WATCHER_NOTIFICATION_ID = 58027

    fun applyEnabledState(context: Context, enabled: Boolean) {
      val intent = Intent(context, TargetAchievementService::class.java)
      if (!enabled) {
        try {
          context.stopService(intent)
        } catch (e: Exception) {
          android.util.Log.e("TargetAchievementService", "Failed to stop service", e)
        }
        return
      }

      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(intent)
        } else {
          context.startService(intent)
        }
      } catch (e: Exception) {
        android.util.Log.e("TargetAchievementService", "Failed to start service", e)
      }
    }
  }
}
