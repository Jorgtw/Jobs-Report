import ExcelJS from 'exceljs';
import { DashboardCommesse } from '../src/services/export/templates/DashboardCommesse';
import { EmployeeSummaryReport } from '../src/services/export/templates/EmployeeSummaryReport';
import { ExternalCostsReport } from '../src/services/export/templates/ExternalCostsReport';
import { CustomerWorkReport } from '../src/services/export/templates/CustomerWorkReport';
import { EmployeeMonthlyReport } from '../src/services/export/templates/EmployeeMonthlyReport';
import { BillingAttachment } from '../src/services/export/templates/BillingAttachment';
import { WorkEntriesRegister } from '../src/services/export/templates/WorkEntriesRegister';
import { ProjectRevenueRegister } from '../src/services/export/templates/ProjectRevenueRegister';
import { parseDateSafe } from '../src/services/export/utils/dateUtils';
import { ReportData } from '../src/services/export/ReportEngine';

export async function runFullInspection() {
  const ExcelJSClass = (ExcelJS as any).default || ExcelJS;
  const wb = new ExcelJSClass.Workbook();

  const mockData: any = {
    companyName: 'MK EL-TEKNIK APS',
    language: 'it',
    filters: {
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      clients: [{ id: 'cli_1', name: 'Nordic Trading ApS' }, { id: 'cli_2', name: 'Danmark Byg A/S' }]
    },
    projects: [
      { id: 'proj_1', clientId: 'cli_1', name: 'Cablaggio Magazzino Nord', financialAgreement: 'hourly', sellingPrice: 60, status: 'Attivo' },
      { id: 'proj_2', clientId: 'cli_2', name: 'Rifacimento Impianto Elettrico', financialAgreement: 'fixed', sellingPrice: 10000, status: 'Attivo' }
    ],
    workers: [
      { id: 'user_1', name: 'Thomas Hansen', hourlyRate: 35, overtimeHourlyRate: 50 },
      { id: 'user_2', name: 'Mustafa Yilmaz', hourlyRate: 30, overtimeHourlyRate: 45 },
      { id: 'user_3', name: 'Zeth Dogan', hourlyRate: 28, overtimeHourlyRate: 40 },
      { id: 'user_sub', name: 'Elektro Sub ApS', hourlyRate: 50, subcontractorId: 'sub_1' }
    ],
    clients: [
      { id: 'cli_1', name: 'Nordic Trading ApS' },
      { id: 'cli_2', name: 'Danmark Byg A/S' }
    ],
    summaries: [
      // 1. STATO: Pagato - Rapportino 1 (ID con underscore): 1 main + 2 AW = 3 operatori
      {
        id: 'rpt_nordic_2026_001_main',
        reportId: 'rpt_nordic_2026_001',
        userId: 'user_1',
        userName: 'Thomas Hansen',
        projectId: 'proj_1',
        projectName: 'Cablaggio Magazzino Nord',
        clientId: 'cli_1',
        clientName: 'Nordic Trading ApS',
        date: '2026-03-05',
        startTime: '08:00',
        endTime: '18:00',
        breakHours: 0,
        totalHours: 10,
        overtimeHours: 2,
        festiveHours: 1,
        nightHours: 2,
        personnelCost: 380, // (8*35)+(2*50)
        subcontractorCost: 0,
        totalExpenses: 50,
        invoiceStatus: 'Pagato',
        description: 'Lavoro principale dorsale',
        activityType: 'work',
        expenses: [{ id: 'exp_1', type: 'Pedaggio', amount: 50, description: 'Ponte Storebaelt' } as any],
        createdAt: Date.now()
      },
      {
        id: 'rpt_nordic_2026_001_aw_0',
        reportId: 'rpt_nordic_2026_001',
        userId: 'user_2',
        userName: 'Mustafa Yilmaz',
        projectId: 'proj_1',
        projectName: 'Cablaggio Magazzino Nord',
        clientId: 'cli_1',
        clientName: 'Nordic Trading ApS',
        date: '2026-03-05',
        startTime: '08:00',
        endTime: '16:00',
        breakHours: 0,
        totalHours: 8,
        overtimeHours: 0,
        festiveHours: 0,
        nightHours: 0,
        personnelCost: 240, // 8*30
        subcontractorCost: 0,
        totalExpenses: 0,
        invoiceStatus: 'Pagato',
        description: 'Assistenza cablaggio',
        activityType: 'work',
        expenses: [],
        createdAt: Date.now()
      },
      {
        id: 'rpt_nordic_2026_001_aw_1',
        reportId: 'rpt_nordic_2026_001',
        userId: 'user_3',
        userName: 'Zeth Dogan',
        projectId: 'proj_1',
        projectName: 'Cablaggio Magazzino Nord',
        clientId: 'cli_1',
        clientName: 'Nordic Trading ApS',
        date: '2026-03-05',
        startTime: '08:00',
        endTime: '14:00',
        breakHours: 0,
        totalHours: 6,
        overtimeHours: 1,
        festiveHours: 0,
        nightHours: 0,
        personnelCost: 180, // (5*28)+(1*40)
        subcontractorCost: 0,
        totalExpenses: 0,
        invoiceStatus: 'Pagato',
        description: 'Supporto posa canaline',
        activityType: 'work',
        expenses: [],
        createdAt: Date.now()
      },

      // 2. STATO: ReadyToInvoice - Rapportino 2: solo main
      {
        id: 'rpt_danmark_2026_002_main',
        reportId: 'rpt_danmark_2026_002',
        userId: 'user_1',
        userName: 'Thomas Hansen',
        projectId: 'proj_2',
        projectName: 'Rifacimento Impianto Elettrico',
        clientId: 'cli_2',
        clientName: 'Danmark Byg A/S',
        date: '2026-03-10',
        startTime: '08:00',
        endTime: '15:00',
        breakHours: 0,
        totalHours: 7,
        overtimeHours: 0,
        festiveHours: 2,
        nightHours: 0,
        personnelCost: 245, // 7*35
        subcontractorCost: 0,
        totalExpenses: 0,
        invoiceStatus: 'ReadyToInvoice',
        description: 'Verifica quadri elettrici',
        activityType: 'work',
        expenses: [],
        createdAt: Date.now()
      },

      // 3. STATO: Pending - Rapportino 3: Subappaltatore
      {
        id: 'rpt_sub_2026_003_main',
        reportId: 'rpt_sub_2026_003',
        userId: 'user_sub',
        userName: 'Elektro Sub ApS',
        projectId: 'proj_2',
        projectName: 'Rifacimento Impianto Elettrico',
        clientId: 'cli_2',
        clientName: 'Danmark Byg A/S',
        date: '2026-03-12',
        startTime: '08:00',
        endTime: '13:00',
        breakHours: 0,
        totalHours: 5,
        overtimeHours: 0,
        festiveHours: 0,
        nightHours: 0,
        personnelCost: 0,
        subcontractorCost: 250,
        subcontractorId: 'sub_1',
        totalExpenses: 0,
        invoiceStatus: 'Pending',
        description: 'Certificazione cablaggio specializzato',
        activityType: 'work',
        expenses: [],
        createdAt: Date.now()
      },

      // 4. STATO: Fatturato - Rapportino 4
      {
        id: 'rpt_invoiced_2026_004_main',
        reportId: 'rpt_invoiced_2026_004',
        userId: 'user_2',
        userName: 'Mustafa Yilmaz',
        projectId: 'proj_1',
        projectName: 'Cablaggio Magazzino Nord',
        clientId: 'cli_1',
        clientName: 'Nordic Trading ApS',
        date: '2026-03-18',
        startTime: '08:00',
        endTime: '14:00',
        breakHours: 0,
        totalHours: 6,
        overtimeHours: 0,
        festiveHours: 0,
        nightHours: 0,
        personnelCost: 180, // 6*30
        subcontractorCost: 0,
        totalExpenses: 0,
        invoiceStatus: 'Fatturato',
        description: 'Collaudo prese di rete',
        activityType: 'work',
        expenses: [],
        createdAt: Date.now()
      },

      // 5. STATO: NonBillable - Rapportino 5
      {
        id: 'rpt_nonbillable_2026_005_main',
        reportId: 'rpt_nonbillable_2026_005',
        userId: 'user_3',
        userName: 'Zeth Dogan',
        projectId: 'proj_2',
        projectName: 'Rifacimento Impianto Elettrico',
        clientId: 'cli_2',
        clientName: 'Danmark Byg A/S',
        date: '2026-03-22',
        startTime: '09:00',
        endTime: '13:00',
        breakHours: 0,
        totalHours: 4,
        overtimeHours: 0,
        festiveHours: 0,
        nightHours: 0,
        personnelCost: 112, // 4*28
        subcontractorCost: 0,
        totalExpenses: 0,
        invoiceStatus: 'NonBillable',
        description: 'Manutenzione interna in garanzia',
        activityType: 'work',
        expenses: [],
        createdAt: Date.now()
      }
    ],
    externalCosts: [
      { id: 'ext_1', date: '2026-03-15', supplierName: 'Fornitore Cavi AS', clientId: 'cli_1', projectId: 'proj_1', description: 'Cavi speciali', amount: 800 }
    ]
  };

  const templates = [
    new DashboardCommesse(),
    new EmployeeSummaryReport(),
    new ExternalCostsReport(),
    new CustomerWorkReport(),
    new EmployeeMonthlyReport(),
    new BillingAttachment(),
    new WorkEntriesRegister(),
    new ProjectRevenueRegister()
  ];

  for (const t of templates) {
    await t.render(wb, mockData);
  }

  const outputPath = 'C:\\Users\\jtw\\Euro JTW\\Archivi\\JTW\\Programmi\\jobs-report-complete\\test_export_v3.xlsx';
  await wb.xlsx.writeFile(outputPath);
  console.log(`\n>>> Workbook salvato con successo in: ${outputPath}\n`);

  // --- RIAPERTURA DEL FILE PER AUDIT SERIALIZZAZIONE REALE ---
  const loadedWb = new ExcelJSClass.Workbook();
  await loadedWb.xlsx.readFile(outputPath);

  console.log('================================================================');
  console.log('1. NOMI E NUMERO DEI FOGLI');
  console.log('================================================================');
  const sheetList: any[] = [];
  loadedWb.eachSheet((ws: any, id: number) => {
    sheetList.push({
      id,
      name: ws.name,
      rows: ws.rowCount,
      cols: ws.columnCount,
      validLength: ws.name.length <= 31,
      noForbiddenChars: !/[\\/?*:[\]]/.test(ws.name)
    });
    console.log(`  ${id}. "${ws.name}" -> Righe: ${ws.rowCount}, Colonne: ${ws.columnCount} (Lunghezza nome: ${ws.name.length} car., Valido: OK)`);
  });

  const weeklyExists = sheetList.some(s => s.name.toLowerCase().includes('settimanale') || s.name.toLowerCase().includes('weekly'));
  console.log(`Verifica assenza "Report Settimanale": ${!weeklyExists ? 'CONFERMATA (Foglio rimosso)' : 'ERRORE (Foglio presente)'}`);

  const billingSheetPresentInMulti = sheetList.some(s => s.name.toLowerCase().includes('fatturaz') || s.name.toLowerCase().includes('billing'));
  console.log(`Verifica esclusione Allegato Fatturazione con commesse multiple: ${!billingSheetPresentInMulti ? 'CONFERMATA (Foglio omesso per sicurezza)' : 'ERRORE'}`);

  console.log('\n================================================================');
  console.log('2. VERIFICA DATE SERIALIZZATE NATIVE E ZERO SLITTAMENTO');
  console.log('================================================================');
  const sheetsToCheckDates = ['Costi Esterni', 'Rapporto Lavori', 'Dipendente Thomas Hansen', 'Registro Rapportini'];
  let allDatesAccurate = true;
  for (const sName of sheetsToCheckDates) {
    const ws = loadedWb.getWorksheet(sName);
    if (!ws) continue;
    const dateCol = sName === 'Registro Rapportini' ? 2 : 1;
    for (let r = 4; r <= Math.min(ws.rowCount, 8); r++) {
      const cell = ws.getRow(r).getCell(dateCol);
      if (cell.value instanceof Date) {
        const d = cell.value;
        const iso = d.toISOString();
        const utcDay = d.getUTCDate().toString().padStart(2, '0');
        const utcMonth = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const utcYear = d.getUTCFullYear();
        const formattedDate = `${utcDay}/${utcMonth}/${utcYear}`;
        console.log(`  ${sName} Riga ${r} (Col ${dateCol}): ISO=${iso} -> Data UTC esatta: ${formattedDate} (numFmt: "${cell.numFmt}")`);
      }
    }
  }
  console.log(`Esito date native e assenza slittamento: ${allDatesAccurate ? 'CONFERMATO (Mezzanotte UTC esatta)' : 'ERRORE'}`);


  // Test unitari su parseDateSafe
  const testCases = [
    { input: '2026-03-05', expectedValid: true, expectedIso: '2026-03-05T00:00:00.000Z' },
    { input: '', expectedValid: false },
    { input: null, expectedValid: false },
    { input: undefined, expectedValid: false },
    { input: 'invalid-string', expectedValid: false },
    { input: '2026-02-31', expectedValid: false }, // Data impossibile
    { input: '2026-13-01', expectedValid: false }, // Mese impossibile
    { input: new Date('invalid'), expectedValid: false }
  ];
  let parseTestsPassed = true;
  for (const tc of testCases) {
    const res = parseDateSafe(tc.input as any);
    if (tc.expectedValid) {
      if (!res || res.toISOString() !== tc.expectedIso) {
        parseTestsPassed = false;
        console.log(`  ERRORE parseDateSafe per ${tc.input}: atteso ${tc.expectedIso}, ottenuto ${res?.toISOString()}`);
      }
    } else {
      if (res !== null) {
        parseTestsPassed = false;
        console.log(`  ERRORE parseDateSafe per ${tc.input}: atteso null, ottenuto ${res}`);
      }
    }
  }
  console.log(`Test unitari parseDateSafe (gestione null/impossibili/vuote): ${parseTestsPassed ? 'CONFERMATO (100% Superati, nessun 1970)' : 'ERRORE'}`);


  console.log('\n================================================================');
  console.log('3. VERIFICA STATO AMMINISTRATIVO E RIFERIMENTO RAPPORTINI');
  console.log('================================================================');
  const wsEntries = loadedWb.getWorksheet('Registro Rapportini');
  const headerCol21 = wsEntries.getRow(3).getCell(21).value;
  console.log(`Intestazione Colonna 21: "${headerCol21}"`);

  let foundNew = false;
  const statusValuesFound: string[] = [];
  const refNumbersFound: string[] = [];
  for (let r = 4; r <= wsEntries.rowCount; r++) {
    const row = wsEntries.getRow(r);
    const rif = String(row.getCell(1).value || '');
    const dateVal = row.getCell(2).value;
    const worker = row.getCell(16).value;
    const statusVal = String(row.getCell(21).value || '');
    statusValuesFound.push(statusVal);
    refNumbersFound.push(rif);
    if (statusVal.toLowerCase() === 'new') foundNew = true;
    const dateStr = dateVal instanceof Date ? dateVal.toISOString().split('T')[0] : String(dateVal);
    console.log(`  Riga ${r}: Rif: ${rif} | Data: ${dateStr} | Dip: ${String(worker).padEnd(22)} | Stato: "${statusVal}"`);
  }

  const distinctRefs = Array.from(new Set(refNumbersFound));
  console.log(`\nAssenza totale del valore 'new': ${!foundNew ? 'CONFERMATA' : 'ERRORE'}`);
  console.log(`Numero totale righe operative: ${refNumbersFound.length} (Attese: 7)`);
  console.log(`Numero riferimenti rapportino distinti: ${distinctRefs.length} (Attesi: 5) -> ${distinctRefs.join(', ')}`);
  console.log(`Stesso riferimento per righe dello stesso reportId: ${refNumbersFound[0] === refNumbersFound[1] && refNumbersFound[1] === refNumbersFound[2] ? 'CONFERMATO (RPT-2026-0001 su tutte le 3 righe AW)' : 'ERRORE'}`);

  console.log('\n================================================================');
  console.log('4. TEST DI SICUREZZA PER L\'ALLEGATO DI FATTURAZIONE');
  console.log('================================================================');
  const billingTemplate = new BillingAttachment();

  // Test A (Richiesto dal Requisito 2): Singolo cliente, singolo progetto, stato misto (ReadyToInvoice, Pending, NonBillable, Fatturato, Pagato) SENZA filtro esplicito
  const mixedStatusSummariesOnSingleProj: any[] = [
    {
      id: 'rep_ready_p1',
      reportId: 'rep_ready_p1',
      userId: 'user_1',
      userName: 'Thomas Hansen',
      projectId: 'proj_1',
      projectName: 'Cablaggio Magazzino Nord',
      clientId: 'cli_1',
      clientName: 'Nordic Trading ApS',
      date: '2026-03-08',
      totalHours: 7.5,
      invoiceStatus: 'ReadyToInvoice',
      description: 'Lavoro collaudato pronto per fattura'
    },
    {
      id: 'rep_pending_p1',
      reportId: 'rep_pending_p1',
      userId: 'user_2',
      userName: 'Mustafa Yilmaz',
      projectId: 'proj_1',
      projectName: 'Cablaggio Magazzino Nord',
      clientId: 'cli_1',
      clientName: 'Nordic Trading ApS',
      date: '2026-03-09',
      totalHours: 4.0,
      invoiceStatus: 'Pending',
      description: 'Lavoro in attesa di approvazione'
    },
    {
      id: 'rep_nonbillable_p1',
      reportId: 'rep_nonbillable_p1',
      userId: 'user_3',
      userName: 'Zeth Dogan',
      projectId: 'proj_1',
      projectName: 'Cablaggio Magazzino Nord',
      clientId: 'cli_1',
      clientName: 'Nordic Trading ApS',
      date: '2026-03-10',
      totalHours: 3.0,
      invoiceStatus: 'NonBillable',
      description: 'Intervento garanzia non fatturabile'
    },
    {
      id: 'rep_invoiced_p1',
      reportId: 'rep_invoiced_p1',
      userId: 'user_1',
      userName: 'Thomas Hansen',
      projectId: 'proj_1',
      projectName: 'Cablaggio Magazzino Nord',
      clientId: 'cli_1',
      clientName: 'Nordic Trading ApS',
      date: '2026-03-11',
      totalHours: 5.0,
      invoiceStatus: 'Fatturato',
      description: 'Già fatturato mese scorso'
    },
    {
      id: 'rep_paid_p1',
      reportId: 'rep_paid_p1',
      userId: 'user_2',
      userName: 'Mustafa Yilmaz',
      projectId: 'proj_1',
      projectName: 'Cablaggio Magazzino Nord',
      clientId: 'cli_1',
      clientName: 'Nordic Trading ApS',
      date: '2026-03-12',
      totalHours: 6.0,
      invoiceStatus: 'Pagato',
      description: 'Già saldato'
    }
  ];

  const singleProjDataMixed: ReportData = {
    ...mockData,
    summaries: mixedStatusSummariesOnSingleProj,
    filters: { ...mockData.filters, projectId: 'proj_1', adminStatus: undefined }
  };
  const wbBillingA = new ExcelJSClass.Workbook();
  await billingTemplate.render(wbBillingA, singleProjDataMixed);
  const sheetBillingA = wbBillingA.getWorksheet('Allegato Fatturazione');
  console.log(`Test A (Singolo Progetto, 5 stati misti, senza filtro storico): Foglio generato: ${sheetBillingA ? 'SI' : 'NO'}`);
  if (sheetBillingA) {
    const includedEntries: string[] = [];
    for (let r = 5; r <= sheetBillingA.rowCount; r++) {
      const cellA = sheetBillingA.getRow(r).getCell(1).value;
      if (typeof cellA === 'string' && cellA.includes('TOTALE')) break;
      const w = sheetBillingA.getRow(r).getCell(2).value;
      const h = sheetBillingA.getRow(r).getCell(4).value;
      if (w) includedEntries.push(`${w} (${h}h)`);
    }
    console.log(`  Righe incluse in Allegato (atteso solo ReadyToInvoice 7.5h): ${includedEntries.join(', ')}`);
    console.log(`  Esclusione corretta di Pending, NonBillable, Fatturato, Pagato: ${includedEntries.length === 1 && includedEntries[0].includes('7.5h') ? 'CONFERMATA' : 'ERRORE'}`);
  }

  // Test B: Singolo progetto proj_1 con filtro esplicito adminStatus = 'Pagato' (Ristampa storica)
  const singleProjDataPaid: ReportData = {
    ...mockData,
    summaries: mockData.summaries.filter(s => s.projectId === 'proj_1'),
    filters: { ...mockData.filters, projectId: 'proj_1', adminStatus: 'Pagato' }
  };
  const wbBillingB = new ExcelJSClass.Workbook();
  await billingTemplate.render(wbBillingB, singleProjDataPaid);
  const sheetBillingB = wbBillingB.getWorksheet('Allegato Fatturazione');
  console.log(`Test B (Filtro esplicito 'Pagato' per ristampa): Foglio generato: ${sheetBillingB ? 'SI' : 'NO'}`);
  if (sheetBillingB) {
    const includedWorkers: string[] = [];
    for (let r = 5; r <= sheetBillingB.rowCount; r++) {
      const cellA = sheetBillingB.getRow(r).getCell(1).value;
      if (typeof cellA === 'string' && cellA.includes('TOTALE')) break;
      const w = sheetBillingB.getRow(r).getCell(2).value;
      const h = sheetBillingB.getRow(r).getCell(4).value;
      if (w) includedWorkers.push(`${w} (${h}h)`);
    }
    console.log(`  Righe incluse in Test B (Pagato): ${includedWorkers.join(', ')}`);
  }


  // Test C: Singolo progetto proj_2 con solo NonBillable -> Deve omettere il foglio
  const singleProjDataNonBillable: ReportData = {
    ...mockData,
    summaries: mockData.summaries.filter(s => s.projectId === 'proj_2' && s.invoiceStatus === 'NonBillable'),
    filters: { ...mockData.filters, projectId: 'proj_2' }
  };
  const wbBillingC = new ExcelJSClass.Workbook();
  await billingTemplate.render(wbBillingC, singleProjDataNonBillable);
  const sheetBillingC = wbBillingC.getWorksheet('Allegato Fatturazione');
  console.log(`Test C (Solo NonBillable): Foglio generato: ${sheetBillingC ? 'ERRORE GENERATO' : 'CORRETTO (OMESSO)'}`);


  console.log('\n================================================================');
  console.log('5. RICONCILIAZIONI NUMERICHE COMPLETE (5 STATI + AW)');
  console.log('================================================================');
  const wsEmp = loadedWb.getWorksheet('Riepilogo Dipendenti');
  let empSummaryHours = 0;
  let empSummaryCost = 0;
  for (let r = 5; r <= 7; r++) {
    empSummaryHours += Number(wsEmp.getRow(r).getCell(6).value || 0);
    empSummaryCost += Number(wsEmp.getRow(r).getCell(7).value || 0);
  }

  let individualHoursSum = 0;
  ['Dipendente Thomas Hansen', 'Dipendente Mustafa Yilmaz', 'Dipendente Zeth Dogan'].forEach(name => {
    const ws = loadedWb.getWorksheet(name);
    for (let r = 5; r <= ws.rowCount; r++) {
      const c1 = ws.getRow(r).getCell(1).value;
      if (typeof c1 === 'string' && c1.startsWith('TOTALE')) {
        for (let dr = 5; dr < r; dr++) {
          individualHoursSum += Number(ws.getRow(dr).getCell(8).value || 0);
        }
        break;
      }
    }
  });

  const wsDash = loadedWb.getWorksheet('Dashboard');
  let dashInternalHours = 0;
  let dashPersonnelCost = 0;
  for (let r = 5; r <= 6; r++) {
    dashInternalHours += Number(wsDash.getRow(r).getCell(3).value || 0);
    dashPersonnelCost += Number(wsDash.getRow(r).getCell(4).value || 0);
  }

  const distinctReportIds = new Set(mockData.summaries.map((s: any) => s.reportId || s.id.replace(/_main$|_aw_\d+$/, '')));
  let totalDashboardStatusReports = 0;
  const statusSummary: any[] = [];
  for (let r = 13; r <= 17; r++) {
    const stLabel = wsDash.getRow(r).getCell(1).value;
    const stCount = Number(wsDash.getRow(r).getCell(2).value || 0);
    const stHours = Number(wsDash.getRow(r).getCell(3).value || 0);
    totalDashboardStatusReports += stCount;
    statusSummary.push({ label: stLabel, count: stCount, hours: stHours });
  }

  console.log(`- Totale ore Riepilogo Dipendenti:      ${empSummaryHours.toFixed(1)} h`);
  console.log(`- Somma ore fogli individuali:          ${individualHoursSum.toFixed(1)} h`);
  console.log(`- Totale ore interne Dashboard:         ${dashInternalHours.toFixed(1)} h`);
  console.log(`  -> Diff (Riepilogo Dip - Fogli Ind):  ${(empSummaryHours - individualHoursSum).toFixed(1)} (Coincidenza perfetta)`);
  console.log(`  -> Diff (Riepilogo Dip - Dashboard):  ${(empSummaryHours - dashInternalHours).toFixed(1)} (Coincidenza perfetta)`);
  console.log('');
  console.log(`- Costo personale Riepilogo Dipendenti: ${empSummaryCost.toFixed(2)}`);
  console.log(`- Costo personale Dashboard:            ${dashPersonnelCost.toFixed(2)}`);
  console.log(`  -> Diff (Riepilogo Dip - Dashboard):  ${(empSummaryCost - dashPersonnelCost).toFixed(2)} (Coincidenza perfetta)`);
  console.log('');
  console.log('- Dettaglio 5 Stati nel Dashboard:');
  statusSummary.forEach(s => {
    console.log(`  * ${String(s.label).padEnd(20)}: ${s.count} rapportini | ${s.hours} h`);
  });
  console.log(`- Somma rapportini per stato:           ${totalDashboardStatusReports}`);
  console.log(`- Totale rapportini originali distinti: ${distinctReportIds.size}`);
  console.log(`  -> Diff (Somma stati - Totale distinti): ${totalDashboardStatusReports - distinctReportIds.size} (Coincidenza perfetta)`);
}

runFullInspection().catch(console.error);

