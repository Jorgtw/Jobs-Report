import { useQuery } from '@tanstack/react-query';
import { db } from '../services/dbService';

export const useSummary = (companyId?: string, userId?: string) => {
  return useQuery<any[], Error>({
    queryKey: ['summary', companyId],
    queryFn: async () => {
      const summary = await db.getSummary();
      return summary || [];
    },
    staleTime: 1000 * 30, // 30 secondi
    retry: 3,
    refetchOnWindowFocus: true,
    enabled: !!companyId && !!userId,
  });
};
