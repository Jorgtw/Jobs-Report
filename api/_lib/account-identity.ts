import { randomUUID } from 'node:crypto';

// Contact email is never an authentication key for new company accounts.
export const newAuthEmail = () => `${randomUUID()}@accounts.jobs-report.invalid`;
export const normalizeUsername = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : '';
export const validUsername = (value: string) => /^[a-z0-9][a-z0-9._-]{2,63}$/.test(value);

export async function assertExclusiveAccount(client: any, worker: any) {
  if (!worker.auth_id) return;
  const { data, error } = await client.from('user_companies').select('company_id').eq('auth_id', worker.auth_id);
  if (error) throw new Error('ACCESS_CHECK_FAILED');
  if (data?.some((m: any) => m.company_id !== worker.company_id)) throw new Error('ACCESS_SHARED_ACCOUNT');
}

export const usernamePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&');
