import { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Copy, Check, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Props {
  recoveryCode: string;
  onConfirm: () => void;
}

/**
 * Полноэкранный одноразовый показ кода восстановления. Не модалка поверх
 * приложения — отдельный, обязательный к подтверждению экран (нельзя
 * случайно закрыть тапом мимо), потому что второй раз код не покажется.
 */
export function RecoveryCodeReveal({ recoveryCode, onConfirm }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const words = recoveryCode.trim().split(/\s+/);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    toast('Код скопирован');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ background: 'var(--bg-base)', padding: 20 }}
    >
      <div className="flex flex-col" style={{ maxWidth: 480, width: '100%' }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 44, height: 44, borderRadius: 'var(--shape-md)', background: 'var(--accent-dim)', color: 'var(--accent)' }}
          >
            <KeyRound size={22} />
          </span>
          <h1 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
            Код восстановления
          </h1>
        </div>

        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          Это единственный способ вернуть доступ к твоим данным, если ты потеряешь все устройства.
          Сохрани его сейчас — <b style={{ color: 'var(--text-primary)' }}>больше он не покажется</b>.
        </p>

        <div
          className="grid grid-cols-3"
          style={{
            gap: 8, padding: 18,
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--shape-md)',
            marginBottom: 14,
          }}
        >
          {words.map((w, i) => (
            <div key={i} className="flex items-baseline gap-1.5" style={{ fontSize: 14 }}>
              <span className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 11, minWidth: 16 }}>{i + 1}.</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{w}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-2"
          style={{
            height: 46, marginBottom: 20,
            background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 'var(--shape-full)',
            color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer',
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'скопировано' : 'скопировать код'}
        </button>

        <label
          className="flex items-start gap-3"
          style={{
            padding: '12px 14px', marginBottom: 16,
            background: 'color-mix(in srgb, transparent 88%, var(--warning))',
            border: '1px solid var(--warning)', borderRadius: 'var(--shape-md)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: 'var(--warning)' }}
          />
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--warning)' }} />
            Я сохранил(а) код в надёжном месте (скриншот, менеджер паролей, записал вручную)
          </span>
        </label>

        <button
          type="button"
          disabled={!confirmed}
          onClick={onConfirm}
          className="m3-fab"
          style={{
            height: 52,
            background: confirmed ? 'var(--accent)' : 'var(--bg-elevated)',
            color: confirmed ? '#000' : 'var(--text-dim)',
            border: 'none', fontSize: 15, fontWeight: 700,
            cursor: confirmed ? 'pointer' : 'not-allowed',
          }}
        >
          Продолжить
        </button>
      </div>
    </motion.div>
  );
}
