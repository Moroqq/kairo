import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';
import { QrCode, Camera, X, Loader2, RefreshCw } from 'lucide-react';
import { useAccountStore } from '@/stores/account.store';
import { useTheme } from '@/stores/theme.store';
import { useToast } from '@/components/ui/Toast';
import {
  startPairing, waitForPairing, approvePairing, type PairingIntent,
} from '@/lib/account';
import { isTauri } from '@tauri-apps/api/core';
import vpsSync, { type VpsSyncState } from '@/services/vps-sync.service';
import { checkNow, startUpdate, useBannerState } from '@/components/updates/UpdateBanner';

// ── Мелкие UI-хелперы (используются только здесь) ───────────────────────

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="font-mono" style={{ fontSize: 15, letterSpacing: 2, color: 'var(--text-primary)' }}>
        {title}
      </div>
      {subtitle && (
        <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>
      )}
    </div>
  );
}

function Card({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <section
      className="font-mono mb-3"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--well-bg)',
        opacity: dim ? 0.55 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      {children}
    </section>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
      ▸ {children}
    </div>
  );
}

function ActionRow({ icon, label, desc, onClick, disabled = false }: {
  icon: React.ReactNode; label: string; desc?: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-start gap-3 text-left px-3 py-3 rounded"
      style={{
        background: 'transparent',
        border: '1px solid transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ color: 'var(--text-primary)', marginTop: 2 }}>{icon}</span>
      <span className="flex-1">
        <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{label}</span>
        {desc && (
          <span className="block" style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{desc}</span>
        )}
      </span>
    </button>
  );
}

// ── Экран без аккаунта ─────────────────────────────────────────────────

function UnpairedView() {
  const createNewAccount = useAccountStore((s) => s.createNewAccount);
  const recoverWithCode = useAccountStore((s) => s.recoverWithCode);
  const refreshAfterPairing = useAccountStore((s) => s.refreshAfterPairing);
  const { toast } = useToast();

  const [intent, setIntent] = useState<PairingIntent | null>(null);
  const [status, setStatus] = useState<'idle' | 'waiting' | 'busy'>('idle');
  const [code, setCode] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopRef = useRef(false);
  const theme = useTheme();   // смена темы → перерисовать QR в новых цветах

  const startWait = useCallback(async () => {
    setStatus('busy');
    stopRef.current = false;
    try {
      const it = await startPairing();
      setIntent(it);
      setStatus('waiting');
      // Long-poll loop
      while (!stopRef.current) {
        const res = await waitForPairing(it.intentId);
        if (stopRef.current) return;
        if (res.status === 'approved') {
          refreshAfterPairing();
          toast('Устройство подключено');
          return;
        }
        if (res.status === 'expired' || res.status === 'not_found') {
          // Автоматически создаём новый intent
          const fresh = await startPairing();
          setIntent(fresh);
          continue;
        }
        // pending → просто снова полим
      }
    } catch (err) {
      toast('Не удалось получить код. Проверь интернет.', 'error');
      setStatus('idle');
    }
  }, [refreshAfterPairing, toast]);

  const cancelWait = useCallback(() => {
    stopRef.current = true;
    setStatus('idle');
    setIntent(null);
  }, []);

  useEffect(() => {
    if (!intent || !canvasRef.current) return;
    // QR рисуем ПОД тему. Раньше цвета были зашиты (`dark: '#F5F5F5'` на
    // прозрачном фоне) — на светлых темах (paper/claude/snow) получался
    // почти белый код на белой карточке: глазами не видно, камерой не
    // читается. qrcode не понимает CSS-переменные, поэтому берём уже
    // вычисленные значения темы и всегда даём коду непрозрачную подложку.
    const css = getComputedStyle(document.documentElement);
    const dark = css.getPropertyValue('--text-primary').trim() || '#111111';
    const light = css.getPropertyValue('--bg-surface').trim() || '#FFFFFF';
    QRCode.toCanvas(canvasRef.current, intent.intentId, {
      width: 220, margin: 2, color: { dark, light },
    }).catch(() => {});
  }, [intent, theme]);

  useEffect(() => () => { stopRef.current = true; }, []);

  const handleCreate = useCallback(async () => {
    setStatus('busy');
    try {
      await createNewAccount();
      toast('Новый облачный аккаунт создан');
    } catch {
      toast('Не удалось создать аккаунт — сервер недоступен', 'error');
      setStatus('idle');
    }
  }, [createNewAccount, toast]);

  const handleRecover = useCallback(async () => {
    const c = code.trim();
    if (!c) return;
    setStatus('busy');
    try {
      await recoverWithCode(c);
      toast('Восстановление успешно');
      setCode('');
    } catch (e) {
      const err = e instanceof Error ? e.message : 'unknown';
      const msg =
        err === 'too_many_attempts' ? 'Слишком много попыток. Подожди и попробуй ещё.' :
        err === 'recovery_code_not_found' ? 'Код не подходит' :
        err === 'invalid_recovery_code_format' ? 'Неверный формат кода' :
        'Не удалось восстановить';
      toast(msg, 'error');
      setStatus('idle');
    }
  }, [code, recoverWithCode, toast]);

  const busy = status === 'busy';

  return (
    <>
      <Header title="SYNC" subtitle="облако · подключение устройства" />

      {/* Основной сценарий: показать QR, ждать одобрения */}
      <Card>
        <CardTitle>ПОДКЛЮЧИТЬ К СУЩЕСТВУЮЩЕМУ АККАУНТУ</CardTitle>
        <div className="p-4">
          {status === 'idle' && (
            <>
              <p className="font-mono mb-3" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Открой Kairo на устройстве, где уже настроен облачный аккаунт,
                нажми «подключить новое устройство» и сосканируй QR ниже.
              </p>
              <button
                onClick={startWait}
                disabled={busy}
                className="w-full font-mono py-3 rounded"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)', border: 'none', cursor: 'pointer', boxShadow: '0 0 12px var(--accent-glow)' }}
              >
                <QrCode size={14} style={{ display: 'inline', marginRight: 8 }} />
                показать QR для сканирования
              </button>
            </>
          )}
          {status === 'waiting' && intent && (
            <div className="flex flex-col items-center gap-2">
              <canvas ref={canvasRef} style={{ imageRendering: 'pixelated' }} />
              <div className="font-mono flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <Loader2 size={12} className="animate-spin" /> ждём одобрения…
              </div>
              <button
                onClick={cancelWait}
                className="font-mono text-xs"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px' }}
              >
                отмена
              </button>
            </div>
          )}
          {status === 'busy' && !intent && (
            <div className="flex items-center gap-2 justify-center py-4" style={{ color: 'var(--text-muted)' }}>
              <Loader2 size={14} className="animate-spin" /> <span className="font-mono text-xs">…</span>
            </div>
          )}
        </div>
      </Card>

      {/* Первое устройство: создать аккаунт */}
      <Card dim={status !== 'idle'}>
        <CardTitle>ПЕРВОЕ УСТРОЙСТВО</CardTitle>
        <div className="p-4">
          <p className="font-mono mb-3" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Если Kairo с облаком у тебя ещё нигде не настроен — создай новый аккаунт здесь.
          </p>
          <button
            onClick={handleCreate}
            disabled={busy}
            className="w-full font-mono py-3 rounded"
            style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            создать облачный аккаунт
          </button>
        </div>
      </Card>

      {/* Восстановление */}
      <div className="mt-6">
        <button
          onClick={() => setShowRecovery((v) => !v)}
          className="font-mono text-xs"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
        >
          {showRecovery ? '▾ ' : '▸ '}потерял все устройства?
        </button>
        {showRecovery && (
          <Card>
            <div className="p-4">
              <p className="font-mono mb-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Введи 6-символьный код восстановления. Старые аккаунты
                с 12-словной фразой тоже принимаются.
              </p>
              <div className="flex flex-col gap-2">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="XXXXXX или 12 слов через пробел"
                  rows={2}
                  className="w-full font-mono px-3 py-2 rounded"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 14, resize: 'vertical' }}
                />
                <button
                  onClick={handleRecover}
                  disabled={busy || !code.trim()}
                  className="font-mono py-2 rounded"
                  style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  войти
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

// ── Экран с аккаунтом ──────────────────────────────────────────────────

/** Подписка на реальное состояние синка (а не на «всё хорошо» по факту наличия токена). */
function useSyncState(): VpsSyncState {
  const [s, setS] = useState<VpsSyncState>(() => vpsSync.getState());
  useEffect(() => vpsSync.subscribe(setS), []);
  return s;
}

function SyncStatusCard() {
  const s = useSyncState();
  const { toast } = useToast();
  const busy = s.status === 'syncing' || s.status === 'connecting';

  const label: Record<VpsSyncState['status'], string> = {
    idle:       'не подключено',
    connecting: 'подключаюсь…',
    connected:  'облако подключено',
    syncing:    'синхронизирую…',
    error:      'нет связи с облаком',
  };
  const tone =
    s.status === 'error' ? 'var(--danger)' :
    s.status === 'connected' ? 'var(--accent)' :
    'var(--text-secondary)';
  const mark = s.status === 'error' ? '✕' : s.status === 'connected' ? '✓' : '·';

  const handleSync = useCallback(async () => {
    try {
      await vpsSync.syncNow();
      toast('Синхронизировано');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Синхронизация не удалась', 'error');
    }
  }, [toast]);

  return (
    <Card>
      <div className="px-4 py-3 font-mono">
        <div className="flex items-center gap-2" style={{ fontSize: 13, color: tone }}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <span>{mark}</span>}
          {label[s.status]}
        </div>

        {s.lastSyncTs && (
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
            последний синк: {new Date(s.lastSyncTs).toLocaleString('ru-RU')}
          </div>
        )}
        {s.pendingChanges && (
          <div style={{ color: 'var(--warning)', fontSize: 11, marginTop: 4 }}>
            есть изменения, ещё не уехавшие в облако
          </div>
        )}
        {s.lastError && (
          <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4, wordBreak: 'break-word' }}>
            {s.lastError}
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={busy}
          className="w-full font-mono py-2 rounded flex items-center justify-center gap-2"
          style={{
            marginTop: 10, background: 'transparent', color: 'var(--text-primary)',
            border: '1px solid var(--border)', cursor: busy ? 'wait' : 'pointer',
            fontSize: 12, opacity: busy ? 0.6 : 1,
          }}
        >
          <RefreshCw size={12} className={busy ? 'animate-spin' : undefined} />
          синхронизировать сейчас
        </button>
      </div>
    </Card>
  );
}

function PairedView() {
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <>
      <Header title="SYNC" subtitle="облако · автоматический" />

      <SyncStatusCard />

      <Card>
        <CardTitle>ДОБАВИТЬ ЕЩЁ УСТРОЙСТВО</CardTitle>
        <div className="p-4">
          <button
            onClick={() => setScannerOpen(true)}
            className="w-full font-mono py-3 rounded"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)', border: 'none', cursor: 'pointer', boxShadow: '0 0 12px var(--accent-glow)' }}
          >
            <Camera size={14} style={{ display: 'inline', marginRight: 8 }} />
            подключить новое устройство
          </button>
        </div>
      </Card>

      <Card>
        <div className="px-4 py-3 font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Синхронизация автоматическая: изменения уходят в облако через
          пару секунд после того как ты замер, а при открытии приложения
          и возврате из фона данные подтягиваются сами. Кнопка выше — для
          случая «хочу прямо сейчас и хочу видеть результат».
        </div>
      </Card>

      {scannerOpen && <ScannerModal onClose={() => setScannerOpen(false)} />}
    </>
  );
}

// ── Модалка со сканером ────────────────────────────────────────────────

function ScannerModal({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const s = new QrScanner(
      video,
      async (result) => {
        if (handledRef.current) return;
        handledRef.current = true;
        // ВАЖНО: останавливаем сканер сразу после первой ловли, чтобы
        // при ошибке не тыкали approve каждый кадр (иначе получаем 6 тостов).
        try { s.stop(); } catch { /* ignore */ }
        setApproving(true);
        try {
          await approvePairing(result.data);
          toast('Новое устройство подключено');
          onClose();
        } catch (e) {
          const err = e instanceof Error ? e.message : 'unknown';
          const msg =
            err === 'intent_expired' ? 'Код устарел. Попроси у нового устройства свежий.' :
            err === 'intent_already_approved' ? 'Этот код уже использован.' :
            err === 'intent_not_found' ? 'Код не найден.' :
            'Не удалось подключить устройство';
          toast(msg, 'error');
          setApproving(false);
          // Закрываем модалку — пусть пользователь откроет её заново и попробует ещё раз.
          onClose();
        }
      },
      { highlightScanRegion: true, highlightCodeOutline: true },
    );
    scannerRef.current = s;
    s.start().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
    });
    return () => { s.stop(); s.destroy(); };
  }, [onClose, toast]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="font-mono"
        style={{ background: 'var(--panel-bg, #101010)', border: '1px solid var(--border)', maxWidth: 380, width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>СКАНИРОВАНИЕ QR</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
        <div className="p-3" style={{ position: 'relative' }}>
          {error ? (
            <div className="text-sm p-3" style={{ color: 'var(--danger, #ef4444)' }}>
              Нет доступа к камере: {error}
            </div>
          ) : (
            <video ref={videoRef} style={{ width: '100%', display: 'block', background: '#000' }} playsInline />
          )}
          {approving && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <Loader2 className="animate-spin" size={24} />
            </div>
          )}
        </div>
        <div className="px-4 py-2 font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
          Наведи на QR-код с экрана другого устройства.
        </div>
      </div>
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────────────────

function UpdateCheckerRow() {
  const s = useBannerState();
  // В вебе апдейтера нет — строка «проверить обновления» там только путает.
  if (!isTauri()) return null;
  const hasUpdate = s.phase === 'available' && !!s.update;
  const busy = s.phase === 'checking' || s.phase === 'downloading' || s.phase === 'installing';

  const label = (() => {
    if (s.phase === 'checking')    return 'проверяю…';
    if (s.phase === 'downloading') return 'скачиваю…';
    if (s.phase === 'installing')  return 'ставлю…';
    if (s.phase === 'done')        return 'обновление запущено';
    if (hasUpdate)                 return `установить v${s.update!.version}`;
    if (s.phase === 'no-update')   return 'уже последняя версия';
    if (s.phase === 'error')       return 'проверить ещё раз';
    return 'проверить обновления';
  })();

  return (
    <>
      <button
        // Раньше эта строка умела только перепроверять: даже когда обновление
        // было найдено, нажатие ничего не устанавливало — поставить можно было
        // только из баннера, а его легко закрыть крестиком.
        onClick={() => { void (hasUpdate ? startUpdate() : checkNow()); }}
        disabled={busy}
        className="w-full font-mono py-2 rounded flex items-center justify-center gap-2"
        style={{
          background: hasUpdate ? 'var(--accent)' : 'transparent',
          color: hasUpdate ? 'var(--on-accent)' : 'var(--text-muted)',
          border: `1px solid ${hasUpdate ? 'var(--accent)' : 'var(--border)'}`,
          cursor: busy ? 'wait' : 'pointer',
          fontSize: 12,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy && <Loader2 size={12} className="animate-spin" />}
        {label}
      </button>
      {s.phase === 'error' && s.errorMsg && (
        <div
          className="font-mono"
          style={{ color: 'var(--danger)', fontSize: 11, marginTop: 6, wordBreak: 'break-word' }}
        >
          {s.errorMsg}
        </div>
      )}
    </>
  );
}

export function SyncPage() {
  const hasAccount = useAccountStore((s) => s.hasAccount);
  const ready = useAccountStore((s) => s.ready);
  if (!ready) return null;
  // Единственный скролл-контейнер на весь экран. Раньше вид рендерил свой
  // `flex-1 overflow-y-auto`, а строка обновлений жила ПОСЛЕ него — и потому
  // всегда висела прижатой к низу окна, отдельно от карточек и внахлёст с
  // баннером апдейтера.
  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
        {hasAccount ? <PairedView /> : <UnpairedView />}

        <div style={{ marginTop: 12 }}>
          <UpdateCheckerRow />
        </div>

        <div
          className="font-mono"
          style={{ marginTop: 12, textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}
        >
          kairo v{__APP_VERSION__}
        </div>
      </div>
    </div>
  );
}
