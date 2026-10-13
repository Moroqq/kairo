#!/usr/bin/env bash
#
# Подготовка чистого сервера под Kairo и сайт ObserV.
# Запускать от root на свежем Ubuntu:  bash bootstrap.sh
#
# На голом образе может не быть git — тогда сам этот файл сначала нечем
# забрать. Лечится до клонирования:
#   apt-get update -qq && apt-get install -y -qq git
#
# Ставит общее для обоих проектов: nginx, certbot, Node 22, sqlite3, ufw,
# swap. Сами проекты разворачиваются потом — deploy/kairo/install.sh и
# deploy/observ/install.sh.
#
# Идемпотентен: повторный запуск ничего не ломает.

set -euo pipefail
[[ "$EUID" -eq 0 ]] || { echo "Нужен root" >&2; exit 1; }

export DEBIAN_FRONTEND=noninteractive

echo "── пакеты ───────────────────────────────────────────────────────────"
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg git sqlite3 ufw nginx \
                       certbot python3-certbot-nginx unattended-upgrades

# ── Node 22 ──────────────────────────────────────────────────────────────
# Бэкенд Kairo использует node:sqlite — он появился в Node 22, на 20-й
# сборка стартует и падает на первом же обращении к базе.
NODE_MAJOR="$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/' || true)"
if [[ -z "$NODE_MAJOR" || "$NODE_MAJOR" -lt 22 ]]; then
  echo "── Node 22 ──────────────────────────────────────────────────────────"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
echo "node $(node -v), npm $(npm -v)"

# ── swap ─────────────────────────────────────────────────────────────────
# На 2 ГБ RAM сборка Next (сайт) уходит в своп; без него её убивает OOM.
if ! swapon --show | grep -q .; then
  echo "── swap 2G ──────────────────────────────────────────────────────────"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
free -h | head -2

# ── firewall ─────────────────────────────────────────────────────────────
# Порты приложений (8787, 3000, 1080) наружу не открываем — они на loopback.
echo "── ufw ──────────────────────────────────────────────────────────────"
ufw allow 22/tcp  >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
ufw status

# ── автообновления безопасности ──────────────────────────────────────────
dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null 2>&1 || true

systemctl enable --now nginx >/dev/null 2>&1 || true

echo
echo "готово. Дальше:"
echo "  bash deploy/kairo/install.sh     — бэкенд Kairo"
echo "  bash deploy/observ/install.sh    — сайт ObserV"
