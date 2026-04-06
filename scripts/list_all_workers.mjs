import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listWorkers() {
  const { data: workers, error } = await sb.from('workers').select('id, name, username, email, auth_id, role, company_id');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('--- ALL WORKERS ---');
  workers.forEach(w => {
    console.log(`[${w.id}] ${w.name} (${w.username}) - Email: ${w.email} - AuthID: ${w.auth_id}`);
  });
}
listWorkers();
