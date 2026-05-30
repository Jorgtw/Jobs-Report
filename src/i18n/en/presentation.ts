export const presentation = {
  sidebar: {
    clienti: "Clients",
    personale: "Personnel",
    progetti: "Projects",
    subappalti: "Subcontracts",
    rapportini: "Timesheets",
    sommario: "Work Summary",
    profilo: "Profile",
    assistenza: "Support",
    esci: "Exit"
  },
  hero: {
    tag: "The value of experience",
    title: "Timesheets and real-time cost control",
    desc: "Created after more than 30 years of first-hand field experience: first as a worker and then as an administrator. JobsReport is the practical tool born from the real needs of those who manage construction sites every day."
  },
  ui: {
    key_features: "Key Features",
    request_demo: "Request a free demo →",
    footer_rights: "All rights reserved",
    overlay_title: "Welcome to JobsReport",
    overlay_sub: "Choose your language to start the presentation"
  },
  sections: {
    clienti: {
      title: "Clients",
      desc: "Essential registry for managing your construction sites.",
      groups: [
          {
          title: "Company Data",
          items: [
              {
              name: "Essential Form",
              desc: "Company name, VAT and contacts."
            },
              {
              name: "Client Status",
              desc: "Easily manage Active/Inactive clients."
            }
            ]
        }
        ]
    },
    personale: {
      title: "Your Team",
      desc: "Management and onboarding of internal and external personnel.",
      groups: [
          {
          title: "Roles and Language",
          items: [
              {
              name: "Onboarding",
              desc: "Send app instructions in the worker's language."
            },
              {
              name: "Roles",
              desc: "Worker, Supervisor or Administrator."
            }
            ]
        }
        ]
    },
    progetti: {
      title: "Projects",
      desc: "Configuration and monitoring of sites and internal activities.",
      groups: [
          {
          title: "Type",
          items: [
              {
              name: "Clients vs Internal",
              desc: "Manage external orders or activities like Absence/Leave."
            },
              {
              name: "Budgeting",
              desc: "Support for hourly or lump-sum work."
            }
            ]
        }
        ]
    },
    subappalti: {
      title: "Subcontracts",
      desc: "Collaborate with external firms while maintaining full cost control.",
      groups: [
          {
          title: "Partners",
          items: [
              {
              name: "Firm Management",
              desc: "Subcontractor registry and contacts."
            },
              {
              name: "External Costs",
              desc: "Monitoring of lump-sum or hourly jobs."
            }
            ]
        }
        ]
    },
    rapportini: {
      title: "Timesheets",
      desc: "Make daily reporting fast, precise and professional.",
      groups: [
          {
          title: "Execution",
          items: [
              {
              name: "Real Time",
              desc: "Precise Start/End/Break tracking or direct hours."
            },
              {
              name: "Expenses",
              desc: "Field entries for meals, materials and parking."
            }
            ]
        },
          {
          title: "Management",
          items: [
              {
              name: "Team Leader",
              desc: "Supervisors can enter data for the whole team."
            }
            ]
        }
        ]
    },
    sommario: {
      title: "Economic Analysis",
      desc: "Work Summary: the core of margin control.",
      groups: [
          {
          title: "Analysis",
          items: [
              {
              name: "Real-Time",
              desc: "Net margins and costs calculated instantly."
            },
              {
              name: "Filters and Export",
              desc: "Filter and download data in PDF or business-oriented aggregated Excel reports (Payroll, Subcontracts, Billing, Summary)."
            }
            ]
        }
        ]
    },
    profilo: {
      title: "Your Account",
      desc: "Personalize your work experience.",
      groups: [
          {
          title: "Account",
          items: [
              {
              name: "Security",
              desc: "Access management and language preferences."
            }
            ]
        }
        ]
    },
    assistenza: {
      title: "Support Center",
      desc: "Quick guides and instructions for optimal app usage.",
      groups: [
          {
          title: "Quick Guide",
          items: [
              {
              name: "Installation",
              desc: "Add the app to your home screen (iPhone: \"Add to Home\", Android: \"Install App\")."
            },
              {
              name: "Filters",
              desc: "Use \"Work Summary\" to monitor margins and costs in real-time."
            }
            ]
        },
          {
          title: "Support",
          items: [
              {
              name: "Admin",
              desc: "For technical support, contact the system administrator directly."
            }
            ]
        }
        ]
    }
  }
} as const;
