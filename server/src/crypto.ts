import { randomBytes, randomUUID, createHash } from 'node:crypto';
import * as bip39 from 'bip39';

// ── Идентификаторы ───────────────────────────────────────────────────────

export function newId(): string {
  return randomUUID();
}

// ── Код восстановления (12 слов BIP39) ───────────────────────────────────
// Показывается пользователю ровно один раз. Хранится на сервере в виде
// хэша, по которому можно искать аккаунт (уникальный индекс в БД).
//
// Почему обычный SHA-256, а не медленный KDF (scrypt/bcrypt): медленный
// хэш нужен, когда исходный секрет — короткий/угадываемый (пароль человека).
// У 12-словной BIP39-фразы и так ~128 бит энтропии — перебрать такой хэш
// не получится ни с scrypt, ни с SHA-256, а вот эффективный поиск по базе
// (без соли на каждую запись) нужен, поэтому здесь — обычный быстрый хэш,
// как у токена устройства.

export function generateRecoveryCode(): string {
  return bip39.generateMnemonic(128); // 128 бит энтропии → 12 слов
}

export function isValidRecoveryCodeFormat(code: string): boolean {
  return bip39.validateMnemonic(normalizeRecoveryCode(code));
}

function normalizeRecoveryCode(code: string): string {
  return code.trim().toLowerCase().split(/\s+/).join(' ');
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');
}

// ── Токен устройства ─────────────────────────────────────────────────────
// Долгоживущий секрет, выдаётся один раз при создании аккаунта или парности,
// хранится на устройстве. На сервере — только SHA-256 хэш (256 бит энтропии
// уже не нуждаются в медленном KDF — перебрать их всё равно невозможно).

export function generateDeviceToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// ── Билет парности ───────────────────────────────────────────────────────
// Короткий, одноразовый, живёт 5 минут — намеренно низкая энтропия,
// потому что срок жизни и одноразовость сами по себе достаточная защита.

const TICKET_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // без I,L,O,U (легко перепутать)
const TICKET_LENGTH = 8;
export const PAIRING_TICKET_TTL_MS = 5 * 60 * 1000;

export function generatePairingTicket(): string {
  const bytes = randomBytes(TICKET_LENGTH);
  let out = '';
  for (let i = 0; i < TICKET_LENGTH; i++) {
    out += TICKET_ALPHABET[bytes[i] % TICKET_ALPHABET.length];
  }
  return out;
}

export function normalizeTicket(ticket: string): string {
  return ticket.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
}
