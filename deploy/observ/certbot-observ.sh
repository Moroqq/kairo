#!/usr/bin/env bash
#
# Выпускает сертификат Let's Encrypt для доменов ObserV.
#
#   DOMAINS="observ.team www.observ.team observ.space ..." bash certbot-observ.sh
#
# Зачем отдельный скрипт: боевой vhost нельзя поставить до того, как есть
# сертификат (nginx не стартует без файла), а сертификат нельзя выпустить,
# пока ACME-челлендж некуда положить. Скрипт разрывает этот круг: поднимает
# временный HTTP-only vhost только под /.well-known, выпускает сертификат
# и временный vhost убирает.
#
# ВАЖНО: на время выпуска все домены должны быть в Cloudflare серыми
# (DNS only). При оранжевом облаке CF редиректит челлендж на HTTPS, а
# валидного сертификата на origin ещё нет — проверка не пройдёт.
# После выпуска облако можно включать обратно.

set -euo pipefail

DOMAINS="${DOMAINS:-}"
CERT_NAME="${CERT_NAME:-observ}"
WEBROOT="${WEBROOT:-/var/www/html}"
TMP_SITE=/etc/nginx/sites-available/observ-acme

[[ "$EUID" -eq 0 ]] || { echo "Нужен root" >&2; exit 1; }
[[ -n "$DOMAINS" ]] || { echo 'DOMAINS не задан' >&2; exit 1; }

read -r -a DOMAIN_LIST <<< "$DOMAINS"
D_ARGS=()
for d in "${DOMAIN_LIST[@]}"; do D_ARGS+=(-d "$d"); done

mkdir -p "$WEBROOT"

# Временный vhost убираем в любом случае — даже если certbot упадёт,
# иначе он останется перехватывать домены с пустым 404.
cleanup() {
  rm -f /etc/nginx/sites-enabled/observ-acme "$TMP_SITE"
  nginx -t >/dev/null 2>&1 && systemctl reload nginx || true
}
trap cleanup EXIT

cat > "$TMP_SITE" <<EOF
# Временный vhost: только для проверки Let's Encrypt. Удаляется скриптом.
server {
    listen      80;
    server_name $DOMAINS;

    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    location / {
        return 404;
    }
}
EOF

ln -sfn "$TMP_SITE" /etc/nginx/sites-enabled/observ-acme
nginx -t
systemctl reload nginx

echo "выпускаю сертификат для: $DOMAINS"
certbot certonly --webroot -w "$WEBROOT" \
  --cert-name "$CERT_NAME" \
  "${D_ARGS[@]}" \
  --non-interactive --agree-tos --keep-until-expiring

echo
echo "готово. Пути для render-nginx.sh:"
echo "  CERT=/etc/letsencrypt/live/$CERT_NAME/fullchain.pem"
echo "  KEY=/etc/letsencrypt/live/$CERT_NAME/privkey.pem"
