import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { getCatalogT } from '../i18n-catalog';
import { getISOWeek, parseDateSafe } from '../utils/dateUtils';

export class WorkEntriesRegister implements ReportTemplate {
  name = 'Work Entries Register';
  type = 'OPERATIVE' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const t = getCatalogT(data.language);
    const sheet = workbook.addWorksheet(t.sheetEntries, {
      pageSetup: {
        paperSize: 8 as ExcelJS.PaperSize, // A3
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
    titleCell.value = t.entriesTitle;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }; // Primary Blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    // Riga 2: Sottotitolo (uso interno)
    sheet.mergeCells('A2:V2');
    const subTitleCell = sheet.getCell('A2');
    subTitleCell.value = `${t.internalUseOnly}  |  ${t.companyPrefix}${data.companyName}  |  ${t.generatedPrefix}${new Date().toLocaleDateString()}`;
    subTitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
    subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F75B5' } }; // Secondary Blue
    subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // Sort reports cronologicamente
    data.summaries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Mappatura progressiva univoca basata sul reportId originale
    const reportIdToIndexMap = new Map<string, number>();
    let nextReportSeq = 1;
    for (const r of data.summaries) {
      const repId = r.reportId || r.id;
      if (!reportIdToIndexMap.has(repId)) {
        reportIdToIndexMap.set(repId, nextReportSeq++);
      }
    }

    // Costruzione Dati Tabella (Riga per Riga)
    const tableRows: any[][] = [];

    for (const r of data.summaries) {
      const parsedDate = parseDateSafe(r.date);
      const year = parsedDate ? parsedDate.getUTCFullYear() : new Date().getFullYear();
      const repId = r.reportId || r.id;
      const reportSeq = reportIdToIndexMap.get(repId) || 1;
      const rif = `RPT-${year}-${reportSeq.toString().padStart(4, '0')}`;

      const workerName = r.userName || r.userId || t.unspecifiedWorker;
      const clientName = r.clientName || r.clientId || '';

      // Calcolo spese aggregate e dettaglio testuale
      let totaleSpese = 0;
      let kmPercorsi = 0;
      let dettaglioSpeseArr: string[] = [];

      if (r.expenses && Array.isArray(r.expenses)) {
        for (const exp of r.expenses) {
          totaleSpese += (exp.amount || 0);
          if (exp.type?.toLowerCase().includes('km') || exp.type?.toLowerCase().includes('chilometr')) {
            kmPercorsi += ((exp as any).distance || exp.amount || 0);
          }
          if (exp.amount > 0 || exp.description) {
            dettaglioSpeseArr.push(`${exp.type || 'Spesa'}: ${exp.amount} (${exp.description || ''})`);
          }
        }
      }

      const dettaglioSpese = dettaglioSpeseArr.join(' | ');

      const extraHours = r.overtimeHours || 0;
      const festiveHours = r.festiveHours || 0;
      const nightHours = r.nightHours || 0;
      const totalHours = r.totalHours || 0;
      const ordHours = Math.max(0, totalHours - extraHours - festiveHours - nightHours);

      const additionalWorkersText = ''; // L'AW è già splittato come summary separato in dbService.ts

      // Stato amministrativo localizzato (mai 'new', fallback 'Pending')
      const rawStatus = (r.invoiceStatus && r.invoiceStatus.trim()) ? r.invoiceStatus : 'Pending';
      const statusLabel = (t.adminStatusLabels as any)[rawStatus] || rawStatus;

      tableRows.push([
        rif,                                         // 1. Rif. Rapportino
        parsedDate || '',                            // 2. Data

        `W${getISOWeek(r.date)}`,                    // 3. Settimana
        r.startTime || '',                           // 4. Ora Inizio
        r.endTime || '',                             // 5. Ora Fine
        r.breakHours || 0,                           // 6. Ore Pausa
        totalHours,                                  // 7. Ore Totali
        ordHours,                                    // 8. Ore Ordinarie
        extraHours,                                  // 9. Straordinario
        nightHours,                                  // 10. Notturne
        festiveHours,                                // 11. Festive
        clientName,                                  // 12. Cliente
        r.projectName || '',                         // 13. Progetto
        r.description || '',                         // 14. Descrizione
        r.activityType || 'work',                    // 15. Tipo Intervento
        workerName,                                  // 16. Dipendente
        additionalWorkersText,                       // 17. Colleghi Aggiuntivi
        kmPercorsi,                                  // 18. Km Percorsi
        totaleSpese,                                 // 19. Spese
        dettaglioSpese,                              // 20. Dettaglio Spese
        statusLabel,                                 // 21. Stato amministrativo
        r.notes || ''                                // 22. Note
      ]);
    }


    // Aggiunta della ListObject Table (partendo da riga 3)
    sheet.addTable({
      name: 'RegistroRapportiniTable',
      ref: 'A3',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: t.entriesHeaders.map(name => ({ name, filterButton: true })),
      rows: tableRows
    });

    // Larghezza colonne
    const colWidths = [
      16, 12, 16, 12, 12, 12, 12, 15, 15, 12, 12, // 1-11
      25, 30, 40, 15, 20, 25, 12, 14, 40, 22, 30  // 12-22
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
