import { ReportDocument } from '../types';

export interface ReportRenderer {
  render(document: ReportDocument, filename: string): Promise<void>;
}
