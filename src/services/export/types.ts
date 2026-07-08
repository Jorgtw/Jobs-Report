export interface ReportDocument {
  metadata: ReportMetadata;
  sections: ReportSection[];
}

export interface ReportMetadata {
  companyName: string;
  clientName?: string;
  projectName?: string;
  reportContext: string;
  generatedBy: string;
  generatedAt: Date;
  filtersApplied: Record<string, string>;
}

export interface ReportSection {
  title: string;
  blocks: ReportBlock[];
}

export enum ReportBlockType {
  SUMMARY = 'SUMMARY',
  DASHBOARD = 'DASHBOARD',
  TABLE = 'TABLE',
  TEXT = 'TEXT'
}

export type ReportBlock = SummaryBlock | DashboardBlock | TableBlock | TextBlock;

export interface SummaryBlock {
  type: ReportBlockType.SUMMARY;
  title?: string;
  groups: {
    title?: string;
    items: { label: string; value: number | string; type?: 'text' | 'number' | 'decimal' | 'hours' }[];
  }[];
}

export interface DashboardBlock {
  type: ReportBlockType.DASHBOARD;
  kpis: { label: string; value: number | string; type?: 'text' | 'number' | 'decimal' | 'hours' }[];
}

export interface ReportTableColumn {
  key: string;
  header: string;
  type?: 'text' | 'number' | 'decimal' | 'hours' | 'date';
}

export interface TableBlock {
  type: ReportBlockType.TABLE;
  columns: ReportTableColumn[];
  data: Record<string, any>[];
  totals?: Record<string, number>;
}

export interface TextBlock {
  type: ReportBlockType.TEXT;
  content: string;
}
