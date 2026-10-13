#!/usr/bin/env bash
#
# Выкатка новой версии бэкенда. Запускать от root: bash update.sh

set -euo pipefail

APP=/opt/kairo-server
BRANCH="${BRANCH:-main}"

[[ "$EUID" -eq 0 ]] || { echo "Нужен root" >&2; exit 1; }
[[ -d "$APP/.git" ]] || { echo "$APP не установлен, запустите install.sh" >&2; exit 1; }

if ! sudo -u kairo git -C "$APP" diff --quiet; then
  echo "!! В $APP есть несохранённые правки:"
  sudo -u kairo git -C "$APP" status --short
  echo "!! Прервано: перенесите их в репозиторий или отбросьте вручную."
  exit 1
fi

BEFORE="$(git -C "$APP" rev-parse --short HEAD)"
sudo -u kairo git -C "$APP" fetch --prune origin "$BRANCH"
sudo -u kairo git -C "$APP" reset --hard "origin/$BRANCH"
AFTER="$(git -C "$APP" rev-parse --short HEAD)"
echo "код: $BEFORE → $AFTER"

sudo -u kairo env npm_config_cache="$APP/.npm" npm --prefix "$APP/server" ci --include=dev
sudo -u kairo env npm_config_cache="$APP/.npm" npm --prefix "$APP/server" run build

systemctl restart kairo-server

echo -n "проверка "
for _ in $(seq 1 30); do
  if [[ "$(curl -s --max-time 3 http://127.0.0.1:8787/health || true)" == *'"ok":true'* ]]; then
    echo; echo "ок, $AFTER выкачен"; exit 0
  fi
  echo -n .; sleep 2
done

echo
echo "после рестарта нет ok. Откат:" >&2
echo "  sudo -u kairo git -C $APP reset --hard $BEFORE && bash $0" >&2
journalctl -u kairo-server -n 40 --no-pager >&2
exit 1
