import { useCallback, useEffect, useState } from 'react';
import { Download, X, Loader2, RefreshCw } from 'lucide-react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

type Phase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'no-update'
  | 'downloading'
  | 'installing'
  | 'done'
  | 'error';

/**
 * Проверяет наличие обновления. При старте — тихо. Если версия новее —
 * снизу баннер "есть новая версия" с кнопкой. Также экспортирует хук
 * useUpdateCheck() чтобы SyncPage мог триггерить перепроверку вручную
 * (с видимым результатом — успех / нет обнов / ошибка).
 */

// Единый store-в-модуле: SyncPage дёргает checkNow(), баннер реагирует.
type Listener = (state: BannerState) => void;
export interface BannerState {
  phase: Phase;
  update: Update | null;
  errorMsg: string | null;
  progress: { done: number; total: number | null };
}

let state: BannerState = { phase: 'idle', update: null, errorMsg: null, progress: { done: 0, total: null } };
const listeners = new Set<Listener>();
const setState = (patch: Partial<BannerState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
};

export async function checkNow(): Promise<void> {
  setState({ phase: 'checking', errorMsg: null });
  try {
    const u = await check();
    if (u) setState({ phase: 'available', update: u });
    else setState({ phase: 'no-update' });
  } catch (e) {
    setState({ phase: 'error', errorMsg: e instanceof Error ? e.message : String(e) });
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

  useEffect(() => {
    // Автопроверка при старте — тихая: если ничего нет, баннер не рендерится.
    checkNow();
  }, []);

  const doUpdate = useCallback(async () => {
    if (!s.update) return;
    setState({ phase: 'downloading', errorMsg: null, progress: { done: 0, total: null } });
    try {
      let total: number | null = null;
      let done = 0;
      await s.update.downloadAndInstall((event) => {
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
      try { await relaunch(); } catch { /* Android перезапускается сам */ }
    } catch (e) {
      setState({ phase: 'error', errorMsg: e instanceof Error ? e.message : String(e) });
    }
  }, [s.update]);

  // 'idle' и 'no-update' — ничего не рендерим (кроме случая когда SyncPage
  // сам хочет показать статус — там своя UI).
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
          <span style={{ color: 'var(--text-muted, #999)' }}>установка…</span>
        </div>
      )}
      {s.phase === 'done' && (
        <div style={{ color: 'var(--text-muted, #999)' }}>готово. перезапуск…</div>
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
