import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';

export class ProjectRevenueRegister implements ReportTemplate {
  name = 'Project Revenue Register';
  type = 'ECONOMIC' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const sheet = workbook.addWorksheet('Registro Ricavi', {
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
      },
      views: [
        { state: 'frozen', xSplit: 2, ySplit: 3 }
      ]
    });

    // Riga 1: Titolo
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'REGISTRO RICAVI / COMMESSE (PROJECT REVENUE REGISTER)';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }; 
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    // Riga 2: Sottotitolo (uso interno)
    sheet.mergeCells('A2:F2');
    const subTitleCell = sheet.getCell('A2');
    subTitleCell.value = `USO INTERNO AMMINISTRAZIONE — Non da inviare al cliente  |  Sorgente dati per Dashboard Commesse`;
    subTitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
    subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F75B5' } }; 
    subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    const tableRows: any[][] = [];

    for (const p of data.projects) {
      const clientName = data.clients?.find((c: any) => c.id === p.clientId)?.name || p.clientId || '';
      
      let financialMethod = p.financialAgreement === 'fixed' ? 'Forfait (Fixed)' : 
                           (p.financialAgreement === 'hourly' ? 'A consuntivo (Hourly)' : (p.financialAgreement || ''));
      
      let period = '';
      if (p.startDate && p.endDate) {
        period = `${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}`;
      } else if (p.startDate) {
        period = `Dal ${new Date(p.startDate).toLocaleDateString()}`;
      }

      tableRows.push([
        clientName,
        p.name || '',
        financialMethod,
        p.sellingPrice || 0,
        period,
        p.status || 'Attivo'
      ]);
    }

    sheet.addTable({
      name: 'RegistroRicaviTable',
      ref: 'A3',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Cliente', filterButton: true },
        { name: 'Progetto / Commessa', filterButton: true },
        { name: 'Metodo Fatturazione', filterButton: true },
        { name: 'Valore Concordato / Ricavo (€)', filterButton: true },
        { name: 'Periodo', filterButton: true },
        { name: 'Stato Commessa', filterButton: true }
      ],
      rows: tableRows
    });

    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 40;
    sheet.getColumn(3).width = 25;
    sheet.getColumn(4).width = 30;
    sheet.getColumn(5).width = 25;
    sheet.getColumn(6).width = 20;

    sheet.getColumn(4).numFmt = '#,##0.00';
  }
}
