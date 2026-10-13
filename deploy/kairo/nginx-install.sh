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

# Конфиг подключает /etc/letsencrypt/options-ssl-nginx.conf — файл с
# TLS-настройками, который создаёт nginx-плагин certbot. Мы выпускаем
# сертификат режимом --webroot, плагин не задействуется, и файла нет:
# nginx падает с "open() ... failed (2: No such file or directory)".
# Берём его из пакета certbot, а если пакет не найден — пишем тот же
# набор настроек сами.
OPTS=/etc/letsencrypt/options-ssl-nginx.conf
if [[ ! -f "$OPTS" ]]; then
  mkdir -p /etc/letsencrypt
  SRC_OPTS="$(find /usr/lib/python3 /usr/lib/python3.* -name options-ssl-nginx.conf 2>/dev/null | head -1)"
  if [[ -n "$SRC_OPTS" ]]; then
    install -m 644 "$SRC_OPTS" "$OPTS"
    echo "создан $OPTS (из пакета certbot)"
  else
    cat > "$OPTS" <<'TLS'
# Набор TLS-настроек, какой кладёт nginx-плагин certbot.
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-CHACHA20-POLY1305";
TLS
    chmod 644 "$OPTS"
    echo "создан $OPTS (пакет certbot не найден, записан стандартный набор)"
  fi
fi

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

# Ubuntu из коробки кладёт свой сайт по умолчанию, и он объявлен
# default_server. Конфиг Kairo — тоже, и обязан им быть: иначе запросы по
# голому IP и по чужим именам попадут в первый попавшийся блок. Два
# default_server на одном порту nginx не разрешает, поэтому стоковый
# отключаем. Файл в sites-available остаётся — при желании вернётся симлинком.
if [[ -e /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
  echo "отключён стоковый сайт nginx (конфликтовал по default_server)"
fi

[[ -f /etc/nginx/sites-available/kairo ]] && cp /etc/nginx/sites-available/kairo /root/kairo-nginx.bak
install -m 644 "$SRC" /etc/nginx/sites-available/kairo

# Симлинк снимаем, если проверка не прошла. Иначе битый конфиг остаётся в
# sites-enabled и роняет КАЖДЫЙ последующий `nginx -t` — в том числе внутри
# certbot, который после этого не может даже выпустить сертификат.
WAS_ENABLED=0
[[ -e /etc/nginx/sites-enabled/kairo ]] && WAS_ENABLED=1
rollback() {
  [[ "$WAS_ENABLED" -eq 1 ]] || rm -f /etc/nginx/sites-enabled/kairo
  echo "конфиг не прошёл проверку — симлинк снят, nginx остался на прежнем" >&2
}
ln -sfn /etc/nginx/sites-available/kairo /etc/nginx/sites-enabled/kairo

# nginx -t проверяет весь конфиг: если он падает, виноват может быть и
# сайт ObserV — не перезагружаем, чтобы не уронить заодно его.
trap rollback ERR
nginx -t
trap - ERR
systemctl reload nginx

echo "nginx: конфиг Kairo установлен"
echo
echo "проверка снаружи:"
grep -oP '(?<=server_name\s).*(?=;)' "$SRC" | tr ' ' '\n' | sort -u | grep -v default_server |
  while read -r d; do [[ -n "$d" ]] && echo "  curl -s https://$d/health"; done
