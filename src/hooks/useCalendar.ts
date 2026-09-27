import { useQuery } from '@tanstack/react-query';
import { calendarService } from '../services/calendarService';
import type { User } from '../types';
export const useCalendar = (user: User, from: string, to: string) => useQuery({
  queryKey: ['calendar', user.companyId, user.id, user.role, from, to],
  queryFn: () => calendarService.list(user.companyId!, from, to),
  enabled: !!user.companyId, staleTime: 30_000, retry: 1
});
