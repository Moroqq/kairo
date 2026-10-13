#!/usr/bin/env bash
#
# Ставит боевой конфиг nginx для Kairo. Запускать от root после того, как
# сертификат выпущен: bash nginx-install.sh
#
# Конфиг не пишется здесь, а берётся из репозитория
# (server/nginx.example.conf) — он единственный источник правды и лежит
# рядом с кодом намеренно: раздача /update/* и проксирование /sync раньше
# жили только на сервере и дважды оказывались точкой отказа.

set -euo pipefail

APP=/opt/kairo-server
SRC="$APP/server/nginx.example.conf"

[[ "$EUID" -eq 0 ]] || { echo "Нужен root" >&2; exit 1; }
[[ -f "$SRC" ]] || { echo "Нет $SRC — сначала install.sh" >&2; exit 1; }

# Мап нужен для WebSocket: без $connection_upgrade синк молчит, хотя
# /health отвечает.
cat > /etc/nginx/conf.d/websocket-map.conf <<'MAP'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
MAP

# Конфиг ссылается на сертификаты по именам доменов: если какого-то нет,
# nginx не стартует. Проверяем до записи, иначе уроним и сайт ObserV.
missing=0
while read -r cert; do
  [[ -f "$cert" ]] || { echo "нет файла сертификата: $cert"; missing=1; }
done < <(grep -oP '(?<=ssl_certificate\s)\S+;' "$SRC" | tr -d ';' | sort -u)
if [[ "$missing" -eq 1 ]]; then
  echo "Сначала выпустите сертификаты: bash certbot-kairo.sh" >&2
  exit 1
fi

[[ -f /etc/nginx/sites-available/kairo ]] && cp /etc/nginx/sites-available/kairo /root/kairo-nginx.bak
install -m 644 "$SRC" /etc/nginx/sites-available/kairo
ln -sfn /etc/nginx/sites-available/kairo /etc/nginx/sites-enabled/kairo

# nginx -t проверяет весь конфиг: если он падает, виноват может быть и
# сайт ObserV — не перезагружаем, чтобы не уронить заодно его.
nginx -t
systemctl reload nginx

echo "nginx: конфиг Kairo установлен"
echo
echo "проверка снаружи:"
grep -oP '(?<=server_name\s).*(?=;)' "$SRC" | tr ' ' '\n' | sort -u | grep -v default_server |
  while read -r d; do [[ -n "$d" ]] && echo "  curl -s https://$d/health"; done
