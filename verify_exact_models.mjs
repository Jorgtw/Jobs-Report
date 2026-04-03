import fs from "fs";

// Recupero chiave
const envFields = fs.readFileSync(".env", "utf8").split('\n');
let apiKey = null;
for (const line of envFields) {
  if (line.startsWith('GEMINI_API_KEY=')) {
    apiKey = line.split('=')[1].trim();
    break;
  }
}

if (!apiKey) {
    console.error("ERRORE: GEMINI_API_KEY non trovata nel file .env");
    process.exit(1);
}

async function listModels() {
  try {
    console.log("--- DIAGNOSTICA PROFONDA API ---");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    
    if (data.error) {
      fs.writeFileSync("api_diag.txt", JSON.stringify(data.error));
    } else {
      let output = `Trovati ${data.models.length} modelli:\n`;
      data.models.forEach(m => {
        const methods = m.supportedGenerationMethods.join(", ");
        output += `- ${m.name} [Metodi: ${methods}]\n`;
      });
      fs.writeFileSync("api_diag.txt", output);
      console.log("Diags salvate in api_diag.txt");
    }
  } catch (e) {
    console.error("Errore di rete:", e);
  }
}

listModels();
