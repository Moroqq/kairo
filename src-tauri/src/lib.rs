#[cfg(debug_assertions)]
use tauri::Manager;

// ── установка обновления ─────────────────────────────────────────────────────

/// Мостик к Android-установщику.
///
/// tauri-plugin-updater не поддерживает Android, а tauri-plugin-opener не умеет
/// отдавать APK системному установщику: тому нужна content://-ссылка через
/// FileProvider. Регистрируем свой Kotlin-плагин (см. InstallerPlugin.kt) и
/// держим его хэндл в состоянии приложения.
///
/// Команда ниже — обычная команда приложения, а не команда плагина. Так она
/// не требует отдельных разрешений в capabilities: вызывается только нашим же
/// кодом, чужому JS во webview взяться неоткуда.
#[cfg(target_os = "android")]
mod android_installer {
    use serde::Serialize;
    use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
    use tauri::{AppHandle, Manager, Runtime};

    pub struct Installer<R: Runtime>(pub PluginHandle<R>);

    #[derive(Serialize)]
    struct InstallArgs {
        path: String,
    }

    pub fn init<R: Runtime>() -> TauriPlugin<R> {
        Builder::new("installer")
            .setup(|app, api| {
                let handle = api.register_android_plugin("com.kairo.app", "InstallerPlugin")?;
                app.manage(Installer(handle));
                Ok(())
            })
            .build()
    }

    pub fn install<R: Runtime>(app: &AppHandle<R>, path: String) -> Result<(), String> {
        app.state::<Installer<R>>()
            .0
            .run_mobile_plugin::<serde_json::Value>("install", InstallArgs { path })
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
}

/// Отдать скачанный файл системе: на Android — установщику пакетов, на
/// десктопе — обработчику по умолчанию, то есть запустить установщик.
#[tauri::command]
#[allow(unused_variables)]
fn install_update(app: tauri::AppHandle, path: String) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        android_installer::install(&app, path)
    }
    #[cfg(desktop)]
    {
        use tauri_plugin_opener::OpenerExt;
        app.opener()
            .open_path(path, None::<&str>)
            .map_err(|e| e.to_string())
    }
    #[cfg(all(not(target_os = "android"), not(desktop)))]
    {
        Err("установка на этой платформе не поддерживается".to_string())
    }
}

// ── commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// ── entry point ──────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init());

    #[cfg(target_os = "android")]
    let builder = builder.plugin(android_installer::init());

    builder
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            let _ = app;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_app_version, install_update])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
