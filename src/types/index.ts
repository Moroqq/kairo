export type Priority = 'A' | 'B' | 'C' | 'D';

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
  { id: 'todo',       title: 'To Do',       statuses: ['New'],                                        defaultStatus: 'New' },
  { id: 'inprogress', title: 'In Progress', statuses: ['In Progress', 'Waiting Response', 'Escalation'], defaultStatus: 'In Progress' },
  { id: 'blocked',    title: 'Blocked',     statuses: ['Blocked'],                                    defaultStatus: 'Blocked' },
  { id: 'done',       title: 'Done',        statuses: ['Resolved'],                                   defaultStatus: 'Resolved' },
];

export const PRIORITY_CONFIG: Record<Priority, { color: string; label: string; bgColor: string }> = {
  A: { color: '#FB4747', bgColor: 'rgba(251,71,71,0.12)',   label: 'Critical' },
  B: { color: '#FF7917', bgColor: 'rgba(255,121,23,0.12)',  label: 'Today'    },
  C: { color: '#3E89FF', bgColor: 'rgba(62,137,255,0.12)',  label: 'Planned'  },
  D: { color: '#707886', bgColor: 'rgba(112,120,134,0.12)', label: 'Optional' },
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'New':              'New',
  'In Progress':      'In Progress',
  'Waiting Response': 'Waiting',
  'Escalation':       'Escalation',
  'Blocked':          'Blocked',
  'Resolved':         'Resolved',
  'Archived':         'Archived',
};
