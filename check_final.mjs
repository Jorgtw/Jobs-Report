import fs from "fs";

const envFields = fs.readFileSync(".env", "utf8").split('\n');
let apiKey = null;
for (const line of envFields) {
  if (line.startsWith('GEMINI_API_KEY=')) {
    apiKey = line.split('=')[1].trim();
    break;
  }
}

async function checkBetaModels() {
  console.log("--- SCAN FINALE V1BETA ---");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  if (data.models) {
    const list = data.models
      .filter(m => m.supportedGenerationMethods.includes("generateContent"))
      .map(m => m.name.replace("models/", ""))
      .join("\n");
    fs.writeFileSync("final_models.txt", list);
    console.log("Modelli trovati e salvati in final_models.txt");
  } else {
    console.log("Nessun modello trovato o errore:", data);
  }
}

checkBetaModels();
