package com.kairo.app

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  // Иконки статус-бара (часы/батарея) должны быть тёмными на светлых темах
  // и светлыми на тёмных — веб-код дёргает это при каждой смене темы.
  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webView.addJavascriptInterface(StatusBarBridge(this), "AndroidStatusBar")
  }

  inner class StatusBarBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun setLight(light: Boolean) {
      activity.runOnUiThread {
        WindowCompat.getInsetsController(activity.window, activity.window.decorView)
          .isAppearanceLightStatusBars = light
      }
    }
  }
}
