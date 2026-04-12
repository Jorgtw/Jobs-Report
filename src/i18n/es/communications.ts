// src/i18n/es/communications.ts
export const communications = {
  // Menú y Dashboard
  internalCommunications: 'Comunicaciones Internas',
  internalCommunicationsDesc: 'Envía y recibe mensajes de la empresa en tiempo real',
  newCommunication: 'Nueva Comunicación',
  
  // Formulario de Envío
  sendTo: 'Enviar a',
  recipient: 'Destinatario',
  subject: 'Asunto',
  message: 'Mensaje',
  selectUsers: 'Seleccionar colaboradores',
  allUsers: 'Todos los usuarios',
  placeholderSelectUsers: 'Seleccione uno o más usuarios...',
  
  // Tipos y Pestañas
  todo: 'Pendiente',
  sent: 'Enviados',
  inbox: 'Recibidos',
  outbox: 'Enviados',
  archive: 'Archivo',
  thread: 'Conversación',
  messagesTab: 'Mensajes',
  internalCommunication: 'Comunicación Interna',
  
  // Tipos Específicos
  type_note: 'Nota',
  type_issue: 'Incidencia',
  type_confirmation: 'Confirmación',
  
  // Tabla y Detalles
  sender: 'Remitente',
  type: 'Tipo',
  allTeam: 'Todo el Equipo',
  myself: 'Yo mismo',
  recipientLabel: 'Destinatario',
  waitingYourReply: 'esperando tu respuesta',
  waitingOthersReply: 'esperando respuesta de otros',
  actionRequired: 'Acción Requerida',
  note: 'Nota',
  issue: 'Incidencia',
  confirmation: 'Confirmación',
  writeMessage: 'Escriba un mensaje...',
  noThreadSelected: 'Seleccione una conversación para ver los detalles',
  exportHistory: 'Exportar Historial PDF',
  loading: 'Cargando...',
  
  // Acciones
  acknowledge: 'Confirmar Recepción',
  takeInCharge: 'En curso',
  close: 'Cerrar',
  archiveAction: 'Archivar',
  closed: 'Cerrado',
  archiveCommunication: 'Archivar',
  send: 'Enviar',
  
  // Estados y Feedback
  noCommunicationsYet: 'No hay comunicaciones presentes',
  no_workers_available: 'No hay colaboradores disponibles',
  unreadMessages: 'Mensajes no leídos',
  messageSentSuccess: '¡Comunicación enviada con éxito!',
  
  // Estados de Workflow
  status_open: 'Abierto',
  status_acknowledged: 'Recibido',
  status_in_progress: 'En Curso',
  status_closed: 'Cerrado',
  status_archived: 'Archivado',
  status_deleted: 'Eliminado',

  // Paywall y Premium
  premiumFeature: 'Funcionalidad Premium',
  premiumRequiredDesc: 'Esta función solo está disponible para empresas con suscripción Premium.',
  upgradeNow: 'Pasar a Premium',
  unlockFullPotential: 'Desbloquea tutto il potencial de tu empresa',
  lockFeatureTip: 'Las empresas Premium pueden comunicarse con todo el equipo con un clic.',
  
  // Específico del Modal de Mejora
  upgradeTitle: 'Funcionalidad Premium',
  upgradeDesc: 'Esta funcionalidad (Fotos + Firma + PDF Profesional) está reservada para cuentas Premium.',
  upgradeCTA: 'Desbloquear con Donación',
  read_at: 'Leído el',
  thread_closed_msg: 'Esta conversación ha sido cerrada. Archiva para completar el ciclo.',
  thread_archived_msg: 'Conversación archivada.',
  feature_ticket_title: 'Ticket & Thread',
  feature_ticket_desc: 'Gestione conversaciones estructuradas para cada solicitud',
  feature_teamsync_title: 'Team Sync',
  feature_teamsync_desc: 'Envíe alertas a todo el equipo o a proyectos específicos',
  feature_pdf_title: 'Export PDF',
  feature_pdf_desc: 'Descargue los registros de las conversaciones en formato PDF',
  tab_inbox: 'RECIBIDOS',
  tab_working: 'PROCESO',
  tab_waiting: 'ESPERA',
  tab_completed: 'HECHO',
  workingTooltip: 'Mover esta comunicación a en curso',
  forward: 'Reenviar',
  forwardAction: 'Enviar reenvío',
  additionalMessage: 'Mensaje adicional (opcional)'
} as const;
