import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
await build({entryPoints:['src/services/summaryExportData.ts','src/services/export/ReportBuilder.ts'],outdir:'scratch/summary-export',bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'}});
const {summaryToWorkSession}=await import(pathToFileURL(path.resolve('scratch/summary-export/summaryExportData.mjs')).href);
const base={date:'2026-11-08',projectId:'p',clientName:'Test',projectName:'Progetto',userName:'Luca',description:'Prova',totalHours:8,totalExpenses:12.4,personnelCost:160};
const cases=[{totalHours:20,overtimeHours:0,festiveHours:0,nightHours:0,expected:[20,0,0,0]},{totalHours:10,overtimeHours:2,festiveHours:1,nightHours:1,expected:[6,2,1,1]},{totalHours:8,expected:[8,0,0,0]},{totalHours:0,expected:[0,0,0,0]}];
for(const c of cases){const r=summaryToWorkSession({...base,...c});assert.deepEqual([r.ordinaryHours,r.extraHours,r.holidayHours,r.nightHours],c.expected);assert.equal(r.ordinaryHours+r.extraHours+r.holidayHours+r.nightHours,r.hours);assert.equal(r.expenses,12.4);assert.equal(r.cost,160)}
console.log('PASS PDF export mapping: ordinary, extra, festive, night, legacy, zero; costs and expenses preserved.');
