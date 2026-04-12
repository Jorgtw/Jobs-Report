// src/i18n/da/communications.ts
export const communications = {
  // Menu & Dashboard
  internalCommunications: 'Intern kommunikation',
  internalCommunicationsDesc: 'Send og modtag virksomhedsbeskeder i realtid',
  newCommunication: 'Ny kommunikation',
  
  // Afsendelsesformular
  sendTo: 'Send til',
  recipient: 'Modtager',
  subject: 'Emne',
  message: 'Besked',
  selectUsers: 'Vælg kolleger',
  allUsers: 'Alle brugere',
  placeholderSelectUsers: 'Vælg en eller flere brugere...',
  
  // Typer og faner
  todo: 'To-do',
  sent: 'Sendt',
  inbox: 'Indbakke',
  outbox: 'Sendt',
  archive: 'Arkiv',
  thread: 'Samtale',
  messagesTab: 'Beskeder',
  internalCommunication: 'Intern kommunikation',
  
  // Specifikke typer
  type_note: 'Note',
  type_issue: 'Fejlmelding',
  type_confirmation: 'Bekræftelse',
  
  // Tabel og detaljer
  sender: 'Afsender',
  type: 'Type',
  allTeam: 'Hele teamet',
  myself: 'Mig selv',
  recipientLabel: 'Modtager',
  waitingYourReply: 'venter på dit svar',
  waitingOthersReply: 'venter på andres svar',
  actionRequired: 'Handling påkrævet',
  note: 'Note',
  issue: 'Fejlmelding',
  confirmation: 'Bekræftelse',
  writeMessage: 'Skriv en besked...',
  noThreadSelected: 'Vælg en samtale for at se detaljer',
  exportHistory: 'Exporter PDF-historik',
  loading: 'Indlæser...',
  
  // Handlinger
  acknowledge: 'Bekræft modtagelse',
  takeInCharge: 'Tag ansvaret',
  close: 'Luk',
  archiveAction: 'Arkiver',
  closed: 'Lukket',
  archiveCommunication: 'Arkiver',
  send: 'Send',
  
  // Statusser & Feedback
  noCommunicationsYet: 'Ingen kommunikation til stede',
  no_workers_available: 'Ingen kolleger tilgængelige',
  unreadMessages: 'Ulæste beskeder',
  messageSentSuccess: 'Kommunikation sendt med succes!',
  
  // Workflow-statusser
  status_open: 'Åben',
  status_acknowledged: 'Modtaget',
  status_in_progress: 'I gang',
  status_closed: 'Lukket',
  status_archived: 'Arkiveret',
  status_deleted: 'Slettet',

  // Paywall & Premium
  premiumFeature: 'Premium-funktion',
  premiumRequiredDesc: 'Denne funktion er kun tilgængelig for virksomheder med et Premium-abonnement.',
  upgradeNow: 'Opgrader til Premium',
  unlockFullPotential: 'Lås op for din virksomheds fulde potentiale',
  lockFeatureTip: 'Premium-virksomheder kan kommunikere med hele teamet med ét klik.',
  
  // Specifikt for opgraderingsmodal
  upgradeTitle: 'Premium-funktion',
  upgradeDesc: 'Denne funktion (Foto + Underskrift + Professionel PDF) er reserveret til Premium-konti.',
  upgradeCTA: 'Lås op med donation',
  read_at: 'Læst kl.',
  thread_closed_msg: 'Denne samtale er lukket. Arkiver for at fuldføre cyklussen.',
  thread_archived_msg: 'Samtale arkiveret.',
  feature_ticket_title: 'Ticket & Thread',
  feature_ticket_desc: 'Håndter strukturerede samtaler for hver anmodning',
  feature_teamsync_title: 'Team Sync',
  feature_teamsync_desc: 'Send advarsler til hele teamet eller specifikke projekter',
  feature_pdf_title: 'Eksporter PDF',
  feature_pdf_desc: 'Download samtale-logs i PDF format',
  tab_inbox: 'INDBAKKE',
  tab_working: 'I GANG',
  tab_waiting: 'VENTER',
  tab_completed: 'FÆRDIG'
} as const;
