import { create } from 'zustand';
import {
  hasAccount, markRecoveryCodeShown,
  registerAccount, loginAccount, setAccountCredentials, fetchAccountLogin, logout,
} from '@/lib/account';
import vpsSync from '@/services/vps-sync.service';

interface AccountState {
  ready: boolean;              // локальное состояние прочитано хотя бы раз
  hasAccount: boolean;
  /** Логин текущего аккаунта; null — аккаунт есть, но входа к нему ещё нет. */
  login: string | null;
  /** Логин ещё не запрашивали у сервера. */
  loginUnknown: boolean;
  recoveryCodeToShow: string | null;

  checkLocalState: () => void;
  refreshLogin: () => Promise<void>;
  signUp: (login: string, password: string) => Promise<void>;
  signIn: (login: string, password: string) => Promise<void>;
  /** Привязать логин к уже существующему аккаунту этого устройства. */
  attachCredentials: (login: string, password: string) => Promise<void>;
  signOut: (options?: { keepData?: boolean }) => void;
  dismissRecoveryReveal: () => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  ready: false,
  hasAccount: false,
  login: null,
  loginUnknown: true,
  recoveryCodeToShow: null,

  checkLocalState: () => {
    set({ ready: true, hasAccount: hasAccount() });
    if (hasAccount()) void get().refreshLogin();
  },

  /** Спрашиваем у сервера, есть ли у аккаунта логин. Сбой сети — не беда, спросим позже. */
  refreshLogin: async () => {
    try {
      set({ login: await fetchAccountLogin(), loginUnknown: false });
    } catch {
      set({ loginUnknown: true });
    }
  },

  signUp: async (login, password) => {
    const canonical = await registerAccount(login, password);
    set({ hasAccount: true, login: canonical, loginUnknown: false });
    // Первое устройство аккаунта — источник данных: то, что уже накоплено
    // локально, надо отдать в облако.
    vpsSync.pushDebounced();
  },

  signIn: async (login, password) => {
    const canonical = await loginAccount(login, password);
    set({ hasAccount: true, login: canonical, loginUnknown: false });
    // Вход в существующий аккаунт: данные аккаунта главнее того, что
    // случайно лежит на этом устройстве.
    await vpsSync.adoptCloudState().catch((err) => console.warn('[vps-sync] post-login pull failed:', err));
  },

  attachCredentials: async (login, password) => {
    const canonical = await setAccountCredentials(login, password);
    set({ login: canonical, loginUnknown: false });
  },

  signOut: (options) => {
    vpsSync.disconnect();
    logout(options);
    set({ hasAccount: false, login: null, loginUnknown: true, recoveryCodeToShow: null });
  },

  dismissRecoveryReveal: () => {
    markRecoveryCodeShown();
    set({ recoveryCodeToShow: null });
  },
}));
