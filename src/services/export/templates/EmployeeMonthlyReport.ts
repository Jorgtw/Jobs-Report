import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { applyHeaderStyle, applySubHeaderStyle, applyTableHeaderStyle, applyDataStyle, ReportStyles } from '../utils/formatters';

export class EmployeeMonthlyReport implements ReportTemplate {
  name = 'Employee Monthly Report';
  type = 'ECONOMIC' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const reportsByWorker = new Map<string, any[]>();
    for (const r of data.summaries) {
      if (!reportsByWorker.has(r.userId)) {
        reportsByWorker.set(r.userId, []);
      }
      reportsByWorker.get(r.userId)!.push(r);
    }

    for (const [workerId, reports] of Array.from(reportsByWorker.entries())) {
      const workerName = reports[0]?.userName || data.workers?.find(w => w.id === workerId)?.name || workerId;
      
      const sheetName = `Report ${workerName.substring(0, 20)}`;
      const sheet = workbook.addWorksheet(sheetName, {
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
          printTitlesRow: '1:3' // Repeat header
        }
      });

      // 6 Colonne come da immagine: Data, Cliente, Progetto/Attività, Ore ord, Straord, Spese
      sheet.columns = [
        { width: 15 }, // Data
        { width: 25 }, // Cliente
        { width: 45 }, // Progetto / Attività
        { width: 12 }, // Ore ord.
        { width: 12 }, // Straord.
        { width: 15 }, // Spese sostenute
      ];

      // Riga 1: Titolo
      sheet.mergeCells('A1:F1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'REPORT MENSILE DIPENDENTE';
      applyHeaderStyle(titleCell);
      sheet.getRow(1).height = 30;

      // Riga 2: Sottotitolo
      sheet.mergeCells('A2:F2');
      const subTitleCell = sheet.getCell('A2');
      
      const dateRange = (data.filters?.['Dal'] && data.filters?.['Al']) 
        ? `${data.filters['Dal']} - ${data.filters['Al']}`
        : 'Tutto il periodo';

      subTitleCell.value = `Dipendente: ${workerName}  |  Periodo: ${dateRange}  |  ${data.companyName}`;
      applySubHeaderStyle(subTitleCell);
      sheet.getRow(2).height = 20;

      sheet.getRow(3).height = 10;

      // Intestazioni tabella
      const headers = ['Data', 'Cliente', 'Progetto / Attività', 'Ore ord.', 'Straord.', 'Spese sostenute'];
      let currentRow = 4;
      headers.forEach((h, i) => {
        const cell = sheet.getCell(currentRow, i + 1);
        cell.value = h;
        applyTableHeaderStyle(cell, i === 0 || i === 1 || i === 2 ? 'left' : 'center');
      });
      currentRow++;

      // Ordina report cronologicamente
      reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let totalOrd = 0;
      let totalExtra = 0;
      let totalExpenses = 0;

      for (const r of reports) {
        const row = sheet.getRow(currentRow);
        
        const projectDesc = r.description ? `${r.projectName} - ${r.description}` : r.projectName;
        
        const reportExpenses = r.totalExpenses || 0;

        // Data
        row.getCell(1).value = new Date(r.date).toLocaleDateString();
        applyDataStyle(row.getCell(1), 'left');

        // Cliente
        const clientCell = row.getCell(2);
        clientCell.value = r.clientName || r.clientId || 'Multipli';
        applyDataStyle(row.getCell(2), 'left');

        // Progetto / Attività concatenati
        row.getCell(3).value = projectDesc;
        applyDataStyle(row.getCell(3), 'left');

        const extraHours = r.overtimeHours || 0;
        const ordHours = (r.totalHours || 0) - extraHours;

        // Ore ordinarie
        const ordCell = row.getCell(4);
        ordCell.value = ordHours;
        applyDataStyle(ordCell);
        ordCell.numFmt = '0.0 "h"';

        // Straordinari
        const extCell = row.getCell(5);
        extCell.value = extraHours;
        applyDataStyle(extCell);
        extCell.numFmt = '0.0 "h"';

        // Spese sostenute
        const expCell = row.getCell(6);
        expCell.value = reportExpenses;
        applyDataStyle(expCell);
        expCell.numFmt = ReportStyles.currencyFormat;

        totalOrd += ordHours;
        totalExtra += extraHours;
        totalExpenses += reportExpenses;

        currentRow++;
      }

      // Riga Totali (Blu scura)
      sheet.mergeCells(`A${currentRow}:C${currentRow}`);
      const totLabel = sheet.getCell(`A${currentRow}`);
      totLabel.value = 'TOTALE MESE';
      totLabel.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      totLabel.alignment = { vertical: 'middle', horizontal: 'right' };
      totLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
      totLabel.border = ReportStyles.borders.standard;

      const totOrdCell = sheet.getCell(`D${currentRow}`);
      totOrdCell.value = totalOrd;
      totOrdCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      totOrdCell.alignment = { vertical: 'middle', horizontal: 'center' };
      totOrdCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
      totOrdCell.border = ReportStyles.borders.standard;
      totOrdCell.numFmt = '0.0 "h"';

      const totExtCell = sheet.getCell(`E${currentRow}`);
      totExtCell.value = totalExtra;
      totExtCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      totExtCell.alignment = { vertical: 'middle', horizontal: 'center' };
      totExtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
      totExtCell.border = ReportStyles.borders.standard;
      totExtCell.numFmt = '0.0 "h"';

      const totExpCell = sheet.getCell(`F${currentRow}`);
      totExpCell.value = totalExpenses;
      totExpCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      totExpCell.alignment = { vertical: 'middle', horizontal: 'center' };
      totExpCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
      totExpCell.border = ReportStyles.borders.standard;
      totExpCell.numFmt = ReportStyles.currencyFormat;
      
      sheet.getRow(currentRow).height = 25;

      currentRow += 4;

      // Spazio firme
      const signRow = sheet.getRow(currentRow);
      signRow.getCell(1).value = 'Firma dipendente: ___________________________';
      signRow.getCell(4).value = 'Firma responsabile: ___________________________';
    }
  }
}
