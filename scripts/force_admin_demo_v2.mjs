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

async function run() {
  const email = 'Jorgtw@gmail.com';
  const newPass = 'AdminDemo123!';
  
  // Try to find user directly if listUsers failed to show it
  const { data: { users } } = await sb.auth.admin.listUsers();
  let user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    // List might be paginated, try searching in DB to find auth_id if it exists
    const { data: worker } = await sb.from('workers').select('auth_id').ilike('username', 'Admin.demo').single();
    if (worker?.auth_id) {
        user = { id: worker.auth_id };
    }
  }

  if (user) {
    const { error } = await sb.auth.admin.updateUserById(user.id, { password: newPass });
    if (error) console.error('Error updating password:', error);
    else console.log('Successfully updated Admin.demo password to:', newPass);
  } else {
    console.warn('User still not found. Please check manually.');
  }
}

run();
