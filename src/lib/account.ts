/**
 * Облачный аккаунт (VPS-синк): создание при первом запуске, добавление
 * новых устройств через инвертированный QR-flow, восстановление по коду.
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

/** Показывать ли одноразовый экран кода восстановления. */
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

/** Первый запуск на первом устройстве — создаёт аккаунт «с нуля». */
export async function createAccount(): Promise<string> {
  const res = await postJSON<{ account_id: string; device_id: string; device_token: string; recovery_code: string }>(
    '/accounts',
    { device_label: platformLabel(), platform: platformLabel() },
  );
  saveCredentials({ accountId: res.account_id, deviceId: res.device_id, deviceToken: res.device_token });
  return res.recovery_code;
}

// ── Инвертированный QR-flow ─────────────────────────────────────────────

export interface PairingIntent {
  intentId: string;
  expiresAt: string;
}

/** Новое устройство создаёт intent — сервер выдаёт id, устройство рисует QR. */
export async function startPairing(): Promise<PairingIntent> {
  const res = await postJSON<{ intent_id: string; expires_at: string }>('/pairing/start', {});
  return { intentId: res.intent_id, expiresAt: res.expires_at };
}

export type PairingWaitResult =
  | { status: 'approved' }
  | { status: 'pending' }
  | { status: 'expired' | 'not_found' | 'already_consumed' };

/**
 * Long-poll: ждёт одобрения intent-а. При approved сохраняет полученные
 * креды в localStorage. Возвращает статус.
 */
export async function waitForPairing(intentId: string): Promise<PairingWaitResult> {
  const res = await fetch(`${SERVER_URL}/pairing/wait/${encodeURIComponent(intentId)}`);
  if (res.status === 200) {
    const body = await res.json() as { account_id: string; device_id: string; device_token: string };
    saveCredentials({ accountId: body.account_id, deviceId: body.device_id, deviceToken: body.device_token });
    return { status: 'approved' };
  }
  if (res.status === 202) return { status: 'pending' };
  if (res.status === 404) return { status: 'not_found' };
  if (res.status === 410) {
    const body = await res.json().catch(() => ({ status: 'expired' })) as { status?: string };
    return { status: (body.status as 'expired' | 'already_consumed') ?? 'expired' };
  }
  throw new Error(`unexpected_status_${res.status}`);
}

/** Родительское устройство одобряет intent, полученный из QR-кода. */
export async function approvePairing(intentId: string): Promise<void> {
  const creds = getCredentials();
  if (!creds) throw new Error('no_account');
  await postJSON<{ ok: true }>(
    '/pairing/approve',
    { intent_id: intentId, device_label: platformLabel(), platform: platformLabel() },
    creds.deviceToken,
  );
}

// ── Восстановление ──────────────────────────────────────────────────────

/** Восстановление по коду. Возвращает НОВЫЙ код взамен старого. */
export async function redeemRecoveryCode(recoveryCode: string): Promise<string> {
  const res = await postJSON<{ account_id: string; device_id: string; device_token: string; recovery_code: string }>(
    '/recovery/redeem',
    { recovery_code: recoveryCode, device_label: platformLabel(), platform: platformLabel() },
  );
  saveCredentials({ accountId: res.account_id, deviceId: res.device_id, deviceToken: res.device_token });
  return res.recovery_code;
}
