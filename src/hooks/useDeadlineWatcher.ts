import { useEffect, useRef } from 'react';
import type { Task } from '@/types';
import { notifyDeadline } from '@/services/notifications.service';

const NOTIFY_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
const CHECK_INTERVAL_MS   = 60 * 1000;       // every minute

export function useDeadlineWatcher(tasks: Task[] | undefined) {
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tasks) return;

    const check = () => {
      const now = Date.now();
      tasks
        .filter((t) => t.deadline && t.status !== 'Resolved' && t.status !== 'Archived')
        .forEach((t) => {
          const diff = new Date(t.deadline!).getTime() - now;
          const key  = `${t.id}-${Math.floor(diff / 60_000)}`;
          if (notifiedRef.current.has(key)) return;
          if (diff <= NOTIFY_THRESHOLD_MS) {
            const minutesLeft = Math.floor(diff / 60_000);
            notifyDeadline(t.title, minutesLeft);
            notifiedRef.current.add(key);
          }
        });
    };

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [tasks]);
}

export function isDeadlineUrgent(deadline: string | null): boolean {
  if (!deadline) return false;
  const diff = new Date(deadline).getTime() - Date.now();
  return diff > 0 && diff <= NOTIFY_THRESHOLD_MS;
}

export function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

export function formatDeadline(deadline: string): string {
  const date  = new Date(deadline);
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff  = Math.round((d.getTime() - today.getTime()) / 86_400_000);

  if (diff === 0)  return 'Today';
  if (diff === 1)  return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0)   return `${Math.abs(diff)}d overdue`;
  if (diff < 7)   return `in ${diff}d`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
