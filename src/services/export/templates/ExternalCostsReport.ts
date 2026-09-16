import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { getCatalogT } from '../i18n-catalog';
import { applyHeaderStyle, applySubHeaderStyle, applyTableHeaderStyle, applyDataStyle, ReportStyles } from '../utils/formatters';
import { parseDateSafe } from '../utils/dateUtils';

export class ExternalCostsReport implements ReportTemplate {

  name = 'External Costs Register';
  type = 'ECONOMIC' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const t = getCatalogT(data.language);

    const sheetExt = workbook.addWorksheet(t.sheetExtCosts, {
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

    sheetExt.columns = [
      { width: 15 }, // Data (A)
      { width: 25 }, // Fornitore (B)
      { width: 25 }, // Cliente (C)
      { width: 35 }, // Progetto (D)
      { width: 40 }, // Descrizione (E)
      { width: 18 }  // Importo (F)
    ];

    // Riga 1: Titolo
    sheetExt.mergeCells('A1:F1');
    const extTitleCell = sheetExt.getCell('A1');
    extTitleCell.value = t.extTitle;
    applyHeaderStyle(extTitleCell);
    sheetExt.getRow(1).height = 30;

    // Riga 2: Info
    sheetExt.mergeCells('A2:F2');
    const extSubTitleCell = sheetExt.getCell('A2');
    extSubTitleCell.value = t.extSubtitle;
    applySubHeaderStyle(extSubTitleCell);
    sheetExt.getRow(2).height = 20;

    // Riga 3: Spazio
    sheetExt.getRow(3).height = 10;

    // Riga 4: Intestazioni
    const extHeaders = t.extHeaders;
    const headerRowIdx = 4;
    extHeaders.forEach((h, i) => {
      const cell = sheetExt.getCell(headerRowIdx, i + 1);
      cell.value = h;
      applyTableHeaderStyle(cell, i === 5 ? 'center' : 'left');
    });
    sheetExt.getRow(headerRowIdx).height = 22;

    let extRow = 5;
    const firstExtDataRow = extRow;

    if (data.externalCosts && data.externalCosts.length > 0) {
      const sortedExtCosts = [...data.externalCosts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const cost of sortedExtCosts) {
        const row = sheetExt.getRow(extRow);

        const clientName = data.clients?.find((c: any) => c.id === cost.clientId)?.name || cost.clientId;
        const project = data.projects.find(p => p.id === cost.projectId);
        const projectName = project?.name || cost.projectId;

        // Data reale Excel
        const dateCell = row.getCell(1);
        const parsedDate = parseDateSafe(cost.date);
        if (parsedDate) {
          dateCell.value = parsedDate;
          dateCell.numFmt = 'dd/mm/yyyy';
        } else {
          dateCell.value = '';
        }
        applyDataStyle(dateCell, 'center');


        // Fornitore
        const supCell = row.getCell(2);
        supCell.value = cost.supplierName || '';
        applyDataStyle(supCell, 'left');

        // Cliente
        const cliCell = row.getCell(3);
        cliCell.value = clientName || '';
        applyDataStyle(cliCell, 'left');

        // Progetto
        const projCell = row.getCell(4);
        projCell.value = projectName || '';
        applyDataStyle(projCell, 'left');

        // Descrizione
        const descCell = row.getCell(5);
        descCell.value = cost.description || '';
        applyDataStyle(descCell, 'left');

        // Importo
        const amtCell = row.getCell(6);
        amtCell.value = cost.amount || 0;
        applyDataStyle(amtCell, 'center');
        amtCell.numFmt = ReportStyles.currencyFormat;

        sheetExt.getRow(extRow).height = 20;
        extRow++;
      }
    }

    const lastExtDataRow = extRow - 1;

    // Totale Costi Esterni
    sheetExt.mergeCells(`A${extRow}:E${extRow}`);
    const totExtLabel = sheetExt.getCell(`A${extRow}`);
    totExtLabel.value = t.extTotal;
    totExtLabel.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totExtLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totExtLabel.alignment = { vertical: 'middle', horizontal: 'right' };
    totExtLabel.border = ReportStyles.borders.standard;

    const totExtAmt = sheetExt.getCell(`F${extRow}`);
    if (firstExtDataRow <= lastExtDataRow) {
      totExtAmt.value = { formula: `SUM(F${firstExtDataRow}:F${lastExtDataRow})` } as any;
    } else {
      totExtAmt.value = 0;
    }
    totExtAmt.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totExtAmt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totExtAmt.alignment = { vertical: 'middle', horizontal: 'center' };
    totExtAmt.border = ReportStyles.borders.standard;
    totExtAmt.numFmt = ReportStyles.currencyFormat;

    sheetExt.getRow(extRow).height = 24;
  }
}
