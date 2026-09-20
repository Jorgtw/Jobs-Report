import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { normalizeUsername, usernamePattern } from './_lib/account-identity.js';

export default async function handler(req: any, res: any) {
  res.setHeader?.('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const username = normalizeUsername(req.body?.username);
  if (!username || username.length > 254) return res.status(400).json({ error: 'INVALID_USERNAME' });
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const mailKey = process.env.RESEND_API_KEY || '';
  if (!url || !key || !mailKey) return res.status(503).json({ error: 'RECOVERY_UNAVAILABLE' });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    // Durable atomic limits shared by serverless instances. Unknown names receive the same response.
    const ip = String(req.headers?.['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown');
    const hash = (value: string) => createHash('sha256').update(value).digest('hex');
    const { data: allowed, error: limitError } = await sb.rpc('allow_account_recovery', {
      p_username_hash: hash(username), p_ip_hash: hash(ip)
    });
    if (limitError) throw limitError;
    if (!allowed) return res.status(200).json({ success: true });
    const { data: worker, error } = await sb.from('workers').select('auth_id,email,username,company_id,status')
      .ilike('username', usernamePattern(username)).maybeSingle();
    if (error) throw error;
    if (worker?.auth_id && worker.status === 'active' && worker.company_id && worker.email) {
      const { data: identity, error: identityError } = await sb.auth.admin.getUserById(worker.auth_id);
      if (identityError || !identity.user?.email) throw new Error('Recovery identity unavailable');
      const { data: link, error: linkError } = await sb.auth.admin.generateLink({
        type: 'recovery', email: identity.user.email,
        options: { redirectTo: 'https://app.jobs-report.app/' }
      });
      if (linkError || !link.properties?.action_link) throw new Error('Recovery link unavailable');
      const sent = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mailKey}` },
        body: JSON.stringify({
          from: 'Jobs Report <no-reply@jobs-report.app>', to: [worker.email],
          subject: 'JobsReport — Recupero password / Password reset',
          text: `Account: ${worker.username}\n\nPer scegliere una nuova password per questo account / To reset this account password:\n${link.properties.action_link}\n\nGli altri account non vengono modificati. Other accounts are unchanged.\nSe non hai richiesto il recupero, ignora questa email. If you did not request this, ignore this email.`
        })
      });
      if (!sent.ok) throw new Error('Recovery delivery failed');
    }
    return res.status(200).json({ success: true });
  } catch {
    console.error('ACCOUNT_RECOVERY_FAILED');
    return res.status(503).json({ error: 'RECOVERY_UNAVAILABLE' });
  }
}
