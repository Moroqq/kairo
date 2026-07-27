import { useSyncExternalStore } from 'react';

/**
 * Реальный статус сети из navigator.onLine + события online/offline.
 * Раньше индикатор «В СЕТИ» был зашит текстом и горел всегда — теперь честный.
 */
function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

export function useOnline(): boolean {
  // На сервере (SSR) считаем, что сеть есть — но приложение всё равно клиентское.
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
