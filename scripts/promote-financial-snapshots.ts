import * as fs from 'fs';
import * as path from 'path';

const contractPath = path.join(process.cwd(), 'test_fixtures', 'financial-contract-v1.json');
const fcpPath = path.join(process.cwd(), 'test_fixtures', 'fcp-proposal.json');

if (!fs.existsSync(contractPath)) {
  console.error("❌ ERRORE: File contratto non trovato.");
  process.exit(1);
}

if (!fs.existsSync(fcpPath)) {
  console.log("ℹ️ Nessun FCP (Financial Change Proposal) pendente trovato.");
  console.log("   Esegui 'npm run report:financial' se ci sono discrepanze da valutare.");
  process.exit(0);
}

const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const fcpData = JSON.parse(fs.readFileSync(fcpPath, 'utf8'));

let promotedCount = 0;
let rejectedOrPendingCount = 0;

console.log("===================================================");
console.log("          FINANCIAL GOVERNANCE PROMOTION LAYER     ");
console.log("===================================================\n");
console.log("🔍 Lettura FCP approvati...\n");

fcpData.fcp_list.forEach((fcp: any) => {
  if (fcp.status === "approved") {
    // Cerchiamo il record nel contratto
    const snap = contractData.snapshots.find((s: any) => `FCP-${s.inputRecord.id}` === fcp.fcp_id);
    
    if (snap) {
      console.log(`✅ Applicazione FCP approvato: ${fcp.fcp_id} (${fcp.scenario})`);
      console.log(`   Nuovo Margin: €${fcp.new_margin.toFixed(2)} (Delta: €${fcp.delta.toFixed(2)})`);
      
      snap.legacyExpected = {
        status: "trusted",
        revenue: fcp.new_revenue,
        cost: fcp.new_cost,
        margin: fcp.new_margin
      };
      promotedCount++;
    } else {
      console.error(`⚠️ FCP orfano ignorato: ${fcp.fcp_id}`);
    }
  } else {
    rejectedOrPendingCount++;
  }
});

if (promotedCount > 0) {
  fs.writeFileSync(contractPath, JSON.stringify(contractData, null, 2));
  console.log("\n---------------------------------------------------");
  console.log(`🚀 PROMOZIONE COMPLETATA: ${promotedCount} modifiche applicate al Contratto.`);
  
  if (rejectedOrPendingCount === 0) {
    // Tutto processato, pulizia FCP
    fs.unlinkSync(fcpPath);
    console.log(`🧹 File FCP eliminato.`);
  } else {
    console.log(`⚠️ ${rejectedOrPendingCount} FCP ignorati perché non marcati come "approved".`);
  }
} else {
  console.log("\n---------------------------------------------------");
  console.log(`❌ NESSUNA AZIONE ESEGUITA. Nessun FCP risulta "approved".`);
  console.log(`   Ricordati di aprire 'test_fixtures/fcp-proposal.json' e cambiare status in "approved".`);
}
