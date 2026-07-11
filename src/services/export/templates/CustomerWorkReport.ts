import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { applyHeaderStyle, applySubHeaderStyle, applyTableHeaderStyle, applyDataStyle, ReportStyles } from '../utils/formatters';

export class CustomerWorkReport implements ReportTemplate {
  name = 'Customer Work Report';
  type = 'OPERATIVE' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const sheet = workbook.addWorksheet('Rapporto Lavori', {
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
        printTitlesRow: '1:3' // Repeat header on every page
      }
    });

    // Col width setup
    sheet.columns = [
      { width: 15 }, // Date
      { width: 20 }, // Worker
      { width: 35 }, // Activity
      { width: 10 }, // Hours
      { width: 10 }, // Start
      { width: 10 }, // End
      { width: 10 }  // Break
    ];

    // Build Header
    const clientName = data.filters?.['Cliente'] || 'Tutti i Clienti';
      
    const dateRange = (data.filters?.['Dal'] && data.filters?.['Al']) 
      ? `${data.filters['Dal']} - ${data.filters['Al']}`
      : 'Tutto il periodo';

    // Riga 1: Titolo principale
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'RAPPORTO LAVORI SVOLTI';
    applyHeaderStyle(titleCell);
    sheet.getRow(1).height = 30;

    // Riga 2: Sottotitolo (Cliente | Periodo)
    sheet.mergeCells('A2:G2');
    const subTitleCell = sheet.getCell('A2');
    subTitleCell.value = `Cliente: ${clientName}  |  Periodo: ${dateRange}`;
    applySubHeaderStyle(subTitleCell);
    sheet.getRow(2).height = 20;

    // Spazio vuoto
    sheet.getRow(3).height = 10;

    // Ordina i dati per data crescente
    const sortedData = [...data.summaries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Raggruppa i dati per Progetto
    const reportsByProject = new Map<string, typeof sortedData>();
    for (const r of sortedData) {
      if (!r.projectId) continue;
      if (!reportsByProject.has(r.projectId)) {
        reportsByProject.set(r.projectId, []);
      }
      reportsByProject.get(r.projectId)!.push(r);
    }

    let currentRow = 4;
    let grandTotalHours = 0;

    // Iterate projects
    for (const [projectId, reports] of Array.from(reportsByProject.entries())) {
      const project = data.projects.find(p => p.id === projectId);
      const projectName = project ? project.name : 'Progetto Sconosciuto';

      // Titolo progetto (Blu scuro)
      sheet.mergeCells(`A${currentRow}:G${currentRow}`);
      const projTitleCell = sheet.getCell(`A${currentRow}`);
      projTitleCell.value = projectName;
      projTitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      projTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryBlue } };
      projTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
      sheet.getRow(currentRow).height = 25;
      currentRow++;

      // Intestazioni tabella
      const headers = ['Data', 'Operatore', 'Attività', 'Ore', 'Inizio', 'Fine', 'Pausa'];
      headers.forEach((h, i) => {
        const cell = sheet.getCell(currentRow, i + 1);
        cell.value = h;
        applyTableHeaderStyle(cell, i === 2 ? 'left' : 'center');
      });
      currentRow++;

      let projectHours = 0;

      for (const r of reports) {
        const row = sheet.getRow(currentRow);
        // Date
        const dateCell = row.getCell(1);
        dateCell.value = new Date(r.date).toLocaleDateString();
        applyDataStyle(dateCell);

        const workerCell = row.getCell(2);
        workerCell.value = r.userName || r.userId || 'Non specificato';
        applyDataStyle(workerCell, 'left');

        const descCell = row.getCell(3);
        descCell.value = r.description || 'Intervento generico';
        applyDataStyle(descCell, 'left');

        const hoursCell = row.getCell(4);
        hoursCell.value = r.totalHours || 0;
        applyDataStyle(hoursCell);
        hoursCell.numFmt = '0.0 "h"';

        const startCell = row.getCell(5);
        startCell.value = r.startTime || '';
        applyDataStyle(startCell);

        const endCell = row.getCell(6);
        endCell.value = r.endTime || '';
        applyDataStyle(endCell);

        const breakCell = row.getCell(7);
        breakCell.value = r.breakHours || 0;
        applyDataStyle(breakCell);
        breakCell.numFmt = '0.0 "h"';

        projectHours += (r.totalHours || 0);
        grandTotalHours += (r.totalHours || 0);
        currentRow++;
      }

      // Totale Progetto
      sheet.mergeCells(`A${currentRow}:C${currentRow}`);
      const totLabelCell = sheet.getCell(`A${currentRow}`);
      totLabelCell.value = `Totale ore — ${projectName}`;
      totLabelCell.font = { name: 'Arial', size: 10, bold: true };
      totLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };
      totLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.lightGray } };
      totLabelCell.border = ReportStyles.borders.standard;

      const totValCell = sheet.getCell(`D${currentRow}`);
      totValCell.value = projectHours;
      totValCell.font = { name: 'Arial', size: 10, bold: true };
      totValCell.alignment = { vertical: 'middle', horizontal: 'center' };
      totValCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.lightGray } };
      totValCell.border = ReportStyles.borders.standard;
      totValCell.numFmt = '0.0 "h"';

      currentRow += 2; // Spazio vuoto
    }

    // Totale Generale
    sheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const grandLabelCell = sheet.getCell(`A${currentRow}`);
    grandLabelCell.value = 'TOTALE ORE PERIODO';
    grandLabelCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    grandLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };
    grandLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    
    const grandValCell = sheet.getCell(`D${currentRow}`);
    grandValCell.value = grandTotalHours;
    grandValCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    grandValCell.alignment = { vertical: 'middle', horizontal: 'center' };
    grandValCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    grandValCell.numFmt = '0.0 "h"';
    sheet.getRow(currentRow).height = 25;
    
    currentRow += 3;

    // Firme
    const signRow = sheet.getRow(currentRow);
    signRow.getCell(1).value = 'Firma responsabile: ___________________________';
    signRow.getCell(3).value = 'Data: ____________________';
  }
}
