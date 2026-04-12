import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../services/dbService';

export const useSubcontractors = () => {
  const queryClient = useQueryClient();

  const query = useQuery<any[], Error>({
    queryKey: ['subcontractors'],
    queryFn: async () => {
      const subs = await db.getSubcontractors();
      return subs || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minuti
  });

  const createSubcontractor = useMutation({
    mutationFn: (data: any) => db.addSubcontractor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] });
    },
  });

  const updateSubcontractor = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => db.updateSubcontractor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] });
    },
  });

  const deleteSubcontractor = useMutation({
    mutationFn: (id: string) => db.deleteSubcontractor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] });
    },
  });

  return {
    ...query,
    createSubcontractor,
    updateSubcontractor,
    deleteSubcontractor,
  };
};
