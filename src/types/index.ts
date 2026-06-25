export type Priority = 'A' | 'B' | 'C';

export type TaskStatus =
  | 'New'
  | 'In Progress'
  | 'Waiting Response'
  | 'Escalation'
  | 'Blocked'
  | 'Resolved'
  | 'Archived';

export type SourceType = 'voice' | 'text' | 'image';

export interface TaskComment {
  id: string;
  text: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  category: string | null;
  deadline: string | null;
  created_at: string;
  resolved_at: string | null;
  deleted_at: string | null;
  ai_summary: string | null;
  source_type: SourceType | null;
  comments: TaskComment[];
  attachment_url: string | null;
}

export interface EventLog {
  id: string;
  task_id: string | null;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
}

export interface TaskPreview {
  title: string;
  description: string;
  priority: Priority;
  category: string;
  deadline: string | null;
  summary: string;
}

export type KanbanColumnId = 'todo' | 'inprogress' | 'blocked' | 'done';

export interface KanbanColumn {
  id: KanbanColumnId;
  title: string;
  statuses: TaskStatus[];
  defaultStatus: TaskStatus;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo',       title: 'ВХОДЯЩИЕ', statuses: ['New'],                                                         defaultStatus: 'New' },
  { id: 'inprogress', title: 'В РАБОТЕ', statuses: ['In Progress', 'Waiting Response', 'Escalation', 'Blocked'],    defaultStatus: 'In Progress' },
  { id: 'done',       title: 'ГОТОВО',   statuses: ['Resolved'],                                                    defaultStatus: 'Resolved' },
];

export const PRIORITY_CONFIG: Record<Priority, { color: string; label: string; bgColor: string; glow: string }> = {
  A: { color: '#FF1744', bgColor: 'rgba(255,23,68,0.10)',  glow: 'rgba(255,23,68,0.6)',  label: 'Critical' },
  B: { color: '#FF9100', bgColor: 'rgba(255,145,0,0.10)',  glow: 'rgba(255,145,0,0.5)',  label: 'Today'    },
  C: { color: '#00B0FF', bgColor: 'rgba(0,176,255,0.10)',  glow: 'rgba(0,176,255,0.5)',  label: 'Planned'  },
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'New':              'новая',
  'In Progress':      'в работе',
  'Waiting Response': 'ожидание',
  'Escalation':       'эскалация',
  'Blocked':          'блок',
  'Resolved':         'выполнена',
  'Archived':         'архив',
};
