import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gqetgbqlxljhhcaggoke.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DESCRIPTIONS = [
    "Tracciamento tracce per nuove linee elettriche",
    "Posa corrugati e cassette di derivazione",
    "Infilaggio cavi dorsali di piano",
    "Cablaggio quadro elettrico di zona",
    "Posa e collegamento prese postazioni lavoro",
    "Installazione punti luce a soffitto",
    "Configurazione rete dati e cablaggio rack",
    "Collaudo e certificazione linee prese",
    "Verifica strumentale impianto di terra",
    "Assistenza tecnica e rifiniture",
    "Montaggio corpi illuminanti sala riunioni",
    "Sostituzione magnetotermici quadro generale",
    "Posa linea dedicata per server",
    "Test continuità rete LAN"
];

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function run() {
    console.log("Aggiunta quarta commessa con margine sano per Acme SRL...");

    // 1. Fetch Company
    const { data: companies } = await supabase.from('companies').select('*').ilike('name', '%Acme%').limit(1);
    if (!companies || companies.length === 0) {
        console.error("Acme SRL non trovata!");
        return;
    }
    const company = companies[0];

    // 2. Create Client
    const { data: clientRes, error: clientErr } = await supabase.from('clients').insert([{
        id: crypto.randomUUID(),
        company_id: company.id,
        name: 'Studio Bianchi & Associati',
        status: 'active',
        created_at: new Date().toISOString()
    }]).select();

    if (clientErr || !clientRes) {
        console.error("Errore creazione cliente:", clientErr);
        return;
    }
    const client = clientRes[0];
    console.log(`Cliente creato: ${client.name}`);

    // 3. Create Project
    const { data: projectRes, error: projectErr } = await supabase.from('projects').insert([{
        id: crypto.randomUUID(),
        company_id: company.id,
        client_id: client.id,
        title: 'Ampliamento Rete Elettrica Uffici',
        description: 'Ampliamento impianto elettrico e dati uffici',
        status: 'Attivo',
        is_internal: false,
        economic_type: 'hourly',
        hourly_rate: 25,
        site_address: 'Via Roma 1, Milano',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }]).select();

    if (projectErr || !projectRes) {
        console.error("Errore creazione progetto:", projectErr);
        return;
    }
    const project = projectRes[0];
    console.log(`Progetto creato: ${project.title}`);

    // 4. Fetch Workers
    const { data: workers } = await supabase.from('workers').select('*').eq('company_id', company.id);
    const anna = workers?.find(w => w.name.includes('Anna'));
    const mario = workers?.find(w => w.name.includes('Mario'));
    const antonio = workers?.find(w => w.name.includes('Antonio'));

    if (!anna || !mario || !antonio) {
        console.error("Non ho trovato tutti i lavoratori necessari (Anna, Mario, Antonio)!");
        return;
    }

    // Anna: 40h total
    // Mario: 30h total
    // Antonio: 30h total
    // Distribuire in ~14 rapportini (circa 7h l'uno o misti)
    
    // Configurazione ore residue
    let remainingHours = {
        [anna.id]: 40,
        [mario.id]: 30,
        [antonio.id]: 30
    };

    const workerIds = [anna.id, mario.id, antonio.id];
    let reportsGenerated = 0;
    const startDate = new Date(2026, 3, 1); // 1 April 2026
    const endDate = new Date(2026, 3, 30);  // 30 April 2026
    
    // Mescola date
    let dates = Array.from({length: 15}, () => randomDate(startDate, endDate)).sort((a, b) => a.getTime() - b.getTime());

    for (const d of dates) {
        if (remainingHours[anna.id] <= 0 && remainingHours[mario.id] <= 0 && remainingHours[antonio.id] <= 0) {
            break;
        }

        // Scegliere main worker con ore disponibili
        const availableMainWorkers = workerIds.filter(id => remainingHours[id] >= 4);
        if (availableMainWorkers.length === 0) break;
        
        const mainWId = availableMainWorkers[Math.floor(Math.random() * availableMainWorkers.length)];
        const mainHours = Math.min(8, remainingHours[mainWId]);
        remainingHours[mainWId] -= mainHours;

        const dateStr = d.toISOString().split('T')[0];
        const desc = DESCRIPTIONS[reportsGenerated % DESCRIPTIONS.length];

        const { data: reportRes, error: reportErr } = await supabase.from('reports').insert([{
            id: crypto.randomUUID(),
            company_id: company.id,
            project_id: project.id,
            created_by: mainWId,
            date: dateStr,
            start_time: '08:00',
            end_time: '17:00',
            break_hours: 1,
            total_hours: mainHours,
            ordinary_hours: mainHours,
            description: desc,
            invoice_status: 'Pending',
            created_at: new Date().toISOString()
        }]).select();

        if (reportErr) {
            console.error("Errore insert report:", reportErr);
            continue;
        }
        
        const report = reportRes[0];

        // Aggiungere 1 o 2 colleghi (se hanno ore)
        const availableAw = workerIds.filter(id => id !== mainWId && remainingHours[id] >= 4);
        const awCount = Math.min(availableAw.length, Math.floor(Math.random() * 2) + 1);
        
        for (let i = 0; i < awCount; i++) {
            const awId = availableAw[i];
            const awHours = Math.min(8, remainingHours[awId]);
            remainingHours[awId] -= awHours;

            const wObj = workers?.find(w => w.id === awId);

            await supabase.from('rapportini_workers').insert([{
                id: crypto.randomUUID(),
                report_id: report.id,
                worker_id: awId,
                person_name: wObj?.name,
                person_role: 'Dipendente',
                membership_type: 'Interno',
                start_time: '08:00',
                end_time: '17:00',
                hours: awHours,
                ordinary_hours: awHours
            }]);
        }

        reportsGenerated++;
    }

    // Inserire le ore rimanenti forzatamente in un ultimo report se ne avanzano (per precisione)
    if (remainingHours[anna.id] > 0 || remainingHours[mario.id] > 0 || remainingHours[antonio.id] > 0) {
         let mainWId = anna.id;
         let mainHours = remainingHours[anna.id];
         if (mainHours <= 0) {
             mainWId = mario.id;
             mainHours = remainingHours[mario.id];
         }
         
         if (mainHours > 0) {
             const { data: rep } = await supabase.from('reports').insert([{
                id: crypto.randomUUID(),
                company_id: company.id,
                project_id: project.id,
                created_by: mainWId,
                date: '2026-04-30',
                start_time: '08:00',
                end_time: '17:00',
                break_hours: 1,
                total_hours: mainHours,
                ordinary_hours: mainHours,
                description: 'Lavori di completamento finali',
                invoice_status: 'Pending',
                created_at: new Date().toISOString()
            }]).select();

            remainingHours[mainWId] -= mainHours;

            for (const awId of [anna.id, mario.id, antonio.id]) {
                if (awId !== mainWId && remainingHours[awId] > 0) {
                    const awHours = remainingHours[awId];
                    const wObj = workers?.find(w => w.id === awId);
                    await supabase.from('rapportini_workers').insert([{
                        id: crypto.randomUUID(),
                        report_id: rep[0].id,
                        worker_id: awId,
                        person_name: wObj?.name,
                        person_role: 'Dipendente',
                        membership_type: 'Interno',
                        start_time: '08:00',
                        end_time: '17:00',
                        hours: awHours,
                        ordinary_hours: awHours
                    }]);
                    remainingHours[awId] -= awHours;
                }
            }
         }
    }

    console.log(`Generati ${reportsGenerated} rapportini per completare le ore.`);
    console.log("Ore residue:", remainingHours);
    console.log("Finito!");
}

run();
