import { readDailies, writeDailies, readMarks, writeMarks } from '@/lib/daily-storage';
import type { Daily, DailyWithState } from '@/types/daily';

/** Список дэйликов с отметкой «сделано» на конкретный день (сбрасывается на новый день сама собой). */
export function getDailies(date: string): DailyWithState[] {
  const dailies = readDailies()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const doneIds = new Set(
    readMarks().filter((m) => m.date === date).map((m) => m.daily_id),
  );
  return dailies.map((d) => ({ ...d, done: doneIds.has(d.id) }));
}

export function addDaily(title: string): Daily {
  const daily: Daily = { id: crypto.randomUUID(), title, created_at: new Date().toISOString() };
  const dailies = readDailies();
  dailies.push(daily);
  writeDailies(dailies);
  return daily;
}

export function deleteDaily(id: string): void {
  writeDailies(readDailies().filter((d) => d.id !== id));
  writeMarks(readMarks().filter((m) => m.daily_id !== id));
}

export function toggleDaily(id: string, date: string): void {
  const marks = readMarks();
  const idx = marks.findIndex((m) => m.daily_id === id && m.date === date);
  if (idx === -1) marks.push({ daily_id: id, date });
  else marks.splice(idx, 1);
  writeMarks(marks);
}
