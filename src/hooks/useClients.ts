import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../services/dbService';
import { Client } from '../types';

export const useClients = () => {
  const queryClient = useQueryClient();

  const query = useQuery<Client[], Error>({
    queryKey: ['clients'],
    queryFn: async () => {
      const clients = await db.getClients();
      return clients || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minuti
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
