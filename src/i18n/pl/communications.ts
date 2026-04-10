// src/i18n/pl/communications.ts
export const communications = {
  // Menu i Dashboard
  internalCommunications: 'Komunikacja Wewnętrzna',
  internalCommunicationsDesc: 'Wysyłaj i odbieraj wiadomości firmowe w czasie rzeczywistym',
  newCommunication: 'Nowa Komunikacja',
  
  // Formularz wysyłania
  sendTo: 'Wyślij do',
  recipient: 'Odbiorca',
  subject: 'Temat',
  message: 'Wiadomość',
  selectUsers: 'Wybierz współpracowników',
  allUsers: 'Wszyscy użytkownicy',
  placeholderSelectUsers: 'Wybierz jednego lub więcej użytkowników...',
  
  // Typy i Zakładki
  todo: 'Do zrobienia',
  sent: 'Wysłane',
  inbox: 'Odebrane',
  outbox: 'Wysłane',
  archive: 'Archiwum',
  thread: 'Rozmowa',
  messagesTab: 'Wiadomości',
  internalCommunication: 'Komunikacja Wewnętrzna',
  
  // Konkretne Typy
  type_note: 'Notatka',
  type_issue: 'Zgłoszenie',
  type_confirmation: 'Potwierdzenie',
  
  // Tabela i Szczegóły
  sender: 'Nadawca',
  type: 'Typ',
  allTeam: 'Cały zespół',
  myself: 'Ja sam',
  recipientLabel: 'Odbiorca',
  waitingYourReply: 'oczekiwanie na Twoją odpowiedź',
  waitingOthersReply: 'oczekiwanie na odpowiedź innych',
  actionRequired: 'Wymagana Akcja',
  note: 'Notatka',
  issue: 'Zgłoszenie',
  confirmation: 'Potwierdzenie',
  writeMessage: 'Napisz wiadomość...',
  noThreadSelected: 'Wybierz rozmowę, aby wyświetlić szczegóły',
  exportHistory: 'Eksportuj Historię PDF',
  loading: 'Ładowanie...',
  
  // Akcje
  acknowledge: 'Potwierdź Odbiór',
  takeInCharge: 'Przejmij do realizacji',
  close: 'Zamknij',
  archiveAction: 'Archiwizuj',
  closed: 'Zamknięte',
  archiveCommunication: 'Archiwizuj',
  send: 'Wyślij',
  
  // Stany i Informacje zwrotne
  noCommunicationsYet: 'Brak komunikacji',
  no_workers_available: 'Brak dostępnych współpracowników',
  unreadMessages: 'Nieprzeczytane wiadomości',
  messageSentSuccess: 'Komunikacja wysłana pomyślnie!',
  
  // Statusy Workflow
  status_open: 'Otwarte',
  status_acknowledged: 'Odebrane',
  status_in_progress: 'W toku',
  status_closed: 'Zamknięte',
  status_archived: 'Zarchiwizowane',
  status_deleted: 'Usunięte',

  // Paywall i Premium
  premiumFeature: 'Funkcja Premium',
  premiumRequiredDesc: 'Ta funkcja jest dostępna tylko dla firm z subskrypcją Premium.',
  upgradeNow: 'Przejdź na Premium',
  unlockFullPotential: 'Odblokuj pełny potencjał swojej firmy',
  lockFeatureTip: 'Firmy Premium mogą komunikować się z całym zespołem jednym kliknięciem.',
  
  // Specyficzne dla Modal ulepszenia
  upgradeTitle: 'Funkcja Premium',
  upgradeDesc: 'Ta funkcja (Zdjęcia + Podpis + Profesjonalny PDF) jest zarezerwowana dla kont Premium.',
  upgradeCTA: 'Odblokuj Formularzem',
  read_at: 'Przeczytano o',
  thread_closed_msg: 'Ta rozmowa została zamknięta. Zarchiwizuj, aby zakończyć cykl.',
  thread_archived_msg: 'Rozmowa zarchiwizowana.',
  feature_ticket_title: 'Ticket & Thread',
  feature_ticket_desc: 'Zarządzaj ustrukturyzowanymi rozmowami dla każdego zgłoszenia',
  feature_teamsync_title: 'Team Sync',
  feature_teamsync_desc: 'Wysyłaj powiadomienia do całego zespołu lub konkretnych projektów',
  feature_pdf_title: 'Eksportuj PDF',
  feature_pdf_desc: 'Pobierz logi rozmów w formacie PDF'
} as const;
