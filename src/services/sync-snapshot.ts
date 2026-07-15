/**
 * Общий «снимок» синхронизируемых данных — используется и LAN-синком,
 * и облачным (VPS) синком. Единый список ключей и единая логика
 * чтения/записи, чтобы оба канала синхронизировали ровно одно и то же.
 */

import { queryClient } from '@/lib/query-client';

export const SYNC_KEYS = [
  'kairo_tasks',
  'kairo_event_logs',
  'kairo_plan_items',
  'kairo_plan_patterns',
  'kairo_plan_overrides',
  'kairo_expenses',
  'kairo_dailies',
  'kairo_daily_marks',
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
