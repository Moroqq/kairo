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

/// Adapter name substrings that indicate a virtual/VPN/tunnel interface —
/// never the real Wi-Fi/Ethernet adapter a phone could reach.
const IGNORED_ADAPTER_PATTERNS: &[&str] = &[
    "tun", "tap", "vpn", "wsl", "docker", "vmware", "virtualbox", "vbox",
    "hyper-v", "vethernet", "veth", "npcap", "loopback", "wireguard", "wg",
    "zerotier", "tailscale", "utun", "ppp", "ipsec",
];

/// Emit a diagnostic line to both the terminal (if attached) and the
/// frontend (`ws-log` event) — the frontend shows these in a copyable log
/// panel, which is the only way to see backend diagnostics on a signed
/// release APK where no console is attached.
fn log_event(app: &tauri::AppHandle, msg: impl Into<String>) {
    let msg = msg.into();
    eprintln!("[kairo-ws] {}", msg);
    let _ = app.emit("ws-log", msg);
}

/// One interface considered during LAN-IP detection, with the verdict —
/// used to explain *why* a given IP was (or wasn't) picked.
pub struct IfaceCandidate {
    name: String,
    ip: std::net::Ipv4Addr,
    accepted: bool,
    reason: &'static str,
}

fn scan_interfaces() -> Vec<IfaceCandidate> {
    let ifaces = if_addrs::get_if_addrs().unwrap_or_default();
    let mut out = Vec::new();

    for iface in &ifaces {
        let std::net::IpAddr::V4(ip) = iface.ip() else { continue };

        if iface.is_loopback() {
            out.push(IfaceCandidate { name: iface.name.clone(), ip, accepted: false, reason: "loopback" });
            continue;
        }
        let name_lower = iface.name.to_lowercase();
        if let Some(pat) = IGNORED_ADAPTER_PATTERNS.iter().find(|p| name_lower.contains(**p)) {
            out.push(IfaceCandidate { name: iface.name.clone(), ip, accepted: false, reason: pat });
            continue;
        }
        let o = ip.octets();
        let is_private = o[0] == 192 && o[1] == 168
            || o[0] == 10
            || (o[0] == 172 && (16..=31).contains(&o[1]));
        if !is_private {
            out.push(IfaceCandidate { name: iface.name.clone(), ip, accepted: false, reason: "not-private" });
            continue;
        }
        out.push(IfaceCandidate { name: iface.name.clone(), ip, accepted: true, reason: "ok" });
    }
    out
}

/// Detect the real LAN IP a phone on the same Wi-Fi/hotspot could reach.
///
/// Enumerates all network interfaces instead of relying on the "UDP connect
/// trick" (connect a socket to 8.8.8.8 and read back the local address) —
/// that trick picks whichever interface has the OS's default route, which on
/// dev machines is frequently a VPN tunnel or WSL/Docker virtual adapter
/// rather than the actual Wi-Fi adapter, making the address unreachable.
pub fn local_lan_ip(candidates: &[IfaceCandidate]) -> String {
    let mut ips: Vec<std::net::Ipv4Addr> = candidates.iter()
        .filter(|c| c.accepted)
        .map(|c| c.ip)
        .collect();

    // Домашние сети и hotspot почти всегда 192.168.x.x — предпочитаем их,
    // если после фильтрации осталось несколько кандидатов.
    ips.sort_by_key(|ip| if ip.octets()[0] == 192 { 0 } else { 1 });

    ips.into_iter().next().map(|ip| ip.to_string()).unwrap_or_else(|| "127.0.0.1".to_string())
}

/// Spawn the WebSocket server.  Returns the handle used by Tauri commands.
pub fn start(port: u16, app: tauri::AppHandle) -> WsHandle {
    let candidates = scan_interfaces();
    let ip = local_lan_ip(&candidates);

    for c in &candidates {
        let verdict = if c.accepted { "✓ выбран кандидат" } else { "✗ пропущен" };
        log_event(&app, format!("iface {} — {} [{}] ({})", c.name, c.ip, verdict, c.reason));
    }
    log_event(&app, format!("определён LAN IP: {}", ip));

    let (tx, _) = broadcast::channel::<String>(256);
    let client_count = Arc::new(Mutex::new(0usize));

    let tx2 = tx.clone();
    let count2 = client_count.clone();
    let app2 = app.clone();
    tauri::async_runtime::spawn(async move {
        let listener = match TcpListener::bind(format!("0.0.0.0:{}", port)).await {
            Ok(l) => l,
            Err(e) => {
                log_event(&app2, format!("ОШИБКА bind на :{} — {}", port, e));
                return;
            }
        };
        log_event(&app2, format!("слушаю 0.0.0.0:{}", port));

        loop {
            match listener.accept().await {
                Ok((stream, peer)) => {
                    log_event(&app2, format!("TCP-подключение от {}", peer));
                    tauri::async_runtime::spawn(handle_client(
                        stream,
                        tx2.clone(),
                        count2.clone(),
                        app2.clone(),
                        peer.to_string(),
                    ));
                }
                Err(e) => log_event(&app2, format!("ошибка accept: {}", e)),
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
    peer: String,
) {
    let ws = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            log_event(&app, format!("ОШИБКА WS-рукопожатия с {}: {}", peer, e));
            return;
        }
    };
    log_event(&app, format!("WS-рукопожатие успешно с {}", peer));

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
                        log_event(&app, format!("← от {}: {}", peer, truncate(&text, 120)));
                        // relay to all other WS clients
                        let _ = tx.send(text.clone().to_string());
                        // deliver to desktop frontend via Tauri event
                        let _ = app.emit("ws-msg", text.as_str());
                    }
                    Some(Ok(Message::Close(frame))) => {
                        log_event(&app, format!("{} закрыл соединение: {:?}", peer, frame));
                        break;
                    }
                    None => {
                        log_event(&app, format!("{} — соединение оборвалось", peer));
                        break;
                    }
                    Some(Err(e)) => {
                        log_event(&app, format!("ошибка чтения от {}: {}", peer, e));
                        break;
                    }
                    Some(Ok(_)) => {} // ping/pong handled by tungstenite
                }
            }
            // ── Broadcast → send to this client ───────────────────
            recv = rx.recv() => {
                match recv {
                    Ok(text) => {
                        if let Err(e) = sink.send(Message::text(text)).await {
                            log_event(&app, format!("ошибка отправки к {}: {}", peer, e));
                            break;
                        }
                    }
                    Err(RecvError::Lagged(n)) => {
                        log_event(&app, format!("{} отстал на {} сообщений", peer, n));
                        continue;
                    }
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
    log_event(&app, format!("{} отключился", peer));
}

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max { s.to_string() } else { format!("{}…", &s[..max]) }
}
