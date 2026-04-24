import { useQuery } from '@tanstack/react-query';
import { db } from '../services/dbService';
import { User } from '../types';

export const useUsers = (companyId?: string) => {
  return useQuery<User[], Error>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      const users = await db.getUsers();
      return users || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minuti
    enabled: !!companyId,
  });
};
