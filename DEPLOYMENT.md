# Kairo VPS sync backend — deployment

Живой handoff-документ. Обновляется по ходу работы, чтобы продолжить с другого
устройства или в новой сессии.

## Статус

Kairo — **полностью развёрнут и доступен из интернета:**
`https://kairogoupyrlife.duckdns.org` (HTTPS через Let's Encrypt, `/health` → `{"ok":true}`).

Осталось только: настроить клиент Kairo на этот URL, и — отдельная задача —
подселить сюда второй проект Delta, когда будет ясен его стек.

## Сервер

- IP: `193.233.48.36`
- Хостинг тот же, но это **другой VPS**. Старый (`81.90.31.239`) остаётся под Observ.
- SSH: только по ключу, пароль отключён (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`)
- Юзер: `root`
- ОС: Ubuntu 22.04.5 LTS, kernel 5.15
- 1 vCPU / 1.9 GB RAM / 20 GB NVMe. Плюс swap 2 GB.
- Файервол ufw: разрешены только 22/80/443.
- Unattended-upgrades активен (сервер сам ставит security-патчи ночью).

### Установлено

- nginx 1.18, certbot 1.21, python3-certbot-nginx
- Node.js 22.23.1, npm 10.9.8
- git 2.34, sqlite3
- ufw 0.36

## Что уже поднято

### Kairo sync backend

- Код: `/opt/kairo-server/` (полный клон `github.com/Moroqq/kairo`, `.git` там же — обновление через `git pull`)
- Собранный бэкенд: `/opt/kairo-server/server/dist/index.js`
- Данные (SQLite WAL): `/opt/kairo-server/server/data/kairo.db`
- Systemd-юнит: `/etc/systemd/system/kairo-server.service`
  - User/Group: `kairo`
  - `HOST=127.0.0.1`, `PORT=8787`
  - `NODE_ENV=production`
  - autostart, autorestart on failure
- Проверка: `curl http://127.0.0.1:8787/health` → `{"ok":true}`
- Занимает ~34 МБ RAM в покое.

### Бэкапы

- Скрипт: `/usr/local/bin/kairo-backup.sh` (использует `sqlite3 .backup`, безопасно для WAL)
- Cron: `/etc/cron.d/kairo-backup` — каждый день в 03:17 UTC
- Хранилище: `/opt/kairo-backups/kairo-<STAMP>.db.gz` (chmod 600, root:root)
- Retention: 7 дней (старее удаляется автоматически)
- Лог: `/var/log/kairo-backup.log`

### Публичный URL (Kairo)

- Домен: `kairogoupyrlife.duckdns.org` (DuckDNS, обновление IP ручное через панель)
- TLS: Let's Encrypt, сертификат в `/etc/letsencrypt/live/kairogoupyrlife.duckdns.org/`
- Автопродление: systemd-таймер `snap.certbot.renew` (стандартный certbot setup)
- Nginx site: `/etc/nginx/sites-available/kairo`, симлинк в `sites-enabled`
- WebSocket-мап: `/etc/nginx/conf.d/websocket-map.conf` (нужен для sync-соединений)
- HTTP → HTTPS редирект включён certbot'ом автоматически

## Что осталось

### Заблокировано на пользователе

1. **Стек Delta**: язык, зависимости, порт, где брать код. Без этого Delta-часть не поднять.
2. **Обновить cloud-URL** в клиентском приложении Kairo (mobile/desktop) на
   `https://kairogoupyrlife.duckdns.org`.

## Быстрые команды (для дебага)

```bash
# Статус бэкенда
systemctl status kairo-server

# Логи в реальном времени
journalctl -u kairo-server -f

# Что слушает kairo
ss -tlnp | grep 8787

# Ручной прогон бэкапа
/usr/local/bin/kairo-backup.sh
ls -la /opt/kairo-backups/

# Обновить код Kairo из репо
cd /opt/kairo-server && git pull
cd server && sudo -u kairo npm ci && sudo -u kairo npm run build
systemctl restart kairo-server
```

## Как зайти с НОВОГО устройства

Приватный SSH-ключ есть **только** на исходной Windows-машине
(`%USERPROFILE%\.ssh\id_ed25519`). Пароль по SSH отключён — вход только по ключу.

**Вариант A (рекомендуется) — сгенерировать ещё один ключ:**

1. На новом устройстве: `ssh-keygen -t ed25519 -C "kairo-vps-<имя>"`
2. Показать публичный: Windows `type $env:USERPROFILE\.ssh\id_ed25519.pub`,
   Mac/Linux `cat ~/.ssh/id_ed25519.pub`
3. Дописать эту публичную строку в `/root/.ssh/authorized_keys` на сервере
   (это можно сделать с исходного устройства, где ключ уже работает).

**Вариант B (если пропал доступ ко всем исходным ключам):**

Веб-консоль (VNC) через панель хостера — вход по паролю root. Если пароль тоже
потерян, у хостера кнопка «Сбросить пароль root».

## История

- Изначально начинали ставить как co-host на сервер Observ (`81.90.31.239`) → отказались, взяли отдельный VPS.
- ed25519-ключ на Windows сгенерён один раз, используется для обоих серверов.
- Старый VPS Observ по-прежнему имеет наш ключ в `/root/.ssh/authorized_keys` — если больше не нужен, можно удалить строку с `kairo-vps`.
