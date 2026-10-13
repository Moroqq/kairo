#!/usr/bin/env bash
#
# Выпускает сертификат Let's Encrypt для доменов Kairo.
#
#   DOMAINS="kairoupdate.duckdns.org kairogoupyrlife.duckdns.org" bash certbot-kairo.sh
#
# Круг, который этот скрипт разрывает: боевой конфиг nginx ссылается на
# файлы сертификата и без них не стартует, а сертификат не выпустить, пока
# ACME-челленджу некуда лечь. Поэтому поднимаем временный HTTP-only vhost,
# выпускаем сертификат и временный vhost убираем.
#
# A-записи доменов должны уже указывать на этот сервер — проверка идёт
# извне по имени.

set -euo pipefail

DOMAINS="${DOMAINS:-}"
CERT_NAME="${CERT_NAME:-}"
WEBROOT="${WEBROOT:-/var/www/html}"
TMP_SITE=/etc/nginx/sites-available/kairo-acme

[[ "$EUID" -eq 0 ]] || { echo "Нужен root" >&2; exit 1; }
[[ -n "$DOMAINS" ]] || { echo 'DOMAINS не задан (см. шапку скрипта)' >&2; exit 1; }

read -r -a DOMAIN_LIST <<< "$DOMAINS"
CERT_NAME="${CERT_NAME:-${DOMAIN_LIST[0]}}"
D_ARGS=(); for d in "${DOMAIN_LIST[@]}"; do D_ARGS+=(-d "$d"); done

# Сверяем, куда смотрят домены: выпуск по имени, которое ведёт не сюда,
# обречён, и лучше сказать об этом до похода в Let's Encrypt.
MYIP="$(curl -s4 --max-time 10 ifconfig.me || true)"
for d in "${DOMAIN_LIST[@]}"; do
  ip="$(getent ahostsv4 "$d" 2>/dev/null | head -1 | awk '{print $1}')"
  if [[ -n "$MYIP" && "$ip" != "$MYIP" ]]; then
    echo "!! $d → ${ip:-не резолвится}, а сервер — $MYIP."
    echo "!! Поправьте A-запись и дождитесь обновления, иначе проверка не пройдёт."
    exit 1
  fi
done

mkdir -p "$WEBROOT"

cleanup() {
  rm -f /etc/nginx/sites-enabled/kairo-acme "$TMP_SITE"
  nginx -t >/dev/null 2>&1 && systemctl reload nginx || true
}
trap cleanup EXIT

cat > "$TMP_SITE" <<EOF
# Временный vhost только под проверку Let's Encrypt. Удаляется скриптом.
server {
    listen      80;
    server_name $DOMAINS;

    location /.well-known/acme-challenge/ { root $WEBROOT; }
    location / { return 404; }
}
EOF

ln -sfn "$TMP_SITE" /etc/nginx/sites-enabled/kairo-acme
nginx -t
systemctl reload nginx

echo "выпускаю сертификат: $DOMAINS"
certbot certonly --webroot -w "$WEBROOT" \
  --cert-name "$CERT_NAME" "${D_ARGS[@]}" \
  --non-interactive --agree-tos --keep-until-expiring \
  ${CERTBOT_EMAIL:+--email "$CERTBOT_EMAIL"} \
  ${CERTBOT_EMAIL:---register-unsafely-without-email}

echo
echo "готово: /etc/letsencrypt/live/$CERT_NAME/"
echo "дальше: bash nginx-install.sh"
