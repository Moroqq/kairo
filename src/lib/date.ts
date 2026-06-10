/**
 * Локальные хелперы дат для планировщика.
 * ВАЖНО: работаем строго в локальной таймзоне. `new Date('YYYY-MM-DD')`
 * трактуется как UTC и даёт сдвиг на день — поэтому здесь её НЕ используем.
 */

/** Date → 'YYYY-MM-DD' в локальной зоне. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' → локальный Date (полночь). */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * 'YYYY-MM-DD' → ISO-строка конца этого дня в локальной таймзоне (23:59:59.999).
 * Используется как дедлайн: «сегодня» означает «до конца сегодняшнего дня»,
 * а не полночь UTC (которая в +3 уже наступила и делает задачу мгновенно просрочённой).
 */
export function deadlineISOFromDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999).toISOString();
}

/** Сегодня в формате 'YYYY-MM-DD'. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Date.getDay() (0=Вс…6=Сб) для ISO-дня. */
export function weekdayOf(iso: string): number {
  return fromISODate(iso).getDay();
}

/** Сетка месяца, понедельник-первый: массив недель по 7 дат (включая «хвосты» соседних месяцев). */
export function monthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  // Смещение до понедельника: getDay() 0=Вс → хотим 6 пустых перед ним
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  // 6 недель максимум покрывают любой месяц
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    // Прерываем, если следующая неделя целиком в следующем месяце
    if (w >= 3 && cursor.getMonth() !== month && cursor >= new Date(year, month + 1, 1)) break;
  }
  return weeks;
}
