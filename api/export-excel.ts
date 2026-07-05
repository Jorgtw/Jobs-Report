import { createClient } from '@supabase/supabase-js';
import { utils, write } from 'xlsx';

// --- DIZIONARIO DI TRADUZIONE MULTILINGUA ---
const translations: Record<string, Record<string, string>> = {
  it: {
    rawDataSheetName: 'Allegato',
    rawDate: 'Data',
    rawWorker: 'Operaio',
    rawProject: 'Progetto',
    rawClient: 'Cliente',
    rawOrdinaryHours: 'Ore Ord',
    rawOvertimeHours: 'Ore Extra',
    rawTotalHours: 'Totale Ore',
    rawActivityType: 'Tipo Attività',
    rawDescription: 'Note / Intervento',
    hourlySaleRate: 'Tariffa Oraria',
    totalInvoice: 'Totale Riga'
  },
  en: {
    rawDataSheetName: 'Attachment',
    rawDate: 'Date',
    rawWorker: 'Worker',
    rawProject: 'Project',
    rawClient: 'Client',
    rawOrdinaryHours: 'Ord Hours',
    rawOvertimeHours: 'Overtime',
    rawTotalHours: 'Total Hours',
    rawActivityType: 'Activity',
    rawDescription: 'Notes',
    hourlySaleRate: 'Hourly Rate',
    totalInvoice: 'Total'
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

// --- SERVERLESS ACTION CONTROLLER ---
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

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
      supabaseAdmin.from('projects').select('id, title, client_id').eq('company_id', companyId),
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
      return { ...r, projectName: proj?.title || '', clientName: cli?.name || '' };
    });

    const wb = utils.book_new();

    const rawDataRows: any[] = [
      [
        t.rawDate,
        t.rawClient,
        t.rawProject,
        t.rawWorker,
        t.rawActivityType,
        t.rawDescription,
        t.rawOrdinaryHours,
        t.rawOvertimeHours,
        t.rawTotalHours,
        t.hourlySaleRate,
        t.totalInvoice
      ]
    ];

    for (const r of mappedReports) {
      if (projectId && r.project_id !== projectId) continue;
      if (clientId && projectMap.get(r.project_id)?.client_id !== clientId) continue;

      const mainWorker = workerMapRaw.get(r.created_by);
      if (!userId || mainWorker?.id === userId) {
        const workerName = mainWorker?.name || r.created_by || '';
        const overtimeHours = Number(r.overtime_hours) || 0;
        const totalHours = Number(r.total_hours) || 0;
        const ordinaryHours = Math.max(0, totalHours - overtimeHours - (Number(r.festive_hours)||0) - (Number(r.night_hours)||0));
        
        rawDataRows.push([
          { v: formatDateEU(r.date, lang as string), t: 's' },
          { v: r.clientName, t: 's' },
          { v: r.projectName, t: 's' },
          { v: workerName, t: 's' },
          { v: r.activity_type || '', t: 's' },
          { v: r.description || '', t: 's' },
          { v: ordinaryHours, t: 'n', z: '#,##0.00' },
          { v: overtimeHours, t: 'n', z: '#,##0.00' },
          { v: totalHours, t: 'n', z: '#,##0.00' },
          { v: '', t: 's' }, // Tariffa Oraria (vuota per l'amministrazione)
          { v: '', t: 's' }  // Totale Riga (vuota per l'amministrazione)
        ]);
      }

      if (r.additionalWorkers && r.additionalWorkers.length > 0) {
        for (const aw of r.additionalWorkers) {
          if (userId && aw.worker_id !== userId) continue;
          const awWorker = workerMapRaw.get(aw.worker_id);
          const awName = awWorker?.name || aw.person_name || '';
          
          const awTot = Number(aw.hours) || 0;
          const awExt = Number(aw.overtime_hours) || 0;
          const awOrd = Math.max(0, awTot - awExt - (Number(aw.festive_hours)||0) - (Number(aw.night_hours)||0));

          rawDataRows.push([
            { v: formatDateEU(r.date, lang as string), t: 's' },
            { v: r.clientName, t: 's' },
            { v: r.projectName, t: 's' },
            { v: awName, t: 's' },
            { v: r.activity_type || '', t: 's' },
            { v: r.description || '', t: 's' },
            { v: awOrd, t: 'n', z: '#,##0.00' },
            { v: awExt, t: 'n', z: '#,##0.00' },
            { v: awTot, t: 'n', z: '#,##0.00' },
            { v: '', t: 's' },
            { v: '', t: 's' }
          ]);
        }
      }
    }

    const wsRaw = utils.aoa_to_sheet(rawDataRows);
    wsRaw['!cols'] = [
      { wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, 
      { wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, 
      { wch: 16 }, { wch: 20 }, { wch: 20 }
    ];
    utils.book_append_sheet(wb, wsRaw, t.rawDataSheetName);

    const fileBuffer = write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=JobsReport_Allegato_${new Date().toISOString().split('T')[0]}.xlsx`);

    return res.status(200).send(fileBuffer);

  } catch (err: any) {
    console.error('API Error during Excel generation:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
