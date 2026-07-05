import * as fs from 'fs';
import * as path from 'path';
import { calculateFinancials } from '../src/services/billingEngine';

const snapshotPath = path.join(process.cwd(), 'test_fixtures', 'financial-contract-v1.json');
const fcpPath = path.join(process.cwd(), 'test_fixtures', 'fcp-proposal.json');

if (!fs.existsSync(snapshotPath)) {
  console.error("❌ ERRORE: File snapshot non trovato.");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

let totalDiff = 0;
const clusters: Record<string, number> = {
  regression: 0,
  improvement: 0,
  unknown: 0
};

const fcpProposals: any[] = [];

console.log("===================================================");
console.log("       FINANCIAL AUDIT & DIFF REPORT GENERATOR      ");
console.log("===================================================\n");

data.snapshots.forEach((snap: any, index: number) => {
  const rec = snap.inputRecord;
  const expected = snap.legacyExpected;

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
  const legacyMargin = expected.margin !== null ? expected.margin : 0;
  const marginDiff = margin - legacyMargin;

  if (Math.abs(marginDiff) > 0.01 || expected.margin === null) {
    const status = expected.margin === null ? "unknown" : (expected.status || "unknown");
    totalDiff += marginDiff;

    let icon = "⚠️";
    let type = "DIFFERENCE (UNVERIFIED)";
    
    if (status === "trusted") {
      icon = "❌";
      type = "REGRESSION (CONFIRMED)";
      clusters.regression++;
    } else if (status === "deprecated") {
      icon = "💡";
      type = "IMPROVEMENT (CONFIRMED)";
      clusters.improvement++;
    } else {
      clusters.unknown++;
    }

    console.log(`${icon} CASO ${index + 1}: ${snap._meta.scenario}`);
    console.log(`   Type:      ${type}`);
    console.log(`   Delta:     €${marginDiff > 0 ? '+' : ''}${marginDiff.toFixed(2)}`);
    console.log(`   Action:    Generato FCP per revisione.\n`);

    fcpProposals.push({
      fcp_id: `FCP-${rec.id}`,
      scenario: snap._meta.scenario,
      status: "proposed", // Deve essere cambiato a mano in "approved" per essere applicato
      old_margin: expected.margin,
      new_revenue: totalRevenue,
      new_cost: totalCost,
      new_margin: margin,
      delta: marginDiff
    });
  }
});

console.log("---------------------------------------------------");
console.log("Riepilogo Impatto Economico e Analisi Cluster:");
console.log(`- Impatto Globale Delta: €${totalDiff > 0 ? '+' : ''}${totalDiff.toFixed(2)}`);
console.log(`- Regressioni: ${clusters.regression}`);
console.log(`- Miglioramenti Approvati: ${clusters.improvement}`);
console.log(`- Ambiguità: ${clusters.unknown}`);
console.log("===================================================\n");

if (fcpProposals.length > 0) {
  fs.writeFileSync(fcpPath, JSON.stringify({ fcp_list: fcpProposals }, null, 2));
  console.log(`📝 GENERATO FCP (Financial Change Proposal) con ${fcpProposals.length} record.`);
  console.log(`   Modifica 'test_fixtures/fcp-proposal.json' impostando status: "approved" per validare.`);
  console.log(`   Successivamente lancia 'npm run promote:financial' per aggiornare il contratto.`);
} else {
  if (fs.existsSync(fcpPath)) fs.unlinkSync(fcpPath); // Pulizia
  console.log("ℹ️ Nessun FCP generato. Il contratto è allineato.");
}
