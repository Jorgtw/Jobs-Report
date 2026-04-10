import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manual env parsing
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function createTestData() {
  // 1. Trova Thomas
  const { data: thomasWorkers } = await supabase
    .from('workers')
    .select('id, company_id')
    .ilike('name', '%Thomas%')
    .limit(1);

  if (!thomasWorkers || thomasWorkers.length === 0) return;
  const thomas = thomasWorkers[0];

  // 2. Trova un altro utente nella stessa azienda
  const { data: others } = await supabase
    .from('workers')
    .select('id')
    .eq('company_id', thomas.company_id)
    .neq('id', thomas.id)
    .limit(1);

  const senderId = others && others.length > 0 ? others[0].id : thomas.id;

  const tests = [
    {
      company_id: thomas.company_id,
      sender_id: thomas.id,
      content: "TEST 1: Messaggio inviato da Thomas (Sezione INVIATE)",
      type: 'note',
      target_type: 'all',
      status: 'open'
    },
    {
      company_id: thomas.company_id,
      sender_id: senderId,
      content: "TEST 2: Messaggio diretto a Thomas (Sezione DA FARE)",
      type: 'issue',
      target_type: 'user',
      target_id: thomas.id,
      status: 'open'
    },
    {
      company_id: thomas.company_id,
      sender_id: senderId,
      content: "TEST 3: Messaggio broadcast al team (Sezione DA FARE)",
      type: 'note',
      target_type: 'all',
      status: 'open'
    }
  ];

  const { error } = await supabase.from('internal_communications').insert(tests);
  if (error) console.error('Errore:', error);
  else console.log('Dati di test creati correttamente.');
}

createTestData();
