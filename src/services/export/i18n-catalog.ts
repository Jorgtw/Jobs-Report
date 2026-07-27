export interface CatalogTranslations {
  // Sheet names
  sheetDashboard: string;
  sheetExtCosts: string;
  sheetCustomerWork: string;
  sheetWeekly: string;
  sheetMonthly: string;
  sheetBilling: string;
  sheetEntries: string;
  sheetRevenue: string;

  // Common prefixes & labels
  periodPrefix: string;
  allPeriod: string;
  companyPrefix: string;
  generatedPrefix: string;
  clientPrefix: string;
  projectPrefix: string;
  workerPrefix: string;
  workerPrefixReport: string;
  monthPrefix: string;
  allClients: string;
  multipleClients: string;
  allWorkers: string;
  allMonths: string;
  allProjects: string;
  unspecifiedClient: string;
  unknownProject: string;
  unspecifiedWorker: string;
  genericIntervention: string;
  internalUseOnly: string;
  noAccessories: string;
  periodUndefined: string;

  // DashboardCommesse (Sheet 1)
  dashTitle: string;
  dashHeaders: string[]; // 9 cols
  dashTotal: string;
  dashNote: string; // use {extSheet} placeholder
  dashWarning: string;

  // Costi Esterni (Sheet 2)
  extTitle: string;
  extSubtitle: string;
  extHeaders: string[]; // 6 cols
  extTotal: string;

  // CustomerWorkReport (Sheet 3)
  custTitle: string;
  custHeaders: string[]; // 7 cols
  custProjTotalPrefix: string;
  custGrandTotal: string;

  // WeeklyReport (Sheet 4)
  weekTitle: string;
  weekNumberPrefix: string;
  weekHeaders: string[]; // 4 cols
  weekTotalPrefix: string;
  weekGrandTotalPrefix: string;
  weekPeriodTotal: string;

  // EmployeeMonthlyReport (Sheet 5)
  monthTitle: string;
  monthHeaders: string[]; // 6 cols
  monthTotalPrefix: string;
  monthGrandTotal: string;
  signEmployee: string;
  signManager: string;
  signDate: string;

  // BillingAttachment (Sheet 6)
  billingTitle: string;
  billingHeaders: string[]; // 6 cols
  billingTotal: string;
  billingNote: string;

  // WorkEntriesRegister (Sheet 7)
  entriesTitle: string;
  entriesHeaders: string[]; // 22 cols

  // ProjectRevenueRegister (Sheet 8)
  revTitle: string;
  revSubtitle: string;
  revHeaders: string[]; // 6 cols
  revMethodFixed: string;
  revMethodHourly: string;
  revStatusActive: string;
}

const catalogs: Record<string, CatalogTranslations> = {
  it: {
    sheetDashboard: 'Dashboard',
    sheetExtCosts: 'Costi Esterni',
    sheetCustomerWork: 'Rapporto Lavori',
    sheetWeekly: 'Report Settimanale',
    sheetMonthly: 'Report Mensile',
    sheetBilling: 'Allegato Fatturazione',
    sheetEntries: 'Registro Rapportini',
    sheetRevenue: 'Registro Ricavi',

    periodPrefix: 'Periodo: ',
    allPeriod: 'Tutto il periodo',
    companyPrefix: 'Azienda: ',
    generatedPrefix: 'Generato il: ',
    clientPrefix: 'Cliente: ',
    projectPrefix: 'Progetto: ',
    workerPrefix: 'Collaboratore: ',
    workerPrefixReport: 'Dipendente: ',
    monthPrefix: 'Mese: ',
    allClients: 'Tutti i Clienti',
    multipleClients: 'Multipli',
    allWorkers: 'Tutti i Collaboratori',
    allMonths: 'Tutti i Mesi',
    allProjects: 'Tutti i progetti',
    unspecifiedClient: 'Cliente non specificato',
    unknownProject: 'Progetto Sconosciuto',
    unspecifiedWorker: 'Non specificato',
    genericIntervention: 'Intervento generico',
    internalUseOnly: 'USO INTERNO AMMINISTRAZIONE — Non da inviare al cliente',
    noAccessories: 'Nessuna spesa accessoria registrata in questo periodo.',
    periodUndefined: 'Periodo non definito',

    dashTitle: 'DASHBOARD COMMESSE — Vista Titolare',
    dashHeaders: ['Cliente', 'Progetto', 'Ore interne', 'Costo personale', 'Subappalti', 'Spese', 'Ricavo', 'Margine', 'Margine %'],
    dashTotal: 'TOTALE COMMESSE',
    dashNote: "Margine = Ricavo - Costo personale - Subappalti - Spese. Subappalti collegati in automatico al foglio '{extSheet}' (SUMIFS per Cliente + Progetto). Documento ad uso interno: non destinato al cliente.",
    dashWarning: '\nATTENZIONE: Margine calcolato senza costo personale per alcune commesse (costo interno non disponibile).',

    extTitle: 'COSTI ESTERNI / SUBAPPALTI',
    extSubtitle: 'Registro costi di terzi (subappaltatori, tecnici esterni, artigiani) — non tracciati a ore',
    extHeaders: ['Data', 'Fornitore / Subappaltatore', 'Cliente', 'Progetto / Commessa', 'Descrizione', 'Importo'],
    extTotal: 'TOTALE COSTI ESTERNI',

    custTitle: 'RAPPORTO LAVORI SVOLTI',
    custHeaders: ['Data', 'Operatore', 'Attività', 'Ore', 'Inizio', 'Fine', 'Pausa'],
    custProjTotalPrefix: 'Totale ore — ',
    custGrandTotal: 'TOTALE ORE PERIODO',

    weekTitle: 'REPORT SETTIMANALE',
    weekNumberPrefix: 'Settimana ',
    weekHeaders: ['Cliente', 'Progetto', 'Interventi', 'Ore'],
    weekTotalPrefix: 'Totale — Settimana ',
    weekGrandTotalPrefix: 'TOTALE COMPLESSIVO CONTRIBUTO COLLEGATO A ',
    weekPeriodTotal: 'TOTALE PERIODO',

    monthTitle: 'REPORT MENSILE DIPENDENTE',
    monthHeaders: ['Data', 'Cliente', 'Progetto / Attività', 'Ore ord.', 'Straord.', 'Spese sostenute'],
    monthTotalPrefix: 'TOTALE MESE ',
    monthGrandTotal: 'TOTALE MESE',
    signEmployee: 'Firma dipendente: ___________________________',
    signManager: 'Firma responsabile: ___________________________',
    signDate: 'Data: ____________________',

    billingTitle: 'ALLEGATO DI FATTURAZIONE',
    billingHeaders: ['Data', 'Operatore', 'Descrizione intervento', 'Ore', 'Materiali', 'Importo'],
    billingTotal: 'TOTALE DA FATTURARE',
    billingNote: 'Documento a supporto della fattura n. ________ — non sostituisce la fattura fiscale',

    entriesTitle: 'REGISTRO RAPPORTINI (WORK ENTRIES REGISTER)',
    entriesHeaders: [
      'Rif. Rapportino', 'Data', 'Settimana (ISO)', 'Ora Inizio', 'Ora Fine', 'Ore Pausa', 'Ore Totali',
      'Ore Ordinarie', 'Straordinario', 'Notturne', 'Festive', 'Cliente', 'Progetto/Commessa',
      'Descrizione Attività', 'Tipo Attività', 'Dipendente', 'Colleghi Aggiuntivi', 'Km Percorsi',
      'Spese', 'Dettaglio Spese', 'Stato', 'Note'
    ],

    revTitle: 'REGISTRO RICAVI / COMMESSE (PROJECT REVENUE REGISTER)',
    revSubtitle: 'USO INTERNO AMMINISTRAZIONE — Non da inviare al cliente | Sorgente dati per Dashboard Commesse',
    revHeaders: ['Cliente', 'Progetto / Commessa', 'Metodo Fatturazione', 'Valore Concordato / Ricavo', 'Periodo', 'Stato Commessa'],
    revMethodFixed: 'Forfait (Fixed)',
    revMethodHourly: 'A consuntivo (Hourly)',
    revStatusActive: 'Attivo'
  },
  da: {
    sheetDashboard: 'Dashboard',
    sheetExtCosts: 'Eksterne Omkostninger',
    sheetCustomerWork: 'Arbejdsrapport',
    sheetWeekly: 'Ugerapport',
    sheetMonthly: 'Månedlig Rapport',
    sheetBilling: 'Faktureringsbilag',
    sheetEntries: 'Arbejdsrapporter',
    sheetRevenue: 'Indtægtsregister',

    periodPrefix: 'Periode: ',
    allPeriod: 'Hele perioden',
    companyPrefix: 'Virksomhed: ',
    generatedPrefix: 'Genereret den: ',
    clientPrefix: 'Klient: ',
    projectPrefix: 'Projekt: ',
    workerPrefix: 'Medarbejder: ',
    workerPrefixReport: 'Medarbejder: ',
    monthPrefix: 'Måned: ',
    allClients: 'Alle klienter',
    multipleClients: 'Flere',
    allWorkers: 'Alle medarbejdere',
    allMonths: 'Alle måneder',
    allProjects: 'Alle projekter',
    unspecifiedClient: 'Uspecificeret klient',
    unknownProject: 'Ukendt projekt',
    unspecifiedWorker: 'Ikke angivet',
    genericIntervention: 'Generel opgave',
    internalUseOnly: 'INTERNT BRUG — Sendes ikke til kunden',
    noAccessories: 'Ingen ekstra udgifter registreret i denne periode.',
    periodUndefined: 'Udefineret periode',

    dashTitle: 'PROJEKTOVERSIGT — Ejer Visning',
    dashHeaders: ['Klient', 'Projekt', 'Interne timer', 'Personaleomkostninger', 'Underleverandører', 'Udgifter', 'Indtægt', 'Margin', 'Margin %'],
    dashTotal: 'PROJEKTER I ALT',
    dashNote: 'Margin = Indtægt - Personaleomkostninger - Underleverandører - Udgifter. Underleverandører linkes automatisk til fanebladet "{extSheet}" (SUMIFS pr. Klient + Projekt). Internt dokument: ikke til kunden.',
    dashWarning: '\nBEMÆRK: Margin beregnet uden personaleomkostninger for visse projekter (intern omkostning ikke tilgængelig).',

    extTitle: 'EKSTERNE OMKOSTNINGER / UNDERLEVERANDØRER',
    extSubtitle: 'Register over tredjepartsomkostninger (underleverandører, eksterne teknikere, håndværkere) — ikke sporet i timer',
    extHeaders: ['Dato', 'Leverandør / Underleverandør', 'Klient', 'Projekt', 'Beskrivelse', 'Beløb'],
    extTotal: 'EKSTERNE OMKOSTNINGER I ALT',

    custTitle: 'UDFØRT ARBEJDSRAPPORT',
    custHeaders: ['Dato', 'Medarbejder', 'Aktivitet', 'Timer', 'Start', 'Slut', 'Pause'],
    custProjTotalPrefix: 'Samlede timer — ',
    custGrandTotal: 'PERIODENS TIMER I ALT',

    weekTitle: 'UGERAPPORT',
    weekNumberPrefix: 'Uge ',
    weekHeaders: ['Klient', 'Projekt', 'Opgaver', 'Timer'],
    weekTotalPrefix: 'Total — Uge ',
    weekGrandTotalPrefix: 'SAMLET BIDRAG FOR ',
    weekPeriodTotal: 'PERIODETOTAL',

    monthTitle: 'MÅNEDLIG MEDARBEJDERRAPPORT',
    monthHeaders: ['Dato', 'Klient', 'Projekt / Aktivitet', 'Alm. timer', 'Overtid', 'Afholdte udgifter'],
    monthTotalPrefix: 'MÅNEDSTOTAL ',
    monthGrandTotal: 'MÅNEDSTOTAL',
    signEmployee: 'Underskrift medarbejder: ___________________________',
    signManager: 'Underskrift leder: ___________________________',
    signDate: 'Dato: ____________________',

    billingTitle: 'FAKTURERINGSBILAG',
    billingHeaders: ['Dato', 'Medarbejder', 'Opgavebeskrivelse', 'Timer', 'Materialer', 'Beløb'],
    billingTotal: 'SAMLET BELØB TIL FAKTURERING',
    billingNote: 'Dokument til støtte for faktura nr. ________ — erstatter ikke selve skattefakturaen',

    entriesTitle: 'ARBEJDSRAPPORTER REGISTER',
    entriesHeaders: [
      'Rapporteringsref.', 'Dato', 'Uge (ISO)', 'Starttid', 'Sluttid', 'Pause (timer)', 'Timer i alt',
      'Alm. timer', 'Overtid', 'Nattekørsel', 'Helligdag', 'Klient', 'Projekt',
      'Aktivitetsbeskrivelse', 'Aktivitetstype', 'Medarbejder', 'Yderligere kolleger', 'Kørte km',
      'Udgifter', 'Udgiftsdetaljer', 'Status', 'Noter'
    ],

    revTitle: 'INDTÆGTER / PROJEKTREGISTER',
    revSubtitle: 'INTERNT BRUG AMMINISTRATION — Sendes ikke til kunden | Datakilde for Projektoversigt',
    revHeaders: ['Klient', 'Projekt', 'Faktureringsmetode', 'Aftalt værdi / Indtægt', 'Periode', 'Projektstatus'],
    revMethodFixed: 'Fast pris (Fixed)',
    revMethodHourly: 'Efter regning (Hourly)',
    revStatusActive: 'Aktiv'
  },
  en: {
    sheetDashboard: 'Dashboard',
    sheetExtCosts: 'External Costs',
    sheetCustomerWork: 'Work Report',
    sheetWeekly: 'Weekly Report',
    sheetMonthly: 'Monthly Report',
    sheetBilling: 'Billing Attachment',
    sheetEntries: 'Work Entries',
    sheetRevenue: 'Revenue Register',

    periodPrefix: 'Period: ',
    allPeriod: 'All time',
    companyPrefix: 'Company: ',
    generatedPrefix: 'Generated on: ',
    clientPrefix: 'Client: ',
    projectPrefix: 'Project: ',
    workerPrefix: 'Worker: ',
    workerPrefixReport: 'Employee: ',
    monthPrefix: 'Month: ',
    allClients: 'All Clients',
    multipleClients: 'Multiple',
    allWorkers: 'All Workers',
    allMonths: 'All Months',
    allProjects: 'All Projects',
    unspecifiedClient: 'Unspecified Client',
    unknownProject: 'Unknown Project',
    unspecifiedWorker: 'Not specified',
    genericIntervention: 'Generic work',
    internalUseOnly: 'INTERNAL USE ONLY — Not to be sent to client',
    noAccessories: 'No accessory expenses recorded in this period.',
    periodUndefined: 'Undefined period',

    dashTitle: 'PROJECT DASHBOARD — Owner View',
    dashHeaders: ['Client', 'Project', 'Internal Hours', 'Personnel Cost', 'Subcontractors', 'Expenses', 'Revenue', 'Margin', 'Margin %'],
    dashTotal: 'TOTAL PROJECTS',
    dashNote: 'Margin = Revenue - Personnel cost - Subcontractors - Expenses. Subcontractors automatically linked to sheet "{extSheet}" (SUMIFS by Client + Project). Internal document: not for client.',
    dashWarning: '\nWARNING: Margin calculated without personnel cost for some projects (internal cost not available).',

    extTitle: 'EXTERNAL COSTS / SUBCONTRACTORS',
    extSubtitle: 'Register of third-party costs (subcontractors, external technicians, artisans) — not tracked by hours',
    extHeaders: ['Date', 'Supplier / Subcontractor', 'Client', 'Project / Job', 'Description', 'Amount'],
    extTotal: 'TOTAL EXTERNAL COSTS',

    custTitle: 'PERFORMED WORK REPORT',
    custHeaders: ['Date', 'Operator', 'Activity', 'Hours', 'Start', 'End', 'Break'],
    custProjTotalPrefix: 'Total hours — ',
    custGrandTotal: 'TOTAL HOURS PERIOD',

    weekTitle: 'WEEKLY REPORT',
    weekNumberPrefix: 'Week ',
    weekHeaders: ['Client', 'Project', 'Interventions', 'Hours'],
    weekTotalPrefix: 'Total — Week ',
    weekGrandTotalPrefix: 'TOTAL CONTRIBUTION FOR ',
    weekPeriodTotal: 'TOTAL PERIOD',

    monthTitle: 'EMPLOYEE MONTHLY REPORT',
    monthHeaders: ['Date', 'Client', 'Project / Activity', 'Ord. hours', 'Overtime', 'Expenses incurred'],
    monthTotalPrefix: 'MONTH TOTAL ',
    monthGrandTotal: 'MONTH TOTAL',
    signEmployee: 'Employee signature: ___________________________',
    signManager: 'Manager signature: ___________________________',
    signDate: 'Date: ____________________',

    billingTitle: 'BILLING ATTACHMENT',
    billingHeaders: ['Date', 'Operator', 'Work Description', 'Hours', 'Materials', 'Amount'],
    billingTotal: 'GRAND TOTAL TO BE BILLED',
    billingNote: 'Document supporting invoice no. ________ — does not replace the official tax invoice',

    entriesTitle: 'WORK ENTRIES REGISTER',
    entriesHeaders: [
      'Report Ref.', 'Date', 'Week (ISO)', 'Start Time', 'End Time', 'Break Hours', 'Total Hours',
      'Ordinary Hours', 'Overtime', 'Night Hours', 'Holiday Hours', 'Client', 'Project/Job',
      'Activity Description', 'Activity Type', 'Employee', 'Additional Colleagues', 'Km Traveled',
      'Expenses', 'Expense Details', 'Status', 'Notes'
    ],

    revTitle: 'PROJECT REVENUE REGISTER',
    revSubtitle: 'INTERNAL USE ADMINISTRATION — Not to be sent to client | Data source for Project Dashboard',
    revHeaders: ['Client', 'Project / Job', 'Billing Method', 'Agreed Value / Revenue', 'Period', 'Project Status'],
    revMethodFixed: 'Fixed Price',
    revMethodHourly: 'Time & Material (Hourly)',
    revStatusActive: 'Active'
  },
  es: {
    sheetDashboard: 'Dashboard',
    sheetExtCosts: 'Costes Externos',
    sheetCustomerWork: 'Parte de Trabajo',
    sheetWeekly: 'Informe Semanal',
    sheetMonthly: 'Informe Mensual',
    sheetBilling: 'Anexo Facturación',
    sheetEntries: 'Registro Partes',
    sheetRevenue: 'Registro Ingresos',

    periodPrefix: 'Periodo: ',
    allPeriod: 'Todo el periodo',
    companyPrefix: 'Empresa: ',
    generatedPrefix: 'Generado el: ',
    clientPrefix: 'Cliente: ',
    projectPrefix: 'Proyecto: ',
    workerPrefix: 'Trabajador: ',
    workerPrefixReport: 'Empleado: ',
    monthPrefix: 'Mes: ',
    allClients: 'Todos los clientes',
    multipleClients: 'Múltiples',
    allWorkers: 'Todos los trabajadores',
    allMonths: 'Todos los meses',
    allProjects: 'Todos los proyectos',
    unspecifiedClient: 'Cliente no especificado',
    unknownProject: 'Proyecto desconocido',
    unspecifiedWorker: 'No especificado',
    genericIntervention: 'Intervención general',
    internalUseOnly: 'USO INTERNO ADMINISTRACIÓN — No enviar al cliente',
    noAccessories: 'Sin gastos accesorios registrados en este periodo.',
    periodUndefined: 'Periodo no definido',

    dashTitle: 'PANEL DE PROYECTOS — Vista Propietario',
    dashHeaders: ['Cliente', 'Proyecto', 'Horas Internas', 'Coste Personal', 'Subcontratas', 'Gastos', 'Ingreso', 'Margen', 'Margen %'],
    dashTotal: 'TOTAL PROYECTOS',
    dashNote: 'Margen = Ingreso - Coste personal - Subcontratas - Gastos. Subcontratas vinculadas automáticamente a la hoja "{extSheet}" (SUMIFS por Cliente + Proyecto). Documento interno: no para el cliente.',
    dashWarning: '\nATENCIÓN: Margen calculado sin coste personal para algunos proyectos (coste interno no disponible).',

    extTitle: 'COSTES EXTERNOS / SUBCONTRATAS',
    extSubtitle: 'Registro de costes de terceros (subcontratistas, técnicos externos, artesanos) — no rastreados por horas',
    extHeaders: ['Fecha', 'Proveedor / Subcontratista', 'Cliente', 'Proyecto', 'Descripción', 'Importe'],
    extTotal: 'TOTAL COSTES EXTERNOS',

    custTitle: 'PARTE DE TRABAJO REALIZADO',
    custHeaders: ['Fecha', 'Trabajador', 'Actividad', 'Horas', 'Inicio', 'Fin', 'Pausa'],
    custProjTotalPrefix: 'Total horas — ',
    custGrandTotal: 'TOTAL HORAS PERIODO',

    weekTitle: 'INFORME SEMANAL',
    weekNumberPrefix: 'Semana ',
    weekHeaders: ['Cliente', 'Proyecto', 'Intervenciones', 'Horas'],
    weekTotalPrefix: 'Total — Semana ',
    weekGrandTotalPrefix: 'CONTRIBUCIÓN TOTAL DE ',
    weekPeriodTotal: 'TOTAL PERIODO',

    monthTitle: 'INFORME MENSUAL DEL TRABAJADOR',
    monthHeaders: ['Fecha', 'Cliente', 'Proyecto / Actividad', 'Horas ord.', 'Horas ext.', 'Gastos incurridos'],
    monthTotalPrefix: 'TOTAL MES ',
    monthGrandTotal: 'TOTAL MES',
    signEmployee: 'Firma trabajador: ___________________________',
    signManager: 'Firma responsable: ___________________________',
    signDate: 'Fecha: ____________________',

    billingTitle: 'ANEXO DE FACTURACIÓN',
    billingHeaders: ['Fecha', 'Trabajador / Técnico', 'Descripción de la intervención', 'Horas', 'Materiales', 'Importe'],
    billingTotal: 'TOTAL IMPORTE A FACTURAR',
    billingNote: 'Documento de soporte para la factura n. ________ — no reemplaza la factura fiscal',

    entriesTitle: 'REGISTRO DE PARTES DE TRABAJO',
    entriesHeaders: [
      'Ref. Parte', 'Fecha', 'Semana (ISO)', 'Hora Inicio', 'Hora Fin', 'Horas Pausa', 'Horas Totales',
      'Horas Ordinarie', 'Horas Ext.', 'Horas Nocturnas', 'Horas Festivas', 'Cliente', 'Proyecto/Obra',
      'Descripción Actividad', 'Tipo Actividad', 'Trabajador', 'Compañeros Adicionales', 'Km Recorridos',
      'Gastos', 'Detalle Gastos', 'Estado', 'Notas'
    ],

    revTitle: 'REGISTRO DE INGRESOS / PROYECTOS',
    revSubtitle: 'USO INTERNO ADMINISTRACIÓN — No enviar al cliente | Fuente de datos para Panel de Proyectos',
    revHeaders: ['Cliente', 'Proyecto / Obra', 'Método Facturación', 'Valor Acordado / Ingreso', 'Periodo', 'Estado Proyecto'],
    revMethodFixed: 'Precio Fijo (Fixed)',
    revMethodHourly: 'Por Administración (Hourly)',
    revStatusActive: 'Activo'
  },
  pl: {
    sheetDashboard: 'Pulpit',
    sheetExtCosts: 'Koszty Zewnętrzne',
    sheetCustomerWork: 'Raport Pracy',
    sheetWeekly: 'Raport Tygodniowy',
    sheetMonthly: 'Raport Miesięczny',
    sheetBilling: 'Załącznik Faktury',
    sheetEntries: 'Rejestr Raportów',
    sheetRevenue: 'Rejestr Przychodu',

    periodPrefix: 'Okres: ',
    allPeriod: 'Cały okres',
    companyPrefix: 'Firma: ',
    generatedPrefix: 'Wygenerowano: ',
    clientPrefix: 'Klient: ',
    projectPrefix: 'Projekt: ',
    workerPrefix: 'Pracownik: ',
    workerPrefixReport: 'Pracownik: ',
    monthPrefix: 'Miesiąc: ',
    allClients: 'Wszyscy klienci',
    multipleClients: 'Wielu',
    allWorkers: 'Wszyscy pracownicy',
    allMonths: 'Wszystkie miesiące',
    allProjects: 'Wszystkie projekty',
    unspecifiedClient: 'Nieokreślony klient',
    unknownProject: 'Nieznany projekt',
    unspecifiedWorker: 'Nie określono',
    genericIntervention: 'Praca ogólna',
    internalUseOnly: 'TYLKO DO UŻYTKU WEWNĘTRZNEGO — Nie wysyłać do klienta',
    noAccessories: 'Brak zarejestrowanych wydatków w tym okresie.',
    periodUndefined: 'Okres nieokreślony',

    dashTitle: 'PULPIT PROJEKTÓW — Widok Właściciela',
    dashHeaders: ['Klient', 'Projekt', 'Godziny wewnętrzne', 'Koszt personelu', 'Podwykonawcy', 'Wydatki', 'Przychód', 'Marża', 'Marża %'],
    dashTotal: 'RAZEM PROJEKTY',
    dashNote: 'Marża = Przychód - Koszt personelu - Podwykonawcy - Wydatki. Podwykonawcy automatycznie powiązani z arkuszem "{extSheet}" (SUMIFS dla Klient + Projekt). Dokument wewnętrzny: nie dla klienta.',
    dashWarning: '\nUWAGA: Marża obliczona bez kosztów personelu dla niektórych projektów (koszt wewnętrzny niedostępny).',

    extTitle: 'KOSZTY ZEWNĘTRZNE / PODWYKONAWCY',
    extSubtitle: 'Rejestr kosztów podmiotów trzecich (podwykonawcy, technicy zewnętrzni, rzemieślnicy) — nieśledzone godzinowo',
    extHeaders: ['Data', 'Dostawca / Podwykonawca', 'Klient', 'Projekt', 'Opis', 'Kwota'],
    extTotal: 'RAZEM KOSZTY ZEWNĘTRZNE',

    custTitle: 'RAPPORT WYKONANYCH PRAC',
    custHeaders: ['Data', 'Pracownik', 'Czynność', 'Godziny', 'Start', 'Koniec', 'Przerwa'],
    custProjTotalPrefix: 'Suma godzin — ',
    custGrandTotal: 'SUMA GODZIN OKRESU',

    weekTitle: 'RAPORT TYGODNIOWY',
    weekNumberPrefix: 'Tydzień ',
    weekHeaders: ['Klient', 'Projekt', 'Zadania', 'Godziny'],
    weekTotalPrefix: 'Suma — Tydzień ',
    weekGrandTotalPrefix: 'CAŁKOWITY WKŁAD DLA ',
    weekPeriodTotal: 'SUMA OKRESU',

    monthTitle: 'MIESIĘCZNY RAPORT PRACOWNIKA',
    monthHeaders: ['Data', 'Klient', 'Projekt / Czynność', 'Godz. zwykłe', 'Nadgodziny', 'Poniesione wydatki'],
    monthTotalPrefix: 'SUMA MIESIĄCA ',
    monthGrandTotal: 'SUMA MIESIĄCA',
    signEmployee: 'Podpis pracownika: ___________________________',
    signManager: 'Podpis przełożonego: ___________________________',
    signDate: 'Data: ____________________',

    billingTitle: 'ZAŁĄCZNIK DO FAKTURY',
    billingHeaders: ['Data', 'Pracownik', 'Opis pracy', 'Godziny', 'Materiały', 'Kwota'],
    billingTotal: 'CAŁKOWITA KWOTA DO FAKTUROWANIA',
    billingNote: 'Dokument potwierdzający do faktury nr ________ — nie zastępuje oficjalnej faktury podatkowej',

    entriesTitle: 'REJESTR RAPORTÓW PRACY',
    entriesHeaders: [
      'Ref. Raportu', 'Data', 'Tydzień (ISO)', 'Czas Start', 'Czas Koniec', 'Godz. Przerwy', 'Godziny Razem',
      'Godz. Zwykłe', 'Nadgodziny', 'Godz. Nocne', 'Godz. Świąteczne', 'Klient', 'Projekt/Zlecenie',
      'Opis Czynności', 'Typ Czynności', 'Pracownik', 'Dodatkowi Koledzy', 'Przebieg Km',
      'Wydatki', 'Szczegóły Wydatków', 'Status', 'Uwagi'
    ],

    revTitle: 'REJESTR PRZYCHODÓW / PROJEKTÓW',
    revSubtitle: 'TYLKO DO UŻYTKU WEWNĘTRZNEGO — Nie wysyłać do klienta | Źródło danych dla Pulpitu Projektów',
    revHeaders: ['Klient', 'Projekt / Zlecenie', 'Metoda Rozliczenia', 'Uzgodniona Wartość / Przychód', 'Okres', 'Status Projektu'],
    revMethodFixed: 'Ryczałt (Fixed)',
    revMethodHourly: 'Wg stawek (Hourly)',
    revStatusActive: 'Aktywny'
  },
  tr: {
    sheetDashboard: 'Kontrol Paneli',
    sheetExtCosts: 'Dış Maliyetler',
    sheetCustomerWork: 'İş Raporu',
    sheetWeekly: 'Haftalık Rapor',
    sheetMonthly: 'Aylık Rapor',
    sheetBilling: 'Fatura Eki',
    sheetEntries: 'Rapor Kayıtları',
    sheetRevenue: 'Gelir Kaydı',

    periodPrefix: 'Dönem: ',
    allPeriod: 'Tüm dönem',
    companyPrefix: 'Şirket: ',
    generatedPrefix: 'Oluşturulma tarihi: ',
    clientPrefix: 'Müşteri: ',
    projectPrefix: 'Proje: ',
    workerPrefix: 'Çalışan: ',
    workerPrefixReport: 'Çalışan: ',
    monthPrefix: 'Ay: ',
    allClients: 'Tüm Müşteriler',
    multipleClients: 'Birden Çok',
    allWorkers: 'Tüm Çalışanlar',
    allMonths: 'Tüm Aylar',
    allProjects: 'Tüm Projeler',
    unspecifiedClient: 'Belirtilmemiş Müşteri',
    unknownProject: 'Bilinmeyen Proje',
    unspecifiedWorker: 'Belirtilmemiş',
    genericIntervention: 'Genel müdahale',
    internalUseOnly: 'YALNIZCA İÇ KULLANIM — Müşteriye gönderilmez',
    noAccessories: 'Bu dönemde kayda değer ek gider bulunamadı.',
    periodUndefined: 'Belirsiz dönem',

    dashTitle: 'PROJE KONTROL PANELİ — Yönetici Görünümü',
    dashHeaders: ['Müşteri', 'Proje', 'İç Saatler', 'Personel Maliyeti', 'Taşeronlar', 'Giderler', 'Gelir', 'Marj', 'Marj %'],
    dashTotal: 'TOPLAM PROJELER',
    dashNote: 'Marj = Gelir - Personel maliyeti - Taşeronlar - Giderler. Taşeronlar otomatik olarak "{extSheet}" sayfasına bağlanır (Müşteri + Proje bazında SUMIFS). İç doküman: müşteriye özel değildir.',
    dashWarning: '\nUYARI: Bazı projeler için personel maliyeti olmadan hesaplanmış marj (iç maliyet mevcut değil).',

    extTitle: 'DIŞ MALİYETLER / TAŞERONLAR',
    extSubtitle: 'Üçüncü taraf maliyetler kaydı (taşeronlar, dış teknisyenler, zanaatkarlar) — saatlik takip edilmez',
    extHeaders: ['Tarih', 'Tedarikçi / Taşeron', 'Müşteri', 'Proje', 'Açıklama', 'Tutar'],
    extTotal: 'TOPLAM DIŞ MALİYETLER',

    custTitle: 'YAPILAN İŞ RAPORU',
    custHeaders: ['Tarih', 'Çalışan', 'Aktivite', 'Saat', 'Başlangıç', 'Bitiş', 'Mola'],
    custProjTotalPrefix: 'Toplam saat — ',
    custGrandTotal: 'DÖNEM TOPLAM SAATİ',

    weekTitle: 'HAFTALIK RAPOR',
    weekNumberPrefix: 'Hafta ',
    weekHeaders: ['Müşteri', 'Proje', 'Müdahaleler', 'Saat'],
    weekTotalPrefix: 'Toplam — Hafta ',
    weekGrandTotalPrefix: 'TOPLAM KATKI: ',
    weekPeriodTotal: 'DÖNEM TOPLAMI',

    monthTitle: 'AYLIK PERSONEL RAPORU',
    monthHeaders: ['Tarih', 'Müşteri', 'Proje / Aktivite', 'Nor. saat', 'Fazla mesai', 'Yapılan giderler'],
    monthTotalPrefix: 'AY TOPLAMI ',
    monthGrandTotal: 'AY TOPLAMI',
    signEmployee: 'Personel İmzası: ___________________________',
    signManager: 'Yönetici İmzası: ___________________________',
    signDate: 'Tarih: ____________________',

    billingTitle: 'FATURA EKİ',
    billingHeaders: ['Tarih', 'Çalışan / Teknisyen', 'İş Açıklaması', 'Saat', 'Malzemeler', 'Tutar'],
    billingTotal: 'FATURALANDIRILACAK GENEL TOPLAM',
    billingNote: '________ no.lu faturayı destekleyici dokümandır — resmî vergi faturası yerine geçmez',

    entriesTitle: 'RAPOR KAYITLARI SİCİLİ',
    entriesHeaders: [
      'Rapor Ref.', 'Tarih', 'Hafta (ISO)', 'Başlangıç', 'Bitiş', 'Mola Saati', 'Toplam Saat',
      'Normal Saat', 'Fazla Mesai', 'Gece Saati', 'Tatil Saati', 'Müşteri', 'Proje/İş',
      'Aktivite Açıklaması', 'Aktivite Türü', 'Çalışan', 'Ek Çalışma Arkadaşları', 'Gidilen Km',
      'Giderler', 'Gider Detayı', 'Durum', 'Notlar'
    ],

    revTitle: 'GELİRLER / PROJELER KAYDI',
    revSubtitle: 'YALNIZCA İÇ YÖNETİM KULLANIMI — Müşteriye gönderilmez | Proje Kontrol Paneli veri kaynağı',
    revHeaders: ['Müşteri', 'Proje / İş', 'Faturalama Yöntemi', 'Anlaşılan Değer / Gelir', 'Dönem', 'Proje Durumu'],
    revMethodFixed: 'Sabit Fiyat (Fixed)',
    revMethodHourly: 'Saatlik / Gerçekleşen (Hourly)',
    revStatusActive: 'Aktif'
  }
};

export function getCatalogT(lang?: string): CatalogTranslations {
  const normalized = lang ? lang.split('-')[0].toLowerCase() : 'it';
  return catalogs[normalized] || catalogs.it;
}
