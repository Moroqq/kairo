import { create } from 'zustand';
import {
  hasAccount, createAccount, shouldShowRecoveryCode, markRecoveryCodeShown,
  redeemRecoveryCode,
} from '@/lib/account';
import vpsSync from '@/services/vps-sync.service';

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
    // Первое устройство — источник данных для нового аккаунта: сразу
    // заливаем то, что уже накопилось локально, иначе оно жило бы только
    // здесь до первой мутации.
    vpsSync.pushDebounced();
  },

  /** Восстановление выдаёт НОВЫЙ код взамен старого — его тоже нужно показать один раз. */
  recoverWithCode: async (code: string) => {
    const newRecoveryCode = await redeemRecoveryCode(code);
    set({ hasAccount: true, recoveryCodeToShow: newRecoveryCode });
    // Данные на облаке уже могут быть — сразу тянем их локально.
    // adoptCloudState, а не syncNow: у аккаунта данные главнее локальных.
    vpsSync.adoptCloudState().catch((err) => console.warn('[vps-sync] post-recovery pull failed:', err));
  },

  dismissRecoveryReveal: () => {
    markRecoveryCodeShown();
    set({ recoveryCodeToShow: null });
  },

  refreshAfterPairing: () => {
    set({ hasAccount: hasAccount() });
    // После успешной парности сразу тянем данные с облака —
    // пользователю не надо жать никаких кнопок.
    vpsSync.adoptCloudState().catch((err) => console.warn('[vps-sync] post-pair pull failed:', err));
  },
}));
