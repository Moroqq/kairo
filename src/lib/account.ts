/**
 * Облачный аккаунт (VPS-синк): создание при первом запуске, парность
 * дополнительных устройств через билет, восстановление по коду.
 * Полностью отдельно от LAN-синка — тот работает без всякого аккаунта.
 */

const SERVER_URL = (import.meta.env.VITE_KAIRO_SERVER_URL as string | undefined) ?? 'http://localhost:8787';

const ACCOUNT_ID_KEY   = 'kairo_account_id';
const DEVICE_ID_KEY    = 'kairo_device_id';
const DEVICE_TOKEN_KEY = 'kairo_device_token';
const RECOVERY_SHOWN_KEY = 'kairo_recovery_code_shown';

export interface AccountCredentials {
  accountId: string;
  deviceId: string;
  deviceToken: string;
}

function platformLabel(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Android')) return 'android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'ios';
  return 'desktop';
}

function saveCredentials(c: AccountCredentials): void {
  localStorage.setItem(ACCOUNT_ID_KEY, c.accountId);
  localStorage.setItem(DEVICE_ID_KEY, c.deviceId);
  localStorage.setItem(DEVICE_TOKEN_KEY, c.deviceToken);
}

export function getCredentials(): AccountCredentials | null {
  const accountId = localStorage.getItem(ACCOUNT_ID_KEY);
  const deviceId = localStorage.getItem(DEVICE_ID_KEY);
  const deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!accountId || !deviceId || !deviceToken) return null;
  return { accountId, deviceId, deviceToken };
}

export function hasAccount(): boolean {
  return getCredentials() !== null;
}

/** Показывать ли одноразовый экран кода восстановления (ещё ни разу не показывался на этом устройстве). */
export function shouldShowRecoveryCode(): boolean {
  return localStorage.getItem(RECOVERY_SHOWN_KEY) !== '1';
}

export function markRecoveryCodeShown(): void {
  localStorage.setItem(RECOVERY_SHOWN_KEY, '1');
}

async function postJSON<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `http_${res.status}` })) as { error?: string };
    throw new Error(err.error ?? `http_${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Первый запуск на первом устройстве — создаёт аккаунт «с нуля». Возвращает код восстановления (показать один раз). */
export async function createAccount(): Promise<string> {
  const res = await postJSON<{ account_id: string; device_id: string; device_token: string; recovery_code: string }>(
    '/accounts',
    { device_label: platformLabel(), platform: platformLabel() },
  );
  saveCredentials({ accountId: res.account_id, deviceId: res.device_id, deviceToken: res.device_token });
  return res.recovery_code;
}

/** Уже привязанное устройство запрашивает билет для добавления нового. */
export async function requestPairingTicket(): Promise<{ ticket: string; expiresAt: string }> {
  const creds = getCredentials();
  if (!creds) throw new Error('no_account');
  const res = await postJSON<{ ticket: string; expires_at: string }>('/pairing/tickets', {}, creds.deviceToken);
  return { ticket: res.ticket, expiresAt: res.expires_at };
}

/** Новое устройство — обменивает билет (из QR-ссылки или введённый вручную) на собственный токен. */
export async function redeemPairingTicket(ticket: string): Promise<void> {
  const res = await postJSON<{ account_id: string; device_id: string; device_token: string }>(
    '/pairing/redeem',
    { ticket, device_label: platformLabel(), platform: platformLabel() },
  );
  saveCredentials({ accountId: res.account_id, deviceId: res.device_id, deviceToken: res.device_token });
}

/** Восстановление по коду (все устройства потеряны). Возвращает НОВЫЙ код восстановления — старые устройства отзываются. */
export async function redeemRecoveryCode(recoveryCode: string): Promise<string> {
  const res = await postJSON<{ account_id: string; device_id: string; device_token: string; recovery_code: string }>(
    '/recovery/redeem',
    { recovery_code: recoveryCode, device_label: platformLabel(), platform: platformLabel() },
  );
  saveCredentials({ accountId: res.account_id, deviceId: res.device_id, deviceToken: res.device_token });
  return res.recovery_code;
}

/** Ссылка для QR-парности — сканируется обычной камерой телефона, открывает Kairo через deep link. */
export function pairingDeepLink(ticket: string): string {
  return `kairo://pair?ticket=${encodeURIComponent(ticket)}`;
}
