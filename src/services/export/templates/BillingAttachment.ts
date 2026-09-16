import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { getCatalogT } from '../i18n-catalog';
import { applyHeaderStyle, applySubHeaderStyle, applyTableHeaderStyle, applyDataStyle, ReportStyles } from '../utils/formatters';
import { parseDateSafe } from '../utils/dateUtils';

export class BillingAttachment implements ReportTemplate {
  name = 'Billing Attachment';
  type = 'ECONOMIC' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    if (!data.summaries || data.summaries.length === 0) return;

    // Safety rule 1: Must concern exactly ONE client and ONE project
    const distinctProjectIds = Array.from(new Set(data.summaries.map(s => s.projectId).filter(Boolean)));
    const distinctClientNames = Array.from(new Set(data.summaries.map(s => s.clientName).filter(Boolean)));

    if (distinctProjectIds.length !== 1 || distinctClientNames.length > 1) {
      return; // Omit worksheet when multiple clients or projects exist
    }

    const targetProjectId = distinctProjectIds[0];
    const project = data.projects.find(p => p.id === targetProjectId);

    // Safety rule 2: Filter eligible summaries
    // - Exclude NonBillable and Pending
    // - Include ReadyToInvoice
    // - Include Fatturato / Pagato only when explicitly selected as filter
    const explicitAdminFilter = data.filters?.adminStatus;

    const eligibleSummaries = data.summaries.filter(r => {
      if (r.projectId !== targetProjectId) return false;
      const status = r.invoiceStatus || 'Pending';
      if (status === 'NonBillable' || status === 'Pending') {
        return false;
      }
      if (status === 'ReadyToInvoice') {
        return true;
      }
      if (status === 'Fatturato' || status === 'Invoiced' || status === 'Pagato' || status === 'Paid') {
        return explicitAdminFilter === status ||
               (explicitAdminFilter === 'Fatturato' && (status === 'Fatturato' || status === 'Invoiced')) ||
               (explicitAdminFilter === 'Pagato' && (status === 'Pagato' || status === 'Paid'));
      }
      return false;
    });

    if (eligibleSummaries.length === 0) {
      return; // Omit worksheet when no billable entries exist
    }

    const t = getCatalogT(data.language);
    const sheet = workbook.addWorksheet(t.sheetBilling, {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'portrait',
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

    sheet.columns = [
      { width: 15 }, // Data (A)
      { width: 22 }, // Operatore (B)
      { width: 45 }, // Descrizione Intervento (C)
      { width: 14 }, // Ore (D)
      { width: 16 }, // Materiali (E)
      { width: 20 }, // Importo (F)
    ];

    // Riga 1: Titolo
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = t.billingTitle;
    applyHeaderStyle(titleCell);
    sheet.getRow(1).height = 30;

    const clientName = eligibleSummaries[0]?.clientName || t.unspecifiedClient;
    const projectName = project?.name || eligibleSummaries[0]?.projectName || '';


    const dateRange = (data.filters?.startDate && data.filters?.endDate)
      ? `${new Date(data.filters.startDate).toLocaleDateString()} - ${new Date(data.filters.endDate).toLocaleDateString()}`
      : (data.filters?.['Dal'] && data.filters?.['Al'])
        ? `${data.filters['Dal']} - ${data.filters['Al']}`
        : t.allPeriod;

    // Riga 2: Sottotitolo
    sheet.mergeCells('A2:F2');
    const subTitleCell = sheet.getCell('A2');
    subTitleCell.value = `${t.clientPrefix}${clientName}  |  ${t.projectPrefix}${projectName}  |  ${t.periodPrefix}${dateRange}`;
    applySubHeaderStyle(subTitleCell);
    sheet.getRow(2).height = 20;

    sheet.getRow(3).height = 10;

    // Intestazioni tabella
    const headers = t.billingHeaders;
    const headerRowIdx = 4;
    headers.forEach((h, i) => {
      const cell = sheet.getCell(headerRowIdx, i + 1);
      cell.value = h;
      applyTableHeaderStyle(cell, i <= 2 ? 'left' : 'center');
    });
    sheet.getRow(headerRowIdx).height = 22;

    // Ordina report
    eligibleSummaries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentRow = 5;
    const firstDataRow = currentRow;
    const hourlyRate = project?.sellingPrice || 0;

    for (const r of eligibleSummaries) {

      const row = sheet.getRow(currentRow);

      // Data reale Excel
      const dateCell = row.getCell(1);
      const parsedDate = parseDateSafe(r.date);
      if (parsedDate) {
        dateCell.value = parsedDate;
        dateCell.numFmt = 'dd/mm/yyyy';
      } else {
        dateCell.value = '';
      }
      applyDataStyle(dateCell, 'center');


      const userCell = row.getCell(2);
      userCell.value = r.userName || t.unspecifiedWorker;
      applyDataStyle(userCell, 'left');

      const descCell = row.getCell(3);
      descCell.value = r.description || t.genericIntervention;
      applyDataStyle(descCell, 'left');

      const hoursCell = row.getCell(4);
      hoursCell.value = Math.round((r.totalHours || 0) * 10) / 10;
      applyDataStyle(hoursCell, 'center');
      hoursCell.numFmt = '0.0 "h"';

      const billedMaterials = (r as any).billedMaterials || 0;
      const matCell = row.getCell(5);
      matCell.value = billedMaterials > 0 ? billedMaterials : 0;
      applyDataStyle(matCell, 'center');
      matCell.numFmt = ReportStyles.currencyFormat;

      let rowAmount = billedMaterials;
      if (project?.financialAgreement === 'hourly') {
        rowAmount += (r.totalHours || 0) * hourlyRate;
      }

      const amtCell = row.getCell(6);
      amtCell.value = rowAmount > 0 ? rowAmount : 0;
      applyDataStyle(amtCell, 'center');
      amtCell.numFmt = ReportStyles.currencyFormat;

      row.height = 20;
      currentRow++;
    }

    const lastDataRow = currentRow - 1;

    // Riga Totale Generale
    sheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const totLabel = sheet.getCell(`A${currentRow}`);
    totLabel.value = t.billingTotal;
    totLabel.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totLabel.alignment = { vertical: 'middle', horizontal: 'left' };
    totLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totLabel.border = ReportStyles.borders.standard;

    sheet.getCell(`B${currentRow}`).border = ReportStyles.borders.standard;
    sheet.getCell(`C${currentRow}`).border = ReportStyles.borders.standard;

    // Totale Ore (D)
    const totHoursCell = sheet.getCell(`D${currentRow}`);
    if (firstDataRow <= lastDataRow) {
      totHoursCell.value = { formula: `SUM(D${firstDataRow}:D${lastDataRow})` } as any;
    } else {
      totHoursCell.value = 0;
    }
    totHoursCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totHoursCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totHoursCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totHoursCell.border = ReportStyles.borders.standard;
    totHoursCell.numFmt = '0.0 "h"';

    // Totale Materiali (E)
    const totMatCell = sheet.getCell(`E${currentRow}`);
    if (firstDataRow <= lastDataRow) {
      totMatCell.value = { formula: `SUM(E${firstDataRow}:E${lastDataRow})` } as any;
    } else {
      totMatCell.value = 0;
    }
    totMatCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totMatCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totMatCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totMatCell.border = ReportStyles.borders.standard;
    totMatCell.numFmt = ReportStyles.currencyFormat;

    // Totale Importo (F)
    const totAmtCell = sheet.getCell(`F${currentRow}`);
    if (project?.financialAgreement === 'fixed') {
      totAmtCell.value = hourlyRate; // Fixed contract selling price
    } else if (firstDataRow <= lastDataRow) {
      totAmtCell.value = { formula: `SUM(F${firstDataRow}:F${lastDataRow})` } as any;
    } else {
      totAmtCell.value = 0;
    }
    totAmtCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totAmtCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totAmtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totAmtCell.border = ReportStyles.borders.standard;
    totAmtCell.numFmt = ReportStyles.currencyFormat;

    sheet.getRow(currentRow).height = 24;
    currentRow += 3;

    // Footer note
    const noteCell = sheet.getCell(`A${currentRow}`);
    noteCell.value = t.billingNote;
    noteCell.font = { name: 'Arial', size: 9, italic: true };
  }
}
