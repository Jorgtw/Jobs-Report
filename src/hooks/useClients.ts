import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../services/dbService';
import { Client } from '../types';

export const useClients = (companyId?: string, userId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<Client[], Error>({
    queryKey: ['clients', companyId],
    queryFn: async () => {
      const clients = await db.getClients();
      return clients || [];
    },
    staleTime: 1000 * 30, // 30 secondi
    retry: 3,
    refetchOnWindowFocus: true,
    enabled: !!companyId && !!userId,
  });

  const createClient = useMutation({
    mutationFn: (data: any) => db.addClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateClient = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => db.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deleteClient = useMutation({
    mutationFn: (id: string) => db.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    ...query,
    createClient,
    updateClient,
    deleteClient,
  };
};
