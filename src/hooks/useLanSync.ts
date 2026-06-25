import { useState, useEffect, useCallback, useRef } from 'react';
import lanSync, {
  isDesktopHost,
  isTauriEnv,
  type WsStatus,
} from '@/services/lan-sync.service';

// ── Серверный статус (хост) ───────────────────────────────────────────────

interface HostInfo {
  ip: string;
  port: number;
  peers: number;
}

export function useLanHostInfo() {
  const [info, setInfo] = useState<HostInfo | null>(null);

  const refresh = useCallback(async () => {
    if (!isTauriEnv()) return;
    try {
      const res = await invoke<HostInfo>('ws_status');
      setInfo(res);
    } catch { /* не Tauri или сервер не стартовал */ }
  }, []);

  useEffect(() => {
    refresh();
    // Обновляем счётчик пиров через Tauri-событие
    let unlisten: (() => void) | null = null;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<number>('ws-peers', (e) => {
        setInfo(prev => prev ? { ...prev, peers: e.payload } : prev);
      }).then(fn => { unlisten = fn; });
    });
    return () => { unlisten?.(); };
  }, [refresh]);

  return { info, refresh };
}

// ── Гостевое подключение (телефон) ────────────────────────────────────────

export function useLanGuest() {
  const [status, setStatus]   = useState<WsStatus>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const off = lanSync.onStatusChange(setStatus);
    return off;
  }, []);

  const connect = useCallback((ip: string) => {
    lanSync.connectGuest(ip);
  }, []);

  const disconnect = useCallback(() => {
    lanSync.disconnectGuest();
  }, []);

  const pull = useCallback(() => {
    lanSync.pullFromHost();
  }, []);

  const push = useCallback(() => {
    lanSync.pushToHost();
  }, []);

  useEffect(() => {
    const off = lanSync.on('SYNC_ACK', (msg) => {
      setLastSync((msg as any).ts ?? new Date().toISOString());
    });
    const off2 = lanSync.on('SYNC_PUSH', () => {
      setLastSync(new Date().toISOString());
    });
    return () => { off(); off2(); };
  }, []);

  return { status, lastSync, connect, disconnect, pull, push };
}

// ── Хостовая сторона (десктоп) ────────────────────────────────────────────

export function useLanHost() {
  const { info, refresh } = useLanHostInfo();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const initiated = useRef(false);

  useEffect(() => {
    if (!isDesktopHost() || initiated.current) return;
    initiated.current = true;
    lanSync.initHost();
    return () => { lanSync.destroyHost(); initiated.current = false; };
  }, []);

  useEffect(() => {
    const off = lanSync.on('SYNC_ACK', () => {
      setLastSync(new Date().toISOString());
      refresh();
    });
    const off2 = lanSync.on('HELLO', () => refresh());
    return () => { off(); off2(); };
  }, [refresh]);

  const pushAll = useCallback(() => lanSync.pushToAll(), []);

  return { info, lastSync, pushAll, refresh };
}

// ── Универсальный хук (определяет роль автоматически) ────────────────────

export function useLanSync() {
  const host = isDesktopHost();
  return { isHost: host };
}
