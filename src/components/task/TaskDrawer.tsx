import { useState } from 'react';
import { Archive, Clock, Edit2, Tag, MessageSquare, Send } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PriorityBadge, PriorityStripe } from './PriorityBadge';
import { TaskForm } from './TaskForm';
import { useUIStore } from '@/stores/ui.store';
import { useTasks, useUpdateTask, useAddComment, useArchiveTask } from '@/hooks/useTasks';
import { useToast } from '@/components/ui/Toast';
import { formatDeadline, isOverdue } from '@/hooks/useDeadlineWatcher';
import type { Task } from '@/types';
import { STATUS_LABELS } from '@/types';

export function TaskDrawer() {
  const activeTaskId   = useUIStore((s) => s.activeTaskId);
  const setActiveTaskId = useUIStore((s) => s.setActiveTaskId);
  const { data: tasks } = useTasks();
  const task = tasks?.find((t) => t.id === activeTaskId) ?? null;

  return (
    <Drawer
      open={!!activeTaskId}
      onClose={() => setActiveTaskId(null)}
      title={task?.title ?? 'Task'}
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
      toast('Task updated');
    } catch {
      toast('Failed to update task', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ id: task.id, text: commentText.trim() });
      setCommentText('');
    } catch {
      toast('Failed to add comment', 'error');
    }
  };

  const handleArchive = async () => {
    try {
      await archiveTask.mutateAsync(task.id);
      onClose();
      toast('Task archived');
    } catch {
      toast('Failed to archive', 'error');
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
      <div className="relative px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <PriorityStripe priority={task.priority} />
        <div className="pl-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <PriorityBadge priority={task.priority} />
            <Badge style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'none' }}>
              {STATUS_LABELS[task.status]}
            </Badge>
            {task.source_type && (
              <Badge style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: 'none', fontSize: 11 }}>
                {task.source_type}
              </Badge>
            )}
          </div>

          {task.deadline && (
            <div
              className="flex items-center gap-1.5 text-xs font-mono"
              style={{ color: overdue ? 'var(--pa)' : 'var(--text-secondary)' }}
            >
              <Clock size={12} />
              {overdue ? 'Overdue · ' : ''}{formatDeadline(task.deadline)}
            </div>
          )}

          {task.category && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Tag size={12} />
              {task.category}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-5 px-5 py-4" data-selectable>
        {task.ai_summary && (
          <div className="rounded-lg p-3 flex flex-col gap-1.5" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(0,240,202,0.15)' }}>
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--accent)' }}>
              Summary
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{task.ai_summary}</p>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Description</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {task.description}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            Created · {new Date(task.created_at).toLocaleString()}
          </p>
          {task.resolved_at && (
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Resolved · {new Date(task.resolved_at).toLocaleString()}
            </p>
          )}
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            ID · {task.id.slice(0, 8)}
          </p>
        </div>

        {/* Comments */}
        {task.comments.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <MessageSquare size={12} /> Comments
            </p>
            {task.comments.map((c) => (
              <div key={c.id} className="rounded-lg p-3 flex flex-col gap-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{c.text}</p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment input */}
      <div className="px-5 py-3 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        <input
          className="flex-1 h-9 px-3 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          placeholder="Add a comment…"
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
          style={{ width: 36, padding: 0 }}
        >
          <Send size={14} />
        </Button>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="flex-1 gap-1.5">
          <Edit2 size={13} /> Edit
        </Button>
        <Button variant="danger" size="sm" onClick={handleArchive} loading={archiveTask.isPending} className="gap-1.5">
          <Archive size={13} /> Archive
        </Button>
      </div>
    </div>
  );
}
