// src/i18n/en/communications.ts
export const communications = {
  // Menu & Dashboard
  internalCommunications: 'Internal Communications',
  internalCommunicationsDesc: 'Send and receive company messages in real time',
  newCommunication: 'New Communication',
  
  // Sending Form
  sendTo: 'Send to',
  recipient: 'Recipient',
  subject: 'Subject',
  message: 'Message',
  selectUsers: 'Select collaborators',
  allUsers: 'All users',
  placeholderSelectUsers: 'Select one or more users...',
  
  // Types and Tabs
  todo: 'To Do',
  sent: 'Sent',
  inbox: 'Inbox',
  outbox: 'Sent',
  archive: 'Archive',
  thread: 'Conversation',
  messagesTab: 'Messages',
  internalCommunication: 'Internal Communication',
  
  // Specific Types
  type_note: 'Note',
  type_issue: 'Issue',
  type_confirmation: 'Confirmation',
  
  // Table and Details
  sender: 'Sender',
  type: 'Type',
  allTeam: 'Whole Team',
  myself: 'Myself',
  recipientLabel: 'Recipient',
  waitingYourReply: 'waiting for your reply',
  waitingOthersReply: 'waiting for others\' reply',
  actionRequired: 'Action Required',
  note: 'Note',
  issue: 'Issue',
  confirmation: 'Confirmation',
  writeMessage: 'Write a message...',
  noThreadSelected: 'Select a conversation to view details',
  exportHistory: 'Export PDF History',
  loading: 'Loading...',
  
  // Actions
  acknowledge: 'Acknowledge Receipt',
  takeInCharge: 'Working',
  close: 'Close',
  archiveAction: 'Archive',
  closed: 'Closed',
  archiveCommunication: 'Archive',
  send: 'Send',
  
  // States & Feedback
  noCommunicationsYet: 'No communications present',
  no_workers_available: 'No collaborators available',
  unreadMessages: 'Unread messages',
  messageSentSuccess: 'Communication sent successfully!',
  
  // Workflow Statuses
  status_open: 'Open',
  status_acknowledged: 'Acknowledged',
  status_in_progress: 'In Progress',
  status_closed: 'Closed',
  status_archived: 'Archived',
  status_deleted: 'Deleted',

  // Paywall & Premium
  premiumFeature: 'Premium Feature',
  premiumRequiredDesc: 'This feature is only available for companies with a Premium subscription.',
  upgradeNow: 'Upgrade to Premium',
  unlockFullPotential: 'Unlock your company\'s full potential',
  lockFeatureTip: 'Premium companies can communicate with the entire team in one click.',
  
  // Upgrade Modal Specific (Legacy mapping)
  upgradeTitle: 'Premium Feature',
  upgradeDesc: 'This feature (Photos + Signature + Professional PDF) is reserved for Premium accounts.',
  upgradeCTA: 'Unlock with Donation',
  read_at: 'Read at',
  thread_closed_msg: 'This conversation has been closed. Archive to complete the cycle.',
  thread_archived_msg: 'Conversation archived.',
  feature_ticket_title: 'Ticket & Thread',
  feature_ticket_desc: 'Manage structured conversations for every request',
  feature_teamsync_title: 'Team Sync',
  feature_teamsync_desc: 'Send alerts to the whole team or specific projects',
  feature_pdf_title: 'Export PDF',
  feature_pdf_desc: 'Download conversation logs in PDF format',
  tab_inbox: 'INBOX',
  tab_working: 'WORKING',
  tab_waiting: 'WAITING',
  tab_completed: 'COMPLETED',
  workingTooltip: 'Move this communication to working state',
  forward: 'Forward',
  forwardAction: 'Send forward',
  additionalMessage: 'Additional message (optional)',
  push_banner_title: 'Enable push notifications',
  push_banner_desc: 'Receive real-time updates even when the app is closed.',
  push_activate: 'Enable now',
  push_dismiss: 'Not now',
  push_enabled: 'Notifications enabled!',
  push_settings_title: 'Notification Settings',
  push_notifications: 'Push Notifications',
  push_status_active: 'Notifications Active',
  push_status_blocked: 'Unauthorized',
  push_status_disabled: 'Disabled by user',
  push_deactivate: 'Deactivate Notifications',
  push_reset_hint: 'Unblock notifications in browser settings',
  push_sound: 'Notification Sound',
  push_sound_desc: 'Play a sound alert when received'
} as const;
