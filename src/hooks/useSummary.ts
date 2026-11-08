import { useQuery, useQueryClient } from '@tanstack/react-query';
import { summaryQueryOptions } from '../services/reportQueries';

export const useSummary = (companyId?: string, userId?: string) => {
  const client = useQueryClient();
  return useQuery({
    ...summaryQueryOptions(client, companyId, userId),
    retry: 3,
    refetchOnWindowFocus: true,
    enabled: !!companyId && !!userId,
  });
};
