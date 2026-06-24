import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Archive, Clock, Edit2, Tag, MessageSquare, Send } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { TaskForm } from './TaskForm';
import { useUIStore } from '@/stores/ui.store';
import { useTasks, useUpdateTask, useAddComment, useArchiveTask } from '@/hooks/useTasks';
import { fetchArchivedTasks } from '@/services/tasks.service';
import { useToast } from '@/components/ui/Toast';
import { formatDeadline, isOverdue, formatRelative, formatDateTime } from '@/hooks/useDeadlineWatcher';
import type { Task } from '@/types';
import { STATUS_LABELS } from '@/types';

const SOURCE_LABELS: Record<string, string> = {
  voice: 'голос',
  text:  'текст',
  image: 'изображение',
};

export function TaskDrawer() {
  const activeTaskId   = useUIStore((s) => s.activeTaskId);
  const setActiveTaskId = useUIStore((s) => s.setActiveTaskId);
  const { data: tasks } = useTasks();
  const { data: archivedTasks } = useQuery({
    queryKey: ['tasks', 'archived'],
    queryFn: fetchArchivedTasks,
    staleTime: 30_000,
    enabled: !!activeTaskId,
  });
  const task = tasks?.find((t) => t.id === activeTaskId)
    ?? archivedTasks?.find((t) => t.id === activeTaskId)
    ?? null;

  return (
    <Drawer
      open={!!activeTaskId}
      onClose={() => setActiveTaskId(null)}
      title={task?.title ? `задача — ${task.title}` : 'задача'}
      width={440}
    >
      {task && <TaskDrawerContent task={task} onClose={() => setActiveTaskId(null)} />}
    </Drawer>
  );
}

function TaskDrawerContent({ task, onClose }: { task: Task; onClose: () => void }) {
  const [editing,     setEditing]     = useState(false);
  const [commentText, setCommentText] = useState('');
  const { toast } = useToast();

  const updateTask  = useUpdateTask();
  const addComment  = useAddComment();
  const archiveTask = useArchiveTask();

  const handleSave = async (updates: Parameters<typeof updateTask.mutate>[0]['updates']) => {
    try {
      await updateTask.mutateAsync({ id: task.id, updates });
      setEditing(false);
      toast('Задача обновлена');
    } catch {
      toast('Не удалось обновить задачу', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ id: task.id, text: commentText.trim() });
      setCommentText('');
    } catch {
      toast('Не удалось добавить комментарий', 'error');
    }
  };

  const handleArchive = async () => {
    try {
      await archiveTask.mutateAsync(task.id);
      onClose();
      toast('Задача в архиве');
    } catch {
      toast('Не удалось архивировать', 'error');
    }
  };

  if (editing) {
    return (
      <TaskForm
        task={task}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
        loading={updateTask.isPending}
      />
    );
  }

  const overdue = isOverdue(task.deadline);

  return (
    <div className="flex flex-col h-full">
      {/* Header meta */}
      <div
        className="bevel-sunken"
        style={{
          padding: '10px 12px',
          margin: 4,
          background: 'var(--bg-card)',
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span
              className="font-mono"
              style={{
                fontSize: 10,
                padding: '1px 6px',
                background: 'transparent',
                color: 'var(--accent)',
                border: '1px solid var(--border)',
              }}
            >
              {STATUS_LABELS[task.status]}
            </span>
            {task.source_type && (
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                {SOURCE_LABELS[task.source_type] ?? task.source_type}
              </span>
            )}
          </div>

          {task.deadline && (
            <div
              className="flex items-center gap-1.5 text-xs font-mono"
              style={{
                color: overdue ? 'var(--danger)' : 'var(--text-secondary)',
                fontWeight: overdue ? 600 : 400,
                textShadow: overdue ? '0 0 6px rgba(255,0,60,0.6)' : 'none',
              }}
            >
              <Clock size={11} />
              {overdue ? 'просрочено · ' : ''}{formatDeadline(task.deadline)}
            </div>
          )}

          {task.category && (
            <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              <Tag size={11} /> {task.category}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5" data-selectable style={{ padding: '0 4px' }}>
        {task.ai_summary && (
          <div
            className="bevel-sunken px-2 py-1.5 flex flex-col gap-1"
            style={{ background: '#001A20' }}
          >
            <div className="text-xs font-bold neon-cyan-text">▶ AI РЕЗЮМЕ</div>
            <p className="text-xs leading-relaxed" style={{ color: '#B8F3FF' }}>
              {task.ai_summary}
            </p>
          </div>
        )}

        {task.description && (
          <div
            className="bevel-sunken flex flex-col gap-1 px-2 py-1.5"
            style={{ background: 'var(--bg-card)' }}
          >
            <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>ОПИСАНИЕ</p>
            <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
              {task.description}
            </p>
          </div>
        )}

        {/* Timestamps — без года */}
        <div
          className="bevel-well flex flex-col gap-0.5 px-2 py-1.5 text-xs font-mono"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
        >
          <span>создано  · {formatDateTime(task.created_at)} ({formatRelative(task.created_at)})</span>
          {task.resolved_at && (
            <span>выполнено · {formatDateTime(task.resolved_at)}</span>
          )}
          <span>id       · {task.id.slice(0, 8)}</span>
        </div>

        {/* Comments */}
        {task.comments.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <MessageSquare size={11} /> КОММЕНТАРИИ ({task.comments.length})
            </p>
            {task.comments.map((c) => (
              <div key={c.id} className="bevel-sunken px-2 py-1 flex flex-col gap-0.5" style={{ background: 'var(--bg-card)' }}>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                  {c.text}
                </p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {formatRelative(c.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment input */}
      <div className="flex gap-1.5 p-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <input
          className="bevel-sunken flex-1 h-6 px-1.5 text-xs outline-none font-mono"
          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          placeholder="добавить комментарий..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
          data-selectable
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddComment}
          loading={addComment.isPending}
          disabled={!commentText.trim()}
          style={{ width: 32, padding: 0 }}
        >
          <Send size={12} />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 p-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="flex-1">
          <Edit2 size={11} /> изменить
        </Button>
        <Button variant="danger" size="sm" onClick={handleArchive} loading={archiveTask.isPending}>
          <Archive size={11} /> в архив
        </Button>
      </div>
    </div>
  );
}
