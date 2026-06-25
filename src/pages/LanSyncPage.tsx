import { useState, useCallback, useEffect } from 'react';
import { Wifi, WifiOff, Download, Upload, RefreshCw, Copy, Check, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useLanHost, useLanGuest } from '@/hooks/useLanSync';
import { isDesktopHost } from '@/services/lan-sync.service';
import { useToast } from '@/components/ui/Toast';

// ── Страница синхронизации ─────────────────────────────────────────────────

export function LanSyncPage() {
  const host = isDesktopHost();
  return host ? <HostView /> : <GuestView />;
}

// ── Хост (десктоп) ────────────────────────────────────────────────────────

function HostView() {
  const { info, lastSync, pushAll } = useLanHost();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const wsUrl = info ? `ws://${info.ip}:${info.port}` : '…';

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

        {/* Статус сервера */}
        <StatusCard running peers={info?.peers ?? 0} />

        {/* Адрес */}
        <section className="font-mono mb-3" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)' }}>
          <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
            ▸ АДРЕС ПОДКЛЮЧЕНИЯ
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <code className="flex-1 text-sm neon-text" style={{ wordBreak: 'break-all' }}>
              {wsUrl}
            </code>
            <button
              onClick={copyUrl}
              title="Копировать"
              className="bloom-press"
              style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                color: 'var(--accent)', cursor: 'pointer', flexShrink: 0,
                transition: 'opacity 150ms ease',
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied
                  ? <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}><Check size={14} /></motion.span>
                  : <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}><Copy size={14} /></motion.span>
                }
              </AnimatePresence>
            </button>
          </div>
          <div className="px-4 pb-3" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Введите этот адрес на телефоне в разделе Sync
          </div>
        </section>

        {/* Действия */}
        <section className="font-mono mb-3" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)' }}>
          <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
            ▸ ДЕЙСТВИЯ
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            <ActionRow
              icon={<Upload size={14} />}
              label="Отправить данные на устройства"
              desc="Рассылает все ваши данные подключённым гостям"
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

        <OtaSection role="host" />
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

  const handleConnect = useCallback(() => {
    const addr = ip.trim();
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
        <PageHeader title="SYNC" subtitle="гость · подключение к компьютеру" />

        {/* Статус */}
        <StatusCard running={connected} peers={connected ? 1 : 0} role="guest" wsStatus={status} />

        {/* Подключение */}
        <section className="font-mono mb-3" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)' }}>
          <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
            ▸ АДРЕС КОМПЬЮТЕРА
          </div>
          <div className="px-4 py-3 flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                value={ip}
                onChange={e => setIp(e.target.value)}
                placeholder="192.168.x.x"
                className="flex-1 h-9 px-3 font-mono text-sm outline-none"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  caretColor: 'var(--accent)',
                }}
                onKeyDown={e => { if (e.key === 'Enter') handleConnect(); }}
              />
              {connected
                ? <Button variant="danger" size="md" onClick={disconnect}>Отключить</Button>
                : <Button variant="primary" size="md" onClick={handleConnect} disabled={!ip.trim()}>Подключить</Button>
              }
            </div>
            {status === 'error' && (
              <div className="text-xs font-mono" style={{ color: 'var(--danger)' }}>
                [ошибка] не удалось подключиться — проверьте IP и порт 8765
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

        <OtaSection role="guest" connected={connected} />
      </div>
    </div>
  );
}

// ── Секция OTA ────────────────────────────────────────────────────────────

function OtaSection({ role, connected }: { role: 'host' | 'guest'; connected?: boolean }) {
  return (
    <section className="font-mono" style={{ border: '1px solid var(--border-subtle)', background: 'var(--well-bg)', opacity: 0.6 }}>
      <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        ▸ OTA — обновление приложения
      </div>
      <div className="px-4 py-3">
        <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          // Передача APK через тот же WebSocket-канал
        </p>
        <p className="font-mono mt-1" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          {role === 'host'
            ? '// desktop: соберите APK командой tauri android build, затем нажмите «Отправить»'
            : '// mobile: когда хост отправит APK — он сохранится в Downloads и запустит установщик'}
        </p>
        <div className="mt-2">
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--accent-dim)', padding: '2px 8px', border: '1px solid var(--border)' }}>
            // скоро
          </span>
        </div>
      </div>
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
    : (running ? `СЕРВЕР ЗАПУЩЕН` : 'сервер не запущен');

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
      className="w-full text-left flex items-start gap-3 px-3 py-2.5 font-mono row-hover"
      style={{
        background: 'transparent', border: '1px solid var(--border-subtle)',
        color: disabled ? 'var(--text-dim)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--border)'; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
    >
      <span style={{ color: disabled ? 'var(--text-dim)' : 'var(--accent)', marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span style={{ fontSize: 13 }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{desc}</span>
      </div>
    </button>
  );
}
