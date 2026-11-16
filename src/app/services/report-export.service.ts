import { Injectable } from '@angular/core';

import { ReportColumn, ReportRow } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportExportService {

  /**
   * Export records to an Excel spreadsheet.
   */
  async exportExcel(
    title: string,
    filename: string,
    columns: ReportColumn[],
    data: ReportRow[]
  ): Promise<void> {

    if (!data || data.length === 0) {
      console.warn('There is no data available to export.');
      return;
    }

    const XLSX = await import('xlsx');
    const exportData = data.map(row => {
      const formattedRow: Record<string, unknown> = {};

      columns.forEach(column => {
        formattedRow[column.header] = this.formatValue(row[column.key]);
      });

      return formattedRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      this.getSheetName(title)
    );

    XLSX.writeFile(workbook, `${this.cleanFilename(filename)}.xlsx`);
  }

  /**
   * Export records to a PDF document.
   */
  async exportPdf(
    title: string,
    filename: string,
    columns: ReportColumn[],
    data: ReportRow[]
  ): Promise<void> {

    if (!data || data.length === 0) {
      console.warn('There is no data available to export.');
      return;
    }

    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const document = new jsPDF({
      orientation: columns.length > 5 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    document.setFontSize(18);
    document.text(title, 14, 18);

    document.setFontSize(9);
    document.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      25
    );

    const headers = columns.map(column => column.header);

    const rows = data.map(row =>
      columns.map(column => this.formatValue(row[column.key]))
    );

    autoTable(document, {
      head: [headers],
      body: rows,
      startY: 32,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [37, 57, 85],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: {
        left: 14,
        right: 14
      }
    });

    document.save(`${this.cleanFilename(filename)}.pdf`);
  }

  /**
   * Convert values into readable spreadsheet and PDF text.
   */
  private formatValue(value: unknown): string | number | boolean {

    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    return String(value);
  }

  /**
   * Keep filenames safe for downloads.
   */
  private cleanFilename(filename: string): string {
    return filename
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
      .replace(/\s+/g, '_') || 'report';
  }

  /**
   * Excel sheet names have a 31-character limit.
   */
  private getSheetName(title: string): string {
    return title
      .replace(/[\[\]*?/\\:]/g, '')
      .substring(0, 31) || 'Report';
  }
}