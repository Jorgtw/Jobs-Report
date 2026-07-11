import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { applyHeaderStyle, applySubHeaderStyle, applyTableHeaderStyle, applyDataStyle, ReportStyles } from '../utils/formatters';

export class DashboardCommesse implements ReportTemplate {
  name = 'Dashboard Commesse';
  type = 'ECONOMIC' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    // --- FOGLIO 1: DASHBOARD COMMESSE ---
    const sheetDash = workbook.addWorksheet('Dashboard', {
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
        printTitlesRow: '1:3' // Repeat header
      }
    });

    // Col width setup
    sheetDash.columns = [
      { width: 25 }, // Cliente (A)
      { width: 35 }, // Progetto (B)
      { width: 12 }, // Ore interne (C)
      { width: 18 }, // Costo personale (D)
      { width: 18 }, // Subappalti (E)
      { width: 15 }, // Spese (F)
      { width: 18 }, // Ricavo (G)
      { width: 18 }, // Margine (H)
      { width: 12 }  // Margine % (I)
    ];

    // Riga 1: Titolo
    sheetDash.mergeCells('A1:I1');
    const titleCell = sheetDash.getCell('A1');
    titleCell.value = 'DASHBOARD COMMESSE — Vista Titolare';
    applyHeaderStyle(titleCell);
    sheetDash.getRow(1).height = 30;

    // Riga 2: Info
    sheetDash.mergeCells('A2:I2');
    const subTitleCell = sheetDash.getCell('A2');
    
    const dateRange = (data.filters?.startDate && data.filters?.endDate) 
      ? `${new Date(data.filters.startDate).toLocaleDateString()} - ${new Date(data.filters.endDate).toLocaleDateString()}`
      : 'Tutto il periodo';

    subTitleCell.value = `Periodo: ${dateRange}  |  Azienda: ${data.companyName}  |  Generato il: ${new Date().toLocaleDateString()}`;
    applySubHeaderStyle(subTitleCell);
    sheetDash.getRow(2).height = 20;

    sheetDash.getRow(3).height = 10;

    // Intestazioni tabella
    const headersDash = [
      'Cliente', 'Progetto', 'Ore interne', 'Costo personale', 
      'Subappalti', 'Spese', 'Ricavo', 'Margine', 'Margine %'
    ];
    let currentRowDash = 4;
    headersDash.forEach((h, i) => {
      const cell = sheetDash.getCell(currentRowDash, i + 1);
      cell.value = h;
      applyTableHeaderStyle(cell, 'center');
    });
    currentRowDash++;

    // Calculate aggregated data per project
    const projectStats = new Map<string, any>();
    for (const p of data.projects) {
      projectStats.set(p.id, {
        clientId: p.clientId,
        projectName: p.name,
        hours: 0,
        personnelCost: 0,
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

      stats.hours += (r.totalHours || 0);
      stats.personnelCost += (r.personnelCost || 0);
      stats.expenses += (r.totalExpenses || 0);
    }

    let firstDataRow = currentRowDash;
    let hasMissingPersonnelCost = false;

    for (const stats of Array.from(projectStats.values())) {
      if (stats.hours === 0 && stats.ricavo === 0 && stats.expenses === 0) continue;

      if (stats.financialAgreement === 'hourly') {
        stats.ricavo = stats.hours * stats.sellingPrice;
      } else {
        stats.ricavo = stats.sellingPrice;
      }

      const row = sheetDash.getRow(currentRowDash);
      
      const clientName = data.clients?.find((c: any) => c.id === stats.clientId)?.name || stats.clientId;

      row.getCell(1).value = clientName;
      applyDataStyle(row.getCell(1), 'left');

      row.getCell(2).value = stats.projectName;
      applyDataStyle(row.getCell(2), 'left');

      const hoursCell = row.getCell(3);
      hoursCell.value = stats.hours;
      applyDataStyle(hoursCell);
      hoursCell.numFmt = '0.0 "h"';

      const costCell = row.getCell(4);
      costCell.value = stats.personnelCost;
      applyDataStyle(costCell);
      costCell.numFmt = ReportStyles.currencyFormat; // Con o senza Euro (dipende dal formato. Useremo default senza come discusso, altrimenti '#,##0.00 €')
      
      if (stats.hours > 0 && stats.personnelCost === 0) {
        hasMissingPersonnelCost = true;
      }

      // SUBAPPALTI: FORMULA SUMIFS
      // 'Costi Esterni'!F:F (Importo), 'Costi Esterni'!C:C (Cliente), A[Row], 'Costi Esterni'!D:D (Progetto), B[Row]
      const subCell = row.getCell(5);
      subCell.value = { formula: `SUMIFS('Costi Esterni'!F:F, 'Costi Esterni'!C:C, A${currentRowDash}, 'Costi Esterni'!D:D, B${currentRowDash})` };
      applyDataStyle(subCell);
      subCell.numFmt = ReportStyles.currencyFormat;

      const expCell = row.getCell(6);
      expCell.value = stats.expenses;
      applyDataStyle(expCell);
      expCell.numFmt = ReportStyles.currencyFormat;

      const ricCell = row.getCell(7);
      ricCell.value = stats.ricavo;
      applyDataStyle(ricCell);
      ricCell.numFmt = ReportStyles.currencyFormat;

      // FORMULA Margine: Ricavo (G) - Costo (D) - Subappalti (E) - Spese (F)
      const margCell = row.getCell(8);
      margCell.value = { formula: `G${currentRowDash}-D${currentRowDash}-E${currentRowDash}-F${currentRowDash}` } as any;
      applyDataStyle(margCell);
      margCell.numFmt = ReportStyles.currencyFormat;
      margCell.font = { name: 'Arial', size: 10, bold: true };

      // FORMULA Margine %: Margine (H) / Ricavo (G)
      const percCell = row.getCell(9);
      percCell.value = { formula: `IFERROR(H${currentRowDash}/G${currentRowDash}, 0)` } as any;
      applyDataStyle(percCell);
      percCell.numFmt = '0.0%';

      currentRowDash++;
    }

    const lastDataRow = currentRowDash - 1;

    // RIGA TOTALE GENERALE
    sheetDash.mergeCells(`A${currentRowDash}:B${currentRowDash}`);
    const totLabelCell = sheetDash.getCell(`A${currentRowDash}`);
    totLabelCell.value = 'TOTALE COMMESSE';
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

    // Totale Margine %: Totale Margine (H) / Totale Ricavo (G)
    const totPercCell = sheetDash.getCell(`I${currentRowDash}`);
    totPercCell.value = { formula: `IFERROR(H${currentRowDash}/G${currentRowDash}, 0)` };
    totPercCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totPercCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totPercCell.border = ReportStyles.borders.standard;
    totPercCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totPercCell.numFmt = '0.0%';

    currentRowDash += 2;

    // Footer note
    const noteCell = sheetDash.getCell(`A${currentRowDash}`);
    let footerText = "Margine = Ricavo - Costo personale - Subappalti - Spese. Subappalti collegati in automatico al foglio 'Costi Esterni' (SUMIFS per Cliente + Progetto). Documento ad uso interno: non destinato al cliente.";
    if (hasMissingPersonnelCost) {
      footerText += "\nATTENZIONE: Margine calcolato senza costo personale per alcune commesse (costo interno non disponibile).";
    }
    noteCell.value = footerText;
    noteCell.font = { name: 'Arial', size: 9, italic: true };
    if (hasMissingPersonnelCost) {
      noteCell.font = { name: 'Arial', size: 9, italic: true, bold: true, color: { argb: 'FFFF0000' } };
    }
    sheetDash.getRow(currentRowDash).height = hasMissingPersonnelCost ? 30 : 15;



    // --- FOGLIO 2: COSTI ESTERNI / SUBAPPALTI ---
    const sheetExt = workbook.addWorksheet('Costi Esterni', {
      pageSetup: {
        paperSize: 9, 
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5, right: 0.5,
          top: 0.5, bottom: 0.5,
          header: 0.3, footer: 0.3
        },
        printTitlesRow: '1:3' 
      }
    });

    sheetExt.columns = [
      { width: 15 }, // Data
      { width: 25 }, // Fornitore
      { width: 25 }, // Cliente
      { width: 35 }, // Progetto
      { width: 40 }, // Descrizione
      { width: 15 }  // Importo
    ];

    // Riga 1: Titolo
    sheetExt.mergeCells('A1:F1');
    const extTitleCell = sheetExt.getCell('A1');
    extTitleCell.value = 'COSTI ESTERNI / SUBAPPALTI';
    applyHeaderStyle(extTitleCell);
    sheetExt.getRow(1).height = 30;

    // Riga 2: Info
    sheetExt.mergeCells('A2:F2');
    const extSubTitleCell = sheetExt.getCell('A2');
    extSubTitleCell.value = 'Registro costi di terzi (subappaltatori, tecnici esterni, artigiani) — non tracciati a ore';
    extSubTitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
    extSubTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryBlue } };
    extSubTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheetExt.getRow(2).height = 20;

    sheetExt.getRow(3).height = 10;

    // Intestazioni
    const extHeaders = ['Data', 'Fornitore / Subappaltatore', 'Cliente', 'Progetto / Commessa', 'Descrizione', 'Importo'];
    let extRow = 4;
    extHeaders.forEach((h, i) => {
      const cell = sheetExt.getCell(extRow, i + 1);
      cell.value = h;
      applyTableHeaderStyle(cell, i === 5 ? 'center' : 'left');
    });
    extRow++;

    const firstExtDataRow = extRow;

    if (data.externalCosts && data.externalCosts.length > 0) {
      // Sort external costs by date
      const sortedExtCosts = [...data.externalCosts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const cost of sortedExtCosts) {
        const row = sheetExt.getRow(extRow);
        
        const clientName = data.clients?.find((c: any) => c.id === cost.clientId)?.name || cost.clientId;
        const project = data.projects.find(p => p.id === cost.projectId);
        const projectName = project?.name || cost.projectId;

        row.getCell(1).value = new Date(cost.date).toLocaleDateString();
        applyDataStyle(row.getCell(1), 'left');

        row.getCell(2).value = cost.supplierName || '';
        applyDataStyle(row.getCell(2), 'left');

        row.getCell(3).value = clientName;
        applyDataStyle(row.getCell(3), 'left');

        row.getCell(4).value = projectName;
        applyDataStyle(row.getCell(4), 'left');

        row.getCell(5).value = cost.description || '';
        applyDataStyle(row.getCell(5), 'left');

        const amtCell = row.getCell(6);
        amtCell.value = cost.amount || 0;
        applyDataStyle(amtCell);
        amtCell.numFmt = ReportStyles.currencyFormat;

        extRow++;
      }
    }

    const lastExtDataRow = extRow - 1;

    // Totale Costi Esterni
    sheetExt.mergeCells(`A${extRow}:E${extRow}`);
    const totExtLabel = sheetExt.getCell(`A${extRow}`);
    totExtLabel.value = 'TOTALE COSTI ESTERNI';
    totExtLabel.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totExtLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totExtLabel.alignment = { vertical: 'middle', horizontal: 'right' };
    totExtLabel.border = ReportStyles.borders.standard;

    const totExtAmt = sheetExt.getCell(`F${extRow}`);
    if (firstExtDataRow <= lastExtDataRow) {
      totExtAmt.value = { formula: `SUM(F${firstExtDataRow}:F${lastExtDataRow})` };
    } else {
      totExtAmt.value = 0;
    }
    totExtAmt.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totExtAmt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totExtAmt.alignment = { vertical: 'middle', horizontal: 'center' };
    totExtAmt.border = ReportStyles.borders.standard;
    totExtAmt.numFmt = ReportStyles.currencyFormat;
  }
}
