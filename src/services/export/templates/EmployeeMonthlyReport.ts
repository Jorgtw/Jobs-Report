import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { getCatalogT } from '../i18n-catalog';
import { applyHeaderStyle, applySubHeaderStyle, applyTableHeaderStyle, applyDataStyle, ReportStyles } from '../utils/formatters';
import { parseDateSafe } from '../utils/dateUtils';

function sanitizeSheetName(name: string, existingNames: Set<string>): string {

  // Rimuove caratteri vietati in Excel: \ / ? * : [ ]
  let cleaned = name.replace(/[\\/?*:[\]]/g, '').trim();
  if (!cleaned) cleaned = 'Worker';

  // Massimo 31 caratteri
  if (cleaned.length > 31) {
    cleaned = cleaned.substring(0, 31).trim();
  }

  // Gestione collisioni
  if (!existingNames.has(cleaned.toLowerCase())) {
    existingNames.add(cleaned.toLowerCase());
    return cleaned;
  }

  let counter = 2;
  while (true) {
    const suffix = ` ${counter}`;
    const maxBaseLen = 31 - suffix.length;
    const candidate = `${cleaned.substring(0, maxBaseLen).trim()}${suffix}`;
    if (!existingNames.has(candidate.toLowerCase())) {
      existingNames.add(candidate.toLowerCase());
      return candidate;
    }
    counter++;
  }
}

export class EmployeeMonthlyReport implements ReportTemplate {
  name = 'Employee Report';
  type = 'ECONOMIC' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const t = getCatalogT(data.language);
    const reportsByWorker = new Map<string, any[]>();

    for (const r of data.summaries) {
      // Escludi i subappaltatori se presenti
      if (r.subcontractorId) continue;

      const workerKey = r.userId || r.userName || 'unknown';
      if (!reportsByWorker.has(workerKey)) {
        reportsByWorker.set(workerKey, []);
      }
      reportsByWorker.get(workerKey)!.push(r);
    }

    const usedSheetNames = new Set<string>();
    // Pre-popola con i fogli già esistenti nel workbook
    workbook.eachSheet(sheet => {
      usedSheetNames.add(sheet.name.toLowerCase());
    });

    for (const [workerKey, reports] of Array.from(reportsByWorker.entries())) {
      const workerName = reports[0]?.userName || data.workers?.find(w => w.id === workerKey)?.name || workerKey;

      // Genera nome foglio sanitizzato
      const rawSheetName = `${t.sheetWorkerPrefix}${workerName}`;
      const sheetName = sanitizeSheetName(rawSheetName, usedSheetNames);

      const sheet = workbook.addWorksheet(sheetName, {
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
          { state: 'frozen', ySplit: 4 }
        ]
      });

      // 9 Colonne: Data, Cliente, Progetto/Attività, Ore ord., Extra, Festive, Notturne, Totale ore, Spese
      sheet.columns = [
        { width: 14 }, // Data (A)
        { width: 22 }, // Cliente (B)
        { width: 35 }, // Progetto / Attività (C)
        { width: 13 }, // Ore ord. (D)
        { width: 13 }, // Ore extra (E)
        { width: 13 }, // Ore festive (F)
        { width: 13 }, // Ore notturne (G)
        { width: 13 }, // Totale ore (H)
        { width: 16 }  // Spese sostenute (I)
      ];

      // Riga 1: Titolo
      sheet.mergeCells('A1:I1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = t.workerReportTitle;
      applyHeaderStyle(titleCell);
      sheet.getRow(1).height = 30;

      // Riga 2: Sottotitolo
      sheet.mergeCells('A2:I2');
      const subTitleCell = sheet.getCell('A2');

      const dateRange = (data.filters?.startDate && data.filters?.endDate)
        ? `${new Date(data.filters.startDate).toLocaleDateString()} - ${new Date(data.filters.endDate).toLocaleDateString()}`
        : (data.filters?.['Dal'] && data.filters?.['Al'])
          ? `${data.filters['Dal']} - ${data.filters['Al']}`
          : t.allPeriod;

      subTitleCell.value = `${t.workerPrefixReport}${workerName}  |  ${t.periodPrefix}${dateRange}  |  ${t.companyPrefix}${data.companyName}`;
      applySubHeaderStyle(subTitleCell);
      sheet.getRow(2).height = 20;

      // Riga 3: Spazio
      sheet.getRow(3).height = 10;

      // Riga 4: Intestazioni tabella
      const headers = t.workerHeaders;
      const headerRowIdx = 4;
      headers.forEach((h, i) => {
        const cell = sheet.getCell(headerRowIdx, i + 1);
        cell.value = h;
        applyTableHeaderStyle(cell, i <= 2 ? 'left' : 'center');
      });
      sheet.getRow(headerRowIdx).height = 22;

      // Ordina report cronologicamente
      reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let currentRow = 5;
      const firstDataRow = currentRow;

      for (const r of reports) {
        const row = sheet.getRow(currentRow);
        const projectDesc = r.description ? `${r.projectName} - ${r.description}` : r.projectName;
        const reportExpenses = r.totalExpenses || 0;

        const extraHours = r.overtimeHours || 0;
        const festiveHours = r.festiveHours || 0;
        const nightHours = r.nightHours || 0;
        const totalHours = r.totalHours || 0;
        const ordHours = Math.max(0, totalHours - extraHours - festiveHours - nightHours);

        // Col 1: Data reale
        const dCell = row.getCell(1);
        const parsedDate = parseDateSafe(r.date);
        if (parsedDate) {
          dCell.value = parsedDate;
          dCell.numFmt = 'dd/mm/yyyy';
        } else {
          dCell.value = '';
        }
        applyDataStyle(dCell, 'center');


        // Col 2: Cliente
        const clientCell = row.getCell(2);
        clientCell.value = r.clientName || r.clientId || '';
        applyDataStyle(clientCell, 'left');

        // Col 3: Progetto / Attività
        const descCell = row.getCell(3);
        descCell.value = projectDesc || '';
        applyDataStyle(descCell, 'left');
        descCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Col 4: Ore ordinarie
        const ordCell = row.getCell(4);
        ordCell.value = Math.round(ordHours * 10) / 10;
        applyDataStyle(ordCell, 'center');
        ordCell.numFmt = '0.0 "h"';

        // Col 5: Ore extra
        const extCell = row.getCell(5);
        extCell.value = Math.round(extraHours * 10) / 10;
        applyDataStyle(extCell, 'center');
        extCell.numFmt = '0.0 "h"';

        // Col 6: Ore festive
        const festCell = row.getCell(6);
        festCell.value = Math.round(festiveHours * 10) / 10;
        applyDataStyle(festCell, 'center');
        festCell.numFmt = '0.0 "h"';

        // Col 7: Ore notturne
        const nightCell = row.getCell(7);
        nightCell.value = Math.round(nightHours * 10) / 10;
        applyDataStyle(nightCell, 'center');
        nightCell.numFmt = '0.0 "h"';

        // Col 8: Totale ore
        const totHoursCell = row.getCell(8);
        totHoursCell.value = Math.round(totalHours * 10) / 10;
        applyDataStyle(totHoursCell, 'center');
        totHoursCell.numFmt = '0.0 "h"';

        // Col 9: Spese sostenute
        const expCell = row.getCell(9);
        expCell.value = Math.round(reportExpenses * 100) / 100;
        applyDataStyle(expCell, 'center');
        expCell.numFmt = ReportStyles.currencyFormat;

        const descLength = (projectDesc || '').length;
        const lineCount = Math.max(1, Math.ceil(descLength / 35));
        row.height = Math.max(20, lineCount * 18);
        currentRow++;
      }


      const lastDataRow = currentRow - 1;

      // Riga Totali
      sheet.mergeCells(`A${currentRow}:C${currentRow}`);
      const totLabel = sheet.getCell(`A${currentRow}`);
      totLabel.value = `${t.workerTotalPrefix}${workerName}`.toUpperCase();
      totLabel.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      totLabel.alignment = { vertical: 'middle', horizontal: 'left' };
      totLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
      totLabel.border = ReportStyles.borders.standard;

      sheet.getCell(`B${currentRow}`).border = ReportStyles.borders.standard;
      sheet.getCell(`C${currentRow}`).border = ReportStyles.borders.standard;

      const numCols = ['D', 'E', 'F', 'G', 'H', 'I'];
      numCols.forEach(colLetter => {
        const cell = sheet.getCell(`${colLetter}${currentRow}`);
        if (firstDataRow <= lastDataRow) {
          cell.value = { formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})` } as any;
        } else {
          cell.value = 0;
        }
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
        cell.border = ReportStyles.borders.standard;

        if (colLetter === 'I') {
          cell.numFmt = ReportStyles.currencyFormat;
        } else {
          cell.numFmt = '0.0 "h"';
        }
      });

      sheet.getRow(currentRow).height = 24;
      currentRow += 4;

      // Spazio firme
      const signRow = sheet.getRow(currentRow);
      signRow.getCell(1).value = t.signEmployee;
      signRow.getCell(5).value = t.signManager;
    }
  }
}
