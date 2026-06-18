import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getExpenseViews, addExpense, updateExpense, deleteExpense, monthlyTotal,
  type ExpenseInput,
} from '@/services/expense.service';

const KEY = ['expenses'] as const;

export function useExpenses() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => ({ views: getExpenseViews(), total: monthlyTotal() }),
    staleTime: 10_000,
  });
}

function useExpenseMutation<TArgs>(fn: (args: TArgs) => unknown) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: TArgs) => { fn(args); },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const useAddExpense    = () => useExpenseMutation((input: ExpenseInput) => addExpense(input));
export const useDeleteExpense = () => useExpenseMutation((id: string) => deleteExpense(id));
export const useUpdateExpense = () =>
  useExpenseMutation(({ id, updates }: { id: string; updates: Parameters<typeof updateExpense>[1] }) =>
    updateExpense(id, updates));
