import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDailies, addDaily, deleteDaily, toggleDaily } from '@/services/daily.service';

const DAILIES_KEY = ['dailies'] as const;

export function useDailies(date: string) {
  return useQuery({
    queryKey: [...DAILIES_KEY, date],
    queryFn: () => getDailies(date),
    staleTime: 5_000,
  });
}

function useDailyMutation<TArgs>(fn: (args: TArgs) => unknown) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: TArgs) => { fn(args); },
    onSuccess: () => qc.invalidateQueries({ queryKey: DAILIES_KEY }),
  });
}

export const useAddDaily    = () => useDailyMutation((title: string) => addDaily(title));
export const useDeleteDaily = () => useDailyMutation((id: string) => deleteDaily(id));
export const useToggleDaily = () =>
  useDailyMutation(({ id, date }: { id: string; date: string }) => toggleDaily(id, date));
