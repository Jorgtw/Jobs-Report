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
  const companyId = '7496f904-2336-455a-829f-76834ec06262'; // MK EL-TEKNIK APS
  const jtwId = 'cda5a962-9d98-4b83-831b-412d06d904dd';
  const thomasId = '3cd40077-a06d-4045-af0c-091a44f637ee';
  const doganId = '731a8d2f-fb2a-4c0b-a983-5c1d04c6682b';
  const marioId = 'be18180a-d188-495d-861a-f19f9df771ed';

  // 1. Delete existing comms for this company
  await sb.from('internal_communications').delete().eq('company_id', companyId);

  // 2. Insert realistic comms
  const comms = [
    {
      company_id: companyId,
      sender_id: marioId,
      content: 'Mancano circa 20 metri di canaline 40x20 per completare il passaggio cavi ufficio A. Per favore fatemi sapere quando arrivano.',
      type: 'issue',
      target_type: 'user',
      target_id: jtwId,
      status: 'open',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    },
    {
      company_id: companyId,
      sender_id: thomasId,
      content: 'Ho caricato i nuovi schemi aggiornati per il quadro generale (Unifilare V2). Verificate le ultime modifiche prima di procedere al cablaggio.',
      type: 'note',
      target_type: 'all',
      status: 'acknowledged',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
    },
    {
      company_id: companyId,
      sender_id: doganId,
      content: 'Cablaggio rack B1 terminato. Abbiamo testato la continuità di tutte le dorsali. Potete procedere al collaudo finale.',
      type: 'confirmation',
      target_type: 'user',
      target_id: thomasId,
      status: 'closed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      company_id: companyId,
      sender_id: jtwId,
      content: 'Abbiamo trovato un\'interferenza tra il condotto aria e il passaggio cavi principale nel corridoio est. Serve un sopralluogo urgente.',
      type: 'issue',
      target_type: 'user',
      target_id: thomasId,
      status: 'in_progress',
      assigned_to: thomasId,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
    }
  ];

  const { error } = await sb.from('internal_communications').insert(comms);
  if (error) console.error(error);
  else console.log('Successfully inserted realistic data.');
}

run();
