import { queryOptions, QueryClient } from '@tanstack/react-query';
import { db } from './dbService';
import type { WorkReport } from '../types';

export const reportsQueryOptions = (companyId?: string, userId?: string, dateFrom?: string, dateTo?: string) =>
  queryOptions({
    queryKey: ['reports', companyId, userId, dateFrom ?? null, dateTo ?? null],
    queryFn: (): Promise<WorkReport[]> => db.getReports(dateFrom, dateTo),
    staleTime: 30_000,
  });

export const summaryQueryOptions = (client: QueryClient, companyId?: string, userId?: string) =>
  queryOptions({
    queryKey: ['summary', companyId, userId],
    queryFn: async () => {
      // Retain full history for fixed compensation recognition; reuse cached source data.
      const [reports, projects, clients, workers] = await Promise.all([
        client.fetchQuery(reportsQueryOptions(companyId, userId)),
        client.fetchQuery({ queryKey: ['projects', companyId, userId], queryFn: () => db.getProjects(), staleTime: 30_000 }),
        client.fetchQuery({ queryKey: ['clients', companyId], queryFn: () => db.getClients(), staleTime: 30_000 }),
        client.fetchQuery({ queryKey: ['users', companyId], queryFn: () => db.getUsers(), staleTime: 30_000 }),
      ]);
      return db.getSummary(undefined, undefined, { reports, projects, clients, workers });
    },
    staleTime: 30_000,
  });
