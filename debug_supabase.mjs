import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
let VITE_SUPABASE_URL = '';
let VITE_SUPABASE_ANON_KEY = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) VITE_SUPABASE_URL = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) VITE_SUPABASE_ANON_KEY = line.split('=')[1].trim();
});
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
async function run() {
    const { data: r } = await supabase.from('reports').select('id').limit(1);
    const rid = r[0].id;
    const { error } = await supabase.from('rapportini_workers').insert([{
        rapportino_id: rid,
        worker_id: '15dbcbdd-34fa-41bd-bb1d-5b2da24147eb',
        hours: 4,
        tal_cost: 40,
        erson_name: 'Test Setup'
    }]);
    console.log('Error:', error);
}
run();
