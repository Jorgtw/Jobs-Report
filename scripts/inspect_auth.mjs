import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

async function inspectAuth() {
  console.log('--- INSPECTING AUTH SYSTEM ---');
  
  // 1. List all users in Supabase Auth (caution: limited to 50 by default but enough for us)
  const { data: { users }, error: listError } = await sb.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing auth users:', listError);
    return;
  }

  console.log(`Found ${users.length} users in Auth system.`);
  
  // 2. Look for "Thomas" or similar
  const thomasUsers = users.filter(u => 
    u.email?.toLowerCase().includes('thomas') || 
    u.user_metadata?.name?.toLowerCase().includes('thomas')
  );

  if (thomasUsers.length > 0) {
    console.log('\n--- TARGET USERS FOUND IN AUTH ---');
    thomasUsers.forEach(u => {
      console.log(`ID: ${u.id}`);
      console.log(`Email: ${u.email}`);
      console.log(`Email Confirmed: ${!!u.email_confirmed_at}`);
      console.log(`Metadata: ${JSON.stringify(u.user_metadata)}`);
      console.log('---------------------------');
    });
  } else {
    console.log('\nNo users found matching "Thomas" in Auth.');
  }

  // 3. Check for the specific Auth ID if you have it from previous logs or DB
  // For example, from your workers list: [9ca93af0...] Dogan DG
  // I will just list the first 5 users to see the structure
  console.log('\n--- FIRST 5 USERS ---');
  users.slice(0, 5).forEach(u => console.log(`${u.id} - ${u.email}`));
}

inspectAuth();
