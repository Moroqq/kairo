import type { Daily, DailyMark } from '@/types/daily';

const DAILIES_KEY = 'kairo_dailies';
const MARKS_KEY    = 'kairo_daily_marks';

function readJSON<T>(key: string): T[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function migrateDaily(raw: any): Daily {
  return {
    id:         raw.id || crypto.randomUUID(),
    title:      typeof raw.title === 'string' ? raw.title : '(без названия)',
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export function readDailies(): Daily[] {
  return readJSON<any>(DAILIES_KEY).map(migrateDaily);
}

export function writeDailies(dailies: Daily[]): void {
  localStorage.setItem(DAILIES_KEY, JSON.stringify(dailies));
}

function migrateMark(raw: any): DailyMark | null {
  if (!raw || typeof raw.daily_id !== 'string' || typeof raw.date !== 'string') return null;
  return { daily_id: raw.daily_id, date: raw.date };
}

export function readMarks(): DailyMark[] {
  return readJSON<any>(MARKS_KEY)
    .map(migrateMark)
    .filter((m): m is DailyMark => m !== null);
}

export function writeMarks(marks: DailyMark[]): void {
  localStorage.setItem(MARKS_KEY, JSON.stringify(marks));
}
