import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { applyHeaderStyle, applySubHeaderStyle, applyTableHeaderStyle, applyDataStyle, ReportStyles } from '../utils/formatters';

export class BillingAttachment implements ReportTemplate {
  name = 'Billing Attachment';
  type = 'ECONOMIC' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const sheet = workbook.addWorksheet('Allegato Fatturazione', {
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

    sheet.columns = [
      { width: 15 }, // Data
      { width: 20 }, // Operatore
      { width: 45 }, // Descrizione Intervento
      { width: 12 }, // Ore
      { width: 15 }, // Materiali
      { width: 20 }, // Importo
    ];

    // Riga 1: Titolo
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'ALLEGATO DI FATTURAZIONE';
    applyHeaderStyle(titleCell);
    sheet.getRow(1).height = 30;

    // Assumiamo che questo report venga generato tipicamente per UN singolo progetto o UN cliente alla volta
    // Recupera la prima commessa trovata (i filtri garantiranno che sia filtrato per singola commessa)
    const firstSummary = data.summaries[0];
    if (!firstSummary) return;

    const projectId = firstSummary.projectId;
    const project = data.projects.find(p => p.id === projectId);
    const clientName = firstSummary.clientName || 'Cliente non specificato';
    const projectName = project?.name || 'Multipli';

    const dateRange = (data.filters?.['Dal'] && data.filters?.['Al']) 
      ? `${data.filters['Dal']} - ${data.filters['Al']}`
      : 'Tutto il periodo';

    // Riga 2: Sottotitolo
    sheet.mergeCells('A2:F2');
    const subTitleCell = sheet.getCell('A2');
    subTitleCell.value = `Cliente: ${clientName}  |  Progetto: ${projectName}  |  Periodo: ${dateRange}`;
    applySubHeaderStyle(subTitleCell);
    sheet.getRow(2).height = 20;

    sheet.getRow(3).height = 10;

    // Intestazioni tabella
    const headers = ['Data', 'Operatore', 'Descrizione intervento', 'Ore', 'Materiali', 'Importo'];
    let currentRow = 4;
    headers.forEach((h, i) => {
      const cell = sheet.getCell(currentRow, i + 1);
      cell.value = h;
      applyTableHeaderStyle(cell, i === 2 ? 'left' : 'center');
    });
    currentRow++;

    // Ordina report
    data.summaries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let totalHours = 0;
    let totalMaterials = 0;
    let totalAmount = 0;
    const hourlyRate = project?.sellingPrice || 0; // If hourly

    for (const r of data.summaries) {
      const row = sheet.getRow(currentRow);
      
      row.getCell(1).value = new Date(r.date).toLocaleDateString();
      applyDataStyle(row.getCell(1));

      row.getCell(2).value = r.userName || 'Sconosciuto';
      applyDataStyle(row.getCell(2), 'left');

      row.getCell(3).value = r.description || 'Intervento';
      applyDataStyle(row.getCell(3), 'left');

      const hoursCell = row.getCell(4);
      hoursCell.value = r.totalHours || 0;
      applyDataStyle(hoursCell);
      hoursCell.numFmt = '0.0 "h"';

      // Materiali Fatturabili al Cliente (non il costo interno di acquisto)
      // Assumiamo che il sistema fornisca un campo specifico per i materiali addebitabili al cliente
      const billedMaterials = (r as any).billedMaterials || 0;
      const matCell = row.getCell(5);
      matCell.value = billedMaterials > 0 ? billedMaterials : '';
      applyDataStyle(matCell);
      if (billedMaterials > 0) matCell.numFmt = ReportStyles.currencyFormat;

      // Importo (Ore * Tariffa se hourly, altrimenti solo i materiali)
      let rowAmount = billedMaterials;
      if (project?.financialAgreement === 'hourly') {
        rowAmount += (r.totalHours || 0) * hourlyRate;
      }
      
      const amtCell = row.getCell(6);
      amtCell.value = rowAmount > 0 ? rowAmount : '';
      applyDataStyle(amtCell);
      if (rowAmount > 0) amtCell.numFmt = ReportStyles.currencyFormat;

      totalHours += (r.totalHours || 0);
      totalMaterials += billedMaterials;
      totalAmount += rowAmount;

      currentRow++;
    }

    // Se l'accordo è a forfait (fixed), sovrascriviamo l'importo totale in base al prezzo fisso
    if (project?.financialAgreement === 'fixed') {
      totalAmount = hourlyRate; // For fixed pricing, sellingPrice is the total
    }

    // Riga Totale Generale
    sheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const totLabel = sheet.getCell(`A${currentRow}`);
    totLabel.value = 'TOTALE DA FATTURARE';
    totLabel.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    totLabel.alignment = { vertical: 'middle', horizontal: 'right' };
    totLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };

    const totHoursCell = sheet.getCell(`D${currentRow}`);
    totHoursCell.value = totalHours;
    totHoursCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    totHoursCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totHoursCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totHoursCell.numFmt = '0.0 "h"';

    const totMatCell = sheet.getCell(`E${currentRow}`);
    totMatCell.value = totalMaterials;
    totMatCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    totMatCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totMatCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    if (totalMaterials > 0) totMatCell.numFmt = ReportStyles.currencyFormat;

    const totAmtCell = sheet.getCell(`F${currentRow}`);
    totAmtCell.value = totalAmount;
    totAmtCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    totAmtCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totAmtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    totAmtCell.numFmt = ReportStyles.currencyFormat;

    sheet.getRow(currentRow).height = 25;

    currentRow += 3;

    // Footer note
    const noteCell = sheet.getCell(`A${currentRow}`);
    noteCell.value = 'Documento a supporto della fattura n. ________ — non sostituisce la fattura fiscale';
    noteCell.font = { name: 'Arial', size: 9, italic: true };
  }
}
