import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
const sbAnon = createClient(SUPABASE_URL, ANON_KEY);

async function testJTW() {
  console.log("--- JTW LOGIN TEST ---");
  
  // 1. Get JTW record
  const { data: jtwArr } = await sbAdmin.from('workers').select('*').eq('username', 'JTW');
  if (!jtwArr || jtwArr.length === 0) {
      console.error("User 'JTW' not found in workers table!");
      return;
  }
  const jtw = jtwArr[0];
  console.log("JTW Record Found:", { id: jtw.id, auth_id: jtw.auth_id, email: jtw.email, password: jtw.password });

  // 2. Auth Login
  console.log(`\nAttempting login with ${jtw.email} / ${jtw.password}...`);
  const { data: authData, error: authErr } = await sbAnon.auth.signInWithPassword({
      email: jtw.email,
      password: jtw.password
  });

  if (authErr) {
      console.error("Auth Login FAILED:", authErr.message);
      return;
  }
  console.log("Auth Login SUCCESS! UID:", authData.user.id);

  // 3. RPC is_super_admin
  const sbUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
  });
  const { data: isSA, error: saErr } = await sbUser.rpc('is_super_admin');
  console.log("\nis_super_admin() RPC result:", isSA, "Error:", saErr?.message);

  // 4. Check user_roles table via RLS
  const { data: roles } = await sbUser.from('user_roles').select('*');
  console.log("\nVisible roles for JTW session:", JSON.stringify(roles, null, 2));

  // 5. Check workers via RLS
  const { data: workers } = await sbUser.from('workers').select('username, company_id');
  console.log("\nVisible workers for JTW session:", workers?.length);
}

testJTW();
