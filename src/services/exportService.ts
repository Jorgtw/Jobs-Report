import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { translations, Language } from '../translations';

const getT = (lang: Language) => (key: keyof typeof translations['it']) => {
  const currentTranslations = translations[lang] || translations['it'];
  return (currentTranslations as any)[key] || (translations['it'] as any)[key] || key;
};

export const exportToPDF = (exportRows: any[], lang: Language, userName: string) => {
  const t = getT(lang);
  const doc = new jsPDF('l', 'mm', 'a4');
  const now = new Date().toLocaleString();

  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text(t('workSummary'), 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`${t('operator')}: ${userName}`, 14, 28);
  doc.text(`${t('generatedOn')}: ${now}`, 14, 33);

  const NumberFormat = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let totalHours = 0;
  let totalCost = 0;
  let totalRevenue = 0;
  let totalExpenses = 0;

  const tableData = exportRows.map(r => {
    totalHours += r.hours;
    totalCost += r.cost || 0;
    totalRevenue += r.revenue || 0;
    totalExpenses += r.expenses || 0;

    return [
      r.date,
      r.clientName,
      r.projectName,
      r.workerName,
      r.description,
      NumberFormat.format(r.hours),
      NumberFormat.format(r.hourlyCost || 0),
      NumberFormat.format(r.cost || 0),
      NumberFormat.format(r.expenses || 0),
      NumberFormat.format(r.hourlyRevenue || 0),
      NumberFormat.format(r.revenue || 0),
      r.paid
    ];
  });

  tableData.push([
    '',
    '',
    '',
    t('grandTotal').toUpperCase(),
    '',
    NumberFormat.format(totalHours),
    '',
    NumberFormat.format(totalCost),
    NumberFormat.format(totalExpenses),
    '',
    NumberFormat.format(totalRevenue),
    ''
  ]);

  autoTable(doc, {
    startY: 40,
    head: [[
      t('date'),
      t('clients'),
      t('project'),
      t('personnel'),
      t('description'),
      t('hours'),
      t('hourlyCost'),
      t('personnelCost'),
      t('expenses'),
      t('hourlyRevenue'),
      t('totalRevenue'),
      t('statusLabel')
    ]],
    body: tableData,
    theme: 'grid',
    bodyStyles: { fontSize: 7, cellPadding: 2 },
    didParseCell: function (data) {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });

  doc.save(`JobsReport_Dettaglio_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (exportRows: any[], lang: Language) => {
  try {
    const t = getT(lang);

    let totalHours = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    const worksheetData = exportRows.map(r => {
      totalHours += r.hours;
      totalCost += r.cost || 0;
      totalRevenue += r.revenue || 0;
      totalExpenses += r.expenses || 0;

      return {
        [t('date')]: r.date,
        [t('clients')]: r.clientName,
        [t('project')]: r.projectName,
        [t('personnel')]: r.workerName,
        [t('subcontractorLabel')]: r.subcontractorName || '',
        [t('description')]: r.description,
        [t('hours')]: r.hours,
        [t('hourlyCost')]: r.hourlyCost || 0,
        [t('personnelCost')]: r.cost || 0,
        [t('expenses')]: r.expenses || 0,
        [t('hourlyRevenue')]: r.hourlyRevenue || 0,
        [t('totalRevenue')]: r.revenue || 0,
        [t('statusLabel')]: r.paid
      };
    });

    worksheetData.push({
      [t('date')]: '',
      [t('clients')]: '',
      [t('project')]: '',
      [t('personnel')]: t('grandTotal').toUpperCase(),
      [t('subcontractorLabel')]: '',
      [t('description')]: '',
      [t('hours')]: totalHours,
      [t('hourlyCost')]: '',
      [t('personnelCost')]: totalCost,
      [t('expenses')]: totalExpenses,
      [t('hourlyRevenue')]: '',
      [t('totalRevenue')]: totalRevenue,
      [t('statusLabel')]: ''
    });

    const worksheet = utils.json_to_sheet(worksheetData);

    // Apply number formatting to numeric columns
    const range = utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) { // skip header
      for (let C = 6; C <= 11; ++C) { // Columns G to L
        const cell_address = { c: C, r: R };
        const cell_ref = utils.encode_cell(cell_address);
        if (worksheet[cell_ref]) {
          worksheet[cell_ref].t = 'n';
          worksheet[cell_ref].z = '#,##0.00';
        }
      }
    }

    // Auto-fit columns
    const maxWidths = worksheetData.reduce((acc: any, row: any) => {
      Object.keys(row).forEach((key, i) => {
        const value = row[key] ? row[key].toString() : '';
        const length = value.length > key.length ? value.length : key.length;
        if (!acc[i] || length > acc[i]) acc[i] = length;
      });
      return acc;
    }, []);
    worksheet['!cols'] = maxWidths.map((w: number) => ({ wch: w + 2 }));

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, t('workSummary'));

    writeFile(workbook, `JobsReport_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (err: any) {
    console.error("Excel export error:", err);
    alert("Errore scaricando l'Excel: " + err.message);
  }
};

export const generateCompliancePDF = async (report: any, photos: string[], signature: string, lang: Language) => {
  const t = getT(lang);
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  // ── HEADER BAR ──────────────────────────────────────────────────────────
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('COMPLIANCE REPORT', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`JobsReport  •  ${dateStr} ${timeStr}`, margin, 19);
  doc.text(`#${(report.id || '').substring(0, 8).toUpperCase()}`, pageW - margin, 19, { align: 'right' });

  // ── INFO BLOCK ───────────────────────────────────────────────────────────
  let y = 38;

  const drawLabelValue = (label: string, value: string, x: number, yPos: number, maxW = 90) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(value || '---', maxW);
    doc.text(lines, x, yPos + 5);
    return yPos + 5 + lines.length * 5;
  };

  // Left column
  drawLabelValue(t('date'), report.date || '---', margin, y);
  drawLabelValue(t('clients'), report.clientName || '---', margin, y + 18);

  // Right column
  drawLabelValue(t('project'), report.projectName || '---', margin + contentW / 2, y);
  if (report.projectAddress) {
    drawLabelValue(t('address'), report.projectAddress, margin + contentW / 2, y + 18);
  }

  y += 40;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── DESCRIZIONE LAVORI ───────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text('DESCRIZIONE LAVORI', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(report.description || '---', contentW);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 8;

  // Divider
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── SQUADRA DI LAVORO ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text('SQUADRA DI LAVORO', margin, y);
  y += 4;

  // Build team table data
  const teamRows: any[] = [];
  const mainHours = report.manualTotalHours !== undefined && report.manualTotalHours !== null
    ? Number(report.manualTotalHours)
    : Number(report.totalHours) || 0;

  teamRows.push([
    report.userName || '---',
    report.startTime || '---',
    report.endTime || '---',
    `${mainHours.toFixed(2)} h`,
    t('mainWorker') || 'Principale'
  ]);

  let totalTeamHours = mainHours;

  (report.additionalWorkers || []).forEach((aw: any) => {
    const hours = aw.manualTotalHours !== undefined && aw.manualTotalHours !== null
      ? Number(aw.manualTotalHours)
      : Number(aw.totalHours) || 0;
    totalTeamHours += hours;
    teamRows.push([
      aw.personName || '---',
      aw.startTime || '---',
      aw.endTime || '---',
      `${hours.toFixed(2)} h`,
      aw.membershipType || 'Interno'
    ]);
  });

  autoTable(doc, {
    startY: y,
    head: [[t('name') || 'Nome', t('startTime') || 'Inizio', t('endTime') || 'Fine', t('hours') || 'Ore', 'Tipo']],
    body: teamRows,
    foot: [['', '', 'TOTALE ORE SQUADRA', `${totalTeamHours.toFixed(2)} h`, '']],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 8, fontStyle: 'bold', cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 64, 175], fontSize: 9, fontStyle: 'bold', cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── FIRMA ────────────────────────────────────────────────────────────────
  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text('FIRMA DEL CLIENTE', margin, y);

  if (photos && photos.length > 0) {
    doc.text(t('compliancePhotos').toUpperCase() || 'FOTO EVIDENZA', margin + contentW / 2, y);
  }
  y += 4;

  const signatureBoxH = 35;
  // Signature box
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, photos.length > 0 ? contentW / 2 - 4 : contentW, signatureBoxH, 2, 2);

  if (signature) {
    doc.addImage(signature, 'PNG', margin + 2, y + 2, photos.length > 0 ? contentW / 2 - 8 : contentW - 4, signatureBoxH - 4);
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Nessuna firma', margin + (photos.length > 0 ? contentW / 4 - 4 : contentW / 2), y + signatureBoxH / 2, { align: 'center' });
  }

  // First photo inline (if available)
  if (photos && photos.length > 0) {
    try {
      doc.addImage(photos[0], 'JPEG', margin + contentW / 2 + 2, y, contentW / 2 - 2, signatureBoxH);
    } catch (e) { /* skip if photo format not supported */ }
  }

  y += signatureBoxH + 6;

  // Firma line label
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + (photos.length > 0 ? contentW / 2 - 8 : contentW - 4), y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${report.clientName || 'Cliente'}  —  ${report.date}`, margin, y + 4);

  // ── SECONDA FOTO su nuova pagina ─────────────────────────────────────────
  if (photos && photos.length > 1) {
    doc.addPage();

    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('FOTO EVIDENZA', margin, 12);

    let photoY = 28;
    try {
      doc.addImage(photos[1], 'JPEG', margin, photoY, contentW, 120);
    } catch (e) { /* skip */ }
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.text(`JobsReport Compliance  •  ${report.projectName}  •  ${dateStr}`, margin, footerY);
    doc.text(`${i} / ${totalPages}`, pageW - margin, footerY, { align: 'right' });
  }

  // ── APRI NEL BROWSER ─────────────────────────────────────────────────────
  const fileName = `Compliance_${report.date}_${(report.projectName || 'Report').replace(/\s+/g, '_')}.pdf`;
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
  // Also trigger download as fallback
  doc.save(fileName);
};
