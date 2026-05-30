export const dashboard = {
  estimatedExpenses: "Gastos Previstos",
  toInvoice: "Por Facturar",
  worksInProgress: "Trabajos en Curso",
  margin: "Margen",
  weeklyOverview: "Resumen Semanal",
  last7DaysData: "Datos de los últimos 7 días",
  newCompanies: "Nuevas Empresas",
  activeCompanies: "Empresas Activas",
  newPremiums: "Nuevos Premium",
  totalReports: "Partes Totales",
  mostActiveWeekly: "Las Más Activas de la Semana",
  pendingRequestsReminder: "Solicitudes Pendientes",
  pendingRequestsDesc: "Hay nuevas solicitudes de registro pendientes de aprobación.",
  quickSupport: "Soporte Rápido",
  quickSupportDesc: "Contacta con el equipo técnico para asistencia inmediata en la plataforma.",
  companiesManagement: "Gestión de Empresas",
  createCompanyBtn: "Crear Nueva Empresa",
  editCompany: "Editar Empresa",
  companyName: "Nombre de la Empresa",
  companyStatus: "Estado de la Empresa",
  demoFieldsLocked: "En esta versión demo algunos datos no son modificables.",
  impersonateUser: "Simular Acceso de Usuario",
  adminAdminName: "Nombre Admin",
  adminAdminUsername: "Usuario Admin",
  adminName: "Nombre del Administrador de la Empresa",
  adminUsername: "Usuario del Administrador",
  adminPassword: "Contraseña del Administrador",
  corporateData: "Datos Corporativos (encabezado PDF)",
  address: "Dirección",
  city: "Ciudad",
  country: "País",
  phone: "Teléfono",
  companyEmail: "Email de la Empresa",
  vatNumber: "CIF / NIF",
  premiumPlan: "Plan Premium",
  premiumPlanDesc: "Habilita las funcionalidades Premium (Informe de Conformidad, Fotos, Firma)",
  try_demo: "Prueba la Demo",
  companyNamePlaceholder: "Ej. Edilizia Rossi srl",
  tempPasswordPlaceholder: "Contraseña temporal",
  italy: "España",
  premium: "Premium",
  upgradeModal: {
    complianceTitle: "Módulo de Compliance",
    complianceDesc: "Garantice el cumplimiento normativo con informes avanzados y controles de seguridad automatizados.",
    genericTitle: "Expanda su negocio",
    genericDesc: "Elija el plan que mejor se adapte a sus necesidades y lleve Jobs-Report al siguiente nivel.",
    loadingPlans: "Cargando planes...",
    recommended: "Recomendado",
    perMonth: "/mes",
    activateNow: "Activar Ahora",
    securePayments: "Pagos seguros a través de Stripe",
    footerSupport: "JobsReport Professional Edition • Soporte 24/7",
    checkoutError: "Ocurrió un error al abrir el pago. Por favor, inténtelo de nuevo más tarde.",
    communicationsDesc: "Desbloquee comunicaciones internas en tiempo real y realice un seguimiento de los mensajes de la empresa."
  },
  missingEmailOrAdminId: "Falta el correo electrónico o el ID de administrador de esta empresa.",
  prepareManualEmail: "Preparar correo electrónico manual",
  sendCredentials: "Enviar credenciales",
  activatePremiumDesc: "Active las funciones premium para esta empresa de inmediato.",
  sendCredentialsTitle: "Enviando credenciales",
  prepareManualEmailBtn: "PREPARAR CORREO ELECTRÓNICO (MANUAL)",
  emailSubject: "Credenciales de acceso a Jobs Report - {company}",
  emailBody: "Hola {name},\n\nAquí tiene sus credenciales de acceso para Jobs Report:\n\nURL: https://jobs-report.vercel.app\nUsuario: {username}\nContraseña: {password}\n\nLe recomendamos cambiar su contraseña en su primer acceso.\n\nAtentamente,\nEl equipo de JobsReport",
  sendCredentialsHintEdit: "Ingrese una contraseña arriba para enviarla al cliente.",
  sendCredentialsHintCreate: "Enviar automáticamente el nombre de usuario y la contraseña a la dirección de correo electrónico de la empresa.",
  sendingInProgress: "ENVÍO EN CURSO...",
  autoSendActive: "ENVÍO AUTOMÁTICO ACTIVO",
  sendInstructionsAuto: "ENVIAR INSTRUCCIONES (AUTO)",
  plans: {
    free: {
      name: "Free",
      description: "Prueba inicial para evaluar el producto en la obra",
      features: {
        "0": "Hasta 5 usuarios incluidos",
        "1": "Proyectos y partes básicos",
        "2": "Sin funcionalidades de IA",
        "3": "No incluye Foto/Firma en parte",
        "4": "No incluye Comunicaciones internas"
      }
    },
    starter: {
      name: "Starter",
      description: "Ideal para microempresas y artesanos en crecimiento",
      features: {
        "0": "Hasta 10 usuarios incluidos",
        "1": "Proyectos y partes ilimitados",
        "2": "Seguimiento completo de horas y gastos",
        "3": "Exportaciones básicas en PDF/Excel",
        "4": "Aplicación móvil PWA + Web",
        "5": "No incluye Foto/Firma en parte",
        "6": "No incluye Comunicaciones internas"
      }
    },
    business: {
      name: "Business",
      description: "El corazón de Jobs-Report para PYMEs estructuradas",
      features: {
        "0": "Hasta 50 usuarios incluidos",
        "1": "Todo lo presente en Starter",
        "2": "Incluye Foto y Firma en parte",
        "3": "Incluye Comunicaciones internas",
        "4": "AI insights e informes automáticos",
        "5": "Análisis avanzado de costes e ingresos"
      }
    },
    growth: {
      name: "Growth",
      description: "Para empresas estructuradas que necesitan un control total",
      features: {
        "0": "Hasta 150 usuarios incluidos",
        "1": "Todo lo presente en Business",
        "2": "Incluye Foto y Firma en parte",
        "3": "Incluye Comunicaciones internas",
        "4": "Roles avanzados (Admin / Supervisor / Worker)",
        "5": "Analítica de rendimiento en obra"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "Solución personalizada para un crecimiento sin límites",
      features: {
        "0": "Usuarios ilimitados",
        "1": "Personalización avanzada",
        "2": "Calendario",
        "3": "Avance de los trabajos",
        "4": "Acceso API (Próxima versión)",
        "5": "Single Sign-On (SSO / SAML)",
        "6": "Opción White-Label (su logo y dominio)"
      }
    }
  }
} as const;
