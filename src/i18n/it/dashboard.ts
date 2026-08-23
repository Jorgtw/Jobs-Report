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
  sendCredentialsHintEdit: "Invia al cliente un'email sicura con un link per reimpostare e scegliere la propria password.",
  sendCredentialsHintCreate: "Invia un'email automatica al cliente con un link sicuro per attivare l'account e creare una password.",
  sendingInProgress: "INVIO IN CORSO...",
  autoSendActive: "AUTO-INVIO ATTIVO",
  sendInstructionsAuto: "INVIA ISTRUZIONI (AUTO)",
  freeSupportBanner: {
    title: "Sostieni Jobs-Report",
    description: "Tutte le funzionalità restano disponibili gratuitamente fino a 5 utenti. Se Jobs-Report ti è utile, passando a Starter sostieni lo sviluppo dell’app e puoi utilizzare fino a 10 utenti.",
    button: "Passa a Starter"
  },
  upgradeModal: {
    monthly: 'Mensile',
    annually: 'Annuale',
    billedAnnually: 'Fatturato annualmente',
    twoMonthsFree: '-17%',
    teamTitle: 'Scegli il piano adatto alla tua squadra',
    complianceTitle: 'Rapporti e Firme',
    complianceDesc: 'Tutte le funzionalità operative sono incluse in ogni piano.',
    communicationsDesc: 'Tutte le funzionalità operative sono incluse in ogni piano.',
    genericTitle: 'Scegli il piano adatto alla tua squadra',
    genericDesc: 'Tutte le funzionalità operative sono incluse in ogni piano. Scegli in base al numero di collaboratori.',
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
      description: "Ideale per micro-squadre e professionisti indipendenti",
      features: {
        "0": "Fino a 5 utenti inclusi",
        "1": "Tutte le funzionalità operative incluse",
        "2": "Progetti e rapportini illimitati",
        "3": "Rapporti Intervento con Foto e Firma",
        "4": "Comunicazioni interne",
        "5": "Export PDF ed Excel"
      }
    },
    starter: {
      name: "Starter",
      description: "Ideale per piccole imprese e squadre fino a 10 persone",
      features: {
        "0": "Fino a 10 utenti inclusi",
        "1": "Tutte le funzionalità operative incluse",
        "2": "Progetti e rapportini illimitati",
        "3": "Rapporti Intervento con Foto e Firma",
        "4": "Comunicazioni interne",
        "5": "Export PDF ed Excel"
      }
    },
    business: {
      name: "Business",
      description: "La soluzione perfetta per PMI e imprese strutturate fino a 50 persone",
      features: {
        "0": "Fino a 50 utenti inclusi",
        "1": "Tutte le funzionalità operative incluse",
        "2": "Progetti e rapportini illimitati",
        "3": "Rapporti Intervento con Foto e Firma",
        "4": "Comunicazioni interne",
        "5": "Export PDF ed Excel"
      }
    },
    growth: {
      name: "Growth",
      description: "Per aziende in forte espansione fino a 150 persone",
      features: {
        "0": "Fino a 150 utenti inclusi",
        "1": "Tutte le funzionalità operative incluse",
        "2": "Progetti e rapportini illimitati",
        "3": "Rapporti Intervento con Foto e Firma",
        "4": "Comunicazioni interne",
        "5": "Export PDF ed Excel"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "Soluzione personalizzata per grandi organizzazioni oltre 150 persone",
      features: {
        "0": "Oltre 150 utenti (illimitati)",
        "1": "Tutte le funzionalità operative incluse",
        "2": "Progetti e rapportini illimitati",
        "3": "Supporto prioritario e onboarding dedicato",
        "4": "Personalizzazioni su richiesta"
      }
    }
  }
} as const;
