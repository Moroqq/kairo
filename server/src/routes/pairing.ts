import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db, withTransaction } from '../db.js';
import { newId, generatePairingTicket, normalizeTicket, generateDeviceToken, hashToken, PAIRING_TICKET_TTL_MS } from '../crypto.js';
import { requireAuth, type AuthedDevice } from '../auth.js';

interface RedeemBody {
  ticket?: string;
  device_label?: string;
  platform?: string;
}

interface TicketRow {
  code: string;
  account_id: string;
  expires_at: string;
  consumed_at: string | null;
}

const insertTicket = db.prepare(`INSERT INTO pairing_tickets (code, account_id, expires_at) VALUES (?, ?, ?)`);
const findTicket = db.prepare(`SELECT code, account_id, expires_at, consumed_at FROM pairing_tickets WHERE code = ?`);
const consumeTicket = db.prepare(`UPDATE pairing_tickets SET consumed_at = datetime('now') WHERE code = ?`);
const insertDevice = db.prepare(`INSERT INTO devices (id, account_id, token_hash, label, platform) VALUES (?, ?, ?, ?, ?)`);

export function registerPairingRoutes(app: FastifyInstance): void {
  /** Уже привязанное устройство запрашивает билет, чтобы добавить ещё одно. */
  app.post('/pairing/tickets', { preHandler: requireAuth }, async (req, reply) => {
    const { accountId } = (req as FastifyRequest & { device: AuthedDevice }).device;

    const code = generatePairingTicket();
    const expiresAt = new Date(Date.now() + PAIRING_TICKET_TTL_MS).toISOString();
    insertTicket.run(code, accountId, expiresAt);

    reply.code(201).send({ ticket: code, expires_at: expiresAt });
  });

  /** Новое устройство обменивает билет (из QR или введённый вручную) на собственный токен. */
  app.post<{ Body: RedeemBody }>('/pairing/redeem', async (req, reply) => {
    const raw = req.body?.ticket;
    if (!raw) return reply.code(400).send({ error: 'ticket_required' });

    const code = normalizeTicket(raw);
    const row = findTicket.get(code) as TicketRow | undefined;
    if (!row) return reply.code(404).send({ error: 'ticket_not_found' });
    if (row.consumed_at) return reply.code(410).send({ error: 'ticket_already_used' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return reply.code(410).send({ error: 'ticket_expired' });
    }

    const deviceId = newId();
    const deviceToken = generateDeviceToken();

    withTransaction(() => {
      consumeTicket.run(code);
      insertDevice.run(deviceId, row.account_id, hashToken(deviceToken), req.body.device_label ?? null, req.body.platform ?? null);
    });

    reply.code(201).send({
      account_id: row.account_id,
      device_id: deviceId,
      device_token: deviceToken,
    });
  });
}
