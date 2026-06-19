/**
 * Локальная авторизация KAIRO.
 *
 * Модель «как на телефоне»: аккаунт (логин + пароль) + быстрый вход по PIN.
 * Всё хранится локально (localStorage), хеши — PBKDF2 через Web Crypto
 * (нужен защищённый контекст: https / localhost). Подготовлено под будущий
 * перенос на бэкенд-синк (тогда verify уедет на сервер).
 */

const K = {
  username:  'kairo_auth_username',
  pwHash:    'kairo_auth_password_hash',
  pwSalt:    'kairo_auth_password_salt',
  pinHash:   'kairo_auth_pin_hash',
  pinSalt:   'kairo_auth_pin_salt',
} as const;

/* ─── PBKDF2 ───────────────────────────────────────────────────────────── */

async function hash(secret: string, salt?: Uint8Array): Promise<{ hash: string; salt: string }> {
  const enc  = new TextEncoder();
  const s    = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const key  = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: s.buffer as ArrayBuffer, iterations: 310_000, hash: 'SHA-256' },
    key, 256,
  );
  const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
  return { hash: toB64(new Uint8Array(bits)), salt: toB64(s) };
}

async function verify(secret: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const salt = Uint8Array.from(atob(storedSalt), (c) => c.charCodeAt(0));
  const { hash: h } = await hash(secret, salt);
  return h === storedHash;
}

/* ─── Аккаунт (логин + пароль) ─────────────────────────────────────────── */

export function hasAccount(): boolean {
  return localStorage.getItem(K.pwHash) !== null;
}

export function getUsername(): string {
  return localStorage.getItem(K.username) ?? '';
}

export async function createAccount(username: string, password: string): Promise<void> {
  const { hash: h, salt } = await hash(password);
  localStorage.setItem(K.username, username.trim());
  localStorage.setItem(K.pwHash, h);
  localStorage.setItem(K.pwSalt, salt);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const h = localStorage.getItem(K.pwHash);
  const s = localStorage.getItem(K.pwSalt);
  if (!h || !s) return false;
  return verify(password, h, s);
}

/* ─── PIN (быстрый вход) ───────────────────────────────────────────────── */

export function hasPin(): boolean {
  return localStorage.getItem(K.pinHash) !== null;
}

export async function setPin(pin: string): Promise<void> {
  const { hash: h, salt } = await hash(pin);
  localStorage.setItem(K.pinHash, h);
  localStorage.setItem(K.pinSalt, salt);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const h = localStorage.getItem(K.pinHash);
  const s = localStorage.getItem(K.pinSalt);
  if (!h || !s) return false;
  return verify(pin, h, s);
}

export function clearPin(): void {
  localStorage.removeItem(K.pinHash);
  localStorage.removeItem(K.pinSalt);
}

export const PIN_LENGTH = 4;
