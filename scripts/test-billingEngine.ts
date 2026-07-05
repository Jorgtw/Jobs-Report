import * as fs from 'fs';
import * as path from 'path';
import { calculateFinancials } from '../src/services/billingEngine';

const snapshotPath = path.join(process.cwd(), 'test_fixtures', 'financial-contract-v1.json');

if (!fs.existsSync(snapshotPath)) {
  console.error("❌ ERRORE: File snapshot non trovato.");
  console.error("Esegui prima: npm run export:financial");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

let failed = 0;
let passed = 0;
let skipped = 0;

console.log("🚀 Inizio Verification Engine (Pure Math Diff)\n");

data.snapshots.forEach((snap: any, index: number) => {
  const rec = snap.inputRecord;
  const expected = snap.legacyExpected;

  // 1. Calcola Main Worker
  let totalRevenue = 0;
  let totalCost = 0;

  const mainFin = calculateFinancials({
    totalHours: rec.total_hours,
    overtimeHours: rec.overtime_hours,
    totalExpenses: rec.expenses,
    isInternal: rec.is_internal,
    sellingPrice: rec.selling_price,
    hourlyCost: rec.main_worker.hourly_cost,
    overtimeCost: rec.main_worker.overtime_cost,
    extraCost: rec.main_worker.extra_cost,
    isSubcontractor: rec.main_worker.is_subcontractor
  });

  totalRevenue += mainFin.revenue;
  totalCost += mainFin.cost;

  // 2. Calcola Additional Workers
  for (const aw of rec.additional_workers) {
    const awFin = calculateFinancials({
      totalHours: aw.hours,
      overtimeHours: aw.overtime_hours,
      totalExpenses: 0,
      isInternal: rec.is_internal,
      sellingPrice: rec.selling_price,
      hourlyCost: aw.hourly_cost,
      overtimeCost: aw.overtime_cost,
      extraCost: aw.extra_cost,
      isSubcontractor: aw.is_subcontractor
    });
    totalRevenue += awFin.revenue;
    totalCost += awFin.cost;
  }

  const margin = totalRevenue - totalCost;

  // 3. Verifica puramente oggettiva (Diff)
  if (expected.margin === null) {
    skipped++;
  } else {
    const marginDiff = margin - expected.margin;
    
    if (Math.abs(marginDiff) < 0.01) {
      passed++;
    } else {
      console.error(`❌ DIFFERENZA RILEVATA nel Caso ${index + 1} (${snap._meta.scenario})`);
      console.error(`   EXPECTED: €${expected.margin.toFixed(2)}`);
      console.error(`   ACTUAL:   €${margin.toFixed(2)}`);
      console.error(`   DIFF:     €${marginDiff.toFixed(2)}`);
      failed++;
    }
  }
});

console.log("\n---------------------------------------------------");
if (failed > 0) {
  console.error(`🔥 VERIFICA FALLITA: ${failed} report differiscono dalla Ground Truth.`);
  console.error(`   Esegui 'npm run report:financial' per l'audit di business.`);
  process.exit(1);
} else {
  console.log(`✅ VERIFICA SUPERATA: ${passed} report allineati alla Ground Truth. (${skipped} saltati)`);
  process.exit(0);
}
