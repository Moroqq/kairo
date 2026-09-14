package com.kairo.app

import android.app.Activity
import android.content.Intent
import androidx.core.content.FileProvider
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import java.io.File

/**
 * Запуск системного установщика для скачанного APK.
 *
 * Зачем понадобился свой код. tauri-plugin-updater Android не поддерживает
 * вовсе — в крейте нет ни одного Android-файла. tauri-plugin-opener тоже не
 * годится: он делает ACTION_VIEW с сырым путём, а начиная с Android 7 путь
 * вида file:// при передаче другому приложению приводит к
 * FileUriExposedException. Установщику нужна content://-ссылка через
 * FileProvider плюс явное разрешение на чтение.
 *
 * Инфраструктура для этого в проекте уже была: и провайдер с авторитетом
 * ${applicationId}.fileprovider, и разрешение REQUEST_INSTALL_PACKAGES
 * объявлены в AndroidManifest.xml. Не хватало только этого мостика.
 */
@InvokeArg
class InstallArgs {
  lateinit var path: String
}

@TauriPlugin
class InstallerPlugin(private val activity: Activity) : Plugin(activity) {

  @Command
  fun install(invoke: Invoke) {
    try {
      val args = invoke.parseArgs(InstallArgs::class.java)
      val source = File(args.path)
      if (!source.exists()) {
        invoke.reject("файл не найден: ${args.path}")
        return
      }

      val authority = "${activity.packageName}.fileprovider"

      // FileProvider отдаёт ссылку только на каталоги, перечисленные в
      // res/xml/file_paths.xml. Если путь в список не попал — не сдаёмся,
      // а переносим файл в кэш приложения, который там точно есть.
      val uri = try {
        FileProvider.getUriForFile(activity, authority, source)
      } catch (_: IllegalArgumentException) {
        val staged = File(activity.cacheDir, source.name)
        if (staged.absolutePath != source.absolutePath) {
          source.copyTo(staged, overwrite = true)
        }
        FileProvider.getUriForFile(activity, authority, staged)
      }

      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/vnd.android.package-archive")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      activity.startActivity(intent)
      invoke.resolve()
    } catch (ex: Exception) {
      // Наружу уходит текст ошибки: клиент по нему решает, откатываться ли
      // на скачивание браузером, и показывает причину человеку.
      invoke.reject(ex.message ?: ex.toString())
    }
  }
}
