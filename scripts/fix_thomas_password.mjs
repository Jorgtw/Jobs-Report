import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const THOMAS_AUTH_ID = '8f7754f9-94b7-4316-b6d7-3489c7280fdc';
const NEW_PASSWORD = 'Thomas123'; // T123 is too weak for Supabase Auth default settings

async function fixThomasLogin() {
  console.log(`Setting new password "${NEW_PASSWORD}" for Thomas...`);

  // 1. Update Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
    THOMAS_AUTH_ID,
    { password: NEW_PASSWORD }
  );

  if (authError) {
    if (authError.code === 'weak_password') {
      console.error('Password is too weak. Supabase Auth requires a stronger password.');
    } else {
      console.error('Error updating Supabase Auth:', authError);
    }
    return;
  }
  console.log('Supabase Auth updated successfully.');

  // 2. Update workers table in database to match
  const { error: dbError } = await supabase
    .from('workers')
    .update({ 
      password: NEW_PASSWORD,
      password_hash: NEW_PASSWORD // Some parts of the app might use this field
    })
    .eq('auth_id', THOMAS_AUTH_ID);

  if (dbError) {
    console.error('Error updating workers table:', dbError);
  } else {
    console.log('Database workers table updated successfully.');
    console.log('Thomas can now login with password:', NEW_PASSWORD);
  }
}

fixThomasLogin();
