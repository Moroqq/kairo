import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, KeyRound, Smartphone } from 'lucide-react';
import { Store } from '@tauri-apps/plugin-store';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth.store';

// Singleton store — loaded once
let _store: Store | null = null;
async function getStore(): Promise<Store> {
  if (!_store) _store = await Store.load('auth.json', { defaults: {} });
  return _store;
}

async function hashPassword(
  password: string,
  salt?: Uint8Array,
): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  // Ensure the salt buffer is an ArrayBuffer (not SharedArrayBuffer)
  const s   = salt ?? new Uint8Array(new ArrayBuffer(16));
  if (!salt) crypto.getRandomValues(s);
  const key  = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: s.buffer as ArrayBuffer, iterations: 310_000, hash: 'SHA-256' },
    key,
    256,
  );
  const toB64 = (buf: Uint8Array) => btoa(String.fromCharCode(...buf));
  return { hash: toB64(new Uint8Array(bits)), salt: toB64(s) };
}

async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const salt = Uint8Array.from(atob(storedSalt), (c) => c.charCodeAt(0));
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

type Screen = 'loading' | 'setup-password' | 'setup-totp' | 'login';

export function LockScreen() {
  const unlock = useAuthStore((s) => s.unlock);
  const [screen,   setScreen]   = useState<Screen>('loading');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [totp,     setTotp]     = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [qrUrl,    setQrUrl]    = useState('');
  const [totpObj,  setTotpObj]  = useState<OTPAuth.TOTP | null>(null);

  useEffect(() => {
    getStore().then(async (store) => {
      const hasPassword = await store.has('password_hash');
      setScreen(hasPassword ? 'login' : 'setup-password');
    });
  }, []);

  // SETUP — Step 1: create password
  const handleSetupPassword = async () => {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const store = await getStore();
      const { hash, salt } = await hashPassword(password);
      await store.set('password_hash', hash);
      await store.set('password_salt', salt);

      const secret = new OTPAuth.Secret({ size: 20 });
      const totpInstance = new OTPAuth.TOTP({
        issuer: 'Kairo', label: 'master', algorithm: 'SHA1', digits: 6, period: 30, secret,
      });
      setTotpObj(totpInstance);

      const uri = totpInstance.toString();
      const qr  = await QRCode.toDataURL(uri, { width: 200, margin: 1, color: { dark: '#00E5C0', light: '#0F0F0F' } });
      setQrUrl(qr);

      await store.set('totp_secret', secret.base32);
      await store.save();
      setScreen('setup-totp');
    } catch {
      setError('Setup failed, try again');
    } finally {
      setLoading(false);
    }
  };

  // SETUP — Step 2: verify TOTP scan
  const handleVerifyTOTP = () => {
    if (!totpObj) return;
    const delta = totpObj.validate({ token: totp, window: 1 });
    if (delta !== null) {
      unlock();
    } else {
      setError('Invalid code — scan the QR in Google Authenticator then enter the 6-digit code');
    }
  };

  // LOGIN
  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const store  = await getStore();
      const hash   = await store.get<string>('password_hash');
      const salt   = await store.get<string>('password_salt');
      const secret = await store.get<string>('totp_secret');
      if (!hash || !salt || !secret) { setError('Auth data missing — reinstall app'); setLoading(false); return; }

      const pwOk = await verifyPassword(password, hash, salt);
      if (!pwOk) { setError('Incorrect password'); setLoading(false); return; }

      const totpInstance = new OTPAuth.TOTP({
        issuer: 'Kairo', label: 'master', algorithm: 'SHA1', digits: 6, period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });
      const delta = totpInstance.validate({ token: totp, window: 1 });
      if (delta === null) { setError('Invalid authenticator code'); setLoading(false); return; }

      unlock();
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'loading') {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="dot-pulse flex gap-1"><span /><span /><span /></div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-sm flex flex-col gap-6 rounded-card p-8"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-elevated)' }}
      >
        {/* Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-2xl" style={{ background: 'var(--accent-dim)' }}>
            <Shield size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {screen === 'setup-password' ? 'Set up access' :
               screen === 'setup-totp'     ? 'Scan QR code'  : 'Kairo'}
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {screen === 'setup-password' ? 'Create your master password' :
               screen === 'setup-totp'     ? 'Add to Google Authenticator' : 'Enter credentials to unlock'}
            </p>
          </div>
        </div>

        {/* SETUP: password */}
        {screen === 'setup-password' && (
          <>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Input
                  label="Master Password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  data-selectable
                  autoFocus
                />
                <button
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-8 opacity-40 hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <Input
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                data-selectable
                onKeyDown={(e) => { if (e.key === 'Enter') handleSetupPassword(); }}
              />
            </div>
            {error && <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>}
            <Button variant="primary" onClick={handleSetupPassword} loading={loading} disabled={!password || !confirm}>
              Continue
            </Button>
          </>
        )}

        {/* SETUP: TOTP */}
        {screen === 'setup-totp' && (
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="p-2 rounded-xl" style={{ background: '#0F0F0F', border: '1px solid var(--border)' }}>
                {qrUrl && <img src={qrUrl} alt="TOTP QR" width={160} height={160} />}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                <Smartphone size={12} />
                Scan with Google Authenticator, then enter the 6-digit code
              </div>
              <Input
                label="6-digit code"
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center font-mono text-lg tracking-widest"
                data-selectable
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyTOTP(); }}
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>}
            <Button variant="primary" onClick={handleVerifyTOTP} disabled={totp.length !== 6}>
              Verify & Unlock
            </Button>
          </>
        )}

        {/* LOGIN */}
        {screen === 'login' && (
          <>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Master password"
                  data-selectable
                  autoFocus
                />
                <button
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-8 opacity-40 hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Authenticator Code"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center font-mono tracking-widest"
                  data-selectable
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                />
                <KeyRound size={13} className="absolute right-3 top-8 opacity-30" style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            {error && <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>}
            <Button variant="primary" onClick={handleLogin} loading={loading} disabled={!password || totp.length !== 6}>
              Unlock
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
