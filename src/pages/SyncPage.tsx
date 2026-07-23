import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';
import { Download, Upload, QrCode, Camera, X, Loader2 } from 'lucide-react';
import { useAccountStore } from '@/stores/account.store';
import { useToast } from '@/components/ui/Toast';
import {
  startPairing, waitForPairing, approvePairing, type PairingIntent,
} from '@/lib/account';
import vpsSync from '@/services/vps-sync.service';
import { checkNow, useBannerState } from '@/components/updates/UpdateBanner';

// ── Мелкие UI-хелперы (используются только здесь) ───────────────────────

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="font-mono" style={{ fontSize: 15, letterSpacing: 2, color: 'var(--text-1)' }}>
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
      <span style={{ color: 'var(--text-1)', marginTop: 2 }}>{icon}</span>
      <span className="flex-1">
        <span style={{ color: 'var(--text-1)', fontSize: 13 }}>{label}</span>
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
    QRCode.toCanvas(canvasRef.current, intent.intentId, {
      width: 220, margin: 1, color: { dark: '#F5F5F5', light: '#00000000' },
    }).catch(() => {});
  }, [intent]);

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
    <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
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
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)', border: 'none', cursor: 'pointer' }}
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
              style={{ background: 'transparent', color: 'var(--text-1)', border: '1px solid var(--border)', cursor: 'pointer' }}
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
                    style={{ background: 'var(--input-bg)', color: 'var(--text-1)', border: '1px solid var(--border)', fontSize: 14, resize: 'vertical' }}
                  />
                  <button
                    onClick={handleRecover}
                    disabled={busy || !code.trim()}
                    className="font-mono py-2 rounded"
                    style={{ background: 'transparent', color: 'var(--text-1)', border: '1px solid var(--border)', cursor: 'pointer' }}
                  >
                    войти
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Экран с аккаунтом ──────────────────────────────────────────────────

function PairedView() {
  const { toast } = useToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [syncing, setSyncing] = useState<'pull' | 'push' | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handlePull = useCallback(async () => {
    setSyncing('pull');
    try {
      await vpsSync.pull();
      setLastSync(new Date().toISOString());
      toast('Данные получены с облака');
    } catch {
      toast('Не удалось синхронизироваться — сервер недоступен', 'error');
    } finally { setSyncing(null); }
  }, [toast]);

  const handlePush = useCallback(async () => {
    setSyncing('push');
    try {
      await vpsSync.push();
      setLastSync(new Date().toISOString());
      toast('Данные отправлены в облако');
    } catch {
      toast('Не удалось синхронизироваться — сервер недоступен', 'error');
    } finally { setSyncing(null); }
  }, [toast]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Header title="SYNC" subtitle="облако · через интернет" />

        <Card>
          <div className="px-4 py-3 font-mono" style={{ fontSize: 13, color: 'var(--accent-text, #7fe7c7)' }}>
            ✓ облако подключено
          </div>
        </Card>

        <Card>
          <CardTitle>ДОБАВИТЬ ЕЩЁ УСТРОЙСТВО</CardTitle>
          <div className="p-4">
            <button
              onClick={() => setScannerOpen(true)}
              className="w-full font-mono py-3 rounded"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)', border: 'none', cursor: 'pointer' }}
            >
              <Camera size={14} style={{ display: 'inline', marginRight: 8 }} />
              подключить новое устройство
            </button>
          </div>
        </Card>

        <Card>
          <CardTitle>СИНХРОНИЗАЦИЯ</CardTitle>
          <div className="px-4 py-3 flex flex-col gap-2">
            <ActionRow
              icon={<Download size={14} />}
              label="Получить данные с облака"
              desc="Перезаписывает локальные данные тем, что в облаке"
              onClick={handlePull}
              disabled={syncing !== null}
            />
            <ActionRow
              icon={<Upload size={14} />}
              label="Отправить данные в облако"
              desc="Перезаписывает данные в облаке локальными"
              onClick={handlePush}
              disabled={syncing !== null}
            />
            {lastSync && (
              <div className="font-mono mt-1" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Последний синк: {new Date(lastSync).toLocaleTimeString('ru-RU')}
              </div>
            )}
          </div>
        </Card>

        {scannerOpen && <ScannerModal onClose={() => setScannerOpen(false)} />}
      </div>
    </div>
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
          handledRef.current = false;
          setApproving(false);
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
  const label = (() => {
    if (s.phase === 'checking') return 'проверяю…';
    if (s.phase === 'available' && s.update) return `есть v${s.update.version}`;
    if (s.phase === 'no-update') return 'уже последняя';
    if (s.phase === 'error') return `ошибка: ${(s.errorMsg ?? '').slice(0, 60)}`;
    return 'проверить обновления';
  })();
  return (
    <button
      onClick={() => checkNow()}
      disabled={s.phase === 'checking'}
      className="w-full font-mono py-2 rounded flex items-center justify-center gap-2"
      style={{
        background: 'transparent',
        color: s.phase === 'error' ? 'var(--danger, #ef4444)' : 'var(--text-muted)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        fontSize: 12,
      }}
    >
      {label}
    </button>
  );
}

export function SyncPage() {
  const hasAccount = useAccountStore((s) => s.hasAccount);
  const ready = useAccountStore((s) => s.ready);
  if (!ready) return null;
  return (
    <>
      {hasAccount ? <PairedView /> : <UnpairedView />}
      <div style={{ maxWidth: 480, margin: '12px auto 32px', padding: '0 12px' }}>
        <UpdateCheckerRow />
      </div>
      <div
        className="font-mono"
        style={{
          position: 'absolute', bottom: 8, right: 12,
          fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, pointerEvents: 'none',
        }}
      >
        kairo v{__APP_VERSION__}
      </div>
    </>
  );
}
