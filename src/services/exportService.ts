export type { WorkerExportRow } from './exportServiceImpl';

export const exportToPDF = async (...args: Parameters<typeof import('./exportServiceImpl').exportToPDF>) => {
  const service = await import('./exportServiceImpl');
  return service.exportToPDF(...args);
};

export const exportProjectSummaryToPDF = async (...args: Parameters<typeof import('./exportServiceImpl').exportProjectSummaryToPDF>) => {
  const service = await import('./exportServiceImpl');
  return service.exportProjectSummaryToPDF(...args);
};

export const exportToExcel = async (...args: Parameters<typeof import('./exportServiceImpl').exportToExcel>) => {
  const service = await import('./exportServiceImpl');
  return service.exportToExcel(...args);
};

export const exportWorkerToPDF = async (...args: Parameters<typeof import('./exportServiceImpl').exportWorkerToPDF>) => {
  const service = await import('./exportServiceImpl');
  return service.exportWorkerToPDF(...args);
};

export const exportWorkerToExcel = async (...args: Parameters<typeof import('./exportServiceImpl').exportWorkerToExcel>) => {
  const service = await import('./exportServiceImpl');
  return service.exportWorkerToExcel(...args);
};

export const generateCompliancePDF = async (...args: Parameters<typeof import('./exportServiceImpl').generateCompliancePDF>) => {
  const service = await import('./exportServiceImpl');
  return service.generateCompliancePDF(...args);
};

export const sendComplianceReportEmail = async (...args: Parameters<typeof import('./exportServiceImpl').sendComplianceReportEmail>) => {
  const service = await import('./exportServiceImpl');
  return service.sendComplianceReportEmail(...args);
};

export const exportReportExcel = async (...args: Parameters<typeof import('./exportServiceImpl').exportReportExcel>) => {
  const service = await import('./exportServiceImpl');
  return service.exportReportExcel(...args);
};

export const exportInvoiceToPDF = async (...args: Parameters<typeof import('./exportServiceImpl').exportInvoiceToPDF>) => {
  const service = await import('./exportServiceImpl');
  return service.exportInvoiceToPDF(...args);
};

export const exportInvoiceToExcel = async (...args: Parameters<typeof import('./exportServiceImpl').exportInvoiceToExcel>) => {
  const service = await import('./exportServiceImpl');
  return service.exportInvoiceToExcel(...args);
};

export const generateInterventionPDF = async (...args: Parameters<typeof import('./exportServiceImpl').generateInterventionPDF>) => {
  const service = await import('./exportServiceImpl');
  return service.generateInterventionPDF(...args);
};
