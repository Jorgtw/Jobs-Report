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
    complianceTitle: "Moduł zgodności",
    complianceDesc: "Zapewnij zgodność z przepisami dzięki zaawansowanym raportom i automatycznym kontrolom bezpieczeństwa.",
    genericTitle: "Rozwiń swój biznes",
    genericDesc: "Wybierz plan najlepiej dopasowany do Twoich potrzeb i przenieś Jobs-Report na wyższy poziom.",
    loadingPlans: "Ładowanie planów...",
    recommended: "Zalecane",
    perMonth: "/miesiąc",
    activateNow: "Aktywuj Teraz",
    securePayments: "Bezpieczne płatności przez Stripe",
    footerSupport: "JobsReport Professional Edition • Wsparcie 24/7",
    checkoutError: "Wystąpił błąd podczas otwierania kasy. Spróbuj ponownie później.",
    communicationsDesc: "Odblokuj wewnętrzną komunikację w czasie rzeczywistym i śledź wiadomości firmowe."
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
  plans: {
    free: {
      name: "Free",
      description: "Wstępny test w celu oceny produktu na budowie",
      features: {
        "0": "Do 5 użytkowników w pakiecie",
        "1": "Podstawowe projekty i raporty",
        "2": "Brak funkcji sztucznej inteligencji (AI)",
        "3": "Nie obejmuje raportu ze zdjęciem/podpisem",
        "4": "Nie obejmuje komunikacji wewnętrznej"
      }
    },
    starter: {
      name: "Starter",
      description: "Idealny dla mikroprzedsiębiorstw i rozwijających się rzemieślników",
      features: {
        "0": "Do 10 użytkowników w pakiecie",
        "1": "Nielimitowane projekty i raporty",
        "2": "Pełne rejestrowanie czasu pracy i wydatków",
        "3": "Podstawowy eksport PDF/Excel",
        "4": "Aplikacja mobilna PWA + strona WWW",
        "5": "Nie obejmuje raportu ze zdjęciem/podpisem",
        "6": "Nie obejmuje komunikacji wewnętrznej"
      }
    },
    business: {
      name: "Business",
      description: "Serce Jobs-Report dla ustrukturyzowanych małych i średnich firm (MŚP)",
      features: {
        "0": "Do 50 użytkowników w pakiecie",
        "1": "Wszystko, co jest dostępne w planie Starter",
        "2": "Obejmuje raport ze zdjęciem i podpisem cyfrowym",
        "3": "Obejmuje komunikację wewnętrzną",
        "4": "Analizy AI i automatyczne raporty",
        "5": "Zaawansowana analiza kosztów i przychodów"
      }
    },
    growth: {
      name: "Growth",
      description: "Dla ustrukturyzowanych firm potrzebujących pełnej kontroli",
      features: {
        "0": "Do 150 użytkowników w pakiecie",
        "1": "Wszystko, co jest dostępne w planie Business",
        "2": "Obejmuje raport ze zdjęciem i podpisem cyfrowym",
        "3": "Obejmuje komunikację wewnętrzną",
        "4": "Zaawansowane role (Admin / Supervisor / Pracownik)",
        "5": "Analiza wydajności na budowie"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "Rozwiązanie szyte na miarę dla nieograniczonego wzrostu",
      features: {
        "0": "Nielimitowana liczba użytkowników",
        "1": "Zaawansowana personalizacja",
        "2": "Kalendarz",
        "3": "Postęp prac budowlanych",
        "4": "Dostęp do API (W następnej wersji)",
        "5": "Single Sign-On (SSO / SAML)",
        "6": "Opcja White-Label (Własne logo i domena)"
      }
    }
  }
} as const;
