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

async function checkCompanyStatus() {
  const companyId = '4c643fb5-4f6a-4c58-a367-46abf6887368';
  const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).maybeSingle();
  if (error) {
    console.error('Error fetching company:', error);
  } else {
    console.log('Company Record:', data);
  }
}

checkCompanyStatus();
