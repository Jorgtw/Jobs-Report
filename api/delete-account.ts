import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return res.status(503).json({ error: 'SERVICE_UNAVAILABLE' });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const bearer = req.headers?.authorization;
  if (typeof bearer !== 'string' || !bearer.startsWith('Bearer ')) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const { data: { user }, error: authError } = await sb.auth.getUser(bearer.slice(7));
  if (authError || !user) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const { companyId, workerId } = req.body || {};
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!!companyId === !!workerId || !uuid.test(companyId || workerId)) return res.status(400).json({ error: 'INVALID_TARGET' });
  // Authorization, association checks and domain deletion occur in one database transaction.
  const { error } = await sb.rpc('delete_company_account_resource', {
    p_requester: user.id, p_company_id: companyId || null, p_worker_id: workerId || null
  });
  if (error) {
    const known = ['ACCESS_FORBIDDEN', 'ACCESS_SHARED_ACCOUNT', 'ACCESS_PROTECTED_ACCOUNT', 'ACCESS_NOT_FOUND'];
    return res.status(known.includes(error.message) ? 403 : 500).json({ error: known.includes(error.message) ? error.message : 'DELETION_FAILED' });
  }
  // Credentials are already detached from domain data. Durable queue permits safe retries after outages.
  const { data: pending, error: queueError } = await sb.from('account_deletion_queue').select('auth_id')
    .eq('resource_id', companyId || workerId);
  if (queueError) return res.status(503).json({ error: 'ACCOUNT_CLEANUP_PENDING' });
  for (const entry of pending || []) {
    const { error: deletionError } = await sb.auth.admin.deleteUser(entry.auth_id);
    if (deletionError && deletionError.status !== 404) return res.status(503).json({ error: 'ACCOUNT_CLEANUP_PENDING' });
    const { error: cleanupError } = await sb.from('account_deletion_queue').delete().eq('auth_id', entry.auth_id);
    if (cleanupError) return res.status(503).json({ error: 'ACCOUNT_CLEANUP_PENDING' });
  }
  return res.status(200).json({ success: true });
}
