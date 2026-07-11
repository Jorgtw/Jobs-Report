import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gqetgbqlxljhhcaggoke.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DESCRIPTIONS = [
    "Installazione canaline principali",
    "Stesura cavi rete",
    "Manutenzione ordinaria quadri elettrici",
    "Sopralluogo tecnico per ampliamento impianto",
    "Collaudo e certificazione impianto",
    "Assistenza guasto su linea produzione",
    "Integrazione domotica",
    "Posa in opera illuminazione esterna",
    "Configurazione rete LAN",
    "Sostituzione componenti usurati"
];

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedRandom(items: any[], weights: number[]) {
    let i;
    for (i = 0; i < weights.length; i++) weights[i] += weights[i - 1] || 0;
    let random = Math.random() * weights[weights.length - 1];
    for (i = 0; i < weights.length; i++) if (weights[i] > random) break;
    return items[i];
}

async function run() {
    console.log("Inizio generazione 50 rapportini per Acme SRL...");

    // 1. Fetch Company
    const { data: companies } = await supabase.from('companies').select('*').ilike('name', '%Acme%').limit(1);
    if (!companies || companies.length === 0) {
        console.error("Acme SRL non trovata!");
        return;
    }
    const company = companies[0];
    console.log(`Azienda: ${company.name} (ID: ${company.id})`);

    // 2. Fetch Projects
    const { data: projects } = await supabase.from('projects').select('*').eq('company_id', company.id);
    if (!projects || projects.length < 3) {
        console.error("Non ci sono abbastanza progetti!");
        return;
    }
    const projectWeights = [40, 40, 20]; // 40% P1, 40% P2, 20% P3

    // 3. Fetch Workers (excluding Thomas Demo)
    const { data: allWorkers } = await supabase.from('workers').select('*').eq('company_id', company.id);
    const workers = (allWorkers || []).filter(w => w.name !== 'Thomas Demo');
    if (workers.length === 0) {
        console.error("Nessun dipendente operativo trovato!");
        return;
    }

    // 4. Fetch / Create Subcontractors
    let { data: subcontractors } = await supabase.from('subcontractors').select('*').eq('company_id', company.id);
    if (!subcontractors || subcontractors.length < 2) {
        console.log("Creazione subappalti fittizi...");
        const newSubs = [
            { company_id: company.id, company_name: "ElettroForniture SPA", economic_type: "fixed", total_amount: 5000, status: "active" },
            { company_id: company.id, company_name: "Edilizia Rapida SRL", economic_type: "hourly", hourly_salary: 35, status: "active" }
        ];
        const { data: insertedSubs } = await supabase.from('subcontractors').insert(newSubs).select();
        subcontractors = (subcontractors || []).concat(insertedSubs || []);
    }

    // 5. Generate Reports
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    let reportsToInsert = [];
    let workersToInsert = [];
    let expensesToInsert = [];

    for (let i = 0; i < 50; i++) {
        const reportId = crypto.randomUUID();
        const project = weightedRandom(projects, projectWeights);
        const mainWorker = workers[Math.floor(Math.random() * workers.length)];
        const rDate = randomDate(thirtyDaysAgo, now);
        
        // Orari di base: 08:00 - 17:00 (1h pausa)
        const totalHours = 8;
        
        const fullDate = rDate.toISOString().split('T')[0];
        const startTimestamp = new Date(fullDate + 'T08:00:00Z').toISOString();
        const endTimestamp = new Date(fullDate + 'T17:00:00Z').toISOString();

        const report = {
            id: reportId,
            company_id: company.id,
            project_id: project.id,
            created_by: mainWorker.id,
            date: fullDate,
            start_time: '08:00',
            end_time: '17:00',
            break_hours: 1,
            total_hours: totalHours,
            ordinary_hours: totalHours,
            description: DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)],
            worker_type: 'internal',
            activity_type: 'work'
        };
        reportsToInsert.push(report);

        // 30% di probabilità di avere colleghi aggiuntivi
        if (Math.random() < 0.3) {
            const numExtra = randomInt(1, 2);
            let availableExtra = workers.filter(w => w.id !== mainWorker.id);
            for (let e = 0; e < numExtra && availableExtra.length > 0; e++) {
                const extraIdx = Math.floor(Math.random() * availableExtra.length);
                const extraWorker = availableExtra.splice(extraIdx, 1)[0];
                
                workersToInsert.push({
                    rapportino_id: reportId,
                    company_id: company.id,
                    worker_id: extraWorker.id,
                    startTime: startTimestamp,
                    endTime: endTimestamp,
                    breakHours: 1,
                    hours: totalHours,
                    ordinary_hours: totalHours
                });
            }
        }

        // 15% probabilità di avere spese di subappalto o materiali
        if (Math.random() < 0.15 && subcontractors && subcontractors.length > 0) {
            const sub = subcontractors[Math.floor(Math.random() * subcontractors.length)];
            expensesToInsert.push({
                company_id: company.id,
                rapportino_id: reportId,
                created_by: mainWorker.id,
                amount: Math.floor(Math.random() * 500) + 50, // Importo casuale 50-550
                type: 'CANTIERE',
                description: `Fornitura/Lavoro da ${sub.company_name}`
            });
        }
    }

    // Inserimento batch
    console.log(`Inserimento di ${reportsToInsert.length} rapportini...`);
    const { error: repErr } = await supabase.from('reports').insert(reportsToInsert);
    if (repErr) {
        console.error("Errore inserimento reports:", repErr);
        return;
    }

    if (workersToInsert.length > 0) {
        console.log(`Inserimento di ${workersToInsert.length} colleghi aggiuntivi...`);
        const { error: wErr } = await supabase.from('rapportini_workers').insert(workersToInsert);
        if (wErr) console.error("Errore inserimento colleghi:", wErr);
    }

    if (expensesToInsert.length > 0) {
        console.log(`Inserimento di ${expensesToInsert.length} spese/costi esterni...`);
        const { error: eErr } = await supabase.from('rapportini_expenses').insert(expensesToInsert);
        if (eErr) console.error("Errore inserimento spese:", eErr);
    }

    console.log("Generazione completata con successo!");
}

run();
