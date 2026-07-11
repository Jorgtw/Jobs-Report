import * as ExcelJS from 'exceljs';
import { ReportData } from './services/export/ReportEngine';
import { CustomerWorkReport } from './services/export/templates/CustomerWorkReport';
import { DashboardCommesse } from './services/export/templates/DashboardCommesse';
import { WeeklyReport } from './services/export/templates/WeeklyReport';
import { EmployeeMonthlyReport } from './services/export/templates/EmployeeMonthlyReport';
import { BillingAttachment } from './services/export/templates/BillingAttachment';
import { WorkEntriesRegister } from './services/export/templates/WorkEntriesRegister';
import { ProjectRevenueRegister } from './services/export/templates/ProjectRevenueRegister';
// Mock imports removed

async function generateCatalog() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Jobs-Report System';
  workbook.created = new Date();

  // Dati realistici come richiesto
  const mockData: ReportData = {
    companyName: 'Acme Installazioni Srl',
    filters: {
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      clients: [
        { id: 'cli_1', name: 'Nordic Trading ApS' }
      ]
    },
    projects: [
      {
        id: 'proj_1',
        clientId: 'cli_1',
        name: 'Cablaggio Magazzino Nord',
        financialAgreement: 'fixed',
        sellingPrice: 14800, // Ricavo atteso / Expected Revenue
      } as any
    ],
    workers: [
      { id: 'user_1', full_name: 'Mikkel Andersen', hourlyRate: 30 }
    ],
    summaries: [
      {
        id: 'rep_1_main',
        userId: 'user_1',
        userName: 'Mikkel Andersen',
        projectId: 'proj_1',
        projectName: 'Cablaggio Magazzino Nord',
        clientId: 'cli_1',
        clientName: 'Nordic Trading ApS',
        date: '2026-06-10T08:00:00Z',
        startTime: '08:00',
        endTime: '18:00',
        breakHours: 0,
        totalHours: 10,
        overtimeHours: 0,
        personnelCost: 300, 
        subcontractorCost: 0,
        totalExpenses: 310,
        revenue: 0,
        cost: 610,
        overtimeCost: 0,
        description: 'Posa canaline principali',
        activityType: 'work',
        expenses: [{ id: 'exp_1', type: 'Pedaggio', amount: 310, description: 'Autostrada' } as any],
        createdAt: Date.now()
      },
      {
        id: 'rep_2_main',
        userId: 'user_1',
        userName: 'Mikkel Andersen',
        projectId: 'proj_1',
        projectName: 'Cablaggio Magazzino Nord',
        clientId: 'cli_1',
        clientName: 'Nordic Trading ApS',
        date: '2026-06-11T08:00:00Z',
        startTime: '08:00',
        endTime: '18:00',
        breakHours: 0,
        totalHours: 10,
        overtimeHours: 0,
        personnelCost: 300,
        subcontractorCost: 0,
        totalExpenses: 300,
        revenue: 0,
        cost: 600,
        overtimeCost: 0,
        description: 'Stesura cavi',
        activityType: 'work',
        expenses: [{ id: 'exp_2', type: 'Materiale', amount: 300, description: 'Cavi' } as any],
        createdAt: Date.now()
      },
      {
        id: 'rep_3_main',
        userId: 'user_1',
        userName: 'Mikkel Andersen',
        projectId: 'proj_1',
        projectName: 'Cablaggio Magazzino Nord',
        clientId: 'cli_1',
        clientName: 'Nordic Trading ApS',
        date: '2026-06-12T08:00:00Z',
        startTime: '08:00',
        endTime: '18:00',
        breakHours: 0,
        totalHours: 10,
        overtimeHours: 0,
        personnelCost: 300,
        subcontractorCost: 0,
        totalExpenses: 0,
        revenue: 0,
        cost: 300,
        overtimeCost: 0,
        description: 'Collegamento quadro',
        activityType: 'work',
        expenses: [],
        createdAt: Date.now()
      }
    ],
    clients: [
      { id: 'cli_1', name: 'Acme Corp' },
      { id: 'cli_2', name: 'Globex Inc' }
    ],
    externalCosts: [
      {
        id: 'ext_1',
        date: '2026-06-12T00:00:00Z',
        supplierName: 'Hansen ApS',
        clientId: 'cli_1',
        projectId: 'proj_1',
        description: 'Installazione specializzata',
        amount: 2500
      },
      {
        id: 'ext_2',
        date: '2026-06-20T00:00:00Z',
        supplierName: 'Hansen ApS',
        clientId: 'cli_1',
        projectId: 'proj_1',
        description: 'Assistenza tecnica quadro',
        amount: 300
      }
    ]
  };

  // Istanziamo tutti i template
  const templates = [
    new DashboardCommesse(),
    new CustomerWorkReport(),
    new WeeklyReport(),
    new EmployeeMonthlyReport(),
    new BillingAttachment(),
    new WorkEntriesRegister(),
    new ProjectRevenueRegister()
  ];

  // Renderizziamo ogni template nello stesso workbook
  for (const t of templates) {
    await t.render(workbook, mockData);
  }

  // Salvataggio del file
  const outputPath = 'C:\\Users\\jtw\\.gemini\\antigravity\\brain\\cd05c094-7716-42c1-b75a-9042319a53d0\\Jobs_Report_Template_Catalog.xlsx';
  await workbook.xlsx.writeFile(outputPath);
  console.log('Catalog generated successfully at', outputPath);
}

generateCatalog().catch(console.error);
