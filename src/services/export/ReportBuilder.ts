import { 
  ReportDocument, 
  ReportBlockType, 
  TableBlock, 
  DashboardBlock, 
  ReportTableColumn,
  ReportSection
} from './types';

// Questi tipi simulano ciò che riceve dalla UI
export interface WorkSession {
  date: string | Date;
  clientName: string;
  projectName: string;
  workerName: string;
  subcontractorName?: string;
  description: string;
  hours: number;
  cost?: number;
  revenue?: number;
  expenses?: number;
  [key: string]: any;
}

export interface ReportBuilderConfig {
  companyName: string;
  clientName?: string;
  projectName?: string;
  generatedBy: string;
  filtersApplied: Record<string, string>;
  includeEconomicData: boolean; // Se true include costi e ricavi
}

export class WorkSummaryReportBuilder {
  constructor(
    private rawData: WorkSession[],
    private config: ReportBuilderConfig
  ) {}

  build(): ReportDocument {
    const document: ReportDocument = {
      metadata: {
        companyName: this.config.companyName,
        clientName: this.config.clientName,
        projectName: this.config.projectName,
        reportContext: 'Sommario Lavori',
        generatedBy: this.config.generatedBy,
        generatedAt: new Date(),
        filtersApplied: this.config.filtersApplied
      },
      sections: []
    };

    // 1. Sezione Dashboard (Totali)
    document.sections.push(this.buildDashboardSection());

    // 2. Sezione Dettaglio Ore (Tabella principale)
    document.sections.push(this.buildDetailsSection());

    return document;
  }

  private buildDashboardSection(): ReportSection {
    let totalHours = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    this.rawData.forEach(r => {
      totalHours += r.hours || 0;
      totalCost += r.cost || 0;
      totalRevenue += r.revenue || 0;
      totalExpenses += r.expenses || 0;
    });

    const kpis: DashboardBlock['kpis'] = [
      { label: 'Ore Lavorate', value: totalHours, type: 'hours' }
    ];

    if (this.config.includeEconomicData) {
      kpis.push({ label: 'Spese Totali', value: totalExpenses, type: 'decimal' });
      kpis.push({ label: 'Costo Personale', value: totalCost, type: 'decimal' });
      kpis.push({ label: 'Ricavo Totale', value: totalRevenue, type: 'decimal' });
      kpis.push({ label: 'Margine', value: totalRevenue - totalCost - totalExpenses, type: 'decimal' });
    }

    const dashboardBlock: DashboardBlock = {
      type: ReportBlockType.DASHBOARD,
      kpis
    };

    return {
      title: 'Dashboard Totali',
      blocks: [dashboardBlock]
    };
  }

  private buildDetailsSection(): ReportSection {
    const columns: ReportTableColumn[] = [
      { key: 'date', header: 'Data', type: 'date' },
      { key: 'clientName', header: 'Cliente', type: 'text' },
      { key: 'projectName', header: 'Progetto', type: 'text' },
      { key: 'workerName', header: 'Collaboratore', type: 'text' },
      { key: 'description', header: 'Descrizione', type: 'text' },
      { key: 'hours', header: 'Ore', type: 'hours' }
    ];

    if (this.config.includeEconomicData) {
      columns.push({ key: 'expenses', header: 'Spese', type: 'decimal' });
      columns.push({ key: 'cost', header: 'Costo', type: 'decimal' });
      columns.push({ key: 'revenue', header: 'Ricavo', type: 'decimal' });
    }

    let totalHours = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    const data = this.rawData.map(r => {
      totalHours += r.hours || 0;
      totalCost += r.cost || 0;
      totalRevenue += r.revenue || 0;
      totalExpenses += r.expenses || 0;

      // Parsing data se arriva come stringa
      let parsedDate = r.date;
      if (typeof parsedDate === 'string') {
        const parts = parsedDate.split(/[-/]/);
        if (parts.length === 3) {
           // Prova a parsarla assuming YYYY-MM-DD o DD/MM/YYYY
           if (parts[0].length === 4) {
             parsedDate = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
           } else {
             parsedDate = new Date(Number(parts[2]), Number(parts[1])-1, Number(parts[0]));
           }
        } else {
           parsedDate = new Date(parsedDate);
        }
      }

      const row: Record<string, any> = {
        date: parsedDate,
        clientName: r.clientName,
        projectName: r.projectName,
        workerName: r.workerName,
        description: r.description,
        hours: r.hours
      };

      if (this.config.includeEconomicData) {
        row.expenses = r.expenses || 0;
        row.cost = r.cost || 0;
        row.revenue = r.revenue || 0;
      }

      return row;
    });

    const totals: Record<string, number> = {
      hours: totalHours
    };

    if (this.config.includeEconomicData) {
      totals.expenses = totalExpenses;
      totals.cost = totalCost;
      totals.revenue = totalRevenue;
    }

    const tableBlock: TableBlock = {
      type: ReportBlockType.TABLE,
      columns,
      data,
      totals
    };

    return {
      title: 'Dettaglio Interventi',
      blocks: [tableBlock]
    };
  }
}
