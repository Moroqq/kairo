import { randomBytes, randomUUID, createHash } from 'node:crypto';
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
