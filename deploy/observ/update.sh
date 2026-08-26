#!/usr/bin/env bash
#
# Выкатка новой версии сайта. Запускать от root:  bash update.sh
#
# Сборка идёт поверх работающего .next, поэтому на 10–20 секунд между
# концом сборки и рестартом старые вкладки могут получить 404 на чанки
# (Next разрешает это перезагрузкой страницы). Для лендинга приемлемо;
# если понадобится ноль даунтайма — переезжать на two-slot деплой.

set -euo pipefail

ROOT=/opt/observ
APP="$ROOT/app"
BRANCH="${BRANCH:-main}"

[[ "$EUID" -eq 0 ]] || { echo "Нужен root" >&2; exit 1; }
[[ -d "$APP/.git" ]] || { echo "$APP не установлен, запустите install.sh" >&2; exit 1; }

BEFORE="$(git -C "$APP" rev-parse --short HEAD)"

sudo -u observ git -C "$APP" fetch --prune origin "$BRANCH"
sudo -u observ git -C "$APP" reset --hard "origin/$BRANCH"

AFTER="$(git -C "$APP" rev-parse --short HEAD)"
echo "код: $BEFORE → $AFTER"

sudo -u observ env npm_config_cache="$ROOT/.npm" npm --prefix "$APP" ci
sudo -u observ env npm_config_cache="$ROOT/.npm" NODE_OPTIONS=--max-old-space-size=1024 \
  npm --prefix "$APP" run build

systemctl restart observ

echo -n "проверка "
for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ru || true)"
  if [[ "$code" == "200" ]]; then echo; echo "ок, $AFTER выкачен"; exit 0; fi
  echo -n .
  sleep 2
done

echo
echo "после рестарта нет 200 (код: ${code:-нет}). Откат:" >&2
echo "  sudo -u observ git -C $APP reset --hard $BEFORE && bash $0" >&2
journalctl -u observ -n 40 --no-pager >&2
exit 1
