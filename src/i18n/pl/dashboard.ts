export const dashboard = {
  estimatedExpenses: "Przewidywane wydatki",
  toInvoice: "Do zafakturowania",
  worksInProgress: "Prace w toku",
  margin: "Marża",
  weeklyOverview: "Przegląd tygodniowy",
  last7DaysData: "Dane z ostatnich 7 dni",
  newCompanies: "Nowe firmy",
  activeCompanies: "Aktywne firmy",
  newPremiums: "Nowe Premium",
  totalReports: "Wszystkie raporty",
  mostActiveWeekly: "Najbardziej aktywne w tygodniu",
  pendingRequestsReminder: "Oczekujące wnioski",
  pendingRequestsDesc: "Są nowe wnioski o rejestrację oczekujące na zatwierdzenie.",
  quickSupport: "Szybkie wsparcie",
  quickSupportDesc: "Skontaktuj się z zespołem technicznym w celu uzyskania natychmiastowej pomocy na platformie.",
  portalError: "Nie można otworzyć portalu klienta. Sprawdź, czy masz aktywną subskrypcję.",
  companiesManagement: "Zarządzanie firmami",
  createCompanyBtn: "Utwórz nową firmę",
  editCompany: "Edytuj firmę",
  companyName: "Nazwa firmy",
  companyStatus: "Status firmy",
  demoFieldsLocked: "W tej wersji demo niektóre dane nie podlegają modyfikacji.",
  impersonateUser: "Symuluj dostęp użytkownika",
  adminAdminName: "Imię Admina",
  adminAdminUsername: "Nazwa użytkownika Admina",
  adminName: "Imię Administratora Firmy",
  adminUsername: "Nazwa użytkownika Administratora",
  adminPassword: "Hasło Administratora",
  corporateData: "Dane firmy (nagłówek PDF)",
  address: "Adres",
  city: "Miasto",
  country: "Kraj",
  phone: "Telefon",
  companyEmail: "Firmowy e-mail",
  vatNumber: "NIP / CVR",
  premiumPlan: "Plan Premium",
  premiumPlanDesc: "Włącz funkcje Premium (Raport zgodności, Zdjęcia, Podpis)",
  try_demo: "Wypróbuj Demo",
  companyNamePlaceholder: "np. Edilizia Rossi srl",
  tempPasswordPlaceholder: "Hasło tymczasowe",
  italy: "Włochy",
  premium: "Premium",
  upgradeModal: {
    monthly: 'Miesięcznie',
    annually: 'Rocznie',
    billedAnnually: 'Rozliczane rocznie',
    twoMonthsFree: '-17%',
    teamTitle: 'Wybierz plan dopasowany do Twojego zespołu',
    complianceTitle: 'Raporty i Podpisy',
    complianceDesc: 'Wszystkie funkcje operacyjne są włączone w każdym planie.',
    genericTitle: 'Wybierz plan dopasowany do Twojego zespołu',
    genericDesc: 'Wszystkie funkcje operacyjne są włączone w każdym planie. Wybierz na podstawie wielkości zespołu.',
    loadingPlans: 'Ładowanie planów...',
    recommended: 'Zalecane',
    perMonth: '/miesiąc',
    activateNow: 'Aktywuj Teraz',
    securePayments: 'Bezpieczne płatności przez Stripe',
    footerSupport: 'JobsReport Professional Edition • Wsparcie 24/7',
    checkoutError: 'Wystąpił błąd podczas otwierania kasy. Spróbuj ponownie później.',
    communicationsDesc: 'Wszystkie funkcje operacyjne są włączone w każdym planie.'
  },
  missingEmailOrAdminId: "Brak adresu e-mail lub identyfikatora administratora dla tej firmy.",
  prepareManualEmail: "Przygotuj ręczny e-mail",
  sendCredentials: "Wyślij dane logowania",
  activatePremiumDesc: "Natychmiast aktywuj funkcje premium dla tej firmy.",
  sendCredentialsTitle: "Wysyłanie danych logowania",
  prepareManualEmailBtn: "PRZYGOTUJ E-MAIL (RĘCZNIE)",
  emailSubject: "Dane dostępu do Jobs Report - {company}",
  emailBody: "Witaj {name},\n\nOto Twoje dane dostępu do Jobs Report:\n\nURL: https://jobs-report.vercel.app\nNazwa użytkownika: {username}\nHasło: {password}\n\nZalecamy zmianę hasła przy pierwszym logowaniu.\n\nZ poważaniem,\nZespół JobsReport",
  sendCredentialsHintEdit: "Wprowadź hasło powyżej, aby wysłać je do klienta.",
  sendCredentialsHintCreate: "Automatycznie wyślij nazwę użytkownika i hasło na adres e-mail firmy.",
  sendingInProgress: "WYSYŁANIE W TOKU...",
  autoSendActive: "AUTO-WYSYŁKA AKTYWNA",
  sendInstructionsAuto: "WYŚLIJ INSTRUKCJĘ (AUTO)",
  freeSupportBanner: {
    title: "Wesprzyj Jobs-Report",
    description: "Wszystkie funkcje pozostają bezpłatnie dostępne dla maksymalnie 5 użytkowników. Jeśli Jobs-Report jest dla Ciebie pomocny, przejście na pakiet Starter wspiera rozwój aplikacji i pozwala korzystać z niej do 10 użytkowników.",
    button: "Przejdź na Starter"
  },
  plans: {
    free: {
      name: "Free",
      description: "Idealny dla małych zespołów i niezależnych wykonawców",
      features: {
        "0": "Do 5 użytkowników w pakiecie",
        "1": "Wszystkie funkcje operacyjne w cenie",
        "2": "Nielimitowane projekty i raporty",
        "3": "Raporty ze zdjęciem i podpisem",
        "4": "Komunikacja wewnętrzna",
        "5": "Eksport PDF i Excel"
      }
    },
    starter: {
      name: "Starter",
      description: "Idealny dla małych firm i zespołów do 10 osób",
      features: {
        "0": "Do 10 użytkowników w pakiecie",
        "1": "Wszystkie funkcje operacyjne w cenie",
        "2": "Nielimitowane projekty i raporty",
        "3": "Raporty ze zdjęciem i podpisem",
        "4": "Komunikacja wewnętrzna",
        "5": "Eksport PDF i Excel"
      }
    },
    business: {
      name: "Business",
      description: "Idealne rozwiązanie dla MŚP i zespołów do 50 osób",
      features: {
        "0": "Do 50 użytkowników w pakiecie",
        "1": "Wszystkie funkcje operacyjne w cenie",
        "2": "Nielimitowane projekty i raporty",
        "3": "Raporty ze zdjęciem i podpisem",
        "4": "Komunikacja wewnętrzna",
        "5": "Eksport PDF i Excel"
      }
    },
    growth: {
      name: "Growth",
      description: "Dla dynamicznie rozwijających się firm do 150 osób",
      features: {
        "0": "Do 150 użytkowników w pakiecie",
        "1": "Wszystkie funkcje operacyjne w cenie",
        "2": "Nielimitowane projekty i raporty",
        "3": "Raporty ze zdjęciem i podpisem",
        "4": "Komunikacja wewnętrzna",
        "5": "Eksport PDF i Excel"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "Rozwiązanie szyte na miarę dla organizacji powyżej 150 osób",
      features: {
        "0": "Powyżej 150 użytkowników (bez limitu)",
        "1": "Wszystkie funkcje operacyjne w cenie",
        "2": "Nielimitowane projekty i raporty",
        "3": "Wsparcie priorytetowe i dedykowany onboarding",
        "4": "Personalizacja na życzenie"
      }
    }
  }
} as const;
