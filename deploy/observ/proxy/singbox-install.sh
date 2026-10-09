#!/usr/bin/env bash
#
# Поднимает sing-box как локальный SOCKS5-прокси на 127.0.0.1:1080.
# Нужен только если api.telegram.org с сервера недоступен напрямую —
# тогда через него ходят заявки с сайта и бот.
#
#   VLESS_URL='vless://uuid@host:443?security=reality&...' bash singbox-install.sh
#
# Ссылку берут из подписки:
#   curl -s "<адрес подписки>" | base64 -d
# и выбирают строку с security=reality (обычно первая).
#
# Ключи из ссылки попадают только в /etc/sing-box/config.json (chmod 600).
# В репозитории их нет и быть не должно.

set -euo pipefail

VLESS_URL="${VLESS_URL:-}"
PORT="${PORT:-1080}"
CONF_DIR=/etc/sing-box

[[ "$EUID" -eq 0 ]] || { echo "Нужен root" >&2; exit 1; }
[[ -n "$VLESS_URL" ]] || { echo "VLESS_URL не задан (см. шапку скрипта)" >&2; exit 1; }
[[ "$VLESS_URL" == vless://* ]] || { echo "VLESS_URL должен начинаться с vless://" >&2; exit 1; }

# ── Разбор ссылки ────────────────────────────────────────────────────────────
rest="${VLESS_URL#vless://}"
uuid="${rest%%@*}"
tail_="${rest#*@}"
hostport="${tail_%%\?*}"
query="${tail_#*\?}"; query="${query%%#*}"
host="${hostport%%:*}"
port="${hostport##*:}"

param() {
  printf '%s' "$query" | tr '&' '\n' |
    awk -F= -v k="$1" '$1==k { print substr($0, length(k)+2); exit }'
}

security="$(param security)"
flow="$(param flow)"
sni="$(param sni)"
fp="$(param fp)"
pbk="$(param pbk)"
sid="$(param sid)"

[[ "$security" == "reality" ]] || {
  echo "Поддерживается только security=reality, в ссылке: '${security:-нет}'." >&2
  echo "Возьмите из подписки другую строку — ту, где security=reality." >&2
  exit 1
}
[[ -n "$pbk" ]] || { echo "В ссылке нет pbk — она обрезана. Возьмите полную." >&2; exit 1; }

echo "узел: $host:$port, sni=${sni:-$host}, fp=${fp:-chrome}"

# ── Установка бинарника ──────────────────────────────────────────────────────
if ! command -v sing-box >/dev/null 2>&1; then
  case "$(uname -m)" in
    x86_64)  arch=amd64 ;;
    aarch64) arch=arm64 ;;
    *) echo "неизвестная архитектура: $(uname -m)" >&2; exit 1 ;;
  esac

  # Версию берём из GitHub API. Если он недоступен (бывает на серверах
  # с ограниченным исходящим доступом) — задайте её руками: SB_VERSION=1.10.7
  ver="${SB_VERSION:-}"
  if [[ -z "$ver" ]]; then
    ver="$(curl -fsSL --max-time 20 https://api.github.com/repos/SagerNet/sing-box/releases/latest 2>/dev/null |
           sed -n 's/.*"tag_name": *"v\([^"]*\)".*/\1/p' | head -1)" || true
  fi
  [[ -n "$ver" ]] || {
    echo "не удалось узнать версию sing-box (api.github.com недоступен?)." >&2
    echo "Посмотрите последнюю на github.com/SagerNet/sing-box/releases и повторите:" >&2
    echo "  SB_VERSION=1.10.7 VLESS_URL='...' bash \$0" >&2
    exit 1
  }

  echo "ставлю sing-box $ver ($arch)"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  curl -fsSL "https://github.com/SagerNet/sing-box/releases/download/v${ver}/sing-box-${ver}-linux-${arch}.tar.gz" \
    -o "$tmp/sb.tar.gz"
  tar -xzf "$tmp/sb.tar.gz" -C "$tmp"
  install -m 755 "$tmp"/sing-box-*/sing-box /usr/local/bin/sing-box
fi

sing-box version | head -1

# ── Конфиг ───────────────────────────────────────────────────────────────────
install -d -m 700 "$CONF_DIR"
umask 077
cat > "$CONF_DIR/config.json" <<EOF
{
  "log": { "level": "warn", "timestamp": true },
  "inbounds": [
    {
      "type": "socks",
      "tag": "socks-in",
      "listen": "127.0.0.1",
      "listen_port": $PORT
    }
  ],
  "outbounds": [
    {
      "type": "vless",
      "tag": "proxy",
      "server": "$host",
      "server_port": $port,
      "uuid": "$uuid",
      "flow": "${flow:-xtls-rprx-vision}",
      "tls": {
        "enabled": true,
        "server_name": "${sni:-$host}",
        "utls": { "enabled": true, "fingerprint": "${fp:-chrome}" },
        "reality": {
          "enabled": true,
          "public_key": "$pbk",
          "short_id": "$sid"
        }
      }
    }
  ]
}
EOF
chmod 600 "$CONF_DIR/config.json"

sing-box check -c "$CONF_DIR/config.json"

# ── systemd ──────────────────────────────────────────────────────────────────
cat > /etc/systemd/system/sing-box.service <<'EOF'
[Unit]
Description=sing-box (локальный SOCKS5 для обхода блокировок)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sing-box run -c /etc/sing-box/config.json
Restart=on-failure
RestartSec=5

# Прокси нужен только локальным сервисам, наружу не слушает.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadOnlyPaths=/etc/sing-box
MemoryHigh=128M

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sing-box
systemctl restart sing-box

# ── Проверка ─────────────────────────────────────────────────────────────────
echo -n "жду порт $PORT "
for _ in $(seq 1 15); do
  ss -tln | grep -q "127.0.0.1:$PORT" && break
  echo -n .; sleep 1
done
echo

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
        --proxy "socks5h://127.0.0.1:$PORT" https://api.telegram.org/ || true)"
echo "api.telegram.org через прокси → ${code:-нет ответа}"

if [[ "$code" == "000" || -z "$code" ]]; then
  echo "прокси не работает. Логи: journalctl -u sing-box -n 30 --no-pager" >&2
  exit 1
fi

echo
echo "готово. В /etc/observ.env пропишите:"
echo "  PROXY_URL=socks5://127.0.0.1:$PORT"
echo "и выполните: systemctl restart observ"
