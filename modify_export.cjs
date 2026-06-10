const fs = require('fs');
let code = fs.readFileSync('api/export-excel.ts', 'utf8');

// Update PayrollCols
code = code.replace(
  /workerName: 0,\s*\/\/ Column A\r?\n  ordinaryHours: 1,\s*\/\/ Column B\r?\n  overtimeHours: 2,\s*\/\/ Column C\r?\n  totalHours: 3,\s*\/\/ Column D\r?\n  hourlyRate: 4,\s*\/\/ Column E\r?\n  totalCost: 5\s*\/\/ Column F/,
  'workerName: 0,\n  ordinaryHours: 1,\n  overtimeHours: 2,\n  festiveHours: 3,\n  nightHours: 4,\n  totalHours: 5,\n  hourlyRate: 6,\n  totalCost: 7'
);

// Update RawDataCols
code = code.replace(
  /ordinaryHours: 3,\s*\/\/ Column D\r?\n  overtimeHours: 4,\s*\/\/ Column E\r?\n  additionalHours: 5,\/\/ Column F\r?\n  totalHours: 6,\s*\/\/ Column G\r?\n  activityType: 7\s*\/\/ Column H/,
  'ordinaryHours: 3,\n  overtimeHours: 4,\n  festiveHours: 5,\n  nightHours: 6,\n  additionalHours: 7,\n  totalHours: 8,\n  activityType: 9'
);

// Update Translations
code = code.replace(/overtimeHours: 'Ore straordinarie',/g, "overtimeHours: 'Ore straordinarie',\n    festiveHours: 'Ore festive',\n    nightHours: 'Ore notturne',");
code = code.replace(/rawOvertimeHours: 'Ore straordinarie',/g, "rawOvertimeHours: 'Ore straordinarie',\n    rawFestiveHours: 'Ore festive',\n    rawNightHours: 'Ore notturne',");

code = code.replace(/overtimeHours: 'Overtime hours',/g, "overtimeHours: 'Overtime hours',\n    festiveHours: 'Festive hours',\n    nightHours: 'Night hours',");
code = code.replace(/rawOvertimeHours: 'Overtime hours',/g, "rawOvertimeHours: 'Overtime hours',\n    rawFestiveHours: 'Festive hours',\n    rawNightHours: 'Night hours',");

code = code.replace(/overtimeHours: 'Horas extraordinarias',/g, "overtimeHours: 'Horas extraordinarias',\n    festiveHours: 'Horas festivas',\n    nightHours: 'Horas nocturnas',");
code = code.replace(/rawOvertimeHours: 'Horas extraordinarias',/g, "rawOvertimeHours: 'Horas extraordinarias',\n    rawFestiveHours: 'Horas festivas',\n    rawNightHours: 'Horas nocturnas',");

code = code.replace(/overtimeHours: 'Nadgodziny',/g, "overtimeHours: 'Nadgodziny',\n    festiveHours: 'Godziny świąteczne',\n    nightHours: 'Godziny nocne',");
code = code.replace(/rawOvertimeHours: 'Nadgodziny',/g, "rawOvertimeHours: 'Nadgodziny',\n    rawFestiveHours: 'Godziny świąteczne',\n    rawNightHours: 'Godziny nocne',");

code = code.replace(/overtimeHours: 'Fazla mesai saatleri',/g, "overtimeHours: 'Fazla mesai saatleri',\n    festiveHours: 'Tatil saatleri',\n    nightHours: 'Gece saatleri',");
code = code.replace(/rawOvertimeHours: 'Fazla mesai',/g, "rawOvertimeHours: 'Fazla mesai',\n    rawFestiveHours: 'Tatil saatleri',\n    rawNightHours: 'Gece saatleri',");

code = code.replace(/overtimeHours: 'Overtidstimer',/g, "overtimeHours: 'Overtidstimer',\n    festiveHours: 'Helligdagstimer',\n    nightHours: 'Nattetimer',");
code = code.replace(/rawOvertimeHours: 'Overtidstimer',/g, "rawOvertimeHours: 'Overtidstimer',\n    rawFestiveHours: 'Helligdagstimer',\n    rawNightHours: 'Nattetimer',");

// Update select query
code = code.replace(
  /id, date, total_hours, overtime_hours, activity_type, created_by, project_id,\r?\n\s*additionalWorkers:rapportini_workers\(worker_id, hours, overtime_hours, hourly_rate, person_name, membership_type, subcontractor_id\)/g,
  'id, date, total_hours, overtime_hours, festive_hours, night_hours, activity_type, created_by, project_id,\n        additionalWorkers:rapportini_workers(worker_id, hours, overtime_hours, festive_hours, night_hours, hourly_rate, person_name, membership_type, subcontractor_id)'
);

// Update PayrollService
code = code.replace(
  /ordinaryHours: 0,\r?\n\s*overtimeHours: 0,/g,
  'ordinaryHours: 0,\n              overtimeHours: 0,\n              festiveHours: 0,\n              nightHours: 0,'
);

code = code.replace(
  /const hours = Number\(r\.total_hours\) \|\| 0;\r?\n\s*const overtime = Number\(r\.overtime_hours\) \|\| 0;\r?\n\s*pData\.ordinaryHours \+= Math\.max\(0, hours - overtime\);\r?\n\s*pData\.overtimeHours \+= overtime;/g,
  `const hours = Number(r.total_hours) || 0;
          const overtime = Number(r.overtime_hours) || 0;
          const festive = Number(r.festive_hours) || 0;
          const night = Number(r.night_hours) || 0;
          pData.ordinaryHours += Math.max(0, hours - overtime - festive - night);
          pData.overtimeHours += overtime;
          pData.festiveHours += festive;
          pData.nightHours += night;`
);

code = code.replace(
  /const hours = Number\(aw\.hours\) \|\| 0;\r?\n\s*const overtime = Number\(aw\.overtime_hours\) \|\| 0;\r?\n\s*pData\.ordinaryHours \+= Math\.max\(0, hours - overtime\);\r?\n\s*pData\.overtimeHours \+= overtime;/g,
  `const hours = Number(aw.hours) || 0;
            const overtime = Number(aw.overtime_hours) || 0;
            const festive = Number(aw.festive_hours) || 0;
            const night = Number(aw.night_hours) || 0;
            pData.ordinaryHours += Math.max(0, hours - overtime - festive - night);
            pData.overtimeHours += overtime;
            pData.festiveHours += festive;
            pData.nightHours += night;`
);

// Update Export Payroll Columns
code = code.replace(
  /t\.ordinaryHours,\r?\n\s*t\.overtimeHours,\r?\n\s*t\.totalHours,/g,
  't.ordinaryHours,\n        t.overtimeHours,\n        t.festiveHours,\n        t.nightHours,\n        t.totalHours,'
);

code = code.replace(
  /\{\s*v:\s*p\.ordinaryHours,\s*t:\s*'n',\s*z:\s*'#,##0\.00'\s*\},\r?\n\s*\{\s*v:\s*p\.overtimeHours,\s*t:\s*'n',\s*z:\s*'#,##0\.00'\s*\},\r?\n\s*\{\s*f:\s*`\$\{getColLetter\(PayrollCols\.ordinaryHours\)\}\$\{R\}\+\$\{getColLetter\(PayrollCols\.overtimeHours\)\}\$\{R\}`,\s*t:\s*'n',\s*z:\s*'#,##0\.00'\s*\}/g,
  `{ v: p.ordinaryHours, t: 'n', z: '#,##0.00' },
        { v: p.overtimeHours, t: 'n', z: '#,##0.00' },
        { v: p.festiveHours, t: 'n', z: '#,##0.00' },
        { v: p.nightHours, t: 'n', z: '#,##0.00' },
        { f: \`\${getColLetter(PayrollCols.ordinaryHours)}\${R}+\${getColLetter(PayrollCols.overtimeHours)}\${R}+\${getColLetter(PayrollCols.festiveHours)}\${R}+\${getColLetter(PayrollCols.nightHours)}\${R}\`, t: 'n', z: '#,##0.00' }`
);

code = code.replace(
  /wsPayroll\['!cols'\] = \[\{ wch: 25 \}, \{ wch: 15 \}, \{ wch: 15 \}, \{ wch: 15 \}, \{ wch: 15 \}, \{ wch: 18 \}\];/g,
  "wsPayroll['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];"
);

// Update Export Raw Columns
code = code.replace(
  /t\.rawOrdinaryHours,\r?\n\s*t\.rawOvertimeHours,\r?\n\s*t\.rawAdditionalHours,/g,
  't.rawOrdinaryHours,\n        t.rawOvertimeHours,\n        t.rawFestiveHours,\n        t.rawNightHours,\n        t.rawAdditionalHours,'
);

code = code.replace(
  /const ordinaryHours = Math\.max\(0, totalHours - overtimeHours\);\r?\n\s*rawDataRows\.push\(\[\r?\n\s*\{\s*v:\s*r\.date,\s*t:\s*'s'\s*\},\r?\n\s*\{\s*v:\s*workerName,\s*t:\s*'s'\s*\},\r?\n\s*\{\s*v:\s*r\.projectName \|\| 'N\/A',\s*t:\s*'s'\s*\},\r?\n\s*\{\s*v:\s*ordinaryHours,\s*t:\s*'n',\s*z:\s*'#,##0\.00'\s*\},\r?\n\s*\{\s*v:\s*overtimeHours,\s*t:\s*'n',\s*z:\s*'#,##0\.00'\s*\},\r?\n\s*\{\s*v:\s*additionalHours,\s*t:\s*'n',\s*z:\s*'#,##0\.00'\s*\}/g,
  `const festiveHours = Number(r.festive_hours) || 0;
      const nightHours = Number(r.night_hours) || 0;
      const ordinaryHours = Math.max(0, totalHours - overtimeHours - festiveHours - nightHours);
      rawDataRows.push([
        { v: r.date, t: 's' },
        { v: workerName, t: 's' },
        { v: r.projectName || 'N/A', t: 's' },
        { v: ordinaryHours, t: 'n', z: '#,##0.00' },
        { v: overtimeHours, t: 'n', z: '#,##0.00' },
        { v: festiveHours, t: 'n', z: '#,##0.00' },
        { v: nightHours, t: 'n', z: '#,##0.00' },
        { v: additionalHours, t: 'n', z: '#,##0.00' }`
);

code = code.replace(
  /wsRaw\['!cols'\] = \[\{ wch: 14 \}, \{ wch: 25 \}, \{ wch: 28 \}, \{ wch: 16 \}, \{ wch: 16 \}, \{ wch: 22 \}, \{ wch: 14 \}, \{ wch: 18 \}\];/g,
  "wsRaw['!cols'] = [{ wch: 14 }, { wch: 25 }, { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 18 }];"
);

fs.writeFileSync('api/export-excel.ts', code);
console.log('Done modifying api/export-excel.ts');
