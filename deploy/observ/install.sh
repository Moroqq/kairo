#!/usr/bin/env bash
#
# Первая установка сайта ObserV на VPS с kairo (193.233.48.36).
# Запускать от root:  bash install.sh
#
# Идемпотентен: повторный запуск обновит код и пересоберёт. Секреты
# в /etc/observ.env не перезаписываются.
#
# nginx и TLS этот скрипт НЕ трогает — они отдельно, см. render-nginx.sh
# и README (порядок: сначала install.sh, потом сертификат, потом nginx).

set -euo pipefail

REPO="${REPO:-https://github.com/Moroqq/observ}"
BRANCH="${BRANCH:-main}"
ROOT=/opt/observ
APP="$ROOT/app"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$EUID" -eq 0 ]] || { echo "Нужен root" >&2; exit 1; }

# ── Node ─────────────────────────────────────────────────────────────────────
# Next 16 требует Node >= 20.9. На сервере стоит 22.x для kairo — переиспользуем.
NODE_MAJOR="$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/')"
if [[ -z "$NODE_MAJOR" || "$NODE_MAJOR" -lt 20 ]]; then
  echo "Нужен Node >= 20.9, найдено: $(node -v 2>/dev/null || echo 'нет')" >&2
  exit 1
fi

# ── Пользователь ─────────────────────────────────────────────────────────────
if ! id -u observ >/dev/null 2>&1; then
  useradd --system --home-dir "$ROOT" --shell /usr/sbin/nologin observ
  echo "создан пользователь observ"
fi
mkdir -p "$ROOT"
chown observ:observ "$ROOT"

# ── Код ──────────────────────────────────────────────────────────────────────
if [[ -d "$APP/.git" ]]; then
  echo "обновляю код в $APP"
  sudo -u observ git -C "$APP" fetch --prune origin "$BRANCH"
  sudo -u observ git -C "$APP" reset --hard "origin/$BRANCH"
else
  echo "клонирую $REPO → $APP"
  sudo -u observ git clone --branch "$BRANCH" "$REPO" "$APP"
fi

# ── Секреты ──────────────────────────────────────────────────────────────────
if [[ ! -f /etc/observ.env ]]; then
  install -m 640 -o root -g observ "$HERE/observ.env.example" /etc/observ.env
  echo
  echo "!! Создан /etc/observ.env с пустыми значениями."
  echo "!! Заполните TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID / TELEGRAM_WEBHOOK_SECRET"
  echo "!! до старта сервиса, иначе форма заявки будет отдавать 500."
  echo
else
  # Права могли разъехаться при ручной правке.
  chown root:observ /etc/observ.env
  chmod 640 /etc/observ.env
fi

# ── Сборка ───────────────────────────────────────────────────────────────────
# devDependencies нужны: сборку тянут typescript, tailwind, postcss.
# 1 vCPU / 1.9 ГБ — ограничиваем кучу V8, чтобы сборка ушла в swap,
# а не под OOM-killer.
echo "npm ci (это надолго — один vCPU)"
sudo -u observ env npm_config_cache="$ROOT/.npm" npm --prefix "$APP" ci

echo "next build"
sudo -u observ env npm_config_cache="$ROOT/.npm" NODE_OPTIONS=--max-old-space-size=1024 \
  npm --prefix "$APP" run build

# ── systemd ──────────────────────────────────────────────────────────────────
install -m 644 "$HERE/observ.service" /etc/systemd/system/observ.service
systemctl daemon-reload
systemctl enable observ
systemctl restart observ

# ── Проверка ─────────────────────────────────────────────────────────────────
echo -n "жду ответа на 127.0.0.1:3000 "
for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ru || true)"
  if [[ "$code" == "200" ]]; then
    echo
    echo "готово: http://127.0.0.1:3000/ru → 200"
    echo "дальше — TLS и nginx, см. README"
    exit 0
  fi
  echo -n .
  sleep 2
done

echo
echo "сервис не ответил 200 (последний код: ${code:-нет}). Логи:" >&2
journalctl -u observ -n 40 --no-pager >&2
exit 1
