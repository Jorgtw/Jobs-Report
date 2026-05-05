import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../services/dbService';

export const useSubcontractors = (companyId?: string, userId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<any[], Error>({
    queryKey: ['subcontractors', companyId],
    queryFn: async () => {
      const subs = await db.getSubcontractors();
      return subs || [];
    },
    staleTime: 1000 * 30, // 30 secondi
    retry: 3,
    refetchOnWindowFocus: true,
    enabled: !!companyId && !!userId,
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
