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

async function check() {
  const { data, error } = await sb.from('user_roles').select('*, workers(id, username, auth_id, email, status)');
  console.log("=== SUPERADMINS ===");
  console.log(JSON.stringify(data, null, 2));

  // Let's also check all workers named 'Admin.demo'
  const { data: adminDemos } = await sb.from('workers').select('id, username, auth_id, status').ilike('username', '%admin.demo%');
  console.log("\n=== ALL ADMIN.DEMO ACCOUNTS ===");
  console.log(JSON.stringify(adminDemos, null, 2));
}

check();
