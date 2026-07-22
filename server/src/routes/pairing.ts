import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db, withTransaction } from '../db.js';
import {
  newId,
  generatePairingIntentId,
  generateDeviceToken,
  hashToken,
  PAIRING_INTENT_TTL_MS,
} from '../crypto.js';
import { requireAuth, type AuthedDevice } from '../auth.js';
import { makeRateLimiter } from '../rate-limit.js';

// Инвертированный QR-flow ("camera on parent, QR on child"):
//   1. Новое устройство → POST /pairing/start → получает intent_id → рисует QR
//   2. Новое устройство → GET /pairing/wait/:id → поллит статус до одобрения
//   3. Родитель → сканирует QR → POST /pairing/approve с intent_id + Bearer-токеном
//   4. Сервер создаёт device row для нового устройства, кладёт токен в intent
//   5. Ближайший wait-запрос забирает токен (одноразово) и завершается

interface IntentRow {
  id: string;
  expires_at: string;
  approved_at: string | null;
  approved_account_id: string | null;
  approved_device_id: string | null;
  approved_device_token: string | null;
}

const insertIntent = db.prepare(
  `INSERT INTO pairing_intents (id, expires_at) VALUES (?, ?)`,
);
const findIntent = db.prepare(
  `SELECT id, expires_at, approved_at, approved_account_id, approved_device_id, approved_device_token
   FROM pairing_intents WHERE id = ?`,
);
const approveIntent = db.prepare(
  `UPDATE pairing_intents
   SET approved_at = datetime('now'),
       approved_account_id = ?,
       approved_device_id = ?,
       approved_device_token = ?
   WHERE id = ? AND approved_at IS NULL AND expires_at > datetime('now')`,
);
const clearIntentToken = db.prepare(
  `UPDATE pairing_intents SET approved_device_token = NULL WHERE id = ?`,
);
const insertDevice = db.prepare(
  `INSERT INTO devices (id, account_id, token_hash, label, platform) VALUES (?, ?, ?, ?, ?)`,
);

// Ограничение на скорость создания intent-ов с одного IP —
// защита от засорения БД случайными или злонамеренными вызовами.
const startRateLimit = makeRateLimiter({ windowMs: 60 * 1000, max: 20 });

// Как долго держим один long-poll-запрос открытым перед возвратом pending.
// Клиент затем сразу шлёт следующий wait — паузу гасит именно wait, не setInterval.
const WAIT_TIMEOUT_MS = 25_000;
const WAIT_POLL_INTERVAL_MS = 500;

interface ApproveBody {
  intent_id?: string;
  device_label?: string;
  platform?: string;
}

export function registerPairingRoutes(app: FastifyInstance): void {
  /** Новое устройство создаёт intent — сервер выдаёт id, устройство рисует QR. */
  app.post('/pairing/start', async (req, reply) => {
    const gate = startRateLimit(req.ip);
    if (!gate.ok) {
      reply.header('Retry-After', String(gate.retryAfterSec ?? 60));
      return reply.code(429).send({ error: 'too_many_attempts' });
    }
    const id = generatePairingIntentId();
    const expiresAt = new Date(Date.now() + PAIRING_INTENT_TTL_MS).toISOString();
    insertIntent.run(id, expiresAt);
    return reply.code(201).send({ intent_id: id, expires_at: expiresAt });
  });

  /**
   * Long-poll: висит до 25 секунд, ожидая approval. Клиент делает бесконечный
   * реконнект — так UX плавнее, чем обычный setInterval, и меньше нагрузка.
   */
  app.get<{ Params: { id: string } }>('/pairing/wait/:id', async (req, reply) => {
    const deadline = Date.now() + WAIT_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const row = findIntent.get(req.params.id) as IntentRow | undefined;
      if (!row) return reply.code(404).send({ status: 'not_found' });

      if (new Date(row.expires_at).getTime() < Date.now() && !row.approved_at) {
        return reply.code(410).send({ status: 'expired' });
      }

      if (row.approved_at && row.approved_device_token) {
        // Одноразовое чтение: гасим токен сразу, чтобы даже краткое хранение
        // в открытом виде не переросло в постоянное.
        clearIntentToken.run(row.id);
        return reply.code(200).send({
          status: 'approved',
          account_id: row.approved_account_id,
          device_id: row.approved_device_id,
          device_token: row.approved_device_token,
        });
      }

      if (row.approved_at && !row.approved_device_token) {
        // Токен уже забрали кто-то другой. Не отдаём его дважды.
        return reply.code(410).send({ status: 'already_consumed' });
      }

      await new Promise((r) => setTimeout(r, WAIT_POLL_INTERVAL_MS));
    }

    return reply.code(202).send({ status: 'pending' });
  });

  /** Родительское устройство одобряет intent, добавляя новое устройство к своему аккаунту. */
  app.post<{ Body: ApproveBody }>('/pairing/approve', { preHandler: requireAuth }, async (req, reply) => {
    const { accountId } = (req as FastifyRequest & { device: AuthedDevice }).device;
    const intentId = req.body?.intent_id?.trim();
    if (!intentId) return reply.code(400).send({ error: 'intent_id_required' });

    const row = findIntent.get(intentId) as IntentRow | undefined;
    if (!row) return reply.code(404).send({ error: 'intent_not_found' });
    if (row.approved_at) return reply.code(410).send({ error: 'intent_already_approved' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return reply.code(410).send({ error: 'intent_expired' });
    }

    const deviceId = newId();
    const deviceToken = generateDeviceToken();

    withTransaction(() => {
      insertDevice.run(
        deviceId,
        accountId,
        hashToken(deviceToken),
        req.body?.device_label ?? null,
        req.body?.platform ?? null,
      );
      const info = approveIntent.run(intentId, accountId, deviceId, deviceToken);
      // На случай гонки: если approveIntent не апдейтил строку (одобрен пока
      // мы создавали устройство), откатываем всё — устройство мы уже вставили,
      // но throw уронит транзакцию.
      if (info.changes !== 1) throw new Error('intent_race');
    });

    return reply.code(200).send({ ok: true });
  });
}
