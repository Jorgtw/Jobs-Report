import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Robust ENV loading
function getEnv() {
  const env = {};
  [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '.env.production')].forEach(p => {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          env[match[1]] = value.trim();
        }
      });
    }
  });
  return env;
}

const env = getEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    console.error("Missing required keys:", { SUPABASE_URL: !!SUPABASE_URL, SERVICE_KEY: !!SERVICE_KEY, ANON_KEY: !!ANON_KEY });
    process.exit(1);
}

const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
const sbAnon = createClient(SUPABASE_URL, ANON_KEY);

async function auditSuperAdmin() {
  console.log("--- SUPERADMIN AUDIT ---");

  // 1. Check user_roles table
  console.log("\n1. Checking 'user_roles' table content:");
  const { data: roles, error: rolesErr } = await sbAdmin
    .from('user_roles')
    .select('*, workers(username, auth_id, id, email, status)');
  
  if (rolesErr) {
    console.error("Error reading user_roles:", rolesErr.message);
  } else {
    console.log(JSON.stringify(roles, null, 2));
  }

  // 2. Check workers named 'Admin.demo' specifically
  console.log("\n2. Checking 'Admin.demo' in workers:");
  const { data: admins, error: adminErr } = await sbAdmin
    .from('workers')
    .select('*')
    .ilike('username', 'Admin.demo');

  if (adminErr) {
    console.error("Error reading Admin.demo:", adminErr.message);
  } else {
    console.log(JSON.stringify(admins, null, 2));
  }

  // 4. Attempt login with Admin.demo credentials
  if (admins && admins.length > 0) {
    const admin = admins[0];
    console.log(`\n4. Attempting Auth login for ${admin.username} (${admin.email}) / ${admin.password}...`);
    const { data: authData, error: authErr } = await sbAnon.auth.signInWithPassword({
        email: admin.email,
        password: admin.password
    });

    if (authErr) {
        console.error("Auth Login Failed:", authErr.message);
    } else {
        console.log("Auth Login SUCCESS! User UID:", authData.user.id);
        
        // 5. Check if is_super_admin() function returns true for this user
        console.log("\n5. Testing is_super_admin() RPC for this session...");
        const sbUser = createClient(SUPABASE_URL, ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
        });
        const { data: isSA, error: saErr } = await sbUser.rpc('is_super_admin');
        console.log("is_super_admin() returns:", isSA, "Error:", saErr?.message);

        // 6. Check RLS on workers for this session
        const { data: workersRLS, error: rlsErr } = await sbUser.from('workers').select('username');
        console.log("RLS Workers visible in this session:", workersRLS?.length, "Error:", rlsErr?.message);
    }
  } else {
      console.log("\nNo 'Admin.demo' worker found.");
  }
}

auditSuperAdmin();
