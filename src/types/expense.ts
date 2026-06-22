/** Регулярная трата (подписка / ежемесячный платёж). */
export interface Expense {
  id: string;
  name: string;
  amount: number;      // сумма в рублях
  dayOfMonth: number;  // 1..31 — день регулярной оплаты
  note: string | null;
  /** Период, в котором трату отметили оплаченной: 'YYYY-MM'. В новом месяце снова активна. */
  paidPeriod: string | null;
  created_at: string;
}

/** Трата с вычисленной датой следующей оплаты и счётчиком дней. */
export interface ExpenseView extends Expense {
  nextPaymentISO: string;  // 'YYYY-MM-DD' ближайшей оплаты
  daysUntil: number;       // 0 = сегодня
  paid: boolean;           // оплачено в текущем месяце
}
