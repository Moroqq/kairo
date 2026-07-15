import { create } from 'zustand';
import {
  hasAccount, createAccount, shouldShowRecoveryCode, markRecoveryCodeShown,
  redeemPairingTicket, redeemRecoveryCode,
} from '@/lib/account';

interface AccountState {
  ready: boolean;              // локальное состояние прочитано хотя бы раз
  hasAccount: boolean;
  recoveryCodeToShow: string | null; // не null → показываем RecoveryCodeReveal с этим кодом

  /** Только читает локальное состояние — НИЧЕГО не создаёт на сервере сама.
   *  Создание аккаунта — осознанное действие пользователя (см. createNewAccount),
   *  иначе КАЖДОЕ новое устройство при первом запуске заводило бы свой
   *  отдельный аккаунт вместо того, чтобы дождаться парности с существующим. */
  checkLocalState: () => void;
  createNewAccount: () => Promise<void>;
  dismissRecoveryReveal: () => void;
  pairWithTicket: (ticket: string) => Promise<void>;
  recoverWithCode: (code: string) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set) => ({
  ready: false,
  hasAccount: false,
  recoveryCodeToShow: null,

  checkLocalState: () => {
    set({ ready: true, hasAccount: hasAccount() });
  },

  /** Явное «Создать облачный аккаунт» — только когда пользователь сам это выбрал. */
  createNewAccount: async () => {
    const recoveryCode = await createAccount();
    set({
      hasAccount: true,
      recoveryCodeToShow: shouldShowRecoveryCode() ? recoveryCode : null,
    });
  },

  dismissRecoveryReveal: () => {
    markRecoveryCodeShown();
    set({ recoveryCodeToShow: null });
  },

  pairWithTicket: async (ticket: string) => {
    await redeemPairingTicket(ticket);
    set({ hasAccount: true });
  },

  /** Восстановление выдаёт НОВЫЙ код взамен старого — его тоже нужно показать один раз. */
  recoverWithCode: async (code: string) => {
    const newRecoveryCode = await redeemRecoveryCode(code);
    set({ hasAccount: true, recoveryCodeToShow: newRecoveryCode });
  },
}));
