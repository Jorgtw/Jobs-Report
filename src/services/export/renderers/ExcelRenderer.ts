import { utils, writeFile } from 'xlsx';
import { ReportDocument, ReportBlockType, ReportBlock } from '../types';
import { ReportRenderer } from './ReportRenderer';

export class ExcelRenderer implements ReportRenderer {
  async render(document: ReportDocument, filename: string): Promise<void> {
    const wb = utils.book_new();

    // 1. Foglio Metadati
    const metaData = [
      ['Report Info', 'Valore'],
      ['Contesto', document.metadata.reportContext],
      ['Azienda', document.metadata.companyName],
      ['Cliente', document.metadata.clientName || '-'],
      ['Progetto', document.metadata.projectName || '-'],
      ['Generato da', document.metadata.generatedBy],
      ['Data generazione', this.formatDate(document.metadata.generatedAt)],
      ['', ''],
      ['Filtri Applicati', 'Valore']
    ];

    Object.entries(document.metadata.filtersApplied).forEach(([k, v]) => {
      metaData.push([k, v]);
    });

    const wsMeta = utils.aoa_to_sheet(metaData);
    utils.book_append_sheet(wb, wsMeta, 'Metadati');

    // 2. Fogli per ogni Sezione
    document.sections.forEach((section, index) => {
      const sheetName = section.title.replace(/[\\/*?:\[\]]/g, '').substring(0, 31) || `Foglio${index + 1}`;
      const aoa: any[][] = [];

      section.blocks.forEach(block => {
        this.renderBlock(block, aoa);
        aoa.push([]); // Spazio tra i blocchi
      });

      const ws = utils.aoa_to_sheet(aoa);
      utils.book_append_sheet(wb, ws, sheetName);
    });

    writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  }

  private renderBlock(block: ReportBlock, aoa: any[][]) {
    switch (block.type) {
      case ReportBlockType.TEXT:
        aoa.push([block.content]);
        break;

      case ReportBlockType.SUMMARY:
        const summaryBlock = block as any;
        summaryBlock.groups.forEach((group: any) => {
          if (group.title) {
            aoa.push([group.title]);
          }
          group.items.forEach((item: any) => {
            aoa.push([item.label, item.value]);
          });
          aoa.push([]); // riga vuota
        });
        break;

      case ReportBlockType.DASHBOARD:
        aoa.push(['Indicatore', 'Valore']);
        const kpis = (block as any).kpis;
        kpis.forEach((item: any) => {
          aoa.push([item.label, item.value]);
        });
        break;

      case ReportBlockType.TABLE:
        // Intestazioni (Headers)
        const headers = block.columns.map(c => c.header);
        aoa.push(headers);

        // Righe di dati
        block.data.forEach(row => {
          const rowData = block.columns.map(col => {
            const val = row[col.key];
            if (val == null) return '';
            if (col.type === 'date' && val instanceof Date) {
              return this.formatDate(val);
            }
            if (col.type === 'decimal' || col.type === 'number') {
              return Number(val);
            }
            return val;
          });
          aoa.push(rowData);
        });

        // Eventuali totali
        if (block.totals) {
          const totalsRow = block.columns.map((col, idx) => {
            if (idx === 0) return 'TOTALE';
            const val = block.totals![col.key];
            return val != null ? Number(val) : '';
          });
          aoa.push(totalsRow);
        }
        break;
    }
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}
