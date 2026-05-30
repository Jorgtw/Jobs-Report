import { createClient } from '@supabase/supabase-js';
import { utils, write } from 'xlsx';

// --- CONFIGURAZIONE LAYOUT EXCEL (COLONNE E MAPPING) ---
const PayrollCols = {
  workerName: 0,    // Column A
  ordinaryHours: 1, // Column B
  overtimeHours: 2, // Column C
  totalHours: 3,    // Column D
  hourlyRate: 4,    // Column E
  totalCost: 5      // Column F
};

const SubappaltiCols = {
  subName: 0,       // Column A
  projectName: 1,   // Column B
  hours: 2,         // Column C
  rate: 3,          // Column D
  totalCost: 4      // Column E
};

const FatturazioneCols = {
  clientName: 0,    // Column A
  projectName: 1,   // Column B
  hours: 2,         // Column C
  saleRate: 3,      // Column D
  totalInvoice: 4   // Column E
};

const SintesiCols = {
  label: 0,         // Column A
  value: 1,         // Column B
  unit: 2           // Column C
};

// Helper per convertire un indice di colonna 0-based in lettera Excel (es. 0 -> A, 1 -> B, 26 -> AA)
function getColLetter(colIdx: number): string {
  let temp = colIdx;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// --- DIZIONARIO DI TRADUZIONE MULTILINGUA ---
const translations: Record<string, Record<string, string>> = {
  it: {
    payrollTitle: 'Dipendente',
    ordinaryHours: 'Ore ordinarie',
    overtimeHours: 'Ore straordinarie',
    totalHours: 'Totale ore',
    hourlyRate: 'Costo orario (€)',
    totalCost: 'Totale costo (€)',
    subcontractor: 'Subappaltatore',
    project: 'Progetto',
    hoursWorked: 'Ore lavorate',
    agreedRate: 'Tariffa concordata (€)',
    client: 'Cliente',
    billableHours: 'Ore fatturabili',
    hourlySaleRate: 'Tariffa oraria (€)',
    totalInvoice: 'Totale fattura (€)',
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
    payrollTitle: 'Employee',
    ordinaryHours: 'Ordinary hours',
    overtimeHours: 'Overtime hours',
    totalHours: 'Total hours',
    hourlyRate: 'Hourly rate (€)',
    totalCost: 'Total cost (€)',
    subcontractor: 'Subcontractor',
    project: 'Project',
    hoursWorked: 'Hours worked',
    agreedRate: 'Agreed rate (€)',
    client: 'Client',
    billableHours: 'Billable hours',
    hourlySaleRate: 'Hourly rate (€)',
    totalInvoice: 'Total invoice (€)',
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
  },
  es: {
    payrollTitle: 'Empleado',
    ordinaryHours: 'Horas ordinarias',
    overtimeHours: 'Horas extraordinarias',
    totalHours: 'Horas totales',
    hourlyRate: 'Tarifa horaria (€)',
    totalCost: 'Coste total (€)',
    subcontractor: 'Subcontratista',
    project: 'Proyecto',
    hoursWorked: 'Horas trabajadas',
    agreedRate: 'Tarifa acordada (€)',
    client: 'Cliente',
    billableHours: 'Horas facturables',
    hourlySaleRate: 'Tarifa horaria (€)',
    totalInvoice: 'Total factura (€)',
    dashboardTitle: 'CUADRO DE MANDO FINANCIERO DIRECCIONAL',
    itemHeader: 'Partida de balance',
    valHeader: 'Valor',
    unitHeader: 'Unidad',
    totalEmpHours: 'Horas totales empleados',
    totalSubHours: 'Horas totales subcontratos',
    totalBillableHours: 'Horas totales facturables',
    totalPersCost: 'Costes totales personal',
    totalSubCost: 'Costes subcontratos',
    totalRevenue: 'Ingresos totales',
    finalMargin: 'Margen final',
    hoursUnit: 'Horas'
  },
  pl: {
    payrollTitle: 'Pracownik',
    ordinaryHours: 'Godziny zwykłe',
    overtimeHours: 'Nadgodziny',
    totalHours: 'Suma godzin',
    hourlyRate: 'Stawka godzinowa (€)',
    totalCost: 'Koszt całkowity (€)',
    subcontractor: 'Podwykonawca',
    project: 'Projekt',
    hoursWorked: 'Przepracowane godziny',
    agreedRate: 'Uzgodniona stawka (€)',
    client: 'Klient',
    billableHours: 'Godziny fakturowane',
    hourlySaleRate: 'Stawka godzinowa (€)',
    totalInvoice: 'Suma faktury (€)',
    dashboardTitle: 'PANEL FINANSOWY DYREKCJI',
    itemHeader: 'Pozycja bilansowa',
    valHeader: 'Wartość',
    unitHeader: 'Jednostka',
    totalEmpHours: 'Suma godzin pracowników',
    totalSubHours: 'Suma godzin podwykonawców',
    totalBillableHours: 'Suma godzin fakturowanych',
    totalPersCost: 'Koszty personelu całkowite',
    totalSubCost: 'Koszty podwykonawców',
    totalRevenue: 'Przychody całkowite',
    finalMargin: 'Marża końcowa',
    hoursUnit: 'Godzin'
  },
  tr: {
    payrollTitle: 'Çalışan',
    ordinaryHours: 'Normal çalışma saatleri',
    overtimeHours: 'Fazla mesai saatleri',
    totalHours: 'Toplam saat',
    hourlyRate: 'Saatlik ücret (€)',
    totalCost: 'Toplam maliyet (€)',
    subcontractor: 'Alt yüklenici',
    project: 'Proje',
    hoursWorked: 'Çalışılan saatler',
    agreedRate: 'Anlaşılan ücret (€)',
    client: 'Müşteri',
    billableHours: 'Faturalandırılabilir saatler',
    hourlySaleRate: 'Saatlik ücret (€)',
    totalInvoice: 'Toplam fatura (€)',
    dashboardTitle: 'YÖNETİCİ FİNANSAL PANELİ',
    itemHeader: 'Bilanço kalemi',
    valHeader: 'Değer',
    unitHeader: 'Birim',
    totalEmpHours: 'Toplam çalışan saatleri',
    totalSubHours: 'Toplam alt yüklenici saatleri',
    totalBillableHours: 'Toplam faturalandırılabilir saatler',
    totalPersCost: 'Toplam personel maliyetleri',
    totalSubCost: 'Alt yüklenici maliyetleri',
    totalRevenue: 'Toplam gelirler',
    finalMargin: 'Final marj',
    hoursUnit: 'Saat'
  },
  da: {
    payrollTitle: 'Medarbejder',
    ordinaryHours: 'Normale timer',
    overtimeHours: 'Overtidstimer',
    totalHours: 'Samlet antal timer',
    hourlyRate: 'Timeløn (€)',
    totalCost: 'Samlet omkostning (€)',
    subcontractor: 'Underentreprenør',
    project: 'Projekt',
    hoursWorked: 'Arbejdstimer',
    agreedRate: 'Aftalt sats (€)',
    client: 'Kunde',
    billableHours: 'Fakturerbare timer',
    hourlySaleRate: 'Timeløn (€)',
    totalInvoice: 'Samlet fakturabeløb (€)',
    dashboardTitle: 'FINANSIELT LEDELSESDASHBOARD',
    itemHeader: 'Finanspost',
    valHeader: 'Værdi',
    unitHeader: 'Enhed',
    totalEmpHours: 'Samlet antal timer ansatte',
    totalSubHours: 'Samlet antal underentreprenørtimer',
    totalBillableHours: 'Samlet antal fakturerbare timer',
    totalPersCost: 'Samlede personaleomkostninger',
    totalSubCost: 'Underentreprenøromkostninger',
    totalRevenue: 'Samlede indtægter',
    finalMargin: 'Endelig margen',
    hoursUnit: 'Timer'
  }
};

// --- SERVIZI DI AGGREGAZIONE MODULARI (PRODUCTION-GRADE) ---

interface AggregationParams {
  reports: any[];
  workers: any[];
  projects: any[];
  clients: any[];
  subcontractors: any[];
  filters: {
    userId?: string;
    projectId?: string;
    clientId?: string;
    subcontractorId?: string;
  };
}

class PayrollService {
  static aggregate({ reports, workers, filters }: AggregationParams) {
    const payrollMap = new Map<string, any>();
    const workerMap = new Map(workers.map((w: any) => [w.id, w]));

    for (const r of reports) {
      if (filters.projectId && r.project_id !== filters.projectId) continue;

      // 1. Elaborazione lavoratore principale
      const mainWorker = workerMap.get(r.created_by);
      if (mainWorker && (!filters.userId || mainWorker.id === filters.userId)) {
        const isSub = !!mainWorker.subcontractor_id;
        if (!isSub) {
          const pKey = mainWorker.id;
          if (!payrollMap.has(pKey)) {
            payrollMap.set(pKey, {
              workerName: mainWorker.name,
              ordinaryHours: 0,
              overtimeHours: 0,
              hourlyRate: Number(mainWorker.hourly_rate) || 0
            });
          }
          const pData = payrollMap.get(pKey);
          const hours = Number(r.total_hours) || 0;
          const overtime = Number(r.overtime_hours) || 0;
          pData.ordinaryHours += Math.max(0, hours - overtime);
          pData.overtimeHours += overtime;
        }
      }

      // 2. Elaborazione lavoratori aggiuntivi
      for (const aw of (r.additionalWorkers || [])) {
        const awWorker = workerMap.get(aw.worker_id);
        if (awWorker && (!filters.userId || awWorker.id === filters.userId)) {
          const isSub = !!awWorker.subcontractor_id || aw.membership_type !== 'Interno';
          if (!isSub) {
            const pKey = awWorker.id;
            if (!payrollMap.has(pKey)) {
              payrollMap.set(pKey, {
                workerName: awWorker.name,
                ordinaryHours: 0,
                overtimeHours: 0,
                hourlyRate: Number(aw.hourly_rate) || Number(awWorker.hourly_rate) || 0
              });
            }
            const pData = payrollMap.get(pKey);
            const hours = Number(aw.hours) || 0;
            const overtime = Number(aw.overtime_hours) || 0;
            pData.ordinaryHours += Math.max(0, hours - overtime);
            pData.overtimeHours += overtime;
          }
        }
      }
    }

    return Array.from(payrollMap.values());
  }
}

class SubcontractorService {
  static aggregate({ reports, workers, subcontractors, filters }: AggregationParams) {
    const subappaltiMap = new Map<string, any>();
    const workerMap = new Map(workers.map((w: any) => [w.id, w]));
    const subMap = new Map(subcontractors.map((s: any) => [s.id, s]));

    for (const r of reports) {
      if (filters.projectId && r.project_id !== filters.projectId) continue;

      // 1. Lavoratore principale
      const mainWorker = workerMap.get(r.created_by);
      if (mainWorker && (!filters.userId || mainWorker.id === filters.userId)) {
        const subId = mainWorker.subcontractor_id;
        if (subId && (!filters.subcontractorId || subId === filters.subcontractorId)) {
          const subDetails = subMap.get(subId);
          const sKey = `${subId}_${r.project_id}`;
          if (!subappaltiMap.has(sKey)) {
            subappaltiMap.set(sKey, {
              subName: subDetails?.company_name || 'Subappaltatore Esterno',
              projectName: r.projectName || 'Sconosciuto',
              hours: 0,
              rate: Number(subDetails?.hourly_salary) || Number(mainWorker.hourly_rate) || 0
            });
          }
          subappaltiMap.get(sKey).hours += Number(r.total_hours) || 0;
        }
      }

      // 2. Lavoratori aggiuntivi
      for (const aw of (r.additionalWorkers || [])) {
        const awWorker = workerMap.get(aw.worker_id);
        if (awWorker && (!filters.userId || awWorker.id === filters.userId)) {
          const subId = awWorker.subcontractor_id || aw.subcontractor_id;
          const isSub = !!subId || aw.membership_type !== 'Interno';
          if (isSub && subId && (!filters.subcontractorId || subId === filters.subcontractorId)) {
            const subDetails = subMap.get(subId);
            const sKey = `${subId}_${r.project_id}`;
            if (!subappaltiMap.has(sKey)) {
              subappaltiMap.set(sKey, {
                subName: subDetails?.company_name || aw.person_name || 'Subappaltatore Esterno',
                projectName: r.projectName || 'Sconosciuto',
                hours: 0,
                rate: Number(subDetails?.hourly_salary) || Number(aw.hourly_rate) || Number(awWorker.hourly_rate) || 0
              });
            }
            subappaltiMap.get(sKey).hours += Number(aw.hours) || 0;
          }
        }
      }
    }

    return Array.from(subappaltiMap.values());
  }
}

class BillingService {
  static aggregate({ reports, projects, clients, filters }: AggregationParams) {
    const billingMap = new Map<string, any>();
    const projectMap = new Map(projects.map((p: any) => [p.id, p]));
    const clientMap = new Map(clients.map((c: any) => [c.id, c]));

    for (const r of reports) {
      if (filters.projectId && r.project_id !== filters.projectId) continue;

      const project = projectMap.get(r.project_id);
      if (!project) continue;

      const isInternal = project.is_internal || r.activity_type !== 'work';
      if (isInternal) continue;

      if (filters.clientId && project.client_id !== filters.clientId) continue;

      const client = clientMap.get(project.client_id);
      const totalProjectHours = (Number(r.total_hours) || 0) + 
        (r.additionalWorkers || []).reduce((acc: number, cur: any) => acc + (Number(cur.hours) || 0), 0);

      const fKey = `${project.client_id}_${project.id}`;
      if (!billingMap.has(fKey)) {
        billingMap.set(fKey, {
          clientName: client?.name || 'Sconosciuto',
          projectName: project.title,
          hours: 0,
          saleRate: Number(project.hourly_sale_price) || 0
        });
      }
      billingMap.get(fKey).hours += totalProjectHours;
    }

    return Array.from(billingMap.values());
  }
}

// --- SERVERLESS ACTION CONTROLLER ---

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase credentials' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Estrazione flessibile del token
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader) {
    token = authHeader.replace('Bearer ', '');
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const params = req.method === 'POST' ? req.body : req.query;
  const { companyId, dateFrom, dateTo, clientId, projectId, userId, subcontractorId, lang = 'it' } = params;

  // Risolvi il dizionario di traduzione
  const t = translations[lang] || translations.it;

  if (!companyId) {
    return res.status(400).json({ error: 'Missing companyId' });
  }

  try {
    // 1. Verifica autenticazione utente
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      console.error('API: Token verification failed:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // 2. Controllo multi-tenant (SSOT)
    const { data: userRole } = await supabaseAdmin
      .from('user_companies')
      .select('role')
      .eq('auth_id', authUser.id)
      .eq('company_id', companyId)
      .maybeSingle();

    const { data: isGlobalSA } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id)
      .eq('role', 'superadmin')
      .maybeSingle();

    if (!userRole && !isGlobalSA) {
      return res.status(403).json({ error: 'Access denied: Unauthorized company membership' });
    }

    // 3. Esecuzione query parallele altamente ottimizzate (Seleziona solo colonne target)
    let reportQuery = supabaseAdmin
      .from('reports')
      .select(`
        id, date, total_hours, overtime_hours, activity_type, created_by, project_id,
        additionalWorkers:rapportini_workers(worker_id, hours, overtime_hours, hourly_rate, person_name, membership_type, subcontractor_id)
      `)
      .eq('company_id', companyId);

    if (dateFrom) reportQuery = reportQuery.gte('date', dateFrom);
    if (dateTo) reportQuery = reportQuery.lte('date', dateTo);

    const [reportsRes, projectsRes, clientsRes, workersRes, subcontractorsRes] = await Promise.all([
      reportQuery,
      supabaseAdmin.from('projects').select('id, title, client_id, is_internal, hourly_sale_price').eq('company_id', companyId),
      supabaseAdmin.from('clients').select('id, name').eq('company_id', companyId),
      supabaseAdmin.from('workers').select('id, name, hourly_rate, subcontractor_id').eq('company_id', companyId),
      supabaseAdmin.from('subcontractors').select('id, company_name, hourly_salary').eq('company_id', companyId)
    ]);

    if (reportsRes.error) throw reportsRes.error;
    if (projectsRes.error) throw projectsRes.error;
    if (clientsRes.error) throw clientsRes.error;
    if (workersRes.error) throw workersRes.error;
    if (subcontractorsRes.error) throw subcontractorsRes.error;

    // Risoluzione dei nomi progetto in-memory per evitare join SQL costosi
    const projectMap = new Map(projectsRes.data.map((p: any) => [p.id, p]));
    const mappedReports = (reportsRes.data || []).map((r: any) => {
      const proj = projectMap.get(r.project_id);
      return {
        ...r,
        projectName: proj?.title || 'Sconosciuto'
      };
    });

    const aggregationParams: AggregationParams = {
      reports: mappedReports,
      workers: workersRes.data || [],
      projects: projectsRes.data || [],
      clients: clientsRes.data || [],
      subcontractors: subcontractorsRes.data || [],
      filters: { userId, projectId, clientId, subcontractorId }
    };

    // 4. Aggregazione dei dati tramite i servizi specializzati dedicati
    const payroll = PayrollService.aggregate(aggregationParams);
    const subappalti = SubcontractorService.aggregate(aggregationParams);
    const fatturazione = BillingService.aggregate(aggregationParams);

    // 5. Creazione della Cartella di Lavoro Excel (Workbook)
    const wb = utils.book_new();

    // --- SHEET 1: Payroll ---
    const payrollRows: any[] = [
      [t.payrollTitle, t.ordinaryHours, t.overtimeHours, t.totalHours, t.hourlyRate, t.totalCost]
    ];
    payroll.forEach((p, idx) => {
      const R = idx + 2;
      payrollRows.push([
        { v: p.workerName, t: 's' },
        { v: p.ordinaryHours, t: 'n', z: '#,##0.00' },
        { v: p.overtimeHours, t: 'n', z: '#,##0.00' },
        { f: `${getColLetter(PayrollCols.ordinaryHours)}${R}+${getColLetter(PayrollCols.overtimeHours)}${R}`, t: 'n', z: '#,##0.00' },
        { v: p.hourlyRate, t: 'n', z: '#,##0.00' },
        { f: `(${getColLetter(PayrollCols.ordinaryHours)}${R}*${getColLetter(PayrollCols.hourlyRate)}${R})+(${getColLetter(PayrollCols.overtimeHours)}${R}*(${getColLetter(PayrollCols.hourlyRate)}${R}*1.2))`, t: 'n', z: '#,##0.00' }
      ]);
    });
    const wsPayroll = utils.aoa_to_sheet(payrollRows);
    wsPayroll['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    utils.book_append_sheet(wb, wsPayroll, 'Payroll');

    // --- SHEET 2: Subappalti ---
    const subappaltiRows: any[] = [
      [t.subcontractor, t.project, t.hoursWorked, t.agreedRate, t.totalCost]
    ];
    subappalti.forEach((s, idx) => {
      const R = idx + 2;
      subappaltiRows.push([
        { v: s.subName, t: 's' },
        { v: s.projectName, t: 's' },
        { v: s.hours, t: 'n', z: '#,##0.00' },
        { v: s.rate, t: 'n', z: '#,##0.00' },
        { f: `${getColLetter(SubappaltiCols.hours)}${R}*${getColLetter(SubappaltiCols.rate)}${R}`, t: 'n', z: '#,##0.00' }
      ]);
    });
    const wsSub = utils.aoa_to_sheet(subappaltiRows);
    wsSub['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 22 }, { wch: 18 }];
    utils.book_append_sheet(wb, wsSub, 'Subappalti');

    // --- SHEET 3: Fatturazione ---
    const fatturazioneRows: any[] = [
      [t.client, t.project, t.billableHours, t.hourlySaleRate, t.totalInvoice]
    ];
    fatturazione.forEach((f, idx) => {
      const R = idx + 2;
      fatturazioneRows.push([
        { v: f.clientName, t: 's' },
        { v: f.projectName, t: 's' },
        { v: f.hours, t: 'n', z: '#,##0.00' },
        { v: f.saleRate, t: 'n', z: '#,##0.00' },
        { f: `${getColLetter(FatturazioneCols.hours)}${R}*${getColLetter(FatturazioneCols.saleRate)}${R}`, t: 'n', z: '#,##0.00' }
      ]);
    });
    const wsFat = utils.aoa_to_sheet(fatturazioneRows);
    wsFat['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];
    utils.book_append_sheet(wb, wsFat, 'Fatturazione');

    // --- SHEET 4: Sintesi (Dashboard Direzionale) ---
    const valCol = getColLetter(SintesiCols.value);
    const sintesiRows: any[] = [
      [t.dashboardTitle],
      [],
      [t.itemHeader, t.valHeader, t.unitHeader],
      [t.totalEmpHours, { f: `SUM(Payroll!${getColLetter(PayrollCols.totalHours)}:${getColLetter(PayrollCols.totalHours)})`, t: 'n', z: '#,##0.00' }, t.hoursUnit],
      [t.totalSubHours, { f: `SUM(Subappalti!${getColLetter(SubappaltiCols.hours)}:${getColLetter(SubappaltiCols.hours)})`, t: 'n', z: '#,##0.00' }, t.hoursUnit],
      [t.totalBillableHours, { f: `SUM(Fatturazione!${getColLetter(FatturazioneCols.hours)}:${getColLetter(FatturazioneCols.hours)})`, t: 'n', z: '#,##0.00' }, t.hoursUnit],
      [t.totalPersCost, { f: `SUM(Payroll!${getColLetter(PayrollCols.totalCost)}:${getColLetter(PayrollCols.totalCost)})`, t: 'n', z: '€#,##0.00' }, '€'],
      [t.totalSubCost, { f: `SUM(Subappalti!${getColLetter(SubappaltiCols.totalCost)}:${getColLetter(SubappaltiCols.totalCost)})`, t: 'n', z: '€#,##0.00' }, '€'],
      [t.totalRevenue, { f: `SUM(Fatturazione!${getColLetter(FatturazioneCols.totalInvoice)}:${getColLetter(FatturazioneCols.totalInvoice)})`, t: 'n', z: '€#,##0.00' }, '€'],
      [t.finalMargin, { f: `${valCol}9-(${valCol}7+${valCol}8)`, t: 'n', z: '€#,##0.00' }, '€']
    ];
    const wsSintesi = utils.aoa_to_sheet(sintesiRows);
    wsSintesi['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 10 }];
    utils.book_append_sheet(wb, wsSintesi, 'Sintesi');

    // 6. Generazione ed invio del file binario XLSX
    const fileBuffer = write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=JobsReport_Direzionale_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    return res.status(200).send(fileBuffer);

  } catch (err: any) {
    console.error('API Error during production-grade Excel generation:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
