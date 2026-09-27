import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { calculateFinancials } from '../src/services/billingEngine';
import * as compensation from '../src/services/workerCompensation';
import { WorkSummaryReportBuilder } from '../src/services/export/ReportBuilder';
import { WorkerCompensationReport } from '../src/services/export/templates/WorkerCompensationReport';
import ExcelJS from 'exceljs';
const base = { totalHours: 10, overtimeHours: 2, totalExpenses: 7, isInternal: false, sellingPrice: 40, hourlyCost: 20, overtimeCost: 30, extraCost: 5, isSubcontractor: false };
assert.deepEqual(calculateFinancials(base), { revenue: 400, cost: 225, personnelCost: 225, subcontractorCost: 0, totalExpenses: 7, margin: 168 });
assert.deepEqual(calculateFinancials({ ...base, compensation: { method: 'HOURLY' } }), calculateFinancials(base));
const unit = calculateFinancials({ ...base, compensation: { method: 'PER_UNIT', unitRate: 12.5 }, completedQuantity: 2.5 });
assert.equal(unit.personnelCost, 31.25); assert.equal(unit.revenue, 400); assert.equal(unit.totalExpenses, 7); assert.equal(unit.margin, 361.75);
assert.equal(calculateFinancials({ ...base, compensation: { method: 'PER_UNIT', unitRate: 12.5 } }).cost, 0);
assert.throws(() => calculateFinancials({ ...base, compensation: { method: 'PER_UNIT', unitRate: -1 }, completedQuantity: 1 }));
assert.throws(() => calculateFinancials({ ...base, compensation: { method: 'PER_UNIT', unitRate: 1 }, completedQuantity: NaN }));
const fixed = { method: 'FIXED_PROJECT' as const, fixedAmount: 900 };
assert.equal(calculateFinancials({ ...base, compensation: fixed, recognizeFixedCost: true }).cost, 900);
assert.equal(calculateFinancials({ ...base, compensation: fixed, recognizeFixedCost: false }).cost, 0);
assert.equal(calculateFinancials({ ...base, compensation: fixed }).cost, 0);
assert.equal(calculateFinancials({ ...base, compensation: fixed, recognizeFixedCost: true, isInternal: true }).revenue, 0);
const external = calculateFinancials({ ...base, compensation: fixed, recognizeFixedCost: true, isSubcontractor: true });
assert.equal(external.personnelCost, 0); assert.equal(external.subcontractorCost, 900);
// Exhaustive legacy formula regression, independent of the repository's skipped snapshots.
for (const totalHours of [0, 2.5, 8, 12]) for (const overtimeHours of [0, 1, 10]) for (const isInternal of [true, false]) for (const isSubcontractor of [true, false]) {
  const input = { ...base, totalHours, overtimeHours, isInternal, isSubcontractor };
  assert.deepEqual(calculateFinancials({ ...input, compensation: { method: 'HOURLY' } }), calculateFinancials(input));
  const cost = Math.max(0, totalHours - overtimeHours) * 20 + overtimeHours * 30 + 5;
  const revenue = isInternal ? 0 : totalHours * 40;
  assert.deepEqual(calculateFinancials(input), { revenue, cost, personnelCost: isSubcontractor ? 0 : cost, subcontractorCost: isSubcontractor ? cost : 0, totalExpenses: 7, margin: revenue - cost - 7 });
}

// Execute the real DB summary/mappers with only I/O mocked.
const exports: any = {};
const compiled = ts.transpileModule(fs.readFileSync('src/services/dbService.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
new Function('exports','require',compiled)(exports, (name: string) => name === './billingEngine' ? { calculateFinancials } : name === './workerCompensation' ? compensation : {});
const db = exports.db;
db.checkAuthSession = async () => {};
const reports = [
  { id: 'later', projectId: 'p', userId: 'fixed', date: '2026-02-01', createdAt: 2, totalHours: 4, activityType: 'work', additionalWorkers: [{ userId: 'unit', totalHours: 1, completedQuantity: 2.5 }] },
  { id: 'first', projectId: 'p', userId: 'hourly', date: '2026-01-01', createdAt: 1, totalHours: 10, overtimeHours: 2, activityType: 'work', expenses: [{ amount: 7 }], additionalWorkers: [{ userId: 'fixed', totalHours: 3 }] }
];
db.getReports = async () => reports;
db.getProjects = async () => [{ id: 'p', name: 'Project', clientId: 'c', sellingPrice: 40, workerCompensations: { fixed, unit: { method: 'PER_UNIT', unitRate: 12.5, unitName: 'rooms' } } }];
db.getClients = async () => [{ id: 'c', name: 'Client' }];
db.getUsers = async () => ['fixed','unit','hourly'].map(id => ({ id, name: id, hourlyRate: 20, overtimeHourlyRate: 30, extraCost: 5 }));
const summaries = await db.getSummary();
assert.equal(summaries.find((r: any) => r.id === 'first_main').cost, 225);
assert.equal(summaries.find((r: any) => r.id === 'first_aw_0').cost, 900);
assert.equal(summaries.find((r: any) => r.id === 'later_main').cost, 0);
assert.equal(summaries.find((r: any) => r.id === 'later_aw_0').cost, 31.25);
const filtered = await db.getSummary('2026-02-01');
assert.equal(filtered.reduce((sum: number,r: any) => sum + r.cost,0),31.25);
reports.reverse(); assert.deepEqual(await db.getSummary(),summaries);
const duplicate = { ...reports[0], id: 'duplicate', userId: 'fixed', additionalWorkers: [{ userId: 'fixed', totalHours: 0 }] };
assert.equal([...compensation.fixedCostEntries([duplicate] as any)].length,1);
assert.equal(compensation.getWorkerCompensation(undefined,'legacy').method,'HOURLY');
assert.equal(db.mapSupabaseProject({id:'old'}).workerCompensations.fixed,undefined);
const mapped = db.mapSupabaseReport({id:'m',completed_quantity:'1.25',additionalWorkers:[{worker_id:'u',completed_quantity:'2.75'}]});
assert.equal(mapped.completedQuantity,1.25); assert.equal(mapped.additionalWorkers[0].completedQuantity,2.75);
const projectMapped = db.mapSupabaseProject({id:'p',worker_compensations:[{worker_id:'unit',method:'PER_UNIT',unit_rate:'12.5'}]});
assert.equal(projectMapped.workerCompensations.unit.unitRate,12.5);
const sessions = summaries.map((r: any) => ({...r,workerName:r.userName,hours:r.totalHours}));
const config = { companyName:'Test',generatedBy:'Test',filtersApplied:{},includeEconomicData:true };
const document = new WorkSummaryReportBuilder(sessions,config).build();
assert.ok(document.sections.some(s => s.title === 'Compensi lavoratori'));
assert.ok(!new WorkSummaryReportBuilder(sessions,{...config,includeEconomicData:false}).build().sections.some(s => s.title === 'Compensi lavoratori'));
assert.ok(!new WorkSummaryReportBuilder([{date:'2026-01-01',clientName:'C',projectName:'P',workerName:'W',description:'',hours:8}],config).build().sections.some(s => s.title === 'Compensi lavoratori'));
const workbook = new ExcelJS.Workbook();
await new WorkerCompensationReport().render(workbook,{summaries,projects:[],workers:[],companyName:'Test',language:'it'});
assert.equal(workbook.worksheets.length,1);
assert.equal(workbook.worksheets[0].getColumn(10).values.slice(2).reduce((s: number,v: any) => s+(typeof v === 'number'?v:0),0),1156.25);
assert.equal(workbook.worksheets[0].getColumn(9).values.slice(2).reduce((s: number,v: any) => s+(typeof v === 'number'?v:0),0),900);
console.log('PASS: 96 legacy scenarios; hourly/unit/fixed math; real summary integration, filters, helpers, mapping and exports.');
