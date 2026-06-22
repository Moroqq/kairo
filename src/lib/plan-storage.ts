import type { PlanItem, RecurrencePattern, PatternOverride, Priority } from '@/types/plan';

const ITEMS_KEY     = 'kairo_plan_items';
const PATTERNS_KEY  = 'kairo_plan_patterns';
const OVERRIDES_KEY = 'kairo_plan_overrides';

const VALID_PRIORITIES: Priority[] = ['A', 'B', 'C', 'D'];

function normPriority(p: unknown): Priority {
  return VALID_PRIORITIES.includes(p as Priority) ? (p as Priority) : 'C';
}

function readJSON<T>(key: string): T[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/* ─── PlanItem ─────────────────────────────────────────────────────────── */

function migrateItem(raw: any): PlanItem {
  return {
    id:         raw.id || crypto.randomUUID(),
    date:       typeof raw.date === 'string' ? raw.date : '',
    title:      typeof raw.title === 'string' ? raw.title : '(без названия)',
    note:       raw.note ?? null,
    time:       raw.time ?? null,
    priority:   normPriority(raw.priority),
    done:       Boolean(raw.done),
    pattern_id: raw.pattern_id ?? null,
    task_id:    raw.task_id ?? null,
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export function readItems(): PlanItem[] {
  return readJSON<any>(ITEMS_KEY).map(migrateItem).filter((i) => i.date);
}

export function writeItems(items: PlanItem[]): void {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

/* ─── RecurrencePattern ────────────────────────────────────────────────── */

function migratePattern(raw: any): RecurrencePattern {
  return {
    id:         raw.id || crypto.randomUUID(),
    title:      typeof raw.title === 'string' ? raw.title : '(без названия)',
    note:       raw.note ?? null,
    time:       raw.time ?? null,
    priority:   normPriority(raw.priority),
    weekdays:   Array.isArray(raw.weekdays)
                  ? raw.weekdays.filter((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6)
                  : [],
    active:     raw.active !== false,
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export function readPatterns(): RecurrencePattern[] {
  return readJSON<any>(PATTERNS_KEY).map(migratePattern);
}

export function writePatterns(patterns: RecurrencePattern[]): void {
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
}

/* ─── PatternOverride ──────────────────────────────────────────────────── */

export function readOverrides(): PatternOverride[] {
  return readJSON<any>(OVERRIDES_KEY)
    .filter((o) => o && typeof o.pattern_id === 'string' && typeof o.date === 'string')
    .map((o) => ({
      pattern_id: o.pattern_id,
      date:       o.date,
      done:       o.done,
      skipped:    o.skipped,
    }));
}

export function writeOverrides(overrides: PatternOverride[]): void {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}
