import {
  readItems, writeItems,
  readPatterns, writePatterns,
  readOverrides, writeOverrides,
} from '@/lib/plan-storage';
import { readTasks, writeTasks } from '@/lib/storage';
import { updateTaskStatus, createTask, archiveTask } from '@/services/tasks.service';
import { weekdayOf, toISODate, deadlineISOFromDate } from '@/lib/date';
import type {
  PlanItem, RecurrencePattern, PatternOverride, DisplayItem, Priority,
} from '@/types/plan';

/* ─── helpers ──────────────────────────────────────────────────────────── */

const PRIORITY_RANK: Record<Priority, number> = { A: 0, B: 1, C: 2 };

function sortDisplay(
  a: { time: string | null; priority: Priority },
  b: { time: string | null; priority: Priority },
): number {
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

/** id канбан-задач, уже представленных plan-пунктами (листок → доска) — чтобы не дублировать в дне/месяце. */
function linkedTaskIds(items: PlanItem[]): Set<string> {
  const s = new Set<string>();
  for (const i of items) if (i.task_id) s.add(i.task_id);
  return s;
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

  // Канбан-задачи с дедлайном на эту дату (локально), кроме уже показанных как plan-пункты
  const todayMs = Date.now();
  const linked = linkedTaskIds(items);
  for (const t of readTasks()) {
    if (t.status === 'Archived' || !t.deadline) continue;
    if (linked.has(t.id)) continue;
    if (toISODate(new Date(t.deadline)) !== date) continue;
    result.push({
      kind:     'task',
      id:       `task:${t.id}`,
      task_id:  t.id,
      date,
      title:    t.title,
      note:     t.description,
      time:     null,
      priority: t.priority,
      done:     t.status === 'Resolved',
      overdue:  new Date(t.deadline).getTime() < todayMs && t.status !== 'Resolved',
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

  // Канбан-задачи: добавляем как пункты на дату их дедлайна (кроме связанных с plan-пунктами)
  const dateSet = new Set(dates);
  const linkedSummary = linkedTaskIds(items);
  for (const t of readTasks()) {
    if (t.status === 'Archived' || !t.deadline) continue;
    if (linkedSummary.has(t.id)) continue;
    const taskDate = toISODate(new Date(t.deadline));
    if (!dateSet.has(taskDate)) continue;
    const row = out[taskDate] ?? { total: 0, done: 0 };
    row.total++;
    if (t.status === 'Resolved') row.done++;
    out[taskDate] = row;
  }

  return out;
}

/**
 * Полные списки пунктов для каждой переданной даты — одним проходом по хранилищу.
 * Возвращает `Record<'YYYY-MM-DD', DisplayItem[]>`; пустые дни отсутствуют в результате.
 *
 * Используется месячной сеткой для рендера мини-полосок в ячейках.
 */
export function getMonthItems(dates: string[]): Record<string, DisplayItem[]> {
  const allItems     = readItems();
  const allPatterns  = readPatterns();
  const allOverrides = readOverrides();
  const allTasks     = readTasks();
  const todayMs      = Date.now();

  // Группируем по дате — чтобы не сканировать массивы для каждого из 42 дней.
  const itemsByDate = new Map<string, PlanItem[]>();
  for (const i of allItems) {
    const arr = itemsByDate.get(i.date) ?? [];
    arr.push(i);
    itemsByDate.set(i.date, arr);
  }

  const linkedMonth = linkedTaskIds(allItems);
  const tasksByDate = new Map<string, typeof allTasks>();
  for (const t of allTasks) {
    if (t.status === 'Archived' || !t.deadline) continue;
    if (linkedMonth.has(t.id)) continue;
    const d = toISODate(new Date(t.deadline));
    const arr = tasksByDate.get(d) ?? [];
    arr.push(t);
    tasksByDate.set(d, arr);
  }

  const dateSet = new Set(dates);
  const out: Record<string, DisplayItem[]> = {};

  for (const date of dateSet) {
    const wd = weekdayOf(date);
    const result: DisplayItem[] = [];

    // PlanItem
    for (const i of itemsByDate.get(date) ?? []) {
      result.push({ ...i, kind: 'item' });
    }

    // Pattern occurrences
    for (const p of allPatterns) {
      if (!p.active || !p.weekdays.includes(wd)) continue;
      const ov = findOverride(allOverrides, p.id, date);
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

    // Канбан-задачи с дедлайном на эту дату
    for (const t of tasksByDate.get(date) ?? []) {
      result.push({
        kind:     'task',
        id:       `task:${t.id}`,
        task_id:  t.id,
        date,
        title:    t.title,
        note:     t.description,
        time:     null,
        priority: t.priority,
        done:     t.status === 'Resolved',
        overdue:  new Date(t.deadline!).getTime() < todayMs && t.status !== 'Resolved',
      });
    }

    if (result.length > 0) out[date] = result.sort(sortDisplay);
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
  /** Завести связанную задачу в ОЧЕРЕДИ доски (листок → доска). */
  linkToBoard?: boolean;
}

export async function addItem(input: PlanItemInput): Promise<PlanItem> {
  let taskId: string | null = null;

  // Листок → доска: создаём задачу в ОЧЕРЕДИ (status New) с дедлайном на этот день.
  if (input.linkToBoard) {
    const task = await createTask({
      title:    input.title,
      priority: input.priority ?? 'C',
      status:   'New',
      deadline: deadlineISOFromDate(input.date),
      source_type: 'text',
    });
    taskId = task.id;
  }

  const item: PlanItem = {
    id:         crypto.randomUUID(),
    date:       input.date,
    title:      input.title,
    note:       input.note ?? null,
    time:       input.time ?? null,
    priority:   input.priority ?? 'C',
    done:       false,
    pattern_id: null,
    task_id:    taskId,
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

export async function deleteItem(id: string): Promise<void> {
  const items = readItems();
  const item  = items.find((i) => i.id === id);
  writeItems(items.filter((i) => i.id !== id));
  // Связанную задачу убираем с доски, чтобы не висела осиротевшей.
  if (item?.task_id) {
    try { await archiveTask(item.task_id); } catch { /* уже удалена */ }
  }
}

/**
 * Перенести все незавершённые реальные пункты из прошлых дней на дату `date`.
 * Повторы-шаблоны не трогаем (они рекуррентны). Возвращает число перенесённых.
 */
export function carryOverTo(date: string): number {
  const items = readItems();
  const movedTaskIds: string[] = [];
  let moved = 0;
  for (const i of items) {
    if (!i.done && i.date < date) {
      i.date = date;
      if (i.task_id) movedTaskIds.push(i.task_id);
      moved++;
    }
  }
  if (moved > 0) writeItems(items);

  // Двигаем дедлайн связанных задач на новый день, чтобы доска/календарь не разъехались.
  if (movedTaskIds.length > 0) {
    const tasks = readTasks();
    const set = new Set(movedTaskIds);
    let changed = false;
    for (const t of tasks) {
      if (set.has(t.id) && t.status !== 'Archived' && t.status !== 'Resolved') {
        t.deadline = deadlineISOFromDate(date);
        changed = true;
      }
    }
    if (changed) writeTasks(tasks);
  }
  return moved;
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
export async function togglePlanDone(item: DisplayItem): Promise<void> {
  if (item.kind === 'item') {
    const nextDone = !item.done;
    updateItem(item.id, { done: nextDone });
    // Связанная задача: отметка в листке синкается с доской (готово ↔ ОЧЕРЕДЬ).
    if (item.task_id) {
      try { await updateTaskStatus(item.task_id, nextDone ? 'Resolved' : 'New'); } catch { /* задача удалена */ }
    }
  } else if (item.kind === 'occurrence') {
    upsertOverride(item.pattern_id, item.date, { done: !item.done });
  } else {
    // kind === 'task' — меняем статус канбан-задачи
    await updateTaskStatus(item.task_id, item.done ? 'In Progress' : 'Resolved');
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
    task_id:    null,
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

/* ─── архив выполненного ───────────────────────────────────────────────── */

export interface ArchiveEntry {
  id: string;
  title: string;
  time: string | null;
  priority: Priority;
  kind: 'item' | 'occurrence' | 'task';
}

export interface ArchiveDay {
  date: string;            // 'YYYY-MM-DD'
  entries: ArchiveEntry[];
}

/**
 * Всё выполненное, сгруппированное по дням (новые сверху): пункты плана,
 * отмеченные вхождения шаблонов и закрытые канбан-задачи.
 * `limitDays` — максимум дней с записями в результате.
 */
export function getArchive(limitDays = 90): ArchiveDay[] {
  const byDate = new Map<string, ArchiveEntry[]>();
  const push = (date: string, entry: ArchiveEntry) => {
    const arr = byDate.get(date) ?? [];
    arr.push(entry);
    byDate.set(date, arr);
  };

  for (const i of readItems()) {
    if (!i.done) continue;
    push(i.date, { id: i.id, title: i.title, time: i.time, priority: i.priority, kind: 'item' });
  }

  const patternById = new Map(readPatterns().map((p) => [p.id, p]));
  for (const o of readOverrides()) {
    if (!o.done || o.skipped) continue;
    const p = patternById.get(o.pattern_id);
    if (!p) continue;
    push(o.date, {
      id:       occurrenceId(o.pattern_id, o.date),
      title:    p.title,
      time:     p.time,
      priority: p.priority,
      kind:     'occurrence',
    });
  }

  for (const t of readTasks()) {
    if (t.status !== 'Resolved') continue;
    const date = toISODate(new Date(t.resolved_at ?? t.created_at));
    push(date, { id: `task:${t.id}`, title: t.title, time: null, priority: t.priority, kind: 'task' });
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, limitDays)
    .map(([date, entries]) => ({ date, entries: entries.sort(sortDisplay) }));
}
