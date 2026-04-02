import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runFix() {
  console.log("🛠️ Inizio salvataggio cloni e account isolati...");

  const { data: workers, error: fetchError } = await supabaseAdmin
    .from('workers')
    .select('id, username, email, password, name')
    .is('auth_id', null);

  if (fetchError || !workers || workers.length === 0) {
    console.log("✅ Nessun utente bloccato trovato. Tutti hanno l'auth_id!");
    process.exit(0);
  }

  for (const worker of workers) {
    try {
      // Forza l'unicità dell'email per scavalcare il blocco cloni
      const cleanUser = worker.username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueEmail = `${cleanUser}_${Date.now()}@jobsreport.local`;
      const safePassword = worker.password?.trim() || 'Password123!';

      console.log(`🚑 Salvo: ${worker.username} assegnando email fittizia: ${uniqueEmail}`);

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: uniqueEmail,
        password: safePassword,
        email_confirm: true,
        user_metadata: { username: worker.username, full_name: worker.name }
      });

      if (authError) throw authError;

      const { error: updateError } = await supabaseAdmin
        .from('workers')
        .update({ 
          auth_id: authData.user.id, 
          email: uniqueEmail,
          password: safePassword 
        })
        .eq('id', worker.id);

      if (updateError) throw updateError;
      console.log(`✅ [RISOLTO] ${worker.username} è online e pronto al login!`);
    } catch (err) {
      console.error(`❌ Errore inaspettato per ${worker.username}:`, err.message);
    }
  }
}

runFix();
