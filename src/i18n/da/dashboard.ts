export const dashboard = {
  estimatedExpenses: "Forventede udgifter",
  toInvoice: "Til fakturering",
  worksInProgress: "Arbejde i gang",
  margin: "Margin",
  weeklyOverview: "Ugentlig overblik",
  last7DaysData: "Data fra de sidste 7 dage",
  newCompanies: "Nye virksomheder",
  activeCompanies: "Aktive virksomheder",
  newPremiums: "Nye Premium",
  totalReports: "Samlede rapporter",
  mostActiveWeekly: "Mest aktive i ugen",
  pendingRequestsReminder: "Afventende anmodninger",
  pendingRequestsDesc: "Der er nye registreringsanmodninger, der venter på godkendelse.",
  quickSupport: "Hurtig support",
  quickSupportDesc: "Kontakt det tekniske team for øjeblikkelig hjælp på platformen.",
  portalError: "Kunne ikke åbne kundeportalen. Bekræft venligst, at du har et aktivt abonnement.",
  managePlan: "Administrer abonnement",
  commercialOverrideNotice: "Denne virksomheds abonnement administreres direkte af administrationen. Kontakt support for at ændre det.",
  onlineManagementUnavailable: "Online abonnementsstyring er ikke tilgængelig for denne konto. Kontakt support.",
  contactSupport: "Kontakt support",
  companiesManagement: "Virksomhedsstyring",
  createCompanyBtn: "Opret ny virksomhed",
  editCompany: "Rediger virksomhed",
  companyName: "Virksomhedsnavn",
  companyStatus: "Virksomhedsstatus",
  demoFieldsLocked: "I denne demo-version kan visse data ikke ændres.",
  impersonateUser: "Simuler brugeradgang",
  adminAdminName: "Admin navn",
  adminAdminUsername: "Admin brugernavn",
  adminName: "Virksomhedsadministrator navn",
  adminUsername: "Administrator brugernavn",
  adminPassword: "Administrator adgangskode",
  corporateData: "Virksomhedsdata (PDF-sidehoved)",
  address: "Adresse",
  city: "By",
  country: "Land",
  phone: "Telefon",
  companyEmail: "Virksomhedens e-mail",
  vatNumber: "CVR-nummer",
  premiumPlan: "Premium-abonnement",
  premiumPlanDesc: "Aktiver Premium-funktioner (Overensstemmelsesrapport, Fotos, Underskrift)",
  try_demo: "Prøv demo",
  companyNamePlaceholder: "f.eks. Edilizia Rossi srl",
  tempPasswordPlaceholder: "Midlertidig adgangskode",
  italy: "Italien",
  premium: "Premium",
  upgradeModal: {
    monthly: 'Månedlig',
    annually: 'Årlig',
    billedAnnually: 'Faktureres årligt',
    twoMonthsFree: '-17%',
    teamTitle: 'Vælg den rigtige plan til dit team',
    complianceTitle: 'Rapporter og underskrifter',
    complianceDesc: 'Alle driftsfunktioner er inkluderet i hver plan.',
    genericTitle: 'Vælg den rigtige plan til dit team',
    genericDesc: 'Alle driftsfunktioner er inkluderet i hver plan. Vælg baseret på dit teams størrelse.',
    loadingPlans: 'Indlæser planer...',
    recommended: 'Anbefalet',
    perMonth: '/måned',
    activateNow: 'Aktiver Nu',
    securePayments: 'Sikre betalinger via Stripe',
    footerSupport: 'JobsReport Professional Edition • 24/7 Support',
    checkoutError: 'Der opstod en fejl under åbning af betalingen. Prøv venligst igen senere.',
    communicationsDesc: 'Alle driftsfunktioner er inkluderet i hver plan.'
  },
  missingEmailOrAdminId: "E-mail eller administrator-id mangler for denne virksomhed.",
  prepareManualEmail: "Forbered manuel e-mail",
  sendCredentials: "Send loginoplysninger",
  activatePremiumDesc: "Aktiver premium-funktioner for denne virksomhed med det samme.",
  sendCredentialsTitle: "Sender loginoplysninger",
  prepareManualEmailBtn: "FORBERED E-MAIL (MANUEL)",
  emailSubject: "Adgangsoplysninger til Jobs Report - {company}",
  emailBody: "Hej {name},\n\nHer er dine adgangsoplysninger til Jobs Report:\n\nURL: https://jobs-report.vercel.app\nBrugernavn: {username}\nAdgangskode: {password}\n\nVi anbefaler, at du ændrer din adgangskode ved dit første login.\n\nVenlig hilsen,\nJobsReport-teamet",
  sendCredentialsHintEdit: "Indtast en adgangskode ovenfor for at sende den til kunden.",
  sendCredentialsHintCreate: "Send automatisk brugernavn og adgangskode to virksomhedens e-mailadresse.",
  sendingInProgress: "AFSENDELSE IGANG...",
  autoSendActive: "AUTOMATISK AFSENDELSE AKTIV",
  sendInstructionsAuto: "SEND VEJLEDNING (AUTO)",
  freeSupportBanner: {
    title: "Støt Jobs-Report",
    description: "Alle funktioner forbliver gratis tilgængelige for op til 5 brugere. Hvis Jobs-Report er værdifuld for dig, støtter en opgradering til Starter app-udviklingen og giver dig mulighed for at bruge op til 10 brugere.",
    button: "Skift til Starter"
  },
  plans: {
    free: {
      name: "Free",
      description: "Ideel til mikroteams og selvstændige fagfolk",
      features: {
        "0": "Op til 5 brugere inkluderet",
        "1": "Alle driftsfunktioner inkluderet",
        "2": "Ubegrænsede projekter og rapporter",
        "3": "Rapporter med foto og underskrift",
        "4": "Interne kommunikationer",
        "5": "PDF og Excel-eksport"
      }
    },
    starter: {
      name: "Starter",
      description: "Ideel til små virksomheder og teams op til 10 personer",
      features: {
        "0": "Op til 10 brugere inkluderet",
        "1": "Alle driftsfunktioner inkluderet",
        "2": "Ubegrænsede projekter og rapporter",
        "3": "Rapporter med foto og underskrift",
        "4": "Interne kommunikationer",
        "5": "PDF og Excel-eksport"
      }
    },
    business: {
      name: "Business",
      description: "Den perfekte løsning til SMV'er og strukturerede teams op til 50 personer",
      features: {
        "0": "Op til 50 brugere inkluderet",
        "1": "Alle driftsfunktioner inkluderet",
        "2": "Ubegrænsede projekter og rapporter",
        "3": "Rapporter med foto og underskrift",
        "4": "Interne kommunikationer",
        "5": "PDF og Excel-eksport"
      }
    },
    growth: {
      name: "Growth",
      description: "Til hurtigt voksende virksomheder op til 150 personer",
      features: {
        "0": "Op til 150 brugere inkluderet",
        "1": "Alle driftsfunktioner inkluderet",
        "2": "Ubegrænsede projekter og rapporter",
        "3": "Rapporter med foto og underskrift",
        "4": "Interne kommunikationer",
        "5": "PDF og Excel-eksport"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "Skræddersyet løsning til store organisationer over 150 personer",
      features: {
        "0": "Over 150 brugere (ubegrænset)",
        "1": "Alle driftsfunktioner inkluderet",
        "2": "Ubegrænsede projekter og rapporter",
        "3": "Prioriteret support og dedikeret onboarding",
        "4": "Tilpasninger efter anmodning"
      }
    }
  }
} as const;
