import type { Expense } from '@/types/expense';

const EXPENSES_KEY = 'kairo_expenses';

function clampDay(d: unknown): number {
  const n = Math.round(Number(d));
  if (!Number.isFinite(n)) return 1;
  return Math.min(31, Math.max(1, n));
}

function migrate(raw: any): Expense {
  return {
    id:         raw.id || crypto.randomUUID(),
    name:       typeof raw.name === 'string' ? raw.name : '(без названия)',
    amount:     Number.isFinite(Number(raw.amount)) ? Number(raw.amount) : 0,
    dayOfMonth: clampDay(raw.dayOfMonth),
    note:       raw.note ?? null,
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export function readExpenses(): Expense[] {
  try {
    const raw = JSON.parse(localStorage.getItem(EXPENSES_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.map(migrate) : [];
  } catch {
    return [];
  }
}

export function writeExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}
