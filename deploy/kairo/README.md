# Kairo sync backend — развёртывание

Воспроизводимая установка бэкенда на чистый сервер. Общие сведения о
проекте и эксплуатации — в корневом [`DEPLOYMENT.md`](../../DEPLOYMENT.md).

## Что где оказывается

| | |
|---|---|
| Код | `/opt/kairo-server` (клон репозитория) |
| Сборка | `/opt/kairo-server/server/dist/index.js` |
| База | `/opt/kairo-server/server/data/kairo.db` (SQLite, WAL) |
| Релизы апдейтера | `/opt/kairo-server/server/updates/` |
| Секреты | `/etc/kairo.env` (root:kairo, 640) |
| Сервис | `kairo-server.service`, Node на `127.0.0.1:8787` |
| Бэкапы | `/opt/kairo-backups/`, ежедневно в 03:17 UTC, хранятся 7 дней |
| nginx | `/etc/nginx/sites-available/kairo` из `server/nginx.example.conf` |

## Порядок

### 0. Забрать кит

На голом образе может не быть даже git — тогда сначала:

```bash
apt-get update -qq && apt-get install -y -qq git
git clone https://github.com/Moroqq/kairo /root/kairo-deploy
```

### 1. Подготовка сервера

```bash
bash /root/kairo-deploy/deploy/bootstrap.sh
```

nginx, certbot, Node 22, sqlite3, swap, ufw. **Node именно 22**: бэкенд
использует `node:sqlite`, на 20-й он стартует и падает на первом обращении
к базе.

### 2. Бэкенд

```bash
bash /root/kairo-deploy/deploy/kairo/install.sh
```

В конце сам проверит `/health`. Если в `/opt/kairo-server` окажутся
несохранённые правки — остановится и покажет их: правка прямо на сервере
там уже случалась, и сносить её молча нельзя.

### 3. Секреты

```bash
nano /etc/kairo.env && systemctl restart kairo-server
```

Без `GROQ_API_KEY` и `OPENROUTER_API_KEY` синк работает, отказывают только
ИИ-функции: разбор текста, голос, картинки.

### 4. Перенос базы со старого сервера

Данные — аккаунты, задачи, траты — лежат только в базе. **На старом**
сервере снять свежий снимок:

```bash
/usr/local/bin/kairo-backup.sh && ls -lt /opt/kairo-backups/ | head -3
```

Перекинуть и развернуть **на новом**:

```bash
scp root@СТАРЫЙ_IP:/opt/kairo-backups/kairo-<STAMP>.db.gz /tmp/
systemctl stop kairo-server
gunzip -c /tmp/kairo-<STAMP>.db.gz > /opt/kairo-server/server/data/kairo.db
chown kairo:kairo /opt/kairo-server/server/data/kairo.db
rm -f /opt/kairo-server/server/data/kairo.db-wal /opt/kairo-server/server/data/kairo.db-shm
systemctl start kairo-server
```

Сервис обязательно остановить: подменять файл базы под работающим
процессом нельзя. Файлы `-wal` и `-shm` удаляются потому, что относятся к
прежней базе и к восстановленной не подходят.

### 5. DNS

A-записи доменов перевести на новый IP **до** выпуска сертификата —
проверка Let's Encrypt идёт извне по имени.

### 6. Сертификат и nginx

```bash
DOMAINS="kairoupdate.duckdns.org kairogoupyrlife.duckdns.org" \
bash /root/kairo-deploy/deploy/kairo/certbot-kairo.sh
```

```bash
bash /root/kairo-deploy/deploy/kairo/nginx-install.sh
```

Первый скрипт поднимает временный HTTP-vhost под проверку и убирает его
за собой; перед выпуском сверяет, что домены резолвятся в этот сервер.
Второй ставит конфиг из репозитория, предварительно убедившись, что файлы
сертификатов на месте — иначе nginx не стартует и утащит за собой сайт
ObserV, если тот уже стоит.

### 7. Проверка

```bash
curl -s https://kairoupdate.duckdns.org/health
curl -si https://kairoupdate.duckdns.org/update/latest.json | head -1
```

`{"ok":true}` и `404` **с JSON-телом** `manifest_not_published` — это норма,
маршрут отвечает, релиз просто не опубликован. `404` со страницей nginx
(HTML) означает, что конфиг не тот.

Синк по `/health` не проверяется: WebSocket может быть сломан при живом
`/health`. После установки откройте экран SYNC в приложении.

## Эксплуатация

```bash
systemctl status kairo-server
journalctl -u kairo-server -f
bash /root/kairo-deploy/deploy/kairo/update.sh   # выкатить новую версию
/usr/local/bin/kairo-backup.sh                   # снять бэкап вручную
ss -tlnp | grep 8787
```
