import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// This script simulates the logic in dbService directly to verify the fix
const envFile = fs.readFileSync('.env', 'utf8');
let VITE_SUPABASE_URL = '';
let VITE_SUPABASE_ANON_KEY = '';
envFile.split('\n').forEach(line => {
    if (line.trim().startsWith('VITE_SUPABASE_URL=')) VITE_SUPABASE_URL = line.split('=')[1].trim();
    if (line.trim().startsWith('VITE_SUPABASE_ANON_KEY=')) VITE_SUPABASE_ANON_KEY = line.split('=')[1].trim();
});

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function verify() {
    console.log('Testing Address Saving Fix...');

    // 1. Find a test worker (or use a known one)
    const { data: worker } = await supabase.from('workers').select('*').limit(1).single();
    if (!worker) {
        console.error('No worker found to test');
        return;
    }

    const testAddress = 'Via Test 123, Roma (RM)';
    console.log(`Updating worker ${worker.name} (${worker.id}) with address: ${testAddress}`);

    const { error: updateError } = await supabase
        .from('workers')
        .update({ address: testAddress })
        .eq('id', worker.id);

    if (updateError) {
        console.error('Update error:', updateError);
        return;
    }

    // 2. Fetch it back
    const { data: updatedWorker } = await supabase
        .from('workers')
        .select('address')
        .eq('id', worker.id)
        .single();

    if (updatedWorker.address === testAddress) {
        console.log('SUCCESS: Worker address saved and retrieved correctly.');
    } else {
        console.error(`FAILURE: Expected address "${testAddress}", got "${updatedWorker.address}"`);
    }

    // 3. Test Subcontractor
    const { data: sub } = await supabase.from('subcontractors').select('*').limit(1).single();
    if (sub) {
        const subAddress = 'Sub Test Way 456, Milan (MI)';
        console.log(`Updating subcontractor ${sub.company_name} (${sub.id}) with address: ${subAddress}`);
        
        await supabase.from('subcontractors').update({ address: subAddress }).eq('id', sub.id);
        
        const { data: updatedSub } = await supabase.from('subcontractors').select('address').eq('id', sub.id).single();
        
        if (updatedSub.address === subAddress) {
            console.log('SUCCESS: Subcontractor address saved and retrieved correctly.');
        } else {
            console.error(`FAILURE: Expected address "${subAddress}", got "${updatedSub.address}"`);
        }
    } else {
        console.log('No subcontractor found to test.');
    }
}

verify();
