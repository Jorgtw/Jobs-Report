// ============================================================================
// SCRIPT: MIGRAZIONE UTENTI "WORKERS" SU SUPABASE AUTH
//
// Prima di eseguire, assicurati di:
// 1. Aver applicato lo script SQL `supabase_migration_auth_rls.sql`
// 2. Aver popolato i valori in .env locale
// 
// Eseguire con: node scripts/migrate_users.js
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env variables manually to avoid dotenv dependency
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
} else {
  console.log("⚠️ File .env non trovato, usando variabili di ambiente globali");
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// IMPORTANTE: Serve la SERVICE_ROLE_KEY per operare su auth.admin
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ ERRORE CRITICO: Variabili SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY non trovate.");
  console.error("Assicurati di averle nel tuo file .env e che tu stia usando la SERVICE KEY (che inizia con eyJh...) non l'ANON KEY.");
  process.exit(1);
}

// Creiamo un client speciale "amministratore" che bypassa le RLS
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration() {
  console.log("🚀 Inizio migrazione utenti verso Supabase Auth...\n");

  // 1. Scarica tutti i workers che non hanno ancora auth_id
  const { data: workers, error: fetchError } = await supabaseAdmin
    .from('workers')
    .select('id, username, email, password, name')
    .is('auth_id', null);

  if (fetchError) {
    console.error("❌ Errore nel recuperare i workers dal DB:", fetchError.message);
    process.exit(1);
  }

  if (!workers || workers.length === 0) {
    console.log("✅ Nessun utente da migrare. Tutti i workers hanno già un auth_id collegato.");
    process.exit(0);
  }

  console.log(`Trovati ${workers.length} utenti da migrare.\n`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const worker of workers) {
    try {
      console.log(`⏳ Migrando l'utente: ${worker.name || worker.username} (${worker.email})...`);

      // Se non ha email, generiamo un fallback
      const userEmail = worker.email?.trim() || `${worker.username.toLowerCase().replace(/[^a-z0-9]/g, '')}@jobsreport.local`;

      const fallbackPassword = 'Password123!';
      const userPassword = worker.password?.trim() || fallbackPassword;

      // 2. Crea l'utente nell'ecosistema Auth di Supabase
      let newAuthId = null;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true, // Bypass della conferma email
        user_metadata: {
          username: worker.username,
          full_name: worker.name
        }
      });

      if (authError) {
        if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
            console.log(`⚠️ L'email ${userEmail} è già registrata in Auth. Cerco l'ID esistente...`);
            
            // Cerchiamo l'utente che esiste già
            const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            if (listError) throw new Error("Impossibile leggere l'elenco utenti Auth per il mapping.");
            
            const existingUser = listData.users.find(u => u.email === userEmail);
            if (!existingUser) {
                throw new Error("L'utente esiste in Auth ma non sono riuscito a trovarlo nell'elenco.");
            }
            newAuthId = existingUser.id;
            console.log(`✅ Trovato ID esistente per ${userEmail}: ${newAuthId}`);
        } else {
            throw authError; // Altri errori
        }
      } else {
         newAuthId = authData.user.id;
      }

      if (!newAuthId) {
          throw new Error("Impossibile determinare il nuovo auth_id");
      }

      // 3. Collega il nuovo auth_id e aggiorna l'email/password se erano fallback nel DB
      const dbUpdates = { auth_id: newAuthId, email: userEmail };
      if (!worker.password?.trim()) {
          dbUpdates.password = fallbackPassword;
      }

      const { error: updateError } = await supabaseAdmin
        .from('workers')
        .update(dbUpdates)
        .eq('id', worker.id);

      if (updateError) {
        console.error(`❌ Errore durante l'aggiornamento del DB per ${worker.username}:`, updateError.message);
        throw updateError;
      }

      console.log(`✅ [OK] ${worker.username} migrato con auth_id: ${newAuthId}`);
      successCount++;
      
    } catch (err) {
      console.error(`❌ [FALLITO] ${worker.username}:`, err.message);
      errorCount++;
    }
  }

  console.log("\n==================================");
  console.log(`📊 RISULTATI DEL PROCESSO`);
  console.log(`   Utenti Migrati: ${successCount}`);
  console.log(`   Errori: ${errorCount}`);
  console.log("==================================\n");
}

runMigration().catch(console.error);
