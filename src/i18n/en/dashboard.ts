export const dashboard = {
  estimatedExpenses: "Estimated Expenses",
  toInvoice: "To Invoice",
  worksInProgress: "Works in Progress",
  margin: "Margin",
  weeklyOverview: "Weekly Overview",
  last7DaysData: "Last 7 days data",
  newCompanies: "New Companies",
  activeCompanies: "Active Companies",
  newPremiums: "New Premiums",
  totalReports: "Total Reports",
  mostActiveWeekly: "Most Active Weekly",
  pendingRequestsReminder: "Pending Requests",
  pendingRequestsDesc: "There are new registration requests waiting for approval.",
  quickSupport: "Quick Support",
  quickSupportDesc: "Contact the technical team for immediate assistance on the platform.",
  portalError: "Could not open the Customer Portal. Please verify that you have an active subscription.",
  managePlan: "Manage Plan",
  commercialOverrideNotice: "This company's plan is managed directly by administration. To change it, please contact support.",
  onlineManagementUnavailable: "Online subscription management is not available for this account. Please contact support.",
  contactSupport: "Contact Support",
  companiesManagement: "Companies Management",
  createCompanyBtn: "Create New Company",
  editCompany: "Edit Company",
  companyName: "Company Name",
  companyStatus: "Company Status",
  demoFieldsLocked: "In this demo version some data cannot be modified.",
  impersonateUser: "Simulate User Access",
  adminAdminName: "Admin Name",
  adminAdminUsername: "Admin Username",
  adminName: "Company Admin Name",
  adminUsername: "Admin Username",
  adminPassword: "Admin Password",
  corporateData: "Corporate Data (PDF Header)",
  address: "Address",
  city: "City",
  country: "Country",
  phone: "Phone",
  companyEmail: "Company Email",
  vatNumber: "VAT / Tax ID",
  premiumPlan: "Premium Plan",
  premiumPlanDesc: "Enable Premium features (Compliance Report, Photos, Signature)",
  try_demo: "Try Demo",
  companyNamePlaceholder: "e.g. Acme Industries Ltd",
  tempPasswordPlaceholder: "Temporary password",
  italy: "Italy",
  premium: "Premium",
  missingEmailOrAdminId: "Email or Admin ID missing for this company.",
  prepareManualEmail: "Prepare Manual Email",
  sendCredentials: "Send Credentials",
  activatePremiumDesc: "Activate premium features for this company immediately.",
  sendCredentialsTitle: "Sending Credentials",
  prepareManualEmailBtn: "PREPARE EMAIL (MANUAL)",
  emailSubject: "Access Credentials Jobs Report - {company}",
  emailBody: "Hello {name},\n\nHere are your access credentials for Jobs Report:\n\nURL: https://jobs-report.vercel.app\nUsername: {username}\nPassword: {password}\n\nWe recommend that you change your password upon your first access.\n\nBest regards,\nThe JobsReport Team",
  sendCredentialsHintEdit: "Enter a password above to send it to the client.",
  sendCredentialsHintCreate: "Automatically send username and password to the company's email address.",
  sendingInProgress: "SENDING IN PROGRESS...",
  autoSendActive: "AUTO-SEND ACTIVE",
  sendInstructionsAuto: "SEND INSTRUCTIONS (AUTO)",
  freeSupportBanner: {
    title: "Support Jobs-Report",
    description: "All features remain freely available for up to 5 users. If you find Jobs-Report valuable, upgrading to Starter supports app development and lets you use up to 10 users.",
    button: "Upgrade to Starter"
  },
  upgradeModal: {
    monthly: 'Monthly',
    annually: 'Annually',
    billedAnnually: 'Billed annually',
    twoMonthsFree: '-17%',
    teamTitle: 'Choose the right plan for your team',
    complianceTitle: 'Reports and Signatures',
    complianceDesc: 'All operational features are included in every plan.',
    communicationsDesc: 'All operational features are included in every plan.',
    genericTitle: 'Choose the right plan for your team',
    genericDesc: 'All operational features are included in every plan. Choose based on your team size.',
    loadingPlans: 'Loading plans...',
    recommended: 'Recommended',
    perMonth: '/month',
    activateNow: 'Activate Now',
    securePayments: 'Secure payments via Stripe',
    footerSupport: 'JobsReport Professional Edition • 24/7 Support',
    checkoutError: 'An error occurred while opening checkout. Please try again later.'
  },
  plans: {
    free: {
      name: 'Free',
      description: 'Ideal for micro-teams and independent contractors',
      features: {
        '0': 'Up to 5 users included',
        '1': 'All operational features included',
        '2': 'Unlimited projects and reports',
        '3': 'Intervention Reports with Photos & Signature',
        '4': 'Internal communications',
        '5': 'PDF & Excel exports'
      }
    },
    starter: {
      name: 'Starter',
      description: 'Ideal for small businesses and teams up to 10 people',
      features: {
        '0': 'Up to 10 users included',
        '1': 'All operational features included',
        '2': 'Unlimited projects and reports',
        '3': 'Intervention Reports with Photos & Signature',
        '4': 'Internal communications',
        '5': 'PDF & Excel exports'
      }
    },
    business: {
      name: 'Business',
      description: 'The perfect solution for SMEs and structured teams up to 50 people',
      features: {
        '0': 'Up to 50 users included',
        '1': 'All operational features included',
        '2': 'Unlimited projects and reports',
        '3': 'Intervention Reports with Photos & Signature',
        '4': 'Internal communications',
        '5': 'PDF & Excel exports'
      }
    },
    growth: {
      name: 'Growth',
      description: 'For rapidly expanding companies up to 150 people',
      features: {
        '0': 'Up to 150 users included',
        '1': 'All operational features included',
        '2': 'Unlimited projects and reports',
        '3': 'Intervention Reports with Photos & Signature',
        '4': 'Internal communications',
        '5': 'PDF & Excel exports'
      }
    },
    enterprise: {
      name: 'Enterprise',
      description: 'Custom solution for large organizations over 150 people',
      features: {
        '0': 'Over 150 users (unlimited)',
        '1': 'All operational features included',
        '2': 'Unlimited projects and reports',
        '3': 'Priority support & dedicated onboarding',
        '4': 'Customizations upon request'
      }
    }
  }
} as const;
