import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
let VITE_SUPABASE_URL = '';
let VITE_SUPABASE_ANON_KEY = '';
envFile.split('\n').forEach(line => {
    if (line.trim().startsWith('VITE_SUPABASE_URL=')) VITE_SUPABASE_URL = line.split('=')[1].trim();
    if (line.trim().startsWith('VITE_SUPABASE_ANON_KEY=')) VITE_SUPABASE_ANON_KEY = line.split('=')[1].trim();
});
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
async function run() {
    const results = {};
    
    const { data: w } = await supabase.from('workers').select('*').limit(1);
    if (w && w.length > 0) results.workers = Object.keys(w[0]);
    
    const { data: s } = await supabase.from('subcontractors').select('*').limit(1);
    if (s && s.length > 0) results.subcontractors = Object.keys(s[0]);
    
    fs.writeFileSync('schema_dump.json', JSON.stringify(results, null, 2));
    console.log('Schema dump saved to schema_dump.json');
}
run();
