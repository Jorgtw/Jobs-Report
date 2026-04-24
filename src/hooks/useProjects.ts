import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../services/dbService';
import { Project } from '../types';

export const useProjects = (companyId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<Project[], Error>({
    queryKey: ['projects', companyId],
    queryFn: async () => {
      const projects = await db.getProjects();
      return projects || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minuti
    enabled: !!companyId,
  });

  const createProject = useMutation({
    mutationFn: (data: any) => db.addProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => db.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => db.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    ...query,
    createProject,
    updateProject,
    deleteProject,
  };
};
