import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gqetgbqlxljhhcaggoke.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log("Fixing Subcontractors in Acme SRL...");
    const { data: companies } = await supabase.from('companies').select('*').ilike('name', '%Acme%').limit(1);
    const companyId = companies[0].id;

    // 1. Get expenses linked to subcontractors
    const { data: expenses } = await supabase.from('rapportini_expenses').select('*').eq('company_id', companyId);
    
    // Convert 3 of them into rapportini_workers (subcontractors)
    const toConvert = expenses.slice(0, 3);
    if (toConvert.length === 0) {
        console.log("Nessuna spesa trovata da convertire.");
        return;
    }

    const { data: subs } = await supabase.from('subcontractors').select('*').eq('company_id', companyId);

    for (const exp of toConvert) {
        // Find which subcontractor it belongs to based on description "Fornitura/Lavoro da [Nome]"
        const sub = subs.find(s => exp.description.includes(s.company_name));
        const subId = sub ? sub.id : null;

        if (subId) {
            // Delete the expense
            await supabase.from('rapportini_expenses').delete().eq('id', exp.id);

            // Insert as rapportini_worker (Subcontractor)
            await supabase.from('rapportini_workers').insert({
                company_id: companyId,
                rapportino_id: exp.rapportino_id,
                subcontractor_id: subId,
                person_name: sub.company_name,
                membership_type: 'Esterno',
                person_role: 'Subappalto',
                startTime: '08:00',
                endTime: '12:00',
                breakHours: 0,
                hours: 4, 
                ordinary_hours: 4,
                hourly_rate: exp.amount / 4,
                total_cost: exp.amount
            });
            console.log(`Convertita spesa ${exp.amount}€ in subappalto per ${sub.company_name}`);
        }
    }
    console.log("Fix completato!");
}
run();
