import { useCallback, useEffect, useState } from 'react';
import { Download, X, Loader2, RefreshCw } from 'lucide-react';
import { check as pluginCheck, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { openUrl } from '@tauri-apps/plugin-opener';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { isTauri } from '@tauri-apps/api/core';
import {
  UPDATE_MANIFEST_URL, SERVER_HOST, fetchWithTimeout, describeNetworkError,
} from '@/lib/server';
import {
  isNewer, pickPlatformEntry, chooseDelivery, describeMissingPlatform,
  type UpdateManifest,
} from '@/lib/update-manifest';

/**
 * Гибридный updater: два способа доставки одного и того же релиза.
 *
 * `plugin` — tauri-plugin-updater: качает и ставит внутри приложения, сам
 * перезапускается. Требует подписанного релиза и не работает на Android
 * (check() кидает «Unsupported OS»).
 *
 * `browser` — открываем ссылку системным браузером, дальше человек запускает
 * установщик сам. Работает везде и не требует приватного ключа для подписи.
 *
 * Выбор между ними делает chooseDelivery по содержимому манифеста, а не
 * методом проб: подписи нет — плагин даже не дёргаем. Раньше он вызывался
 * первым всегда, и на десктопе без записи в манифесте пользователь получал
 * его внутреннюю жалобу вместо внятной причины.
 *
 * Оба пути ходят на один и тот же хост (см. lib/server.ts). Если он лежит —
 * не работает ни проверка обновлений, ни синк; поэтому в тексте ошибки
 * всегда называем хост, чтобы было понятно, что чинить.
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

/**
 * Открыть ссылку во внешнем браузере.
 *
 * Почему не просто shell.open: на Android он падает с
 * «Scoped shell IO error: No such file or directory (os error 2)» — плагин
 * пытается запустить системный xdg-open, которого в Android нет. Из-за
 * этого обновление находилось и предлагалось, но нажатие на «обновить»
 * ничего не открывало: скачать APK было нечем.
 *
 * plugin-opener для той же задачи уходит в Android Intent и работает на
 * всех платформах. shell оставлен запасным путём — на случай сборки, где
 * opener не зарегистрирован; ошибку наружу отдаём от opener, она точнее.
 */
async function openExternal(url: string): Promise<void> {
  try {
    await openUrl(url);
  } catch (openerErr) {
    try {
      await shellOpen(url);
    } catch {
      throw openerErr;
    }
  }
}

/** Android ли мы. На Android плагина апдейтера нет вовсе — только доставка через браузер. */
function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
}

/** Скачивает и разбирает latest.json. Единственный источник правды о релизе. */
async function fetchManifest(): Promise<UpdateManifest> {
  const res = await fetchWithTimeout(UPDATE_MANIFEST_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`манифест вернул HTTP ${res.status} (${UPDATE_MANIFEST_URL})`);
  return (await res.json()) as UpdateManifest;
}

/** Обёртка-таймаут поверх произвольного промиса — плагин тоже умеет висеть. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label}: нет ответа за ${Math.round(ms / 1000)} с`)), ms)),
  ]);
}

/**
 * Проверка обновления.
 *
 * Порядок важен и отличается от прежнего. Раньше первым дёргался плагин, и
 * когда в манифесте не было записи под десктоп, пользователь видел его
 * внутреннюю жалобу «None of the fallback platforms were found» вперёд
 * настоящей причины. Теперь манифест читаем сами: он и решает, есть ли
 * обновление и как его ставить, а плагин — лишь один из способов доставки.
 */
export async function checkNow(): Promise<void> {
  if (state.phase === 'checking' || state.phase === 'downloading' || state.phase === 'installing') return;
  // В обычном браузере (веб-деплой на Vercel) обновлять нечего: страница и так
  // всегда свежая. Без этой проверки веб-версия на каждой загрузке показывала
  // «ошибка апдейтера» — плагин там недоступен в принципе.
  if (!isTauri()) {
    setState({ phase: 'no-update', errorMsg: null });
    return;
  }
  setState({ phase: 'checking', errorMsg: null });

  let manifest: UpdateManifest;
  try {
    manifest = await fetchManifest();
  } catch (err) {
    const msg = describeNetworkError(err);
    setState({
      phase: 'error',
      errorMsg: msg.includes(SERVER_HOST)
        ? `${SERVER_HOST} не отвечает. Проверь, что сервер поднят и что домен указывает на его текущий IP.`
        : msg,
    });
    return;
  }

  if (!manifest.version) {
    setState({ phase: 'error', errorMsg: 'в манифесте нет поля version' });
    return;
  }
  if (!isNewer(manifest.version, __APP_VERSION__)) {
    setState({ phase: 'no-update' });
    return;
  }

  const android = isAndroid();
  const entry = pickPlatformEntry(manifest.platforms ?? {}, android);
  if (!entry) {
    setState({ phase: 'error', errorMsg: describeMissingPlatform(manifest, android) });
    return;
  }

  // Подписанный десктопный релиз ставим плагином — внутри приложения, с
  // проверкой подписи и перезапуском. Если он почему-то не справился,
  // это не повод показывать ошибку: ниже есть рабочий путь через браузер.
  if (chooseDelivery(entry, android) === 'plugin') {
    try {
      const u = await withTimeout(pluginCheck(), 20000, 'плагин апдейтера');
      if (u) {
        setState({ phase: 'available', update: { version: u.version, source: 'plugin', pluginUpdate: u } });
        return;
      }
    } catch (err) {
      console.warn('[updater] плагин не справился, ставим через браузер:', err);
    }
  }

  setState({
    phase: 'available',
    update: { version: manifest.version, source: 'custom', downloadUrl: entry.url },
  });
}

/**
 * Запуск установки найденного обновления. Вынесено из компонента, чтобы
 * кнопку «обновить» можно было нажать не только в баннере (см. SyncPage) —
 * раньше строка на экране SYNC умела только перепроверять, а поставить
 * обновление было нечем, если баннер закрыли крестиком.
 */
export async function startUpdate(): Promise<void> {
  const u = state.update;
  if (!u) return;

  if (u.source === 'custom' && u.downloadUrl) {
    // Открываем URL системным браузером: он скачает APK или установщик,
    // дальше система сама предложит установку.
    setState({ phase: 'installing', errorMsg: null });
    try {
      await openExternal(u.downloadUrl);
      setState({ phase: 'done' });
    } catch (e) {
      setState({ phase: 'error', errorMsg: describeNetworkError(e) });
    }
    return;
  }

  // Desktop: обычный поток через плагин
  if (!u.pluginUpdate) return;
  setState({ phase: 'downloading', errorMsg: null, progress: { done: 0, total: null } });
  try {
    let total: number | null = null;
    let done = 0;
    await u.pluginUpdate.downloadAndInstall((event) => {
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
    setState({ phase: 'error', errorMsg: describeNetworkError(e) });
  }
}

export function useBannerState(): BannerState {
  const [s, setS] = useState<BannerState>(state);
  useEffect(() => {
    listeners.add(setS);
    // Состояние модульное и живёт дольше компонента — подтягиваем актуальное
    // на случай, если оно менялось, пока этот компонент был размонтирован.
    setS(state);
    return () => { listeners.delete(setS); };
  }, []);
  return s;
}

export function UpdateBanner() {
  const s = useBannerState();

  useEffect(() => { void checkNow(); }, []);

  const doUpdate = useCallback(() => { void startUpdate(); }, []);

  if (s.phase === 'idle' || s.phase === 'no-update') return null;

  const humanSize = (b: number) => `${(b / (1024 * 1024)).toFixed(1)} МБ`;
  const pct = s.progress.total ? Math.min(100, Math.round((s.progress.done / s.progress.total) * 100)) : null;

  return (
    <div
      className="fixed z-50 font-mono"
      style={{
        left: 12, right: 12, bottom: 12, maxWidth: 440, margin: '0 auto',
        background: 'var(--overlay-bg)', border: '1px solid var(--border)',
        padding: '10px 12px', fontSize: 12, color: 'var(--text-primary)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      {s.phase === 'checking' && (
        <div className="flex items-center gap-3">
          <Loader2 size={14} className="animate-spin" />
          <span style={{ color: 'var(--text-muted)' }}>проверяю обновления…</span>
        </div>
      )}
      {s.phase === 'available' && s.update && (
        <div className="flex items-center justify-between gap-3">
          <span style={{ color: 'var(--text-muted)' }}>
            есть новая версия <b style={{ color: 'var(--text-primary)' }}>v{s.update.version}</b>
          </span>
          <div className="flex gap-2">
            <button
              onClick={doUpdate}
              className="flex items-center gap-1 px-3 py-1 rounded"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)', border: 'none', cursor: 'pointer' }}
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
          <span style={{ color: 'var(--text-muted)' }}>
            скачивание {humanSize(s.progress.done)}{s.progress.total ? ` из ${humanSize(s.progress.total)}` : ''}
            {pct !== null ? ` — ${pct}%` : ''}
          </span>
        </div>
      )}
      {s.phase === 'installing' && (
        <div className="flex items-center gap-3">
          <Loader2 size={14} className="animate-spin" />
          <span style={{ color: 'var(--text-muted)' }}>
            {s.update?.source === 'custom' ? 'открываю установщик…' : 'установка…'}
          </span>
        </div>
      )}
      {s.phase === 'done' && (
        <div style={{ color: 'var(--text-muted)' }}>
          {s.update?.source === 'custom'
            ? 'браузер начал скачивание. подтверди установку когда закончится.'
            : 'готово. перезапуск…'}
        </div>
      )}
      {s.phase === 'error' && (
        <div className="flex items-start justify-between gap-3">
          <div style={{ color: 'var(--danger)', wordBreak: 'break-word' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>ошибка апдейтера</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{s.errorMsg}</div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => { void checkNow(); }}
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
