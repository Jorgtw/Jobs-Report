import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const sb = createClient(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gqetgbqlxljhhcaggoke.supabase.co', env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAdmin() {
  const { data: roles } = await sb.from('user_roles').select('*').eq('role', 'superadmin');
  console.log("SUPERADMIN ID (from user_roles):", roles[0]?.user_id);

  if (roles && roles[0]) {
    const { data: realSA } = await sb.from('workers').select('id, username, email').eq('id', roles[0].user_id).single();
    console.log("REAL SUPERADMIN WORKER:", realSA);
  }

  const { data: workers } = await sb.from('workers').select('id, username, email, role, status').ilike('username', 'Admin.demo');
  console.log("\nALL ADMIN.DEMO WORKERS:");
  workers.forEach(w => console.log(w));
}
checkAdmin();
