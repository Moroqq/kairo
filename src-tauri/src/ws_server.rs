use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tauri::Emitter;
use tokio::net::TcpListener;
use tokio::sync::{broadcast, broadcast::error::RecvError, Mutex};
use tokio_tungstenite::{accept_async, tungstenite::Message};

/// State shared between Tauri commands and the WS listener.
pub struct WsHandle {
    pub tx:           broadcast::Sender<String>,
    pub client_count: Arc<Mutex<usize>>,
    pub port:         u16,
    pub ip:           String,
}

/// Detect the LAN IP this machine would use to reach the internet.
/// No packets are actually sent — the OS picks the right interface.
pub fn local_lan_ip() -> String {
    let socket = std::net::UdpSocket::bind("0.0.0.0:0")
        .and_then(|s| { s.connect("8.8.8.8:80")?; Ok(s) })
        .and_then(|s| s.local_addr());
    match socket {
        Ok(addr) => addr.ip().to_string(),
        Err(_) => "127.0.0.1".to_string(),
    }
}

/// Spawn the WebSocket server.  Returns the handle used by Tauri commands.
pub fn start(port: u16, app: tauri::AppHandle) -> WsHandle {
    let ip = local_lan_ip();
    let (tx, _) = broadcast::channel::<String>(256);
    let client_count = Arc::new(Mutex::new(0usize));

    let tx2 = tx.clone();
    let count2 = client_count.clone();
    tauri::async_runtime::spawn(async move {
        let listener = match TcpListener::bind(format!("0.0.0.0:{}", port)).await {
            Ok(l) => l,
            Err(e) => {
                eprintln!("[kairo-ws] bind error on :{} — {}", port, e);
                return;
            }
        };
        eprintln!("[kairo-ws] listening on 0.0.0.0:{}", port);

        loop {
            if let Ok((stream, _)) = listener.accept().await {
                tauri::async_runtime::spawn(handle_client(
                    stream,
                    tx2.clone(),
                    count2.clone(),
                    app.clone(),
                ));
            }
        }
    });

    WsHandle { tx, client_count, port, ip }
}

async fn handle_client(
    stream: tokio::net::TcpStream,
    tx: broadcast::Sender<String>,
    count: Arc<Mutex<usize>>,
    app: tauri::AppHandle,
) {
    let ws = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            eprintln!("[kairo-ws] handshake error: {}", e);
            return;
        }
    };

    {
        let mut n = count.lock().await;
        *n += 1;
        let _ = app.emit("ws-peers", *n);
    }

    let (mut sink, mut ws_stream) = ws.split();
    let mut rx = tx.subscribe();

    loop {
        tokio::select! {
            // ── Incoming from this WS client ──────────────────────
            msg = ws_stream.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        // relay to all other WS clients
                        let _ = tx.send(text.clone().to_string());
                        // deliver to desktop frontend via Tauri event
                        let _ = app.emit("ws-msg", text.as_str());
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    Some(Err(_)) => break,
                    Some(Ok(_)) => {} // ping/pong handled by tungstenite
                }
            }
            // ── Broadcast → send to this client ───────────────────
            recv = rx.recv() => {
                match recv {
                    Ok(text) => {
                        if sink.send(Message::text(text)).await.is_err() {
                            break;
                        }
                    }
                    Err(RecvError::Lagged(_)) => continue,
                    Err(RecvError::Closed) => break,
                }
            }
        }
    }

    {
        let mut n = count.lock().await;
        if *n > 0 { *n -= 1; }
        let _ = app.emit("ws-peers", *n);
    }
}
