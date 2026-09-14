/**
 * Общий «снимок» синхронизируемых данных — используется и LAN-синком,
 * и облачным (VPS) синком. Единый список ключей и единая логика
 * чтения/записи, чтобы оба канала синхронизировали ровно одно и то же.
 */

import { queryClient } from '@/lib/query-client';

/**
 * В облачных снимках, снятых до удаления раздела «дэйлики», ещё лежат ключи
 * `kairo_dailies` и `kairo_daily_marks`. Это безопасно: applySnapshot берёт
 * только то, что перечислено здесь, а лишнее молча игнорирует. Локальные
 * копии этих ключей на устройствах тоже не трогаем — они никому не мешают,
 * а удалять чужие данные ради чистоты не стоит.
 */
export const SYNC_KEYS = [
  'kairo_tasks',
  'kairo_event_logs',
  'kairo_plan_items',
  'kairo_plan_patterns',
  'kairo_plan_overrides',
  'kairo_expenses',
] as const;

export type SyncKey = typeof SYNC_KEYS[number];

export interface SyncSnapshot {
  data: Record<string, string>;
  ts: string; // ISO
}

export function captureSnapshot(): SyncSnapshot {
  const data: Record<string, string> = {};
  for (const key of SYNC_KEYS) {
    data[key] = localStorage.getItem(key) ?? '[]';
  }
  return { data, ts: new Date().toISOString() };
}

export function applySnapshot(snapshot: SyncSnapshot): void {
  for (const [k, v] of Object.entries(snapshot.data)) {
    if ((SYNC_KEYS as readonly string[]).includes(k)) {
      localStorage.setItem(k, v);
    }
  }
  queryClient.invalidateQueries();
}
