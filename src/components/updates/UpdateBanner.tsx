import { useCallback, useEffect, useState } from 'react';
import { Download, X, Loader2, RefreshCw } from 'lucide-react';
import { check as pluginCheck, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { open } from '@tauri-apps/plugin-shell';

/**
 * Гибридный updater. Причина: tauri-plugin-updater v2.10 не поддерживает
 * Android — check() кидает "Unsupported OS". Стратегия:
 * 1. Пробуем встроенный плагин (работает на Windows/macOS/Linux).
 * 2. Если он падает — идём ручным путём: fetch manifest, semver-сравнение,
 *    доставка через shell.open(url) — Android откроет URL в браузере,
 *    браузер скачает APK, тапнешь по уведомлению, Android спросит
 *    подтверждение установки.
 */

type Phase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'no-update'
  | 'downloading'
  | 'installing'
  | 'done'
  | 'error';

type Source = 'plugin' | 'custom';

interface AvailableUpdate {
  version: string;
  source: Source;
  pluginUpdate?: Update;   // только для source='plugin'
  downloadUrl?: string;    // только для source='custom'
}

export interface BannerState {
  phase: Phase;
  update: AvailableUpdate | null;
  errorMsg: string | null;
  progress: { done: number; total: number | null };
}

type Listener = (s: BannerState) => void;

let state: BannerState = { phase: 'idle', update: null, errorMsg: null, progress: { done: 0, total: null } };
const listeners = new Set<Listener>();
const setState = (patch: Partial<BannerState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
};

const MANIFEST_URL = 'https://kairogoupyrlife.duckdns.org/update/latest.json';

/** Сравнение семверов X.Y.Z. Возвращает true если a > b. */
function isNewer(a: string, b: string): boolean {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0, y = pb[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

/** Ручной fallback — качаем latest.json сами и сравниваем версии. */
async function customCheck(): Promise<AvailableUpdate | null> {
  const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`manifest_http_${res.status}`);
  const data = (await res.json()) as {
    version?: string;
    platforms?: Record<string, { url?: string }>;
  };
  if (!data.version) throw new Error('manifest_no_version');
  if (!isNewer(data.version, __APP_VERSION__)) return null;

  // Ищем подходящий URL. На Android любой из android-* ключей содержит
  // одну и ту же APK-ссылку — берём первый попавшийся.
  const p = data.platforms ?? {};
  const url =
    p['android-aarch64']?.url ||
    p['android-arm64']?.url ||
    p['android-arm64-v8a']?.url ||
    p['android-armv7']?.url ||
    p['android-arm']?.url ||
    p['android']?.url ||
    Object.values(p).find((v) => v?.url)?.url;
  if (!url) throw new Error('manifest_no_platform_url');

  return { version: data.version, source: 'custom', downloadUrl: url };
}

export async function checkNow(): Promise<void> {
  setState({ phase: 'checking', errorMsg: null });
  // 1. Сначала пробуем встроенный плагин
  try {
    const u = await pluginCheck();
    if (u) {
      setState({ phase: 'available', update: { version: u.version, source: 'plugin', pluginUpdate: u } });
      return;
    }
    setState({ phase: 'no-update' });
    return;
  } catch (pluginErr) {
    // 2. Если плагин не поддерживает эту платформу (Android) — идём вручную
    try {
      const u = await customCheck();
      if (u) setState({ phase: 'available', update: u });
      else setState({ phase: 'no-update' });
    } catch (customErr) {
      const msg = customErr instanceof Error ? customErr.message : String(customErr);
      const pluginMsg = pluginErr instanceof Error ? pluginErr.message : String(pluginErr);
      setState({ phase: 'error', errorMsg: `${msg} · plugin: ${pluginMsg}` });
    }
  }
}

export function useBannerState(): BannerState {
  const [s, setS] = useState<BannerState>(state);
  useEffect(() => {
    listeners.add(setS);
    return () => { listeners.delete(setS); };
  }, []);
  return s;
}

export function UpdateBanner() {
  const s = useBannerState();

  useEffect(() => { checkNow(); }, []);

  const doUpdate = useCallback(async () => {
    if (!s.update) return;
    if (s.update.source === 'custom' && s.update.downloadUrl) {
      // Android: открываем URL — браузер скачает APK, Android спросит установку.
      setState({ phase: 'installing' });
      try {
        await open(s.update.downloadUrl);
        setState({ phase: 'done' });
      } catch (e) {
        setState({ phase: 'error', errorMsg: e instanceof Error ? e.message : String(e) });
      }
      return;
    }
    // Desktop: обычный поток через плагин
    if (!s.update.pluginUpdate) return;
    setState({ phase: 'downloading', errorMsg: null, progress: { done: 0, total: null } });
    try {
      let total: number | null = null;
      let done = 0;
      await s.update.pluginUpdate.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? null;
          setState({ progress: { done: 0, total } });
        } else if (event.event === 'Progress') {
          done += event.data.chunkLength;
          setState({ progress: { done, total } });
        } else if (event.event === 'Finished') {
          setState({ phase: 'installing' });
        }
      });
      setState({ phase: 'done' });
      try { await relaunch(); } catch { /* Android не поддерживает */ }
    } catch (e) {
      setState({ phase: 'error', errorMsg: e instanceof Error ? e.message : String(e) });
    }
  }, [s.update]);

  if (s.phase === 'idle' || s.phase === 'no-update') return null;

  const humanSize = (b: number) => `${(b / (1024 * 1024)).toFixed(1)} МБ`;
  const pct = s.progress.total ? Math.min(100, Math.round((s.progress.done / s.progress.total) * 100)) : null;

  return (
    <div
      className="fixed z-50 font-mono"
      style={{
        left: 12, right: 12, bottom: 12, maxWidth: 440, margin: '0 auto',
        background: 'var(--well-bg, #101010)', border: '1px solid var(--border, #333)',
        padding: '10px 12px', fontSize: 12, color: 'var(--text-1, #eee)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      {s.phase === 'checking' && (
        <div className="flex items-center gap-3">
          <Loader2 size={14} className="animate-spin" />
          <span style={{ color: 'var(--text-muted, #999)' }}>проверяю обновления…</span>
        </div>
      )}
      {s.phase === 'available' && s.update && (
        <div className="flex items-center justify-between gap-3">
          <span style={{ color: 'var(--text-muted, #999)' }}>
            есть новая версия <b style={{ color: 'var(--text-1, #eee)' }}>v{s.update.version}</b>
          </span>
          <div className="flex gap-2">
            <button
              onClick={doUpdate}
              className="flex items-center gap-1 px-3 py-1 rounded"
              style={{ background: 'var(--accent-bg, #14b8a6)', color: 'var(--accent-text, #000)', border: 'none', cursor: 'pointer' }}
            >
              <Download size={12} /> обновить
            </button>
            <button
              onClick={() => setState({ phase: 'idle' })}
              className="px-2"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              aria-label="закрыть"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {s.phase === 'downloading' && (
        <div className="flex items-center gap-3">
          <Loader2 size={14} className="animate-spin" />
          <span style={{ color: 'var(--text-muted, #999)' }}>
            скачивание {humanSize(s.progress.done)}{s.progress.total ? ` из ${humanSize(s.progress.total)}` : ''}
            {pct !== null ? ` — ${pct}%` : ''}
          </span>
        </div>
      )}
      {s.phase === 'installing' && (
        <div className="flex items-center gap-3">
          <Loader2 size={14} className="animate-spin" />
          <span style={{ color: 'var(--text-muted, #999)' }}>
            {s.update?.source === 'custom' ? 'открываю установщик…' : 'установка…'}
          </span>
        </div>
      )}
      {s.phase === 'done' && (
        <div style={{ color: 'var(--text-muted, #999)' }}>
          {s.update?.source === 'custom'
            ? 'браузер начал скачивание. подтверди установку когда закончится.'
            : 'готово. перезапуск…'}
        </div>
      )}
      {s.phase === 'error' && (
        <div className="flex items-start justify-between gap-3">
          <div style={{ color: 'var(--danger, #ef4444)', wordBreak: 'break-word' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>ошибка апдейтера</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{s.errorMsg}</div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={checkNow}
              className="px-2"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              aria-label="повторить"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setState({ phase: 'idle' })}
              className="px-2"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              aria-label="закрыть"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
