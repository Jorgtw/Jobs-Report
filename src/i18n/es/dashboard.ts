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
  portalError: "No se pudo abrir el Customer Portal. Verifica que tienes una suscripción activa.",
  managePlan: "Gestión del Plan",
  commercialOverrideNotice: "El plan de esta empresa es gestionado directamente por la administración. Para modificarlo, contacta con soporte.",
  onlineManagementUnavailable: "La gestión online de la suscripción no está disponible para esta cuenta. Contacta con soporte.",
  contactSupport: "Contactar con soporte",
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
    monthly: 'Mensual',
    annually: 'Anual',
    billedAnnually: 'Facturado anualmente',
    twoMonthsFree: '-17%',
    teamTitle: 'Elija el plan adecuado para su equipo',
    complianceTitle: 'Informes y Firmas',
    complianceDesc: 'Todas las funciones operativas están incluidas en cada plan.',
    genericTitle: 'Elija el plan adecuado para su equipo',
    genericDesc: 'Todas las funciones operativas están incluidas en cada plan. Elija según el tamaño de su equipo.',
    loadingPlans: 'Cargando planes...',
    recommended: 'Recomendado',
    perMonth: '/mes',
    activateNow: 'Activar Ahora',
    securePayments: 'Pagos seguros a través de Stripe',
    footerSupport: 'JobsReport Professional Edition • Soporte 24/7',
    checkoutError: 'Ocurrió un error al abrir el pago. Por favor, inténtelo de nuevo más tarde.',
    communicationsDesc: 'Todas las funciones operativas están incluidas en cada plan.'
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
  freeSupportBanner: {
    title: "Apoya a Jobs-Report",
    description: "Todas las funciones siguen estando disponibles de forma gratuita para hasta 5 usuarios. Si Jobs-Report te resulta útil, pasar a Starter apoya el desarrollo de la aplicación y te permite utilizar hasta 10 usuarios.",
    button: "Pasar a Starter"
  },
  plans: {
    free: {
      name: "Free",
      description: "Ideal para microequipos y profesionales independientes",
      features: {
        "0": "Hasta 5 usuarios incluidos",
        "1": "Todas las funciones operativas incluidas",
        "2": "Proyectos y partes ilimitados",
        "3": "Partes de Trabajo con Foto y Firma",
        "4": "Comunicaciones internas",
        "5": "Exportaciones PDF y Excel"
      }
    },
    starter: {
      name: "Starter",
      description: "Ideal para pequeñas empresas y equipos de hasta 10 personas",
      features: {
        "0": "Hasta 10 usuarios incluidos",
        "1": "Todas las funciones operativas incluidas",
        "2": "Proyectos y partes ilimitados",
        "3": "Partes de Trabajo con Foto y Firma",
        "4": "Comunicaciones internas",
        "5": "Exportaciones PDF y Excel"
      }
    },
    business: {
      name: "Business",
      description: "La solución perfecta para PYMEs y empresas estructuradas de hasta 50 personas",
      features: {
        "0": "Hasta 50 usuarios incluidos",
        "1": "Todas las funciones operativas incluidas",
        "2": "Proyectos y partes ilimitados",
        "3": "Partes de Trabajo con Foto y Firma",
        "4": "Comunicaciones internas",
        "5": "Exportaciones PDF y Excel"
      }
    },
    growth: {
      name: "Growth",
      description: "Para empresas en rápida expansión de hasta 150 personas",
      features: {
        "0": "Hasta 150 usuarios incluidos",
        "1": "Todas las funciones operativas incluidas",
        "2": "Proyectos y partes ilimitados",
        "3": "Partes de Trabajo con Foto e Firma",
        "4": "Comunicaciones internas",
        "5": "Exportaciones PDF y Excel"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "Solución personalizada para grandes organizaciones de más de 150 personas",
      features: {
        "0": "Más de 150 usuarios (ilimitados)",
        "1": "Todas las funciones operativas incluidas",
        "2": "Proyectos y partes ilimitados",
        "3": "Soporte prioritario y onboarding dedicado",
        "4": "Personalizaciones bajo petición"
      }
    }
  }
} as const;
