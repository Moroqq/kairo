# Kairo VPS sync backend — deployment

Живой handoff-документ. Обновляется по ходу работы, чтобы продолжить с другого
устройства или в новой сессии.

## Статус

Актуальный адрес бэкенда — **`https://kairoupdate.duckdns.org`** (IP `45.151.62.223`).
Клиент переключён на него полностью: и облачный синк, и апдейтер.

Старый домен `kairogoupyrlife.duckdns.org` (указывает на `193.233.48.48`)
больше нигде в коде не используется. Именно его протухшая A-запись и была
общей причиной того, что разом отказали синк и проверка обновлений: обе
функции ходят на один хост.

Сертификат Let's Encrypt на новый домен **выпущен** (2026-08-24, истекает
2026-11-22, автопродление настроено certbot'ом).

> **Не доделано:** `https://kairoupdate.duckdns.org/health` отдаёт **404 от
> nginx**. Причина найдена: `certbot --nginx` не добавил домен в рабочий
> server-блок, а **создал отдельный** — с сертификатом, но без `location /`
> и `proxy_pass`. Бэкенд при этом жив (`curl http://127.0.0.1:8787/health`
> → `{"ok":true}`). См. «Переезд на новый домен» ниже.

> **Осторожно с отключением старого домена.** В сборках до 0.4.8 зашит
> `kairogoupyrlife.duckdns.org` — и как адрес синка, и как endpoint
> апдейтера. Пока установленные приложения не обновятся, другого канала
> доставки у них нет: убьёшь старый домен — они не смогут ни синкаться,
> ни получить обновление, останется только ручная переустановка.

## Сервер

- IP: `45.151.62.223` (hostname `147786`)
- Прежде в этом файле числился `193.233.48.36` — устарело. Старый
  (`81.90.31.239`) остаётся под Observ.
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

- Домен: `kairoupdate.duckdns.org` → `45.151.62.223` (DuckDNS, обновление IP ручное через панель)
- TLS: Let's Encrypt; сертификат на новый домен нужно выпустить (см. ниже)
- Старый домен: `kairogoupyrlife.duckdns.org` → `193.233.48.48`, выведен из
  обращения. Сертификат на него лежит в
  `/etc/letsencrypt/live/kairogoupyrlife.duckdns.org/`
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
7. С телефона скачать по URL `https://kairoupdate.duckdns.org/kairo.apk`,
   поставить (если подпись совпала — в один клик обновится, если нет —
   переустановка со стиранием, но данные уже в облаке).
8. На телефоне после установки → сгенерировать QR парности на десктопе →
   отсканировать на телефоне → облако скачает данные обратно.

### Заблокировано на пользователе (осталось)

1. **Стек Delta**: язык, зависимости, порт, где брать код.
2. Восстановление LAN-синка (см. выше) — или альтернативный путь миграции
   данных телефона.

## Обновления приложения (`/update/latest.json`)

Раньше этот эндпоинт нигде в репозитории не существовал: и
`src-tauri/tauri.conf.json` (`plugins.updater.endpoints`), и ручной
Android-путь в клиенте ходили за `https://<host>/update/latest.json`,
а сам файл предполагался положенным на VPS руками и раздаваемым отдельным
location в nginx. Нигде не задокументированный, он же и был точкой отказа:
клиент показывал `Failed to fetch`, хотя бэкенд был жив.

Теперь маршрут принадлежит бэкенду — `server/src/routes/updates.ts`:

- `GET /update/latest.json` — отдаёт файл из каталога релизов (читает с диска
  на каждый запрос, рестарт не нужен). Если файла нет — 404 с внятным
  текстом, а не молчание.
- `GET /update/<файл>` — отдаёт сборку (APK/установщик) с правильным
  `Content-Type`; для `.apk` это `application/vnd.android.package-archive`,
  без него Android не предложит установку. Имена файлов проверяются
  регуляркой, выход за каталог невозможен.

Каталог релизов: `$KAIRO_UPDATE_DIR`, по умолчанию `server/data/update/`
(в `.gitignore`). Шаблон манифеста — `server/update.example.json`.

### Как выпустить версию

1. Поднять `version` в `package.json` и `src-tauri/tauri.conf.json` (должны совпадать).
2. Собрать: `npm run tauri -- build` и/или `npm run tauri -- android build --apk`.
3. Скопировать артефакты в `/opt/kairo-server/server/data/update/` на VPS.
4. Положить туда же `latest.json` по шаблону: `version`, ссылки в `platforms`,
   для десктопа — `signature` из соответствующего `.sig`.
5. Проверить: `curl -s https://kairoupdate.duckdns.org/update/latest.json`.

> Если перед бэкендом стоит nginx, `/update/` должен проксироваться на
> `127.0.0.1:8787` вместе с остальными маршрутами. Отдельный `location`
> со статикой больше не нужен — но если он остался, он перехватит
> запрос раньше бэкенда, и раздавать будет он.

## Переезд на новый домен (что осталось сделать на сервере)

Клиент уже собирается под `kairoupdate.duckdns.org`. Сертификат выпущен.
Осталось заставить nginx проксировать этот домен на бэкенд.

### Как читать симптом

- **404 от nginx** (в теле ответа видно `nginx/1.18.0 (Ubuntu)`) — запрос
  дошёл до nginx, но попал в server-блок без `proxy_pass`. Проблема в
  `server_name`, бэкенд ни при чём.
- **502 Bad Gateway** — блок правильный, но бэкенд не отвечает:
  `systemctl status kairo-server`.
- **Ошибка TLS / ERR_CONNECTION** — не тот сертификат или домен не резолвится.

### Диагностика

```bash
# какой блок обслуживает домен и куда он проксирует
grep -nE "server_name|listen|proxy_pass|root |location" /etc/nginx/sites-enabled/kairo

# все server_name во всех блоках — ищем, где потерялся kairoupdate
nginx -T 2>/dev/null | grep -n "server_name"

# бэкенд жив? (должно быть {"ok":true})
systemctl status kairo-server --no-pager | head -5
curl -s http://127.0.0.1:8787/health

# проксирует ли старый домен — если да, блок рабочий, дело только в server_name
curl -s -H "Host: kairogoupyrlife.duckdns.org" http://127.0.0.1/health
```

### Что должно быть в конфиге

Эталон лежит в репозитории: **`server/nginx.example.conf`**. Там оба домена,
каждый со своим сертификатом, оба проксируют на `127.0.0.1:8787`, и есть
заголовки `Upgrade`/`Connection` — без них WebSocket `/sync` не поднимется,
хотя `/health` будет отвечать.

Применение (с бэкапом и проверкой до перезагрузки):

```bash
cp /etc/nginx/sites-available/kairo /root/kairo-nginx.bak

# мап для WebSocket — если файла нет, без него nginx -t упадёт
# на "unknown variable connection_upgrade"
test -f /etc/nginx/conf.d/websocket-map.conf || cat > /etc/nginx/conf.d/websocket-map.conf <<'MAP'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
MAP

# сюда вставить содержимое server/nginx.example.conf из репозитория
nano /etc/nginx/sites-available/kairo

nginx -t && systemctl reload nginx     # reload только если тест прошёл

# откат, если что-то пошло не так
# cp /root/kairo-nginx.bak /etc/nginx/sites-available/kairo && nginx -t && systemctl reload nginx
```

Минимальная альтернатива, если не хочется трогать весь файл: дописать
`location / { ... }` (целиком, как в эталоне) внутрь блока
`server_name kairoupdate.duckdns.org;` с `listen 443 ssl` — того самого,
который создал certbot и оставил пустым.

### Проверка

```bash
curl -s  https://kairoupdate.duckdns.org/health            # {"ok":true}
curl -si https://kairoupdate.duckdns.org/update/latest.json | head -1
```

Второй запрос вернёт `404` с телом `{"error":"manifest_not_published"}` —
это **ожидаемо и правильно**: маршрут работает, просто в каталог релизов
ещё не положен `latest.json`. Отличать от `404` со страницей nginx: первый
приходит от бэкенда (JSON), второй — от nginx (HTML).

Синк проверяется только настоящим клиентом: `/health` отвечает и при
сломанном WebSocket, поэтому после правки конфига обязательно открой
экран SYNC в приложении — он теперь показывает реальный статус.

### Порядок вывода старого домена из обращения

1. Починить `kairoupdate` (выше) — все будущие сборки ходят туда.
2. Указать в панели DuckDNS для `kairogoupyrlife` тот же IP `45.151.62.223`
   — тогда уже установленные приложения оживают: и синк, и апдейтер.
3. Опубликовать релиз ≥ 0.4.8 (см. «Обновления приложения»). Устройства
   получают его по старому домену и после установки переезжают на новый.
4. Когда все устройства обновились — убрать блок старого домена из nginx
   и сам домен из DuckDNS.

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
