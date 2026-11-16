export interface ReportColumn {
  key: string;
  header: string;
}

export type ReportRow = Record<string, unknown>;

export type ReportFormat = 'excel' | 'pdf';