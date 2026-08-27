# ObserV на VPS с Kairo — деплой

Сайт [ObserV](https://github.com/Moroqq/observ) подселяется на тот же VPS,
где живёт sync-бэкенд Kairo (`45.151.62.223`). Общие сведения о сервере —
в корневом [`DEPLOYMENT.md`](../../DEPLOYMENT.md).

## Что где будет лежать

| | |
|---|---|
| Код | `/opt/observ/app` (клон `github.com/Moroqq/observ`, обновление через `update.sh`) |
| Секреты | `/etc/observ.env` (root:observ, 640) |
| Сервис | `observ.service`, Node слушает `127.0.0.1:3000` |
| Пользователь | системный `observ`, без логина |
| nginx | `/etc/nginx/sites-available/observ` |
| TLS | `/etc/letsencrypt/live/observ/` (Let's Encrypt, автопродление) |
| Логи | `journalctl -u observ`, `/var/log/nginx/observ.{access,error}.log` |

Kairo не трогается: у него свой юзер, свой порт (`8787`), свой vhost на
`kairogoupyrlife.duckdns.org`. nginx разводит запросы по `server_name`.

## Стек, из которого следуют требования

Next.js 16 + React 19, `next-intl` (локали `ru` — по умолчанию — и `en`,
префикс в URL всегда). Есть серверные роуты `/api/lead` и
`/api/telegram/webhook`, поэтому **статикой сайт отдать нельзя** — нужен
живой Node-процесс, как у kairo.

Зеркала отдельной сборки не требуют: все три домена показывают и `/ru`, и
`/en`, а `/` редиректит на `/ru` (`defaultLocale: "ru"`). Одно приложение,
один процесс — домены различаются только именем.

## Порядок действий

### 0. DNS в Cloudflare

Домены: **`observ.team` — главный**, `observ.space` и `observ.tech` — зеркала.

A-записи всех трёх (и их `www`) → `45.151.62.223`, проксирование включено
(оранжевое облако). Режим SSL/TLS: **Full (strict)** — при `Flexible`
CF пойдёт на origin по HTTP, наш vhost ответит редиректом на HTTPS и получится
петля.

### 1. Забрать деплой-кит на сервер

```bash
ssh root@45.151.62.223
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
и поднимет сервис. Основное время съедает установка зависимостей
(`node_modules` ~700 МБ); сама сборка на Turbopack быстрая — в тестовом
прогоне компиляция заняла секунды. На одном vCPU закладывайтесь на
**10–15 минут**, почти всё это — npm.

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

**Рекомендуемый путь — Let's Encrypt.** Certbot на сервере уже стоит и
обслуживает домен kairo, сертификат признают браузеры, продление
автоматическое, копировать руками ничего не надо.

Перед выпуском переведите все домены в Cloudflare в режим **DNS only**
(серое облако). При оранжевом CF редиректит ACME-челлендж на HTTPS, а
валидного сертификата на origin ещё нет — проверка не пройдёт.

```bash
DOMAINS="observ.team www.observ.team observ.space www.observ.space observ.tech www.observ.tech" \
bash certbot-observ.sh
```

Скрипт сам поднимет временный HTTP-vhost под `/.well-known`, выпустит
сертификат и временный vhost уберёт (в том числе если certbot упадёт).
Пути на выходе:

```
/etc/letsencrypt/live/observ/fullchain.pem
/etc/letsencrypt/live/observ/privkey.pem
```

После выпуска облако можно включать обратно — с сертификатом Let's Encrypt
режим Full (strict) работает как надо.

<details>
<summary>Альтернатива: Cloudflare Origin CA</summary>

Origin-сертификат выдаётся на 15 лет и не требует продления, но его
признаёт **только Cloudflare** — домен, идущий напрямую (серое облако),
с ним отдаст браузеру «сайт небезопасен». Годится, только если все домены
постоянно проксируются через CF. Плюс его приходится вставлять в терминал
целиком, а это тридцать с лишним строк PEM.

Панель CF → SSL/TLS → Origin Server → Create Certificate, затем на сервер
в `/etc/ssl/observ/origin.pem` и `origin.key` (chmod 600). Приватный ключ
Cloudflare показывает один раз.
</details>

### 5. nginx

```bash
DOMAINS="observ.team www.observ.team observ.space www.observ.space observ.tech www.observ.tech" \
CERT=/etc/letsencrypt/live/observ/fullchain.pem \
KEY=/etc/letsencrypt/live/observ/privkey.pem \
bash render-nginx.sh --install
```

**Первый домен в `DOMAINS` — основной**, под него подстраивается подмена
`Origin` для зеркал (см. «Грабли»), поэтому порядок менять нельзя. Посмотреть
результат до записи в `/etc/nginx` — тот же вызов без `--install`.

Скрипт сам прогонит `nginx -t` и перезагрузит nginx. `ufw` править не надо:
80/443 уже открыты, а 3000 висит на loopback.

### 6. Проверка снаружи

```bash
for d in observ.team observ.space observ.tech; do
  echo -n "$d → "; curl -s -o /dev/null -w '%{http_code}\n' "https://$d/ru"
done
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

## Прокси до Telegram (если нужен)

Заявки с сайта и бот ходят в `api.telegram.org`. Если с сервера он
недоступен, `/api/lead` вернёт `telegram_failed`. Проверить:

```bash
curl -s -o /dev/null -w '%{http_code}\n' --max-time 15 https://api.telegram.org/
```

Любой HTTP-код — доступен, ничего делать не надо. `000` — режут, тогда
поднимаем локальный SOCKS5 через sing-box:

```bash
VLESS_URL='vless://…?security=reality&…' bash proxy/singbox-install.sh
```

Ссылку берут из подписки (`curl -s "<адрес>" | base64 -d`) — нужна строка
с `security=reality`. Скрипт разбирает её сам, ставит sing-box, пишет
конфиг в `/etc/sing-box/config.json` (chmod 600, в репозиторий ключи не
попадают), поднимает systemd-юнит и проверяет, что через прокси Telegram
отвечает. Дальше в `/etc/observ.env`:

```
PROXY_URL=socks5://127.0.0.1:1080
```

и `systemctl restart observ`.

Учтите цену решения: это ещё один постоянно работающий сервис. Упал
sing-box, протухла подписка, заблокировали узел — заявки перестанут
доходить, причём молча. Если Telegram доступен напрямую, эту точку отказа
лучше не создавать.

## Грабли, о которых стоит знать заранее

**1. Белый список Origin захардкожен.** В `app/api/lead/route.ts`:

```ts
const ALLOWED_ORIGINS = new Set([
  "https://observ.team",
  "https://www.observ.team",
  ...
])
```

Заявка с `observ.space` и `observ.tech` без вмешательства получает 403 —
форма на зеркалах молча не работала бы. Наш vhost подменяет `Origin`
у известных зеркал на основной домен — работает без
правок кода и переживает `git pull`. Чистое решение — вынести список в
переменную окружения:

```ts
const ALLOWED_ORIGINS = new Set(
  (process.env.LEAD_ALLOWED_ORIGINS ?? "https://observ.team,https://www.observ.team")
    .split(",").map(s => s.trim()).filter(Boolean)
)
```

Тогда домены задаются в `/etc/observ.env`, а подмену в nginx можно убрать.

**2. `npm ci` на этом репозитории не работает.** `package-lock.json`
рассинхронизирован с `package.json` — нет записей `@swc/helpers`, которые
Next 16 дописывает сам во время сборки («Found lockfile missing swc
dependencies, patching...»). `npm ci` падает с `EUSAGE` ещё до сборки.
Скрипты кита пробуют `npm ci` и при этой ошибке откатываются на
`npm install`, громко предупреждая. Чинится один раз в репозитории ObserV:

```bash
npm install && git add package-lock.json && git commit -m "chore: sync lockfile"
```

Пока это не сделано, версии на сервере ставятся по `package.json`, а не
жёстко по lock-файлу — то есть воспроизводимость сборки не гарантирована.

**3. Шрифт тянется на этапе сборки.** `app/layout.tsx` использует
`next/font/google` (Space Mono) — `next build` ходит в `fonts.googleapis.com`.
Проверочная сборка прошла успешно, но с VPS доступ туда надо иметь. Если не
достучится — сборка упадёт; обходные пути: собрать на своей машине и залить
`.next` через rsync, либо положить шрифт локально через `next/font/local`.

**4. Память на сборке.** 1 vCPU / 1.9 ГБ + 2 ГБ swap. `install.sh`
ограничивает кучу V8 (`--max-old-space-size=1024`), чтобы всплеск ушёл
в swap, а не под OOM-killer. Kairo при этом продолжает работать, но
несколько минут может отвечать медленнее.

**5. Сборка пачкает рабочую копию.** `next build` правит `package-lock.json`
и `next-env.d.ts`, поэтому после неё `git status` в `/opt/observ/app` не
чист. `update.sh` делает `git reset --hard` перед сборкой — это ожидаемо;
руками в этом каталоге ничего не правьте, изменения затрутся.

**6. Vercel Analytics.** `@vercel/analytics` в `app/layout.tsx` шлёт beacon
на `vitals.vercel-insights.com`. Вне Vercel данные никуда не собираются —
компонент можно снять (и заодно убрать `connect-src` для него из CSP в
`next.config.mjs`).

**7. Зеркала и поисковики.** Три домена с одинаковым содержимым — это
дубли для поисковиков. Если зеркала нужны как запасной вход, а не как
самостоятельные сайты, стоит либо проставить canonical на `observ.team`
(`metadata.alternates.canonical` в `app/[locale]/layout.tsx`), либо отдавать
на них `X-Robots-Tag: noindex`. Второе — одна строка в vhost, но тогда
зеркала не будут находиться поиском вообще. Решение за вами; по умолчанию
кит ничего из этого не делает.

**8. Кэш Cloudflare.** После выкатки новой версии стоит сбросить кэш CF
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
