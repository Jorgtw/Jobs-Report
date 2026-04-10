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
  takeInCharge: 'Take in Charge',
  close: 'Close',
  archive: 'Archive',
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
  upgradeCTA: 'Unlock with Donation'
} as const;
