/**
 * Облачный аккаунт (VPS-синк): создание при первом запуске, добавление
 * новых устройств через инвертированный QR-flow, восстановление по коду.
 */

import { SERVER_URL } from './server';
import { SYNC_KEYS } from '@/services/sync-snapshot';

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

/*
 * Здесь раньше жили создание аккаунта без логина, инвертированный QR-flow
 * парности и восстановление по коду. Всё это заменил вход по логину и
 * паролю (ниже): чтобы зайти с нового устройства, больше не нужно ни
 * второе настроенное устройство, ни хранимый где-то код.
 *
 * Соответствующие маршруты на сервере (/accounts, /pairing/*, /recovery/*)
 * пока оставлены — под ними живут аккаунты, заведённые до этой версии.
 */

// ── Вход по логину и паролю ─────────────────────────────────────────────
// Основной способ попасть в свой аккаунт с любого устройства. Токен
// устройства при этом никуда не девается — логин просто выдаёт новый.

export const LOGIN_MIN = 3;
export const PASSWORD_MIN = 8;

interface AuthResponse {
  account_id: string;
  device_id: string;
  device_token: string;
  login: string;
}

/** Новый аккаунт сразу с логином и паролем. */
export async function registerAccount(login: string, password: string): Promise<string> {
  const res = await postJSON<AuthResponse>('/auth/register', {
    login, password, device_label: platformLabel(), platform: platformLabel(),
  });
  saveCredentials({ accountId: res.account_id, deviceId: res.device_id, deviceToken: res.device_token });
  return res.login;   // канонический вид: сервер приводит логин к нижнему регистру
}

/** Вход в существующий аккаунт. Возвращает токен для этого устройства. */
export async function loginAccount(login: string, password: string): Promise<string> {
  const res = await postJSON<AuthResponse>('/auth/login', {
    login, password, device_label: platformLabel(), platform: platformLabel(),
  });
  saveCredentials({ accountId: res.account_id, deviceId: res.device_id, deviceToken: res.device_token });
  return res.login;
}

/**
 * Привязать логин и пароль к аккаунту, который уже есть на этом устройстве.
 * Нужно для устройств, заведённых до появления входа: их аккаунт (со всеми
 * данными) иначе остался бы без способа зайти с другого устройства.
 */
export async function setAccountCredentials(login: string, password: string): Promise<string> {
  const creds = getCredentials();
  if (!creds) throw new Error('no_account');
  const res = await postJSON<{ ok: true; login: string }>('/auth/credentials', { login, password }, creds.deviceToken);
  return res.login;
}

/** Есть ли у текущего аккаунта логин. null — аккаунт «старого» вида. */
export async function fetchAccountLogin(): Promise<string | null> {
  const creds = getCredentials();
  if (!creds) return null;
  const res = await fetch(`${SERVER_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${creds.deviceToken}` },
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  const body = await res.json() as { login: string | null };
  return body.login;
}

/**
 * Выход. Стираем и креды, и синхронизируемые данные: устройство должно
 * полностью забыть аккаунт, иначе при входе под другим логином локальные
 * остатки уехали бы в чужой аккаунт. Данные при этом остаются в облаке.
 */
export function logout(): void {
  for (const key of [ACCOUNT_ID_KEY, DEVICE_ID_KEY, DEVICE_TOKEN_KEY, RECOVERY_SHOWN_KEY]) {
    localStorage.removeItem(key);
  }
  for (const key of ['kairo_sync_last_ts', 'kairo_sync_dirty']) {
    localStorage.removeItem(key);
  }
  for (const key of SYNC_KEYS) localStorage.removeItem(key);
}

/** Человеческие тексты для кодов ошибок сервера. */
export function describeAuthError(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  switch (code) {
    case 'invalid_credentials': return 'Неверный логин или пароль';
    case 'login_taken':         return 'Такой логин уже занят';
    case 'invalid_login':       return `Логин: от ${LOGIN_MIN} символов, латиница, цифры, точка, дефис, подчёркивание`;
    case 'weak_password':       return `Пароль — минимум ${PASSWORD_MIN} символов`;
    case 'too_many_attempts':   return 'Слишком много попыток. Подожди и попробуй позже';
    case 'no_account':          return 'Нет облачного аккаунта на этом устройстве';
    default:
      return code.startsWith('http_') ? `Сервер недоступен (${code})` : 'Не удалось выполнить запрос';
  }
}
