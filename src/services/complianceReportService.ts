import { WorkReport, User, Project, Client } from '../types';
import { db } from './dbService';
import { generateCompliancePDF } from './exportService';
import { Language } from '../i18n';

export const complianceReportService = {
  async processAndGenerate(
    report: WorkReport,
    user: User,
    projects: Project[],
    clients: Client[],
    personnel: User[],
    photos: string[],
    signature: string,
    lang: Language,
    satisfaction?: 'yes' | 'no' | null
  ) {
    const project = projects.find(p => p.id === report.projectId);
    const client = clients.find(c => c.id === project?.clientId);

    // Resolve additional worker names from personnel list
    const resolvedAdditionalWorkers = (report.additionalWorkers || []).map(aw => ({
      ...aw,
      personName: aw.personName || personnel.find(u => u.id === aw.userId)?.name || '---',
    }));

    // Fetch company details and admin emails
    const companyDetails = await db.getCompanyDetails(user.companyId || '');
    const adminEmails = await db.getCompanyAdminEmails(user.companyId || '');

    const reportData = {
      ...report,
      satisfaction,
      additionalWorkers: resolvedAdditionalWorkers,
      clientName: client?.name || '---',
      projectName: project?.name || '---',
      projectAddress: project?.address || '',
      userName: personnel.find(u => u.id === report.userId)?.name || user.name,
      companyName: companyDetails?.name || '',
      companyAddress: companyDetails?.address || '',
      companyCity: companyDetails?.city || '',
      companyPhone: companyDetails?.phone || '',
      companyEmail: companyDetails?.email || '',
      companyVat: companyDetails?.vatNumber || '',
    };

    console.log('[DEBUG-EXPORT] Generating PDF only. Email sending is now a separated feature.');
    await generateCompliancePDF(reportData, photos, signature, lang);
  }
};
