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
    const { data: users } = await supabase.from('workers').select('id, name').limit(2);
    if (!users) return console.log('no users');

    const { data: r } = await supabase.from('reports').select('id').limit(1);
    const rid = r[0].id;

    const updates = {
        date: '2026-02-28',
        additionalWorkers: [{
            userId: users[1].id,
            startTime: '08:00',
            endTime: '12:00',
            breakHours: 0,
            hourlyRate: 10,
            personName: users[1].name,
            personRole: 'Operaio',
            membershipType: 'Interno',
            subcontractorId: null,
            isManualOverride: false
        }]
    };

    const workersToAdd = updates.additionalWorkers.map((aw) => {
        return {
            rapportino_id: rid,
            worker_id: aw.userId,
            startTime: aw.startTime?.length === 5 ? `${updates.date}T${aw.startTime}:00` : aw.startTime,
            endTime: aw.endTime?.length === 5 ? `${updates.date}T${aw.endTime}:00` : aw.endTime,
            breakHours: aw.breakHours,
            hours: 4,
            hourly_rate: 10,
            tal_cost: 40,
            erson_name: aw.personName || '',
            person_role: aw.personRole || '',
            membership_type: aw.membershipType || 'Interno',
            subcontractor_id: aw.subcontractorId || null,
            is_manual_override: aw.isManualOverride || false
        };
    });
    const { error } = await supabase.from('rapportini_workers').insert(workersToAdd);
    fs.writeFileSync('debug_update_error.json', JSON.stringify(error || { success: true }, null, 2));
}
run();
