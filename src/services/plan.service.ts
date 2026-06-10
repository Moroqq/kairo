import {
  readItems, writeItems,
  readPatterns, writePatterns,
  readOverrides, writeOverrides,
} from '@/lib/plan-storage';
import { weekdayOf } from '@/lib/date';
import type {
  PlanItem, RecurrencePattern, PatternOverride, DisplayItem, Priority,
} from '@/types/plan';

/* ─── helpers ──────────────────────────────────────────────────────────── */

const PRIORITY_RANK: Record<Priority, number> = { A: 0, B: 1, C: 2, D: 3 };

function sortDisplay(a: DisplayItem, b: DisplayItem): number {
  // Сначала со временем (по возрастанию), затем без времени; внутри — по приоритету
  if (a.time && b.time) {
    if (a.time !== b.time) return a.time < b.time ? -1 : 1;
  } else if (a.time) return -1;
  else if (b.time) return 1;
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}

function occurrenceId(patternId: string, date: string): string {
  return `pat:${patternId}:${date}`;
}

function findOverride(
  overrides: PatternOverride[], patternId: string, date: string,
): PatternOverride | undefined {
  return overrides.find((o) => o.pattern_id === patternId && o.date === date);
}

/* ─── чтение: материализация дня ───────────────────────────────────────── */

/**
 * Список пунктов на конкретный день: реальные PlanItem + виртуальные вхождения
 * активных шаблонов (по дню недели), с учётом overrides (отметка/пропуск).
 */
export function getDayItems(date: string): DisplayItem[] {
  const items     = readItems().filter((i) => i.date === date);
  const patterns  = readPatterns();
  const overrides = readOverrides();
  const wd = weekdayOf(date);

  const result: DisplayItem[] = items.map((i) => ({ ...i, kind: 'item' as const }));

  for (const p of patterns) {
    if (!p.active || !p.weekdays.includes(wd)) continue;
    const ov = findOverride(overrides, p.id, date);
    if (ov?.skipped) continue;
    result.push({
      kind:       'occurrence',
      id:         occurrenceId(p.id, date),
      pattern_id: p.id,
      date,
      title:      p.title,
      note:       p.note,
      time:       p.time,
      priority:   p.priority,
      done:       Boolean(ov?.done),
    });
  }

  return result.sort(sortDisplay);
}

/** Сводка по месяцу для бейджей в сетке: { 'YYYY-MM-DD': { total, done } }. */
export function getMonthSummary(
  dates: string[],
): Record<string, { total: number; done: number }> {
  const items     = readItems();
  const patterns  = readPatterns().filter((p) => p.active);
  const overrides = readOverrides();

  const itemsByDate = new Map<string, PlanItem[]>();
  for (const i of items) {
    const arr = itemsByDate.get(i.date) ?? [];
    arr.push(i);
    itemsByDate.set(i.date, arr);
  }

  const out: Record<string, { total: number; done: number }> = {};
  for (const date of dates) {
    let total = 0;
    let done  = 0;
    for (const i of itemsByDate.get(date) ?? []) {
      total++;
      if (i.done) done++;
    }
    const wd = weekdayOf(date);
    for (const p of patterns) {
      if (!p.weekdays.includes(wd)) continue;
      const ov = findOverride(overrides, p.id, date);
      if (ov?.skipped) continue;
      total++;
      if (ov?.done) done++;
    }
    if (total > 0) out[date] = { total, done };
  }
  return out;
}

/* ─── мутации: реальные пункты ─────────────────────────────────────────── */

export interface PlanItemInput {
  date: string;
  title: string;
  note?: string | null;
  time?: string | null;
  priority?: Priority;
}

export function addItem(input: PlanItemInput): PlanItem {
  const item: PlanItem = {
    id:         crypto.randomUUID(),
    date:       input.date,
    title:      input.title,
    note:       input.note ?? null,
    time:       input.time ?? null,
    priority:   input.priority ?? 'C',
    done:       false,
    pattern_id: null,
    created_at: new Date().toISOString(),
  };
  const items = readItems();
  items.push(item);
  writeItems(items);
  return item;
}

export function updateItem(
  id: string,
  updates: Partial<Pick<PlanItem, 'title' | 'note' | 'time' | 'priority' | 'done' | 'date'>>,
): void {
  const items = readItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  items[idx] = { ...items[idx], ...updates };
  writeItems(items);
}

export function deleteItem(id: string): void {
  writeItems(readItems().filter((i) => i.id !== id));
}

/* ─── мутации: вхождения шаблонов ──────────────────────────────────────── */

function upsertOverride(patternId: string, date: string, patch: Partial<PatternOverride>): void {
  const overrides = readOverrides();
  const idx = overrides.findIndex((o) => o.pattern_id === patternId && o.date === date);
  if (idx === -1) {
    overrides.push({ pattern_id: patternId, date, ...patch });
  } else {
    overrides[idx] = { ...overrides[idx], ...patch };
  }
  writeOverrides(overrides);
}

/** Универсальный toggle «сделано» для любого DisplayItem. */
export function togglePlanDone(item: DisplayItem): void {
  if (item.kind === 'item') {
    updateItem(item.id, { done: !item.done });
  } else {
    upsertOverride(item.pattern_id, item.date, { done: !item.done });
  }
}

/** Убрать вхождение шаблона на один день (skipped). */
export function removeOccurrence(patternId: string, date: string): void {
  upsertOverride(patternId, date, { skipped: true, done: false });
}

/**
 * «Отвязать» вхождение шаблона на конкретный день: создаём из него реальный
 * PlanItem (с правками) и помечаем вхождение skipped, чтобы не задвоилось.
 */
export function detachOccurrence(
  pattern: RecurrencePattern,
  date: string,
  edits: Partial<PlanItemInput> & { done?: boolean },
): PlanItem {
  const item: PlanItem = {
    id:         crypto.randomUUID(),
    date,
    title:      edits.title ?? pattern.title,
    note:       edits.note  ?? pattern.note,
    time:       edits.time  !== undefined ? edits.time : pattern.time,
    priority:   edits.priority ?? pattern.priority,
    done:       edits.done ?? false,
    pattern_id: pattern.id,
    created_at: new Date().toISOString(),
  };
  const items = readItems();
  items.push(item);
  writeItems(items);
  upsertOverride(pattern.id, date, { skipped: true });
  return item;
}

/* ─── мутации: шаблоны ─────────────────────────────────────────────────── */

export interface PatternInput {
  title: string;
  note?: string | null;
  time?: string | null;
  priority?: Priority;
  weekdays: number[];
}

export function createPattern(input: PatternInput): RecurrencePattern {
  const pattern: RecurrencePattern = {
    id:         crypto.randomUUID(),
    title:      input.title,
    note:       input.note ?? null,
    time:       input.time ?? null,
    priority:   input.priority ?? 'C',
    weekdays:   [...input.weekdays].sort((a, b) => a - b),
    active:     true,
    created_at: new Date().toISOString(),
  };
  const patterns = readPatterns();
  patterns.push(pattern);
  writePatterns(patterns);
  return pattern;
}

export function updatePattern(
  id: string,
  updates: Partial<Pick<RecurrencePattern, 'title' | 'note' | 'time' | 'priority' | 'weekdays' | 'active'>>,
): void {
  const patterns = readPatterns();
  const idx = patterns.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const next = { ...patterns[idx], ...updates };
  if (updates.weekdays) next.weekdays = [...updates.weekdays].sort((a, b) => a - b);
  patterns[idx] = next;
  writePatterns(patterns);
}

export function togglePattern(id: string): void {
  const patterns = readPatterns();
  const idx = patterns.findIndex((p) => p.id === id);
  if (idx === -1) return;
  patterns[idx] = { ...patterns[idx], active: !patterns[idx].active };
  writePatterns(patterns);
}

/** Удалить шаблон и связанные с ним overrides. */
export function deletePattern(id: string): void {
  writePatterns(readPatterns().filter((p) => p.id !== id));
  writeOverrides(readOverrides().filter((o) => o.pattern_id !== id));
}

export function getPatterns(): RecurrencePattern[] {
  return readPatterns().sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
