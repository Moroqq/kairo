# ObserV на VPS с Kairo — деплой

Сайт [ObserV](https://github.com/Moroqq/observ) подселяется на тот же VPS,
где живёт sync-бэкенд Kairo (`193.233.48.36`). Общие сведения о сервере —
в корневом [`DEPLOYMENT.md`](../../DEPLOYMENT.md).

## Что где будет лежать

| | |
|---|---|
| Код | `/opt/observ/app` (клон `github.com/Moroqq/observ`, обновление через `update.sh`) |
| Секреты | `/etc/observ.env` (root:observ, 640) |
| Сервис | `observ.service`, Node слушает `127.0.0.1:3000` |
| Пользователь | системный `observ`, без логина |
| nginx | `/etc/nginx/sites-available/observ` |
| TLS | `/etc/ssl/observ/origin.{pem,key}` (Cloudflare Origin CA) |
| Логи | `journalctl -u observ`, `/var/log/nginx/observ.{access,error}.log` |

Kairo не трогается: у него свой юзер, свой порт (`8787`), свой vhost на
`kairogoupyrlife.duckdns.org`. nginx разводит запросы по `server_name`.

## Стек, из которого следуют требования

Next.js 16 + React 19, `next-intl` (локали `ru` — по умолчанию — и `en`,
префикс в URL всегда). Есть серверные роуты `/api/lead` и
`/api/telegram/webhook`, поэтому **статикой сайт отдать нельзя** — нужен
живой Node-процесс, как у kairo.

Зеркало для ру-аудитории отдельной сборки не требует: оба домена показывают
и `/ru`, и `/en`, а `/` редиректит на `/ru` (`defaultLocale: "ru"`).

## Порядок действий

### 0. DNS в Cloudflare

A-записи всех доменов (основного и зеркал) → `193.233.48.36`, проксирование
включено (оранжевое облако). Режим SSL/TLS: **Full (strict)** — при `Flexible`
CF пойдёт на origin по HTTP, наш vhost ответит редиректом на HTTPS и получится
петля.

### 1. Забрать деплой-кит на сервер

```bash
ssh root@193.233.48.36
git clone --branch claude/deploy-site-to-server-rzow45 \
  https://github.com/Moroqq/kairo /root/kairo-deploy
cd /root/kairo-deploy/deploy/observ
```

Отдельный клон намеренно: `/opt/kairo-server` — рабочая копия бэкенда, её
ветку переключать нельзя.

### 2. Установка приложения

```bash
bash install.sh
```

Создаст пользователя, склонирует репозиторий, поставит зависимости, соберёт
и поднимет сервис. Первый прогон на одном vCPU занимает **10–20 минут** —
это нормально, `npm ci` и `next build` тут упираются в процессор.

### 3. Секреты

`install.sh` создаст `/etc/observ.env` из шаблона с пустыми значениями.
Заполнить:

```bash
openssl rand -hex 32          # это в TELEGRAM_WEBHOOK_SECRET
nano /etc/observ.env
systemctl restart observ
```

Без `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` сайт откроется, но форма
заявки будет отдавать 500.

### 4. TLS-сертификат

**Рекомендуемый путь — Cloudflare Origin CA.** Домены и так за CF, а
Origin-сертификат выдаётся на 15 лет и не требует ни валидации, ни
автопродления:

панель CF → SSL/TLS → Origin Server → Create Certificate → RSA, все нужные
хосты (`observ.team`, `*.observ.team`, домены зеркал) → скопировать обе
части.

```bash
mkdir -p /etc/ssl/observ && chmod 700 /etc/ssl/observ
nano /etc/ssl/observ/origin.pem   # вставить сертификат
nano /etc/ssl/observ/origin.key   # вставить приватный ключ
chmod 600 /etc/ssl/observ/*
```

<details>
<summary>Альтернатива: Let's Encrypt</summary>

Certbot на сервере уже есть. Но HTTP-01 через проксирующий Cloudflare —
курица и яйцо: пока на origin нет валидного сертификата, а в CF включён
`Always Use HTTPS`, челлендж не доходит. Варианты: временно погасить
оранжевое облако (`DNS only`), выпустить сертификат, включить обратно —
либо использовать DNS-01 с `certbot-dns-cloudflare` и API-токеном.
Origin CA проще; LE имеет смысл, только если домен когда-нибудь уйдёт
из-под CF.
</details>

### 5. nginx

```bash
DOMAINS="observ.team www.observ.team ЗЕРКАЛО.ru www.ЗЕРКАЛО.ru" \
CERT=/etc/ssl/observ/origin.pem \
KEY=/etc/ssl/observ/origin.key \
bash render-nginx.sh --install
```

**Первый домен в `DOMAINS` — основной**, под него подстраивается подмена
`Origin` для зеркал (см. «Грабли»). Посмотреть результат до записи в
`/etc/nginx` — тот же вызов без `--install`.

Скрипт сам прогонит `nginx -t` и перезагрузит nginx. `ufw` править не надо:
80/443 уже открыты, а 3000 висит на loopback.

### 6. Проверка снаружи

```bash
curl -sI https://observ.team/ru | head -3
curl -sI https://ЗЕРКАЛО.ru/ru | head -3
curl -sI https://kairogoupyrlife.duckdns.org/health   # kairo не задет
```

### 7. Telegram-бот

Вебхук ставится с тем же секретом, что лежит в `/etc/observ.env`:

```bash
source /etc/observ.env
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H 'Content-Type: application/json' \
  -d "{\"url\":\"https://observ.team/api/telegram/webhook\",
       \"secret_token\":\"$TELEGRAM_WEBHOOK_SECRET\",
       \"allowed_updates\":[\"message\",\"callback_query\"]}"
```

Именно так, а не через `scripts/set-webhook.ts`: тот скрипт `secret_token`
не передаёт, а роут без совпадения заголовка отвечает 401 — бот будет молча
не работать.

Если где-то параллельно крутится `bot-polling.mjs` — его надо остановить:
Telegram не отдаёт `getUpdates`, пока установлен вебхук.

## Грабли, о которых стоит знать заранее

**1. Белый список Origin захардкожен.** В `app/api/lead/route.ts`:

```ts
const ALLOWED_ORIGINS = new Set([
  "https://observ.team",
  "https://www.observ.team",
  ...
])
```

Заявка с зеркального домена без вмешательства получает 403. Наш vhost
подменяет `Origin` у известных зеркал на основной домен — работает без
правок кода и переживает `git pull`. Чистое решение — вынести список в
переменную окружения:

```ts
const ALLOWED_ORIGINS = new Set(
  (process.env.LEAD_ALLOWED_ORIGINS ?? "https://observ.team,https://www.observ.team")
    .split(",").map(s => s.trim()).filter(Boolean)
)
```

Тогда домены задаются в `/etc/observ.env`, а подмену в nginx можно убрать.

**2. Шрифт тянется на этапе сборки.** `app/layout.tsx` использует
`next/font/google` (Space Mono) — `next build` ходит в `fonts.googleapis.com`.
Если с VPS туда не достучаться, сборка упадёт. Обходные пути: собрать на
своей машине и залить `.next` через rsync, либо положить шрифт локально
через `next/font/local`.

**3. Память на сборке.** 1 vCPU / 1.9 ГБ + 2 ГБ swap. `next build` для
такого объёма зависимостей — самая тяжёлая операция на этом сервере;
`install.sh` ограничивает кучу V8 (`--max-old-space-size=1024`), чтобы
сборка ушла в swap, а не под OOM-killer. Kairo при этом продолжает
работать, но пару минут может отвечать медленнее.

**4. Vercel Analytics.** `@vercel/analytics` в `app/layout.tsx` шлёт beacon
на `vitals.vercel-insights.com`. Вне Vercel данные никуда не собираются —
компонент можно снять (и заодно убрать `connect-src` для него из CSP в
`next.config.mjs`).

**5. Кэш Cloudflare.** После выкатки новой версии стоит сбросить кэш CF
(Caching → Purge Everything), иначе часть посетителей получит старые
чанки `/_next/static/`.

## Эксплуатация

```bash
systemctl status observ            # состояние
journalctl -u observ -f            # логи в реальном времени
systemctl restart observ           # рестарт
bash update.sh                     # выкатить новую версию из main
ss -tlnp | grep -E '3000|8787'     # кто что слушает
free -h && df -h /                 # память и диск
```

`update.sh` печатает команду отката, если после рестарта сайт не отвечает.
