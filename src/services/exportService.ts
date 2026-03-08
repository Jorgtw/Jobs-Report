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
