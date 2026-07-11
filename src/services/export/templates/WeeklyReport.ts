import * as ExcelJS from 'exceljs';
import { ReportData, ReportTemplate } from '../ReportEngine';
import { applyHeaderStyle, applySubHeaderStyle, applyTableHeaderStyle, applyDataStyle, ReportStyles } from '../utils/formatters';
import { getISOWeek, getISOWeekYear, getISOWeekDateRange } from '../utils/dateUtils';

export class WeeklyReport implements ReportTemplate {
  name = 'Weekly Report';
  type = 'OPERATIVE' as const;

  async render(workbook: ExcelJS.Workbook, data: ReportData): Promise<void> {
    const sheet = workbook.addWorksheet('Report Settimanale', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5, right: 0.5,
          top: 0.5, bottom: 0.5,
          header: 0.3, footer: 0.3
        },
        printTitlesRow: '1:3' // Repeat header
      }
    });

    // Col width setup
    sheet.columns = [
      { width: 30 }, // Cliente
      { width: 40 }, // Progetto
      { width: 15 }, // Interventi
      { width: 15 }  // Ore
    ];

    // Group reports by Week -> Project
    // Map<YearWeek, Map<ProjectId, {hours, count}>>
    const weeksMap = new Map<string, Map<string, { hours: number, count: number, clientName: string }>>();

    let minWeekKey = "9999-W99";
    let maxWeekKey = "0000-W00";
    let periodYear = new Date().getFullYear();

    for (const r of data.summaries) {
      if (!r.projectId) continue;
      
      const week = getISOWeek(r.date);
      const year = getISOWeekYear(r.date);
      const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;

      if (weekKey < minWeekKey) minWeekKey = weekKey;
      if (weekKey > maxWeekKey) maxWeekKey = weekKey;
      periodYear = year; // Assumiamo tutte circa dello stesso anno

      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, new Map());
      }

      const projectsInWeek = weeksMap.get(weekKey)!;
      if (!projectsInWeek.has(r.projectId)) {
        projectsInWeek.set(r.projectId, { hours: 0, count: 0, clientName: r.clientName || r.clientId || 'Sconosciuto' });
      }

      const pStats = projectsInWeek.get(r.projectId)!;
      pStats.hours += (r.totalHours || 0);
      pStats.count += 1;
    }

    // Riga 1: Titolo
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'REPORT SETTIMANALE';
    applyHeaderStyle(titleCell);
    sheet.getRow(1).height = 30;

    // Riga 2: Sottotitolo
    sheet.mergeCells('A2:D2');
    const subTitleCell = sheet.getCell('A2');
    
    let periodText = 'Periodo non definito';
    if (minWeekKey !== "9999-W99") {
      const startW = minWeekKey.split('-W')[1];
      const endW = maxWeekKey.split('-W')[1];
      periodText = startW === endW ? `Week ${startW}, ${periodYear}` : `Week ${startW} — Week ${endW}, ${periodYear}`;
    }

    subTitleCell.value = `Periodo: ${periodText}  |  ${data.companyName}`;
    applySubHeaderStyle(subTitleCell);
    sheet.getRow(2).height = 20;

    sheet.getRow(3).height = 10;

    // Sort weeks
    const sortedWeekKeys = Array.from(weeksMap.keys()).sort();

    let currentRow = 4;
    let grandTotalHours = 0;
    let grandTotalCount = 0;

    for (const weekKey of sortedWeekKeys) {
      const year = parseInt(weekKey.split('-W')[0]);
      const week = parseInt(weekKey.split('-W')[1]);
      const dateRange = getISOWeekDateRange(year, week);

      // Intestazione Settimana (Blocco visivo separato)
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const weekHeader = sheet.getCell(`A${currentRow}`);
      weekHeader.value = `Week ${week}  (${dateRange})`;
      weekHeader.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      weekHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
      weekHeader.alignment = { vertical: 'middle', horizontal: 'left' };
      sheet.getRow(currentRow).height = 25;
      currentRow++;

      // Intestazioni colonne per la settimana
      const headers = ['Cliente', 'Progetto', 'Interventi', 'Ore'];
      headers.forEach((h, i) => {
        const cell = sheet.getCell(currentRow, i + 1);
        cell.value = h;
        applyTableHeaderStyle(cell, i === 0 || i === 1 ? 'left' : 'center');
      });
      currentRow++;

      let weekTotalHours = 0;
      let weekTotalCount = 0;

      const projectsInWeek = weeksMap.get(weekKey)!;
      for (const [projectId, stats] of Array.from(projectsInWeek.entries())) {
        const project = data.projects.find(p => p.id === projectId);
        const projectName = project ? project.name : 'Sconosciuto';
        const clientName = stats.clientName;
        const row = sheet.getRow(currentRow);
        
        row.getCell(1).value = clientName;
        applyDataStyle(row.getCell(1), 'left');

        row.getCell(2).value = projectName;
        applyDataStyle(row.getCell(2), 'left');

        const countCell = row.getCell(3);
        countCell.value = stats.count;
        applyDataStyle(countCell);

        const hoursCell = row.getCell(4);
        hoursCell.value = stats.hours;
        applyDataStyle(hoursCell);
        hoursCell.numFmt = '0.0 "h"';

        weekTotalHours += stats.hours;
        weekTotalCount += stats.count;
        
        grandTotalHours += stats.hours;
        grandTotalCount += stats.count;

        currentRow++;
      }

      // Totale Settimana
      sheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const totLabel = sheet.getCell(`A${currentRow}`);
      totLabel.value = `Totale — Week ${week}`;
      totLabel.font = { name: 'Arial', size: 10, bold: true };
      totLabel.alignment = { vertical: 'middle', horizontal: 'right' };
      totLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.lightGray } };
      totLabel.border = ReportStyles.borders.standard;

      const totCount = sheet.getCell(`C${currentRow}`);
      totCount.value = weekTotalCount;
      totCount.font = { name: 'Arial', size: 10, bold: true };
      totCount.alignment = { vertical: 'middle', horizontal: 'center' };
      totCount.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.lightGray } };
      totCount.border = ReportStyles.borders.standard;

      const totHours = sheet.getCell(`D${currentRow}`);
      totHours.value = weekTotalHours;
      totHours.font = { name: 'Arial', size: 10, bold: true };
      totHours.alignment = { vertical: 'middle', horizontal: 'center' };
      totHours.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.lightGray } };
      totHours.border = ReportStyles.borders.standard;
      totHours.numFmt = '0.0 "h"';

      currentRow += 2; // Spazio
    }

    // TOTALE PERIODO
    sheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const gTotLabel = sheet.getCell(`A${currentRow}`);
    gTotLabel.value = `TOTALE PERIODO`;
    gTotLabel.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    gTotLabel.alignment = { vertical: 'middle', horizontal: 'center' };
    gTotLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    gTotLabel.border = ReportStyles.borders.standard;

    const gTotCount = sheet.getCell(`C${currentRow}`);
    gTotCount.value = grandTotalCount;
    gTotCount.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    gTotCount.alignment = { vertical: 'middle', horizontal: 'center' };
    gTotCount.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    gTotCount.border = ReportStyles.borders.standard;

    const gTotHours = sheet.getCell(`D${currentRow}`);
    gTotHours.value = grandTotalHours;
    gTotHours.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    gTotHours.alignment = { vertical: 'middle', horizontal: 'center' };
    gTotHours.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ReportStyles.colors.primaryDarkBlue } };
    gTotHours.border = ReportStyles.borders.standard;
    gTotHours.numFmt = '0.0 "h"';
    sheet.getRow(currentRow).height = 25;
  }
}
