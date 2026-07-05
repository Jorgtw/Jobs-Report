import { createClient } from '@supabase/supabase-js';
import { utils, write } from 'xlsx';

// --- DIZIONARIO DI TRADUZIONE MULTILINGUA ---
const translations: Record<string, Record<string, string>> = {
  it: {
    payrollSheet: 'Riepilogo Dipendenti',
    invoiceSheet: 'Allegato Fatturazione',
    rawSheet: 'Dati Completi',
    worker: 'Dipendente / Operaio',
    ordHours: 'Ore Ordinarie',
    extHours: 'Ore Straordinarie',
    festHours: 'Ore Festive',
    nightHours: 'Ore Notturne',
    totHours: 'Totale Ore',
    hourlyCost: 'Costo Orario',
    totCost: 'Totale Costo',
    client: 'Cliente',
    project: 'Progetto',
    date: 'Data',
    description: 'Descrizione / Note',
    billableHours: 'Ore Fatturabili',
    hourlyRate: 'Tariffa Oraria',
    totInvoice: 'Totale Riga',
    activityType: 'Tipo Attività'
  },
  en: {
    payrollSheet: 'Payroll Summary',
    invoiceSheet: 'Invoice Attachment',
    rawSheet: 'Raw Data',
    worker: 'Employee / Worker',
    ordHours: 'Ordinary Hours',
    extHours: 'Overtime',
    festHours: 'Festive Hours',
    nightHours: 'Night Hours',
    totHours: 'Total Hours',
    hourlyCost: 'Hourly Cost',
    totCost: 'Total Cost',
    client: 'Client',
    project: 'Project',
    date: 'Date',
    description: 'Description / Notes',
    billableHours: 'Billable Hours',
    hourlyRate: 'Hourly Rate',
    totInvoice: 'Total',
    activityType: 'Activity Type'
  }
};

const formatDateEU = (isoDate: string, lang: string) => {
  if (!isoDate) return '---';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    if (lang === 'en') return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
};

// Helper per convertire indice 0-based in lettera Excel (0 -> A, 1 -> B)
function getColLetter(colIdx: number): string {
  let temp = colIdx;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// --- SERVERLESS ACTION CONTROLLER ---
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase credentials' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader) token = authHeader.replace('Bearer ', '');
  else if (req.query.token) token = req.query.token as string;

  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  const params = req.method === 'POST' ? req.body : req.query;
  const { companyId, dateFrom, dateTo, clientId, projectId, userId, lang = 'it' } = params;

  const t = translations[lang] || translations.it;

  if (!companyId) return res.status(400).json({ error: 'Missing companyId' });

  try {
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) return res.status(401).json({ error: 'Invalid or expired token' });

    let reportQuery = supabaseAdmin
      .from('reports')
      .select(`
        id, date, description, total_hours, overtime_hours, festive_hours, night_hours, activity_type, created_by, project_id,
        additionalWorkers:rapportini_workers(worker_id, hours, overtime_hours, festive_hours, night_hours, person_name)
      `)
      .eq('company_id', companyId);

    if (dateFrom) reportQuery = reportQuery.gte('date', dateFrom);
    if (dateTo) reportQuery = reportQuery.lte('date', dateTo);

    const [reportsRes, projectsRes, clientsRes, workersRes] = await Promise.all([
      reportQuery,
      supabaseAdmin.from('projects').select('id, title, client_id, is_internal').eq('company_id', companyId),
      supabaseAdmin.from('clients').select('id, name').eq('company_id', companyId),
      supabaseAdmin.from('workers').select('id, name').eq('company_id', companyId)
    ]);

    if (reportsRes.error) throw reportsRes.error;
    if (projectsRes.error) throw projectsRes.error;
    if (clientsRes.error) throw clientsRes.error;
    if (workersRes.error) throw workersRes.error;

    const projectMap = new Map(projectsRes.data.map((p: any) => [p.id, p]));
    const clientMap = new Map(clientsRes.data.map((c: any) => [c.id, c]));
    const workerMapRaw = new Map((workersRes.data || []).map((w: any) => [w.id, w]));

    const mappedReports = (reportsRes.data || []).map((r: any) => {
      const proj = projectMap.get(r.project_id);
      const cli = proj ? clientMap.get(proj.client_id) : null;
      return { 
        ...r, 
        projectName: proj?.title || '', 
        clientName: cli?.name || '',
        isInternal: proj?.is_internal || false
      };
    });

    // Data structures for the 3 sheets
    const payrollMap = new Map<string, any>();
    const invoiceRows: any[] = [];
    const rawDataRows: any[] = [];

    for (const r of mappedReports) {
      if (projectId && r.project_id !== projectId) continue;
      if (clientId && projectMap.get(r.project_id)?.client_id !== clientId) continue;

      const processWorker = (workerId: string, nameFallback: string, hours: number, ext: number, fest: number, night: number) => {
        if (userId && workerId !== userId) return;
        const workerName = workerMapRaw.get(workerId)?.name || nameFallback || '';
        const ord = Math.max(0, hours - ext - fest - night);

        // 1. Aggrega in Payroll
        if (!payrollMap.has(workerName)) {
          payrollMap.set(workerName, { ord: 0, ext: 0, fest: 0, night: 0, tot: 0 });
        }
        const p = payrollMap.get(workerName);
        p.ord += ord;
        p.ext += ext;
        p.fest += fest;
        p.night += night;
        p.tot += hours;

        // 2. Aggiungi a Invoice (se fatturabile e non interno)
        if (!r.isInternal && r.activity_type === 'work') {
          invoiceRows.push({
            client: r.clientName,
            project: r.projectName,
            date: formatDateEU(r.date, lang as string),
            worker: workerName,
            desc: r.description || '',
            hours: hours
          });
        }

        // 3. Aggiungi a Raw Data
        rawDataRows.push([
          { v: formatDateEU(r.date, lang as string), t: 's' },
          { v: r.clientName, t: 's' },
          { v: r.projectName, t: 's' },
          { v: workerName, t: 's' },
          { v: r.activity_type || '', t: 's' },
          { v: r.description || '', t: 's' },
          { v: ord, t: 'n', z: '#,##0.00' },
          { v: ext, t: 'n', z: '#,##0.00' },
          { v: hours, t: 'n', z: '#,##0.00' }
        ]);
      };

      // Lavoratore principale
      processWorker(
        r.created_by, 
        r.created_by, 
        Number(r.total_hours) || 0, 
        Number(r.overtime_hours) || 0, 
        Number(r.festive_hours) || 0, 
        Number(r.night_hours) || 0
      );

      // Lavoratori aggiuntivi
      if (r.additionalWorkers) {
        for (const aw of r.additionalWorkers) {
          processWorker(
            aw.worker_id, 
            aw.person_name, 
            Number(aw.hours) || 0, 
            Number(aw.overtime_hours) || 0, 
            Number(aw.festive_hours) || 0, 
            Number(aw.night_hours) || 0
          );
        }
      }
    }

    const wb = utils.book_new();

    // --- SHEET 1: PAYROLL ---
    const s1Rows: any[] = [
      [t.worker, t.ordHours, t.extHours, t.festHours, t.nightHours, t.totHours, t.hourlyCost, t.totCost]
    ];
    let rIdx = 2;
    for (const [wName, wData] of Array.from(payrollMap.entries())) {
      s1Rows.push([
        { v: wName, t: 's' },
        { v: wData.ord, t: 'n', z: '#,##0.00' },
        { v: wData.ext, t: 'n', z: '#,##0.00' },
        { v: wData.fest, t: 'n', z: '#,##0.00' },
        { v: wData.night, t: 'n', z: '#,##0.00' },
        { v: wData.tot, t: 'n', z: '#,##0.00' },
        { v: '', t: 's' }, // Costo Orario vuoto
        { f: `${getColLetter(5)}${rIdx}*${getColLetter(6)}${rIdx}`, t: 'n', z: '#,##0.00' } // Formula: Tot = Ore * Costo
      ]);
      rIdx++;
    }
    const ws1 = utils.aoa_to_sheet(s1Rows);
    ws1['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    utils.book_append_sheet(wb, ws1, t.payrollSheet);

    // --- SHEET 2: INVOICE ---
    // Ordina per Cliente -> Progetto -> Data
    invoiceRows.sort((a, b) => {
      if (a.client !== b.client) return a.client.localeCompare(b.client);
      if (a.project !== b.project) return a.project.localeCompare(b.project);
      return a.date.localeCompare(b.date);
    });

    const s2Rows: any[] = [
      [t.client, t.project, t.date, t.worker, t.description, t.billableHours, t.hourlyRate, t.totInvoice]
    ];
    rIdx = 2;
    for (const inv of invoiceRows) {
      s2Rows.push([
        { v: inv.client, t: 's' },
        { v: inv.project, t: 's' },
        { v: inv.date, t: 's' },
        { v: inv.worker, t: 's' },
        { v: inv.desc, t: 's' },
        { v: inv.hours, t: 'n', z: '#,##0.00' },
        { v: '', t: 's' }, // Tariffa Oraria vuota
        { f: `${getColLetter(5)}${rIdx}*${getColLetter(6)}${rIdx}`, t: 'n', z: '#,##0.00' } // Formula: Tot = Ore * Tariffa
      ]);
      rIdx++;
    }
    const ws2 = utils.aoa_to_sheet(s2Rows);
    ws2['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    utils.book_append_sheet(wb, ws2, t.invoiceSheet);

    // --- SHEET 3: RAW DATA ---
    const s3Header: any[] = [
      [t.date, t.client, t.project, t.worker, t.activityType, t.description, t.ordHours, t.extHours, t.totHours]
    ];
    const ws3 = utils.aoa_to_sheet([...s3Header, ...rawDataRows]);
    ws3['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    utils.book_append_sheet(wb, ws3, t.rawSheet);

    const fileBuffer = write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=JobsReport_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

    return res.status(200).send(fileBuffer);

  } catch (err: any) {
    console.error('API Error during Excel generation:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
