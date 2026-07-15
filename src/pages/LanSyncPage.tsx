import { useState, useCallback, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Download, Upload, Copy, Check, Radio, Smartphone, AlertTriangle, Terminal, Trash2, Cloud, UserPlus, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/Button';
import { useLanHost, useLanGuest, useLanSyncLogs } from '@/hooks/useLanSync';
import { isDesktopHost } from '@/services/lan-sync.service';
import { useToast } from '@/components/ui/Toast';
import { useAccountStore } from '@/stores/account.store';
import { requestPairingTicket, pairingDeepLink } from '@/lib/account';
import vpsSync from '@/services/vps-sync.service';

// ── Страница синхронизации ─────────────────────────────────────────────────

type SyncMode = 'lan' | 'cloud';

export function LanSyncPage() {
  const host = isDesktopHost();
  const [mode, setMode] = useState<SyncMode>('lan');

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0" style={{ padding: '12px 12px 0' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="segmented" style={{ display: 'inline-flex', gap: 3, padding: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--shape-md)' }}>
            <ModeTab active={mode === 'lan'} onClick={() => setMode('lan')} icon={<Wifi size={13} />} label="локальная сеть" />
            <ModeTab active={mode === 'cloud'} onClick={() => setMode('cloud')} icon={<Cloud size={13} />} label="облако" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        {mode === 'lan'
          ? (host ? <HostView /> : <GuestView />)
          : <CloudView />
        }
      </div>
    </div>
  );
}

function ModeTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 font-mono"
      style={{
        padding: '8px 14px', fontSize: 12, fontWeight: 600,
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#000' : 'var(--text-muted)',
        border: 'none', borderRadius: 'var(--shape-sm)', cursor: 'pointer',
        transition: 'background 200ms var(--ease-standard), color 200ms var(--ease-standard)',
      }}
    >
      {icon} {label}
    </button>
  );
}

// ── Хост (десктоп) ────────────────────────────────────────────────────────

function HostView() {
  const { info, lastSync, pushAll } = useLanHost();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const wsUrl = info ? `ws://${info.ip}:${info.port}` : '';

  // Рисуем QR когда есть IP
  useEffect(() => {
    if (!wsUrl || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, wsUrl, {
      width: 180,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    }).catch(() => {});
  }, [wsUrl]);

  const copyUrl = useCallback(async () => {
    if (!info) return;
    await navigator.clipboard.writeText(wsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [info, wsUrl]);

  const handlePush = useCallback(() => {
    pushAll();
    toast('Данные отправлены на устройства');
  }, [pushAll, toast]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <PageHeader title="SYNC" subtitle="хост · LAN WebSocket" />

        <StatusCard running peers={info?.peers ?? 0} />

        {/* QR + адрес */}
        <section className="font-mono mb-3" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)' }}>
          <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
            ▸ ПОДКЛЮЧЕНИЕ ТЕЛЕФОНА
          </div>
          <div className="px-4 py-4 flex gap-6 items-start">
            {/* QR */}
            <div style={{ flexShrink: 0, border: '2px solid var(--accent)', padding: 4, background: 'var(--bg-surface)', width: 188, height: 188, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {wsUrl
                ? <canvas ref={canvasRef} width={180} height={180} />
                : <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>загрузка…</span>
              }
            </div>

            {/* Описание */}
            <div className="flex flex-col gap-3 min-w-0">
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>адрес:</div>
                <div className="flex items-center gap-2">
                  <code className="neon-text" style={{ fontSize: 13, wordBreak: 'break-all' }}>{wsUrl || '…'}</code>
                  <button
                    onClick={copyUrl}
                    style={{ width: 30, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', cursor: 'pointer' }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copied
                        ? <motion.span key="c" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}><Check size={12} /></motion.span>
                        : <motion.span key="x" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}><Copy size={12} /></motion.span>}
                    </AnimatePresence>
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>инструкция:</div>
                1. Отсканируй QR камерой телефона<br />
                2. Введи адрес в приложении → Синк<br />
                3. Нажми «Подключить»
              </div>

              {(info?.peers ?? 0) > 0 && (
                <div style={{ fontSize: 12, color: 'var(--success)' }}>
                  ✓ подключено устройств: {info!.peers}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Хотспот-совет */}
        <HotspotTip role="host" />

        {/* Действия */}
        <section className="font-mono mb-3" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)' }}>
          <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
            ▸ ДЕЙСТВИЯ
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            <ActionRow
              icon={<Upload size={14} />}
              label="Отправить данные на устройства"
              desc="Рассылает все данные подключённым гостям"
              onClick={handlePush}
              disabled={!info || info.peers === 0}
            />
            {lastSync && (
              <div className="font-mono mt-1" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Последний синк: {new Date(lastSync).toLocaleTimeString('ru-RU')}
              </div>
            )}
          </div>
        </section>

        <DebugLogPanel />
      </div>
    </div>
  );
}

// ── Гость (телефон) ───────────────────────────────────────────────────────

function GuestView() {
  const { status, lastSync, connect, disconnect, pull, push } = useLanGuest();
  const { toast } = useToast();
  const [ip, setIp] = useState(() => localStorage.getItem('kairo_sync_ip') ?? '');
  const connected = status === 'connected';
  const isError = status === 'error';

  const handleConnect = useCallback(() => {
    const addr = ip.trim().replace(/^ws:\/\//, '');
    if (!addr) return;
    localStorage.setItem('kairo_sync_ip', addr);
    connect(addr);
  }, [ip, connect]);

  const handlePull = useCallback(() => {
    pull();
    toast('Запрос данных отправлен…');
  }, [pull, toast]);

  const handlePush = useCallback(() => {
    push();
    toast('Данные отправлены на компьютер');
  }, [push, toast]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <PageHeader title="SYNC" subtitle="телефон · подключение к компьютеру" />

        <StatusCard running={connected} peers={connected ? 1 : 0} role="guest" wsStatus={status} />

        {/* Хотспот-совет */}
        <HotspotTip role="guest" />

        {/* Подключение */}
        <section className="font-mono mb-3" style={{ border: `1px solid ${isError ? 'var(--danger)' : 'var(--border-subtle)'}`, background: 'var(--well-bg)' }}>
          <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
            ▸ АДРЕС КОМПЬЮТЕРА
          </div>
          <div className="px-4 py-3 flex flex-col gap-3">
            <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Отсканируй QR с экрана компьютера и введи адрес ниже (или скопируй из камеры):
            </div>
            <div className="flex gap-2" style={{ minWidth: 0 }}>
              <input
                value={ip}
                onChange={e => setIp(e.target.value)}
                placeholder="192.168.x.x"
                inputMode="decimal"
                className="flex-1 h-11 px-3 font-mono"
                style={{
                  minWidth: 0,
                  fontSize: 15,
                  background: 'var(--bg-input)',
                  border: `1px solid ${isError ? 'var(--danger)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                  caretColor: 'var(--accent)',
                  outline: 'none',
                }}
                onKeyDown={e => { if (e.key === 'Enter') handleConnect(); }}
              />
              <div style={{ flexShrink: 0 }}>
                {connected
                  ? <Button variant="danger" size="md" onClick={disconnect}>Отключить</Button>
                  : <Button variant="primary" size="md" onClick={handleConnect} disabled={!ip.trim()}>Подключить</Button>
                }
              </div>
            </div>

            {isError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                <AlertTriangle size={14} />
                <span>Не удалось подключиться. Проверь IP и порт 8765. Если не работает — попробуй хотспот (см. выше).</span>
              </div>
            )}
          </div>
        </section>

        {/* Действия */}
        <section className="font-mono mb-3" style={{ border: `1px solid ${connected ? 'var(--border)' : 'var(--border-subtle)'}`, background: 'var(--well-bg)', opacity: connected ? 1 : 0.45, transition: 'opacity 200ms ease' }}>
          <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
            ▸ СИНХРОНИЗАЦИЯ
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            <ActionRow
              icon={<Download size={14} />}
              label="Получить данные с компьютера"
              desc="Перезаписывает локальные данные данными компьютера"
              onClick={handlePull}
              disabled={!connected}
            />
            <ActionRow
              icon={<Upload size={14} />}
              label="Отправить данные на компьютер"
              desc="Перезаписывает данные компьютера вашими локальными"
              onClick={handlePush}
              disabled={!connected}
            />
            {lastSync && (
              <div className="font-mono mt-1" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Последний синк: {new Date(lastSync).toLocaleTimeString('ru-RU')}
              </div>
            )}
          </div>
        </section>

        <DebugLogPanel />
      </div>
    </div>
  );
}

// ── Облако (VPS) ─────────────────────────────────────────────────────────

function CloudView() {
  const hasAccount = useAccountStore((s) => s.hasAccount);
  const ready = useAccountStore((s) => s.ready);

  if (!ready) return null;

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <PageHeader title="SYNC" subtitle="облако · через интернет, без Wi-Fi" />
        {hasAccount ? <CloudPairedView /> : <CloudNoAccountView />}
      </div>
    </div>
  );
}

/** Аккаунта на этом устройстве ещё нет — либо создаём новый, либо подключаемся к существующему. */
function CloudNoAccountView() {
  const createNewAccount = useAccountStore((s) => s.createNewAccount);
  const pairWithTicket = useAccountStore((s) => s.pairWithTicket);
  const recoverWithCode = useAccountStore((s) => s.recoverWithCode);
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await createNewAccount();
      toast('Облачный аккаунт создан');
    } catch {
      setError('Не удалось создать аккаунт — сервер недоступен. Попробуй позже.');
    } finally {
      setBusy(false);
    }
  }, [createNewAccount, toast]);

  const handleRedeem = useCallback(async () => {
    const value = code.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      const isRecoveryCode = value.split(/\s+/).length >= 12;
      if (isRecoveryCode) {
        await recoverWithCode(value);
        toast('Доступ восстановлен');
      } else {
        await pairWithTicket(value);
        toast('Устройство подключено');
      }
      setCode('');
    } catch {
      setError('Не подошёл код — проверь, что он не устарел (билет живёт 5 минут), или введи 12 слов кода восстановления полностью.');
    } finally {
      setBusy(false);
    }
  }, [code, pairWithTicket, recoverWithCode, toast]);

  return (
    <>
      <section className="font-mono mb-3" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)' }}>
        <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
          ▸ ПЕРВОЕ УСТРОЙСТВО
        </div>
        <div className="px-4 py-3 flex flex-col gap-3">
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Если Kairo с облаком у тебя ещё нигде не настроен — создай новый аккаунт здесь.
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            className="m3-fab flex items-center justify-center gap-2"
            style={{ height: 48, background: 'var(--accent)', color: '#000', border: 'none', fontSize: 14, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}
          >
            <UserPlus size={16} /> создать облачный аккаунт
          </button>
        </div>
      </section>

      <section className="font-mono mb-3" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)' }}>
        <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
          ▸ ЕСТЬ КОД С ДРУГОГО УСТРОЙСТВА
        </div>
        <div className="px-4 py-3 flex flex-col gap-3">
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Отсканируй QR камерой (она сама предложит открыть Kairo) — или введи код парности/восстановления вручную:
          </div>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="код парности или 12 слов"
              className="flex-1 h-11 px-3 font-mono"
              style={{
                minWidth: 0, fontSize: 14,
                background: 'var(--bg-input)', border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                color: 'var(--text-primary)', caretColor: 'var(--accent)', outline: 'none',
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem(); }}
            />
            <Button variant="primary" size="md" onClick={handleRedeem} disabled={!code.trim() || busy}>
              Войти
            </Button>
          </div>
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--danger)' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/** Аккаунт уже есть на этом устройстве — можно добавить ещё одно через QR/код, и синхронизировать данные. */
function CloudPairedView() {
  const { toast } = useToast();
  const [ticket, setTicket] = useState<{ ticket: string; expiresAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState<'pull' | 'push' | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePull = useCallback(async () => {
    setSyncing('pull');
    try {
      await vpsSync.pull();
      setLastSync(new Date().toISOString());
      toast('Данные получены с облака');
    } catch {
      toast('Не удалось синхронизироваться — сервер недоступен', 'error');
    } finally {
      setSyncing(null);
    }
  }, [toast]);

  const handlePush = useCallback(async () => {
    setSyncing('push');
    try {
      await vpsSync.push();
      setLastSync(new Date().toISOString());
      toast('Данные отправлены в облако');
    } catch {
      toast('Не удалось синхронизироваться — сервер недоступен', 'error');
    } finally {
      setSyncing(null);
    }
  }, [toast]);

  useEffect(() => {
    if (!ticket || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, pairingDeepLink(ticket.ticket), {
      width: 180, margin: 2, color: { dark: '#000000', light: '#FFFFFF' },
    }).catch(() => {});
  }, [ticket]);

  const handleGenerate = useCallback(async () => {
    setBusy(true);
    try {
      const res = await requestPairingTicket();
      setTicket(res);
    } catch {
      toast('Не удалось получить код — сервер недоступен', 'error');
    } finally {
      setBusy(false);
    }
  }, [toast]);

  const secondsLeft = ticket ? Math.max(0, Math.round((new Date(ticket.expiresAt).getTime() - Date.now()) / 1000)) : 0;

  return (
    <>
      <div className="flex items-center gap-3 mb-3 px-4 py-3 font-mono" style={{ border: '1px solid var(--border)', background: 'var(--well-bg)' }}>
        <Cloud size={16} style={{ color: 'var(--success)' }} />
        <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>облако подключено</span>
      </div>

      <section className="font-mono mb-3" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)' }}>
        <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
          ▸ ДОБАВИТЬ ЕЩЁ УСТРОЙСТВО
        </div>
        <div className="px-4 py-4 flex flex-col gap-3">
          {!ticket ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={busy}
              className="m3-fab flex items-center justify-center gap-2"
              style={{ height: 48, background: 'var(--accent)', color: '#000', border: 'none', fontSize: 14, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}
            >
              <QrCode size={16} /> показать QR для нового устройства
            </button>
          ) : (
            <div className="flex gap-6 items-start">
              <div style={{ flexShrink: 0, border: '2px solid var(--accent)', padding: 4, background: 'var(--bg-surface)', width: 188, height: 188, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <canvas ref={canvasRef} width={180} height={180} />
              </div>
              <div className="flex flex-col gap-3 min-w-0">
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>или введи код вручную:</div>
                  <code className="neon-text" style={{ fontSize: 20, letterSpacing: 2 }}>{ticket.ticket}</code>
                </div>
                <div style={{ fontSize: 11, color: secondsLeft < 30 ? 'var(--danger)' : 'var(--text-dim)' }}>
                  {secondsLeft > 0 ? `действует ещё ${secondsLeft} сек` : 'код истёк'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  На новом устройстве: раздел Синк → Облако → «Есть код с другого устройства».
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="font-mono mb-3" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)' }}>
        <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
          ▸ СИНХРОНИЗАЦИЯ
        </div>
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
            <div className="font-mono mt-1" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              Последний синк: {new Date(lastSync).toLocaleTimeString('ru-RU')}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ── Диагностический лог ───────────────────────────────────────────────────

function DebugLogPanel() {
  const { logs, clear } = useLanSyncLogs();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, open]);

  const copyLogs = useCallback(async () => {
    const text = logs.map(l => `[${l.ts}] ${l.text}`).join('\n') || '(пусто)';
    await navigator.clipboard.writeText(text);
    toast('Лог скопирован');
  }, [logs, toast]);

  return (
    <section className="font-mono mb-3" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <Terminal size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
          Диагностика {logs.length > 0 && `(${logs.length})`}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-3">
              <div
                ref={scrollRef}
                style={{
                  maxHeight: 220, overflowY: 'auto', background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)', padding: 8, fontSize: 10.5,
                  lineHeight: 1.6, color: 'var(--text-secondary)',
                }}
              >
                {logs.length === 0
                  ? <span style={{ color: 'var(--text-dim)' }}>лог пуст…</span>
                  : logs.map((l, i) => (
                      <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        <span style={{ color: 'var(--text-dim)' }}>{l.ts}</span> {l.text}
                      </div>
                    ))
                }
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={copyLogs}
                  className="flex items-center gap-1.5 px-2.5 py-1.5"
                  style={{ fontSize: 11, background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', cursor: 'pointer' }}
                >
                  <Copy size={11} /> скопировать
                </button>
                <button
                  onClick={clear}
                  className="flex items-center gap-1.5 px-2.5 py-1.5"
                  style={{ fontSize: 11, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Trash2 size={11} /> очистить
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Совет про хотспот ────────────────────────────────────────────────────

function HotspotTip({ role }: { role: 'host' | 'guest' }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="font-mono mb-3" style={{ border: '1px solid var(--warning)', background: 'color-mix(in srgb, transparent 88%, var(--warning))' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--warning)', flex: 1 }}>
          Не работает через Wi-Fi? Используй хотспот телефона
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4" style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: 12 }}>
                Роутеры часто блокируют связь между устройствами (AP Isolation).
                Хотспот обходит это ограничение:
              </div>
              {role === 'guest' ? (
                <>
                  <div><span style={{ color: 'var(--warning)' }}>1.</span> На телефоне → Настройки → Мобильная точка доступа → <strong>Включить</strong></div>
                  <div><span style={{ color: 'var(--warning)' }}>2.</span> На компьютере → подключись к хотспоту телефона</div>
                  <div><span style={{ color: 'var(--warning)' }}>3.</span> На компьютере в Kairo → Синк → посмотри новый IP в QR-коде</div>
                  <div><span style={{ color: 'var(--warning)' }}>4.</span> Введи новый IP здесь → Подключить</div>
                </>
              ) : (
                <>
                  <div><span style={{ color: 'var(--warning)' }}>1.</span> На телефоне → Настройки → Мобильная точка доступа → <strong>Включить</strong></div>
                  <div><span style={{ color: 'var(--warning)' }}>2.</span> На компьютере → подключись к Wi-Fi хотспоту телефона</div>
                  <div><span style={{ color: 'var(--warning)' }}>3.</span> Здесь появится новый QR-код — отсканируй его телефоном</div>
                </>
              )}
              <div style={{ marginTop: 8, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Smartphone size={11} />
                Хотспот создаёт прямую сеть между устройствами без роутера
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Переиспользуемые компоненты ───────────────────────────────────────────

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-3 font-mono">
      <span className="neon-text" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>{title}</span>
      <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>
        <span style={{ color: 'var(--accent)' }}>›</span> {subtitle}
      </span>
    </div>
  );
}

function StatusCard({
  running, peers, role, wsStatus,
}: {
  running: boolean; peers: number; role?: 'host' | 'guest'; wsStatus?: string;
}) {
  const label = role === 'guest'
    ? (wsStatus === 'connecting' ? 'подключение…' : running ? 'подключено' : 'не подключено')
    : (running ? 'СЕРВЕР ЗАПУЩЕН' : 'сервер не запущен');

  const color = wsStatus === 'connecting'
    ? 'var(--warning)'
    : running ? 'var(--success)' : 'var(--text-dim)';

  return (
    <div className="flex items-center gap-3 mb-3 px-4 py-3 font-mono"
      style={{ border: `1px solid ${running ? 'var(--border)' : 'var(--border-subtle)'}`, background: 'var(--well-bg)' }}>
      <motion.div
        animate={{ scale: running ? [1, 1.15, 1] : 1 }}
        transition={{ repeat: running ? Infinity : 0, duration: 2, ease: 'easeInOut' }}
      >
        {running ? <Wifi size={16} style={{ color }} /> : <WifiOff size={16} style={{ color }} />}
      </motion.div>
      <span style={{ fontSize: 13, color, fontWeight: 600 }}>{label}</span>
      {peers > 0 && (
        <span className="ml-auto" style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {peers} {peers === 1 ? 'устройство' : 'устройства'}
        </span>
      )}
      {role !== 'guest' && running && peers === 0 && (
        <span className="ml-auto flex items-center gap-1" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          <Radio size={11} /> ожидание подключений
        </span>
      )}
    </div>
  );
}

function ActionRow({
  icon, label, desc, onClick, disabled,
}: {
  icon: React.ReactNode; label: string; desc: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className="w-full text-left flex items-start gap-3 px-3 py-2.5 font-mono"
      style={{
        background: 'transparent', border: '1px solid var(--border-subtle)',
        color: disabled ? 'var(--text-dim)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 150ms ease',
      }}
    >
      <span style={{ color: disabled ? 'var(--text-dim)' : 'var(--accent)', marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span style={{ fontSize: 13 }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{desc}</span>
      </div>
    </button>
  );
}
