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

async function run() {
  const { data: workers } = await sbAdmin.from('workers').select('id, name, username');
  console.log('WORKERS:', workers);
}
run();
