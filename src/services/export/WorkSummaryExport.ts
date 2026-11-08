import { WorkSummaryReportBuilder, WorkSession, ReportBuilderConfig } from './ReportBuilder';

export class WorkSummaryExportService {
  /**
   * Genera ed esporta il Sommario Lavori in formato Excel
   */
  static async exportToExcel(
    data: WorkSession[],
    config: ReportBuilderConfig,
    filename: string = 'JobsReport_Sommario_Lavori'
  ): Promise<void> {
    const builder = new WorkSummaryReportBuilder(data, config);
    const document = builder.build();
    
    const { ExcelRenderer } = await import('./renderers/ExcelRenderer');
    const renderer = new ExcelRenderer();
    await renderer.render(document, filename);
  }

  /**
   * Genera ed esporta il Sommario Lavori in formato PDF
   */
  static async exportToPdf(
    data: WorkSession[],
    config: ReportBuilderConfig,
    filename: string = 'JobsReport_Sommario_Lavori'
  ): Promise<void> {
    const builder = new WorkSummaryReportBuilder(data, config);
    const document = builder.build();
    
    const { PdfRenderer } = await import('./renderers/PdfRenderer');
    const renderer = new PdfRenderer();
    await renderer.render(document, filename);
  }
}
