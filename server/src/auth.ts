import type { FastifyRequest, FastifyReply } from 'fastify';
import { db } from './db.js';
import { hashToken } from './crypto.js';

export interface AuthedDevice {
  deviceId: string;
  accountId: string;
}

interface DeviceRow {
  id: string;
  account_id: string;
  revoked_at: string | null;
}

const findDeviceByTokenHash = db.prepare(`SELECT id, account_id, revoked_at FROM devices WHERE token_hash = ?`);
const touchLastSeen = db.prepare(`UPDATE devices SET last_seen_at = datetime('now') WHERE id = ?`);

/** Проверяет сырой токен устройства (используется и для REST-заголовка, и для AUTH-сообщения по WebSocket). */
export function authenticateToken(token: string | undefined | null): AuthedDevice | null {
  if (!token) return null;
  const row = findDeviceByTokenHash.get(hashToken(token)) as DeviceRow | undefined;
  if (!row || row.revoked_at) return null;

  touchLastSeen.run(row.id);
  return { deviceId: row.id, accountId: row.account_id };
}

/** Достаёт Bearer-токен из заголовка и проверяет его. */
export function authenticate(req: FastifyRequest): AuthedDevice | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return authenticateToken(header.slice('Bearer '.length).trim());
}

/** Fastify preHandler — требует валидный Bearer-токен, иначе 401. Кладёт устройство в req.device. */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const device = authenticate(req);
  if (!device) {
    reply.code(401).send({ error: 'unauthorized' });
    return reply; // прерывает дальнейшую обработку
  }
  (req as FastifyRequest & { device: AuthedDevice }).device = device;
}
