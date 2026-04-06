import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  console.log('Resetting password for Thomas...');
  const { data, error } = await supabase.auth.admin.updateUserById(
    '8f7754f9-94b7-4316-b6d7-3489c7280fdc',
    { password: 'T123' }
  );

  if (error) {
    console.error('Error resetting password:', error);
  } else {
    console.log('Password reset successful for user:', data.user.email);
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}

resetPassword();
