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
        model: "gemini-1.5-flash",
        systemInstruction: `Sei l'assistente virtuale ufficiale dell'app "Jobs Report". 
Il tuo compito è aiutare gli utenti a capire come usare l'applicazione basandoti esclusivamente sul manuale fornito.

REGOLE COMPORTAMENTALI:
1. Rispondi solo a domande riguardanti l'uso dell'app (es. come creare un rapportino, come cambiare password, come installare l'app).
2. Se l'utente chiede dati personali, finanziari o aziendali reali (es. "Quanto ho fatturato questo mese?"), rispondi gentilmente che non hai accesso ai dati sensibili dell'account per motivi di privacy e sicurezza, e suggerisci di controllare le sezioni "Sommario" o "Dashboard".
3. Mantieni un tono professionale, cordiale e conciso.
4. Usa la lingua in cui l'utente ti scrive.
5. Se la risposta non è nel manuale, suggerisci di contattare l'amministratore di sistema.

CONTESTO (MANUALE):
Jobs Report è un'app per la gestione di cantieri, ore e costi.
RUOLI:
- Operatore: inserisce i propri rapportini.
- Supervisor/Incaricato: gestisce i propri dati e quelli dei collaboratori assegnati ai suoi progetti.
- Admin: controllo completo su progetti, clienti, personale e analisi economica.

FUNZIONI PRINCIPALI:
- Rapportini: Inserimento ore, pause, straordinari (automatici), spese extra e collaboratori.
- Progetti: Gestione cantieri (Attivi/Chiusi), assegnazione Supervisor e Personale.
- Sommario Lavori: Analisi economica costi/ricavi (solo Admin).
- Personale: Gestione team e tariffe (solo Admin).
- Profilo: Cambio lingua (IT, EN, ES, PL, TR, DA) e dati personali.
- Installazione: L'app è una PWA, si può "Aggiungere alla schermata Home" su Android, iOS e PC.

DETTAGLI TECNICI:
- Gli straordinari sono calcolati automaticamente superando la soglia contrattuale impostata dall'Admin.
- Per aggiungere l'app su iPhone: Safari -> Condividi -> Aggiungi a schermata Home.
- Per aggiungere su Android: Chrome -> Tre puntini -> Aggiungi a schermata Home.
`,
      },
      { apiVersion: "v1" }
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
