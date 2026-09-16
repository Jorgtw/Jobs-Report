import ExcelJS from 'exceljs';
import { ReportData } from './services/export/ReportEngine';
import { DashboardCommesse } from './services/export/templates/DashboardCommesse';
import { EmployeeSummaryReport } from './services/export/templates/EmployeeSummaryReport';
import { ExternalCostsReport } from './services/export/templates/ExternalCostsReport';
import { CustomerWorkReport } from './services/export/templates/CustomerWorkReport';
import { EmployeeMonthlyReport } from './services/export/templates/EmployeeMonthlyReport';
import { BillingAttachment } from './services/export/templates/BillingAttachment';
import { WorkEntriesRegister } from './services/export/templates/WorkEntriesRegister';
import { ProjectRevenueRegister } from './services/export/templates/ProjectRevenueRegister';

async function generateCatalog() {
  const ExcelJSClass = (ExcelJS as any).default || ExcelJS;
  const workbook = new ExcelJSClass.Workbook();
  workbook.creator = 'Jobs-Report System';
  workbook.created = new Date();

  const mockData: ReportData = {
    companyName: 'MK EL-TEKNIK APS',
    language: 'it',
    filters: {
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      clients: [
        { id: 'cli_1', name: 'Nordic Trading ApS' },
        { id: 'cli_2', name: 'Danmark Byg A/S' }
      ]
    },
    projects: [
      {
        id: 'proj_1',
        clientId: 'cli_1',
        name: 'Cablaggio Magazzino Nord',
        financialAgreement: 'hourly',
        sellingPrice: 65, // Hourly rate
        status: 'Attivo'
      } as any,
      {
        id: 'proj_2',
        clientId: 'cli_2',
        name: 'Rifacimento Impianto Elettrico',
        financialAgreement: 'fixed',
        sellingPrice: 12500, // Fixed price
        status: 'Attivo'
      } as any
    ],
    workers: [
      { id: 'user_1', name: 'Thomas Hansen', hourlyRate: 35, overtimeHourlyRate: 50 },
      { id: 'user_2', name: 'Mustafa Yilmaz', hourlyRate: 32, overtimeHourlyRate: 48 },
      { id: 'user_sub', name: 'Elektro Sub Contractor ApS', hourlyRate: 45, subcontractorId: 'sub_1' }
    ],
    clients: [
      { id: 'cli_1', name: 'Nordic Trading ApS' },
      { id: 'cli_2', name: 'Danmark Byg A/S' }
    ],
    summaries: [
      {
        id: 'rep_1_main',
        userId: 'user_1',
        userName: 'Thomas Hansen',
        projectId: 'proj_1',
        projectName: 'Cablaggio Magazzino Nord',
        clientId: 'cli_1',
        clientName: 'Nordic Trading ApS',
        date: '2026-03-05',
        startTime: '08:00',
        endTime: '17:00',
        breakHours: 1,
        totalHours: 8,
        overtimeHours: 2,
        festiveHours: 0,
        nightHours: 0,
        subcontractorCost: 0,
        personnelCost: 280,
        revenue: 520,
        cost: 280,
        overtimeCost: 100,
        totalExpenses: 45,
        invoiceStatus: 'Pagato',
        description: 'Posa cavi dorsale',
        activityType: 'work',
        expenses: [{ id: 'exp_1', type: 'Pedaggio', amount: 45, description: 'Ponte Storebælt' } as any],
        createdAt: Date.now()
      },
      {
        id: 'rep_2_main',
        userId: 'user_2',
        userName: 'Mustafa Yilmaz',
        projectId: 'proj_1',
        projectName: 'Cablaggio Magazzino Nord',
        clientId: 'cli_1',
        clientName: 'Nordic Trading ApS',
        date: '2026-03-06',
        startTime: '08:00',
        endTime: '16:30',
        breakHours: 0.5,
        totalHours: 8,
        overtimeHours: 0,
        festiveHours: 0,
        nightHours: 0,
        subcontractorCost: 0,
        personnelCost: 256,
        revenue: 520,
        cost: 256,
        overtimeCost: 0,
        totalExpenses: 0,
        invoiceStatus: 'ReadyToInvoice',
        description: 'Montaggio prese e quadri',
        activityType: 'work',
        expenses: [],
        createdAt: Date.now()
      },
      {
        id: 'rep_3_main',
        userId: 'user_1',
        userName: 'Thomas Hansen',
        projectId: 'proj_2',
        projectName: 'Rifacimento Impianto Elettrico',
        clientId: 'cli_2',
        clientName: 'Danmark Byg A/S',
        date: '2026-03-10',
        startTime: '20:00',
        endTime: '04:00',
        breakHours: 0,
        totalHours: 8,
        overtimeHours: 0,
        festiveHours: 0,
        nightHours: 4,
        subcontractorCost: 0,
        personnelCost: 280,
        revenue: 0,
        cost: 280,
        overtimeCost: 0,
        totalExpenses: 0,
        invoiceStatus: 'Fatturato',
        description: 'Lavori notturni interruzione linea',
        activityType: 'work',
        expenses: [],
        createdAt: Date.now()
      },
      {
        id: 'rep_4_main',
        userId: 'user_sub',
        userName: 'Elektro Sub Contractor ApS',
        projectId: 'proj_2',
        projectName: 'Rifacimento Impianto Elettrico',
        clientId: 'cli_2',
        clientName: 'Danmark Byg A/S',
        date: '2026-03-12',
        startTime: '08:00',
        endTime: '16:00',
        breakHours: 0,
        totalHours: 8,
        overtimeHours: 0,
        festiveHours: 0,
        nightHours: 0,
        personnelCost: 0,
        subcontractorCost: 360,
        subcontractorId: 'sub_1',
        revenue: 0,
        cost: 360,
        overtimeCost: 0,
        totalExpenses: 0,
        invoiceStatus: 'Pending',
        description: 'Certificazione cablaggio specializzato',
        activityType: 'work',
        expenses: [],
        createdAt: Date.now()
      }
    ],
    externalCosts: [
      {
        id: 'ext_1',
        date: '2026-03-15',
        supplierName: 'Grossista Elettrico AS',
        clientId: 'cli_1',
        projectId: 'proj_1',
        description: 'Fornitura cavi speciali e interruttori',
        amount: 1850
      }
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
    await t.render(workbook, mockData);
  }

  const outputPath = 'C:\\Users\\jtw\\Euro JTW\\Archivi\\JTW\\Programmi\\jobs-report-complete\\test_export_v3.xlsx';
  await workbook.xlsx.writeFile(outputPath);
  console.log('Test catalog successfully generated at', outputPath);

  console.log('Worksheet structure:');
  workbook.eachSheet((ws: any, id: any) => {
    console.log(`  ${id}. "${ws.name}" (${ws.rowCount} rows)`);
  });
}

generateCatalog().catch(console.error);
