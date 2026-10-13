#!/usr/bin/env bash
#
# Рендерит vhost ObserV из шаблона и (по желанию) ставит его в nginx.
#
#   DOMAINS="observ.team www.observ.team observ.ru www.observ.ru" \
#   CERT=/etc/ssl/observ/origin.pem \
#   KEY=/etc/ssl/observ/origin.key \
#   ./render-nginx.sh --install
#
# Первый домен в DOMAINS считается основным: именно его Origin ждёт
# /api/lead, поэтому у всех остальных Origin подменяется на него.
# Без --install конфиг просто печатается в stdout — удобно посмотреть,
# что получится, до записи в /etc/nginx.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$HERE/nginx/observ.conf.template"

DOMAINS="${DOMAINS:-}"
CERT="${CERT:-/etc/ssl/observ/origin.pem}"
KEY="${KEY:-/etc/ssl/observ/origin.key}"
INSTALL=0
[[ "${1:-}" == "--install" ]] && INSTALL=1

# На хосте без IPv6 директива listen [::]: роняет весь `nginx -t` — а это
# заблокировало бы и reload для kairo. Поэтому определяем поддержку на месте;
# принудительно: IPV6=1 или IPV6=0.
if [[ -z "${IPV6:-}" ]]; then
  [[ -f /proc/net/if_inet6 ]] && IPV6=1 || IPV6=0
fi
if [[ "$IPV6" == "1" ]]; then
  LISTEN_80_V6="    listen [::]:80;"
  LISTEN_443_V6="    listen [::]:443 ssl http2;"
else
  NOTE="# у хоста нет IPv6 (см. render-nginx.sh)"
  LISTEN_80_V6="    # listen [::]:80;            $NOTE"
  LISTEN_443_V6="    # listen [::]:443 ssl http2; $NOTE"
fi

if [[ -z "$DOMAINS" ]]; then
  echo "DOMAINS не задан. Пример:" >&2
  echo '  DOMAINS="observ.team www.observ.team observ.ru" ./render-nginx.sh' >&2
  exit 1
fi

read -r -a DOMAIN_LIST <<< "$DOMAINS"
PRIMARY="${DOMAIN_LIST[0]}"
PRIMARY_ORIGIN="https://$PRIMARY"

# ── map подмены Origin ───────────────────────────────────────────────────────
# default $http_origin — чужие сайты по-прежнему получают 403 от приложения.
# www основного домена уже в белом списке кода, но подменять его безвредно.
ORIGIN_MAP="map \$http_origin \$observ_origin {"
ORIGIN_MAP+=$'\n    default $http_origin;'
for d in "${DOMAIN_LIST[@]:1}"; do
  ORIGIN_MAP+=$'\n'"    \"https://$d\" \"$PRIMARY_ORIGIN\";"
done
ORIGIN_MAP+=$'\n}'

RENDERED="$(
  awk -v names="$DOMAINS" -v cert="$CERT" -v key="$KEY" -v map="$ORIGIN_MAP" \
      -v l80="$LISTEN_80_V6" -v l443="$LISTEN_443_V6" '
    { gsub(/__SERVER_NAMES__/, names); gsub(/__CERT__/, cert);
      gsub(/__KEY__/, key); gsub(/__ORIGIN_MAP__/, map);
      gsub(/__LISTEN_80_V6__/, l80); gsub(/__LISTEN_443_V6__/, l443); print }
  ' "$TEMPLATE"
)"

if [[ "$INSTALL" -eq 0 ]]; then
  printf '%s\n' "$RENDERED"
  exit 0
fi

[[ "$EUID" -eq 0 ]] || { echo "--install требует root" >&2; exit 1; }

for f in "$CERT" "$KEY"; do
  [[ -f "$f" ]] || { echo "Нет файла сертификата: $f (см. README, шаг про TLS)" >&2; exit 1; }
done

printf '%s\n' "$RENDERED" > /etc/nginx/sites-available/observ

# Снимаем симлинк, если проверка не прошла: иначе битый конфиг остаётся в
# sites-enabled и роняет каждый последующий `nginx -t`, включая certbot.
WAS_ENABLED=0
[[ -e /etc/nginx/sites-enabled/observ ]] && WAS_ENABLED=1
rollback() {
  [[ "$WAS_ENABLED" -eq 1 ]] || rm -f /etc/nginx/sites-enabled/observ
  echo "конфиг не прошёл проверку — симлинк снят, nginx остался на прежнем" >&2
}
trap rollback ERR
ln -sfn /etc/nginx/sites-available/observ /etc/nginx/sites-enabled/observ
install -m 644 "$HERE/nginx/cloudflare-realip.conf" /etc/nginx/conf.d/cloudflare-realip.conf

# nginx -t проверяет ВЕСЬ конфиг: если он падает, значит сломан не только
# наш файл — не перезагружаем, чтобы не уронить заодно kairo.
nginx -t
trap - ERR
systemctl reload nginx

echo "nginx: vhost observ установлен, домены: $DOMAINS"
