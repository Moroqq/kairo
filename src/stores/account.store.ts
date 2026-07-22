import { create } from 'zustand';
import {
  hasAccount, createAccount, shouldShowRecoveryCode, markRecoveryCodeShown,
  redeemRecoveryCode,
} from '@/lib/account';

interface AccountState {
  ready: boolean;              // локальное состояние прочитано хотя бы раз
  hasAccount: boolean;
  recoveryCodeToShow: string | null; // не null → показываем RecoveryCodeReveal с этим кодом

  checkLocalState: () => void;
  createNewAccount: () => Promise<void>;
  recoverWithCode: (code: string) => Promise<void>;
  dismissRecoveryReveal: () => void;
  /** После успешного pairing (через SyncPage QR-flow) — обновить UI. */
  refreshAfterPairing: () => void;
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

  /** Восстановление выдаёт НОВЫЙ код взамен старого — его тоже нужно показать один раз. */
  recoverWithCode: async (code: string) => {
    const newRecoveryCode = await redeemRecoveryCode(code);
    set({ hasAccount: true, recoveryCodeToShow: newRecoveryCode });
  },

  dismissRecoveryReveal: () => {
    markRecoveryCodeShown();
    set({ recoveryCodeToShow: null });
  },

  refreshAfterPairing: () => {
    set({ hasAccount: hasAccount() });
  },
}));
