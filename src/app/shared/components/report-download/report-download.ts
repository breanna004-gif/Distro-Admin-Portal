
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportExportService } from '../../../services/report-export.service';
import { ReportColumn, ReportRow } from '../../../models/report.model';

@Component({
  selector: 'app-report-download',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-download.html',
  styleUrl: './report-download.css'
})
export class ReportDownload {

  @Input() title = 'Report';

  @Input() filename = 'report';

  @Input() columns: ReportColumn[] = [];

  @Input() data: ReportRow[] = [];

  @Input() showExcel = true;

  @Input() showPdf = true;

  exportError = '';

  constructor(
    private reportExportService: ReportExportService
  ) {}

  get hasData(): boolean {
    return this.data.length > 0 && this.columns.length > 0;
  }

  async downloadExcel(): Promise<void> {
    if (!this.hasData) {
      return;
    }

    this.exportError = '';

    try {
      await this.reportExportService.exportExcel(
        this.title,
        this.filename,
        this.columns,
        this.data
      );
    } catch (error) {
      console.error('Failed to export Excel report:', error);
      this.exportError = 'Unable to export the Excel report. Please try again.';
    }
  }

  async downloadPdf(): Promise<void> {
    if (!this.hasData) {
      return;
    }

    this.exportError = '';

    try {
      await this.reportExportService.exportPdf(
        this.title,
        this.filename,
        this.columns,
        this.data
      );
    } catch (error) {
      console.error('Failed to export PDF report:', error);
      this.exportError = 'Unable to export the PDF report. Please try again.';
    }
  }
}
