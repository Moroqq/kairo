import { supabase } from '@/lib/supabase';
import type { Task, TaskStatus, Priority, TaskComment, SourceType } from '@/types';

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .not('status', 'eq', 'Archived')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function fetchArchivedTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'Archived')
    .order('resolved_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as Task[];
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
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      status: input.status ?? 'New',
      category: input.category ?? null,
      deadline: input.deadline ?? null,
      ai_summary: input.ai_summary ?? null,
      source_type: input.source_type ?? null,
      comments: [],
      attachment_url: null,
      resolved_at: null,
    })
    .select()
    .single();

  if (error) throw error;
  await logEvent(data.id, 'created', null, data.status);
  return data as Task;
}

export async function updateTaskStatus(id: string, newStatus: TaskStatus): Promise<Task> {
  const { data: current } = await supabase.from('tasks').select('status').eq('id', id).single();
  const oldStatus = current?.status ?? null;

  const { data, error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  await logEvent(id, 'status_changed', oldStatus, newStatus);
  return data as Task;
}

export async function updateTaskPriority(id: string, newPriority: Priority): Promise<Task> {
  const { data: current } = await supabase.from('tasks').select('priority').eq('id', id).single();
  const oldPriority = current?.priority ?? null;

  const { data, error } = await supabase
    .from('tasks')
    .update({ priority: newPriority })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  await logEvent(id, 'priority_changed', oldPriority, newPriority);
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'category' | 'deadline' | 'priority' | 'status'>>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function addComment(id: string, text: string): Promise<Task> {
  const { data: current, error: fetchError } = await supabase
    .from('tasks')
    .select('comments')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const comments = (current?.comments ?? []) as TaskComment[];
  const newComment: TaskComment = { id: crypto.randomUUID(), text, created_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('tasks')
    .update({ comments: [...comments, newComment] })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  await logEvent(id, 'comment_added', null, text.slice(0, 80));
  return data as Task;
}

export async function archiveTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').update({ status: 'Archived' }).eq('id', id);
  if (error) throw error;
  await logEvent(id, 'archived', null, null);
}

async function logEvent(
  taskId: string,
  eventType: string,
  oldValue: string | null,
  newValue: string | null,
): Promise<void> {
  await supabase.from('event_logs').insert({ task_id: taskId, event_type: eventType, old_value: oldValue, new_value: newValue, note: null });
}

export async function fetchEventLogs(limit = 100): Promise<Array<import('@/types').EventLog & { task_title?: string }>> {
  const { data, error } = await supabase
    .from('event_logs')
    .select('*, tasks(title)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    task_title: (row.tasks as { title?: string } | null)?.title ?? null,
  })) as Array<import('@/types').EventLog & { task_title?: string }>;
}
