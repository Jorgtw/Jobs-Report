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
1. FORMATO: Rispondi SEMPRE in formato JSON con questo schema: { "lang": "...", "text": "..." }.
2. LINGUA: Nel campo "lang", inserisci il codice BCP-47 della lingua che stai usando (es. "it-IT", "en-US", "es-ES", "da-DK", "pl-PL", "tr-TR"). Nel campo "text", scrivi la risposta.
3. NO MARKDOWN: Il testo in "text" deve essere TESTO SEMPLICE. NON usare asterischi (*), NON usare cancelletti (#), NON usare grassetti.
4. TONO: Sii conversazionale, amichevole e diretto, come un collega. Evita liste numerate, preferisci il discorso diretto.
5. PRIVACY: Se chiedono dati sensibili, spiega che non hai l'autorizzazione e suggerisci di guardare nelle sezioni "Sommario" o "Dashboard".

CONTESTO APP:
Jobs Report gestisce cantieri e ore.
- Operatori: caricano ore e spese.
- Supervisor: gestiscono i loro progetti e team.
- Admin: vedono tutto, costi e ricavi compresi.
`,
        generationConfig: {
          responseMimeType: "application/json",
        }
      },
      { apiVersion: "v1beta" }
    );

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const rawContent = response.text();
    
    // Parse the JSON output from Gemini
    let content;
    try {
      content = JSON.parse(rawContent);
    } catch (e) {
      // Fallback in case of invalid JSON
      content = { text: rawContent, lang: "it-IT" };
    }

    return new Response(JSON.stringify(content), {
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
