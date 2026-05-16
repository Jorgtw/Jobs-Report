const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
  const env = fs.readFileSync('.env', 'utf8');
  env.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  const { data, error } = await supabase.from('companies').select('*').limit(1);
  if (error) {
    console.error('Error fetching company:', error);
  } else {
    console.log('Columns in companies:', Object.keys(data[0] || {}));
  }
}

checkColumns();
