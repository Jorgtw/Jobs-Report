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
    // 1. Authenticate Requester from Bearer Token
    const { data: { user: requesterAuthUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requesterAuthUser) {
      console.error('API: Auth error or requester user not found:', authError?.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // 2. Fetch Requester Profile from Database
    const { data: requesterData, error: requesterDbError } = await supabaseAdmin
      .from('workers')
      .select('id, role, company_id')
      .eq('auth_id', requesterAuthUser.id)
      .maybeSingle();

    if (requesterDbError || !requesterData) {
      console.error('API: Requester role lookup failed:', requesterDbError);
      return res.status(403).json({ error: 'Requester not found in database' });
    }

    // 3. Robust Superadmin Check (SSOT: user_roles table or workers.role)
    const isSuperAdminByRole = requesterData.role?.toLowerCase() === 'superadmin';
    
    const { data: saRoleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requesterData.id)
      .eq('role', 'superadmin')
      .maybeSingle();

    const { data: saAuthRoleData } = !saRoleData ? await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requesterAuthUser.id)
      .eq('role', 'superadmin')
      .maybeSingle() : { data: null };

    const isSuperAdmin = isSuperAdminByRole || !!saRoleData || !!saAuthRoleData;

    // 4. Retrieve Requester's Administrative Companies (for non-Superadmin)
    const adminCompanyIds = new Set<string>();
    if (requesterData.role?.toLowerCase() === 'admin' && requesterData.company_id) {
      adminCompanyIds.add(requesterData.company_id);
    }
    
    const { data: requesterAdminMemberships } = await supabaseAdmin
      .from('user_companies')
      .select('company_id')
      .eq('auth_id', requesterAuthUser.id)
      .eq('role', 'admin');

    requesterAdminMemberships?.forEach(m => {
      if (m.company_id) adminCompanyIds.add(m.company_id);
    });

    // Rule: Non-superadmins must have Admin role in at least one company. Worker/Supervisor have no authorization.
    if (!isSuperAdmin && adminCompanyIds.size === 0) {
      return res.status(403).json({ error: 'Unauthorized: Insufficient permissions (Admin or Superadmin required)' });
    }

    const { targetUserId, updates, action = 'update' } = req.body || {};
    const { companyId } = updates || {};

    // Provision access for a saved worker, never by attaching an arbitrary email account.
    const ensureWorkerAccount = async (worker: any, password?: string) => {
      if (!worker.email || !worker.company_id) throw new Error('ACCESS_EMAIL_REQUIRED');
      if (worker.status !== 'active') throw new Error('ACCESS_WORKER_INACTIVE');
      const { data: protectedRoles, error: roleError } = await supabaseAdmin.from('user_roles')
        .select('role').in('user_id', [worker.id, worker.auth_id].filter(Boolean)).eq('role', 'superadmin');
      if (roleError) throw new Error('ACCESS_CHECK_FAILED');
      if (!isSuperAdmin && (worker.role === 'superadmin' || protectedRoles?.length)) {
        throw new Error('ACCESS_PROTECTED_ACCOUNT');
      }
      let authId = worker.auth_id;
      if (authId) {
        if (authId === requesterAuthUser.id && worker.id !== requesterData.id) throw new Error('ACCESS_IDENTITY_MISMATCH');
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(authId);
        if (error || !data?.user) throw new Error('ACCESS_ACCOUNT_NOT_FOUND');
        if (data.user.email?.toLowerCase() !== worker.email.trim().toLowerCase()) throw new Error('ACCESS_IDENTITY_MISMATCH');
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: worker.email.trim(), email_confirm: true,
          ...(password ? { password } : {}),
          user_metadata: { name: worker.name }
        });
        if (error || !data?.user) throw new Error('ACCESS_CREATE_FAILED');
        authId = data.user.id;
        const { data: linked, error: linkError } = await supabaseAdmin.from('workers')
          .update({ auth_id: authId }).eq('id', worker.id).select('id').single();
        if (linkError || !linked) throw new Error('ACCESS_LINK_FAILED');
      }
      if (isSuperAdmin || adminCompanyIds.has(worker.company_id)) {
        const { error: membershipError } = await supabaseAdmin.from('user_companies').upsert({
          auth_id: authId, company_id: worker.company_id, role: worker.role || 'operator'
        }, { onConflict: 'auth_id,company_id' });
        if (membershipError) throw new Error('ACCESS_MEMBERSHIP_FAILED');
      }
      return authId;
    };
    
    // --- CREATE NEW USER ---
    if (action === 'create' || action === 'create_idempotent') {
      const { name, username, password, email, role, status } = updates;
      const targetCompanyId = companyId;

      if (!isSuperAdmin && (!targetCompanyId || !adminCompanyIds.has(targetCompanyId))) {
        return res.status(403).json({ error: 'Insufficient permissions for this company' });
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
        if (listError) return res.status(500).json({ error: 'Identity registry lookup failed' });
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

        // Use UPSERT for workers to be truly idempotent
        await supabaseAdmin.from('workers').upsert([{
          name,
          username,
          email,
          phone: updates.phone || null,
          company_id: targetCompanyId,
          auth_id: authId,
          role: role || 'worker',
          status: status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }], { onConflict: 'auth_id, company_id' });
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

      if (updates.role && !isSuperAdmin && !['operator', 'worker', 'supervisor', 'admin'].includes(updates.role.toLowerCase())) {
        return res.status(403).json({ error: 'Unauthorized: Invalid or privileged role assignment' });
      }
      if (updates.password && (typeof updates.password !== 'string' || updates.password.length < 6)) {
        return res.status(400).json({ error: 'ACCESS_PASSWORD_TOO_SHORT' });
      }

      // Server-side retrieval of target worker from Database (never trust client payload)
      const { data: targetWorker, error: targetDbError } = await supabaseAdmin
        .from('workers')
        .select('id, auth_id, email, company_id, name, username, role, status')
        .eq('id', targetUserId)
        .maybeSingle();

      if (targetDbError || !targetWorker) {
        console.error('API: Target user lookup failed:', targetDbError);
        return res.status(404).json({ error: 'Target user not found' });
      }

      // 1. Superadmin Protection: Company Admins cannot modify a Superadmin account
      const { data: targetSuperadminCheck } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', targetWorker.id)
        .eq('role', 'superadmin')
        .maybeSingle();

      const isTargetSuperAdmin = (
        targetWorker.role?.toLowerCase() === 'superadmin' ||
        !!targetSuperadminCheck
      );

      if (isTargetSuperAdmin && !isSuperAdmin) {
        return res.status(403).json({ error: 'Unauthorized: Company admins cannot modify superadmin accounts' });
      }

      // 2. Check Company Authorization:
      // Superadmin can edit any company; Admin can ONLY edit users of their authorized company
      if (!isSuperAdmin) {
        let isAuthorized = false;
        if (targetWorker.company_id && adminCompanyIds.has(targetWorker.company_id)) {
          isAuthorized = true;
        } else if (targetWorker.auth_id) {
          const { data: targetCompanies } = await supabaseAdmin
            .from('user_companies')
            .select('company_id')
            .eq('auth_id', targetWorker.auth_id)
            .in('company_id', Array.from(adminCompanyIds));

          if (targetCompanies && targetCompanies.length > 0) {
            isAuthorized = true;
          }
        }

        if (!isAuthorized) {
          return res.status(403).json({ error: 'Unauthorized: Company mismatch' });
        }
      }

      // 3. Handle sensitive Auth updates (email / password) with strict verification
      const isAuthUpdate = !!(updates.email || updates.password);
      if (isAuthUpdate) {
        targetWorker.auth_id = await ensureWorkerAccount({
          ...targetWorker,
          email: targetWorker.email || updates.email,
          status: updates.status || targetWorker.status
        }, updates.password);

        // Verify target auth account exists in Supabase Auth system
        const { data: targetAuthData, error: authLookupErr } = await supabaseAdmin.auth.admin.getUserById(targetWorker.auth_id);
        if (authLookupErr || !targetAuthData?.user) {
          return res.status(400).json({ 
            error: 'Target worker auth account not found in Auth system' 
          });
        }

        // Safety safeguard: never inadvertently overwrite admin's auth credentials when modifying another worker
        if (targetWorker.auth_id === requesterAuthUser.id && targetWorker.id !== requesterData.id) {
          return res.status(400).json({ 
            error: 'Security violation: Target worker auth_id matches administrator auth_id' 
          });
        }

        const authUpdates: any = {};
        if (updates.email && updates.email !== targetWorker.email) {
          authUpdates.email = updates.email;
          authUpdates.email_confirm = true;
        }
        if (updates.password) {
          authUpdates.password = updates.password;
        }

        if (Object.keys(authUpdates).length > 0) {
          const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
            targetWorker.auth_id,
            authUpdates
          );

          if (authUpdateError) {
            console.error('API: Auth update error:', authUpdateError.message);
            return res.status(500).json({ 
              error: `Failed to update user in Auth: ${authUpdateError.message}`, 
              detailed: authUpdateError
            });
          }
        }
      }

      // 4. Strict Field Whitelist for database update
      const ALLOWED_FIELDS = [
        'name',
        'username',
        'email',
        'phone',
        'address',
        'hourly_rate',
        'overtime_hourly_rate',
        'extra_cost',
        'internal_note',
        'status',
        'subcontractor_id'
      ];

      const dbUpdates: any = {};
      for (const field of ALLOWED_FIELDS) {
        if (updates[field] !== undefined) {
          dbUpdates[field] = updates[field];
        }
      }

      // Role assignment security:
      if (updates.role) {
        const requestedRole = updates.role.toLowerCase();
        if (isSuperAdmin) {
          dbUpdates.role = requestedRole;
        } else {
          if (['operator', 'worker', 'supervisor', 'admin'].includes(requestedRole)) {
            dbUpdates.role = requestedRole;
          } else {
            return res.status(403).json({ error: 'Unauthorized: Invalid or privileged role assignment' });
          }
        }
      }

      // Company change is strictly Superadmin-only
      if (updates.company_id && isSuperAdmin) {
        dbUpdates.company_id = updates.company_id;
      }

      if (!dbUpdates.status && !targetWorker.status) dbUpdates.status = 'active';
      if (!dbUpdates.role && !targetWorker.role) dbUpdates.role = 'operator';

      const { error: finalDbError } = await supabaseAdmin
        .from('workers')
        .update(dbUpdates)
        .eq('id', targetUserId);

      if (finalDbError) {
        console.error('API: Database update error:', finalDbError);
        return res.status(500).json({ error: 'Update failed in database.', detailed: finalDbError });
      }

      if (dbUpdates.role && targetWorker.auth_id) {
        const { error: membershipError } = await supabaseAdmin.from('user_companies')
          .update({ role: dbUpdates.role }).eq('auth_id', targetWorker.auth_id).eq('company_id', targetWorker.company_id);
        if (membershipError) return res.status(500).json({ error: 'ACCESS_MEMBERSHIP_FAILED' });
      }

      return res.status(200).json({ success: true });
    }

    // --- GENERATE RECOVERY LINK ---
    if (action === 'generate-recovery-link' || action === 'send-access') {
      const { targetUserId } = req.body;
      if (!targetUserId) return res.status(400).json({ error: 'Missing targetUserId' });
      const directAccess = action === 'send-access';
      const password = directAccess ? req.body.password : undefined;
      if (directAccess && (typeof password !== 'string' || password.trim().length < 6)) {
        return res.status(400).json({ error: 'ACCESS_PASSWORD_TOO_SHORT' });
      }

      // 1. Fetch worker data from database
      const { data: worker, error: workerErr } = await supabaseAdmin
        .from('workers')
        .select('id, email, name, auth_id, username, company_id, role, status')
        .eq('id', targetUserId)
        .maybeSingle();

      if (workerErr || !worker) {
        return res.status(404).json({ error: 'User not found in database' });
      }

      if (!worker.email) {
        return res.status(400).json({ error: 'User has no email address' });
      }

      // Check Company Authorization
      if (!isSuperAdmin) {
        let isAuthorized = false;
        if (worker.company_id && adminCompanyIds.has(worker.company_id)) {
          isAuthorized = true;
        } else if (worker.auth_id) {
          const { data: targetCompanies } = await supabaseAdmin
            .from('user_companies')
            .select('company_id')
            .eq('auth_id', worker.auth_id)
            .in('company_id', Array.from(adminCompanyIds));

          if (targetCompanies && targetCompanies.length > 0) {
            isAuthorized = true;
          }
        }

        if (!isAuthorized) {
          return res.status(403).json({ error: 'Unauthorized: Company mismatch' });
        }
      }

      const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
      if (!RESEND_API_KEY) return res.status(503).json({ error: 'ACCESS_EMAIL_NOT_CONFIGURED' });
      const workerAuthId = await ensureWorkerAccount(worker);

      const loginUrl = 'https://jobs-report.vercel.app/';
      let actionUrl = loginUrl;
      if (directAccess) {
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(workerAuthId, { password });
        if (passwordError) return res.status(400).json({ error: 'ACCESS_PASSWORD_UPDATE_FAILED' });
      } else {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: worker.email,
          options: { redirectTo: loginUrl }
        });
        if (linkError || !linkData?.properties?.action_link) {
          return res.status(500).json({ success: false, error: 'ACCESS_LINK_GENERATION_FAILED' });
        }
        actionUrl = linkData.properties.action_link;
      }

      const username = worker.username || worker.email;
      const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[char]!));

      const emailHtml = `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
          <h2 style="color:#1e293b;margin-bottom:16px;">Accesso a Jobs Report</h2>
          <p style="color:#475569;font-size:15px;">Ciao <strong>${escapeHtml(worker.name || 'Utente')}</strong>,</p>
          <p style="color:#475569;font-size:15px;">Il tuo amministratore ti ha inviato le istruzioni per accedere a <strong>Jobs Report</strong>.</p>
          
          <div style="background-color:#f8fafc;padding:16px;border-radius:12px;margin:20px 0;border:1px solid #f1f5f9;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;font-weight:bold;">Il tuo accesso</p>
            <p style="margin:4px 0;font-size:14px;color:#1e293b;"><strong>Username:</strong> ${escapeHtml(username)}</p>
            ${directAccess ? `<p style="margin:4px 0;font-size:14px;color:#1e293b;"><strong>Password:</strong> <span style="white-space:pre-wrap">${escapeHtml(password)}</span></p>` : ''}
            <p style="margin:4px 0;font-size:14px;color:#1e293b;"><strong>Link:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          </div>

          <p style="color:#475569;font-size:15px;">${directAccess ? 'Usa il nome utente e la password qui sopra per entrare.' : 'Apri il bottone qui sotto per scegliere la tua password.'}</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${actionUrl}"
               style="display:inline-block;padding:14px 32px;background-color:#2563eb;color:#ffffff;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;box-shadow:0 4px 6px -1px rgba(37, 99, 235, 0.2);">
              ${directAccess ? 'Apri Jobs Report' : 'Imposta password e accedi'}
            </a>
          </div>
          <h3>Dal telefono</h3>
          <ol><li>Tocca «Apri Jobs Report» o il link qui sopra.</li><li>Inserisci il nome utente e la password.</li><li>Tocca «Accedi». Non serve installare nulla.</li></ol>
          <h3>Dal PC</h3>
          <ol><li>Apri il link in Chrome, Edge, Safari o Firefox.</li><li>Inserisci lo stesso nome utente e la stessa password.</li><li>Clicca «Accedi».</li></ol>
          
          <p style="color:#94a3b8;font-size:11px;margin-top:32px;border-top:1px solid #f1f5f9;padding-top:16px;text-align:center;">
            ${directAccess ? 'Questa password sostituisce quella precedente. Conserva questa email per ritrovare i dati di accesso. Se non riesci a entrare, chiedi al tuo amministratore.' : 'Usa il link più recente. Se è scaduto, chiedi un nuovo invio al tuo amministratore.'}<br>
            © Jobs Report
          </p>
        </div>`;

      const emailText = `Ciao ${worker.name},\n\nLink: ${loginUrl}\nUsername: ${username}\n${directAccess ? `Password: ${password}\nQuesta password sostituisce quella precedente.` : `Scegli la tua password: ${actionUrl}`}\n\nDAL TELEFONO\n1. Tocca il link.\n2. Inserisci nome utente e password.\n3. Tocca Accedi. Non serve installare nulla.\n\nDAL PC\n1. Apri il link in Chrome, Edge, Safari o Firefox.\n2. Inserisci nome utente e password.\n3. Clicca Accedi.\n\nSe non riesci a entrare, chiedi al tuo amministratore.`;

      const resendPayload = {
        from: 'Jobs Report <no-reply@jobs-report.app>',
        to: [worker.email],
        subject: 'Le tue istruzioni di accesso – Jobs Report',
        html: emailHtml,
        text: emailText
      };

      let resendResponse: Response;
      try {
        resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify(resendPayload)
        });
      } catch {
        return res.status(502).json({ error: directAccess ? 'ACCESS_PASSWORD_SAVED_EMAIL_FAILED' : 'ACCESS_EMAIL_SEND_FAILED' });
      }

      if (!resendResponse.ok) {
        console.error('RESEND_SEND_FAILED', resendResponse.status);
        return res.status(502).json({ error: directAccess ? 'ACCESS_PASSWORD_SAVED_EMAIL_FAILED' : 'ACCESS_EMAIL_SEND_FAILED' });
      }

      await supabaseAdmin.from('workers').update({ last_invitation_sent_at: new Date().toISOString() }).eq('id', targetUserId);
      await supabaseAdmin.rpc('increment_invitation_count', { worker_id: targetUserId });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err: any) {
    console.error('Admin Auth Service Error:', err);
    if (err.message?.startsWith('ACCESS_')) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
