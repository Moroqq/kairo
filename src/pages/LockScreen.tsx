import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  ChangeEvent,
  InputHTMLAttributes,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { MatrixRain } from '@/components/layout/MatrixRain';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from '@/stores/theme.store';

const storage = {
  get: (key: string) => localStorage.getItem(`kairo_auth_${key}`),
  set: (key: string, value: string) => localStorage.setItem(`kairo_auth_${key}`, value),
  has: (key: string) => localStorage.getItem(`kairo_auth_${key}`) !== null,
};

async function hashPassword(password: string, salt?: Uint8Array): Promise<{ hash: string; salt: string }> {
  const enc  = new TextEncoder();
  const s    = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const key  = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: s.buffer as ArrayBuffer, iterations: 310_000, hash: 'SHA-256' },
    key, 256,
  );
  const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
  return { hash: toB64(new Uint8Array(bits)), salt: toB64(s) };
}

async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const salt = Uint8Array.from(atob(storedSalt), (c) => c.charCodeAt(0));
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

/* ------------------------------------------------------------------ */
/* MaskedPasswordInput — реальное значение в state, отображаются `*`   */
/* ------------------------------------------------------------------ */

interface MaskedProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  trailing?: React.ReactNode;
}

function MaskedPasswordInput({
  label,
  value,
  onChange,
  visible,
  trailing,
  ...rest
}: MaskedProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);

  // Восстанавливаем позицию курсора после каждого рендера, если мы её запомнили
  useLayoutEffect(() => {
    if (pendingCursor.current !== null && inputRef.current) {
      const pos = pendingCursor.current;
      inputRef.current.setSelectionRange(pos, pos);
      pendingCursor.current = null;
    }
  });

  const display = visible ? value : '*'.repeat(value.length);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next   = e.target.value;
    const cursor = e.target.selectionStart ?? next.length;

    if (visible) {
      pendingCursor.current = cursor;
      onChange(next);
      return;
    }

    const oldLen = value.length;
    const newLen = next.length;
    const delta  = newLen - oldLen;

    if (delta > 0) {
      // Вставка: появилось `delta` новых символов; они оканчиваются на cursor
      const insertStart = cursor - delta;
      const inserted    = next.slice(insertStart, cursor);
      pendingCursor.current = cursor;
      onChange(value.slice(0, insertStart) + inserted + value.slice(insertStart));
    } else if (delta < 0) {
      // Удаление: вырезано `-delta` символов, курсор стоит на позиции среза
      pendingCursor.current = cursor;
      onChange(value.slice(0, cursor) + value.slice(cursor - delta));
    } else if (cursor > 0 && next[cursor - 1] !== '*') {
      // Длина не изменилась — обычно это selection-replace одним символом
      pendingCursor.current = cursor;
      onChange(value.slice(0, cursor - 1) + next[cursor - 1] + value.slice(cursor));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>›</span> {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={display}
          onChange={handleChange}
          className="h-7 w-full pl-2 pr-7 text-xs outline-none font-mono"
          style={{
            background: 'var(--bg-input)',
            color: visible ? 'var(--text-primary)' : 'var(--accent)',
            textShadow: visible ? 'none' : '0 0 6px var(--accent-glow), 0 0 2px var(--accent)',
            letterSpacing: visible ? 0 : 3,
            border: '1px solid var(--border)',
            caretColor: 'var(--accent)',
          }}
        />
        {trailing && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function LockScreen() {
  const unlock = useAuthStore((s) => s.unlock);
  const theme  = useTheme();
  const [isSetup,  setIsSetup]  = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => { setIsSetup(storage.has('password_hash')); }, []);

  const handleSetup = async () => {
    setError('');
    if (password.length < 4) { setError('минимум 4 символа'); return; }
    if (password !== confirm) { setError('пароли не совпадают'); return; }
    setLoading(true);
    try {
      const { hash, salt } = await hashPassword(password);
      storage.set('password_hash', hash);
      storage.set('password_salt', salt);
      unlock();
    } catch {
      setError('ошибка шифрования, попробуйте снова');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const hash = storage.get('password_hash');
      const salt = storage.get('password_salt');
      if (!hash || !salt) { setError('данные не найдены'); setLoading(false); return; }
      const ok = await verifyPassword(password, hash, salt);
      if (!ok) { setError('доступ запрещён'); setLoading(false); return; }
      unlock();
    } catch {
      setError('ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  if (isSetup === null) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#000' }}>
        <div className="dot-pulse flex gap-1"><span /><span /><span /></div>
      </div>
    );
  }

  const eyeBtn = (
    <button
      onClick={() => setShowPass((v) => !v)}
      className="h-5 w-5 flex items-center justify-center"
      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
      title={showPass ? 'Скрыть' : 'Показать'}
      type="button"
    >
      {showPass ? <EyeOff size={11} /> : <Eye size={11} />}
    </button>
  );

  return (
    <div className="win-desktop h-full flex items-center justify-center relative">
      {theme.fx && <MatrixRain />}

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex flex-col relative"
        style={{
          width: 380,
          background: 'var(--overlay-bg)',
          border: '1px solid var(--accent)',
          boxShadow: '0 0 0 1px var(--accent), 0 0 40px var(--accent-glow), 0 0 100px rgba(0,255,65,0.15)',
          zIndex: 5,
        }}
      >
        <div className="titlebar">
          <span className="neon-text">●</span>
          <span className="flex-1 truncate">
            {isSetup ? '[kairo]$ auth --вход' : '[kairo]$ auth --настройка'}
          </span>
        </div>

        <div className="flex flex-col gap-3" style={{ padding: 16 }}>
          <div className="flex flex-col items-center gap-2" style={{ marginBottom: 6, marginTop: 4 }}>
            <img
              src="/logo.png"
              alt="Kairo"
              width={88}
              height={88}
              style={{
                display: 'block',
                filter: 'drop-shadow(0 0 18px var(--accent-glow)) drop-shadow(0 0 36px rgba(0,255,65,0.25))',
              }}
            />
            <div
              className="font-mono neon-text"
              style={{
                fontSize: 11,
                letterSpacing: 6,
                fontWeight: 700,
              }}
            >
              K A I R O
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)' }}
            >
              — терминал задач —
            </div>
          </div>

          <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            <span className="neon-text">›</span> {isSetup ? 'введите пароль для входа' : 'придумайте пароль (мин. 4 символа)'}
          </p>

          <MaskedPasswordInput
            label="пароль"
            value={password}
            onChange={setPassword}
            visible={showPass}
            autoFocus
            data-selectable
            onKeyDown={(e) => { if (e.key === 'Enter' && isSetup) handleLogin(); }}
            trailing={eyeBtn}
          />

          {!isSetup && (
            <MaskedPasswordInput
              label="подтверждение"
              value={confirm}
              onChange={setConfirm}
              visible={showPass}
              data-selectable
              onKeyDown={(e) => { if (e.key === 'Enter') handleSetup(); }}
            />
          )}

          {error && (
            <div
              className="px-2 py-1.5 text-xs font-mono"
              style={{
                background: 'rgba(255,0,60,0.08)',
                border: '1px solid var(--border-danger)',
                color: 'var(--danger)',
                textShadow: '0 0 6px rgba(255,0,60,0.5)',
              }}
            >
              [ошибка] {error}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              variant="primary"
              size="md"
              onClick={isSetup ? handleLogin : handleSetup}
              loading={loading}
              disabled={!password || (!isSetup && !confirm)}
            >
              {isSetup ? '> войти' : '> создать'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
