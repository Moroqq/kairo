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

## Клиент — прогресс миграции

### Готово

- Клиент читает `VITE_KAIRO_SERVER_URL` в `src/lib/account.ts` и
  `src/services/vps-sync.service.ts`. Прод-URL прописан в `.env.production`
  (закоммичен) и в локальном `.env.local` (gitignore, только на машине сборки).
- **Десктоп-бандл собран:**
  - `src-tauri\target\release\bundle\nsis\Kairo_0.4.1_x64-setup.exe` (NSIS)
  - `src-tauri\target\release\bundle\msi\Kairo_0.4.1_x64_en-US.msi` (MSI)
  - На машине пользователя установлен.

### Точка остановки (2026-07-21)

Пользователь хочет **не потерять данные с телефона** при переходе на облако.
Единственный неразрушающий путь — сначала LAN-синк телефон → десктоп, потом
создание облачного аккаунта на десктопе (пушит данные в VPS), потом только
переустановка APK на телефоне.

**Затык:** LAN-синк не соединяется. Телефон стучится в `ws://192.168.1.130:8765`
(это правильный IP десктопа), но получает `code=1006` мгновенно. Локально с ПК
`Test-NetConnection 192.168.1.130 -Port 8765` = True — то есть сервер жив,
файрвол-правило `Kairo LAN Sync` включено, порт слушает. Значит соединение
режется где-то между устройствами: VPN на телефоне / другая Wi-Fi сеть /
AP isolation роутера / нативный брандмауэр телефона.

USB-tethering отмели — пользователь уже пробовал, много боли.

### Следующие шаги (когда сессия возобновится)

1. **Разобраться, почему phone → PC на 192.168.1.130:8765 не проходит.**
   Проверить в такой последовательности:
   - Полностью отключить VPN на телефоне (системный тумблер, не в приложении).
   - Убедиться, что телефон и ПК на одной Wi-Fi (тот же SSID, не гостевая).
   - Открыть на телефоне в браузере `http://192.168.1.130:8765` — если не
     резолвит вообще, значит TCP заблокирован (AP isolation роутера или
     firewall телефона).
2. Как только LAN-синк заходит — телефон пушит данные на десктоп.
3. На десктопе — создать облачный аккаунт (кнопка на `LanSyncPage`),
   **записать 12 слов recovery** на бумагу.
4. Проверить логи VPS (`journalctl -u kairo-server -n 50` через SSH), что
   аккаунт создался и данные пушнулись.
5. Пересобрать Android APK (`npm run tauri -- android build --apk`).
   Разобраться с подписью (в `build.gradle.kts` нет `signingConfig`, старый
   `kairo.apk` в репо, вероятно, подписывался вручную через `apksigner` —
   проверить сигнатуру старого APK: `apksigner verify --print-certs kairo.apk`,
   сделать так же для нового).
6. Залить новый APK на VPS через SFTP, добавить временный nginx-location
   `/kairo.apk` с `Content-Type: application/vnd.android.package-archive`.
7. С телефона скачать по URL `https://kairogoupyrlife.duckdns.org/kairo.apk`,
   поставить (если подпись совпала — в один клик обновится, если нет —
   переустановка со стиранием, но данные уже в облаке).
8. На телефоне после установки → сгенерировать QR парности на десктопе →
   отсканировать на телефоне → облако скачает данные обратно.

### Заблокировано на пользователе (осталось)

1. **Стек Delta**: язык, зависимости, порт, где брать код.
2. Восстановление LAN-синка (см. выше) — или альтернативный путь миграции
   данных телефона.

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
