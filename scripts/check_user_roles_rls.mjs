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
const sbAdmin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const sbAnon = createClient(env.VITE_SUPABASE_ANON_KEY ? env.VITE_SUPABASE_URL : '', env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log("--- AUDIT user_roles RLS ---");
  
  // 1. Check if RLS is enabled and see policies via RPC
  const { data: policies, error: polErr } = await sbAdmin.rpc('run_sql', { 
    query: "SELECT tablename, policyname, cmd, qualify FROM pg_policies WHERE tablename = 'user_roles';" 
  });
  
  if (polErr) {
    console.log("Could not check policies via RPC (maybe run_sql not available).");
  } else {
    console.log("Policies for user_roles:", JSON.stringify(policies, null, 2));
  }

  // 2. Test if a logged-in user can see their own role
  // Let's find JTW first
  const { data: workers } = await sbAdmin.from('workers').select('username, email, password').eq('username', 'JTW');
  if (workers && workers.length > 0) {
    const jtw = workers[0];
    const { data: authData, error: authErr } = await sbAnon.auth.signInWithPassword({
        email: jtw.email,
        password: jtw.password
    });

    if (!authErr) {
        console.log("Login success for JTW session test.");
        const sbUser = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
        });
        
        const { data: roleData, error: roleErr } = await sbUser.from('user_roles').select('*');
        if (roleErr) {
            console.log(`RLS ERROR: Sessione JTW non può leggere user_roles! Errore: ${roleErr.message}`);
        } else {
            console.log(`RLS SUCCESS: Sessione JTW vede ${roleData.length} righe in user_roles.`);
        }
    }
  }
}
check();
