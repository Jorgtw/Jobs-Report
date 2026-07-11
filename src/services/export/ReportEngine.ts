import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { WorkReport, Project, AdditionalWorker, Expense } from '../../types';

import { ReportSummary } from '../../types';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  projectId?: string;
  clients?: any[];
  [key: string]: any;
}

export interface ExternalCost {
  id: string;
  date: string;
  supplierName: string;
  clientId: string;
  projectId: string;
  description: string;
  amount: number;
}

export interface ReportData {
  summaries: ReportSummary[];
  projects: any[]; 
  workers: any[]; 
  clients?: any[];
  externalCosts?: ExternalCost[];
  filters?: ReportFilters;
  companyName: string;
}

export interface ReportTemplate {
  name: string;
  type: 'OPERATIVE' | 'ECONOMIC';
  render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void>;
}

export class ProfessionalReportEngine {
  private workbook: ExcelJS.Workbook;
  private templates: Map<string, ReportTemplate> = new Map();

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.setupWorkbookDefaults();
  }

  private setupWorkbookDefaults() {
    this.workbook.creator = 'Jobs-Report Engine';
    this.workbook.lastModifiedBy = 'Jobs-Report Engine';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
  }

  public registerTemplate(id: string, template: ReportTemplate) {
    this.templates.set(id, template);
  }

  public async generateReport(templateId: string, data: ReportData): Promise<Blob> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Initialize fresh workbook
    this.workbook = new ExcelJS.Workbook();
    this.setupWorkbookDefaults();

    // Render template
    await template.render(this.workbook, data);

    // Generate blob
    const buffer = await this.workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  public async downloadReport(templateId: string, data: ReportData, filename: string) {
    const blob = await this.generateReport(templateId, data);
    saveAs(blob, `${filename}.xlsx`);
  }

  public async generateCatalog(data: ReportData, filename: string) {
    this.workbook = new ExcelJS.Workbook();
    this.setupWorkbookDefaults();

    for (const template of Array.from(this.templates.values())) {
      await template.render(this.workbook, data);
    }

    const buffer = await this.workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename}.xlsx`);
  }
}
