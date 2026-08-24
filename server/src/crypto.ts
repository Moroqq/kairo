import { randomBytes, randomUUID, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import * as bip39 from 'bip39';

// ── Идентификаторы ───────────────────────────────────────────────────────

export function newId(): string {
  return randomUUID();
}

// ── Код восстановления ───────────────────────────────────────────────────
// Формат: 6 символов из безопасного алфавита (без 0/O/1/I/L — глазами
// путать не с чем). ~887M вариантов. Полный перебор невозможен благодаря
// rate-limit на /recovery/redeem (10 попыток/час/IP, см. routes/recovery.ts).
//
// Обратная совместимость: старые аккаунты имеют hash от BIP39-фразы (12 слов).
// Функция normalizeRecoveryCode различает форматы: если во входе есть пробелы —
// нормализуем как BIP39; иначе — как короткий код. Один и тот же
// hashRecoveryCode отработает и для того, и для другого.

const RECOVERY_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // без 0,O,1,I,L
const RECOVERY_LENGTH = 6;

export function generateRecoveryCode(): string {
  // rejection sampling чтобы не было смещения из-за 256 % 31
  let out = '';
  while (out.length < RECOVERY_LENGTH) {
    const b = randomBytes(1)[0];
    if (b < RECOVERY_ALPHABET.length * Math.floor(256 / RECOVERY_ALPHABET.length)) {
      out += RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length];
    }
  }
  return out;
}

function normalizeRecoveryCode(code: string): string {
  const trimmed = code.trim();
  if (/\s/.test(trimmed)) {
    return trimmed.toLowerCase().split(/\s+/).join(' '); // BIP39 legacy
  }
  return trimmed.toUpperCase().replace(/[^0-9A-Z]/g, ''); // короткий код
}

export function isValidRecoveryCodeFormat(code: string): boolean {
  const normalized = normalizeRecoveryCode(code);
  if (/\s/.test(normalized)) return bip39.validateMnemonic(normalized);
  if (normalized.length !== RECOVERY_LENGTH) return false;
  return [...normalized].every((c) => RECOVERY_ALPHABET.includes(c));
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');
}

// ── Токен устройства ─────────────────────────────────────────────────────
// Долгоживущий секрет, выдаётся один раз при создании аккаунта или парности,
// хранится на устройстве. На сервере — только SHA-256 хэш.

export function generateDeviceToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// ── Идентификатор пар-интента ────────────────────────────────────────────
// UUID, кодируется в QR. Живёт 5 минут. Сам по себе не даёт доступа —
// требует явного одобрения родительским устройством через /pairing/approve.

export const PAIRING_INTENT_TTL_MS = 5 * 60 * 1000;

export function generatePairingIntentId(): string {
  return randomUUID();
}

// ── Логин и пароль ───────────────────────────────────────────────────────
// scrypt из стандартной библиотеки: без внешних зависимостей и намеренно
// медленный, чтобы перебор украденной базы был дорогим. Соль — своя на
// каждый пароль, хранится рядом с хэшем.

const SCRYPT_N = 16384;   // ~16 МБ памяти на проверку
const SCRYPT_KEYLEN = 32;

/** Формат: scrypt$<N>$<sol_hex>$<hash_hex>. Версия в строке — чтобы потом можно было менять параметры. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize('NFKC'), salt, SCRYPT_KEYLEN, { N: SCRYPT_N });
  return `scrypt$${SCRYPT_N}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** Сравнение за постоянное время: по длительности ответа нельзя подбирать пароль посимвольно. */
export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  if (!Number.isSafeInteger(n) || n <= 0) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(parts[3], 'hex');
  } catch {
    return false;
  }
  const actual = scryptSync(password.normalize('NFKC'), Buffer.from(parts[2], 'hex'), expected.length, { N: n });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Логин приводим к нижнему регистру — «Moroqq» и «moroqq» это один аккаунт. */
export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase().normalize('NFKC');
}

export const LOGIN_MIN = 3;
export const LOGIN_MAX = 32;
export const PASSWORD_MIN = 8;

/** Разрешаем буквы, цифры, точку, дефис и подчёркивание — без пробелов и служебных символов. */
export function isValidLogin(login: string): boolean {
  const l = normalizeLogin(login);
  return l.length >= LOGIN_MIN && l.length <= LOGIN_MAX && /^[a-z0-9._-]+$/.test(l);
}
