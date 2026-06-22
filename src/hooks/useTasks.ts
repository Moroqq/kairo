import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTasks,
  createTask,
  updateTaskStatus,
  updateTaskPriority,
  updateTask,
  addComment,
  archiveTask,
  fetchEventLogs,
  type CreateTaskInput,
} from '@/services/tasks.service';
import type { TaskStatus, Priority, Task } from '@/types';

const TASKS_KEY = ['tasks'] as const;
const LOGS_KEY  = ['event_logs'] as const;
const PLAN_KEY  = ['plan'] as const;   // листок/календарь читают и задачи (связь листок↔доска)

export function useTasks() {
  return useQuery({ queryKey: TASKS_KEY, queryFn: fetchTasks, staleTime: 15_000 });
}

export function useEventLogs() {
  return useQuery({ queryKey: LOGS_KEY, queryFn: () => fetchEventLogs(150), staleTime: 30_000 });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateTaskStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = qc.getQueryData<Task[]>(TASKS_KEY);
      qc.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t)) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(TASKS_KEY, ctx?.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY });
      qc.invalidateQueries({ queryKey: PLAN_KEY });
    },
  });
}

export function useUpdatePriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: Priority }) => updateTaskPriority(id, priority),
    onMutate: async ({ id, priority }) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = qc.getQueryData<Task[]>(TASKS_KEY);
      qc.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((t) => (t.id === id ? { ...t, priority } : t)) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(TASKS_KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateTask>[1] }) =>
      updateTask(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY });
      qc.invalidateQueries({ queryKey: PLAN_KEY });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => addComment(id, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useArchiveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY });
      qc.invalidateQueries({ queryKey: LOGS_KEY });
      qc.invalidateQueries({ queryKey: PLAN_KEY });
    },
  });
}
