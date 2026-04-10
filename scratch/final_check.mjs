import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: companies } = await supabase.from('companies').select('id, name').ilike('name', '%MK%');
  console.log('Companies:', companies);

  const { data: thomas } = await supabase.from('workers').select('id, name, company_id').ilike('name', '%Thomas%').limit(1);
  console.log('Thomas:', thomas);

  const { data: comms } = await supabase.from('internal_communications').select('id, company_id, sender_id, target_type, target_id, status').limit(5);
  console.log('Recent Comms:', comms);
}

check();
