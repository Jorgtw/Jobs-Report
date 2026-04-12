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
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // Login come JTW
  const { data: workers } = await sbAdmin.from('workers').select('*').eq('username', 'JTW');
  const jtw = workers[0];
  const { data: rpcEmail } = await sbAdmin.rpc('get_email_by_username', { p_username: 'JTW' });

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: rpcEmail,
    password: jtw.password
  });

  if (loginError) {
    console.error("Login fallito:", loginError);
    return;
  }

  console.log("Login OK, inserisco comunicazione...");

  const payload = {
    company_id: jtw.company_id,
    sender_id: jtw.id,
    content: "Test JTW Insert",
    type: "note",
    target_type: "user",
    target_id: jtw.id,
    status: "open"
  };

  const { data: response, error } = await supabase.from('internal_communications').insert([payload]);
  
  if (error) {
    console.error("Errore di inserimento:", error);
  } else {
    console.log("Inserimento riuscito:", response);
  }
}
run();
