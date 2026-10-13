#!/usr/bin/env bash
#
# Установка sync-бэкенда Kairo. Запускать от root: bash install.sh
#
# Идемпотентен: повторный запуск обновит код и пересоберёт. Секреты в
# /etc/kairo.env и база не трогаются.
#
# nginx и TLS этот скрипт НЕ настраивает — порядок такой:
#   1) bootstrap.sh         общие пакеты
#   2) install.sh           (этот) бэкенд на 127.0.0.1:8787
#   3) certbot-kairo.sh     сертификат
#   4) nginx-install.sh     боевой конфиг
# Конфиг nginx ссылается на файлы сертификата, поэтому поставить его
# раньше шага 3 нельзя — nginx не стартует.

set -euo pipefail

REPO="${REPO:-https://github.com/Moroqq/kairo}"
BRANCH="${BRANCH:-main}"
APP=/opt/kairo-server
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$EUID" -eq 0 ]] || { echo "Нужен root" >&2; exit 1; }

# ── Node ─────────────────────────────────────────────────────────────────
NODE_MAJOR="$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/' || true)"
[[ -n "$NODE_MAJOR" && "$NODE_MAJOR" -ge 22 ]] || {
  echo "Нужен Node >= 22 (бэкенд использует node:sqlite), найдено: $(node -v 2>/dev/null || echo 'нет')." >&2
  echo "Запустите сначала deploy/bootstrap.sh" >&2
  exit 1
}
command -v sqlite3 >/dev/null || { echo "Нет sqlite3 — запустите deploy/bootstrap.sh" >&2; exit 1; }

# ── Пользователь ─────────────────────────────────────────────────────────
if ! id -u kairo >/dev/null 2>&1; then
  useradd --system --home-dir "$APP" --shell /usr/sbin/nologin kairo
  echo "создан пользователь kairo"
fi

# ── Код ──────────────────────────────────────────────────────────────────
if [[ -d "$APP/.git" ]]; then
  echo "обновляю код в $APP"
  # Боевой клон уже ловил локальные правки прямо на сервере — показываем их,
  # прежде чем снести, чтобы они не исчезли молча.
  if ! sudo -u kairo git -C "$APP" diff --quiet; then
    echo
    echo "!! В $APP есть несохранённые правки — они будут потеряны:"
    sudo -u kairo git -C "$APP" status --short
    echo "!! Прервано. Перенесите их в репозиторий или отбросьте вручную."
    exit 1
  fi
  sudo -u kairo git -C "$APP" fetch --prune origin "$BRANCH"
  sudo -u kairo git -C "$APP" reset --hard "origin/$BRANCH"
else
  echo "клонирую $REPO → $APP"
  mkdir -p "$APP"
  chown kairo:kairo "$APP"
  sudo -u kairo git clone --branch "$BRANCH" "$REPO" "$APP"
fi

install -d -o kairo -g kairo "$APP/server/data" "$APP/server/updates"

# ── Секреты ──────────────────────────────────────────────────────────────
if [[ ! -f /etc/kairo.env ]]; then
  install -m 640 -o root -g kairo "$HERE/kairo.env.example" /etc/kairo.env
  echo
  echo "!! Создан /etc/kairo.env с пустыми значениями."
  echo "!! Без GROQ_API_KEY и OPENROUTER_API_KEY синк работает, но ИИ-функции нет."
  echo
else
  chown root:kairo /etc/kairo.env
  chmod 640 /etc/kairo.env
fi

# ── Сборка ───────────────────────────────────────────────────────────────
echo "сборка бэкенда"
sudo -u kairo env npm_config_cache="$APP/.npm" npm --prefix "$APP/server" ci --include=dev
sudo -u kairo env npm_config_cache="$APP/.npm" npm --prefix "$APP/server" run build

# ── systemd ──────────────────────────────────────────────────────────────
install -m 644 "$HERE/kairo-server.service" /etc/systemd/system/kairo-server.service
systemctl daemon-reload
systemctl enable kairo-server
systemctl restart kairo-server

# ── Бэкапы ───────────────────────────────────────────────────────────────
install -m 755 "$HERE/kairo-backup.sh" /usr/local/bin/kairo-backup.sh
cat > /etc/cron.d/kairo-backup <<'CRON'
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
17 3 * * * root /usr/local/bin/kairo-backup.sh >> /var/log/kairo-backup.log 2>&1
CRON
chmod 644 /etc/cron.d/kairo-backup

# ── Проверка ─────────────────────────────────────────────────────────────
echo -n "жду ответа на 127.0.0.1:8787 "
for _ in $(seq 1 30); do
  if [[ "$(curl -s --max-time 3 http://127.0.0.1:8787/health || true)" == *'"ok":true'* ]]; then
    echo
    echo "готово: /health → ok"
    echo "дальше: bash certbot-kairo.sh, затем bash nginx-install.sh"
    exit 0
  fi
  echo -n .
  sleep 2
done

echo
echo "бэкенд не ответил. Логи:" >&2
journalctl -u kairo-server -n 40 --no-pager >&2
exit 1
