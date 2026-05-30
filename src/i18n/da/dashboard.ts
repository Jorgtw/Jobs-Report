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
    complianceTitle: "Overensstemmelsesmodul",
    complianceDesc: "Sikr overholdelse af lovgivningen med avancerede rapporter og automatiserede sikkerhedskontroller.",
    genericTitle: "Udvid din virksomhed",
    genericDesc: "Vælg den plan, der passer bedst til dine behov, og tag Jobs-Report til næste niveau.",
    loadingPlans: "Indlæser planer...",
    recommended: "Anbefalet",
    perMonth: "/måned",
    activateNow: "Aktiver Nu",
    securePayments: "Sikre betalinger via Stripe",
    footerSupport: "JobsReport Professional Edition • 24/7 Support",
    checkoutError: "Der opstod en fejl under åbning af betalingen. Prøv venligst igen senere.",
    communicationsDesc: "Lås op for interne kommunikationer i realtid og spor virksomhedsmeddelelser."
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
  plans: {
    free: {
      name: "Free",
      description: "Indledende test for at evaluere produktet på byggepladsen",
      features: {
        "0": "Op til 5 brugere inkluderet",
        "1": "Grundlæggende projekter og rapporter",
        "2": "Ingen AI-funktioner",
        "3": "Inkluderer ikke rapport med foto/underskrift",
        "4": "Inkluderer ikke interne kommunikationer"
      }
    },
    starter: {
      name: "Starter",
      description: "Ideel til mikrovirksomheder og voksende håndværkere",
      features: {
        "0": "Op til 10 brugere inkluderet",
        "1": "Ubegrænsede projekter og rapporter",
        "2": "Komplet tids- og udgiftsregistrering",
        "3": "Grundlæggende PDF/Excel-eksport",
        "4": "PWA mobilapp + web",
        "5": "Inkluderer ikke rapport med foto/underskrift",
        "6": "Inkluderer ikke interne kommunikationer"
      }
    },
    business: {
      name: "Business",
      description: "Hjertet i Jobs-Report for strukturerede SMV'er",
      features: {
        "0": "Op til 50 brugere inkluderet",
        "1": "Alt indhold i Starter-planen",
        "2": "Inkluderer rapport med foto og underskrift",
        "3": "Inkluderer interne kommunikationer",
        "4": "AI-indsigt og automatiske rapporter",
        "5": "Avanceret omkostnings- og indtægtsanalyse"
      }
    },
    growth: {
      name: "Growth",
      description: "For strukturerede virksomheder, der har brug for fuld kontrol",
      features: {
        "0": "Op til 150 brugere inkluderet",
        "1": "Alt indhold i Business-planen",
        "2": "Inkluderer rapport med foto og underskrift",
        "3": "Inkluderer interne kommunikationer",
        "4": "Avancerede roller (Admin / Supervisor / Medarbejder)",
        "5": "Prestationsanalyse på pladsen"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "Skræddersyet løsning til ubegrænset vækst",
      features: {
        "0": "Ubegrænsede brugere",
        "1": "Avanceret tilpasning",
        "2": "Kalender",
        "3": "Arbejdets fremskridt",
        "4": "API-adgang (Næste version)",
        "5": "Single Sign-On (SSO / SAML)",
        "6": "White-label mulighed (dit logo og domæne)"
      }
    }
  }
} as const;
