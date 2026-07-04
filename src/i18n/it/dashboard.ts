// src/i18n/it/dashboard.ts
export const dashboard = {
  // Statistiche (Brief)
  estimatedExpenses: "Spese Previste",
  toInvoice: "Da Fatturare",
  worksInProgress: "Lavori in Corso",
  margin: "Margine",
  
  // SuperAdmin Dashboard
  weeklyOverview: 'Panoramica Settimanale',
  last7DaysData: 'Dati degli ultimi 7 giorni',
  newCompanies: 'Nuove Aziende',
  activeCompanies: 'Aziende Attive',
  newPremiums: 'Nuovi Premium',
  totalReports: 'Rapportini Totali',
  mostActiveWeekly: 'Le Più Attive della Settimana',
  pendingRequestsReminder: 'Richieste in Sospeso',
  pendingRequestsDesc: 'Ci sono nuove richieste di registrazione in attesa di approvazione.',
  quickSupport: 'Supporto Rapido',
  quickSupportDesc: 'Contatta il team tecnico per assistenza immediata sulla piattaforma.',
  portalError: 'Non è stato possibile aprire il Customer Portal. Verifica di avere un abbonamento attivo.',
  
  // SaaS / Gestione Aziende
  companiesManagement: 'Gestione Aziende',
  createCompanyBtn: 'Crea Nuova Azienda',
  editCompany: 'Modifica Azienda',
  companyName: 'Nome Azienda',
  companyStatus: 'Stato Azienda',
  demoFieldsLocked: 'In questa versione demo alcuni dati non sono modificabili.',
  impersonateUser: 'Simula Accesso Utente',
  adminAdminName: 'Nome Admin',
  adminAdminUsername: 'Username Admin',
  adminName: 'Nome Amministratore Ditta',
  adminUsername: 'Username Amministratore',
  adminPassword: 'Password Amministratore',
  corporateData: 'Dati Societari (intestazione PDF)',
  address: 'Indirizzo',
  city: 'Città',
  country: 'Paese',
  phone: 'Telefono',
  companyEmail: 'Email Aziendale',
  vatNumber: 'P.IVA / CVR',
  premiumPlan: 'Piano Premium',
  premiumPlanDesc: 'Abilita le funzionalità Premium (Compliance Report, Foto, Firma)',
  try_demo: 'Prova la Demo',
  companyNamePlaceholder: "Es. Edilizia Rossi srl",
  tempPasswordPlaceholder: "Password temporanea",
  italy: "Italia",
  premium: "Premium",
  missingEmailOrAdminId: "Email o Admin ID mancante per questa ditta.",
  prepareManualEmail: "Prepara Email Manuale",
  sendCredentials: "Invia Credenziali",
  activatePremiumDesc: "Attiva subito le funzionalità premium per questa ditta.",
  sendCredentialsTitle: "Invio Credenziali",
  prepareManualEmailBtn: "PREPARA EMAIL (MANUALE)",
  emailSubject: "Credenziali di accesso Jobs Report - {company}",
  emailBody: "Ciao {name},\n\nEcco le tue credenziali di accesso per Jobs Report:\n\nURL: https://jobs-report.vercel.app\nUsername: {username}\nPassword: {password}\n\nTi consigliamo di cambiare la password al primo accesso.\n\nBuon lavoro,\nIl team di JobsReport",
  sendCredentialsHintEdit: "Inserisci una password sopra per inviarla al cliente.",
  sendCredentialsHintCreate: "Invia automaticamente username e password all'indirizzo email della ditta.",
  sendingInProgress: "INVIO IN CORSO...",
  autoSendActive: "AUTO-INVIO ATTIVO",
  sendInstructionsAuto: "INVIA ISTRUZIONI (AUTO)",
  upgradeModal: {
    monthly: 'Mensile',
    annually: 'Annuale',
    billedAnnually: 'Fatturato annualmente',
    twoMonthsFree: '-17%',
    complianceTitle: 'Modulo Compliance',
    complianceDesc: 'Garantisci la conformità normativa con report avanzati e controlli di sicurezza automatizzati.',
    communicationsDesc: 'Sblocca le comunicazioni interne in tempo reale e tieni traccia dei messaggi aziendali.',
    genericTitle: 'Espandi il tuo business',
    genericDesc: 'Scegli il piano più adatto alle tue esigenze e porta Jobs-Report al livello successivo.',
    loadingPlans: 'Caricamento piani...',
    recommended: 'Consigliato',
    perMonth: '/mese',
    activateNow: 'Attiva Ora',
    securePayments: 'Pagamenti sicuri tramite Stripe',
    footerSupport: 'JobsReport Professional Edition • Supporto 24/7',
    checkoutError: "Si è verificato un errore durante l'apertura del checkout. Riprova più tardi."
  },
  plans: {
    free: {
      name: "Free",
      description: "Entry test per valutare il prodotto in cantiere",
      features: {
        "0": "Fino a 5 utenti inclusi",
        "1": "Progetti e rapportini base",
        "2": "Nessuna funzionalità AI",
        "3": "Non include Rapportino con Foto/Firma",
        "4": "Non include Comunicazioni interne"
      }
    },
    starter: {
      name: "Starter",
      description: "Ideale per micro-imprese e artigiani in crescita",
      features: {
        "0": "Fino a 10 utenti inclusi",
        "1": "Progetti e rapportini illimitati",
        "2": "Tracking ore e spese completo",
        "3": "Esportazioni base PDF/Excel",
        "4": "App mobile PWA + Web",
        "5": "Non include Rapportino con Foto/Firma",
        "6": "Non include Comunicazioni interne"
      }
    },
    business: {
      name: "Business",
      description: "Il cuore di Jobs-Report per PMI strutturate edili e di servizi",
      features: {
        "0": "Fino a 50 utenti inclusi",
        "1": "Tutto quello presente in Starter",
        "2": "Include Rapportino con Foto e Firma",
        "3": "Include Comunicazioni interne",
        "4": "AI insights e report automatici",
        "5": "Analisi avanzata costi e ricavi"
      }
    },
    growth: {
      name: "Growth",
      description: "Per aziende strutturate che necessitano di controllo totale",
      features: {
        "0": "Fino a 150 utenti inclusi",
        "1": "Tutto quello presente in Business",
        "2": "Include Rapportino con Foto e Firma",
        "3": "Include Comunicazioni interne",
        "4": "Ruoli avanzati (Admin / Supervisor / Worker)",
        "5": "Performance analytics di cantiere"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "Soluzione personalizzata senza limiti di crescita",
      features: {
        "0": "Utenti illimitati",
        "1": "Personalizzazione avanzata",
        "2": "Calendario",
        "3": "Avanzamento dei lavori",
        "4": "Accesso API (Prossima versione)",
        "5": "Single Sign-On (SSO / SAML)",
        "6": "Opzione White-Label (tuo logo e dominio)"
      }
    }
  }
} as const;
