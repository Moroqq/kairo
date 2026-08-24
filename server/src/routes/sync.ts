import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { authenticateToken, type AuthedDevice } from '../auth.js';

type ClientMsg =
  | { type: 'AUTH'; token: string }
  | { type: 'SYNC_PUSH'; snapshot: { data: Record<string, string>; ts: string } }
  | { type: 'SYNC_PULL' };

type ServerMsg =
  | { type: 'AUTH_OK' }
  | { type: 'AUTH_ERROR' }
  | { type: 'SYNC_PUSH'; snapshot: { data: Record<string, string>; ts: string } }
  | { type: 'SYNC_ACK'; ts: string };

const AUTH_TIMEOUT_MS = 5000;

interface BlobRow {
  data: string;
  updated_at: string;
}

/**
 * 'YYYY-MM-DD HH:MM:SS' (UTC, формат sqlite) → корректный ISO-8601.
 * Строку, которая и так ISO, пропускаем как есть: дописывать ей 'Z'
 * нельзя — получится '...ZZ', Invalid Date и молчаливый 1970-й.
 */
function sqliteToISO(value: string): string {
  const normalized = /[TZ]/.test(value) ? value : `${value.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

const getBlob = db.prepare(`SELECT data, updated_at FROM sync_blobs WHERE account_id = ?`);
const upsertBlob = db.prepare(`
  INSERT INTO sync_blobs (account_id, data, updated_at) VALUES (?, ?, datetime('now'))
  ON CONFLICT(account_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
`);

export function registerSyncRoutes(app: FastifyInstance): void {
  app.get('/sync', { websocket: true }, (socket, _req) => {
    let device: AuthedDevice | null = null;

    const send = (msg: ServerMsg) => socket.send(JSON.stringify(msg));

    const authTimer = setTimeout(() => {
      if (!device) {
        send({ type: 'AUTH_ERROR' });
        socket.close();
      }
    }, AUTH_TIMEOUT_MS);

    socket.on('message', (raw: Buffer) => {
      let msg: ClientMsg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === 'AUTH') {
        device = authenticateToken(msg.token);
        if (!device) {
          send({ type: 'AUTH_ERROR' });
          socket.close();
          return;
        }
        clearTimeout(authTimer);
        send({ type: 'AUTH_OK' });
        return;
      }

      if (!device) return; // молча игнорируем всё, что до AUTH

      if (msg.type === 'SYNC_PULL') {
        const row = getBlob.get(device.accountId) as BlobRow | undefined;
        const data = row ? (JSON.parse(row.data) as Record<string, string>) : {};
        // sqlite datetime('now') отдаёт 'YYYY-MM-DD HH:MM:SS' — без 'T' и без
        // таймзоны, то есть не ISO. Раньше эта строка уходила в протокол как
        // есть: клиент получал ts, который new Date() разбирает как локальное
        // время (а где-то и вовсе не разбирает). Тот же подвох уже описан
        // в pairing.ts про expires_at.
        const ts = row ? sqliteToISO(row.updated_at) : new Date(0).toISOString();
        send({ type: 'SYNC_PUSH', snapshot: { data, ts } });
        return;
      }

      if (msg.type === 'SYNC_PUSH') {
        upsertBlob.run(device.accountId, JSON.stringify(msg.snapshot.data));
        send({ type: 'SYNC_ACK', ts: new Date().toISOString() });
        return;
      }
    });

    socket.on('close', () => clearTimeout(authTimer));
  });
}
