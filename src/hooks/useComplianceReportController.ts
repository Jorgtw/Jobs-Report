import { useState } from 'react';
import { WorkReport, User, Project, Client } from '../types';
import { db } from '../services/dbService';
import { generateCompliancePDF } from '../services/exportService';
import { Language } from '../i18n';

export function useComplianceReportController(
  user: User,
  projects: Project[],
  clients: Client[],
  personnel: User[],
  lang: Language,
  onUpgradeRequired: (feature: 'compliance') => void
) {
  const [complianceReportToSign, setComplianceReportToSign] = useState<WorkReport | null>(null);

  const openComplianceReport = (report: WorkReport) => {
    if (!user.isPremium) {
      onUpgradeRequired('compliance');
      return;
    }
    setComplianceReportToSign(report);
  };

  const closeComplianceReport = () => {
    setComplianceReportToSign(null);
  };

  const handleGenerateCompliance = async (photos: string[], signature: string) => {
    if (!complianceReportToSign) return;
    
    const project = projects.find(p => p.id === complianceReportToSign.projectId);
    const client = clients.find(c => c.id === project?.clientId);

    // Resolve additional worker names from personnel list
    const resolvedAdditionalWorkers = (complianceReportToSign.additionalWorkers || []).map(aw => ({
      ...aw,
      personName: aw.personName || personnel.find(u => u.id === aw.userId)?.name || '---',
    }));

    // Fetch company details and admin emails
    const companyDetails = await db.getCompanyDetails(user.companyId || '');
    const adminEmails = await db.getCompanyAdminEmails(user.companyId || '');

    const reportData = {
      ...complianceReportToSign,
      additionalWorkers: resolvedAdditionalWorkers,
      clientName: client?.name || '---',
      projectName: project?.name || '---',
      projectAddress: project?.address || '',
      userName: personnel.find(u => u.id === complianceReportToSign.userId)?.name || user.name,
      companyName: companyDetails?.name || '',
      companyAddress: companyDetails?.address || '',
      companyCity: companyDetails?.city || '',
      companyPhone: companyDetails?.phone || '',
      companyEmail: companyDetails?.email || '',
      companyVat: companyDetails?.vatNumber || '',
    };

    await generateCompliancePDF(reportData, photos, signature, lang, adminEmails);
  };

  return {
    complianceReportToSign,
    openComplianceReport,
    closeComplianceReport,
    handleGenerateCompliance,
  };
}
