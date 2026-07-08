import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportDocument, ReportBlockType, ReportBlock, ReportSection } from '../types';
import { ReportRenderer } from './ReportRenderer';

export class PdfRenderer implements ReportRenderer {
  async render(document: ReportDocument, filename: string): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    let startY = 20;

    // 1. Stampa Metadati
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175); // Colore brand primario
    doc.text(document.metadata.reportContext.toUpperCase(), 14, startY);
    startY += 8;

    doc.setFontSize(9);
    doc.setTextColor(100);
    
    const metaLines = [
      `Azienda: ${document.metadata.companyName}`,
      document.metadata.clientName ? `Cliente: ${document.metadata.clientName}` : null,
      document.metadata.projectName ? `Progetto: ${document.metadata.projectName}` : null,
      `Generato da: ${document.metadata.generatedBy}`,
      `Data generazione: ${this.formatDate(document.metadata.generatedAt)}`
    ].filter(Boolean) as string[];

    metaLines.forEach(line => {
      doc.text(line, 14, startY);
      startY += 5;
    });

    const filterEntries = Object.entries(document.metadata.filtersApplied);
    if (filterEntries.length > 0) {
      startY += 2;
      doc.setFont(undefined, 'bold');
      doc.text('Filtri applicati:', 14, startY);
      doc.setFont(undefined, 'normal');
      startY += 5;
      
      const filterText = filterEntries.map(([k, v]) => `${k}: ${v}`).join(' | ');
      const splitFilters = doc.splitTextToSize(filterText, 180);
      doc.text(splitFilters, 14, startY);
      startY += (splitFilters.length * 5) + 5;
    } else {
      startY += 5;
    }

    // 2. Stampa Sezioni e Blocchi
    document.sections.forEach((section, sIndex) => {
      if (sIndex > 0) {
        // Nuova pagina per le sezioni principali, se c'è poco spazio
        if (startY > 250) {
          doc.addPage();
          startY = 20;
        } else {
          startY += 10;
        }
      }

      doc.setFontSize(14);
      doc.setTextColor(50);
      doc.setFont(undefined, 'bold');
      doc.text(section.title, 14, startY);
      doc.setFont(undefined, 'normal');
      startY += 8;

      section.blocks.forEach(block => {
        startY = this.renderBlock(doc, block, startY);
        startY += 8; // Spazio tra i blocchi
      });
    });

    doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  }

  private renderBlock(doc: jsPDF, block: ReportBlock, startY: number): number {
    switch (block.type) {
      case ReportBlockType.TEXT:
        doc.setFontSize(10);
        doc.setTextColor(80);
        const splitText = doc.splitTextToSize(block.content, 180);
        doc.text(splitText, 14, startY);
        return startY + (splitText.length * 5);

      case ReportBlockType.SUMMARY:
      case ReportBlockType.DASHBOARD:
        const items = block.type === ReportBlockType.SUMMARY ? block.items : block.kpis;
        const body = items.map(item => [item.label, this.formatValue(item.value, item.type)]);
        
        autoTable(doc, {
          startY: startY,
          head: [[block.type === ReportBlockType.SUMMARY ? 'Riepilogo' : 'Indicatore', 'Valore']],
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], fontStyle: 'bold' },
          bodyStyles: { fontSize: 9, cellPadding: 3 },
          columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
        });
        return (doc as any).lastAutoTable.finalY;

      case ReportBlockType.TABLE:
        const headers = block.columns.map(c => c.header);
        const tableData = block.data.map(row => {
          return block.columns.map(col => {
            const val = row[col.key];
            if (val == null) return '';
            if (col.type === 'date' && val instanceof Date) {
              return this.formatDate(val);
            }
            return this.formatValue(val, col.type);
          });
        });

        if (block.totals) {
          const totalsRow = block.columns.map((col, idx) => {
            if (idx === 0) return 'TOTALE';
            const val = block.totals![col.key];
            return val != null ? this.formatValue(val, col.type) : '';
          });
          tableData.push(totalsRow);
        }

        const alignMap: Record<number, any> = {};
        block.columns.forEach((col, idx) => {
          if (col.type === 'number' || col.type === 'decimal' || col.type === 'hours') {
            alignMap[idx] = { halign: 'right' };
          }
        });

        autoTable(doc, {
          startY: startY,
          head: [headers],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255] },
          bodyStyles: { fontSize: 8, cellPadding: 2 },
          columnStyles: alignMap,
          didParseCell: function (data) {
            // Se c'è la riga dei totali, rendila in grassetto
            if (block.totals && data.section === 'body' && data.row.index === tableData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        });
        return (doc as any).lastAutoTable.finalY;
    }
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  private formatValue(value: any, type?: 'text' | 'number' | 'decimal' | 'hours' | 'date'): string {
    if (value == null) return '';
    if (type === 'decimal' || type === 'number') {
      // Formato Europeo: 1.234,56
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return new Intl.NumberFormat('it-IT', { 
        minimumFractionDigits: type === 'decimal' ? 2 : 0, 
        maximumFractionDigits: type === 'decimal' ? 2 : 2 
      }).format(num);
    }
    if (type === 'hours') {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return new Intl.NumberFormat('it-IT', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      }).format(num) + ' h';
    }
    return String(value);
  }
}
