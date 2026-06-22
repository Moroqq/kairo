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
import { PinPad } from '@/components/auth/PinPad';
import { useAuthStore } from '@/stores/auth.store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  hasAccount, hasPin, getUsername,
  createAccount, verifyPassword, setPin, verifyPin,
  PIN_LENGTH,
} from '@/lib/auth';

type Step = 'loading' | 'register' | 'password' | 'pin' | 'setpin';

export function LockScreen() {
  const unlock = useAuthStore((s) => s.unlock);
  const isMobile = useIsMobile();

  const [step, setStep] = useState<Step>('loading');

  // Поля аккаунта
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);

  // PIN
  const [pin, setPinValue]   = useState('');
  const [firstPin, setFirst] = useState('');           // первый ввод при установке
  const [pinStage, setPinStage] = useState<'enter' | 'repeat'>('enter');

  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  // Начальный экран: нет аккаунта → регистрация; есть PIN (только мобайл) → pin; иначе → пароль.
  // На десктопе PIN не используем — там просто компактное окно с паролем.
  useEffect(() => {
    if (!hasAccount()) setStep('register');
    else if (isMobile && hasPin()) setStep('pin');
    else setStep('password');
  }, [isMobile]);

  /* ─── Регистрация ───────────────────────────────────────── */
  const handleRegister = async () => {
    setError('');
    if (username.trim().length < 2) { setError('логин: минимум 2 символа'); return; }
    if (password.length < 4)        { setError('пароль: минимум 4 символа'); return; }
    if (password !== confirm)       { setError('пароли не совпадают'); return; }
    setLoading(true);
    try {
      await createAccount(username, password);
      resetFields();
      if (isMobile) setStep('setpin');    // мобайл — предложить быстрый PIN
      else unlock();                      // десктоп — сразу внутрь
    } catch {
      setError('ошибка шифрования, попробуйте снова');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Вход паролем ──────────────────────────────────────── */
  const handlePassword = async () => {
    setError('');
    setLoading(true);
    try {
      const ok = await verifyPassword(password);
      if (!ok) { setError('доступ запрещён'); setLoading(false); return; }
      resetFields();
      // Десктоп: всегда сразу внутрь (PIN не используем).
      // Мобайл: если PIN ещё не задан — предложить настроить.
      if (!isMobile || hasPin()) unlock();
      else setStep('setpin');
    } catch {
      setError('ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Вход по PIN (auto-submit на 4 цифры) ──────────────── */
  useEffect(() => {
    if (step !== 'pin' || pin.length !== PIN_LENGTH || busy.current) return;
    busy.current = true;
    verifyPin(pin).then((ok) => {
      if (ok) { unlock(); }
      else {
        setError('неверный PIN');
        setTimeout(() => { setPinValue(''); setError(''); busy.current = false; }, 600);
      }
      if (ok) busy.current = false;
    });
  }, [pin, step, unlock]);

  /* ─── Установка PIN (ввод дважды) ───────────────────────── */
  useEffect(() => {
    if (step !== 'setpin' || pin.length !== PIN_LENGTH || busy.current) return;
    busy.current = true;
    if (pinStage === 'enter') {
      setFirst(pin);
      setPinValue('');
      setPinStage('repeat');
      busy.current = false;
    } else {
      if (pin === firstPin) {
        setPin(pin).then(() => unlock());
      } else {
        setError('PIN не совпал, ещё раз');
        setTimeout(() => {
          setPinValue(''); setFirst(''); setPinStage('enter'); setError(''); busy.current = false;
        }, 700);
      }
    }
  }, [pin, step, pinStage, firstPin, unlock]);

  const skipPin = () => { resetFields(); unlock(); };

  const resetFields = () => {
    setPassword(''); setConfirm(''); setPinValue(''); setFirst('');
    setPinStage('enter'); setError(''); busy.current = false;
  };

  if (step === 'loading') {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
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

  const titlebar =
    step === 'register' ? '[kairo]$ auth --регистрация'
    : step === 'setpin' ? '[kairo]$ auth --pin'
    : '[kairo]$ auth --вход';

  const isPinStep = step === 'pin' || step === 'setpin';
  const name = getUsername();

  return (
    <div className="win-desktop h-full flex items-center justify-center relative" style={{ padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex flex-col relative"
        style={{
          width: isMobile ? (isPinStep ? 340 : 380) : 300,
          maxWidth: '100%',
          background: 'var(--overlay-bg)',
          border: '1px solid var(--accent)',
          boxShadow: '0 0 0 1px var(--accent), 0 0 40px var(--accent-glow), 0 0 100px rgba(0,255,65,0.15)',
          zIndex: 5,
        }}
      >
        <div className="titlebar">
          <span className="neon-text">●</span>
          <span className="flex-1 truncate">{titlebar}</span>
        </div>

        <div className="flex flex-col gap-3" style={{ padding: isMobile ? 16 : 14 }}>
          {/* Лого: на мобиле — крупный блок, на десктопе — компактная строка */}
          {isMobile ? (
            <div className="flex flex-col items-center gap-2" style={{ marginBottom: 4, marginTop: 4 }}>
              <img
                src="/logo.png" alt="Kairo" width={isPinStep ? 64 : 88} height={isPinStep ? 64 : 88}
                style={{ display: 'block', filter: 'drop-shadow(0 0 18px var(--accent-glow)) drop-shadow(0 0 36px rgba(0,255,65,0.25))' }}
              />
              <div className="font-mono neon-text" style={{ fontSize: 11, letterSpacing: 6, fontWeight: 700 }}>
                K A I R O
              </div>
              <div className="font-mono" style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)' }}>
                — терминал задач —
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
              <img
                src="/logo.png" alt="Kairo" width={28} height={28}
                style={{ display: 'block', filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}
              />
              <span className="font-mono neon-text" style={{ fontSize: 13, letterSpacing: 3, fontWeight: 700 }}>
                KAIRO
              </span>
            </div>
          )}

          {/* ── РЕГИСТРАЦИЯ ── */}
          {step === 'register' && (
            <>
              <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                <span className="neon-text">›</span> создайте профиль
              </p>
              <MaskedPasswordInput
                label="логин" value={username} onChange={setUsername} visible
                autoFocus data-selectable
              />
              <MaskedPasswordInput
                label="пароль" value={password} onChange={setPassword} visible={showPass}
                data-selectable trailing={eyeBtn}
              />
              <MaskedPasswordInput
                label="подтверждение" value={confirm} onChange={setConfirm} visible={showPass}
                data-selectable
                onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
              />
            </>
          )}

          {/* ── ВХОД ПАРОЛЕМ ── */}
          {step === 'password' && (
            <>
              <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                <span className="neon-text">›</span> {name ? `${name}, введите пароль` : 'введите пароль для входа'}
              </p>
              <MaskedPasswordInput
                label="пароль" value={password} onChange={setPassword} visible={showPass}
                autoFocus data-selectable trailing={eyeBtn}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePassword(); }}
              />
            </>
          )}

          {/* ── ВХОД ПО PIN ── */}
          {step === 'pin' && (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                {name ? `${name} · введите PIN` : 'введите PIN'}
              </p>
              <PinPad value={pin} onChange={setPinValue} error={!!error} />
            </div>
          )}

          {/* ── УСТАНОВКА PIN ── */}
          {step === 'setpin' && (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="text-xs font-mono text-center" style={{ color: 'var(--text-secondary)' }}>
                {pinStage === 'enter' ? 'придумайте PIN для быстрого входа' : 'повторите PIN'}
              </p>
              <PinPad value={pin} onChange={setPinValue} error={!!error} />
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div
              className="px-2 py-1.5 text-xs font-mono text-center"
              style={{
                background: 'rgba(255,0,60,0.08)', border: '1px solid var(--border-danger)',
                color: 'var(--danger)', textShadow: '0 0 6px rgba(255,0,60,0.5)',
              }}
            >
              [ошибка] {error}
            </div>
          )}

          {/* Кнопки действий */}
          {step === 'register' && (
            <div className="flex justify-end pt-1">
              <Button variant="primary" size="md" onClick={handleRegister} loading={loading}
                disabled={!username || !password || !confirm}>
                {'> создать профиль'}
              </Button>
            </div>
          )}

          {step === 'password' && (
            <div className="flex items-center justify-between pt-1">
              {isMobile && hasPin() ? (
                <button
                  type="button"
                  onClick={() => { resetFields(); setStep('pin'); }}
                  className="text-xs font-mono"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  ← ввести PIN
                </button>
              ) : <span />}
              <Button variant="primary" size="md" onClick={handlePassword} loading={loading} disabled={!password}>
                {'> войти'}
              </Button>
            </div>
          )}

          {step === 'pin' && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => { resetFields(); setStep('password'); }}
                className="text-xs font-mono"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                войти паролем
              </button>
            </div>
          )}

          {step === 'setpin' && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={skipPin}
                className="text-xs font-mono"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                пропустить — входить паролем
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MaskedPasswordInput — реальное значение в state, отображаются `*`   */
/* (для «логина» visible=true → обычный текст)                         */
/* ------------------------------------------------------------------ */

interface MaskedProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  trailing?: React.ReactNode;
}

function MaskedPasswordInput({ label, value, onChange, visible, trailing, ...rest }: MaskedProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);

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

    if (visible) { pendingCursor.current = cursor; onChange(next); return; }

    const delta = next.length - value.length;
    if (delta > 0) {
      const insertStart = cursor - delta;
      const inserted    = next.slice(insertStart, cursor);
      pendingCursor.current = cursor;
      onChange(value.slice(0, insertStart) + inserted + value.slice(insertStart));
    } else if (delta < 0) {
      pendingCursor.current = cursor;
      onChange(value.slice(0, cursor) + value.slice(cursor - delta));
    } else if (cursor > 0 && next[cursor - 1] !== '*') {
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
          autoComplete="off" spellCheck={false} autoCapitalize="off" autoCorrect="off"
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
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">{trailing}</div>
        )}
      </div>
    </div>
  );
}
