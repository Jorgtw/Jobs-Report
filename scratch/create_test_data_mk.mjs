import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function create() {
  const companyId = '7496f904-2336-455a-829f-76834ec06262'; // MK EL-TEKNIK APS
  const thomasId = '3cd40077-a06d-4045-af0c-091a44f637ee';  // Thomas
  
  const { data: others } = await supabase.from('workers')
    .select('id, name')
    .eq('company_id', companyId)
    .neq('id', thomasId)
    .limit(2);

  if (!others || others.length === 0) {
    console.error('Nessun altro lavoratore trovato per la compagnia MK.');
    return;
  }

  const senderId = others[0].id;

  const testData = [
    {
      company_id: companyId,
      sender_id: thomasId,
      content: 'TEST 1 (Inviata): Messaggio inviato da Thomas a tutti.',
      type: 'note',
      target_type: 'all',
      status: 'open',
      last_activity_at: new Date().toISOString()
    },
    {
      company_id: companyId,
      sender_id: senderId,
      content: 'TEST 2 (Da fare): Richiesta di conferma per Thomas.',
      type: 'confirmation',
      target_type: 'user',
      target_id: thomasId,
      status: 'open',
      last_activity_at: new Date().toISOString()
    },
    {
      company_id: companyId,
      sender_id: senderId,
      content: 'TEST 3 (Da fare): Messaggio urgente a tutto il team.',
      type: 'issue',
      target_type: 'all',
      status: 'open',
      last_activity_at: new Date().toISOString()
    }
  ];

  console.log('Inserting test data for Thomas (MK EL-TEKNIK APS)...');
  const { data, error } = await supabase.from('internal_communications').insert(testData).select();
  
  if (error) {
    console.error('Error inserting test data:', error);
  } else {
    console.log('Success! Inserted IDs:', data.map(d => d.id));
  }
}

create();
