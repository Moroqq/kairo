import { readTasks, writeTasks, readLogs, writeLogs } from '@/lib/storage';
import type { Task, TaskStatus, Priority, TaskComment, SourceType, EventLog } from '@/types';

export async function fetchTasks(): Promise<Task[]> {
  return readTasks().filter((t) => t.status !== 'Archived');
}

export async function fetchArchivedTasks(): Promise<Task[]> {
  return readTasks()
    .filter((t) => t.status === 'Archived')
    .sort((a, b) =>
      new Date(b.resolved_at ?? b.created_at).getTime() -
      new Date(a.resolved_at ?? a.created_at).getTime(),
    )
    .slice(0, 100);
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: Priority;
  status?: TaskStatus;
  category?: string;
  deadline?: string | null;
  ai_summary?: string;
  source_type?: SourceType;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const task: Task = {
    id:             crypto.randomUUID(),
    title:          input.title,
    description:    input.description ?? null,
    priority:       input.priority,
    status:         input.status ?? 'New',
    category:       input.category ?? null,
    deadline:       input.deadline ?? null,
    ai_summary:     input.ai_summary ?? null,
    source_type:    input.source_type ?? null,
    comments:       [],
    attachment_url: null,
    resolved_at:    null,
    created_at:     new Date().toISOString(),
  };

  const tasks = readTasks();
  tasks.unshift(task);
  writeTasks(tasks);

  logEvent(task.id, 'created', null, task.status);
  return task;
}

export async function updateTaskStatus(id: string, newStatus: TaskStatus): Promise<Task> {
  const tasks = readTasks();
  const idx   = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Task not found');

  const oldStatus = tasks[idx].status;
  tasks[idx] = {
    ...tasks[idx],
    status:      newStatus,
    resolved_at: newStatus === 'Resolved' ? new Date().toISOString() : tasks[idx].resolved_at,
  };
  writeTasks(tasks);

  logEvent(id, 'status_changed', oldStatus, newStatus);
  return tasks[idx];
}

export async function updateTaskPriority(id: string, newPriority: Priority): Promise<Task> {
  const tasks = readTasks();
  const idx   = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Task not found');

  const oldPriority = tasks[idx].priority;
  tasks[idx]        = { ...tasks[idx], priority: newPriority };
  writeTasks(tasks);

  logEvent(id, 'priority_changed', oldPriority, newPriority);
  return tasks[idx];
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<Task, 'title' | 'description' | 'category' | 'deadline' | 'priority' | 'status'>>,
): Promise<Task> {
  const tasks = readTasks();
  const idx   = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Task not found');

  tasks[idx] = { ...tasks[idx], ...updates };
  writeTasks(tasks);
  return tasks[idx];
}

export async function addComment(id: string, text: string): Promise<Task> {
  const tasks = readTasks();
  const idx   = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Task not found');

  const newComment: TaskComment = {
    id:         crypto.randomUUID(),
    text,
    created_at: new Date().toISOString(),
  };
  tasks[idx] = { ...tasks[idx], comments: [...tasks[idx].comments, newComment] };
  writeTasks(tasks);

  logEvent(id, 'comment_added', null, text.slice(0, 80));
  return tasks[idx];
}

export async function archiveTask(id: string): Promise<void> {
  const tasks = readTasks();
  const idx   = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Task not found');

  tasks[idx] = { ...tasks[idx], status: 'Archived' };
  writeTasks(tasks);
  logEvent(id, 'archived', null, null);
}

function logEvent(
  taskId: string,
  eventType: string,
  oldValue: string | null,
  newValue: string | null,
): void {
  const log: EventLog = {
    id:         crypto.randomUUID(),
    task_id:    taskId,
    event_type: eventType,
    old_value:  oldValue,
    new_value:  newValue,
    note:       null,
    created_at: new Date().toISOString(),
  };
  const logs = readLogs();
  logs.unshift(log);
  writeLogs(logs.slice(0, 500));
}

export async function fetchEventLogs(
  limit = 100,
): Promise<Array<EventLog & { task_title?: string }>> {
  const tasks   = readTasks();
  const taskMap = new Map(tasks.map((t) => [t.id, t.title]));

  return readLogs()
    .slice(0, limit)
    .map((log) => ({
      ...log,
      task_title: log.task_id ? (taskMap.get(log.task_id) ?? undefined) : undefined,
    }));
}
