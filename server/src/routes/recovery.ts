import type { FastifyInstance } from 'fastify';
import { db, withTransaction } from '../db.js';
import { newId, isValidRecoveryCodeFormat, hashRecoveryCode, generateRecoveryCode, generateDeviceToken, hashToken } from '../crypto.js';

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

export function registerRecoveryRoutes(app: FastifyInstance): void {
  /**
   * Восстановление по коду — потерял все устройства. Выдаёт новое устройство,
   * ОТЗЫВАЕТ все прежние (защитный дефолт: если код утёк не туда, старые
   * легитимные устройства сами отвалятся при следующей попытке синка — это
   * и есть сигнал, что что-то не так) и выпускает новый код взамен старого.
   */
  app.post<{ Body: RedeemBody }>('/recovery/redeem', async (req, reply) => {
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
