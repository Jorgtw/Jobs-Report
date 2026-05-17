// src/i18n/it/landing.ts
export const landing = {
  title: "Jobs-Report",
  subtitle: "Il gestionale web professionale per l'edilizia e i servizi. Tracciabilità totale di ore, costi, ricavi e margini di cantiere.",
  heroCTA: "Scopri le potenzialità",
  backToLogin: "Accedi al Programma",
  
  // Features
  featReportsTitle: "Rapportini Intelligenti",
  featReportsDesc: "Inserimento rapido lato cantiere con gestione squadre e spese extra.",
  featProjTitle: "Controllo Margini",
  featProjDesc: "Verifica in tempo reale se ogni cantiere sta generando profitto.",
  featTeamTitle: "Team Ibridi",
  featTeamDesc: "Gestisci operai interni e ditte in subappalto in un'unica squadra.",
  featExportTitle: "Report Pronti all'Uso",
  featExportDesc: "Genera PDF e Excel per la fatturazione con un solo clic.",
  
  // Intro & Why
  introTitle: "Cosa fa il programma?",
  introDesc: "Jobs-Report è un gestionale web per aziende che lavorano su cantieri o progetti con personale proprio e subappaltato. Gestisce clienti, progetti, rapportini giornalieri e produce resoconti economico-finanziari precisi.",
  whyTitle: "Vantaggi Reali e Differenziatori",
  
  // Differentiators
  diff1Title: "🏗️ Squadre Miste",
  diff1Desc: "Permette di includere in un unico rapportino lavoratori interni e subappaltatori, separando automaticamente i costi nel riepilogo.",
  diff2Title: "💰 Logica Economica Vera",
  diff2Desc: "Non è un semplice registro ore. Calcola costi reali (tariffe lavoratore), ricavi (prezzi vendita) e margini per ogni intervento.",
  diff3Title: "📊 Filtri Fatturazione",
  diff3Desc: "Traccia lo stato di ogni lavoro: In attesa, Fatturato o Pagato. Ideale per non dimenticare mai di emettere una fattura.",
  diff4Title: "🌍 Multi-lingua Nativo",
  diff4Desc: "Supporto completo per 6 lingue (IT, EN, ES, PL, TR, DA). Anche i report esportati usano le etichette nella lingua scelta.",
  diff5Title: "🏢 Multi-Tenant (SaaS)",
  diff5Desc: "Architettura professionale che permette di gestire più aziende con dati isolati da un unico pannello amministratore.",
  diff6Title: "📤 Export Professionali",
  diff6Desc: "PDF ed Excel generati con intestazioni tradotte dinamicamente, pronti per essere inviati al cliente o al consulente.",
  diff7Title: "🔒 Ruoli Differenziati",
  diff7Desc: "Admin, Supervisor e Operatori: ognuno vede solo ciò che gli compete, garantendo sicurezza e privacy dei dati sensibili.",
  
  // Comparison
  compTitle: "Confronto con altri Software",
  compFeature: "Funzionalità",
  compTeam: "Squadre miste int./subapp.",
  compEco: "Costo + ricavo cantiere",
  compStatus: "Stato fatturazione",
  compLang: "Multi-lingua (6 lingue)",
  compExcel: "Excel manuale",
  
  // Limits & Summary
  compLimitsTitle: "💡 Trasparenza sui Limiti",
  limit1: "Nessun clock-in live (timbratura in tempo reale)",
  limit2: "Nessuna notifica automatica scadenze",
  limit3: "Dashboard solo tabellare (senza grafici)",
  limit4: "App PWA (ottima da mobile, non presente in App Store)",
  summaryTitle: "In Sintesi",
  summaryDesc: "Ideale per piccole/medie imprese edili, installatori o ditte di servizi che mandano squadre miste su cantieri. Tutto in un'app leggera, senza canone mensile e personalizzabile.",
  
  // Footer
  finalCTA: "Inizia Adesso - Richiedi Accesso",
  finalLogin: "Hai già un account? Accedi ora",
  sandbox: {
    testVersionAlert: "Questa è la versione di test. In produzione qui si aprirebbe il modale per la registrazione/login.",
    createFirstReport: "Crea il tuo primo rapportino",
    noRegistrationRequired: "Nessuna registrazione richiesta per iniziare.",
    debugStatus: "Status Interno (Debug)",
    guestId: "Guest ID:",
    generating: "Generazione...",
    localStorageHint: "Apri F12 - Application - Local Storage per vedere `draft_report` aggiornarsi live.",
    client: "Cliente",
    date: "Data",
    hoursWorked: "Ore Lavorate",
    workDescription: "Descrizione Intervento",
    generateFreePdf: "Genera PDF Gratuito"
  }
} as const;
