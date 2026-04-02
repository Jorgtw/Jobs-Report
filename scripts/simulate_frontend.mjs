import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Simulazione rigorosa di Vite Env loading
const envPath = path.resolve(process.cwd(), '.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = match[2].replace(/^"|"$/g, '');
});

// Importiamo le chiavi usate dall'app (ANON e URL)
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function simulateFrontendLogin(username, password) {
  console.log("=== SIMULAZIONE RIGOROSA FRONTEND LOGIN ===");
  console.log(`Input Utente -> Username: "${username}", Password: "${password}"`);

  // --- STEP 1: RPC come da dbService.ts ---
  console.log("\n[STEP 1] Esecuzione supabase.rpc('get_email_by_username')...");
  const { data: userEmail, error: emailError } = await supabase.rpc('get_email_by_username', { p_username: username });
  
  if (emailError) {
    console.error("❌ ERRORE STEP 1 (Raw Error da Supabase RPC):", emailError);
    return;
  }
  if (!userEmail) {
    console.log("❌ ERRORE STEP 1: Nessuna email restituita. L'utente non esiste o è inattivo o la RPC non lo trova per case-sensitivity.");
    return;
  }
  console.log(`✅ STEP 1 OK. Email associata via RPC: ${userEmail}`);

  // --- STEP 2: Auth come da dbService.ts ---
  console.log(`\n[STEP 2] Esecuzione supabase.auth.signInWithPassword({ email: '${userEmail}', password: '${password}' })...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: password
  });

  if (authError) {
    console.error("❌ ERRORE STEP 2 (Raw Error da Supabase Auth):", authError);
    return;
  }
  if (!authData.session) {
    console.error("❌ ERRORE STEP 2: Nessun errore restituito, ma authData.session è NULL.");
    return;
  }
  console.log(`✅ STEP 2 OK. JWT Access Token rilasciato. auth.uid = ${authData.user.id}`);

  // --- STEP 3: Check RLS e Caricamento dati Utente ---
  console.log("\n[STEP 3] Esecuzione query RLS sulla tabella 'workers' in quanto utente appena loggato...");
  const { data: workerData, error: workerErr } = await supabase
    .from('workers')
    .select('*')
    .ilike('username', username.trim())
    .eq('status', 'active')
    .single();

  if (workerErr) {
    console.error("❌ ERRORE STEP 3 (Raw Error Postgres/RLS):", workerErr);
    return;
  }
  if (!workerData) {
    console.error("❌ ERRORE STEP 3: L'utente si è loggato in Auth, ma la tabella workers ha bloccato la vista (Data is null)");
    return;
  }

  console.log("✅ STEP 3 OK. RLS superato! Dati worker completi restituiti:");
  console.log(workerData);
  console.log("\n=== TEST SUPERATO. IL VERO ERRORE È ALTROVE ===");
}

simulateFrontendLogin("Thomas", "T123");
