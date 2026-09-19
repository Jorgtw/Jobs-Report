import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import ExcelJS from 'exceljs';

// Execute the production service with only application/network and download boundaries mocked.
const require = createRequire(import.meta.url);
let saved;
let failSave = false;
let alertMessage;
const source = readFileSync(new URL('../src/services/exportService.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
}).outputText;
const service = {};
new Function('exports', 'require', 'alert', 'console', compiled)(service, name => {
  if (name === '../utils/fileDownloader') return { saveAndShareFile: async (data, name) => {
    if (failSave) throw new Error('test download failure');
    saved = { data, name };
  } };
  if (name.startsWith('.')) return {};
  return require(name);
}, message => { alertMessage = message; }, { ...console, error() {} });

const hours = [7.5, 7.5, 7.5, 7.5, 7, 7.5, 7.5, 7.5, 7.5, 7, 7.5, 5, 5];
const rows = hours.map((hours, i) => ({
  date: `2026-09-${String(i + 1).padStart(2, '0')}`,
  dateFormatted: `${String(i + 1).padStart(2, '0')}/09/2026`,
  clientName: 'Test client', projectName: 'Test project', description: 'Test activity',
  ordinaryHours: hours, overtimeHours: 0, festiveHours: 0, nightHours: 0, totalHours: hours
}));
await service.exportWorkerToExcel([...rows].reverse(), 'it', ' Test Worker ', 'September', 'Test Company');
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(saved.data);
const sheet = workbook.getWorksheet('Rapportino Ore');
assert.ok(sheet.getCell('A2').value.includes('Test Company'));
assert.equal(sheet.getCell('A5').value.toISOString(), '2026-09-01T00:00:00.000Z');
for (const column of ['A', 'B', 'C']) assert.equal(sheet.getCell(`${column}18`).value, null);
assert.equal(sheet.getCell('D18').value, 'TOTALE GENERALE');
assert.equal(sheet.getCell('E18').value, 91.5);
assert.equal(sheet.getCell('I18').value, 91.5);
for (const column of ['F', 'G', 'H']) assert.equal(sheet.getCell(`${column}18`).value, 0);
assert.deepEqual(['E', 'F', 'G', 'H', 'I'].map(c => sheet.getCell(`${c}4`).value),
  ['Ordinarie', 'Straordinarie', 'Festive', 'Notturne', 'Totale']);
for (const column of ['E', 'F', 'G', 'H', 'I']) {
  for (const row of [5, 18]) assert.equal(sheet.getCell(`${column}${row}`).numFmt.split(';')[2], '');
}
await service.exportWorkerToExcel(rows, 'en', 'Test Worker');
await workbook.xlsx.load(saved.data);
assert.deepEqual(['E', 'F', 'G', 'H', 'I'].map(c => workbook.getWorksheet('Rapportino Ore').getCell(`${c}4`).value),
  ['Ordinary', 'Overtime', 'Festive', 'Night', 'Total']);

for (const count of [0, 13, 150]) {
  await service.exportWorkerToPDF(Array.from({ length: count }, (_, i) => rows[i % rows.length]), 'it', 'Test Worker');
  const pdf = Buffer.from(await saved.data.arrayBuffer()).toString('latin1');
  assert.ok(!pdf.includes('(0,0 h)'));
  const pages = [...pdf.matchAll(/\/Type \/Page\b/g)].length;
  assert.ok(count < 150 || pages > 1);
  for (let page = 1; page <= pages; page++) assert.ok(pdf.includes(`(Pagina ${page} di ${pages})`), `Missing correct footer on page ${page}`);
  if (count === 13) assert.ok(pdf.includes('(91,5 h)'));
}
failSave = true;
await service.exportWorkerToExcel([], 'en', 'Test Worker');
assert.equal(alertMessage, 'Error downloading Excel: test download failure');
console.log('Worker export checks passed: Excel dates/order/totals, empty/single/multiple-page PDFs, localized errors.');
