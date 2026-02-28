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
    const aw = { startTime: '08:00', endTime: '12:00' };
    const date = '2026-02-28';

    const st = aw.startTime.length === 5 ? `${date}T${aw.startTime}:00` : aw.startTime;
    const et = aw.endTime.length === 5 ? `${date}T${aw.endTime}:00` : aw.endTime;

    const workersToAdd = [{
        rapportino_id: 'e6a8dd2e-c7ba-46fb-aada-0fd39de12aeb',
        worker_id: '15dbcbdd-34fa-41bd-bb1d-5b2da24147eb', // This needs to be a real worker ID to avoid FKey error
        startTime: st,
        endTime: et,
        breakHours: 0,
        hours: 4,
        hourly_rate: 10,
        tal_cost: 40,
        erson_name: 'Test',
        person_role: 'Operaio',
        membership_type: 'Interno',
        subcontractor_id: null,
        is_manual_override: false
    }];

    const { error } = await supabase.from('rapportini_workers').insert(workersToAdd);
    console.log('Insert Error:', JSON.stringify(error, null, 2));
}
run();
