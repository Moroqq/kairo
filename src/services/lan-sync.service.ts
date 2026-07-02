/**
 * LAN Sync — один WebSocket-канал для синхронизации данных и OTA.
 *
 * Host (десктоп): WS-сервер запущен в Rust, Tauri транслирует
 *                 входящие сообщения как события `ws-msg`.
 *                 Отправка — через `invoke('ws_broadcast', { msg })`.
 *
 * Guest (телефон): прямое подключение к ws://host-ip:8765.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { queryClient } from '@/lib/query-client';

// ── Константы ──────────────────────────────────────────────────────────────

export const WS_PORT = 8765;

export const SYNC_KEYS = [
  'kairo_tasks',
  'kairo_event_logs',
  'kairo_plan_items',
  'kairo_plan_patterns',
  'kairo_plan_overrides',
  'kairo_expenses',
] as const;

export type SyncKey = typeof SYNC_KEYS[number];

// ── Типы протокола ─────────────────────────────────────────────────────────

export interface LanSnapshot {
  data: Record<string, string>;
  ts: string;       // ISO — используется для конкурентного слияния
}

export type WsMsg =
  // Рукопожатие
  | { type: 'HELLO';       role: 'host' | 'guest' }
  // Синхронизация данных
  | { type: 'SYNC_PUSH';   snapshot: LanSnapshot }
  | { type: 'SYNC_ACK';    ts: string }
  // OTA (инфраструктура — финальная установка реализуется отдельно)
  | { type: 'OTA_CHECK' }
  | { type: 'OTA_INFO';    version: string; size: number; path: string }
  | { type: 'OTA_FETCH' }
  | { type: 'OTA_CHUNK';   i: number; n: number; b64: string }
  | { type: 'OTA_DONE' }
  // Keep-alive
  | { type: 'PING' }
  | { type: 'PONG' };

export type MsgType = WsMsg['type'];

export type WsStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface LogEntry {
  ts: string;   // HH:MM:SS.mmm
  text: string;
}

type Handler<T extends WsMsg> = (msg: T) => void;

// ── Утилиты ────────────────────────────────────────────────────────────────

export function isTauriEnv(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function truncateLog(s: string, max = 120): string {
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

export function isDesktopHost(): boolean {
  if (!isTauriEnv()) return false;
  const ua = navigator.userAgent;
  return !ua.includes('Android') && !ua.includes('iPhone') && !ua.includes('iPad');
}

export function captureSnapshot(): LanSnapshot {
  const data: Record<string, string> = {};
  for (const key of SYNC_KEYS) {
    data[key] = localStorage.getItem(key) ?? '[]';
  }
  return { data, ts: new Date().toISOString() };
}

export function applySnapshot(snapshot: LanSnapshot): void {
  for (const [k, v] of Object.entries(snapshot.data)) {
    if ((SYNC_KEYS as readonly string[]).includes(k)) {
      localStorage.setItem(k, v);
    }
  }
  // React Query должен подобрать свежие данные
  queryClient.invalidateQueries();
}

// ── Класс сервиса ──────────────────────────────────────────────────────────

class LanSyncService {
  private mode: 'host' | 'guest' | null = null;
  private ws: WebSocket | null = null;
  private unlisten: UnlistenFn | null = null;
  private _status: WsStatus = 'idle';
  private otaChunks: string[] = [];
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private handlers = new Map<string, Handler<any>[]>();
  private logBuf: LogEntry[] = [];
  private readonly LOG_MAX = 300;

  // ── Диагностический лог ─────────────────────────────────────────────────

  private log(text: string): void {
    const entry: LogEntry = { ts: new Date().toISOString().slice(11, 23), text };
    this.logBuf.push(entry);
    if (this.logBuf.length > this.LOG_MAX) this.logBuf.shift();
    (this.handlers.get('__log__') ?? []).forEach(h => h(entry as any));
  }

  getLogs(): LogEntry[] {
    return this.logBuf;
  }

  onLog(cb: (e: LogEntry) => void): () => void {
    const list = this.handlers.get('__log__') ?? [];
    this.handlers.set('__log__', [...list, cb]);
    return () => this.off('__log__', cb);
  }

  clearLogs(): void {
    this.logBuf = [];
  }

  // ── Подписки ─────────────────────────────────────────────────────────────

  on<T extends WsMsg>(type: T['type'], cb: Handler<T>): () => void {
    const list = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...list, cb]);
    return () => this.off(type, cb);
  }

  off(type: string, cb: Function): void {
    const list = this.handlers.get(type) ?? [];
    this.handlers.set(type, list.filter(h => h !== cb));
  }

  private dispatch(msg: WsMsg): void {
    (this.handlers.get(msg.type) ?? []).forEach(h => h(msg));
    // общий обработчик '*'
    (this.handlers.get('*') ?? []).forEach(h => h(msg));
  }

  // ── Статус ───────────────────────────────────────────────────────────────

  get status(): WsStatus { return this._status; }

  private setStatus(s: WsStatus): void {
    this._status = s;
    (this.handlers.get('__status__') ?? []).forEach(h => h(s as any));
  }

  onStatusChange(cb: (s: WsStatus) => void): () => void {
    const list = this.handlers.get('__status__') ?? [];
    this.handlers.set('__status__', [...list, cb]);
    return () => this.off('__status__', cb);
  }

  // ── Хост (десктоп) ───────────────────────────────────────────────────────

  async initHost(): Promise<void> {
    if (this.mode === 'host') return;
    this.mode = 'host';
    this.log('host: инициализация…');

    // Слушаем диагностику от Rust-сервера
    const unlistenLog = await listen<string>('ws-log', (event) => {
      this.log(`[rust] ${event.payload}`);
    });

    // Слушаем входящие WS-сообщения через Tauri-событие
    const unlistenMsg = await listen<string>('ws-msg', (event) => {
      try {
        const msg = JSON.parse(event.payload) as WsMsg;
        this.log(`← ${msg.type}`);
        this.handleIncoming(msg);
      } catch {
        this.log(`← некорректный JSON: ${truncateLog(event.payload)}`);
      }
    });

    this.unlisten = () => { unlistenLog(); unlistenMsg(); };

    // Ответ на рукопожатие: отправляем снапшот гостю
    this.on('HELLO', () => {
      this.send({ type: 'SYNC_PUSH', snapshot: captureSnapshot() });
    });

    // Гость нажал «Отправить данные на компьютер» — это явный запрос
    // на перезапись, поэтому применяем без сравнения по времени
    // (mergeSnapshots штамповал local.ts «прямо сейчас», из-за чего
    // свежий снапшот хоста всегда «побеждал», даже будучи пустым).
    this.on('SYNC_PUSH', (msg) => {
      this.log('host: применяю данные от гостя (явная перезапись)');
      applySnapshot((msg as any).snapshot);
      this.send({ type: 'SYNC_ACK', ts: new Date().toISOString() });
    });

    this.on('PING', () => this.send({ type: 'PONG' }));
    this.setStatus('connected');
    this.log('host: готов, слушаю ws-msg и ws-log события');
  }

  async destroyHost(): Promise<void> {
    this.log('host: остановка');
    this.unlisten?.();
    this.unlisten = null;
    this.mode = null;
    this.handlers.clear();
    this.setStatus('idle');
  }

  // ── Гость (телефон) ──────────────────────────────────────────────────────

  connectGuest(ip: string, port = WS_PORT): void {
    if (this.mode === 'guest' && this.ws?.readyState === WebSocket.OPEN) return;

    this.disconnectGuest();
    this.mode = 'guest';
    this.setStatus('connecting');

    // Если ip уже содержит порт (192.168.x.x:8765) — не дублируем
    const url = ip.includes(':') ? `ws://${ip}` : `ws://${ip}:${port}`;
    this.log(`guest: подключаюсь к ${url}`);
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.log('guest: WebSocket открыт (onopen)');
      this.setStatus('connected');
      this.send({ type: 'HELLO', role: 'guest' });
      this.startPing();
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMsg;
        this.log(`← ${msg.type}`);
        this.handleIncoming(msg);
      } catch {
        this.log(`← некорректный JSON: ${truncateLog(String(e.data))}`);
      }
    };

    ws.onerror = () => {
      this.log(`guest: ОШИБКА WebSocket (readyState=${ws.readyState}, url=${url})`);
      this.setStatus('error');
    };

    ws.onclose = (e) => {
      this.log(`guest: соединение закрыто (code=${e.code}, reason="${e.reason || '—'}", wasClean=${e.wasClean})`);
      this.stopPing();
      if (this._status !== 'idle') this.setStatus('idle');
    };
  }

  disconnectGuest(): void {
    if (this.ws) this.log('guest: отключение');
    this.stopPing();
    this.ws?.close();
    this.ws = null;
    this.mode = null;
    this.setStatus('idle');
  }

  // ── Отправка сообщений ───────────────────────────────────────────────────

  send(msg: WsMsg): void {
    const str = JSON.stringify(msg);
    this.log(`→ ${msg.type}`);
    if (this.mode === 'host') {
      invoke('ws_broadcast', { msg: str }).catch(e => this.log(`ошибка ws_broadcast: ${e}`));
    } else if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(str);
    } else {
      this.log(`отправка невозможна: WebSocket не открыт (readyState=${this.ws?.readyState ?? 'null'})`);
    }
  }

  // ── Keep-alive ───────────────────────────────────────────────────────────

  private startPing(): void {
    this.pingInterval = setInterval(() => this.send({ type: 'PING' }), 30_000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // ── Обработка входящих сообщений ─────────────────────────────────────────

  private handleIncoming(msg: WsMsg): void {
    switch (msg.type) {
      case 'PONG':
        break;

      case 'SYNC_PUSH':
        if (this.mode === 'guest') {
          applySnapshot(msg.snapshot);
          this.send({ type: 'SYNC_ACK', ts: new Date().toISOString() });
        }
        break;

      case 'OTA_CHUNK':
        this.otaChunks[msg.i] = msg.b64;
        if (msg.i === msg.n - 1) {
          this.dispatch({ type: 'OTA_DONE' });
          const full = this.otaChunks.join('');
          this.otaChunks = [];
          this.dispatch({ type: 'OTA_CHUNK', i: 0, n: 1, b64: full });
        }
        break;

      default:
        break;
    }
    this.dispatch(msg);
  }

  // ── Высокоуровневые операции ─────────────────────────────────────────────

  /** Гость запрашивает данные у хоста (хост сам отвечает на HELLO). */
  pullFromHost(): void {
    this.send({ type: 'HELLO', role: 'guest' });
  }

  /** Гость отправляет свои данные на хост. */
  pushToHost(): void {
    this.send({ type: 'SYNC_PUSH', snapshot: captureSnapshot() });
  }

  /** Хост рассылает свои данные всем гостям. */
  pushToAll(): void {
    this.send({ type: 'SYNC_PUSH', snapshot: captureSnapshot() });
  }
}

// Синглтон
const lanSync = new LanSyncService();
export default lanSync;
