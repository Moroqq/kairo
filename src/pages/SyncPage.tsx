import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAccountStore } from '@/stores/account.store';
import { useToast } from '@/components/ui/Toast';
import { AboutFooter } from '@/components/ui/AboutFooter';
import { describeAuthError, LOGIN_MIN, PASSWORD_MIN } from '@/lib/account';
import { isTauri } from '@tauri-apps/api/core';
import vpsSync, { type VpsSyncState } from '@/services/vps-sync.service';
import { checkNow, startUpdate, useBannerState, installNow } from '@/components/updates/UpdateBanner';

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

// ── Экран входа ────────────────────────────────────────────────────────

/** Общее поле формы — чтобы вход и регистрация выглядели одинаково. */
function Field({ label, value, onChange, type = 'text', placeholder, autoComplete, onEnter }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string; onEnter?: () => void;
}) {
  return (
    <label className="block">
      <span className="block font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        className="w-full font-mono px-3 py-2 rounded"
        style={{
          background: 'var(--bg-input)', color: 'var(--text-primary)',
          border: '1px solid var(--border)', fontSize: 16,   // 16px — иначе iOS зумит форму
        }}
      />
    </label>
  );
}

function AuthView() {
  const signIn = useAccountStore((s) => s.signIn);
  const signUp = useAccountStore((s) => s.signUp);
  const { toast } = useToast();

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const l = login.trim();
    if (!l || !password) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'in') await signIn(l, password);
      else await signUp(l, password);
      setPassword('');
      toast(mode === 'in' ? 'Вход выполнен' : 'Аккаунт создан');
    } catch (e) {
      setError(describeAuthError(e));
    } finally {
      setBusy(false);
    }
  }, [login, password, mode, signIn, signUp, toast]);

  return (
    <>
      <Header title="SYNC" subtitle="облако · вход в аккаунт" />

      <Card>
        <CardTitle>{mode === 'in' ? 'ВХОД' : 'НОВЫЙ АККАУНТ'}</CardTitle>
        <div className="p-4 flex flex-col gap-3">
          <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {mode === 'in'
              ? 'Введи логин и пароль — задачи, планы и траты подтянутся из облака.'
              : `Логин от ${LOGIN_MIN} символов (латиница, цифры, точка, дефис, подчёркивание), пароль от ${PASSWORD_MIN}.`}
          </p>

          <Field
            label="логин" value={login} onChange={setLogin}
            placeholder="например, moroqq" autoComplete="username" onEnter={submit}
          />
          <Field
            label="пароль" value={password} onChange={setPassword} type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'} onEnter={submit}
          />

          {error && (
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--danger)', lineHeight: 1.4 }}>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy || !login.trim() || !password}
            className="w-full font-mono py-3 rounded flex items-center justify-center gap-2"
            style={{
              background: 'var(--accent)', color: 'var(--on-accent)', border: 'none',
              cursor: busy ? 'wait' : 'pointer', opacity: busy || !login.trim() || !password ? 0.5 : 1,
              boxShadow: '0 0 12px var(--accent-glow)',
            }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === 'in' ? 'войти' : 'создать аккаунт'}
          </button>
        </div>
      </Card>

      <button
        onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(null); }}
        className="font-mono text-xs"
        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 0' }}
      >
        {mode === 'in' ? '▸ нет аккаунта — создать' : '▸ уже есть аккаунт — войти'}
      </button>
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

/**
 * Аккаунт без логина — наследие схемы с токенами устройств. Именно в таком
 * аккаунте сейчас лежат данные ноутбука, поэтому здесь не «создай новый»,
 * а «привяжи логин к этому»: иначе данные остались бы в аккаунте, в который
 * невозможно войти с другого устройства.
 */
function AttachCredentialsCard() {
  const attach = useAccountStore((s) => s.attachCredentials);
  const { toast } = useToast();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const l = login.trim();
    if (!l || !password) return;
    setBusy(true);
    setError(null);
    try {
      await attach(l, password);
      setPassword('');
      toast('Теперь можно входить с других устройств');
    } catch (e) {
      setError(describeAuthError(e));
    } finally {
      setBusy(false);
    }
  }, [login, password, attach, toast]);

  return (
    <Card>
      <CardTitle>ЗАДАТЬ ЛОГИН И ПАРОЛЬ</CardTitle>
      <div className="p-4 flex flex-col gap-3">
        <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          У этого аккаунта ещё нет логина — зайти в него с другого устройства
          нельзя. Задай логин и пароль, данные останутся те же.
        </p>
        <Field label="логин" value={login} onChange={setLogin} placeholder="например, moroqq" autoComplete="username" onEnter={submit} />
        <Field label="пароль" value={password} onChange={setPassword} type="password" autoComplete="new-password" onEnter={submit} />
        {error && (
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--danger)', lineHeight: 1.4 }}>{error}</div>
        )}
        <button
          onClick={submit}
          disabled={busy || !login.trim() || !password}
          className="w-full font-mono py-3 rounded flex items-center justify-center gap-2"
          style={{
            background: 'var(--accent)', color: 'var(--on-accent)', border: 'none',
            cursor: busy ? 'wait' : 'pointer', opacity: busy || !login.trim() || !password ? 0.5 : 1,
          }}
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          сохранить
        </button>
      </div>
    </Card>
  );
}

function AccountCard() {
  const login = useAccountStore((s) => s.login);
  const signOut = useAccountStore((s) => s.signOut);
  const sync = useSyncState();
  const pending = sync.pendingChanges;
  // Сервер не принимает токен этого устройства (например, креды остались от
  // прежнего бэкенда). Отправить накопленное всё равно невозможно, поэтому
  // выход — не потеря, а единственный способ войти заново.
  const rejected = (sync.lastError ?? '').includes('отклонил токен');
  const [confirming, setConfirming] = useState(false);

  return (
    <Card>
      <div className="px-4 py-3 font-mono">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>АККАУНТ</div>
        <div style={{ fontSize: 14, color: login ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: 2 }}>
          {login ?? 'логин не определён — нет связи с сервером'}
        </div>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="font-mono text-xs"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px 0 0' }}
          >
            выйти
          </button>
        ) : (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: pending && !rejected ? 'var(--danger)' : 'var(--text-muted)', lineHeight: 1.5 }}>
              {rejected
                ? 'Сервер не принимает вход этого устройства, отправить данные отсюда нельзя. Выйди и войди заново по логину и паролю.'
                : pending
                  ? 'Есть изменения, которые ещё не уехали в облако — при выходе они пропадут. Сначала синхронизируй.'
                  : 'Устройство забудет аккаунт и локальные данные. В облаке они останутся.'}
            </div>
            <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
              {/* Выход с сохранением данных — для устройства, на котором лежит
                  единственная копия задач, а войти в старый аккаунт нельзя.
                  Данные останутся здесь и уедут в тот аккаунт, куда войдёшь. */}
              <button
                onClick={() => signOut({ keepData: true })}
                className="font-mono py-2 px-3 rounded"
                style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12 }}
              >
                выйти, оставив задачи на этом устройстве
              </button>
              <button
                onClick={() => signOut()}
                className="font-mono py-2 px-3 rounded"
                style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--border-danger)', cursor: 'pointer', fontSize: 12 }}
              >
                выйти и стереть всё локальное
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="font-mono py-2 px-3 rounded"
                style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12 }}
              >
                отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function PairedView() {
  const login = useAccountStore((s) => s.login);
  const loginUnknown = useAccountStore((s) => s.loginUnknown);

  return (
    <>
      <Header title="SYNC" subtitle="облако · автоматический" />

      <SyncStatusCard />

      {/* AccountCard рисуем всегда: если сервер отверг токен, логин узнать
          нельзя, и раньше кнопка «выйти» просто не появлялась — устройство
          застревало в этом состоянии без способа перелогиниться. */}
      {login === null && !loginUnknown && <AttachCredentialsCard />}
      <AccountCard />

      <Card>
        <div className="px-4 py-3 font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Синхронизация автоматическая: изменения уходят в облако через
          пару секунд после того как ты замер, а при открытии приложения
          и возврате из фона данные подтягиваются сами. Чтобы работать
          с этими же данными на другом устройстве — просто войди там под
          тем же логином.
        </div>
      </Card>
    </>
  );
}

// ── Root ────────────────────────────────────────────────────────────────

function UpdateCheckerRow() {
  const s = useBannerState();
  // В вебе апдейтера нет — строка «проверить обновления» там только путает.
  if (!isTauri()) return null;

  const hasUpdate  = s.phase === 'available' && !!s.update;
  const downloaded = s.phase === 'ready' && !!s.update;
  const busy = s.phase === 'checking' || s.phase === 'downloading' || s.phase === 'installing';
  const highlighted = hasUpdate || downloaded;

  const humanSize = (b: number) => `${(b / (1024 * 1024)).toFixed(1)} МБ`;
  const pct = s.progress.total
    ? Math.min(100, Math.round((s.progress.done / s.progress.total) * 100))
    : null;

  const label = (() => {
    if (s.phase === 'checking')    return 'проверяю…';
    if (s.phase === 'downloading') return 'скачиваю…';
    if (s.phase === 'installing')  return 'запускаю установщик…';
    if (s.phase === 'done')        return 'обновление запущено';
    if (downloaded)                return `установить v${s.update!.version}`;
    if (hasUpdate)                 return `скачать v${s.update!.version}`;
    if (s.phase === 'no-update')   return 'уже последняя версия';
    if (s.phase === 'error')       return 'проверить ещё раз';
    return 'проверить обновления';
  })();

  const onClick = () => {
    if (downloaded) { void installNow(); return; }
    if (hasUpdate)  { void startUpdate(); return; }
    void checkNow();
  };

  return (
    <>
      <button
        // Раньше эта строка умела только перепроверять: даже когда обновление
        // было найдено, нажатие ничего не устанавливало — поставить можно было
        // только из баннера, а его легко закрыть крестиком.
        onClick={onClick}
        disabled={busy}
        className="w-full font-mono py-2 rounded flex items-center justify-center gap-2"
        style={{
          background: highlighted ? 'var(--accent)' : 'transparent',
          color: highlighted ? 'var(--on-accent)' : 'var(--text-muted)',
          border: `1px solid ${highlighted ? 'var(--accent)' : 'var(--border)'}`,
          cursor: busy ? 'wait' : 'pointer',
          fontSize: 12,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy && <Loader2 size={12} className="animate-spin" />}
        {label}
      </button>

      {s.phase === 'downloading' && (
        <div style={{ marginTop: 8 }}>
          <div
            className="font-mono flex items-center justify-between"
            style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}
          >
            <span>
              {humanSize(s.progress.done)}
              {s.progress.total ? ` из ${humanSize(s.progress.total)}` : ''}
            </span>
            <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {pct !== null ? `${pct}%` : ''}
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: pct !== null ? `${pct}%` : '35%',
                background: 'var(--accent)',
                borderRadius: 2,
                transition: 'width 180ms linear',
                animation: pct === null ? 'km-indeterminate 1.1s ease-in-out infinite' : undefined,
              }}
            />
          </div>
        </div>
      )}

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
        {hasAccount ? <PairedView /> : <AuthView />}

        <div style={{ marginTop: 12 }}>
          <UpdateCheckerRow />
        </div>

        <AboutFooter version={__APP_VERSION__} />
      </div>
    </div>
  );
}
