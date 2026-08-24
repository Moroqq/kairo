/**
 * Облачный (VPS) синк — WebSocket-канал поверх аккаунта. В отличие от
 * LAN-синка, здесь есть промежуточный сервер и авторизация токеном
 * устройства, но протокол данных (SYNC_PUSH/SYNC_ACK, тот же снимок)
 * намеренно такой же — см. sync-snapshot.ts.
 *
 * Что здесь важно понимать:
 *
 * 1. Синк «тихий» по умолчанию, но НЕ безмолвный. Раньше все ошибки уходили
 *    в console.warn, а экран SYNC при этом безусловно писал «✓ облако
 *    подключено» — приложение врало пользователю про своё состояние.
 *    Теперь наружу торчит `getState()` с реальным статусом и последней
 *    ошибкой, и UI показывает именно его.
 *
 * 2. Соединение восстанавливается само. Мобильный клиент почти всё время
 *    в фоне: сокет рвётся при засыпании, и раньше после этого не
 *    происходило вообще ничего до перезапуска приложения. Теперь есть
 *    реконнект с backoff, синк при возврате в фор и при появлении сети.
 *
 * 3. Порядок push/pull. Снимок — единый блоб, мержа нет: кто последний
 *    записал, того и данные. Поэтому если на этом устройстве есть
 *    несинхронизированные правки (флаг dirty), мы сначала ОТДАЁМ их,
 *    и только потом забираем состояние сервера. Раньше стартовый pull
 *    молча затирал локальные правки, сделанные офлайн.
 */

import { captureSnapshot, applySnapshot, SYNC_KEYS, type SyncSnapshot } from './sync-snapshot';
import { getCredentials } from '@/lib/account';
import { wsUrl, describeNetworkError } from '@/lib/server';

export type VpsSyncStatus = 'idle' | 'connecting' | 'connected' | 'syncing' | 'error';

export interface VpsSyncState {
  status: VpsSyncStatus;
  /** Текст последней ошибки (человеческий), либо null. */
  lastError: string | null;
  /** ISO-время последнего успешного обмена с сервером, либо null. */
  lastSyncTs: string | null;
  /** Есть ли локальные правки, которые ещё не доехали до облака. */
  pendingChanges: boolean;
}

type ServerMsg =
  | { type: 'AUTH_OK' }
  | { type: 'AUTH_ERROR' }
  | { type: 'SYNC_PUSH'; snapshot: SyncSnapshot }
  | { type: 'SYNC_ACK'; ts: string };

const LAST_SYNC_KEY = 'kairo_sync_last_ts';
const DIRTY_KEY = 'kairo_sync_dirty';

const AUTH_TIMEOUT_MS = 10000;
const REPLY_TIMEOUT_MS = 15000;
const DEBOUNCE_MS = 3000;
/** Периодический фоновой синк — страховка на случай пропущенных событий. */
const PERIODIC_MS = 5 * 60 * 1000;

class VpsSyncService {
  private ws: WebSocket | null = null;
  /** In-flight connect(). Без него два одновременных вызова открывали два сокета. */
  private connecting: Promise<void> | null = null;

  private state: VpsSyncState = {
    status: 'idle',
    lastError: null,
    lastSyncTs: localStorage.getItem(LAST_SYNC_KEY),
    pendingChanges: localStorage.getItem(DIRTY_KEY) === '1',
  };
  private handlers = new Set<(s: VpsSyncState) => void>();

  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private periodicTimer: ReturnType<typeof setInterval> | null = null;
  private started = false;
  /** Текущий syncNow(), чтобы параллельные вызовы не гоняли обмен дважды. */
  private inFlightSync: Promise<void> | null = null;

  // ── Наблюдаемое состояние ────────────────────────────────────────────

  getState(): VpsSyncState { return this.state; }

  subscribe(cb: (s: VpsSyncState) => void): () => void {
    this.handlers.add(cb);
    return () => { this.handlers.delete(cb); };
  }

  private patch(p: Partial<VpsSyncState>): void {
    this.state = { ...this.state, ...p };
    this.handlers.forEach((h) => h(this.state));
  }

  private markDirty(dirty: boolean): void {
    if (dirty) localStorage.setItem(DIRTY_KEY, '1');
    else localStorage.removeItem(DIRTY_KEY);
    this.patch({ pendingChanges: dirty });
  }

  private markSynced(ts: string): void {
    localStorage.setItem(LAST_SYNC_KEY, ts);
    this.patch({ lastSyncTs: ts, lastError: null });
  }

  // ── Соединение ───────────────────────────────────────────────────────

  /** Открывает соединение и авторизуется. Резолвится после AUTH_OK. */
  private connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.connecting) return this.connecting;

    const creds = getCredentials();
    if (!creds) return Promise.reject(new Error('нет облачного аккаунта'));

    this.patch({ status: 'connecting' });

    this.connecting = new Promise<void>((resolve, reject) => {
      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl('/sync'));
      } catch (e) {
        reject(new Error(describeNetworkError(e)));
        return;
      }
      this.ws = ws;

      let settled = false;
      const finish = (err?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) reject(err); else resolve();
      };

      const timer = setTimeout(() => {
        try { ws.close(); } catch { /* ignore */ }
        finish(new Error('сервер не подтвердил авторизацию за 10 с'));
      }, AUTH_TIMEOUT_MS);

      ws.onopen = () => ws.send(JSON.stringify({ type: 'AUTH', token: creds.deviceToken }));

      ws.onmessage = (e) => {
        let msg: ServerMsg;
        try { msg = JSON.parse(e.data as string) as ServerMsg; } catch { return; }
        if (msg.type === 'AUTH_OK') {
          this.reconnectAttempt = 0;
          this.patch({ status: 'connected', lastError: null });
          finish();
        } else if (msg.type === 'AUTH_ERROR') {
          try { ws.close(); } catch { /* ignore */ }
          finish(new Error('сервер отклонил токен устройства — переподключи устройство заново'));
        }
      };

      ws.onerror = () => {
        finish(new Error('не удалось открыть соединение с сервером'));
      };

      ws.onclose = () => {
        if (this.ws === ws) this.ws = null;
        finish(new Error('соединение закрылось до авторизации'));
        if (this.state.status === 'connected') this.patch({ status: 'idle' });
        // Соединение упало уже после успешного синка — планируем реконнект,
        // иначе устройство «замолкает» до перезапуска приложения.
        if (this.started && getCredentials()) this.scheduleReconnect();
      };
    }).finally(() => { this.connecting = null; });

    return this.connecting;
  }

  /** Реконнект с экспоненциальным backoff: 5с, 10с, 20с, 40с, дальше раз в минуту. */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = Math.min(60000, 5000 * 2 ** Math.min(this.reconnectAttempt, 4));
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.syncNow().catch(() => { /* статус уже записан в state */ });
    }, delay);
  }

  /** Ждёт ответного сообщения нужного типа (после того как AUTH уже прошёл). */
  private waitFor<T extends ServerMsg['type']>(type: T): Promise<Extract<ServerMsg, { type: T }>> {
    return new Promise((resolve, reject) => {
      const ws = this.ws;
      if (!ws || ws.readyState !== WebSocket.OPEN) return reject(new Error('соединение не открыто'));

      const cleanup = () => {
        clearTimeout(timeout);
        ws.removeEventListener('message', onMessage);
        ws.removeEventListener('close', onClose);
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`сервер не ответил на ${type} за 15 с`));
      }, REPLY_TIMEOUT_MS);
      const onMessage = (e: MessageEvent) => {
        let msg: ServerMsg;
        try { msg = JSON.parse(e.data as string) as ServerMsg; } catch { return; }
        if (msg.type === type) {
          cleanup();
          resolve(msg as Extract<ServerMsg, { type: T }>);
        }
      };
      // Раньше обрыв во время ожидания оставлял промис висеть до таймаута.
      const onClose = () => { cleanup(); reject(new Error('соединение оборвалось')); };

      ws.addEventListener('message', onMessage);
      ws.addEventListener('close', onClose);
    });
  }

  // ── Обмен ────────────────────────────────────────────────────────────

  /** Забирает снимок с сервера и применяет локально. */
  private async pull(): Promise<void> {
    await this.connect();
    this.ws!.send(JSON.stringify({ type: 'SYNC_PULL' }));
    const res = await this.waitFor('SYNC_PUSH');
    applySnapshot(res.snapshot);
    this.markSynced(new Date().toISOString());
  }

  /**
   * Принять состояние облака как истину: сбросить dirty и забрать снимок.
   * Используется после парности и после восстановления по коду — там
   * данные аккаунта главнее того, что успело накопиться на этом устройстве.
   * Отдельный метод нужен именно потому, что syncNow() при dirty сначала
   * пушит, а здесь такой push затёр бы аккаунт локальной пустотой.
   */
  async adoptCloudState(): Promise<void> {
    this.markDirty(false);
    this.patch({ status: 'syncing', lastError: null });
    try {
      await this.pull();
      this.patch({ status: 'connected' });
    } catch (err) {
      const msg = describeNetworkError(err);
      this.patch({ status: 'error', lastError: msg });
      throw new Error(msg);
    }
  }

  /** Отправляет локальный снимок на сервер. */
  private async push(): Promise<void> {
    await this.connect();
    this.ws!.send(JSON.stringify({ type: 'SYNC_PUSH', snapshot: captureSnapshot() }));
    const res = await this.waitFor('SYNC_ACK');
    this.markDirty(false);
    this.markSynced(res.ts);
  }

  /**
   * Полный обмен. Если локально есть неотправленные правки — сначала
   * отдаём их, потом забираем серверное состояние. Иначе просто тянем.
   * Бросает исключение — вызывающий решает, показывать ли ошибку.
   */
  syncNow(): Promise<void> {
    if (this.inFlightSync) return this.inFlightSync;

    this.inFlightSync = (async () => {
      if (!getCredentials()) throw new Error('нет облачного аккаунта');
      this.patch({ status: 'syncing', lastError: null });
      try {
        if (this.state.pendingChanges) await this.push();
        await this.pull();
        this.patch({ status: 'connected' });
      } catch (err) {
        const msg = describeNetworkError(err);
        this.patch({ status: 'error', lastError: msg });
        if (this.started) this.scheduleReconnect();
        throw new Error(msg);
      }
    })().finally(() => { this.inFlightSync = null; });

    return this.inFlightSync;
  }

  disconnect(): void {
    if (this.ws) {
      const ws = this.ws;
      this.ws = null;
      ws.onclose = null;   // не запускаем реконнект на ручное отключение
      try { ws.close(); } catch { /* ignore */ }
    }
    this.patch({ status: 'idle' });
  }

  // ── Автосинк ─────────────────────────────────────────────────────────
  // pushDebounced() схлопывает быстрые серии мутаций в один push через N сек
  // тишины. Ошибку не показываем модально, но записываем в state — её видно
  // на экране SYNC, и dirty-флаг гарантирует, что правки уедут позже.

  pushDebounced(): void {
    // Помечаем dirty СРАЗУ, до всякой сети: если приложение закроют раньше,
    // чем сработает таймер, при следующем запуске правки всё равно уедут.
    this.markDirty(true);
    if (!getCredentials()) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null;
      void this.push().catch((err) => {
        const msg = describeNetworkError(err);
        this.patch({ status: 'error', lastError: msg });
        console.warn('[vps-sync] auto-push failed:', msg);
        if (this.started) this.scheduleReconnect();
      });
    }, DEBOUNCE_MS);
  }

  /**
   * Поднимает автосинк: стартовый обмен + реакция на возврат в фор,
   * появление сети и периодический тик. Идемпотентно.
   */
  /**
   * Есть ли локально хоть какие-то данные (не пустые списки).
   */
  private hasLocalData(): boolean {
    return SYNC_KEYS.some((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const trimmed = raw.trim();
      return trimmed !== '' && trimmed !== '[]' && trimmed !== '{}';
    });
  }

  /**
   * Первый запуск после обновления со сборки, где синка ещё не было.
   *
   * Ключи `kairo_sync_last_ts` / `kairo_sync_dirty` появились вместе с этим
   * сервисом, поэтому у обновившегося устройства их нет — и syncNow() решил
   * бы, что отдавать нечего, и начал бы с pull(). Для устройства, на котором
   * лежат единственные актуальные данные (типичный случай: ноутбук, откуда
   * задачи переносят на телефон), это означало бы затирание снимком из
   * облака. Поэтому «данные есть, а истории синка нет» считаем
   * несинхронизированными: стартовый обмен сначала отдаст их.
   */
  private adoptLegacyLocalData(): void {
    if (localStorage.getItem(LAST_SYNC_KEY)) return;   // уже синкались хоть раз
    if (this.state.pendingChanges) return;             // уже помечено
    if (!this.hasLocalData()) return;                  // нечего терять
    this.markDirty(true);
  }

  start(): () => void {
    if (this.started) return () => { /* уже запущен */ };
    this.started = true;
    this.adoptLegacyLocalData();

    const kick = () => {
      if (!getCredentials()) return;
      void this.syncNow().catch(() => { /* ошибка уже в state */ });
    };

    const onVisible = () => { if (document.visibilityState === 'visible') kick(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', kick);
    window.addEventListener('focus', kick);
    this.periodicTimer = setInterval(kick, PERIODIC_MS);

    kick();

    return () => {
      this.started = false;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', kick);
      window.removeEventListener('focus', kick);
      if (this.periodicTimer) { clearInterval(this.periodicTimer); this.periodicTimer = null; }
      if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    };
  }
}

const vpsSync = new VpsSyncService();
export default vpsSync;
