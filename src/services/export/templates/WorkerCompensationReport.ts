import type * as ExcelJS from 'exceljs';
import type { ReportData, ReportTemplate } from '../ReportEngine';
import { resolveKey, type Language } from '../../../i18n';

/** Additive sheet: legacy sheets and customer billing keep their existing schema. */
export class WorkerCompensationReport implements ReportTemplate {
  name = 'Worker compensation';
  type = 'ECONOMIC' as const;
  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    if (!data.summaries.some(r => r.compensationMethod && r.compensationMethod !== 'HOURLY')) return;
    const t = (key: string) => resolveKey((data.language || 'it') as Language, key);
    const sheet = workbook.addWorksheet(t('reports.workerCompensation').slice(0, 31));
    sheet.addRow([t('reports.headerDate'), t('common.projects'), t('common.personnel'), t('reports.compensationMethod'), t('reports.totalHoursLabel'), t('reports.completedQuantity'), t('reports.unitName'), t('reports.unitRate'), t('reports.fixedAmount'), t('reports.compensationCost')]);
    for (const r of data.summaries) {
      sheet.addRow([r.date, r.projectName, r.userName, t(r.compensationMethod === 'PER_UNIT' ? 'reports.compensationPerUnit' : r.compensationMethod === 'FIXED_PROJECT' ? 'reports.compensationFixed' : 'reports.compensationHourly'), r.totalHours, r.completedQuantity ?? null, r.unitName || '', r.unitRate ?? null, r.fixedCostRecognized ? r.fixedAmount ?? null : null, r.cost]);
    }
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach(c => { c.width = 22; });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.addRow([t('reports.fixedCompensationHelp')]);
  }
}
