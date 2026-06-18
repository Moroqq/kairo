import { readExpenses, writeExpenses } from '@/lib/expense-storage';
import { toISODate } from '@/lib/date';
import type { Expense, ExpenseView } from '@/types/expense';

export interface ExpenseInput {
  name: string;
  amount: number;
  dayOfMonth: number;
  note?: string | null;
}

/* ─── CRUD ─────────────────────────────────────────────────────────────── */

export function getExpenses(): Expense[] {
  return readExpenses();
}

export function addExpense(input: ExpenseInput): Expense {
  const expense: Expense = {
    id:         crypto.randomUUID(),
    name:       input.name,
    amount:     input.amount,
    dayOfMonth: clampDay(input.dayOfMonth),
    note:       input.note ?? null,
    created_at: new Date().toISOString(),
  };
  const list = readExpenses();
  list.push(expense);
  writeExpenses(list);
  return expense;
}

export function updateExpense(
  id: string,
  updates: Partial<Pick<Expense, 'name' | 'amount' | 'dayOfMonth' | 'note'>>,
): void {
  const list = readExpenses();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const next = { ...list[idx], ...updates };
  if (updates.dayOfMonth !== undefined) next.dayOfMonth = clampDay(updates.dayOfMonth);
  list[idx] = next;
  writeExpenses(list);
}

export function deleteExpense(id: string): void {
  writeExpenses(readExpenses().filter((e) => e.id !== id));
}

/* ─── Вычисления ───────────────────────────────────────────────────────── */

/**
 * Ближайшая дата оплаты для дня месяца `dayOfMonth`, начиная с сегодня.
 * Учитывает короткие месяцы: 31-е в феврале → последний день февраля.
 */
function nextPaymentDate(dayOfMonth: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const build = (year: number, month: number): Date => {
    const lastDay = new Date(year, month + 1, 0).getDate(); // дней в месяце
    return new Date(year, month, Math.min(dayOfMonth, lastDay));
  };

  let candidate = build(today.getFullYear(), today.getMonth());
  if (candidate.getTime() < today.getTime()) {
    // день уже прошёл в этом месяце → берём следующий
    candidate = build(today.getFullYear(), today.getMonth() + 1);
  }
  return candidate;
}

/** Траты с датой следующей оплаты и счётчиком дней, отсортированные по близости. */
export function getExpenseViews(): ExpenseView[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return readExpenses()
    .map((e) => {
      const next = nextPaymentDate(e.dayOfMonth);
      const daysUntil = Math.round((next.getTime() - today.getTime()) / 86_400_000);
      return { ...e, nextPaymentISO: toISODate(next), daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Суммарный месячный расход. */
export function monthlyTotal(): number {
  return readExpenses().reduce((sum, e) => sum + e.amount, 0);
}

/* ─── helpers ──────────────────────────────────────────────────────────── */

function clampDay(d: number): number {
  const n = Math.round(d);
  if (!Number.isFinite(n)) return 1;
  return Math.min(31, Math.max(1, n));
}

/** «3 900 ₽» — разряды через тонкий пробел. */
export function formatMoney(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
}
