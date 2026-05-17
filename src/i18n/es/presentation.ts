export const presentation = {
  sidebar: {
    clienti: "Clientes",
    personale: "Personal",
    progetti: "Proyectos",
    subappalti: "Subcontratas",
    rapportini: "Partes de Trabajo",
    sommario: "Resumen de Obra",
    profilo: "Perfil",
    assistenza: "Asistencia",
    esci: "Salir"
  },
  hero: {
    tag: "El valor de la experiencia",
    title: "Partes de trabajo y control de costes en tiempo real",
    desc: "Creado tras más de 30 años de experiencia directa en el campo: primero como operario y luego como administrador. JobsReport es la herramienta práctica nacida de las necesidades reales de quienes gestionan la obra cada día."
  },
  ui: {
    key_features: "Funcionalidades Clave",
    request_demo: "Solicitar demo gratuita →",
    footer_rights: "Todos los derechos reservados",
    overlay_title: "Bienvenido a JobsReport",
    overlay_sub: "Elige tu idioma para comenzar la presentación"
  },
  sections: {
    clienti: {
      title: "Clientes",
      desc: "Registro esencial para la gestión de tus obras.",
      groups: [
          {
          title: "Datos de Empresa",
          items: [
              {
              name: "Ficha esencial",
              desc: "Nombre, CIF y contactos."
            },
              {
              name: "Estado",
              desc: "Gestión de Activos/Inactivos."
            }
            ]
        }
        ]
    },
    personale: {
      title: "Tu Equipo",
      desc: "Gestión e incorporación de personal interno y externo.",
      groups: [
          {
          title: "Roles e Idioma",
          items: [
              {
              name: "Incorporación",
              desc: "Envía instrucciones de la app en el idioma del trabajador."
            },
              {
              name: "Roles",
              desc: "Operario, Encargado o Administrador."
            }
            ]
        }
        ]
    },
    progetti: {
      title: "Proyectos",
      desc: "Configuración y seguimiento de obras y actividades internas.",
      groups: [
          {
          title: "Tipologia",
          items: [
              {
              name: "Clientes vs Interno",
              desc: "Gestión de pedidos externos o actividades como Ausencias."
            },
              {
              name: "Presupuesto",
              desc: "Soporte para trabajos por horas o ajuste."
            }
            ]
        }
        ]
    },
    subappalti: {
      title: "Subcontratas",
      desc: "Colabora con empresas externas manteniendo el control total.",
      groups: [
          {
          title: "Socios",
          items: [
              {
              name: "Gestione Empresas",
              desc: "Registro de subcontratistas y contactos."
            },
              {
              name: "Costes Externos",
              desc: "Seguimiento de trabajos por horas o forfait."
            }
            ]
        }
        ]
    },
    rapportini: {
      title: "Partes de Trabajo",
      desc: "Reporte diario rápido, preciso y profesional.",
      groups: [
          {
          title: "Ejecución",
          items: [
              {
              name: "Tiempo Real",
              desc: "Seguimiento preciso Inicio/Fin o horas directas."
            },
              {
              name: "Gastos",
              desc: "Entrada de comidas, materiales y parking."
            }
            ]
        },
          {
          title: "Gestión",
          items: [
              {
              name: "Capataz",
              desc: "Los encargados pueden meter dati de todo el equipo."
            }
            ]
        }
        ]
    },
    sommario: {
      title: "Análisis Económico",
      desc: "Resumen de Obra: el corazón del control de márgenes.",
      groups: [
          {
          title: "Análisis",
          items: [
              {
              name: "Tiempo Real",
              desc: "Márgenes netos y costes calculados al instante."
            },
              {
              name: "Filtros y Export",
              desc: "Filtra y descarga datos en Excel o PDF."
            }
            ]
        }
        ]
    },
    profilo: {
      title: "Tu Cuenta",
      desc: "Personaliza tu experiencia de trabajo.",
      groups: [
          {
          title: "Account",
          items: [
              {
              name: "Seguridad",
              desc: "Gestión de accesos y preferencias de idioma."
            }
            ]
        }
        ]
    },
    assistenza: {
      title: "Centro de Ayuda",
      desc: "Guías e instrucciones rápidas para el uso óptimo de la app.",
      groups: [
          {
          title: "Guía Rápida",
          items: [
              {
              name: "Instalación",
              desc: "Añade la app a la pantalla de inicio (iPhone: \"Añadir a Inicio\", Android: \"Instalar App\")."
            },
              {
              name: "Filtros",
              desc: "Usa el \"Resumen de Obra\" para controlar márgenes e costes en tiempo real."
            }
            ]
        },
          {
          title: "Soporte",
          items: [
              {
              name: "Admin",
              desc: "Para soporte técnico, contacta directamente con el administrador de sistema."
            }
            ]
        }
        ]
    }
  }
} as const;
