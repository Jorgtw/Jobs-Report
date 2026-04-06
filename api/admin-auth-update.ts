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
      const { name, username, password, email, role, status } = updates;
      
      // A. Create in Supabase Auth
      const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, company_id: requesterData.company_id }
      });

      if (authCreateError) {
        return res.status(500).json({ error: 'Failed to create user in Auth', detailed: authCreateError });
      }

      const authId = authData.user.id;

      // B. Create in workers table
      const { data: workerData, error: workerCreateError } = await supabaseAdmin.from('workers').insert([{
        name,
        username,
        email,
        password: password, // For UI fallback
        password_hash: password, // Consistency with project pattern
        role: role || 'operator',
        status: status || 'active',
        company_id: requesterData.company_id,
        auth_id: authId,
        created_at: new Date().toISOString()
      }]).select().single();

      if (workerCreateError) {
        // Rollback Auth creation? Maybe too complex for now, but good practice.
        return res.status(500).json({ error: 'Auth user created, but database creation failed', detailed: workerCreateError });
      }

      return res.status(200).json({ success: true, data: workerData });
    }

    // --- UPDATE EXISTING USER ---
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
        return res.status(500).json({ error: 'Failed to update user in Auth', detailed: authUpdateError });
      }
    }

    // Update workers table
    const dbUpdates: any = { ...updates };
    if (updates.password) {
      dbUpdates.password = updates.password;
      dbUpdates.password_hash = updates.password;
    }

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

  } catch (err: any) {
    console.error('Admin Auth Service Error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
