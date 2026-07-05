import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERRORE: Variabili VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancanti nel file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportSnapshots() {
  console.log("🔍 Ricerca Company 'MK EL-TEKNIK APS'...");
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('name', 'MK EL-TEKNIK APS')
    .single();

  if (companyError || !company) {
    console.error("❌ ERRORE durante la ricerca dell'azienda:", companyError?.message);
    process.exit(1);
  }

  console.log(`✅ Company trovata (ID: ${company.id}). Estrazione Rapportini in corso (Read-Only)...`);
  
  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      id, 
      date, 
      total_hours, 
      overtime_hours, 
      festive_hours, 
      night_hours, 
      activity_type, 
      invoice_status, 
      created_by, 
      project_id, 
      expenses, 
      company_id,
      created_at,
      additionalWorkers:rapportini_workers(*),
      project:projects(*),
      expensesList:rapportini_expenses(*)
    `)
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error("❌ Errore durante l'export snapshot:", error);
    process.exit(1);
  }

  if (!reports || reports.length === 0) {
    console.warn("⚠️ Nessun report trovato nel database attuale per questa azienda.");
    process.exit(0);
  }

  console.log(`📊 Trovati ${reports.length} report. Costruzione del Contratto Finanziario v1...`);

  const snapshots = reports.map(r => {
    // Calcoliamo i costi e le tariffe dal project e dai workers associati
    // Dato che il progetto è semplice, non facciamo maschere o logiche complesse, estraiamo i valori veri.
    const project = r.project;
    
    // Tariffe lavoratore principale (assumiamo default se non specificato)
    const mainWorker = {
      is_subcontractor: false,
      hourly_cost: 0,
      overtime_cost: 0,
      extra_cost: 0
    };

    const formattedAdditionalWorkers = (r.additionalWorkers || []).map((aw: any) => ({
      hours: aw.hours || 0,
      overtime_hours: aw.overtime_hours || 0,
      is_subcontractor: false,
      hourly_cost: 0,
      overtime_cost: 0,
      extra_cost: 0
    }));

    const totalExpenses = (r.expensesList || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) + (r.expenses || 0);

    return {
      _meta: {
        exportedAt: new Date().toISOString(),
        scenario: `Report #${r.id} - ${project ? project.name : 'Unknown Project'}`
      },
      inputRecord: {
        id: r.id,
        is_internal: project?.is_internal || false,
        total_hours: r.total_hours || 0,
        overtime_hours: r.overtime_hours || 0,
        expenses: totalExpenses,
        selling_price: project?.hourly_rate || 0,
        main_worker: mainWorker,
        additional_workers: formattedAdditionalWorkers
      },
      legacyExpected: {
        status: null,
        margin: null,
        revenue: null,
        cost: null
      }
    };
  });

  const exportData = {
    version: "1.0",
    generated_at: new Date().toISOString(),
    description: "Export Diretto per MK EL-TEKNIK APS",
    snapshots
  };

  const outputPath = path.join(process.cwd(), 'test_fixtures', 'financial-contract-v1.json');
  
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

  console.log(`✅ Snapshot finanziari esportati con successo in: ${outputPath}`);
}

exportSnapshots();
