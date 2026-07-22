import { useCallback, useEffect, useState } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

type Phase = 'hidden' | 'available' | 'downloading' | 'installing' | 'done' | 'error';

/**
 * Проверяет наличие обновления при монтировании (по manifest'у
 * `plugins.updater.endpoints` из tauri.conf.json), рендерит баннер если
 * версия новее. Кнопка «Обновить» — скачивает + ставит + перезапускает.
 * Полностью no-op в браузере (плагин недоступен вне Tauri).
 */
export function UpdateBanner() {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number | null }>({ done: 0, total: null });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await check();
        if (cancelled) return;
        if (u) {
          setUpdate(u);
          setPhase('available');
        }
      } catch {
        // Плагин недоступен или сеть — молча ничего не показываем.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const doUpdate = useCallback(async () => {
    if (!update) return;
    setPhase('downloading');
    setErrorMsg(null);
    try {
      let total: number | null = null;
      let done = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? null;
          setProgress({ done: 0, total });
        } else if (event.event === 'Progress') {
          done += event.data.chunkLength;
          setProgress({ done, total });
        } else if (event.event === 'Finished') {
          setPhase('installing');
        }
      });
      setPhase('done');
      // На десктопе — перезапускаем сами. На Android процесс перезапускается
      // системой после установки, relaunch() тихо no-op.
      try { await relaunch(); } catch { /* ignore */ }
    } catch (e) {
      setPhase('error');
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  }, [update]);

  if (phase === 'hidden' || !update) return null;

  const humanSize = (b: number) => `${(b / (1024 * 1024)).toFixed(1)} МБ`;
  const pct = progress.total ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : null;

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
      {phase === 'available' && (
        <div className="flex items-center justify-between gap-3">
          <span style={{ color: 'var(--text-muted, #999)' }}>
            есть новая версия <b style={{ color: 'var(--text-1, #eee)' }}>v{update.version}</b>
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
              onClick={() => setPhase('hidden')}
              className="px-2"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              aria-label="закрыть"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {phase === 'downloading' && (
        <div className="flex items-center gap-3">
          <Loader2 size={14} className="animate-spin" />
          <span style={{ color: 'var(--text-muted, #999)' }}>
            скачивание {humanSize(progress.done)}{progress.total ? ` из ${humanSize(progress.total)}` : ''}
            {pct !== null ? ` — ${pct}%` : ''}
          </span>
        </div>
      )}
      {phase === 'installing' && (
        <div className="flex items-center gap-3">
          <Loader2 size={14} className="animate-spin" />
          <span style={{ color: 'var(--text-muted, #999)' }}>установка…</span>
        </div>
      )}
      {phase === 'done' && (
        <div style={{ color: 'var(--text-muted, #999)' }}>
          готово. перезапуск…
        </div>
      )}
      {phase === 'error' && (
        <div className="flex items-center justify-between gap-3">
          <span style={{ color: 'var(--danger, #ef4444)' }}>
            ошибка обновления: {errorMsg}
          </span>
          <button
            onClick={() => setPhase('hidden')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
