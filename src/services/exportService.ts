import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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

  const tableData = exportRows.map(r => [
    r.date,
    r.projectName,
    r.clientName,
    r.description,
    r.workerName,
    r.hours.toFixed(2),
    `€ ${r.purchasePrice.toFixed(2)}`,
    `€ ${r.extra.toFixed(2)}`,
    r.extraDescription,
    `€ ${r.sellingPrice.toFixed(2)}`,
    `€ ${r.margin.toFixed(2)}`,
    r.paid
  ]);

  autoTable(doc, {
    startY: 40,
    head: [[
      t('headerDate'), 
      t('headerProject'), 
      t('headerClient'), 
      t('headerActivity'), 
      t('headerWorker'), 
      t('headerHours'), 
      t('headerPurchase'), 
      t('headerExtra'), 
      t('headerExtraNotes'), 
      t('headerSelling'), 
      t('headerMargin'), 
      t('headerPaid')
    ]],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 18 },
      3: { cellWidth: 35 },
      10: { cellWidth: 20 },
    },
    margin: { top: 40, left: 10, right: 10 }
  });

  doc.save(`JobsReport_Dettaglio_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (exportRows: any[], lang: Language) => {
  const t = getT(lang);
  const worksheetData = exportRows.map(r => ({
    [t('headerDate')]: r.date,
    [t('headerProject')]: r.projectName,
    [t('headerClient')]: r.clientName,
    [t('headerActivity')]: r.description,
    [t('headerWorker')]: r.workerName,
    [t('headerHours')]: r.hours,
    [t('headerPurchase') + ' (€/h)']: r.purchasePrice,
    [t('headerExtra') + ' (€)']: r.extra,
    [t('headerExtraNotes')]: r.extraDescription,
    [t('headerSelling') + ' (€/h)']: r.sellingPrice,
    [t('headerMargin') + ' (€)']: r.margin,
    [t('headerPaid')]: r.paid
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t('workSummary'));
  
  XLSX.writeFile(workbook, `JobsReport_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};
