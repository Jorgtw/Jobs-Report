import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Initiating password migration...');
  
  // 1. Fetch all workers that have a plain text password_hash
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, username, password_hash, password')
    .not('password_hash', 'is', null);
    
  if (error) {
    console.error('Error fetching workers:', error);
    process.exit(1);
  }
  
  console.log(`Found ${workers.length} workers to migrate.`);
  
  // 2. Iterate and update
  for (const worker of workers) {
    const plainTextPassword = worker.password_hash || worker.password;
    if (!plainTextPassword) continue;
    
    // We update the Supabase Auth User with the plain text password so it re-hashes it securely native
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      worker.id,
      { password: plainTextPassword }
    );
    
    if (updateError) {
      console.warn(`Could not update password for user ${worker.username} (${worker.id}):`, updateError.message);
      continue;
    }
    
    // 3. Clear the plain text passwords in the DB
    const { error: dbError } = await supabase
      .from('workers')
      .update({ password: null, password_hash: null })
      .eq('id', worker.id);
      
    if (dbError) {
      console.error(`Failed to wipe DB plain text for ${worker.username}:`, dbError.message);
    } else {
      console.log(`Migrated user: ${worker.username}`);
    }
  }
  
  console.log('Migration complete.');
}

run();
