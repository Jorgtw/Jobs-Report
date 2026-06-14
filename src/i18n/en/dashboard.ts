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
  upgradeModal: {
    monthly: 'Monthly',
    annually: 'Annually',
    billedAnnually: 'Billed annually',
    twoMonthsFree: '-17%',
    complianceTitle: "Compliance Module",
    complianceDesc: "Ensure regulatory compliance with advanced reports and automated security checks.",
    communicationsDesc: "Unlock real-time internal communications and track company messages.",
    genericTitle: "Expand your business",
    genericDesc: "Choose the plan that best suits your needs and take Jobs-Report to the next level.",
    loadingPlans: "Loading plans...",
    recommended: "Recommended",
    perMonth: "/month",
    activateNow: "Activate Now",
    securePayments: "Secure payments via Stripe",
    footerSupport: "JobsReport Professional Edition • 24/7 Support",
    checkoutError: "An error occurred while opening checkout. Please try again later."
  },
  plans: {
    free: {
      name: "Free",
      description: "Entry level test to evaluate the product on site",
      features: {
        "0": "Up to 5 users included",
        "1": "Basic projects and reports",
        "2": "No AI capabilities",
        "3": "Does not include Photos/Signature",
        "4": "Does not include Internal Communications"
      }
    },
    starter: {
      name: "Starter",
      description: "Ideal for micro-businesses and growing craftsmen",
      features: {
        "0": "Up to 10 users included",
        "1": "Unlimited projects and reports",
        "2": "Complete time and expense tracking",
        "3": "Basic PDF/Excel exports",
        "4": "PWA mobile app + Web",
        "5": "Does not include Photos/Signature",
        "6": "Does not include Internal Communications"
      }
    },
    business: {
      name: "Business",
      description: "The heart of Jobs-Report for structured SMEs",
      features: {
        "0": "Up to 50 users included",
        "1": "Everything in Starter Plan",
        "2": "Includes Photos and Signature",
        "3": "Includes Internal Communications",
        "4": "AI insights and automated reports",
        "5": "Advanced cost and revenue analysis"
      }
    },
    growth: {
      name: "Growth",
      description: "For structured companies that need total control",
      features: {
        "0": "Up to 150 users included",
        "1": "Everything in Business Plan",
        "2": "Includes Photos and Signature",
        "3": "Includes Internal Communications",
        "4": "Advanced roles (Admin/Supervisor/Worker)",
        "5": "On-site performance analytics"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "Custom solution for unlimited growth",
      features: {
        "0": "Unlimited users",
        "1": "Advanced customization",
        "2": "Calendar",
        "3": "Work progress tracking",
        "4": "API access (Next version)",
        "5": "Single Sign-On (SSO / SAML)",
        "6": "White-Label option (your logo and domain)"
      }
    }
  }
} as const;
