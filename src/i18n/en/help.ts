// src/i18n/en/help.ts
export const help = {
  // --- HELP CENTER ---
  title: "Help Center",
  subtitle: "Guides and instructions for using the app",
  workerTab: "Operator Guide",
  adminTab: "Administrator Guide",
  
  // Articles
  newReportTitle: "Creating a Work Report",
  newReportBody: "To create a new report, go to the 'Reports' section and click '+'. Select the date, project, and enter the hours worked. Don't forget to briefly describe the activity performed!",
  additionalWorkersTitle: "Adding Collaborators",
  additionalWorkersBody: "If you work in a team, you can add other colleagues to the same report by clicking 'Add Collaborator' at the bottom of the new report form.",
  pwaTitle: "Installation on Phone",
  pwaBody: "You can install Jobs Report as a real app to open it quickly from your home screen without going through the browser.",
  adminSummaryTitle: "Monitoring and Billing",
  adminSummaryBody: "In the 'Work Summary' section, you can filter data by period, client, or collaborator. Here you can also update the billing status (Pending, Invoiced, Paid) and export data to Excel or PDF.",
  adminPersonnelTitle: "Personnel Management",
  adminPersonnelBody: "You can create new users in the 'Personnel' section. Remember to enter the correct email to be able to send them access instructions with a single click.",
  adminInternalTitle: "Internal Activities (Sickness/Holidays)",
  adminInternalBody: "To manage absences, use the new 'New Internal Activity' button in the Projects section. This will create a special project that doesn't generate revenue but correctly tracks personnel costs.",
  
  // Support Contact
  supportContact: "Please check the User Guide first — you will find the answer to most questions. For technical problems, contact your account administrator.",
  contactHeader: "Need help?",
  guideTitle: "Complete User Guide",
  guideBody: "Consult the detailed manual with step-by-step instructions for each function.",
  guideBtn: "Open Guide →",

  // --- ONBOARDING TOUR ---
  onboardingTitle: "Welcome to Jobs-Report! 👋",
  onboardingBody: "This guide will help you set up your account in seconds. Let's get started!",
  stepClientsTitle: "Clients Archive",
  stepClientsBody: "Start here: enter your clients to be able to associate them with future projects.",
  stepPersonnelTitle: "Your Team",
  stepPersonnelBody: "Add your collaborators and set their hourly costs for precise profitability calculation.",
  stepProjectsTitle: "Site Management",
  stepProjectsBody: "Create your projects, set sales prices, and monitor profit margins.",
  stepReportsTitle: "Work Reports",
  stepReportsBody: "Here you will find the list of all entered works. You can filter them, export them to PDF/Excel, or generate Compliance Reports.",
  stepFinishTitle: "All Ready!",
  stepFinishBody: "Now you are ready to manage your work like a professional. You can restart this tour at any time from the Help section.",
  next: "Next",
  skip: "Skip",
  finish: "Finish",
  restart: "Restart Tutorial",

  // --- AI ASSISTANT ---
  aiName: "Jobs Report Assistant",
  aiSubtitle: "Speaking Manual",
  aiWelcome: "Hi! I'm the intelligent Jobs Report manual. Ask me how the app works!",
  aiPlaceholder: "Ask a question about the app...",
  aiWriting: "Assistant is writing...",
  aiErrorConnection: "Connection error with AI assistant.",
  aiErrorPrefix: "I'm sorry, an error occurred: ",
  aiUserLabel: "You",
  aiBotLabel: "AI Assistant",
  chatWithAI: "Chat with AI Assistant",
  
  // Onboarding Aliases (for migration)
  onboarding_welcome_title: "Welcome to Jobs-Report! 👋",
  onboarding_welcome_body: "This guide will help you set up your account in seconds. Let's get started!",
  onboarding_clients_title: "Clients Archive",
  onboarding_clients_body: "Start here: enter your clients to be able to associate them with future projects.",
  onboarding_personnel_title: "Your Team",
  onboarding_personnel_body: "Add your collaborators and set their hourly costs for precise profitability calculation.",
  onboarding_projects_title: "Site Management",
  onboarding_projects_body: "Create your projects, set sales prices, and monitor profit margins.",
  onboarding_reports_title: "Work Reports",
  onboarding_reports_body: "Here you will find the list of all entered works. You can filter them, export them to PDF/Excel, or generate Compliance Reports.",
  onboarding_finish_title: "All Ready!",
  onboarding_finish_body: "Now you are ready to manage your work like a professional. You can restart this tour at any time from the Help section.",
  onboarding_skip: "Skip",
  onboarding_next: "Next",
  onboarding_finish: "Finish",

  // AI Assistant Aliases
  aiAssistantName: "Jobs Report Assistant",
  aiAssistantSubtitle: "Speaking Manual",
  aiWelcomeMessage: "Hi! I'm the intelligent Jobs Report manual. Ask me how the app works!",
} as const;
