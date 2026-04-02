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

async function check() {
  console.log("--- AUDIT JTW CREDENTIALS ---");
  const { data: workers } = await sbAdmin.from('workers').select('id, username, password, email, auth_id').eq('username', 'JTW');
  
  if (!workers || workers.length === 0) {
    console.log("Worker JTW not found.");
    return;
  }
  
  const w = workers[0];
  console.log(`Worker ID: ${w.id}`);
  console.log(`Username: ${w.username}`);
  console.log(`Password in DB: ${w.password}`);
  console.log(`Email in DB: ${w.email}`);
  console.log(`Auth ID in DB: ${w.auth_id}`);

  // Test RPC
  const { data: rpcEmail } = await sbAdmin.rpc('get_email_by_username', { p_username: 'JTW' });
  console.log(`RPC get_email_by_username result: ${rpcEmail}`);

  // Check if Auth user exists and has this email
  if (w.auth_id) {
    const { data: authUser, error: authError } = await sbAdmin.auth.admin.getUserById(w.auth_id);
    if (authError) {
      console.log(`Auth User check error: ${authError.message}`);
    } else {
      console.log(`Auth User Email: ${authUser.user.email}`);
      // Check if email matches
      if (rpcEmail !== authUser.user.email) {
          console.log("ALERTA: L'email restituita dalla RPC non coincide con l'email dell'identità Auth!");
      }
    }
  }

  // Final test: try to LOGIN via Auth with DB credentials
  console.log("\n--- TEST LOGIN SIMULATION ---");
  const { data: loginData, error: loginError } = await sbAdmin.auth.signInWithPassword({
    email: rpcEmail,
    password: w.password
  });

  if (loginError) {
    console.log(`Login FAILED: ${loginError.message}`);
  } else {
    console.log(`Login SUCCESS! User UID: ${loginData.user.id}`);
  }
}
check();
