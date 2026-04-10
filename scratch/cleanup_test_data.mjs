import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
  console.log('Cleaning up test communications...');
  
  // Elimina messaggi che contengono "TEST 1", "TEST 2" o "TEST 3"
  const { data, error } = await supabase
    .from('internal_communications')
    .delete()
    .or('content.ilike.TEST 1%,content.ilike.TEST 2%,content.ilike.TEST 3%');

  if (error) {
    console.error('Error during cleanup:', error);
  } else {
    console.log('Cleanup successful.');
  }
}

cleanup();
