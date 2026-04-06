import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

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
