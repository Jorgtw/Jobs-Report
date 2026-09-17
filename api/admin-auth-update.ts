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

    const { targetUserId, updates, action = 'update' } = req.body;
    const { companyId } = updates || {};
    
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
        // Strict requirement: target worker MUST have an auth_id. Never fallback to admin auth_id!
        if (!targetWorker.auth_id) {
          return res.status(400).json({ 
            error: 'Target worker has no linked Auth account (auth_id is missing)' 
          });
        }

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
          if (['operator', 'supervisor', 'admin'].includes(requestedRole)) {
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

      return res.status(200).json({ success: true });
    }

    // --- GENERATE RECOVERY LINK ---
    if (action === 'generate-recovery-link') {
      const { targetUserId } = req.body;
      if (!targetUserId) return res.status(400).json({ error: 'Missing targetUserId' });

      // 1. Fetch worker data from database
      const { data: worker, error: workerErr } = await supabaseAdmin
        .from('workers')
        .select('id, email, name, auth_id, username, company_id')
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

      let currentAuthId = worker.auth_id;

      // If no auth_id, check if user exists in Auth by email
      if (!currentAuthId) {
        const { data: authListData } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = authListData?.users.find(u => u.email?.toLowerCase() === worker.email.toLowerCase());

        if (existingAuthUser) {
          currentAuthId = existingAuthUser.id;
          await supabaseAdmin.from('workers').update({ auth_id: currentAuthId }).eq('id', worker.id);
        } else {
          return res.status(400).json({ error: 'Target worker has no linked Auth account (auth_id is missing)' });
        }
      }

      console.log(`[API] Generating recovery link for worker ID: ${targetUserId} (${worker.email})`);
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: worker.email,
        options: {
          redirectTo: `https://jobs-report.vercel.app/`
        }
      });
      
      if (linkError || !linkData?.properties?.action_link) {
        console.error('[API] Supabase Link Generation Error:', linkError);
        return res.status(500).json({ success: false, error: 'RECOVERY_LINK_FAILED' });
      }

      const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
      const username = worker.username || worker.email;
      const password = '(usa il bottone qui sotto)';

      const emailHtml = `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
          <h2 style="color:#1e293b;margin-bottom:16px;">Accesso a Jobs Report</h2>
          <p style="color:#475569;font-size:15px;">Ciao <strong>${worker.name || 'Utente'}</strong>,</p>
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

      const emailText = `Ciao ${worker.name},\n\nEcco le tue credenziali:\nUsername: ${username}\nPassword: ${password}\n\nAccedi qui: ${linkData.properties.action_link}`;

      const resendPayload = {
        from: 'Jobs Report <no-reply@jobs-report.app>',
        to: [worker.email],
        subject: 'Le tue istruzioni di accesso – Jobs Report',
        html: emailHtml,
        text: emailText
      };

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify(resendPayload)
      });

      const resendData = await resendResponse.json();

      if (!resendResponse.ok) {
        console.error('RESEND_SEND_FAILED', resendData);
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
