// src/i18n/it/communications.ts
export const communications = {
  // Menu & Dashboard
  internalCommunications: 'Comunicazioni Interne',
  internalCommunicationsDesc: 'Invia e ricevi messaggi aziendali in tempo reale',
  newCommunication: 'Nuova Comunicazione',
  
  // Form Invio
  sendTo: 'Invia a',
  recipient: 'Destinatario',
  subject: 'Oggetto',
  message: 'Messaggio',
  selectUsers: 'Seleziona collaboratori',
  allUsers: 'Tutti gli utenti',
  placeholderSelectUsers: 'Seleziona uno o più utenti...',
  
  // Tipi e Tab
  todo: 'Da Fare',
  sent: 'Inviate',
  inbox: 'In Arrivo',
  outbox: 'In Uscita',
  archive: 'Archivio',
  thread: 'Conversazione',
  messagesTab: 'Messaggi',
  internalCommunication: 'Comunicazione Interna',
  
  // Tipi Specifici
  type_note: 'Nota',
  type_issue: 'Segnalazione',
  type_confirmation: 'Conferma',
  
  // Tabella e Dettagli
  sender: 'Mittente',
  type: 'Tipo',
  allTeam: 'Tutto il Team',
  myself: 'Io stesso',
  recipientLabel: 'Destinatario',
  waitingYourReply: 'in attesa della tua risposta',
  waitingOthersReply: 'in attesa di risposta altrui',
  actionRequired: 'Azione Richiesta',
  note: 'Nota',
  issue: 'Segnalazione',
  confirmation: 'Conferma',
  writeMessage: 'Scrivi un messaggio...',
  noThreadSelected: 'Seleziona una conversazione per visualizzare i dettagli',
  exportHistory: 'Esporta Cronologia PDF',
  loading: 'Caricamento...',
  
  // Azioni
  acknowledge: 'Conferma Ricezione',
  takeInCharge: 'Prendi in carico',
  close: 'Chiudi',
  archiveAction: 'Archivia',
  closed: 'Chiuso',
  archiveCommunication: 'Archivia',
  send: 'Invia',
  
  // Stati & Feedback
  noCommunicationsYet: 'Nessuna comunicazione presente',
  no_workers_available: 'Nessun collaboratore disponibile',
  unreadMessages: 'Messaggi non letti',
  messageSentSuccess: 'Comunicazione inviata con successo!',
  
  // Stati di Workflow
  status_open: 'Aperto',
  status_acknowledged: 'Ricevuto',
  status_in_progress: 'In Corso',
  status_closed: 'Chiusa',
  status_archived: 'Archiviata',
  status_deleted: 'Eliminata',

  // Paywall & Premium
  premiumFeature: 'Funzionalità Premium',
  premiumRequiredDesc: 'Questa funzione è disponibile solo per le aziende con abbonamento Premium.',
  upgradeNow: 'Passa a Premium',
  unlockFullPotential: 'Sblocca tutto il potenziale della tua azienda',
  lockFeatureTip: 'Le aziende Premium possono comunicare con tutto il team in un clic.',
  
  // Upgrade Modal Specific (Legacy mapping)
  upgradeTitle: 'Funzionalità Premium',
  upgradeDesc: 'Questa funzionalità (Foto + Firma + PDF Professionale) è riservata agli account Premium.',
  upgradeCTA: 'Sblocca con Donazione',
  read_at: 'Letto il',
  thread_closed_msg: 'Questa conversazione è stata chiusa. Archivia per completare il ciclo.',
  thread_archived_msg: 'Conversazione archiviata.',
  feature_ticket_title: 'Ticket & Thread',
  feature_ticket_desc: 'Gestisci conversazioni strutturate per ogni richiesta',
  feature_teamsync_title: 'Team Sync',
  feature_teamsync_desc: 'Invia avvisi a tutto il team o a singoli progetti',
  feature_pdf_title: 'Export PDF',
  feature_pdf_desc: 'Scarica i verbali delle conversazioni in formato PDF'
} as const;
