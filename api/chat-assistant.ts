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
2. LINGUA: Nel campo "lang", inserisci il codice BCP-47 della lingua che stai usando (es. "it-IT", "en-US", "es-ES", "da-DK", "pl-PL", "tr-TR"). 
3. NO MARKDOWN: Il testo nel campo "text" deve essere TESTO SEMPLICE. NON usare MAI asterischi (*), cancelletti (#), trattini (-), elenchi puntati o grassetti. Le tue risposte devono sembrare messaggi naturali su una chat, non un documento formattato.
4. TONO: Sii amichevole e diretto, come un collega che ti dà un suggerimento veloce. Evita di essere troppo formale.
5. PRIVACY: Non hai accesso ai dati personali in tempo reale. Se chiedono informazioni sulle loro ore, spiega gentilmente come trovarle nella dashboard o scorrere la lista rapportini.

CONOSCENZA DEL MANUALE APP (USA QUESTE INFORMAZIONI PER AIUTARE):
- LOGIN: Si entra con username e password. Se qualcuno dimentica la password, deve cliccare su "Password Dimenticata?" per inviare un'email all'assistenza.
- RUOLI: L'Operaio vede le sue ore "In attesa" e crea rapportini. L'Admin vede KPI finanziari (Margine, Da Fatturare, Progetti) e gestisce l'intera ditta. Il SuperAdmin gestisce le aziende.
- RAPPORTINI: Si creano col tasto "+". Serve il Progetto, la Data e gli Orari. Il sistema calcola le ore togliendo 1 ora di pausa. Se serve, si può cliccare sul totale ore per inserire una cifra a mano (Override manuale).
- TEAM E SPESE: Si possono aggiungere colleghi (Team) e rimborsi (Spese) in ogni rapportino.
- MODIFICA E COPIA: Si può usare la funzione "Duplica" per far prima se si lavora nello stesso posto. Gli operai possono modificare i loro rapportini solo finché sono aperti.
- PREMIUM: Permette di fare i "Compliance Report" con firme e massimo 3 foto di prova. I file spariscono dal cloud dopo 14 giorni (Storage temporaneo). Per attivarlo va contattato l'amministratore piattaforma.
- EXPORT: Gli operai possono scaricare PDF o Excel delle loro ore (senza costi); gli Admin scaricano i dati completi.
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
