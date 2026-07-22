import type { FastifyInstance } from 'fastify';
import { db, withTransaction } from '../db.js';
import { newId, isValidRecoveryCodeFormat, hashRecoveryCode, generateRecoveryCode, generateDeviceToken, hashToken } from '../crypto.js';
import { makeRateLimiter } from '../rate-limit.js';

interface RedeemBody {
  recovery_code?: string;
  device_label?: string;
  platform?: string;
}

interface AccountRow {
  id: string;
}

const findAccountByCodeHash = db.prepare(`SELECT id FROM accounts WHERE recovery_code_hash = ?`);
const rotateRecoveryCode = db.prepare(`UPDATE accounts SET recovery_code_hash = ? WHERE id = ?`);
const revokeOtherDevices = db.prepare(`UPDATE devices SET revoked_at = datetime('now') WHERE account_id = ? AND revoked_at IS NULL`);
const insertDevice = db.prepare(`INSERT INTO devices (id, account_id, token_hash, label, platform) VALUES (?, ?, ?, ?, ?)`);

// 10 попыток в час на IP. Полный перебор 6-символьного кода (~887M вариантов)
// при таких лимитах — сотни тысяч лет. Целевая атака невозможна.
const recoveryRateLimit = makeRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 });

export function registerRecoveryRoutes(app: FastifyInstance): void {
  /**
   * Восстановление по коду — потерял все устройства. Выдаёт новое устройство,
   * ОТЗЫВАЕТ все прежние и выпускает новый код взамен старого.
   *
   * Принимает и новый короткий формат, и legacy 12-словную BIP39-фразу
   * (для миграции старых аккаунтов). Всегда возвращает НОВЫЙ короткий код.
   */
  app.post<{ Body: RedeemBody }>('/recovery/redeem', async (req, reply) => {
    const ip = req.ip;
    const gate = recoveryRateLimit(ip);
    if (!gate.ok) {
      reply.header('Retry-After', String(gate.retryAfterSec ?? 60));
      return reply.code(429).send({ error: 'too_many_attempts', retry_after_sec: gate.retryAfterSec });
    }

    const code = req.body?.recovery_code;
    if (!code || !isValidRecoveryCodeFormat(code)) {
      return reply.code(400).send({ error: 'invalid_recovery_code_format' });
    }

    const account = findAccountByCodeHash.get(hashRecoveryCode(code)) as AccountRow | undefined;
    if (!account) return reply.code(401).send({ error: 'recovery_code_not_found' });

    const deviceId = newId();
    const deviceToken = generateDeviceToken();
    const newRecoveryCode = generateRecoveryCode();

    withTransaction(() => {
      revokeOtherDevices.run(account.id);
      insertDevice.run(deviceId, account.id, hashToken(deviceToken), req.body.device_label ?? null, req.body.platform ?? null);
      rotateRecoveryCode.run(hashRecoveryCode(newRecoveryCode), account.id);
    });

    reply.code(201).send({
      account_id: account.id,
      device_id: deviceId,
      device_token: deviceToken,
      recovery_code: newRecoveryCode,
    });
  });
}
