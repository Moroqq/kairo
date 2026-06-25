import { readTasks } from '@/lib/storage';
import { readItems, readPatterns, readOverrides } from '@/lib/plan-storage';
import { toISODate, fromISODate } from '@/lib/date';
import type { Task } from '@/types';

/** Выполненный пункт плана в итогах (повторы схлопнуты в count). */
export interface DoneplanEntry {
  title: string;
  count: number;
}

export interface WeekReview {
  /** Понедельник недели, 'YYYY-MM-DD' — стабильный ключ блока. */
  weekStart: string;
  /** Воскресенье недели. */
  weekEnd: string;
  isCurrent: boolean;

  /** Задачи канбана, закрытые на этой неделе (по resolved_at). */
  resolvedTasks: Task[];
  /** Задачи, созданные на этой неделе. */
  createdCount: number;
  /** Выполненные пункты плана/листка (PlanItem.done + отметки расписания). */
  planDone: DoneplanEntry[];
  /** Всего отметок плана. */
  planDoneCount: number;
  /** Сколько пунктов плана недели остались не сделаны. */
  planMissedCount: number;
}

/** Понедельник недели, в которую попадает дата (локально). */
function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (x.getDay() + 6) % 7; // 0=пн … 6=вс
  x.setDate(x.getDate() - shift);
  return x;
}

function inRange(iso: string, startISO: string, endISO: string): boolean {
  return iso >= startISO && iso <= endISO;
}

/**
 * Итоги по неделям, начиная с текущей и назад.
 * Возвращает только недели, в которых была активность (+ текущая всегда).
 */
export function getWeeklyReviews(maxWeeks = 12): WeekReview[] {
  const tasks     = readTasks();
  const items     = readItems();
  const patterns  = readPatterns();
  const overrides = readOverrides();
  const patternTitle = new Map(patterns.map((p) => [p.id, p.title]));

  const currentMonday = mondayOf(new Date());
  const reviews: WeekReview[] = [];

  for (let w = 0; w < maxWeeks; w++) {
    const start = new Date(currentMonday);
    start.setDate(start.getDate() - w * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startISO = toISODate(start);
    const endISO   = toISODate(end);

    // Задачи: закрытые и созданные в диапазоне
    const resolvedTasks = tasks.filter((t) =>
      t.status !== 'Archived' &&
      t.resolved_at && inRange(toISODate(new Date(t.resolved_at)), startISO, endISO));
    const createdCount = tasks.filter((t) =>
      inRange(toISODate(new Date(t.created_at)), startISO, endISO)).length;

    // План: выполненные PlanItem
    const weekItems = items.filter((i) => inRange(i.date, startISO, endISO));
    const doneItems = weekItems.filter((i) => i.done);

    // План: отметки расписания (override.done) — название берём из шаблона
    const doneOverrides = overrides.filter((o) =>
      o.done && !o.skipped && inRange(o.date, startISO, endISO));

    // Пропущенные пункты считаем только для прошедших дней
    const todayISOv = toISODate(new Date());
    const missedItems = weekItems.filter((i) => !i.done && i.date < todayISOv).length;

    // Схлопываем одинаковые названия (повторы расписания → «тренировка ×3»)
    const tally = new Map<string, number>();
    for (const i of doneItems) {
      tally.set(i.title, (tally.get(i.title) ?? 0) + 1);
    }
    for (const o of doneOverrides) {
      const title = patternTitle.get(o.pattern_id) ?? '(расписание)';
      tally.set(title, (tally.get(title) ?? 0) + 1);
    }
    const planDone: DoneplanEntry[] = [...tally.entries()]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);

    const planDoneCount = doneItems.length + doneOverrides.length;

    const review: WeekReview = {
      weekStart: startISO,
      weekEnd:   endISO,
      isCurrent: w === 0,
      resolvedTasks: resolvedTasks.sort((a, b) =>
        new Date(b.resolved_at!).getTime() - new Date(a.resolved_at!).getTime()),
      createdCount,
      planDone,
      planDoneCount,
      planMissedCount: missedItems,
    };

    const hasActivity =
      review.resolvedTasks.length > 0 || review.createdCount > 0 || planDoneCount > 0;

    if (hasActivity || review.isCurrent) reviews.push(review);
  }

  return reviews;
}

/** «9 — 15 июня» либо «29 дек — 4 янв» (если неделя пересекает месяц). */
export function formatWeekRange(startISO: string, endISO: string): string {
  const s = fromISODate(startISO);
  const e = fromISODate(endISO);
  const sameMonth = s.getMonth() === e.getMonth();
  const short = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
  if (sameMonth) {
    return `${s.getDate()} — ${e.getDate()} ${e.toLocaleDateString('ru-RU', { month: 'long' })}`;
  }
  return `${short(s)} — ${short(e)}`;
}
