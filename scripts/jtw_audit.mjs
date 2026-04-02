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
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("--- JTW WORKER DETAILS ---");
  const { data: workers } = await sb.from('workers').select('*').eq('username', 'JTW');
  if (!workers || workers.length === 0) {
      console.log("Worker JTW not found.");
      return;
  }
  const w = workers[0];
  console.log(`Username: ${w.username}`);
  console.log(`Role: ${w.role}`);
  console.log(`Company ID: ${w.company_id}`);
  console.log(`Auth ID: ${w.auth_id}`);

  console.log("\n--- JTW USER ROLES ---");
  const { data: roles } = await sb.from('user_roles').select('*').eq('user_id', w.id);
  console.log(JSON.stringify(roles, null, 2));
}
check();
