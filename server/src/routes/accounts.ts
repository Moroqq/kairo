import type { FastifyInstance } from 'fastify';
import { db, withTransaction } from '../db.js';
import { newId, generateRecoveryCode, hashRecoveryCode, generateDeviceToken, hashToken } from '../crypto.js';

interface CreateAccountBody {
  device_label?: string;
  platform?: string;
}

const insertAccount = db.prepare(`INSERT INTO accounts (id, recovery_code_hash) VALUES (?, ?)`);
const insertDevice = db.prepare(`INSERT INTO devices (id, account_id, token_hash, label, platform) VALUES (?, ?, ?, ?, ?)`);
const insertBlob = db.prepare(`INSERT INTO sync_blobs (account_id, data) VALUES (?, ?)`);

export function registerAccountRoutes(app: FastifyInstance): void {
  /** Первый запуск на новом устройстве — создаёт свежий аккаунт «с нуля». */
  app.post<{ Body: CreateAccountBody }>('/accounts', async (req, reply) => {
    const { device_label, platform } = req.body ?? {};

    const accountId = newId();
    const deviceId = newId();
    const deviceToken = generateDeviceToken();
    const recoveryCode = generateRecoveryCode();

    withTransaction(() => {
      insertAccount.run(accountId, hashRecoveryCode(recoveryCode));
      insertDevice.run(deviceId, accountId, hashToken(deviceToken), device_label ?? null, platform ?? null);
      insertBlob.run(accountId, '{}');
    });

    reply.code(201).send({
      account_id: accountId,
      device_id: deviceId,
      device_token: deviceToken,
      recovery_code: recoveryCode,
    });
  });
}
