import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API Key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json();
    const { message, history, intent, data } = body;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { 
        model: "gemini-2.5-flash",
        systemInstruction: intent === 'translate' 
          ? `Sei un traduttore professionale. Traduci il testo fornito in ${data?.targetLanguage || 'italiano'}. 
             RISPONDI ESCLUSIVAMENTE COL TESTO TRADOTTO. NO saluti, NO introduzioni, NO markdown. 
             Mantieni il formato JSON: { "lang": "...", "text": "..." }.`
          : `Sei un collega esperto dell'app "Jobs Report". Il tuo compito è aiutare i tuoi colleghi a capire come usare l'applicazione in modo semplice e naturale.

REGOLE DI RISPOSTA (FONDAMENTALI):
1. FORMATO: Rispondi SEMPRE in formato JSON con questo schema: { "lang": "...", "text": "..." }.
2. LINGUA: Nel campo "lang", inserisci il codice BCP-47 della lingua che stai usando. 
3. NO MARKDOWN: Il testo nel campo "text" deve essere TESTO SEMPLICE. NON usare MAI asterischi, cancelletti o grassetti.
4. TONO: Sii amichevole e diretto.
5. TRADUZIONE: Se ricevi un comando "Traduci in [Lingua]:", passa automaticamente alla modalità traduzione pura.

CONOSCENZA APP:
- RAPPORTINI: Calcolo ore automatico (-1h pausa). Override manuale cliccando sul totale.
- PREMIUM: Include Compliance Report (Firme/Foto).
- COMUNICAZIONI: Nuovo sistema semplificato a due sezioni: INBOX (ricevuti) e INVIATI (mandati). Supporta thread e messaggi a tutto il team.
- SPESE: Gestione professionale in 3 tipi: Cantiere (materiali/noleggi), Rimborso (spese personali operaio), Trasferta (KM). I KM tracciano la distanza.
- EXPORT EXCEL DIREZIONALE: Nuovo export Excel report-based intelligente per amministratori. Include 4 fogli aggregati (Payroll dipendenti, Subappalti ditte esterne, Fatturazione vendite, e una Sintesi finanziaria automatica con formule dinamiche Excel). Disponibile nei piani Business e superiore.
- RUOLI: Admin vede KPI finanziari, margini e ditta; Operaio vede i propri lavori e rimborsi.
- VERSIONI / PIANI:
  * FREE: fino a 5 utenti. Esclude Rapportino con Foto/Firma e Comunicazioni interne.
  * STARTER (€39/mese): fino a 10 utenti. Esclude Rapportino con Foto/Firma e Comunicazioni interne.
  * BUSINESS (€119/mese): fino a 50 utenti. Include Rapportino con Foto/Firma e Comunicazioni interne. Offre AI insights e report automatici.
  * GROWTH (€299/mese): fino a 150 utenti. Include Rapportino con Foto/Firma e Comunicazioni interne. Offre ruoli avanzati (Admin/Supervisor/Worker) e performance analytics.
  * ENTERPRISE (prezzo su richiesta): utenti illimitati. Include Personalizzazione avanzata, Calendario, Avanzamento dei lavori, API (Prossima versione), Single Sign-On (SSO) e White-Label.`,
        generationConfig: {
          responseMimeType: "application/json",
        }
      },
      { apiVersion: "v1beta" }
    );

    // Backward compatibility for string-based translation requests
    let finalMessage = message;
    if (!intent && message?.toLowerCase().startsWith('traduci')) {
      // Logic for legacy calls
    }

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(intent === 'translate' ? data.content : message);
    const response = await result.response;
    const rawContent = response.text();
    
    let content;
    try {
      content = JSON.parse(rawContent);
    } catch (e) {
      content = { text: rawContent, lang: "it-IT" };
    }

    return new Response(JSON.stringify(content), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
