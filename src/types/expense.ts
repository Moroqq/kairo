/** Регулярная трата (подписка / ежемесячный платёж). */
export interface Expense {
  id: string;
  name: string;
  amount: number;      // сумма в рублях
  dayOfMonth: number;  // 1..31 — день регулярной оплаты
  note: string | null;
  created_at: string;
}

/** Трата с вычисленной датой следующей оплаты и счётчиком дней. */
export interface ExpenseView extends Expense {
  nextPaymentISO: string;  // 'YYYY-MM-DD' ближайшей оплаты
  daysUntil: number;       // 0 = сегодня
}
