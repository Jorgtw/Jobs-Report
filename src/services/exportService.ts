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
  const now = new Date().toLocaleString();
  const margin = 14;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 64, 175);
  doc.text(t('complianceReport').toUpperCase(), margin, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${t('date')}: ${report.date}`, margin, 30);
  doc.text(`${t('generatedOn')}: ${now}`, margin, 35);

  // Work Details
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, 40, 196, 40);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(t('project').toUpperCase(), margin, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${t('clients')}: ${report.clientName}`, margin, 58);
  doc.text(`${t('project')}: ${report.projectName}`, margin, 64);
  doc.text(`${t('personnel')}: ${report.userName}`, margin, 70);
  
  doc.setFont('helvetica', 'bold');
  doc.text(t('description').toUpperCase(), margin, 80);
  doc.setFont('helvetica', 'normal');
  const splitDesc = doc.splitTextToSize(report.description || '---', 170);
  doc.text(splitDesc, margin, 86);

  const descHeight = splitDesc.length * 5;
  let currentY = 86 + descHeight + 10;

  // Totals
  doc.setFont('helvetica', 'bold');
  doc.text(`${t('hours')}: ${report.totalHours}h`, margin, currentY);
  currentY += 15;

  // Signature
  if (signature) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(t('complianceSignature').toUpperCase(), margin, currentY);
    doc.addImage(signature, 'PNG', margin, currentY + 2, 60, 30);
    currentY += 40;
  }

  // Photos on a new page if they exist
  if (photos && photos.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(30, 64, 175);
    doc.text(t('compliancePhotos').toUpperCase(), margin, 20);
    
    let photoY = 30;
    photos.forEach((photo) => {
      // Each photo takes about half a page (approx 120mm height)
      if (photoY > 200) {
        doc.addPage();
        photoY = 20;
      }
      // Aspect ratio handling would be better but for simplicity we use a fixed box
      doc.addImage(photo, 'JPEG', margin, photoY, 180, 100);
      photoY += 110;
    });
  }

  doc.save(`Compliance_${report.date}_${report.projectName.replace(/\s/g, '_')}.pdf`);
};
