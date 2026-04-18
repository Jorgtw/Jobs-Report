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

    // 2. Fetch requester's role and company from database
    const { data: requesterData, error: requesterDbError } = await supabaseAdmin
      .from('workers')
      .select('id, role, company_id')
      .eq('auth_id', requesterAuthUser.id)
      .single();

    if (requesterDbError || !requesterData) {
      return res.status(403).json({ error: 'Requester not found in database' });
    }

    // Check if requester is Admin or SuperAdmin
    const { data: saRole } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', requesterData.id).maybeSingle();
    const isSuperAdmin = saRole?.role === 'superadmin';
    const isAdmin = requesterData.role === 'admin' || isSuperAdmin;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Only Admins can perform this action' });
    }

    const { targetUserId, updates, action = 'update' } = req.body;
    
    // --- CREATE NEW USER ---
    if (action === 'create') {
      const { name, username, password, email, role, status, companyId } = updates;
      
      // Determine the company_id for the new user
      const targetCompanyId = (isSuperAdmin && companyId) ? companyId : requesterData.company_id;

      let authId: string | null = null;
      let isUpdateFlow = false;

      // 1. Step 1: Check Identity Registry (Workers Table)
      // This is the ONLY source for identity resolution at runtime.
      const { data: existingWorker, error: lookupError } = await supabaseAdmin
        .from('workers')
        .select('auth_id')
        .eq('email', email)
        .maybeSingle();

      if (lookupError) {
        return res.status(500).json({ error: 'Identity registry lookup failed' });
      }

      if (existingWorker && existingWorker.auth_id) {
        // CASE: User found in registry -> Update existing Auth account
        authId = existingWorker.auth_id;
        isUpdateFlow = true;
        
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(authId, {
          password,
          user_metadata: { name, company_id: targetCompanyId }
        });

        if (authUpdateError) {
          return res.status(500).json({ error: `Auth update failed: ${authUpdateError.message}` });
        }
      } else {
        // CASE: User not in registry -> Attempt to create new Auth account
        const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, company_id: targetCompanyId }
        });

        if (authCreateError) {
          // If creation fails due to existing email not in our registry, it's an orphan account
          if (authCreateError.message.toLowerCase().includes('already') || authCreateError.status === 422) {
            console.error(`ORPHAN_DETECTED: Email ${email} exists in Auth but is missing from workers registry.`);
            return res.status(409).json({ 
              error: 'Identity conflict: This email is already registered in Supabase Auth but is missing from the local registry. Manual reconciliation by SuperAdmin is required.',
              code: 'ORPHAN_DETECTED'
            });
          }
          return res.status(500).json({ error: `Auth creation failed: ${authCreateError.message}` });
        }

        authId = authData.user.id;
      }

      // --- SAFETY GUARD: Ensure Auth ID is resolved before DB write ---
      if (!authId) {
        console.error('CRITICAL: AUTH_ID_UNRESOLVED for email:', email);
        return res.status(500).json({ error: 'AUTH_ID_UNRESOLVED' });
      }

      // 2. Step 2: Synchronize Projection (Workers Table)
      const workerObj: any = {
        name,
        username,
        email, 
        role: role || 'operator',
        status: status || 'active',
        company_id: targetCompanyId,
        auth_id: authId,
        updated_at: new Date().toISOString()
      };

      console.log('DEBUG_TRACE: Upsert payload for workers:', JSON.stringify(workerObj, null, 2));

      const { data: finalWorker, error: syncError } = await supabaseAdmin
        .from('workers')
        .upsert([{
          ...workerObj,
          created_at: isUpdateFlow ? undefined : new Date().toISOString() 
        }], { 
          onConflict: 'auth_id'
        })
        .select()
        .single();

      if (syncError) {
        console.error('DEBUG_TRACE: Sync Error Object:', JSON.stringify(syncError, null, 2));
        console.error('DEBUG_TRACE: Sync Error Details:', {
          code: syncError.code,
          details: syncError.details,
          hint: syncError.hint,
          message: syncError.message
        });

        // Step 3: Failure Handling (Eventual Consistency)
        console.error('SYNC_ERROR: Auth updated but database upsert failed:', syncError.message);
        
        // Mark as pending_sync for operational visibility
        await supabaseAdmin.from('workers')
          .update({ status: 'pending_sync' })
          .eq('auth_id', authId);

        // Return SUCCESS for the Auth operation as per requirements
        return res.status(200).json({ 
          success: true, 
          message: 'Auth synchronized, but database mapping failed (marked as pending_sync)', 
          auth_id: authId 
        });
      }

      return res.status(200).json({ success: true, data: finalWorker });
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

    if (!isSuperAdmin && targetData.company_id !== requesterData.company_id) {
      return res.status(403).json({ error: 'Unauthorized' });
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
      const { targetUserId } = updates;
      if (!targetUserId) return res.status(400).json({ error: 'Missing targetUserId' });

      // Resolve the user and their email
      const { data: targetData, error: targetDbError } = await supabaseAdmin
        .from('workers')
        .select('company_id, auth_id, email')
        .eq('id', targetUserId)
        .single();

      if (targetDbError || !targetData || !targetData.auth_id) {
        return res.status(404).json({ error: 'User not found in registry or missing auth_id' });
      }

      // Security check: same company or superadmin
      if (!isSuperAdmin && targetData.company_id !== requesterData.company_id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Generate the recovery link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: targetData.email,
        options: {
          redirectTo: `${req.headers.origin || ''}/auth/v1/callback`
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

      return res.status(200).json({ success: true, recovery_link: linkData.properties.action_link });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err: any) {
    console.error('Admin Auth Service Error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
