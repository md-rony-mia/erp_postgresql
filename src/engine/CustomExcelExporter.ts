import * as XLSX from 'xlsx';
import type { CustomReportDefinition } from '../types/customReport.types';

/**
 * Exports raw report data to Excel using the project's existing `xlsx` dependency.
 */
export class CustomExcelExporter {
  static exportToExcel(
    reportDef: CustomReportDefinition,
    data: Record<string, unknown>[]
  ): ArrayBuffer {
    const headers = reportDef.dataSource.fields.map((f) => f.name);
    const rows = data.map((row) =>
      reportDef.dataSource.fields.map((f) => row[f.source] ?? '')
    );
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map(() => ({ wch: 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  }

  static download(
    reportDef: CustomReportDefinition,
    data: Record<string, unknown>[],
    filename?: string
  ): void {
    const buffer = this.exportToExcel(reportDef, data);
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${reportDef.name || 'report'}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
