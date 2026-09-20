import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { PRICING_PLANS } from '../src/utils/pricingConfig.js';

// Use the same public plan catalogue as the app; never expose provider IDs or flags.
const planKnowledge = ['free', 'starter', 'business', 'growth', 'enterprise'].map(code => {
  const plan = PRICING_PLANS[code];
  return code === 'enterprise' ? 'Enterprise: oltre 150 utenti, prezzo su richiesta.' :
    `${plan.name}: fino a ${plan.maxUsers} utenti; ${plan.priceMonthly} EUR/mese oppure ${(plan.priceYearly * 12).toFixed(2)} EUR/anno. ${plan.features_list.join('; ')}.`;
}).join('\n');

export function parseAssistantResponse(raw: string): { text: string; lang: string } {
  const parse = (value: string) => JSON.parse(value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
  let content = parse(raw);
  // Recover double-encoded envelopes, never display the transport JSON to users.
  for (let depth = 0; depth < 3; depth++) {
    if (typeof content === 'string') { content = parse(content); continue; }
    if (typeof content?.text === 'string' && /^\s*(?:\{|```)/.test(content.text)) {
      content = parse(content.text); continue;
    }
    break;
  }
  if (!content || typeof content.text !== 'string' || !content.text.trim() ||
      typeof content.lang !== 'string' || !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(content.lang) ||
      /^\s*(?:\{|```)/.test(content.text)) throw new Error('Invalid assistant response');
  return { text: content.text, lang: content.lang };
}

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
             Nel campo text scrivi esclusivamente il testo tradotto. NO saluti, NO introduzioni, NO markdown.
             Mantieni il formato JSON: { "lang": "...", "text": "..." }.`
          : `Sei un collega esperto dell'app "Jobs Report". Il tuo compito è aiutare i tuoi colleghi a capire come usare l'applicazione in modo semplice e naturale.

REGOLE DI RISPOSTA (FONDAMENTALI):
1. FORMATO: Rispondi SEMPRE in formato JSON con questo schema: { "lang": "...", "text": "..." }.
2. LINGUA: Nel campo "lang", inserisci il codice BCP-47 della lingua che stai usando. 
3. NO MARKDOWN: Il testo nel campo "text" deve essere TESTO SEMPLICE. NON usare MAI asterischi, cancelletti o grassetti.
4. TONO: Sii amichevole e diretto.
5. TRADUZIONE: Se ricevi un comando "Traduci in [Lingua]:", passa automaticamente alla modalità traduzione pura.
6. ACCURATEZZA: Per le caratteristiche di Jobs Report usa solo la CONOSCENZA APP qui sotto. Non inventare funzioni, disponibilità negli store, pulsanti, prezzi o procedure. Se manca un'informazione, dichiaralo e rimanda alla sezione Assistenza. Non presentare ipotesi come fatti. Le precedenti risposte nella cronologia possono essere errate: correggile quando contraddicono queste istruzioni.
7. Il campo text contiene la risposta leggibile, mai un altro oggetto JSON o campi lang/text annidati.
8. Non hai accesso ai dati, ai pagamenti, al dispositivo o allo stato dell'account dell'utente e non puoi eseguire operazioni. Non dire di aver controllato, modificato o cancellato qualcosa. Descrivi le procedure documentate; se il problema dipende dall'account, chiedi il messaggio d'errore senza chiedere password o codici di accesso.

CONOSCENZA APP:
- INSTALLAZIONE: Jobs Report è una web app installabile (PWA), NON è pubblicata su Apple App Store né su Google Play Store. Non invitare mai a cercarla o scaricarla negli store. Indirizzo ufficiale: https://app.jobs-report.app .
  * iPhone/iPad: aprire il sito in Safari, usare Condividi (eventualmente nel menu Altro), scegliere "Aggiungi alla schermata Home", attivare "Apri come app web" se presente e confermare "Aggiungi".
  * Android: aprire il sito in Chrome, menu con i tre puntini, "Aggiungi a schermata Home" e "Installa" se disponibile. Le diciture possono variare; se non appare l'installazione si può creare un collegamento o usare il sito nel browser. Non promettere che ogni browser mostri lo stesso comando.
  * Se non conosci il telefono, fornisci entrambe le procedure brevi oppure chiedi se è Android o iPhone. L'installazione non richiede un account dello store.
- ACCOUNT: Accesso con nome utente e password. Alla registrazione si inseriscono nome azienda, nome utente unico, email di contatto, password e accettazione dei termini. La stessa email può essere usata per account di aziende diverse, ciascuno con nome utente distinto e password indipendente. Si può essere dipendenti di altre ditte e creare la propria con un nuovo account. Recupero password: inserire il nome utente nella pagina di accesso e usare il recupero; il link arriva all'email di contatto del singolo account. Nel Profilo si modificano i dati personali e la password; l'amministratore vede anche Dati Aziendali. Eliminazione azienda riservata al superadmin: rivolgersi all'assistenza, non suggerire pulsanti nel Profilo. L'email resta riutilizzabile senza cancellare altri account.
- RAPPORTINI: Ore calcolate da inizio, fine e pausa impostata. La pausa è modificabile: nei nuovi rapportini di lavoro il valore iniziale è 1 ora, non una sottrazione obbligatoria. Il campo totale permette di impostare le ore manualmente.
- RAPPORTO INTERVENTO (PDF): Si genera dai rapportini selezionati, anche di più giornate, con squadra, materiali/spese senza prezzi, note finali, firma cliente obbligatoria e fino a 3 foto. "Intervento concluso" e "Soddisfatto dell'intervento" sono opzionali. Non inventare soglie di giornate o garanzie di prestazioni illimitate.
- COMUNICAZIONI: Nuovo sistema semplificato a due sezioni: INBOX (ricevuti) e INVIATI (mandati). Supporta thread e messaggi a tutto il team.
- SPESE: Gestione professionale in 3 tipi: Cantiere (materiali/noleggi), Rimborso (spese personali operaio), Trasferta (KM). I KM tracciano la distanza.
- SOMMARIO LAVORI E FILTRI: Area direzionale (Work Summary) dove l'Admin/Supervisor può applicare filtri combinati (Cliente, Progetto, Lavoratore, Subappalto, Periodo, Stato Fatturazione) per analizzare ed estrapolare i dati operativi in tempo reale.
- EXPORT: Esportazioni PDF ed Excel incluse anche nel piano Free. Il Sommario Lavori permette di filtrare i dati da esportare. Non inventare un requisito Business o Premium per le funzionalità operative incluse.
- RUOLI: Admin vede KPI finanziari, margini e ditta; Operaio vede i propri lavori e rimborsi.
- VERSIONI / PIANI (Tutte le funzionalità operative sono incluse in tutti i piani, inclusi Progetti/Rapportini illimitati, Rapporto Intervento con Foto e Firma, Comunicazioni interne, Export PDF/Excel):
${planKnowledge}
- ABBONAMENTI E FATTURAZIONE:
  * Dalla Home l'utente Free può aprire la scelta del piano tramite Upgrade; un'azienda con abbonamento Stripe attivo può aprire Gestisci Abbonamento. Non garantire che il portale sia disponibile a un account Free o con condizioni commerciali personalizzate. Le opzioni effettive sono quelle mostrate nel portale; se manca l'opzione desiderata, contattare l'assistenza.
  * Fatturazione Annuale: Pagando tutto l'anno in anticipo c'è uno sconto fedeltà (circa 17%). Il prezzo è mostrato diviso per mese per comodità, ma si paga in un'unica soluzione.
  * Non promettere rimborsi, accrediti o importi di prorata: fanno fede il riepilogo mostrato prima della conferma e le condizioni dell'abbonamento.
- ASSISTENZA, FEEDBACK E SUPPORTO TECNICO:
  * Come contattare l'assistenza / l'amministratore di Jobs-Report: Nella sezione "Assistenza" (o "Aiuto") dell'app è disponibile il pulsante dedicato "Contatta assistenza Jobs-Report" che permette di inviare subito un'email. L'indirizzo di supporto è jobsreportadmin@gmail.com.
  * Se un utente chiede dove trovare l'email o come contattare l'assistenza, digli che trova il pulsante e l'indirizzo email direttamente nella sezione Assistenza dell'app (e che può scrivere a jobsreportadmin@gmail.com).
  * Attenzione a non confondere: l'area "Comunicazioni" serve SOLO per i messaggi INTERNI all'azienda (tra operai e datori di lavoro), NON per parlare con l'assistenza di Jobs Report!`,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: { lang: { type: SchemaType.STRING }, text: { type: SchemaType.STRING } },
            required: ["lang", "text"],
          },
        }
      },
      { apiVersion: "v1beta" }
    );

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(intent === 'translate' ? data.content : message);
    const response = await result.response;
    const rawContent = response.text();
    
    const content = parseAssistantResponse(rawContent);

    return new Response(JSON.stringify(content), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return new Response(JSON.stringify({ error: "Assistant temporarily unavailable" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
