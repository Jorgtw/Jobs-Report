import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { getCatalogT } from '../i18n-catalog';
import { applyHeaderStyle, applySubHeaderStyle, applyTableHeaderStyle, applyDataStyle, ReportStyles } from '../utils/formatters';

export class DashboardCommesse implements ReportTemplate {
  name = 'Dashboard Commesse';
  type = 'ECONOMIC' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const t = getCatalogT(data.language);

    // --- FOGLIO 1: DASHBOARD COMMESSE ---
    const sheetDash = workbook.addWorksheet(t.sheetDashboard, {
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
        { state: 'frozen', xSplit: 2, ySplit: 4 }
      ]
    });

    // Col width setup
    sheetDash.columns = [
      { width: 25 }, // Cliente (A)
      { width: 35 }, // Progetto (B)
      { width: 14 }, // Ore interne (C)
      { width: 18 }, // Costo personale (D)
      { width: 18 }, // Subappalti (E)
      { width: 15 }, // Spese (F)
      { width: 18 }, // Ricavo (G)
      { width: 18 }, // Margine (H)
      { width: 14 }  // Margine % (I)
    ];

    // Riga 1: Titolo
    sheetDash.mergeCells('A1:I1');
    const titleCell = sheetDash.getCell('A1');
    titleCell.value = t.dashTitle;
    applyHeaderStyle(titleCell);
    sheetDash.getRow(1).height = 30;

    // Riga 2: Info
    sheetDash.mergeCells('A2:I2');
    const subTitleCell = sheetDash.getCell('A2');

    const dateRange = (data.filters?.startDate && data.filters?.endDate)
      ? `${new Date(data.filters.startDate).toLocaleDateString()} - ${new Date(data.filters.endDate).toLocaleDateString()}`
      : (data.filters?.['Dal'] && data.filters?.['Al'])
        ? `${data.filters['Dal']} - ${data.filters['Al']}`
        : t.allPeriod;

    subTitleCell.value = `${t.periodPrefix}${dateRange}  |  ${t.companyPrefix}${data.companyName}  |  ${t.generatedPrefix}${new Date().toLocaleDateString()}`;
    applySubHeaderStyle(subTitleCell);
    sheetDash.getRow(2).height = 20;

    sheetDash.getRow(3).height = 10;

    // Intestazioni tabella principale
    const headersDash = t.dashHeaders;
    const headerRowIdx = 4;
    headersDash.forEach((h, i) => {
      const cell = sheetDash.getCell(headerRowIdx, i + 1);
      cell.value = h;
      applyTableHeaderStyle(cell, i <= 1 ? 'left' : 'center');
    });
    sheetDash.getRow(headerRowIdx).height = 22;

    let currentRowDash = 5;

    // Aggregazione dati per progetto
    const projectStats = new Map<string, any>();
    for (const p of data.projects) {
      projectStats.set(p.id, {
        clientId: p.clientId,
        projectName: p.name,
        hours: 0,
        internalHours: 0,
        personnelCost: 0,
        subcontractorCost: 0,
        expenses: 0,
        ricavo: 0,
        financialAgreement: p.financialAgreement,
        sellingPrice: p.sellingPrice || 0
      });
    }

    for (const r of data.summaries) {
      if (!r.projectId) continue;
      const stats = projectStats.get(r.projectId);
      if (!stats) continue;

      const isSub = !!r.subcontractorId;
      const rHours = r.totalHours || 0;

      stats.hours += rHours;
      if (!isSub) {
        stats.internalHours += rHours;
      }
      stats.personnelCost += (r.personnelCost || 0);
      stats.subcontractorCost += (r.subcontractorCost || 0);
      stats.expenses += (r.totalExpenses || 0);
    }

    const firstDataRow = currentRowDash;
    let hasMissingPersonnelCost = false;

    for (const stats of Array.from(projectStats.values())) {
      if (stats.hours === 0 && stats.ricavo === 0 && stats.expenses === 0) continue;

      if (stats.financialAgreement === 'hourly') {
        stats.ricavo = stats.hours * stats.sellingPrice;
      } else {
        stats.ricavo = stats.sellingPrice;
      }

      const row = sheetDash.getRow(currentRowDash);
      const clientName = data.clients?.find((c: any) => c.id === stats.clientId)?.name || stats.clientId || '';

      row.getCell(1).value = clientName;
      applyDataStyle(row.getCell(1), 'left');

      row.getCell(2).value = stats.projectName;
      applyDataStyle(row.getCell(2), 'left');

      const hoursCell = row.getCell(3);
      hoursCell.value = Math.round(stats.internalHours * 10) / 10;
      applyDataStyle(hoursCell, 'center');
      hoursCell.numFmt = '0.0 "h"';

      const costCell = row.getCell(4);
      costCell.value = Math.round(stats.personnelCost * 100) / 100;
      applyDataStyle(costCell, 'center');
      costCell.numFmt = ReportStyles.currencyFormat;

      if (stats.hours > 0 && stats.personnelCost === 0) {
        hasMissingPersonnelCost = true;
      }

      // Subappalti: formula SUMIFS dal foglio Costi Esterni + costi orari subappalti
      const subCell = row.getCell(5);
      const subCost = stats.subcontractorCost || 0;
      subCell.value = {
        formula: `SUMIFS('${t.sheetExtCosts}'!F:F, '${t.sheetExtCosts}'!C:C, A${currentRowDash}, '${t.sheetExtCosts}'!D:D, B${currentRowDash}) + ${subCost}`
      } as any;
      applyDataStyle(subCell, 'center');
      subCell.numFmt = ReportStyles.currencyFormat;

      const expCell = row.getCell(6);
      expCell.value = Math.round(stats.expenses * 100) / 100;
      applyDataStyle(expCell, 'center');
      expCell.numFmt = ReportStyles.currencyFormat;

      const ricCell = row.getCell(7);
      ricCell.value = Math.round(stats.ricavo * 100) / 100;
      applyDataStyle(ricCell, 'center');
      ricCell.numFmt = ReportStyles.currencyFormat;

      // Margine = G - D - E - F
      const margCell = row.getCell(8);
      margCell.value = { formula: `G${currentRowDash}-D${currentRowDash}-E${currentRowDash}-F${currentRowDash}` } as any;
      applyDataStyle(margCell, 'center');
      margCell.numFmt = ReportStyles.currencyFormat;
      margCell.font = { name: 'Arial', size: 10, bold: true };

      // Margine % = Margine / Ricavo
      const percCell = row.getCell(9);
      percCell.value = { formula: `IFERROR(H${currentRowDash}/G${currentRowDash}, 0)` } as any;
      applyDataStyle(percCell, 'center');
      percCell.numFmt = '0.0%';

      sheetDash.getRow(currentRowDash).height = 20;
      currentRowDash++;
    }

    const lastDataRow = currentRowDash - 1;

    // RIGA TOTALE GENERALE
    sheetDash.mergeCells(`A${currentRowDash}:B${currentRowDash}`);
    const totLabelCell = sheetDash.getCell(`A${currentRowDash}`);
    totLabelCell.value = t.dashTotal;
    totLabelCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totLabelCell.alignment = { vertical: 'middle', horizontal: 'left' };
    totLabelCell.border = ReportStyles.borders.standard;

    sheetDash.getCell(`B${currentRowDash}`).border = ReportStyles.borders.standard;

    const colsToSum = ['C', 'D', 'E', 'F', 'G', 'H'];
    colsToSum.forEach(col => {
      const cell = sheetDash.getCell(`${col}${currentRowDash}`);
      if (firstDataRow <= lastDataRow) {
        cell.value = { formula: `SUM(${col}${firstDataRow}:${col}${lastDataRow})` } as any;
      } else {
        cell.value = 0;
      }
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
      cell.border = ReportStyles.borders.standard;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (col === 'C') cell.numFmt = '0.0 "h"';
      else cell.numFmt = ReportStyles.currencyFormat;
    });

    // Totale Margine %
    const totPercCell = sheetDash.getCell(`I${currentRowDash}`);
    totPercCell.value = { formula: `IFERROR(H${currentRowDash}/G${currentRowDash}, 0)` } as any;
    totPercCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totPercCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totPercCell.border = ReportStyles.borders.standard;
    totPercCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totPercCell.numFmt = '0.0%';

    sheetDash.getRow(currentRowDash).height = 24;
    currentRowDash += 2;

    // Note esplicative
    const noteCell = sheetDash.getCell(`A${currentRowDash}`);
    let footerText = t.dashNote.replace('{extSheet}', t.sheetExtCosts);
    if (hasMissingPersonnelCost) {
      footerText += t.dashWarning;
    }
    noteCell.value = footerText;
    noteCell.font = { name: 'Arial', size: 9, italic: true };
    if (hasMissingPersonnelCost) {
      noteCell.font = { name: 'Arial', size: 9, italic: true, bold: true, color: { argb: 'FFFF0000' } };
    }
    sheetDash.getRow(currentRowDash).height = hasMissingPersonnelCost ? 28 : 16;
    currentRowDash += 2;

    // --- SEZIONE: RIEPILOGO STATI AMMINISTRATIVI ---
    const statusCodes = ['Pending', 'ReadyToInvoice', 'Fatturato', 'Pagato', 'NonBillable'] as const;

    sheetDash.mergeCells(`A${currentRowDash}:C${currentRowDash}`);
    const statusSecTitle = sheetDash.getCell(`A${currentRowDash}`);
    statusSecTitle.value = t.dashStatusSummaryTitle;
    statusSecTitle.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    statusSecTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    statusSecTitle.alignment = { vertical: 'middle', horizontal: 'left' };
    sheetDash.getRow(currentRowDash).height = 24;
    currentRowDash++;

    // Intestazioni tabella stati
    const statusHeaders = t.dashStatusHeaders;
    statusHeaders.forEach((h, i) => {
      const cell = sheetDash.getCell(currentRowDash, i + 1);
      cell.value = h;
      applyTableHeaderStyle(cell, i === 0 ? 'left' : 'center');
    });
    sheetDash.getRow(currentRowDash).height = 20;
    currentRowDash++;

    const firstStatusRow = currentRowDash;

    for (const code of statusCodes) {
      const row = sheetDash.getRow(currentRowDash);
      const label = t.adminStatusLabels[code] || code;

      // Filtra le voci con questo stato (considerando Pending come fallback)
      const matching = data.summaries.filter(s => (s.invoiceStatus || 'Pending') === code);

      // Conteggio distinto dei rapportini (evitando duplicazioni AW indipendentemente da underscore nell'ID)
      const distinctReportsCount = new Set(matching.map(s => s.reportId || s.id.replace(/_main$|_aw_\d+$/, ''))).size;

      // Somma ore effettive
      const totalHours = matching.reduce((sum, s) => sum + (s.totalHours || 0), 0);

      // Col 1: Stato
      const c1 = row.getCell(1);
      c1.value = label;
      applyDataStyle(c1, 'left');

      // Col 2: Numero rapportini
      const c2 = row.getCell(2);
      c2.value = distinctReportsCount;
      applyDataStyle(c2, 'center');
      c2.numFmt = '#,##0';

      // Col 3: Totale ore
      const c3 = row.getCell(3);
      c3.value = Math.round(totalHours * 10) / 10;
      applyDataStyle(c3, 'center');
      c3.numFmt = '0.0 "h"';

      row.height = 19;
      currentRowDash++;
    }

    const lastStatusRow = currentRowDash - 1;

    // Totale Sezione Stati
    const totStatusRow = sheetDash.getRow(currentRowDash);
    totStatusRow.height = 22;

    const totStLabel = totStatusRow.getCell(1);
    totStLabel.value = t.empSummaryTotal;
    totStLabel.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    totStLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totStLabel.alignment = { vertical: 'middle', horizontal: 'left' };
    totStLabel.border = ReportStyles.borders.standard;

    const totStCount = totStatusRow.getCell(2);
    totStCount.value = { formula: `SUM(B${firstStatusRow}:B${lastStatusRow})` } as any;
    totStCount.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    totStCount.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totStCount.alignment = { vertical: 'middle', horizontal: 'center' };
    totStCount.border = ReportStyles.borders.standard;
    totStCount.numFmt = '#,##0';

    const totStHours = totStatusRow.getCell(3);
    totStHours.value = { formula: `SUM(C${firstStatusRow}:C${lastStatusRow})` } as any;
    totStHours.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    totStHours.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totStHours.alignment = { vertical: 'middle', horizontal: 'center' };
    totStHours.border = ReportStyles.borders.standard;
    totStHours.numFmt = '0.0 "h"';
  }
}
