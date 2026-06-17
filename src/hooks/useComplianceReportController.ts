import { useState } from 'react';
import { WorkReport, User, Project, Client } from '../types';
import { complianceReportService } from '../services/complianceReportService';
import { Language } from '../i18n';

export function useComplianceReportController(
  user: User,
  projects: Project[],
  clients: Client[],
  personnel: User[],
  lang: Language,
  hasAccess: boolean,
  onUpgradeRequired: (feature: 'compliance') => void
) {
  const [complianceReportToSign, setComplianceReportToSign] = useState<WorkReport | null>(null);

  const openComplianceReport = (report: WorkReport) => {
    if (!hasAccess) {
      onUpgradeRequired('compliance');
      return;
    }
    setComplianceReportToSign(report);
  };

  const closeComplianceReport = () => {
    setComplianceReportToSign(null);
  };

  const handleGenerateCompliance = async (photos: string[], signature: string, satisfaction?: 'yes' | 'no' | null) => {
    if (!complianceReportToSign) return;
    
    await complianceReportService.processAndGenerate(
      complianceReportToSign,
      user,
      projects,
      clients,
      personnel,
      photos,
      signature,
      lang,
      satisfaction
    );
  };

  return {
    complianceReportToSign,
    openComplianceReport,
    closeComplianceReport,
    handleGenerateCompliance,
  };
}
