import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env variables manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Usiamo la chiave anon per simulare il client vero
const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testLogin(username) {
  console.log(`\n🔍 TESTING LOGIN FOR USERNAME: ${username}`);
  
  // 1. Leggiamo il database by-passando RLS con Service Role
  console.log("-> 1. Cerco l'utente nel DB...");
  const { data: dbUser, error: dbErr } = await sbAdmin
    .from('workers')
    .select('id, username, email, password, auth_id, status')
    .ilike('username', username)
    .single();

  if (dbErr || !dbUser) {
    console.error("❌ ERRORE DB: Utente non trovato in workers:", dbErr?.message);
    return;
  }
  
  console.log("✅ UTENTE TROVATO NEL DB:");
  console.log(`   - Username: ${dbUser.username}`);
  console.log(`   - Email salvata: ${dbUser.email}`);
  console.log(`   - Auth ID presente?: ${!!dbUser.auth_id} (${dbUser.auth_id})`);
  console.log(`   - Password salvata: ${dbUser.password}`);
  console.log(`   - Status: ${dbUser.status}`);

  if (!dbUser.auth_id) {
     console.error("❌ Manca auth_id. Questo utente non è mai stato migrato correttamente.");
     return;
  }

  // 2. Simuliamo il flusso dell'app (get_email_by_username RPC)
  console.log("\n-> 2. Simulo la query RPC (get_email_by_username)...");
  const { data: rpcEmail, error: rpcErr } = await sbAdmin.rpc('get_email_by_username', { p_username: dbUser.username });
  
  if (rpcErr || !rpcEmail) {
    console.error(`❌ ERRORE RPC: Non ha restituito l'email (Restituito: ${rpcEmail}). Errore:`, rpcErr?.message);
  } else {
    console.log(`✅ RPC ha restituito l'email: ${rpcEmail}`);
  }

  // 3. Eseguiamo il login testuale via Supabase Auth
  console.log(`\n-> 3. Provo Supabase Auth (signInWithPassword) con Email [${dbUser.email}] e Password [${dbUser.password}]...`);
  const { data: authData, error: authErr } = await sbAdmin.auth.signInWithPassword({
    email: dbUser.email,
    password: dbUser.password
  });

  if (authErr) {
    console.error(`❌ ERRORE SUPABASE AUTH: ${authErr.message}`);
    console.error(`Status code: ${authErr.status}`);
    console.log("Probabilmente la password è troppo corta per i requisiti standard di Supabase (min 6 caratteri).");
  } else {
    console.log(`✅ LOGIN COMPLETATO. Access token generato con successo! auth.uid: ${authData.user.id}`);
  }
}

testLogin('Thomas');
