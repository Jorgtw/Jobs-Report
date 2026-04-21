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
    // 1. Verify the requester's identity and permissions
    const { data: { user: requesterAuthUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requesterAuthUser) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // 2. Fetch requester's role (Global)
    const { data: requesterData, error: requesterDbError } = await supabaseAdmin
      .from('workers')
      .select('id, role')
      .eq('auth_id', requesterAuthUser.id)
      .single();

    if (requesterDbError || !requesterData) {
      return res.status(403).json({ error: 'Requester not found in database' });
    }

    const isSuperAdmin = requesterData.role === 'superadmin';

    const { targetUserId, updates, action = 'update' } = req.body;
    const { companyId } = updates || {};
    
    // --- CREATE NEW USER ---
    if (action === 'create') {
      const { name, username, password, email, role, status } = updates;
      
      // Determine the company_id (SSOT)
      const targetCompanyId = companyId;

      if (!isSuperAdmin) {
        // Verify requester belongs to this company as Admin/Supervisor
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
      let isUpdateFlow = false;

      // 1. Step 1: Check Identity Registry (Workers Table)
      const { data: existingWorker, error: lookupError } = await supabaseAdmin
        .from('workers')
        .select('auth_id, company_id')
        .eq('email', email)
        .maybeSingle();

      if (lookupError) {
        return res.status(500).json({ error: 'Identity registry lookup failed' });
      }

      if (existingWorker && existingWorker.auth_id) {
        // CASE: User already in system -> Use existing ID
        authId = existingWorker.auth_id;
        isUpdateFlow = true;
        
        // Optional: Update global profile fields in workers (but NOT company_id or role)
        const { name: updateName, username: updateUsername } = updates;
        await supabaseAdmin.from('workers')
          .update({ name: updateName, username: updateUsername, updated_at: new Date().toISOString() })
          .eq('auth_id', authId);
          
      } else {
        // CASE: User not in registry -> Check if they exist in Supabase Auth (Orphan account)
        const { data: authListData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = authListData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (existingAuthUser) {
          authId = existingAuthUser.id;
        } else {
          // Attempt to create new Auth account
          const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, company_id: targetCompanyId }
          });

          if (authCreateError) {
            return res.status(500).json({ error: `Auth creation failed: ${authCreateError.message}` });
          }
          authId = authData.user.id;
        }

        // Create initial profile in workers
        await supabaseAdmin.from('workers').insert([{
          name,
          username,
          email,
          auth_id: authId,
          company_id: targetCompanyId, // Default company
          role: role || 'worker',      // Default role
          status: status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      }

      // --- STEP 2: SSOT Membership (user_companies) ---
      // This is the source of truth for the multi-company architecture.
      const { data: finalAssociation, error: bridgeError } = await supabaseAdmin
        .from('user_companies')
        .upsert({
          auth_id: authId,
          company_id: targetCompanyId,
          role: role || 'worker'
        }, { 
          onConflict: 'auth_id, company_id' 
        })
        .select()
        .single();

      if (bridgeError) {
        console.error('SSOT Sync Error:', bridgeError);
        return res.status(500).json({ error: 'Failed to synchronize company membership' });
      }

      return res.status(200).json({ success: true, data: { auth_id: authId, company_id: targetCompanyId } });
    }
    }

    // --- UPDATE EXISTING USER ---
    if (action === 'update') {
      if (!targetUserId || !updates) {
        return res.status(400).json({ error: 'Missing targetUserId or updates' });
      }

    // Verify target user is in the same company (unless SuperAdmin)
    const { data: targetData, error: targetDbError } = await supabaseAdmin
      .from('workers')
      .select('company_id, auth_id, email')
      .eq('id', targetUserId)
      .single();

    if (targetDbError || !targetData) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (!isSuperAdmin) {
      // Verify requester has access to target's company
      const { data: hasAccess } = await supabaseAdmin
        .from('user_companies')
        .select('id')
        .eq('auth_id', requesterAuthUser.id)
        .eq('company_id', targetData.company_id)
        .maybeSingle();

      if (!hasAccess) {
        return res.status(403).json({ error: 'Unauthorized: Company mismatch' });
      }
    }

    // Sync Auth if email or password changed (with auto-confirm)
    const authUpdates: any = {};
    if (updates.email && updates.email !== targetData.email) {
      authUpdates.email = updates.email;
      authUpdates.email_confirm = true; // Auto-confirm email changes by admin
    }
    if (updates.password) authUpdates.password = updates.password;

    if ((authUpdates.email || authUpdates.password) && targetData.auth_id) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetData.auth_id,
        authUpdates
      );

      if (authUpdateError) {
        return res.status(500).json({ 
          error: `Failed to update user in Auth: ${authUpdateError.message}`, 
          detailed: authUpdateError
        });
      }
    }

    // Update workers table
    const dbUpdates: any = { ...updates };
    // Remove password fields from DB updates
    delete dbUpdates.password;
    delete dbUpdates.password_hash;

    const { error: finalDbError } = await supabaseAdmin
      .from('workers')
      .update(dbUpdates)
      .eq('id', targetUserId);

    if (finalDbError) {
      // ROLLBACK: If DB update fails, attempt to revert Auth email to previous value
      if (authUpdates.email && targetData.auth_id) {
        await supabaseAdmin.auth.admin.updateUserById(targetData.auth_id, {
          email: targetData.email,
          email_confirm: true
        });
      }
        return res.status(500).json({ error: 'Update failed in database. Auth has been rolled back where possible.', detailed: finalDbError });
      }

      return res.status(200).json({ success: true });
    }

    // --- GENERATE RECOVERY LINK ---
    if (action === 'generate-recovery-link') {
      const { targetUserId } = req.body;
      if (!targetUserId) return res.status(400).json({ error: 'Missing targetUserId' });

      // Resolve the user and their email
      const { data: targetData, error: targetDbError } = await supabaseAdmin
        .from('workers')
        .select('company_id, auth_id, email, name')
        .eq('id', targetUserId)
        .single();

      if (targetDbError || !targetData || !targetData.auth_id) {
        return res.status(404).json({ error: 'User not found in registry or missing auth_id' });
      }

      // Security check: same company or superadmin
      if (!isSuperAdmin) {
        // Verify requester has access to target's company
        const { data: hasAccess } = await supabaseAdmin
          .from('user_companies')
          .select('id')
          .eq('auth_id', requesterAuthUser.id)
          .eq('company_id', targetData.company_id)
          .maybeSingle();

        if (!hasAccess) {
          return res.status(403).json({ error: 'Unauthorized: Company mismatch' });
        }
      }

      // Generate the recovery link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: targetData.email,
        options: {
          redirectTo: `https://jobs-report.vercel.app`
        }
      });

      if (
        linkError || 
        typeof linkData?.properties?.action_link !== 'string' || 
        !linkData.properties.action_link
      ) {
        console.error('RECOVERY_LINK_GENERATION_FAILED', linkError);
        return res.status(500).json({ 
          success: false, 
          error: 'RECOVERY_LINK_FAILED' 
        });
      }

      // Send email via Resend — link is NOT returned to frontend
      const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
      const displayName = targetData.name || targetData.email;
      const emailHtml = `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
          <h2 style="color:#1e293b">Accesso a Jobs Report</h2>
          <p>Ciao <strong>${displayName}</strong>,</p>
          <p>Il tuo amministratore ti ha inviato le istruzioni per accedere a <strong>Jobs Report</strong>.</p>
          <p>Clicca il bottone qui sotto per impostare la tua password e accedere:</p>
          <a href="${linkData.properties.action_link}"
             style="display:inline-block;margin:16px 0;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Imposta password e accedi
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:28px;">
            Il link è valido per 24 ore. Se non hai richiesto questo accesso, ignora questa email.
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
        const resendError = await resendResponse.json().catch(() => ({}));
        console.error('RESEND_SEND_FAILED', resendError);
        return res.status(500).json({ error: 'Email sending failed. Database not updated.', detailed: resendError });
      }

      // Only update DB after confirmed email delivery — two sequential calls
      await supabaseAdmin
        .from('workers')
        .update({
          last_invitation_sent_at: new Date().toISOString()
        })
        .eq('id', targetUserId);

      await supabaseAdmin.rpc('increment_invitation_count', {
        worker_id: targetUserId
      });

      return res.status(200).json({ success: true, message: 'Email sent successfully' });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err: any) {
    console.error('Admin Auth Service Error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
