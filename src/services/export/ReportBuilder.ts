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
  ordinaryHours?: number;
  extraHours?: number;
  nightHours?: number;
  holidayHours?: number;
  cost?: number;
  revenue?: number;
  expenses?: number;
  materialsCost?: number;
  subcontractorCost?: number;
  [key: string]: any;
}

export interface ReportBuilderConfig {
  companyName: string;
  clientName?: string;
  projectName?: string;
  generatedBy: string;
  filtersApplied: Record<string, string>;
  includeEconomicData: boolean;
  groupBy?: 'none' | 'project' | 'worker'; // Supported aggregations
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

    // 1. Riepilogo Testuale (SUMMARY)
    document.sections.push(this.buildSummarySection());

    // 2. Sezione Dashboard (Totali)
    document.sections.push(this.buildDashboardSection());

    // 3. Sezione Dettaglio (o Aggregato)
    if (this.config.groupBy && this.config.groupBy !== 'none') {
      document.sections.push(this.buildAggregatedSection(this.config.groupBy));
    } else {
      document.sections.push(this.buildDetailsSection());
    }

    return document;
  }

  private buildSummarySection(): ReportSection {
    let totalOrd = 0, totalExt = 0, totalNight = 0, totalHol = 0, totalHours = 0;
    let totalCost = 0, totalMat = 0, totalSub = 0, totalExp = 0;
    const workers = new Set<string>();

    this.rawData.forEach(r => {
      totalOrd += r.ordinaryHours || 0;
      totalExt += r.extraHours || 0;
      totalNight += r.nightHours || 0;
      totalHol += r.holidayHours || 0;
      totalHours += r.hours || 0;
      
      totalCost += r.cost || 0;
      totalMat += r.materialsCost || 0;
      totalSub += r.subcontractorCost || 0;
      totalExp += r.expenses || 0;
      if (r.workerName) workers.add(r.workerName);
    });

    const groups: any[] = [];
    
    // Gruppo generale
    groups.push({
      items: [
        { label: 'Collaboratori', value: workers.size, type: 'number' },
        { label: 'Totale Interventi', value: this.rawData.length, type: 'number' }
      ]
    });

    // Gruppo Ore
    groups.push({
      title: 'Ore',
      items: [
        { label: 'Ordinarie', value: totalOrd, type: 'hours' },
        { label: 'Extra', value: totalExt, type: 'hours' },
        { label: 'Notturne', value: totalNight, type: 'hours' },
        { label: 'Festive', value: totalHol, type: 'hours' },
        { label: 'Totale Ore', value: totalHours, type: 'hours' }
      ]
    });

    // Gruppo Costi
    if (this.config.includeEconomicData) {
      groups.push({
        title: 'Costi Operativi',
        items: [
          { label: 'Personale', value: totalCost, type: 'decimal' },
          { label: 'Materiali', value: totalMat, type: 'decimal' },
          { label: 'Subappalti', value: totalSub, type: 'decimal' },
          { label: 'Altre Spese', value: totalExp, type: 'decimal' }
        ]
      });
    }

    return {
      title: 'Riepilogo Documento',
      blocks: [
        {
          type: ReportBlockType.SUMMARY,
          groups
        }
      ]
    };
  }

  private buildDashboardSection(): ReportSection {
    let totalHours = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    const workers = new Set<string>();

    this.rawData.forEach(r => {
      totalHours += r.hours || 0;
      totalCost += r.cost || 0;
      totalRevenue += r.revenue || 0;
      totalExpenses += r.expenses || 0;
      if (r.workerName) workers.add(r.workerName);
    });

    const kpis: DashboardBlock['kpis'] = [
      { label: 'Collaboratori', value: workers.size, type: 'number' },
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
      { key: 'ordinaryHours', header: 'Ordinarie', type: 'hours' },
      { key: 'extraHours', header: 'Extra', type: 'hours' },
      { key: 'nightHours', header: 'Notturne', type: 'hours' },
      { key: 'holidayHours', header: 'Festive', type: 'hours' },
      { key: 'hours', header: 'Tot. Ore', type: 'hours' }
    ];

    if (this.config.includeEconomicData) {
      columns.push({ key: 'expenses', header: 'Spese', type: 'decimal' });
      columns.push({ key: 'cost', header: 'Costo', type: 'decimal' });
      columns.push({ key: 'revenue', header: 'Ricavo', type: 'decimal' });
    }

    let totalHours = 0, totalOrd = 0, totalExt = 0, totalNight = 0, totalHol = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    const data = this.rawData.map(r => {
      totalHours += r.hours || 0;
      totalOrd += r.ordinaryHours || 0;
      totalExt += r.extraHours || 0;
      totalNight += r.nightHours || 0;
      totalHol += r.holidayHours || 0;
      totalCost += r.cost || 0;
      totalRevenue += r.revenue || 0;
      totalExpenses += r.expenses || 0;

      // Parsing data se arriva come stringa
      let parsedDate = r.date;
      if (typeof parsedDate === 'string') {
        const parts = parsedDate.split(/[-/]/);
        if (parts.length === 3) {
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
        ordinaryHours: r.ordinaryHours || 0,
        extraHours: r.extraHours || 0,
        nightHours: r.nightHours || 0,
        holidayHours: r.holidayHours || 0,
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
      ordinaryHours: totalOrd,
      extraHours: totalExt,
      nightHours: totalNight,
      holidayHours: totalHol,
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

  private buildAggregatedSection(groupBy: 'project' | 'worker'): ReportSection {
    const columns: ReportTableColumn[] = [
      { key: 'groupName', header: groupBy === 'project' ? 'Progetto' : 'Collaboratore', type: 'text' },
      { key: 'ordinaryHours', header: 'Ordinarie', type: 'hours' },
      { key: 'extraHours', header: 'Extra', type: 'hours' },
      { key: 'hours', header: 'Tot. Ore', type: 'hours' }
    ];

    if (this.config.includeEconomicData) {
      columns.push({ key: 'cost', header: 'Costo', type: 'decimal' });
      columns.push({ key: 'revenue', header: 'Ricavo', type: 'decimal' });
    }

    const grouped = new Map<string, any>();
    let totalOrd = 0, totalExt = 0, totalHours = 0, totalCost = 0, totalRevenue = 0;

    this.rawData.forEach(r => {
      const key = groupBy === 'project' ? (r.projectName || 'N/A') : (r.workerName || 'N/A');
      if (!grouped.has(key)) {
        grouped.set(key, {
          groupName: key,
          ordinaryHours: 0,
          extraHours: 0,
          hours: 0,
          cost: 0,
          revenue: 0
        });
      }
      const group = grouped.get(key);
      group.ordinaryHours += r.ordinaryHours || 0;
      group.extraHours += r.extraHours || 0;
      group.hours += r.hours || 0;
      group.cost += r.cost || 0;
      group.revenue += r.revenue || 0;

      totalOrd += r.ordinaryHours || 0;
      totalExt += r.extraHours || 0;
      totalHours += r.hours || 0;
      totalCost += r.cost || 0;
      totalRevenue += r.revenue || 0;
    });

    const totals: Record<string, number> = {
      ordinaryHours: totalOrd,
      extraHours: totalExt,
      hours: totalHours
    };

    if (this.config.includeEconomicData) {
      totals.cost = totalCost;
      totals.revenue = totalRevenue;
    }

    const tableBlock: TableBlock = {
      type: ReportBlockType.TABLE,
      columns,
      data: Array.from(grouped.values()).sort((a, b) => a.groupName.localeCompare(b.groupName)),
      totals
    };

    return {
      title: `Riepilogo per ${groupBy === 'project' ? 'Progetto' : 'Collaboratore'}`,
      blocks: [tableBlock]
    };
  }
}
