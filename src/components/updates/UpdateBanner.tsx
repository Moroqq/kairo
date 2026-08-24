import { useCallback, useEffect, useState } from 'react';
import { Download, X, Loader2, RefreshCw } from 'lucide-react';
import { check as pluginCheck, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { open } from '@tauri-apps/plugin-shell';
import {
  UPDATE_MANIFEST_URL, SERVER_HOST, fetchWithTimeout, describeNetworkError,
} from '@/lib/server';

/**
 * Гибридный updater. Причина: tauri-plugin-updater v2.10 не поддерживает
 * Android — check() кидает "Unsupported OS". Стратегия:
 * 1. Пробуем встроенный плагин (работает на Windows/macOS/Linux).
 * 2. Если он падает — идём ручным путём: fetch manifest, semver-сравнение,
 *    доставка через shell.open(url) — Android откроет URL в браузере,
 *    браузер скачает APK, тапнешь по уведомлению, Android спросит
 *    подтверждение установки.
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

/** Android ли мы. На Android доставка идёт через браузер + APK, на десктопе — через плагин. */
function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
}

/**
 * Достаёт ссылку под текущую платформу.
 * Раньше последним вариантом стоял `Object.values(p).find(...)` — то есть на
 * десктопе можно было получить ссылку на APK и «обновиться» в никуда.
 * Теперь берём только ключи своей платформы и честно падаем, если их нет.
 */
function pickPlatformUrl(p: Record<string, { url?: string } | undefined>): string | null {
  const androidKeys = ['android-aarch64', 'android-arm64', 'android-arm64-v8a', 'android-armv7', 'android-arm', 'android'];
  const desktopKeys = ['windows-x86_64', 'darwin-aarch64', 'darwin-x86_64', 'linux-x86_64'];
  const keys = isAndroid() ? androidKeys : desktopKeys;
  for (const k of keys) {
    const url = p[k]?.url;
    if (url) return url;
  }
  return null;
}

/** Ручной fallback — качаем latest.json сами и сравниваем версии. */
async function customCheck(): Promise<AvailableUpdate | null> {
  const res = await fetchWithTimeout(UPDATE_MANIFEST_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`манифест вернул HTTP ${res.status} (${UPDATE_MANIFEST_URL})`);
  const data = (await res.json()) as {
    version?: string;
    platforms?: Record<string, { url?: string }>;
  };
  if (!data.version) throw new Error('в манифесте нет поля version');
  if (!isNewer(data.version, __APP_VERSION__)) return null;

  const url = pickPlatformUrl(data.platforms ?? {});
  if (!url) throw new Error(`в манифесте нет сборки под эту платформу (${isAndroid() ? 'android' : 'desktop'})`);

  return { version: data.version, source: 'custom', downloadUrl: url };
}

/** Обёртка-таймаут поверх произвольного промиса — плагин тоже умеет висеть. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label}: нет ответа за ${Math.round(ms / 1000)} с`)), ms)),
  ]);
}

export async function checkNow(): Promise<void> {
  if (state.phase === 'checking' || state.phase === 'downloading' || state.phase === 'installing') return;
  setState({ phase: 'checking', errorMsg: null });
  // 1. Сначала пробуем встроенный плагин
  try {
    const u = await withTimeout(pluginCheck(), 20000, 'плагин апдейтера');
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
      const msg = describeNetworkError(customErr);
      const pluginMsg = describeNetworkError(pluginErr);
      // Обе ветки упали на сети → это не баг клиента, а недоступный хост.
      const bothNetwork = msg.includes(SERVER_HOST) && pluginMsg.includes(SERVER_HOST);
      setState({
        phase: 'error',
        errorMsg: bothNetwork
          ? `${SERVER_HOST} не отвечает. Проверь, что сервер поднят и что домен указывает на его текущий IP.`
          : `${msg} · плагин: ${pluginMsg}`,
      });
    }
  }
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
    // Android: открываем URL — браузер скачает APK, Android спросит установку.
    setState({ phase: 'installing', errorMsg: null });
    try {
      await open(u.downloadUrl);
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
