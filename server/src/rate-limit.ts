// Простой in-memory rate-limit по ключу (обычно IP). Скользящее окно
// через фиксированные интервалы: если окно истекло, счётчик обнуляется.
// Достаточно для одного инстанса — нам не нужен распределённый.

interface Entry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec?: number;
}

export function makeRateLimiter(opts: RateLimitOptions) {
  const store = new Map<string, Entry>();

  // Периодически чистим протухшие ключи, чтобы Map не рос бесконечно.
  const gc = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (v.resetAt <= now) store.delete(k);
    }
  }, Math.max(opts.windowMs, 60_000));
  gc.unref?.();

  return function check(key: string): RateLimitResult {
    const now = Date.now();
    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      store.set(key, entry);
    }
    if (entry.count >= opts.max) {
      return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
    }
    entry.count += 1;
    return { ok: true };
  };
}
