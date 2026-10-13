/**
 * Обратный прокси к провайдерам, недоступным с сервера напрямую.
 *
 * Зачем: сервер стоит в России, и api.groq.com отвечает 403 по региону,
 * openrouter.ai не отвечает вовсе, api.telegram.org режется. SOCKS-прокси
 * тут не выручает: запросы к провайдерам идут через fetch в Node, а он
 * системный прокси не использует. Поэтому подменяем адрес, а не маршрут —
 * благо бэкенд это умеет: GROQ_BASE_URL, OPENROUTER_BASE_URL.
 *
 * Разворачивается в Cloudflare Workers: Workers & Pages → Create → Worker,
 * вставить этот файл, Deploy. Затем Settings → Variables → добавить секрет
 * PROXY_SECRET с тем же значением, что в /etc/kairo.env.
 *
 * Маршрутизация по первому сегменту пути:
 *   /groq/...      → https://api.groq.com/...
 *   /openrouter/... → https://openrouter.ai/...
 *   /telegram/...  → https://api.telegram.org/...
 *
 * Тогда в /etc/kairo.env:
 *   GROQ_BASE_URL=https://<воркер>/groq
 *   OPENROUTER_BASE_URL=https://<воркер>/openrouter
 */

const UPSTREAMS = {
  groq: "https://api.groq.com",
  openrouter: "https://openrouter.ai",
  telegram: "https://api.telegram.org",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const [, prefix, ...rest] = url.pathname.split("/");

    const upstream = UPSTREAMS[prefix];
    if (!upstream) {
      return json({ error: "unknown_upstream", known: Object.keys(UPSTREAMS) }, 404);
    }

    // Без секрета воркер — открытый прокси к чужим API за ваш счёт и под
    // вашим именем. Сравнение посимвольное по длине, чтобы не подсказывать
    // длину секрета временем ответа.
    if (!env.PROXY_SECRET || !safeEqual(request.headers.get("x-proxy-secret") || "", env.PROXY_SECRET)) {
      return json({ error: "forbidden" }, 403);
    }

    const target = new URL(upstream);
    target.pathname = "/" + rest.join("/");
    target.search = url.search;

    const headers = new Headers(request.headers);
    headers.delete("x-proxy-secret");
    headers.delete("host");
    // Апстримы иногда отдают gzip на несжатое тело, и fetch в Node падает на
    // распаковке с «incorrect header check». В коде бэкенда уже стоит
    // Accept-Encoding: identity — здесь держим то же самое, чтобы Cloudflare
    // не вернул сжатие по своей инициативе.
    headers.set("accept-encoding", "identity");

    const res = await fetch(target.toString(), {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "follow",
    });

    const out = new Headers(res.headers);
    out.delete("content-encoding");
    out.delete("content-length");
    return new Response(res.body, { status: res.status, headers: out });
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
