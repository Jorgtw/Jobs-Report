import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../services/dbService';
import { WorkReport, Role } from '../types';

export const useReports = (userId: string, role: Role) => {
  const queryClient = useQueryClient();

  const query = useQuery<WorkReport[], Error>({
    queryKey: ['reports', userId, role],
    queryFn: async () => {
      const reports = await db.getReports(userId, role);
      return reports || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minuti
  });

  const createReport = useMutation({
    mutationFn: (data: Omit<WorkReport, 'id'>) => db.addReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const updateReport = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkReport> }) => db.updateReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const deleteReport = useMutation({
    mutationFn: (id: string) => db.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  return {
    ...query,
    createReport,
    updateReport,
    deleteReport,
  };
};
