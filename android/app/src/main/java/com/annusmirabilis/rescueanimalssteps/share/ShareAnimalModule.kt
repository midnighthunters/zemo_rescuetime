package com.annusmirabilis.rescueanimalssteps.share

import android.content.ClipData
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.net.Uri
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import java.io.File
import java.net.URL
import kotlin.math.min

class ShareAnimalModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "ShareAnimalModule"

  @ReactMethod
  fun shareAnimalCard(options: ReadableMap, promise: Promise) {
    try {
      val animalName = options.getString("animalName") ?: "Animal"
      val factCopy = options.getOptionalString("factCopy")
      val imageUri = options.getOptionalString("imageUri")
      val message = options.getString("message") ?: ""
      val title = options.getString("title") ?: "$animalName is free!"
      val card = renderShareCard(animalName, factCopy, imageUri)
      val outputFile = writeShareCard(card)
      val shareUri = FileProvider.getUriForFile(
          reactContext,
          "${reactContext.packageName}.shareprovider",
          outputFile
      )
      val sendIntent = Intent(Intent.ACTION_SEND).apply {
        type = "image/png"
        putExtra(Intent.EXTRA_STREAM, shareUri)
        putExtra(Intent.EXTRA_TEXT, message)
        putExtra(Intent.EXTRA_TITLE, title)
        clipData = ClipData.newUri(reactContext.contentResolver, title, shareUri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      val chooser = Intent.createChooser(sendIntent, "Share $animalName")

      UiThreadUtil.runOnUiThread {
        try {
          val activity = getCurrentActivity()
          if (activity != null) {
            activity.startActivity(chooser)
          } else {
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(chooser)
          }
          promise.resolve(null)
        } catch (error: Exception) {
          promise.reject("SHARE_ANIMAL_OPEN_FAILED", error)
        }
      }
    } catch (error: Exception) {
      promise.reject("SHARE_ANIMAL_CARD_FAILED", error)
    }
  }

  private fun ReadableMap.getOptionalString(key: String): String? {
    if (!hasKey(key) || isNull(key)) {
      return null
    }

    return getString(key)
  }

  private fun renderShareCard(
      animalName: String,
      factCopy: String?,
      imageUri: String?
  ): Bitmap {
    val width = 1080
    val height = 1350
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)

    paint.shader = LinearGradient(
        0f,
        0f,
        0f,
        height.toFloat(),
        intArrayOf(Color.parseColor("#FFF8EA"), Color.parseColor("#EAF8F0")),
        null,
        Shader.TileMode.CLAMP
    )
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
    paint.shader = null

    drawRoundedRect(canvas, RectF(76f, 84f, 1004f, 1274f), 46f, "#1F000000")
    drawRoundedRect(canvas, RectF(64f, 72f, 1016f, 1262f), 46f, "#FFFFFF")

    drawRoundedRect(canvas, RectF(122f, 122f, 414f, 178f), 28f, "#EEF9F2", "#BFE9CE", 2f)
    drawSingleLine(canvas, "RESCUE STEPS", 146f, 159f, 27f, "#117A49", Typeface.BOLD)

    val headlinePaint = createTextPaint(64f, "#223047", Typeface.BOLD)
    val headlineHeight = drawTextBlock(
        canvas,
        "I rescued $animalName!",
        122f,
        222f,
        836,
        headlinePaint,
        Layout.Alignment.ALIGN_CENTER,
        2
    )
    val subtitlePaint = createTextPaint(32f, "#6D7C91", Typeface.BOLD)
    drawTextBlock(
        canvas,
        "Every step helped open the gate and give them a safe home.",
        158f,
        242f + headlineHeight,
        764,
        subtitlePaint,
        Layout.Alignment.ALIGN_CENTER,
        2
    )

    val stageRect = RectF(122f, 398f, 958f, 862f)
    drawRoundedRect(canvas, stageRect, 38f, "#CDEFFF", "#FFFFFF", 4f)
    drawRoundedRect(canvas, RectF(240f, 746f, 840f, 806f), 30f, "#99D9A9")

    val animalBitmap = loadAnimalBitmap(imageUri)
    if (animalBitmap != null) {
      drawBitmapInside(canvas, animalBitmap, RectF(170f, 420f, 910f, 820f))
    } else {
      drawAnimalPlaceholder(canvas, stageRect)
    }

    val factRect = RectF(122f, 914f, 958f, 1138f)
    drawRoundedRect(canvas, factRect, 30f, "#FFF3D6", "#FFE0A3", 3f)
    drawSingleLine(canvas, "FUN FACT", 170f, 974f, 28f, "#D8951D", Typeface.BOLD)
    drawTextBlock(
        canvas,
        factCopy ?: "A rescued animal can rest, play, and build trust with steady care.",
        170f,
        1006f,
        740,
        createTextPaint(34f, "#223047", Typeface.BOLD),
        Layout.Alignment.ALIGN_NORMAL,
        3
    )

    drawRoundedRect(canvas, RectF(122f, 1174f, 958f, 1234f), 30f, "#EEF9F2", "#BFE9CE", 2f)
    drawTextBlock(
        canvas,
        "Shared from Rescue Animals Steps",
        170f,
        1191f,
        740,
        createTextPaint(28f, "#117A49", Typeface.BOLD),
        Layout.Alignment.ALIGN_CENTER,
        1
    )

    return bitmap
  }

  private fun drawRoundedRect(
      canvas: Canvas,
      rect: RectF,
      radius: Float,
      fillColor: String,
      strokeColor: String? = null,
      strokeWidth: Float = 0f
  ) {
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.parseColor(fillColor)
      style = Paint.Style.FILL
    }
    canvas.drawRoundRect(rect, radius, radius, paint)

    if (strokeColor != null && strokeWidth > 0f) {
      paint.color = Color.parseColor(strokeColor)
      paint.style = Paint.Style.STROKE
      paint.strokeWidth = strokeWidth
      canvas.drawRoundRect(rect, radius, radius, paint)
    }
  }

  private fun drawSingleLine(
      canvas: Canvas,
      text: String,
      x: Float,
      baseline: Float,
      textSize: Float,
      color: String,
      style: Int
  ) {
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      this.color = Color.parseColor(color)
      this.textSize = textSize
      typeface = Typeface.create(Typeface.DEFAULT, style)
    }
    canvas.drawText(text, x, baseline, paint)
  }

  private fun createTextPaint(textSize: Float, color: String, style: Int): TextPaint {
    return TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
      this.color = Color.parseColor(color)
      this.textSize = textSize
      typeface = Typeface.create(Typeface.DEFAULT, style)
    }
  }

  private fun drawTextBlock(
      canvas: Canvas,
      text: String,
      x: Float,
      y: Float,
      width: Int,
      textPaint: TextPaint,
      alignment: Layout.Alignment,
      maxLines: Int
  ): Float {
    val layout = StaticLayout.Builder
        .obtain(text, 0, text.length, textPaint, width)
        .setAlignment(alignment)
        .setEllipsize(TextUtils.TruncateAt.END)
        .setIncludePad(false)
        .setLineSpacing(4f, 1f)
        .setMaxLines(maxLines)
        .build()

    canvas.save()
    canvas.translate(x, y)
    layout.draw(canvas)
    canvas.restore()
    return layout.height.toFloat()
  }

  private fun drawBitmapInside(canvas: Canvas, bitmap: Bitmap, bounds: RectF) {
    val scale = min(bounds.width() / bitmap.width.toFloat(), bounds.height() / bitmap.height.toFloat())
    val drawWidth = bitmap.width * scale
    val drawHeight = bitmap.height * scale
    val left = bounds.left + (bounds.width() - drawWidth) / 2f
    val top = bounds.top + (bounds.height() - drawHeight) / 2f
    val dest = RectF(left, top, left + drawWidth, top + drawHeight)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    canvas.drawBitmap(bitmap, null, dest, paint)
  }

  private fun drawAnimalPlaceholder(canvas: Canvas, stageRect: RectF) {
    val centerX = stageRect.centerX()
    val centerY = stageRect.centerY()
    drawRoundedRect(
        canvas,
        RectF(centerX - 150f, centerY - 108f, centerX + 150f, centerY + 108f),
        34f,
        "#FFFFFF",
        "#B8E3FF",
        3f
    )
    drawTextBlock(
        canvas,
        "Animal rescued",
        centerX - 118f,
        centerY - 20f,
        236,
        createTextPaint(34f, "#117A49", Typeface.BOLD),
        Layout.Alignment.ALIGN_CENTER,
        2
    )
  }

  private fun loadAnimalBitmap(imageUri: String?): Bitmap? {
    if (imageUri.isNullOrBlank()) {
      return null
    }

    decodeAndroidResource(imageUri)?.let { return it }

    return try {
      when {
        imageUri.startsWith("http://") || imageUri.startsWith("https://") -> {
          val connection = URL(imageUri).openConnection()
          connection.connectTimeout = 5000
          connection.readTimeout = 5000
          connection.getInputStream().use { BitmapFactory.decodeStream(it) }
        }
        imageUri.startsWith("file://") || imageUri.startsWith("content://") -> {
          reactContext.contentResolver.openInputStream(Uri.parse(imageUri))?.use {
            BitmapFactory.decodeStream(it)
          }
        }
        imageUri.startsWith("asset:/") -> {
          val assetPath = imageUri.removePrefix("asset:/").trimStart('/')
          reactContext.assets.open(assetPath).use { BitmapFactory.decodeStream(it) }
        }
        else -> null
      }
    } catch (_: Exception) {
      null
    }
  }

  private fun decodeAndroidResource(imageUri: String): Bitmap? {
    val resourceNames = buildResourceNameCandidates(imageUri)
    val resources = reactContext.resources

    for (name in resourceNames) {
      val resourceId = resources.getIdentifier(name, "drawable", reactContext.packageName)
      if (resourceId != 0) {
        return BitmapFactory.decodeResource(resources, resourceId)
      }
    }

    return null
  }

  private fun buildResourceNameCandidates(imageUri: String): List<String> {
    val path = try {
      Uri.parse(imageUri).path ?: imageUri
    } catch (_: Exception) {
      imageUri
    }
    val withoutQuery = path.substringBefore("?")
    val withoutExtension = withoutQuery.substringBeforeLast(".")
    val pathCandidate = normalizeResourceName(withoutExtension.trimStart('/').replace("/", "_"))
    val lastSegmentCandidate = normalizeResourceName(withoutExtension.substringAfterLast("/"))

    return listOf(pathCandidate, lastSegmentCandidate)
        .filter { it.isNotBlank() }
        .distinct()
  }

  private fun normalizeResourceName(value: String): String {
    return value
        .removePrefix("asset_")
        .removePrefix("assets_")
        .lowercase()
        .replace(Regex("[^a-z0-9_]"), "")
  }

  private fun writeShareCard(bitmap: Bitmap): File {
    val shareDir = File(reactContext.cacheDir, "share")
    if (!shareDir.exists()) {
      shareDir.mkdirs()
    }
    shareDir.listFiles()?.forEach { file ->
      if (file.name.startsWith("rescue-share-")) {
        file.delete()
      }
    }

    val outputFile = File(shareDir, "rescue-share-${System.currentTimeMillis()}.png")
    outputFile.outputStream().use { stream ->
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
    }
    return outputFile
  }
}
