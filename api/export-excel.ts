import { createClient } from '@supabase/supabase-js';
import { utils, write } from 'xlsx';

// --- DIZIONARIO DI TRADUZIONE MULTILINGUA ---
const translations: Record<string, Record<string, string>> = {
  it: {
    payrollSheet: 'Payroll',
    subSheet: 'Subappalti',
    invoiceSheet: 'Fatturazione',
    rawSheet: 'Dati Completi',
    sintesiSheet: 'Sintesi',
    worker: 'Dipendente',
    subcontractor: 'Subappaltatore',
    ordHours: 'Ore ordinarie',
    extHours: 'Ore straordinarie',
    festHours: 'Ore festive',
    nightHours: 'Ore notturne',
    totHours: 'Totale ore',
    hourlyCost: 'Costo orario',
    totCost: 'Totale costo',
    client: 'Cliente',
    project: 'Progetto',
    projectDesc: 'Descrizione Progetto',
    isFixedPrice: 'Fatturazione (A Corpo / Oraria)',
    fixedPriceText: 'A Corpo',
    hourlyPriceText: 'Oraria',
    date: 'Data',
    description: 'Descrizione / Note',
    billableHours: 'Ore lavorate',
    hourlyRate: 'Tariffa concordata',
    flatRate: 'Prezzo a Corpo',
    totInvoice: 'Totale',
    activityType: 'Tipo Attività',
    dashboardTitle: 'CRUSCOTTO FINANZIARIO DIREZIONALE',
    itemHeader: 'Voce di Bilancio',
    valHeader: 'Valore',
    unitHeader: 'Unità',
    totalEmpHours: 'Totale ore dipendenti',
    totalSubHours: 'Totale ore subappalti',
    totalBillableHours: 'Totale ore fatturabili',
    totalPersCost: 'Costi totali personale',
    totalSubCost: 'Costi subappalti',
    totalRevenue: 'Ricavi totali',
    finalMargin: 'Margine finale',
    hoursUnit: 'Ore'
  },
  en: {
    payrollSheet: 'Payroll',
    subSheet: 'Subcontractors',
    invoiceSheet: 'Invoicing',
    rawSheet: 'Raw Data',
    sintesiSheet: 'Summary',
    worker: 'Employee',
    subcontractor: 'Subcontractor',
    ordHours: 'Ordinary Hours',
    extHours: 'Overtime',
    festHours: 'Festive Hours',
    nightHours: 'Night Hours',
    totHours: 'Total Hours',
    hourlyCost: 'Hourly Cost',
    totCost: 'Total Cost',
    client: 'Client',
    project: 'Project',
    projectDesc: 'Project Description',
    isFixedPrice: 'Billing Type',
    fixedPriceText: 'Fixed Price',
    hourlyPriceText: 'Hourly',
    date: 'Date',
    description: 'Description / Notes',
    billableHours: 'Hours Worked',
    hourlyRate: 'Agreed Rate',
    flatRate: 'Flat Price',
    totInvoice: 'Total',
    activityType: 'Activity Type',
    dashboardTitle: 'EXECUTIVE FINANCIAL DASHBOARD',
    itemHeader: 'Financial Item',
    valHeader: 'Value',
    unitHeader: 'Unit',
    totalEmpHours: 'Total employee hours',
    totalSubHours: 'Total subcontractor hours',
    totalBillableHours: 'Total billable hours',
    totalPersCost: 'Total personnel costs',
    totalSubCost: 'Subcontractor costs',
    totalRevenue: 'Total revenues',
    finalMargin: 'Final margin',
    hoursUnit: 'Hours'
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
        additionalWorkers:rapportini_workers(worker_id, hours, overtime_hours, festive_hours, night_hours, person_name, subcontractor_id, membership_type)
      `)
      .eq('company_id', companyId);

    if (dateFrom) reportQuery = reportQuery.gte('date', dateFrom);
    if (dateTo) reportQuery = reportQuery.lte('date', dateTo);

    const [reportsRes, projectsRes, clientsRes, workersRes, subcontractorsRes] = await Promise.all([
      reportQuery,
      supabaseAdmin.from('projects').select('id, title, description, economic_type, client_id, is_internal').eq('company_id', companyId),
      supabaseAdmin.from('clients').select('id, name').eq('company_id', companyId),
      supabaseAdmin.from('workers').select('id, name, subcontractor_id').eq('company_id', companyId),
      supabaseAdmin.from('subcontractors').select('id, company_name').eq('company_id', companyId)
    ]);

    if (reportsRes.error) throw reportsRes.error;
    if (projectsRes.error) throw projectsRes.error;
    if (clientsRes.error) throw clientsRes.error;
    if (workersRes.error) throw workersRes.error;
    if (subcontractorsRes.error) throw subcontractorsRes.error;

    const projectMap = new Map(projectsRes.data.map((p: any) => [p.id, p]));
    const clientMap = new Map(clientsRes.data.map((c: any) => [c.id, c]));
    const workerMapRaw = new Map((workersRes.data || []).map((w: any) => [w.id, w]));
    const subMap = new Map((subcontractorsRes.data || []).map((s: any) => [s.id, s]));

    const mappedReports = (reportsRes.data || []).map((r: any) => {
      const proj = projectMap.get(r.project_id);
      const cli = proj ? clientMap.get(proj.client_id) : null;
      return { 
        ...r, 
        projectName: proj?.title || 'Sconosciuto',
        projectDesc: proj?.description || '',
        economicType: proj?.economic_type === 'fixed' ? t.fixedPriceText : t.hourlyPriceText,
        clientName: cli?.name || 'Sconosciuto',
        isInternal: proj?.is_internal || false
      };
    });

    // Data structures
    const payrollMap = new Map<string, any>();
    const subappaltiRows: any[] = [];
    const invoiceRows: any[] = [];
    const rawDataRows: any[] = [];

    for (const r of mappedReports) {
      if (projectId && r.project_id !== projectId) continue;
      if (clientId && projectMap.get(r.project_id)?.client_id !== clientId) continue;

      const processWorker = (
        workerId: string, 
        nameFallback: string, 
        hours: number, 
        ext: number, 
        fest: number, 
        night: number,
        subIdFromRow?: string,
        membershipType?: string
      ) => {
        if (userId && workerId !== userId) return;
        
        const workerInfo = workerMapRaw.get(workerId);
        const workerName = workerInfo?.name || nameFallback || '';
        const subId = workerInfo?.subcontractor_id || subIdFromRow;
        const isSubcontractor = !!subId || membershipType === 'Esterno';
        
        const ord = Math.max(0, hours - ext - fest - night);

        if (isSubcontractor) {
          // 2. Aggiungi a Subappalti (dettagliato)
          const subDetails = subMap.get(subId);
          const subName = subDetails?.company_name || workerName || 'Subappaltatore';
          subappaltiRows.push({
            date: formatDateEU(r.date, lang as string),
            subName: subName,
            worker: workerName,
            project: r.projectName,
            desc: r.description || '',
            hours: hours
          });
        } else {
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
        }

        // 3. Aggiungi a Invoice (se fatturabile e non interno e tipo lavoro)
        if (!r.isInternal && r.activity_type === 'work') {
          invoiceRows.push({
            client: r.clientName,
            project: r.projectName,
            projectDesc: r.projectDesc,
            economicType: r.economicType,
            date: formatDateEU(r.date, lang as string),
            worker: workerName,
            desc: r.description || '',
            hours: hours
          });
        }

        // 4. Aggiungi a Raw Data
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
            Number(aw.night_hours) || 0,
            aw.subcontractor_id,
            aw.membership_type
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
        { v: '', t: 's' }, // GUARDRAIL: Prezzo lasciato vuoto all'utente
        { f: `IF(${getColLetter(6)}${rIdx}="","",${getColLetter(5)}${rIdx}*${getColLetter(6)}${rIdx})`, t: 'n', z: '#,##0.00' }
      ]);
      rIdx++;
    }
    const ws1 = utils.aoa_to_sheet(s1Rows);
    ws1['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    utils.book_append_sheet(wb, ws1, t.payrollSheet);

    // --- SHEET 2: SUBAPPALTI (Dettagliato) ---
    subappaltiRows.sort((a, b) => {
      if (a.subName !== b.subName) return a.subName.localeCompare(b.subName);
      if (a.project !== b.project) return a.project.localeCompare(b.project);
      return a.date.localeCompare(b.date);
    });

    const sSubRows: any[] = [
      [t.date, t.subcontractor, t.worker, t.project, t.description, t.billableHours, t.hourlyRate, t.flatRate, t.totCost]
    ];
    let rSubIdx = 2;
    for (const s of subappaltiRows) {
      sSubRows.push([
        { v: s.date, t: 's' },
        { v: s.subName, t: 's' },
        { v: s.worker, t: 's' },
        { v: s.project, t: 's' },
        { v: s.desc, t: 's' },
        { v: s.hours, t: 'n', z: '#,##0.00' },
        { v: '', t: 's' }, // Tariffa Oraria (vuota)
        { v: '', t: 's' }, // Prezzo a Corpo (vuoto)
        // Formula: se c'è prezzo a corpo usa quello, altrimenti Ore * Tariffa Oraria
        { f: `IF(${getColLetter(7)}${rSubIdx}<>"",${getColLetter(7)}${rSubIdx},IF(${getColLetter(6)}${rSubIdx}="","",${getColLetter(5)}${rSubIdx}*${getColLetter(6)}${rSubIdx}))`, t: 'n', z: '#,##0.00' }
      ]);
      rSubIdx++;
    }
    const wsSub = utils.aoa_to_sheet(sSubRows);
    wsSub['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    utils.book_append_sheet(wb, wsSub, t.subSheet);

    // --- SHEET 3: INVOICE ---
    invoiceRows.sort((a, b) => {
      if (a.client !== b.client) return a.client.localeCompare(b.client);
      if (a.project !== b.project) return a.project.localeCompare(b.project);
      return a.date.localeCompare(b.date);
    });

    const s2Rows: any[] = [
      [t.client, t.project, t.projectDesc, t.isFixedPrice, t.date, t.worker, t.description, t.billableHours, t.hourlyRate, t.flatRate, t.totInvoice]
    ];
    let rInvIdx = 2;
    for (const inv of invoiceRows) {
      s2Rows.push([
        { v: inv.client, t: 's' },
        { v: inv.project, t: 's' },
        { v: inv.projectDesc, t: 's' },
        { v: inv.economicType, t: 's' },
        { v: inv.date, t: 's' },
        { v: inv.worker, t: 's' },
        { v: inv.desc, t: 's' },
        { v: inv.hours, t: 'n', z: '#,##0.00' },
        { v: '', t: 's' }, // Tariffa Oraria vuota
        { v: '', t: 's' }, // Prezzo a Corpo vuoto
        // Formula: se c'è prezzo a corpo usa quello, altrimenti Ore * Tariffa Oraria
        { f: `IF(${getColLetter(9)}${rInvIdx}<>"",${getColLetter(9)}${rInvIdx},IF(${getColLetter(8)}${rInvIdx}="","",${getColLetter(7)}${rInvIdx}*${getColLetter(8)}${rInvIdx}))`, t: 'n', z: '#,##0.00' }
      ]);
      rInvIdx++;
    }
    const ws2 = utils.aoa_to_sheet(s2Rows);
    ws2['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
    utils.book_append_sheet(wb, ws2, t.invoiceSheet);

    // --- SHEET 4: RAW DATA ---
    const s3Header: any[] = [
      [t.date, t.client, t.project, t.worker, t.activityType, t.description, t.ordHours, t.extHours, t.totHours]
    ];
    const ws3 = utils.aoa_to_sheet([...s3Header, ...rawDataRows]);
    ws3['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    utils.book_append_sheet(wb, ws3, t.rawSheet);

    // --- SHEET 5: SINTESI ---
    const maxR = 10000;
    const sintesiRows: any[] = [
      [t.dashboardTitle],
      [],
      [t.itemHeader, t.valHeader, t.unitHeader],
      [t.totalEmpHours, { f: `SUM('${t.payrollSheet}'!F2:F${maxR})`, t: 'n', z: '#,##0.00' }, t.hoursUnit],
      [t.totalSubHours, { f: `SUM('${t.subSheet}'!F2:F${maxR})`, t: 'n', z: '#,##0.00' }, t.hoursUnit], // Col F = Ore
      [t.totalBillableHours, { f: `SUM('${t.invoiceSheet}'!H2:H${maxR})`, t: 'n', z: '#,##0.00' }, t.hoursUnit], // Col H = Ore
      [t.totalPersCost, { f: `SUM('${t.payrollSheet}'!H2:H${maxR})`, t: 'n', z: '#,##0.00' }, '€'], // Col H = Tot Costo
      [t.totalSubCost, { f: `SUM('${t.subSheet}'!I2:I${maxR})`, t: 'n', z: '#,##0.00' }, '€'], // Col I = Tot Costo Sub
      [t.totalRevenue, { f: `SUM('${t.invoiceSheet}'!K2:K${maxR})`, t: 'n', z: '#,##0.00' }, '€'], // Col K = Tot Riga
      [t.finalMargin, { f: `B9-(B7+B8)`, t: 'n', z: '#,##0.00' }, '€']
    ];
    const wsSintesi = utils.aoa_to_sheet(sintesiRows);
    wsSintesi['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 10 }];
    utils.book_append_sheet(wb, wsSintesi, t.sintesiSheet);

    const fileBuffer = write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=JobsReport_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

    return res.status(200).send(fileBuffer);

  } catch (err: any) {
    console.error('API Error during Excel generation:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
