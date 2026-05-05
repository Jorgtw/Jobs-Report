import { useQuery } from '@tanstack/react-query';
import { db } from '../services/dbService';
import { User } from '../types';

export const useUsers = (companyId?: string, userId?: string) => {
  return useQuery<User[], Error>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      const users = await db.getUsers();
      return users || [];
    },
    staleTime: 1000 * 30, // 30 secondi
    retry: 3,
    refetchOnWindowFocus: true,
    enabled: !!companyId && !!userId,
  });
};
