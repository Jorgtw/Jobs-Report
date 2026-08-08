import { Language } from '../i18n';
import { generateInterventionPDF, exportToPDF, exportToExcel } from './exportService';

// Sample Base64 image for demonstration photo (real canvas JPEG)
const SAMPLE_PHOTO_BASE64 = 'data:image/jpeg;base64,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';

// Sample Base64 SVG/PNG for digital signature
const SAMPLE_SIGNATURE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSU55GGhYAAAABJRU5ErkJggg==';

export interface SampleDataPackage {
  project: {
    id: string;
    name: string;
    clientId: string;
    description: string;
  };
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  companyDetails: {
    name: string;
    address: string;
    taxId: string;
    phone: string;
    email: string;
    logoUrl: string;
    standardNotes: string;
  };
  personnel: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  reports: Array<any>;
  modalData: {
    description: string;
    notes: string;
    isCompleted: boolean;
    satisfaction: 'yes' | 'no';
    photos: string[];
    signature: string;
  };
}

export const getSampleDataPackage = (): SampleDataPackage => {
  const project = {
    id: 'sample-proj-01',
    name: 'Cantiere Centro - Impianti Elettrici (ESEMPIO)',
    clientId: 'sample-client-01',
    description: 'Posa condutture, cablaggio quadri elettrici e collaudo finale di cantiere.'
  };

  const client = {
    id: 'sample-client-01',
    name: 'Azienda Cliente SpA (Esempio)',
    email: 'amministrazione@azienda-cliente-esempio.it',
    phone: '+39 02 1234567'
  };

  const companyDetails = {
    name: 'Impresa Esecutrice SRL (Esempio)',
    address: 'Via dell\'Industria 15, Milano (MI)',
    taxId: 'IT01234567890',
    phone: '+39 02 9876543',
    email: 'info@impresa-esecutrice-esempio.it',
    logoUrl: '',
    standardNotes: 'Lavori eseguiti a regola d\'arte secondo le normative di sicurezza vigenti.'
  };

  const personnel = [
    { id: 'sample-user-01', name: 'Marco Rossi', role: 'Capocantiere' },
    { id: 'sample-user-02', name: 'Luca Bianchi', role: 'Tecnico Specializzato' }
  ];

  const reports = [
    {
      id: 'sample-report-01',
      projectId: project.id,
      userId: personnel[0].id,
      date: '2026-08-05',
      startTime: '08:00',
      endTime: '17:00',
      breakHours: 1,
      totalHours: 8,
      overtimeHours: 2,
      festiveHours: 0,
      nightHours: 0,
      description: 'Posa condutture e installazione primi quadri di piano.',
      notes: 'Spesa per materiale minuto di montaggio',
      expenses: [{ id: 'exp-1', description: 'Minuterie elettriche di montaggio', amount: 0 }],
      additionalWorkers: [
        {
          userId: personnel[1].id,
          personName: personnel[1].name,
          personRole: personnel[1].role,
          startTime: '08:00',
          endTime: '17:00',
          breakHours: 1,
          totalHours: 8,
          overtimeHours: 1,
          festiveHours: 0,
          nightHours: 0
        }
      ]
    },
    {
      id: 'sample-report-02',
      projectId: project.id,
      userId: personnel[0].id,
      date: '2026-08-06',
      startTime: '08:00',
      endTime: '17:00',
      breakHours: 1,
      totalHours: 8,
      overtimeHours: 1,
      festiveHours: 0,
      nightHours: 0,
      description: 'Cablaggio finale, verifiche di isolamento e pulizia cantiere.',
      notes: 'Spesa carburante per furgone operativo',
      expenses: [{ id: 'exp-2', description: 'Carburante furgone operativo', amount: 0 }],
      additionalWorkers: [
        {
          userId: personnel[1].id,
          personName: personnel[1].name,
          personRole: personnel[1].role,
          startTime: '08:00',
          endTime: '16:00',
          breakHours: 1,
          totalHours: 7,
          overtimeHours: 0,
          festiveHours: 0,
          nightHours: 0
        }
      ]
    }
  ];

  const modalData = {
    description: 'Intervento di posa condutture, cablaggio quadri ed isolamento impianti. Verifica di conformità e consegna finale.',
    notes: 'Lavoro completato regolarmente nei tempi stabiliti. Esito collaudo positivo.',
    isCompleted: true,
    satisfaction: 'yes' as 'yes' | 'no',
    photos: [SAMPLE_PHOTO_BASE64],
    signature: SAMPLE_SIGNATURE_BASE64
  };

  return {
    project,
    client,
    companyDetails,
    personnel,
    reports,
    modalData
  };
};

// Generate Sample Intervention PDF using real export engine
export const generateSampleInterventionPDF = async (lang: Language = 'it') => {
  const data = getSampleDataPackage();
  await generateInterventionPDF(
    data.reports,
    data.project,
    data.client,
    data.companyDetails,
    data.personnel,
    data.modalData,
    lang
  );
};

// Generate Sample Operational PDF Report using real export engine (zero costs/revenues)
export const generateSamplePDFReport = async (lang: Language = 'it') => {
  const data = getSampleDataPackage();
  const exportRows = [
    {
      date: '05/08/2026',
      clientName: data.client.name,
      projectName: data.project.name,
      workerName: 'Marco Rossi',
      description: 'Posa condutture e installazione quadri elettrici.',
      hours: 8,
      hourlyCost: 0, cost: 0, expenses: 0, hourlyRevenue: 0, revenue: 0, paid: 'Firmato'
    },
    {
      date: '05/08/2026',
      clientName: data.client.name,
      projectName: data.project.name,
      workerName: 'Luca Bianchi',
      description: 'Assistenza cablaggio e verifiche condutture.',
      hours: 8,
      hourlyCost: 0, cost: 0, expenses: 0, hourlyRevenue: 0, revenue: 0, paid: 'Firmato'
    },
    {
      date: '06/08/2026',
      clientName: data.client.name,
      projectName: data.project.name,
      workerName: 'Marco Rossi',
      description: 'Cablaggio finale e collaudo impianti.',
      hours: 8,
      hourlyCost: 0, cost: 0, expenses: 0, hourlyRevenue: 0, revenue: 0, paid: 'Firmato'
    }
  ];

  await exportToPDF(exportRows, lang, 'Dimostrativo Esempio', { hours: 24, cost: 0, revenue: 0, expenses: 0 });
};

// Generate Sample Operational Excel Report using real export engine (zero costs/revenues)
export const generateSampleExcelReport = async (lang: Language = 'it') => {
  const data = getSampleDataPackage();
  const exportRows = [
    {
      date: '05/08/2026',
      clientName: data.client.name,
      projectName: data.project.name,
      workerName: 'Marco Rossi',
      subcontractorName: 'Interno',
      description: 'Posa condutture e installazione quadri elettrici.',
      hours: 8,
      hourlyCost: 0, cost: 0, expenses: 0, hourlyRevenue: 0, revenue: 0, paid: 'Firmato'
    },
    {
      date: '05/08/2026',
      clientName: data.client.name,
      projectName: data.project.name,
      workerName: 'Luca Bianchi',
      subcontractorName: 'Interno',
      description: 'Assistenza cablaggio e verifiche condutture.',
      hours: 8,
      hourlyCost: 0, cost: 0, expenses: 0, hourlyRevenue: 0, revenue: 0, paid: 'Firmato'
    },
    {
      date: '06/08/2026',
      clientName: data.client.name,
      projectName: data.project.name,
      workerName: 'Marco Rossi',
      subcontractorName: 'Interno',
      description: 'Cablaggio finale e collaudo impianti.',
      hours: 8,
      hourlyCost: 0, cost: 0, expenses: 0, hourlyRevenue: 0, revenue: 0, paid: 'Firmato'
    }
  ];

  await exportToExcel(exportRows, lang);
};
