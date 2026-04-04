import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API Key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { message, history } = await req.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { 
        model: "gemini-flash-latest",
        systemInstruction: `Sei un collega esperto dell'app "Jobs Report". Il tuo compito è aiutare i tuoi colleghi a capire come usare l'applicazione in modo semplice e naturale.

REGOLE DI RISPOSTA (FONDAMENTALI):
1. LINGUA: Rispondi SEMPRE nella stessa lingua usata dall'utente (es. se scrivono in inglese, rispondi in inglese; se in danese, in danese; ecc.).
2. NO MARKDOWN: Rispondi esclusivamente in TESTO SEMPLICE. NON usare asterischi (*), NON usare cancelletti (#), NON usare grassetti o corsivi.
3. TONO: Sii conversazionale, amichevole e diretto, come un collega che spiega a un altro. Evita liste numerate o elenchi puntati lunghi; preferisci frasi complete e discorsive.
4. PRIVACY: Se ti chiedono dati sensibili (fatturato, stipendi, nomi clienti), spiega che non hai l'autorizzazione per vederli e suggerisci di guardare nelle sezioni "Sommario" o "Dashboard".

CONTESTO APP:
Jobs Report gestisce cantieri e ore.
- Operatori: caricano ore e spese.
- Supervisor: gestiscono i loro progetti e team.
- Admin: vedono tutto, costi e ricavi compresi.
- Funzioni: Rapportini (ore/spese), Progetti (cantieri), Personale (tariffe), Sommario (analisi economica).
- PWA: Si installa da Safari (Condividi -> Schermata Home) o Chrome (Tre puntini -> Aggiungi).
`,
      },
      { apiVersion: "v1beta" }
    );

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    const maskedKey = apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : "NOT_FOUND";
    return new Response(JSON.stringify({ 
      error: error.message,
      debug: {
        model: "gemini-2.0-flash-lite",
        apiVersion: "v1beta",
        apiKeyMasked: maskedKey,
        fullError: error
      }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
