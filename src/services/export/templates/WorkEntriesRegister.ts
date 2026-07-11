import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { getISOWeek } from '../utils/dateUtils';

export class WorkEntriesRegister implements ReportTemplate {
  name = 'Work Entries Register';
  type = 'OPERATIVE' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const sheet = workbook.addWorksheet('Registro Rapportini', {
      pageSetup: {
        paperSize: 8 as ExcelJS.PaperSize, // A3 = 8 in exceljs standard mappings (approx)
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
        { state: 'frozen', xSplit: 2, ySplit: 3 } // Freeze pane su header e colonne 1-2 (Rif./Data)
      ]
    });

    // Riga 1: Titolo
    sheet.mergeCells('A1:V1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'REGISTRO RAPPORTINI (WORK ENTRIES REGISTER)';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }; // Primary Blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    // Riga 2: Sottotitolo (uso interno)
    sheet.mergeCells('A2:V2');
    const subTitleCell = sheet.getCell('A2');
    subTitleCell.value = `USO INTERNO AMMINISTRAZIONE — Non da inviare al cliente  |  Azienda: ${data.companyName}  |  Generato il: ${new Date().toLocaleDateString()}`;
    subTitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
    subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F75B5' } }; // Secondary Blue
    subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // Sort reports cronologicamente
    data.summaries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Costruzione Dati Tabella (Riga per Riga)
    const tableRows: any[][] = [];
    
    // Generiamo un Rif. Rapportino progressivo basato sull'anno e indice (es. RPT-2026-0001)
    let index = 1;

    for (const r of data.summaries) {
      const year = new Date(r.date).getFullYear();
      const rif = `RPT-${year}-${index.toString().padStart(4, '0')}`;
      
      const workerName = r.userName || r.userId || 'Sconosciuto';
      const clientName = r.clientName || r.clientId || '';
      
      // Calcolo spese aggregate e dettaglio testuale
      let totaleSpese = 0;
      let kmPercorsi = 0;
      let dettaglioSpeseArr: string[] = [];

      if (r.expenses && Array.isArray(r.expenses)) {
        for (const exp of r.expenses) {
          totaleSpese += (exp.amount || 0);
          if (exp.type?.toLowerCase().includes('km') || exp.type?.toLowerCase().includes('chilometr')) {
            kmPercorsi += ((exp as any).distance || exp.amount || 0); // fallback if specific distance field is not mapped perfectly
          }
          if (exp.amount > 0 || exp.description) {
            dettaglioSpeseArr.push(`${exp.type || 'Spesa'}: ${exp.amount} (${exp.description || ''})`);
          }
        }
      }

      const dettaglioSpese = dettaglioSpeseArr.join(' | ');
      
      const extraHours = r.overtimeHours || 0;
      const ordHours = (r.totalHours || 0) - extraHours - (r.festiveHours || 0) - (r.nightHours || 0);
      
      const additionalWorkersText = ''; // L'AW è già splittato come summary separato in dbService.ts!

      tableRows.push([
        rif,                                         // 1. Rif. Rapportino
        new Date(r.date),                            // 2. Data
        `W${getISOWeek(r.date)}`,                    // 3. Settimana
        r.startTime || '',                           // 4. Ora Inizio
        r.endTime || '',                             // 5. Ora Fine
        r.breakHours || 0,                           // 6. Ore Pausa
        r.totalHours || 0,                           // 7. Ore Totali
        ordHours > 0 ? ordHours : 0,                 // 8. Ore Ordinarie
        extraHours > 0 ? extraHours : 0,             // 9. Straordinario
        r.nightHours || 0,                           // 10. Notturne
        r.festiveHours || 0,                         // 11. Festive
        clientName,                                  // 12. Cliente
        r.projectName || '',                         // 13. Progetto
        r.description || '',                         // 14. Descrizione
        r.activityType || 'work',                    // 15. Tipo Intervento
        workerName,                                  // 16. Dipendente
        additionalWorkersText,                       // 17. Colleghi Aggiuntivi
        kmPercorsi,                                  // 18. Km Percorsi
        totaleSpese,                                 // 19. Spese (€ totale)
        dettaglioSpese,                              // 20. Dettaglio Spese
        r.exportStatus || 'new',                     // 21. Stato
        r.notes || ''                                // 22. Note
      ]);
      index++;
    }

    // Aggiunta della ListObject Table (partendo da riga 3)
    sheet.addTable({
      name: 'RegistroRapportiniTable',
      ref: 'A3',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium2', // Stile pulito Excel nativo
        showRowStripes: true,
      },
      columns: [
        { name: 'Rif. Rapportino', filterButton: true },
        { name: 'Data', filterButton: true },
        { name: 'Settimana (ISO)', filterButton: true },
        { name: 'Ora Inizio', filterButton: true },
        { name: 'Ora Fine', filterButton: true },
        { name: 'Ore Pausa', filterButton: true },
        { name: 'Ore Totali', filterButton: true },
        { name: 'Ore Ordinarie', filterButton: true },
        { name: 'Straordinario', filterButton: true },
        { name: 'Notturne', filterButton: true },
        { name: 'Festive', filterButton: true },
        { name: 'Cliente', filterButton: true },
        { name: 'Progetto/Commessa', filterButton: true },
        { name: 'Descrizione Attività', filterButton: true },
        { name: 'Tipo Attività', filterButton: true },
        { name: 'Dipendente', filterButton: true },
        { name: 'Colleghi Aggiuntivi', filterButton: true },
        { name: 'Km Percorsi', filterButton: true },
        { name: 'Spese (€)', filterButton: true },
        { name: 'Dettaglio Spese', filterButton: true },
        { name: 'Stato', filterButton: true },
        { name: 'Note', filterButton: true }
      ],
      rows: tableRows
    });

    // Aggiustamento automatico larghezza colonne per leggibilità
    const colWidths = [
      16, 12, 16, 12, 12, 12, 12, 15, 15, 12, 12, // 1-11
      25, 30, 40, 15, 20, 25, 12, 12, 40, 15, 30  // 12-22
    ];
    colWidths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });

    // Formatting date and numbers in the table
    // Data (Col 2)
    sheet.getColumn(2).numFmt = 'dd/mm/yyyy';
    
    // Ore (Cols 6-11)
    for (let i = 6; i <= 11; i++) {
      sheet.getColumn(i).numFmt = '0.0 "h"';
    }

    // Spese (Col 19)
    sheet.getColumn(19).numFmt = '#,##0.00';
  }
}
