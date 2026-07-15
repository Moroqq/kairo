mod ws_server;

use tauri::Manager;
use ws_server::WsHandle;

const WS_PORT: u16 = 8765;

// ── commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Returns server status: ip, port, connected client count.
#[tauri::command]
async fn ws_status(state: tauri::State<'_, WsHandle>) -> Result<serde_json::Value, String> {
    let peers = *state.client_count.lock().await;
    Ok(serde_json::json!({
        "ip":    state.ip,
        "port":  state.port,
        "peers": peers,
    }))
}

/// Broadcast a JSON string to every connected WS client.
#[tauri::command]
async fn ws_broadcast(
    state: tauri::State<'_, WsHandle>,
    msg: String,
) -> Result<(), String> {
    // ignore error when no clients are connected (no receivers)
    let _ = state.tx.send(msg);
    Ok(())
}

// ── entry point ──────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            // Start WebSocket hub and register handle as Tauri state
            let handle = ws_server::start(WS_PORT, app.handle().clone());
            app.manage(handle);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            ws_status,
            ws_broadcast,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
