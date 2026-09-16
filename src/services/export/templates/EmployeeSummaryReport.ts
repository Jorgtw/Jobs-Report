import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { getCatalogT } from '../i18n-catalog';
import { applyHeaderStyle, applySubHeaderStyle, applyTableHeaderStyle, applyDataStyle, ReportStyles } from '../utils/formatters';

export class EmployeeSummaryReport implements ReportTemplate {
  name = 'Employee Summary Report';
  type = 'ECONOMIC' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const t = getCatalogT(data.language);
    const sheet = workbook.addWorksheet(t.sheetEmpSummary, {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5, right: 0.5,
          top: 0.5, bottom: 0.5,
          header: 0.3, footer: 0.3
        },
        printTitlesRow: '1:4'
      },
      views: [
        { state: 'frozen', xSplit: 1, ySplit: 4 }
      ]
    });

    // Column widths
    sheet.columns = [
      { width: 28 }, // Dipendente (A)
      { width: 16 }, // Ore ordinarie (B)
      { width: 16 }, // Ore extra (C)
      { width: 16 }, // Ore festive (D)
      { width: 16 }, // Ore notturne (E)
      { width: 16 }, // Totale ore (F)
      { width: 22 }  // Costo personale (G)
    ];

    // Riga 1: Titolo
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = t.empSummaryTitle;
    applyHeaderStyle(titleCell);
    sheet.getRow(1).height = 30;

    // Riga 2: Sottotitolo
    sheet.mergeCells('A2:G2');
    const subTitleCell = sheet.getCell('A2');

    const dateRange = (data.filters?.startDate && data.filters?.endDate)
      ? `${new Date(data.filters.startDate).toLocaleDateString()} - ${new Date(data.filters.endDate).toLocaleDateString()}`
      : (data.filters?.['Dal'] && data.filters?.['Al'])
        ? `${data.filters['Dal']} - ${data.filters['Al']}`
        : t.allPeriod;

    subTitleCell.value = `${t.periodPrefix}${dateRange}  |  ${t.companyPrefix}${data.companyName}  |  ${t.generatedPrefix}${new Date().toLocaleDateString()}`;
    applySubHeaderStyle(subTitleCell);
    sheet.getRow(2).height = 20;

    // Riga 3: Spazio
    sheet.getRow(3).height = 10;

    // Riga 4: Intestazioni Tabella
    const headers = t.empSummaryHeaders;
    const headerRowIdx = 4;
    headers.forEach((h, i) => {
      const cell = sheet.getCell(headerRowIdx, i + 1);
      cell.value = h;
      applyTableHeaderStyle(cell, i === 0 ? 'left' : 'center');
    });
    sheet.getRow(headerRowIdx).height = 22;

    // Aggregazione per lavoratore interno (escludendo subappaltatori)
    const workerMap = new Map<string, {
      name: string;
      ordHours: number;
      extraHours: number;
      festiveHours: number;
      nightHours: number;
      totalHours: number;
      personnelCost: number;
    }>();

    for (const r of data.summaries) {
      // Escludi subappaltatori
      if (r.subcontractorId) continue;

      const workerId = r.userId || r.userName || 'unknown';
      const workerName = r.userName || data.workers?.find(w => w.id === r.userId)?.name || r.userId || t.unspecifiedWorker;

      if (!workerMap.has(workerId)) {
        workerMap.set(workerId, {
          name: workerName,
          ordHours: 0,
          extraHours: 0,
          festiveHours: 0,
          nightHours: 0,
          totalHours: 0,
          personnelCost: 0
        });
      }

      const item = workerMap.get(workerId)!;
      const extra = r.overtimeHours || 0;
      const festive = r.festiveHours || 0;
      const night = r.nightHours || 0;
      const tot = r.totalHours || 0;
      const ord = Math.max(0, tot - extra - festive - night);

      item.ordHours += ord;
      item.extraHours += extra;
      item.festiveHours += festive;
      item.nightHours += night;
      item.totalHours += tot;
      item.personnelCost += (r.personnelCost || 0);
    }

    // Filtra chi ha 0 ore e ordina alfabeticamente
    const workerList = Array.from(workerMap.values())
      .filter(w => w.totalHours > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    let currentRow = 5;
    const firstDataRow = currentRow;

    for (const w of workerList) {
      const row = sheet.getRow(currentRow);

      // Col 1: Dipendente
      const nameCell = row.getCell(1);
      nameCell.value = w.name;
      applyDataStyle(nameCell, 'left');

      // Col 2: Ore ordinarie
      const ordCell = row.getCell(2);
      ordCell.value = Math.round(w.ordHours * 10) / 10;
      applyDataStyle(ordCell, 'center');
      ordCell.numFmt = '0.0 "h"';

      // Col 3: Ore extra
      const extraCell = row.getCell(3);
      extraCell.value = Math.round(w.extraHours * 10) / 10;
      applyDataStyle(extraCell, 'center');
      extraCell.numFmt = '0.0 "h"';

      // Col 4: Ore festive
      const festiveCell = row.getCell(4);
      festiveCell.value = Math.round(w.festiveHours * 10) / 10;
      applyDataStyle(festiveCell, 'center');
      festiveCell.numFmt = '0.0 "h"';

      // Col 5: Ore notturne
      const nightCell = row.getCell(5);
      nightCell.value = Math.round(w.nightHours * 10) / 10;
      applyDataStyle(nightCell, 'center');
      nightCell.numFmt = '0.0 "h"';

      // Col 6: Totale ore
      const totCell = row.getCell(6);
      totCell.value = Math.round(w.totalHours * 10) / 10;
      applyDataStyle(totCell, 'center');
      totCell.numFmt = '0.0 "h"';

      // Col 7: Costo personale
      const costCell = row.getCell(7);
      costCell.value = Math.round(w.personnelCost * 100) / 100;
      applyDataStyle(costCell, 'center');
      costCell.numFmt = ReportStyles.currencyFormat;

      sheet.getRow(currentRow).height = 20;
      currentRow++;
    }

    const lastDataRow = currentRow - 1;

    // RIGA TOTALE GENERALE
    const totRow = sheet.getRow(currentRow);
    totRow.height = 24;

    const labelCell = totRow.getCell(1);
    labelCell.value = t.empSummaryTotal;
    labelCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    labelCell.alignment = { vertical: 'middle', horizontal: 'left' };
    labelCell.border = ReportStyles.borders.standard;

    const cols = ['B', 'C', 'D', 'E', 'F', 'G'];
    cols.forEach((colLetter, idx) => {
      const cell = totRow.getCell(idx + 2);
      if (firstDataRow <= lastDataRow) {
        cell.value = { formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})` } as any;
      } else {
        cell.value = 0;
      }
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = ReportStyles.borders.standard;
      if (colLetter === 'G') {
        cell.numFmt = ReportStyles.currencyFormat;
      } else {
        cell.numFmt = '0.0 "h"';
      }
    });
  }
}
