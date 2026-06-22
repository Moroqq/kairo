import type { Priority } from './index';
export type { Priority } from './index';

/**
 * Планировщик-ежедневник. Отдельная сущность от Kanban-задач (`Task`):
 * пункт привязан к конкретному дню, имеет чекбокс «сделано» и опциональное время.
 */
export interface PlanItem {
  id: string;
  date: string;              // 'YYYY-MM-DD' — локальный день
  title: string;
  note: string | null;
  time: string | null;       // 'HH:MM' опционально
  priority: Priority;        // переиспользуем A|B|C|D для цветовой метки
  done: boolean;
  pattern_id: string | null; // если пункт «отвязан» от шаблона — хранит его id
  task_id: string | null;    // связанная канбан-задача (листок → доска)
  created_at: string;
}

/**
 * Шаблон-расписание: набор пунктов, повторяющихся по дням недели.
 * Не материализуется в БД — копии генерируются на лету (см. plan.service).
 */
export interface RecurrencePattern {
  id: string;
  title: string;
  note: string | null;
  time: string | null;
  priority: Priority;
  weekdays: number[];        // значения JS Date.getDay(): 0=Вс … 6=Сб
  active: boolean;
  created_at: string;
}

/**
 * Состояние одной материализованной копии шаблона в конкретный день.
 * Хранится только при отклонении от «по умолчанию» (отмечено/убрано).
 */
export interface PatternOverride {
  pattern_id: string;
  date: string;              // 'YYYY-MM-DD'
  done?: boolean;            // отметка «сделано» для этого дня
  skipped?: boolean;         // вхождение убрано в этот день
}

/**
 * Элемент списка дня. Три источника:
 *   - 'item'       — реальный PlanItem ежедневника
 *   - 'occurrence' — виртуальное вхождение шаблона-расписания
 *   - 'task'       — задача из канбана с дедлайном на этот день
 * `kind` различает их: от этого зависит, как сохранять отметку/удаление.
 */
export type DisplayItem =
  | (PlanItem & { kind: 'item' })
  | {
      kind: 'occurrence';
      id: string;            // виртуальный id: `pat:${pattern_id}:${date}`
      pattern_id: string;
      date: string;
      title: string;
      note: string | null;
      time: string | null;
      priority: Priority;
      done: boolean;
    }
  | {
      kind: 'task';
      id: string;            // виртуальный id: `task:${task.id}`
      task_id: string;
      date: string;
      title: string;
      note: string | null;
      time: string | null;   // не используем (у Task нет HH:MM)
      priority: Priority;
      done: boolean;
      overdue: boolean;
    };

// Индекс = Date.getDay(). Отображаемый порядок — понедельник-первый.
export const WEEKDAYS_RU = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'] as const;
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const MONTHS_RU = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
] as const;
