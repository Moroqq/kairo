export interface Daily {
  id: string;
  title: string;
  created_at: string;
}

/** Отметка выполнения дэйлика на конкретный день — существование записи = сделано. */
export interface DailyMark {
  daily_id: string;
  date: string; // 'YYYY-MM-DD'
}

export interface DailyWithState extends Daily {
  done: boolean;
}
