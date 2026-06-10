import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDayItems, getMonthSummary, getMonthItems, getPatterns,
  addItem, updateItem, deleteItem,
  togglePlanDone, removeOccurrence, detachOccurrence,
  createPattern, updatePattern, togglePattern, deletePattern,
  type PlanItemInput, type PatternInput,
} from '@/services/plan.service';
import { monthGrid, toISODate } from '@/lib/date';
import type { DisplayItem, RecurrencePattern } from '@/types/plan';

const PLAN_KEY = ['plan'] as const;
const TASKS_KEY = ['tasks'] as const;

/**
 * Любая мутация планировщика инвалидирует поддерево 'plan'.
 * Дополнительно инвалидируем 'tasks', потому что getDayItems/getMonthSummary
 * читают и канбан-задачи — а togglePlanDone для task-айтема меняет их статус.
 */
function usePlanMutation<TArgs>(fn: (args: TArgs) => unknown | Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: TArgs) => { await fn(args); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLAN_KEY });
      qc.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
}

/* ─── чтение ───────────────────────────────────────────────────────────── */

export function useDayItems(date: string) {
  return useQuery({
    queryKey: [...PLAN_KEY, 'day', date],
    queryFn: () => getDayItems(date),
    staleTime: 5_000,
  });
}

export function useMonthSummary(year: number, month: number) {
  return useQuery({
    queryKey: [...PLAN_KEY, 'month', year, month],
    queryFn: () => {
      const dates = monthGrid(year, month).flat().map(toISODate);
      return getMonthSummary(dates);
    },
    staleTime: 5_000,
  });
}

export function useMonthItems(year: number, month: number) {
  return useQuery({
    queryKey: [...PLAN_KEY, 'month-items', year, month],
    queryFn: () => {
      const dates = monthGrid(year, month).flat().map(toISODate);
      return getMonthItems(dates);
    },
    staleTime: 5_000,
  });
}

export function usePatterns() {
  return useQuery({
    queryKey: [...PLAN_KEY, 'patterns'],
    queryFn: () => getPatterns(),
    staleTime: 5_000,
  });
}

/* ─── мутации: пункты ──────────────────────────────────────────────────── */

export const useAddPlanItem    = () => usePlanMutation((input: PlanItemInput) => addItem(input));
export const useDeletePlanItem = () => usePlanMutation((id: string) => deleteItem(id));
export const useTogglePlanDone = () => usePlanMutation((item: DisplayItem) => togglePlanDone(item));

export const useUpdatePlanItem = () =>
  usePlanMutation(({ id, updates }: { id: string; updates: Parameters<typeof updateItem>[1] }) =>
    updateItem(id, updates));

export const useRemoveOccurrence = () =>
  usePlanMutation(({ patternId, date }: { patternId: string; date: string }) =>
    removeOccurrence(patternId, date));

export const useDetachOccurrence = () =>
  usePlanMutation(
    ({ pattern, date, edits }: {
      pattern: RecurrencePattern;
      date: string;
      edits: Parameters<typeof detachOccurrence>[2];
    }) => detachOccurrence(pattern, date, edits),
  );

/* ─── мутации: шаблоны ─────────────────────────────────────────────────── */

export const useCreatePattern = () => usePlanMutation((input: PatternInput) => createPattern(input));
export const useTogglePattern = () => usePlanMutation((id: string) => togglePattern(id));
export const useDeletePattern = () => usePlanMutation((id: string) => deletePattern(id));

export const useUpdatePattern = () =>
  usePlanMutation(({ id, updates }: { id: string; updates: Parameters<typeof updatePattern>[1] }) =>
    updatePattern(id, updates));
