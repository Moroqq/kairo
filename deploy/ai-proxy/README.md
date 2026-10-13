# Прокси к ИИ-провайдерам и Telegram

С сервера (Россия) напрямую недоступны:

| Адрес | Что отвечает |
|---|---|
| `api.groq.com` | `403` — блокировка по региону |
| `openrouter.ai` | `000` — не доходит |
| `api.telegram.org` | `000` — не доходит |

SOCKS-прокси проблему не решает: запросы к провайдерам идут через `fetch`
в Node, а он системный прокси не использует. Поэтому подменяем **адрес**:
бэкенд умеет `GROQ_BASE_URL` и `OPENROUTER_BASE_URL`, а аутентификация
прокси идёт заголовком `X-Proxy-Secret` — всё это уже есть в коде.

## Развёртывание

1. Cloudflare → **Workers & Pages** → **Create** → **Worker**. Имя любое,
   например `kairo-ai-proxy`. Deploy.
2. **Edit code**, вставить [`worker.js`](worker.js) целиком, Deploy.
3. **Settings → Variables and Secrets** → добавить секрет `PROXY_SECRET`.
   Значение придумайте сами: `openssl rand -hex 32`.

Адрес воркера будет вида `https://kairo-ai-proxy.<ваш>.workers.dev`.

## Настройка сервера

```bash
sed -i 's|^#*GROQ_BASE_URL=.*|GROQ_BASE_URL=https://ВОРКЕР/groq|'             /etc/kairo.env
sed -i 's|^#*OPENROUTER_BASE_URL=.*|OPENROUTER_BASE_URL=https://ВОРКЕР/openrouter|' /etc/kairo.env
sed -i 's|^OPENROUTER_PROXY_SECRET=.*|OPENROUTER_PROXY_SECRET=ТОТ_ЖЕ_СЕКРЕТ|' /etc/kairo.env
systemctl restart kairo-server
```

Проверка — должна вернуть список моделей:

```bash
set -a; . /etc/kairo.env; set +a
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "authorization: Bearer $GROQ_API_KEY" \
  -H "X-Proxy-Secret: $OPENROUTER_PROXY_SECRET" \
  "$GROQ_BASE_URL/openai/v1/models"
```

`200` — работает. `403` — не совпал секрет. `401` — неверный ключ Groq.

## Почему секрет обязателен

Без него воркер — открытый прокси к чужим API: любой, кто узнает адрес,
будет ходить через него под вашим именем и за ваш счёт. Воркер отвечает
`403` на запрос без совпадающего `X-Proxy-Secret`.

## Telegram

Маршрут `/telegram` в воркере есть, но сайт ObserV пока ходит в Telegram
по адресу, зашитому константой в `lib/telegram.ts` репозитория ObserV.
Чтобы пустить его через воркер, адрес нужно сделать настраиваемым —
правка на несколько строк.
