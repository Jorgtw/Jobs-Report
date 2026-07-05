import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { Language, TranslationKey, resolveKey } from '../i18n';
import { db } from './dbService';
import { supabase } from './supabase';

const getApiUrl = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNative) {
    return 'https://jobs-report.vercel.app' + url;
  }
  return url;
};

const localeMap: Record<string, string> = {
  it: 'it-IT',
  en: 'en-US',
  es: 'es-ES',
  pl: 'pl-PL',
  tr: 'tr-TR',
  da: 'da-DK'
};

const getT = (lang: Language) => (key: TranslationKey | string) => resolveKey(lang, key);

export const exportToPDF = (
  exportRows: any[], 
  lang: Language, 
  userName: string,
  totals?: { hours: number; cost: number; revenue: number; expenses: number }
) => {
  const t = getT(lang);
  const locale = localeMap[lang] || 'it-IT';
  const doc = new jsPDF('l', 'mm', 'a4');
  const now = new Date().toLocaleString(locale);

  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text(t('common.workSummary'), 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`${t('reports.operator')}: ${userName}`, 14, 28);
  doc.text(`${t('reports.generatedOn')}: ${now}`, 14, 33);

  const NumberFormat = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tableData = exportRows.map(r => [
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
  ]);

  const finalHours = totals ? totals.hours : exportRows.reduce((sum, r) => Math.round((sum + r.hours) * 100) / 100, 0);
  const finalCost = totals ? totals.cost : exportRows.reduce((sum, r) => Math.round((sum + (r.cost || 0)) * 100) / 100, 0);
  const finalRevenue = totals ? totals.revenue : exportRows.reduce((sum, r) => Math.round((sum + (r.revenue || 0)) * 100) / 100, 0);
  const finalExpenses = totals ? totals.expenses : exportRows.reduce((sum, r) => Math.round((sum + (r.expenses || 0)) * 100) / 100, 0);

  tableData.push([
    '',
    '',
    '',
    t('reports.grandTotal').toUpperCase(),
    '',
    NumberFormat.format(finalHours),
    '',
    NumberFormat.format(finalCost),
    NumberFormat.format(finalExpenses),
    '',
    NumberFormat.format(finalRevenue),
    ''
  ]);

  autoTable(doc, {
    startY: 40,
    head: [[
      t('reports.date'),
      t('common.clients'),
      t('common.projects'),
      t('common.personnel'),
      t('reports.description'),
      t('common.hours'),
      t('reports.hourlyCost'),
      t('reports.personnelCost'),
      t('common.expenses'),
      t('reports.hourlyRevenue'),
      t('reports.totalRevenue'),
      t('reports.statusLabel')
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

  const cleanSummaryName = t('common.workSummary').replace(/\s+/g, '_');
  doc.save(`JobsReport_${cleanSummaryName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportProjectSummaryToPDF = (
  summaryRows: any[],
  totals: { hours: number; revenue: number },
  lang: Language,
  userName: string
) => {
  const t = getT(lang);
  const locale = localeMap[lang] || 'it-IT';
  const doc = new jsPDF('p', 'mm', 'a4');
  const now = new Date().toLocaleString(locale);

  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text(t('reports.summaryByProject').toUpperCase(), 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`${t('reports.operator')}: ${userName}`, 14, 28);
  doc.text(`${t('reports.generatedOn')}: ${now}`, 14, 33);

  const NumberFormat = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tableData = summaryRows.map(r => [
    r.clientName,
    r.name,
    NumberFormat.format(r.hours) + ' h',
    NumberFormat.format(r.revenue)
  ]);

  tableData.push([
    '',
    t('reports.grandTotal').toUpperCase(),
    NumberFormat.format(totals.hours) + ' h',
    NumberFormat.format(totals.revenue)
  ]);

  autoTable(doc, {
    startY: 40,
    head: [[
      t('reports.headerClient'),
      t('reports.summaryProjectName'),
      t('reports.totalHoursLabel'),
      t('reports.totalRevenue')
    ]],
    body: tableData,
    theme: 'grid',
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    didParseCell: function (data) {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });

  const cleanSummaryName = t('reports.summaryByProject').replace(/\s+/g, '_');
  doc.save(`JobsReport_${cleanSummaryName}_${new Date().toISOString().split('T')[0]}.pdf`);
};


export const exportToExcel = (exportRows: any[], lang: Language) => {
  try {
    const t = getT(lang);

    let totalHours = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    const worksheetData = exportRows.map(r => {
      totalHours = Math.round((totalHours + r.hours) * 100) / 100;
      totalCost = Math.round((totalCost + (r.cost || 0)) * 100) / 100;
      totalRevenue = Math.round((totalRevenue + (r.revenue || 0)) * 100) / 100;
      totalExpenses = Math.round((totalExpenses + (r.expenses || 0)) * 100) / 100;

      return {
        [t('reports.date')]: r.date,
        [t('common.clients')]: r.clientName,
        [t('common.projects')]: r.projectName,
        [t('common.personnel')]: r.workerName,
        [t('reports.summarySubcontractorCompany')]: r.subcontractorName || '',
        [t('reports.description')]: r.description,
        [t('common.hours')]: r.hours,
        [t('reports.hourlyCost')]: r.hourlyCost || 0,
        [t('reports.personnelCost')]: r.cost || 0,
        [t('common.expenses')]: r.expenses || 0,
        [t('reports.hourlyRevenue')]: r.hourlyRevenue || 0,
        [t('reports.totalRevenue')]: r.revenue || 0,
        [t('reports.statusLabel')]: r.paid
      };
    });

    worksheetData.push({
      [t('reports.date')]: '',
      [t('common.clients')]: '',
      [t('common.projects')]: '',
      [t('common.personnel')]: t('reports.grandTotal').toUpperCase(),
      [t('reports.summarySubcontractorCompany')]: '',
      [t('reports.description')]: '',
      [t('common.hours')]: totalHours,
      [t('reports.hourlyCost')]: '',
      [t('reports.personnelCost')]: totalCost,
      [t('common.expenses')]: totalExpenses,
      [t('reports.hourlyRevenue')]: '',
      [t('reports.totalRevenue')]: totalRevenue,
      [t('reports.statusLabel')]: ''
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
    utils.book_append_sheet(workbook, worksheet, t('common.workSummary'));

    const cleanSummaryName = t('common.workSummary').replace(/\s+/g, '_');
    writeFile(workbook, `JobsReport_${cleanSummaryName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (err: any) {
    console.error("Excel export error:", err);
    const alertMsg = lang === 'it' ? "Errore scaricando l'Excel: " :
                    (lang === 'es' ? "Error al descargar el Excel: " :
                    (lang === 'pl' ? "Błąd podczas pobierania programu Excel: " :
                    (lang === 'tr' ? "Excel indirilirken hata oluştu: " :
                    (lang === 'da' ? "Fejl under download af Excel: " :
                    "Error downloading Excel: "))));
    alert(alertMsg + err.message);
  }
};

export const generateCompliancePDF = async (
  report: any,
  photos: string[],
  signature: string,
  lang: Language
) => {
  const t = getT(lang);
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const locale = localeMap[lang] || 'it-IT';
  const now = new Date();
  const dateStr = now.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const formatDateEU = (isoDate: string) => {
    if (!isoDate) return '---';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      if (lang === 'en') return `${parts[1]}/${parts[2]}/${parts[0]}`;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };
  const reportDateEU = formatDateEU(report.date);

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

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

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

  drawLabelValue(t('reports.date'), reportDateEU, margin, y);
  drawLabelValue(t('common.clients'), report.clientName || '---', margin, y + 14);
  drawLabelValue(t('common.projects'), report.projectName || '---', margin + contentW / 2, y);
  if (report.projectAddress) drawLabelValue(t('projects.address'), report.projectAddress, margin + contentW / 2, y + 14);
  y += 32;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text(t('reports.descriptionOfWork').toUpperCase(), margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(report.description || '---', contentW);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 6;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text(t('reports.workTeam').toUpperCase(), margin, y);
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
    head: [[t('reports.workerCol'), t('common.hours')]],
    body: teamRows,
    foot: [[t('reports.totalTeamHours').toUpperCase(), `${totalTeamHours.toFixed(2)} h`]],
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

  y = (doc as any).lastAutoTable.finalY + 8;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // Render satisfaction question (Soddisfatto del servizio svolto)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text(t('reports.complianceSatisfactionDeclaration').toUpperCase(), margin, y);

  // Draw Yes / No checkboxes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Yes checkbox
  const yesBoxX = margin + 85;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.rect(yesBoxX, y - 3, 3.5, 3.5); // box
  if (report.satisfaction === 'yes') {
    doc.setFont('helvetica', 'bold');
    doc.text('X', yesBoxX + 0.8, y - 0.3);
  }
  doc.setFont('helvetica', 'normal');
  doc.text(t('common.yes').toUpperCase(), yesBoxX + 5.5, y);

  // No checkbox
  const noBoxX = yesBoxX + 25;
  doc.rect(noBoxX, y - 3, 3.5, 3.5); // box
  if (report.satisfaction === 'no') {
    doc.setFont('helvetica', 'bold');
    doc.text('X', noBoxX + 0.8, y - 0.3);
  }
  doc.setFont('helvetica', 'normal');
  doc.text(t('common.no').toUpperCase(), noBoxX + 5.5, y);

  y += 8;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  const sigW = contentW * 0.6;
  const sigH = 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text(t('reports.clientSignature').toUpperCase(), margin, y);
  y += 4;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, sigW, sigH, 2, 2);
  if (signature) {
    doc.addImage(signature, 'PNG', margin + 2, y + 2, sigW - 4, sigH - 4);
  }

  y += sigH + 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + sigW, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${report.clientName || 'Cliente'}  —  ${reportDateEU}`, margin, y + 4);

  if (photos && photos.length > 0) {
    doc.addPage();
    
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(t('reports.photoEvidence').toUpperCase(), margin, 13);
    
    const photoSpacing = 6;
    const photoW = (contentW - photoSpacing) / 2;
    const photoH = 90;
    let currentY = 30;

    for (let i = 0; i < Math.min(2, photos.length); i++) {
        const xPos = margin + i * (photoW + photoSpacing);
        try {
            doc.addImage(photos[i], 'JPEG', xPos, currentY, photoW, photoH);
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text(`Photo #${i + 1}`, xPos, currentY + photoH + 4);
        } catch (_) { }
    }

    if (photos.length >= 3) {
        currentY += photoH + 15;
        const bottomPhotoW = contentW * 0.8;
        const bottomPhotoH = 100;
        const centerX = margin + (contentW - bottomPhotoW) / 2;
        try {
            doc.addImage(photos[2], 'JPEG', centerX, currentY, bottomPhotoW, bottomPhotoH);
            doc.text(`Photo #3`, centerX, currentY + bottomPhotoH + 4);
        } catch (_) { }
    }
  }

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

  const fileName = `Compliance_${reportDateEU.replace(/\//g, '-')}_${(report.projectName || 'Report').replace(/\s+/g, '_')}.pdf`;

  doc.save(fileName);
  return doc.output('blob');
};

export const sendComplianceReportEmail = async (
  report: any,
  pdfBlob: Blob,
  adminEmails: string[],
  reportDateEU: string
) => {
  if (!adminEmails || adminEmails.length === 0) return;
  const emailsToNotify = adminEmails.filter(Boolean);
  if (emailsToNotify.length === 0) return;

  try {
    const fileName = `Compliance_${reportDateEU.replace(/\//g, '-')}_${(report.projectName || 'Report').replace(/\s+/g, '_')}.pdf`;
    let signedUrl = '';

    const compId = report.companyId || (report as any).company_id || db.getCompanyIdSafe();
    if (!compId) throw new Error("Missing companyId for storage upload");
    const storagePath = `${compId}/reports/${fileName}`;
    await db.uploadFile('compliance-reports', storagePath, pdfBlob);
    signedUrl = await db.getSignedUrl('compliance-reports', storagePath, 604800);

    await fetch(getApiUrl('/api/sendComplianceEmail'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: emailsToNotify,
        subject: `[JobsReport] Compliance Report — ${report.projectName} — ${reportDateEU}`,
        companyName: report.companyName || '',
        projectName: report.projectName || '',
        clientName: report.clientName || '',
        date: report.date || '',
        totalHours: report.totalHours || '0', // Adjust if needed
        userName: report.userName || '',
        pdfUrl: signedUrl,
      }),
    });
  } catch (e) {
    console.error('Storage upload or Email notification failed:', e);
    throw e;
  }
};

export const exportReportExcel = async (companyId: string, filters: any, lang: Language) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error("Sessione non valida o scaduta. Per favore effettua nuovamente il login.");
    }

    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );

    const queryParams = new URLSearchParams({
      companyId,
      token,
      lang,
      ...cleanedFilters
    });

    const response = await fetch(getApiUrl(`/api/export-excel?${queryParams.toString()}`), {
      method: 'GET',
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Errore generico del server' }));
      throw new Error(errData.error || `Errore HTTP: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JobsReport_Direzionale_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error("Backend Excel export error:", err);
    const alertMsg = lang === 'it' ? "Errore scaricando il report Excel: " :
                    (lang === 'es' ? "Error al descargar el Excel: " :
                    (lang === 'pl' ? "Błąd podczas pobierania programu Excel: " :
                    (lang === 'tr' ? "Excel indirilirken hata oluştu: " :
                    (lang === 'da' ? "Fejl under download af Excel: " :
                    "Error downloading Excel: "))));
    alert(alertMsg + (err.message || ""));
  }
};

// --- BILLING REPORTS EXPORTS ---

export const exportInvoiceToPDF = (
  reports: any[],
  client: any,
  project: any,
  lang: Language
) => {
  const locale = localeMap[lang] || 'it-IT';
  const doc = new jsPDF('p', 'mm', 'a4');
  const NumberFormat = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const reportNumber = `ALL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  doc.setFontSize(20);
  doc.setTextColor(30, 64, 175);
  doc.text(`Allegato Fatturazione`, 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(50);
  doc.text(`Allegato N°: ${reportNumber}`, 14, 30);
  doc.text(`Data Emissione: ${new Date().toLocaleDateString(locale)}`, 14, 36);
  
  doc.text(`Cliente: ${client?.name || ''}`, 14, 46);
  if (client?.vatNumber) {
    doc.text(`P.IVA: ${client.vatNumber}`, 14, 52);
  }
  if (project) {
    doc.text(`Progetto: ${project.name}`, 14, 58);
  }

  // Dettagli Interventi
  doc.setFontSize(14);
  doc.text(`Dettaglio Interventi`, 14, 70);

  const tableData: any[] = [];
  
  let totalHoursSum = 0;
  let totalMatsSum = 0;
  let totalExpSum = 0;
  
  reports.forEach((r: any) => {
    let mats = 0;
    let exp = 0;
    r.expenses?.forEach((e: any) => {
      // Per V1: tutte le spese vengono sommate in base al tipo (o tutto in extra se non distinguiamo)
      // Senza category, sommiamo tutto in "Altre spese" per semplicità
      exp += Number(e.amount) || 0;
    });

    let hours = r.totalHours || 0;
    r.additionalWorkers?.forEach((aw: any) => {
      hours += aw.totalHours || 0;
    });

    totalHoursSum += hours;
    totalMatsSum += mats;
    totalExpSum += exp;

    tableData.push([
      new Date(r.date).toLocaleDateString(locale),
      r.description || '',
      NumberFormat.format(r.ordinaryHours || 0),
      NumberFormat.format((r.overtimeHours || 0) + (r.festiveHours || 0) + (r.nightHours || 0)),
      NumberFormat.format(exp),
      '', // Tariffa Oraria (vuoto per compilazione manuale)
      ''  // Totale (vuoto per compilazione manuale)
    ]);
  });

  autoTable(doc, {
    startY: 75,
    head: [['Data', 'Descrizione', 'Ore Ord.', 'Ore Extra', 'Spese', 'Tariffa', 'Totale']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text(`Riepilogo Totali`, 14, finalY);
  
  doc.setTextColor(50);
  doc.text(`Totale Ore: ${NumberFormat.format(totalHoursSum)}`, 14, finalY + 8);
  // doc.text(`Totale Materiali: € ${NumberFormat.format(totalMatsSum)}`, 14, finalY + 14);
  doc.text(`Totale Spese: ${NumberFormat.format(totalExpSum)}`, 14, finalY + 14);

  doc.save(`${reportNumber}.pdf`);
};

export const exportInvoiceToExcel = (
  reports: any[],
  client: any,
  project: any,
  lang: Language
) => {
  const locale = localeMap[lang] || 'it-IT';

  const rows = [];
  const reportNumber = `ALL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  rows.push(['Allegato N°', reportNumber]);
  rows.push(['Data Emissione', new Date().toLocaleDateString(locale)]);
  rows.push(['Cliente', client?.name || '']);
  if (client?.vatNumber) {
    rows.push(['P.IVA', client.vatNumber]);
  }
  if (project) {
    rows.push(['Progetto', project.name]);
  }
  rows.push([]);
  
  rows.push(['Data', 'Cliente', 'Progetto', 'Descrizione', 'Ore Ord.', 'Ore Extra', 'Spese', 'Tariffa Oraria', 'Totale Riga']);
  
  let totalHoursSum = 0;
  let totalMatsSum = 0;
  let totalExpSum = 0;
  
  reports.forEach((r: any) => {
    let mats = 0;
    let exp = 0;
    r.expenses?.forEach((e: any) => {
      exp += Number(e.amount) || 0;
    });

    let hours = r.totalHours || 0;
    r.additionalWorkers?.forEach((aw: any) => {
      hours += aw.totalHours || 0;
    });

    totalHoursSum += hours;
    totalMatsSum += mats;
    totalExpSum += exp;

    rows.push([
      new Date(r.date).toLocaleDateString(locale),
      client?.name || '',
      project?.name || '',
      r.description || '',
      r.ordinaryHours || 0,
      (r.overtimeHours || 0) + (r.festiveHours || 0) + (r.nightHours || 0),
      exp,
      '', // Tariffa Oraria (vuota)
      ''  // Totale Riga (vuota)
    ]);
  });
  
  rows.push([]);
  rows.push(['Riepilogo']);
  rows.push(['Totale Ore', totalHoursSum]);
  rows.push(['Totale Spese', totalExpSum]);

  const ws = utils.aoa_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Allegato");
  writeFile(wb, `${reportNumber}.xlsx`);
};
