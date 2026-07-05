import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Carica variabili d'ambiente manualmente per evitare dotenv mancante
const envPath = path.join(process.cwd(), '.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function extractTestReports() {
  console.log("Estraendo i dati da Supabase per la Financial Validation Suite...");

  try {
    // Estrai 10 report con tutti i dati correlati per trovare i 3 edge-cases migliori
    const { data: reports, error } = await supabase
      .from("reports")
      .select(`
        id, date, total_hours, overtime_hours, festive_hours, night_hours, activity_type, invoice_status, created_by, project_id, expenses, company_id,
        additionalWorkers:rapportini_workers(worker_id, hours, overtime_hours, festive_hours, night_hours, hourly_rate, person_name, membership_type, subcontractor_id)
      `)
      .order('created_at', { ascending: false })
      .limit(100); // Fetch a bunch to filter the best ones

    if (error) throw error;
    if (!reports || reports.length === 0) {
      console.log("Nessun report trovato nel DB!");
      return;
    }

    // Estrarre i worker e project collegati per avere la Ground Truth
    const companyIds = [...new Set(reports.map(r => r.company_id))];
    const projectIds = [...new Set(reports.map(r => r.project_id))];
    const workerIds = [...new Set(reports.map(r => r.created_by).concat(
      reports.flatMap(r => r.additionalWorkers.map((aw: any) => aw.worker_id))
    ))];

    const { data: projects } = await supabase.from('projects').select('*').in('id', projectIds);
    const { data: workers } = await supabase.from('workers').select('*').in('id', workerIds);
    const { data: subcontractors } = await supabase.from('subcontractors').select('*');

    // Filtriamo i 3 report ideali richiesti:
    // REPORT 1: Semplice (1 worker, no overtime, no expenses)
    let rep1 = reports.find(r => r.total_hours > 0 && r.overtime_hours === 0 && (!r.expenses || r.expenses.length === 0) && r.additionalWorkers.length === 0);
    
    // REPORT 2: Complesso (overtime, expenses, additional workers)
    let rep2 = reports.find(r => r.overtime_hours > 0 && r.expenses && r.expenses.length > 0 && r.additionalWorkers.length > 0);

    // REPORT 3: Edge Case (Progetto Interno)
    let rep3 = null;
    for (const r of reports) {
      const p = projects?.find((p: any) => p.id === r.project_id);
      if (p && p.is_internal) {
        rep3 = r;
        break;
      }
    }

    // Se non troviamo esattamente quelli ideali, prendiamo i primi 3 disponibili
    if (!rep1) rep1 = reports[0];
    if (!rep2) rep2 = reports[1];
    if (!rep3) rep3 = reports[2];

    const selectedReports = [rep1, rep2, rep3].filter(Boolean);

    const groundTruth = {
      reports: selectedReports,
      projects: projects,
      workers: workers,
      subcontractors: subcontractors
    };

    const outPath = path.join(process.cwd(), 'scripts', 'raw-reports.json');
    fs.writeFileSync(outPath, JSON.stringify(groundTruth, null, 2));
    
    console.log(`Estratti ${selectedReports.length} report reali salvati in: ${outPath}`);

  } catch (err) {
    console.error("Errore durante l'estrazione:", err);
  }
}

extractTestReports();
