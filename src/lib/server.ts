/**
 * Единая точка правды про адрес бэкенда.
 *
 * Раньше URL был продублирован в трёх местах: `lib/account.ts`,
 * `services/vps-sync.service.ts` (оба через `import.meta.env`) и
 * `lib/updater.ts` (вообще зашит строкой).
 * Из-за этого «переехать на другой хост» означало правку в трёх файлах,
 * а апдейтер продолжал стучаться на старый адрес даже после смены `.env`.
 */

const RAW = (import.meta.env.VITE_KAIRO_SERVER_URL as string | undefined)?.trim();

/** Базовый URL сервера, без хвостового слэша. */
export const SERVER_URL = (RAW && RAW.length > 0 ? RAW : 'http://localhost:8787').replace(/\/+$/, '');

/** Хост сервера — для понятных сообщений об ошибках («проверь, доступен ли X»). */
export const SERVER_HOST = (() => {
  try { return new URL(SERVER_URL).host; } catch { return SERVER_URL; }
})();

/** ws:// или wss:// в зависимости от схемы SERVER_URL. */
export function wsUrl(path: string): string {
  const url = new URL(SERVER_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = path;
  return url.toString();
}

/** Манифест апдейтера. Должен совпадать с `plugins.updater.endpoints` в tauri.conf.json. */
export const UPDATE_MANIFEST_URL = `${SERVER_URL}/update/latest.json`;

/**
 * fetch с таймаутом. Без него зависший коннект (сервер не отвечает, но и не
 * рвёт соединение) оставляет UI в состоянии «проверяю…» навсегда.
 */
export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = 15000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`timeout: ${SERVER_HOST} не ответил за ${Math.round(timeoutMs / 1000)} с`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Приводит сетевую ошибку к человеческой формулировке.
 * «Failed to fetch» ни о чём не говорит пользователю: это может быть и
 * лежащий сервер, и протухший DNS, и CORS. Подсказываем, что проверять.
 */
export function describeNetworkError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/failed to fetch|networkerror|load failed|error sending request/i.test(raw)) {
    return `сервер ${SERVER_HOST} недоступен (${raw})`;
  }
  return raw;
}
