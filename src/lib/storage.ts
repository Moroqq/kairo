import type { Task, EventLog, Priority, TaskStatus } from '@/types';

const TASKS_KEY = 'kairo_tasks';
const LOGS_KEY  = 'kairo_event_logs';

const VALID_PRIORITIES: Priority[] = ['A', 'B', 'C', 'D'];
const VALID_STATUSES: TaskStatus[] = [
  'New', 'In Progress', 'Waiting Response', 'Escalation', 'Blocked', 'Resolved', 'Archived',
];

// Legacy → canonical
const PRIORITY_REMAP: Record<string, Priority> = {
  P1: 'A', P2: 'B', P3: 'C', P4: 'D',
  Critical: 'A', High: 'B', Medium: 'C', Low: 'D',
};

function migrateTask(raw: any): Task {
  const t = { ...raw };

  // Priority normalization
  if (!VALID_PRIORITIES.includes(t.priority)) {
    t.priority = PRIORITY_REMAP[t.priority] ?? 'C';
  }

  // Status fallback
  if (!VALID_STATUSES.includes(t.status)) {
    t.status = 'New';
  }

  // Required shape guards
  if (!Array.isArray(t.comments))  t.comments = [];
  if (typeof t.title !== 'string') t.title = '(untitled)';
  if (!t.id)         t.id = crypto.randomUUID();
  if (!t.created_at) t.created_at = new Date().toISOString();
  if (t.description === undefined)    t.description = null;
  if (t.category === undefined)       t.category = null;
  if (t.deadline === undefined)       t.deadline = null;
  if (t.resolved_at === undefined)    t.resolved_at = null;
  if (t.ai_summary === undefined)     t.ai_summary = null;
  if (t.source_type === undefined)    t.source_type = null;
  if (t.attachment_url === undefined) t.attachment_url = null;

  return t as Task;
}

export function readTasks(): Task[] {
  try {
    const raw = JSON.parse(localStorage.getItem(TASKS_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    const migrated = raw.map(migrateTask);
    // Persist back, чтобы UI не пересчитывал миграцию каждый рендер
    const before = JSON.stringify(raw);
    const after  = JSON.stringify(migrated);
    if (before !== after) localStorage.setItem(TASKS_KEY, after);
    return migrated;
  } catch {
    return [];
  }
}

export function writeTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function readLogs(): EventLog[] {
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) ?? '[]') as EventLog[];
  } catch {
    return [];
  }
}

export function writeLogs(logs: EventLog[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}
