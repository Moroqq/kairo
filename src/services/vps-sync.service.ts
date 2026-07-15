/**
 * Облачный (VPS) синк — WebSocket-канал поверх аккаунта. В отличие от
 * LAN-синка, здесь есть промежуточный сервер и авторизация токеном
 * устройства, но протокол данных (SYNC_PUSH/SYNC_ACK, тот же снимок)
 * намеренно такой же — см. sync-snapshot.ts.
 */

import { captureSnapshot, applySnapshot, type SyncSnapshot } from './sync-snapshot';
import { getCredentials } from '@/lib/account';

const SERVER_URL = (import.meta.env.VITE_KAIRO_SERVER_URL as string | undefined) ?? 'http://localhost:8787';

export type VpsSyncStatus = 'idle' | 'connecting' | 'connected' | 'error';

type ServerMsg =
  | { type: 'AUTH_OK' }
  | { type: 'AUTH_ERROR' }
  | { type: 'SYNC_PUSH'; snapshot: SyncSnapshot }
  | { type: 'SYNC_ACK'; ts: string };

class VpsSyncService {
  private ws: WebSocket | null = null;
  private _status: VpsSyncStatus = 'idle';
  private statusHandlers: ((s: VpsSyncStatus) => void)[] = [];
  private lastSyncHandlers: ((ts: string) => void)[] = [];

  get status(): VpsSyncStatus { return this._status; }

  onStatusChange(cb: (s: VpsSyncStatus) => void): () => void {
    this.statusHandlers.push(cb);
    return () => { this.statusHandlers = this.statusHandlers.filter((h) => h !== cb); };
  }

  onLastSync(cb: (ts: string) => void): () => void {
    this.lastSyncHandlers.push(cb);
    return () => { this.lastSyncHandlers = this.lastSyncHandlers.filter((h) => h !== cb); };
  }

  private setStatus(s: VpsSyncStatus): void {
    this._status = s;
    this.statusHandlers.forEach((h) => h(s));
  }

  private wsUrl(): string {
    const url = new URL(SERVER_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/sync';
    return url.toString();
  }

  /** Открывает соединение и авторизуется. Резолвится после AUTH_OK, реджектится на ошибке/таймауте. */
  private connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();

    const creds = getCredentials();
    if (!creds) return Promise.reject(new Error('no_account'));

    this.setStatus('connecting');
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl());
      this.ws = ws;
      const timeout = setTimeout(() => { ws.close(); reject(new Error('auth_timeout')); }, 8000);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'AUTH', token: creds.deviceToken }));
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data) as ServerMsg;
        if (msg.type === 'AUTH_OK') {
          clearTimeout(timeout);
          this.setStatus('connected');
          resolve();
        } else if (msg.type === 'AUTH_ERROR') {
          clearTimeout(timeout);
          this.setStatus('error');
          reject(new Error('auth_error'));
        }
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        this.setStatus('error');
        reject(new Error('connection_error'));
      };
      ws.onclose = () => {
        if (this._status !== 'idle') this.setStatus('idle');
      };
    });
  }

  /** Ждёт ответного сообщения нужного типа (после того как AUTH уже прошёл). */
  private waitFor<T extends ServerMsg['type']>(type: T): Promise<Extract<ServerMsg, { type: T }>> {
    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error('not_connected'));
      const timeout = setTimeout(() => {
        this.ws?.removeEventListener('message', handler);
        reject(new Error('timeout'));
      }, 10000);
      const handler = (e: MessageEvent) => {
        const msg = JSON.parse(e.data) as ServerMsg;
        if (msg.type === type) {
          clearTimeout(timeout);
          this.ws?.removeEventListener('message', handler);
          resolve(msg as Extract<ServerMsg, { type: T }>);
        }
      };
      this.ws.addEventListener('message', handler);
    });
  }

  /** Забирает снимок с сервера и применяет локально. */
  async pull(): Promise<void> {
    await this.connect();
    this.ws!.send(JSON.stringify({ type: 'SYNC_PULL' }));
    const res = await this.waitFor('SYNC_PUSH');
    applySnapshot(res.snapshot);
  }

  /** Отправляет локальный снимок на сервер. */
  async push(): Promise<void> {
    await this.connect();
    this.ws!.send(JSON.stringify({ type: 'SYNC_PUSH', snapshot: captureSnapshot() }));
    const res = await this.waitFor('SYNC_ACK');
    this.lastSyncHandlers.forEach((h) => h(res.ts));
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.setStatus('idle');
  }
}

const vpsSync = new VpsSyncService();
export default vpsSync;
