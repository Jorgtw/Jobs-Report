import { useQuery } from '@tanstack/react-query';
import { db } from '../services/dbService';

export const useSummary = (companyId?: string) => {
  return useQuery<any[], Error>({
    queryKey: ['summary', companyId],
    queryFn: async () => {
      const summary = await db.getSummary();
      return summary || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minuti
    enabled: !!companyId,
  });
};
