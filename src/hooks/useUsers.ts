import { useQuery } from '@tanstack/react-query';
import { db } from '../services/dbService';
import { User } from '../types';

export const useUsers = () => {
  return useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: async () => {
      const users = await db.getUsers();
      return users || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minuti
  });
};
