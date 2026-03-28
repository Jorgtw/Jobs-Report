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

    const range = utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = 6; C <= 11; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = utils.encode_cell(cell_address);
        if (worksheet[cell_ref]) {
          worksheet[cell_ref].t = 'n';
          worksheet[cell_ref].z = '#,##0.00';
        }
      }
    }

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

// ============================================================
// COMPLIANCE REPORT PDF
// ============================================================
export const generateCompliancePDF = async (
  report: any,
  photos: string[],
  signature: string,
  lang: Language,
  adminEmails: string[] = []
) => {
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
  doc.setFontSize(16);
  doc.text('COMPLIANCE REPORT', margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`${dateStr}  •  ${timeStr}`, margin, 19);
  doc.text(`#${(report.id || '').substring(0, 8).toUpperCase()}`, pageW - margin, 19, { align: 'right' });

  // ── INTESTAZIONE AZIENDALE ───────────────────────────────────────────────
  let y = 34;
  const hasCompanyData = report.companyName || report.companyAddress || report.companyPhone || report.companyEmail;
  if (hasCompanyData) {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, y - 2, pageW, 26, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(report.companyName || '', margin, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const addrParts = [report.companyAddress, report.companyCity, report.companyCountry].filter(Boolean).join(', ');
    if (addrParts) doc.text(addrParts, margin, y + 11);
    const contactParts = [
      report.companyPhone ? `Tel: ${report.companyPhone}` : '',
      report.companyEmail ? `Email: ${report.companyEmail}` : '',
      report.companyVat ? `P.IVA/CVR: ${report.companyVat}` : '',
    ].filter(Boolean).join('   ');
    if (contactParts) doc.text(contactParts, margin, y + 17);
    y += 30;
  } else {
    y += 6;
  }

  // ── DIVIDER ──────────────────────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── DATI CANTIERE ────────────────────────────────────────────────────────
  const drawLabelValue = (label: string, value: string, x: number, yPos: number, maxW = 88) => {
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

  drawLabelValue(t('date'), report.date || '---', margin, y);
  drawLabelValue(t('clients'), report.clientName || '---', margin, y + 18);
  drawLabelValue(t('project'), report.projectName || '---', margin + contentW / 2, y);
  if (report.projectAddress) drawLabelValue(t('address'), report.projectAddress, margin + contentW / 2, y + 18);
  y += 40;

  // ── DESCRIZIONE LAVORI ───────────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text(t('descriptionOfWork').toUpperCase(), margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(report.description || '---', contentW);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 8;

  // ── SQUADRA DI LAVORO — solo Nome + Ore ─────────────────────────────────
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text(t('workTeam').toUpperCase(), margin, y);
  y += 4;

  const mainHours = report.manualTotalHours !== undefined && report.manualTotalHours !== null
    ? Number(report.manualTotalHours)
    : Number(report.totalHours) || 0;

  const teamRows: any[] = [[report.userName || '---', `${mainHours.toFixed(2)} h`]];
  let totalTeamHours = mainHours;

  (report.additionalWorkers || []).forEach((aw: any) => {
    const hours = aw.manualTotalHours !== undefined && aw.manualTotalHours !== null
      ? Number(aw.manualTotalHours)
      : Number(aw.totalHours) || 0;
    totalTeamHours += hours;
    teamRows.push([aw.personName || '---', `${hours.toFixed(2)} h`]);
  });

  autoTable(doc, {
    startY: y,
    head: [[t('workerCol'), t('hours')]],
    body: teamRows,
    foot: [[t('totalTeamHours').toUpperCase(), `${totalTeamHours.toFixed(2)} h`]],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 8, fontStyle: 'bold', cellPadding: 2 },
    bodyStyles: { fontSize: 9, cellPadding: 2, textColor: [30, 41, 59] },
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 64, 175], fontSize: 9, fontStyle: 'bold', cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 42, halign: 'center' },
    }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── FIRMA + FOTO ─────────────────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  const hasPhoto = photos && photos.length > 0;
  const sigW = hasPhoto ? contentW / 2 - 4 : contentW;
  const sigH = 38;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text(t('clientSignature').toUpperCase(), margin, y);
  if (hasPhoto) doc.text(t('photoEvidence').toUpperCase(), margin + contentW / 2, y);
  y += 4;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, sigW, sigH, 2, 2);
  if (signature) {
    doc.addImage(signature, 'PNG', margin + 2, y + 2, sigW - 4, sigH - 4);
  }
  if (hasPhoto) {
    try { doc.addImage(photos[0], 'JPEG', margin + contentW / 2 + 2, y, contentW / 2 - 2, sigH); }
    catch (_) { /* skip unsupported format */ }
  }

  y += sigH + 5;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + sigW, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${report.clientName || 'Cliente'}  —  ${report.date}`, margin, y + 4);

  // ── FOTO AGGIUNTIVE su pagine successive (2 per pagina) ─────────────────
  if (photos && photos.length > 1) {
    const extraPhotos = photos.slice(1); // skip first (already shown inline)
    for (let pi = 0; pi < extraPhotos.length; pi += 2) {
      doc.addPage();
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${t('photoEvidence').toUpperCase()} — ${pi + 2}${extraPhotos[pi + 1] ? `/${pi + 3}` : ''}`, margin, 12);

      try { doc.addImage(extraPhotos[pi], 'JPEG', margin, 24, contentW, 120); }
      catch (_) { /* skip */ }

      if (extraPhotos[pi + 1]) {
        try { doc.addImage(extraPhotos[pi + 1], 'JPEG', margin, 150, contentW, 120); }
        catch (_) { /* skip */ }
      }
    }
  }

  // ── FOOTER SU OGNI PAGINA ────────────────────────────────────────────────
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const footerY = doc.internal.pageSize.getHeight() - 7;
    const compFooter = report.companyName ? `${report.companyName}  •  ` : '';
    doc.text(`${compFooter}JobsReport  •  ${report.projectName}  •  ${dateStr}`, margin, footerY);
    doc.text(`${i} / ${totalPages}`, pageW - margin, footerY, { align: 'right' });
  }

  // ── APRI NEL BROWSER + SCARICA ───────────────────────────────────────────
  const fileName = `Compliance_${report.date}_${(report.projectName || 'Report').replace(/\s+/g, '_')}.pdf`;
  const pdfBase64 = doc.output('datauristring');
  window.open(doc.output('bloburl'), '_blank');
  doc.save(fileName);

  // ── INVIO EMAIL AGLI ADMIN ───────────────────────────────────────────────
  if (adminEmails.length > 0) {
    const emailsToNotify = adminEmails.filter(Boolean);
    if (emailsToNotify.length > 0) {
      try {
        await fetch('/api/sendComplianceEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: emailsToNotify,
            subject: `[JobsReport] Compliance Report — ${report.projectName} — ${report.date}`,
            companyName: report.companyName || '',
            projectName: report.projectName || '',
            clientName: report.clientName || '',
            date: report.date || '',
            totalHours: totalTeamHours.toFixed(2),
            userName: report.userName || '',
            pdfBase64,
          }),
        });
      } catch (e) {
        console.warn('Email notification failed (non-blocking):', e);
      }
    }
  }
};
