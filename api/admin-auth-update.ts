import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialization inside the handler to manage environment variables gracefully
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase credentials' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    console.log('API: Verifying requester token...');
    const { data: { user: requesterAuthUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requesterAuthUser) {
      console.error('API: Auth error or user not found:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.log('API: Requester identified:', requesterAuthUser.email);

    console.log('API: Fetching requester role for auth_id:', requesterAuthUser.id);
    const { data: requesterData, error: requesterDbError } = await supabaseAdmin
      .from('workers')
      .select('id, role')
      .eq('auth_id', requesterAuthUser.id)
      .single();

    if (requesterDbError || !requesterData) {
      console.error('API: Requester role lookup failed:', requesterDbError);
      return res.status(403).json({ error: 'Requester not found in database' });
    }

    const isSuperAdmin = requesterData.role === 'superadmin';

    const { targetUserId, updates, action = 'update' } = req.body;
    const { companyId } = updates || {};
    
    // --- CREATE NEW USER ---
    if (action === 'create') {
      const { name, username, password, email, role, status } = updates;
      
      const targetCompanyId = companyId;

      if (!isSuperAdmin) {
        const { data: membership } = await supabaseAdmin
          .from('user_companies')
          .select('role')
          .eq('auth_id', requesterAuthUser.id)
          .eq('company_id', targetCompanyId)
          .single();

        if (membership?.role !== 'admin' && membership?.role !== 'supervisor') {
          return res.status(403).json({ error: 'Insufficient permissions for this company' });
        }
      }

      let authId: string | null = null;

      const { data: existingWorker, error: lookupError } = await supabaseAdmin
        .from('workers')
        .select('auth_id, company_id')
        .eq('email', email)
        .maybeSingle();

      if (lookupError) {
        return res.status(500).json({ error: 'Identity registry lookup failed' });
      }

      if (existingWorker && existingWorker.auth_id) {
        authId = existingWorker.auth_id;
        const { name: updateName, username: updateUsername } = updates;
        await supabaseAdmin.from('workers')
          .update({ name: updateName, username: updateUsername, updated_at: new Date().toISOString() })
          .eq('auth_id', authId);
          
      } else {
        const { data: authListData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = authListData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (existingAuthUser) {
          authId = existingAuthUser.id;
        } else {
          const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
          });

          if (authCreateError) {
            return res.status(500).json({ error: `Auth creation failed: ${authCreateError.message}` });
          }
          authId = authData.user.id;
        }

        await supabaseAdmin.from('workers').insert([{
          name,
          username,
          email,
          auth_id: authId,
          role: role || 'worker',
          status: status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      }

      const { error: bridgeError } = await supabaseAdmin
        .from('user_companies')
        .upsert({
          auth_id: authId,
          company_id: targetCompanyId,
          role: role || 'worker'
        }, { 
          onConflict: 'auth_id, company_id' 
        });

      if (bridgeError) {
        console.error('SSOT Sync Error:', bridgeError);
        return res.status(500).json({ error: 'Failed to synchronize company membership' });
      }

      return res.status(200).json({ success: true, data: { auth_id: authId, company_id: targetCompanyId } });
    }

    // --- UPDATE EXISTING USER ---
    if (action === 'update') {
      if (!targetUserId || !updates) {
        return res.status(400).json({ error: 'Missing targetUserId or updates' });
      }

      console.log('API: Update request for targetUserId:', targetUserId);
      const { data: targetData, error: targetDbError } = await supabaseAdmin
        .from('workers')
        .select('auth_id, email')
        .eq('id', targetUserId)
        .single();

      if (targetDbError || !targetData) {
        console.error('API: Target user lookup failed:', targetDbError);
        return res.status(404).json({ error: 'Target user not found' });
      }

      if (!isSuperAdmin) {
        // Ricava le ditte in cui il requester è admin o supervisor
        const { data: requesterCompanies } = await supabaseAdmin
          .from('user_companies')
          .select('company_id')
          .eq('auth_id', requesterAuthUser.id)
          .in('role', ['admin', 'supervisor']);
          
        const reqCompanyIds = requesterCompanies?.map(c => c.company_id) || [];
        
        if (reqCompanyIds.length === 0) {
           return res.status(403).json({ error: 'Unauthorized: No administrative companies found' });
        }

        // Controlla se il target appartiene ad almeno una di queste ditte
        const { data: targetCompanies } = await supabaseAdmin
          .from('user_companies')
          .select('company_id')
          .eq('auth_id', targetData.auth_id)
          .in('company_id', reqCompanyIds);

        if (!targetCompanies || targetCompanies.length === 0) {
          return res.status(403).json({ error: 'Unauthorized: Company mismatch' });
        }
      }

      const authUpdates: any = {};
      if (updates.email && updates.email !== targetData.email) {
        authUpdates.email = updates.email;
        authUpdates.email_confirm = true;
      }
      if (updates.password) authUpdates.password = updates.password;

      if ((authUpdates.email || authUpdates.password) && targetData.auth_id) {
        console.log('API: Syncing with Supabase Auth for auth_id:', targetData.auth_id);
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
          targetData.auth_id,
          authUpdates
        );

        if (authUpdateError) {
          console.error('API: Auth update error:', authUpdateError);
          return res.status(500).json({ 
            error: `Failed to update user in Auth: ${authUpdateError.message}`, 
            detailed: authUpdateError
          });
        }
      }

      const dbUpdates: any = { ...updates };
      delete dbUpdates.password;
      delete dbUpdates.password_hash;
      delete dbUpdates.companyId; // Remove frontend-only field

      const { error: finalDbError } = await supabaseAdmin
        .from('workers')
        .update(dbUpdates)
        .eq('id', targetUserId);

      if (finalDbError) {
        console.error('API: Database update error:', finalDbError);
        if (authUpdates.email && targetData.auth_id) {
          await supabaseAdmin.auth.admin.updateUserById(targetData.auth_id, {
            email: targetData.email,
            email_confirm: true
          });
        }
        return res.status(500).json({ error: 'Update failed in database.', detailed: finalDbError });
      }

      return res.status(200).json({ success: true });
    }

    // --- GENERATE RECOVERY LINK ---
    if (action === 'generate-recovery-link') {
      const { targetUserId } = req.body;
      if (!targetUserId) return res.status(400).json({ error: 'Missing targetUserId' });

      const { data: targetData, error: targetDbError } = await supabaseAdmin
        .from('workers')
        .select('auth_id, email, name')
        .eq('id', targetUserId)
        .single();

      if (targetDbError || !targetData || !targetData.auth_id) {
        return res.status(404).json({ error: 'User not found in registry or missing auth_id' });
      }

      if (!isSuperAdmin) {
        const { data: requesterCompanies } = await supabaseAdmin
          .from('user_companies')
          .select('company_id')
          .eq('auth_id', requesterAuthUser.id)
          .in('role', ['admin', 'supervisor']);
          
        const reqCompanyIds = requesterCompanies?.map(c => c.company_id) || [];
        
        if (reqCompanyIds.length === 0) {
           return res.status(403).json({ error: 'Unauthorized: No administrative companies found' });
        }

        const { data: targetCompanies } = await supabaseAdmin
          .from('user_companies')
          .select('company_id')
          .eq('auth_id', targetData.auth_id)
          .in('company_id', reqCompanyIds);

        if (!targetCompanies || targetCompanies.length === 0) {
          return res.status(403).json({ error: 'Unauthorized: Company mismatch' });
        }
      }

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: targetData.email,
        options: {
          redirectTo: `https://jobs-report.vercel.app/#/reset-password`
        }
      });

      if (linkError || !linkData?.properties?.action_link) {
        console.error('RECOVERY_LINK_GENERATION_FAILED', linkError);
        return res.status(500).json({ success: false, error: 'RECOVERY_LINK_FAILED' });
      }

      const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
      const { data: targetWorker } = await supabaseAdmin.from('workers').select('username, password').eq('id', targetUserId).single();
      const username = targetWorker?.username || targetData.email;
      const password = targetWorker?.password || '********';

      const emailHtml = `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
          <h2 style="color:#1e293b;margin-bottom:16px;">Accesso a Jobs Report</h2>
          <p style="color:#475569;font-size:15px;">Ciao <strong>${displayName}</strong>,</p>
          <p style="color:#475569;font-size:15px;">Il tuo amministratore ti ha inviato le istruzioni per accedere a <strong>Jobs Report</strong>.</p>
          
          <div style="background-color:#f8fafc;padding:16px;border-radius:12px;margin:20px 0;border:1px solid #f1f5f9;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">Credenziali Temporanee</p>
            <p style="margin:4px 0;font-size:14px;color:#1e293b;"><strong>Username:</strong> ${username}</p>
            <p style="margin:4px 0;font-size:14px;color:#1e293b;"><strong>Password:</strong> ${password}</p>
          </div>

          <p style="color:#475569;font-size:15px;">Clicca il bottone qui sotto per impostare la tua password definitiva e accedere al sistema:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${linkData.properties.action_link}"
               style="display:inline-block;padding:14px 32px;background-color:#2563eb;color:#ffffff;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;box-shadow:0 4px 6px -1px rgba(37, 99, 235, 0.2);">
              Imposta password e accedi
            </a>
          </div>
          
          <p style="color:#94a3b8;font-size:11px;margin-top:32px;border-top:1px solid #f1f5f9;padding-top:16px;text-align:center;">
            Il link è valido per 24 ore. Se non hai richiesto questo accesso, puoi ignorare questa email.<br>
            © Jobs Report
          </p>
        </div>`;

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Jobs Report <noreply@jobs-report.app>',
          to: [targetData.email],
          subject: 'Le tue istruzioni di accesso – Jobs Report',
          html: emailHtml
        })
      });

      if (!resendResponse.ok) {
        console.error('RESEND_SEND_FAILED');
        return res.status(500).json({ error: 'Email sending failed.' });
      }

      await supabaseAdmin.from('workers').update({ last_invitation_sent_at: new Date().toISOString() }).eq('id', targetUserId);
      await supabaseAdmin.rpc('increment_invitation_count', { worker_id: targetUserId });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err: any) {
    console.error('Admin Auth Service Error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
