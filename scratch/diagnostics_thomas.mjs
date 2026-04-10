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

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function diagnostic() {
  console.log('--- DIAGNOSTICA DATI COMUNICAZIONI ---');

  // 1. Trova Thomas
  const { data: thomasWorkers, error: wError } = await supabase
    .from('workers')
    .select('id, name, company_id')
    .ilike('name', '%Thomas%');

  if (wError) {
    console.error('Errore fetch workers:', wError);
    return;
  }

  if (!thomasWorkers || thomasWorkers.length === 0) {
    console.log('Nessun lavoratore trovato con il nome "Thomas".');
  } else {
    for (const thomas of thomasWorkers) {
      console.log(`\nLavoratore: ${thomas.name} (ID: ${thomas.id}) - Azienda: ${thomas.company_id}`);
      
      // 2. Comunicazioni Inviate da Thomas
      const { data: comms, error: cError } = await supabase
        .from('internal_communications')
        .select('id, content, sender_id, status, target_type, target_id, parent_id')
        .eq('sender_id', thomas.id)
        .is('parent_id', null);

      if (cError) {
        console.error('Errore fetch communications:', cError);
        continue;
      }

      console.log(`Record root inviati trovati: ${comms.length}`);
      comms.forEach(c => {
        console.log(`- ID: ${c.id.substring(0,8)}... | Status: "${c.status}" (Length: ${c.status?.length}) | Target: ${c.target_type} (${c.target_id || 'all'})`);
      });
    }
  }

  console.log('\n--- VERIFICA TABELLA READ RECEIPTS ---');
  const { data: receipts } = await supabase.from('communication_read_receipts').select('user_id').limit(5);
  console.log('Esempi di user_id nelle ricevute di lettura:', receipts?.map(r => r.user_id));
}

diagnostic();
