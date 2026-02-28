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
  const tableData = exportRows.map(r => [
    r.date,
    r.clientName,
    r.projectName,
    r.workerName,
    NumberFormat.format(r.hours),
    `€ ${NumberFormat.format(r.hourlyCost || 0)}`,
    `€ ${NumberFormat.format(r.cost || 0)}`,
    `€ ${NumberFormat.format(r.hourlyRevenue || 0)}`,
    `€ ${NumberFormat.format(r.revenue || 0)}`,
    r.paid
  ]);

  autoTable(doc, {
    startY: 40,
    head: [[
      t('date'),
      t('clients'),
      t('project'),
      t('personnel'),
      t('hours'),
      t('hourlyCost') + ' (€/h)', // Using hourlyCost key, ensuring it exists in translations.ts
      t('personnelCost') + ' (€)', // mapped to Costo Personale
      t('subcontractorCost') + ' (€/h)', // Placeholder for Revenue / Vendita
      t('grandTotal') + ' (€)', // Placeholder for Revenue / Vendita
      t('statusLabel')
    ]],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    margin: { top: 40, left: 10, right: 10 }
  });

  doc.save(`JobsReport_Dettaglio_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (exportRows: any[], lang: Language) => {
  try {
    const t = getT(lang);
    const worksheetData = exportRows.map(r => ({
      [t('date')]: r.date,
      [t('clients')]: r.clientName,
      [t('project')]: r.projectName,
      [t('personnel')]: r.workerName,
      [t('hours')]: r.hours,
      [t('hourlyCost') + ' (€/h)']: r.hourlyCost || 0,
      [t('personnelCost') + ' (€)']: r.cost || 0,
      [t('subcontractorCost') + ' (€/h)']: r.hourlyRevenue || 0,
      [t('grandTotal') + ' (€)']: r.revenue || 0,
      [t('statusLabel')]: r.paid
    }));

    const worksheet = utils.json_to_sheet(worksheetData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, t('workSummary'));

    writeFile(workbook, `JobsReport_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (err: any) {
    console.error("Excel export error:", err);
    alert("Errore scaricando l'Excel: " + err.message);
  }
};
