import { FormulaEngine } from '../components/customReports/shared/FormulaEngine';
import { GroupingEngine } from '../components/customReports/shared/GroupingEngine';
import type {
  CustomReportDefinition,
  GroupResult,
  ReportComponent,
} from '../types/customReport.types';

export class CustomReportGenerator {
  private reportDef: CustomReportDefinition;
  private data: Record<string, unknown>[];
  private parameters: Record<string, unknown>;

  constructor(
    reportDef: CustomReportDefinition,
    data: Record<string, unknown>[],
    parameters: Record<string, unknown> = {}
  ) {
    this.reportDef = reportDef;
    this.data = data;
    this.parameters = parameters;
  }

  generate(): string {
    let groupedData: GroupResult[];

    if (this.reportDef.groups && this.reportDef.groups.length > 0) {
      const groupFields = this.reportDef.groups.map((g) => g.field);
      const aggregateFields = this.reportDef.groups.flatMap((g) => g.aggregates || []);
      const engine = new GroupingEngine(this.data, groupFields, aggregateFields);
      groupedData = engine.group();
    } else {
      groupedData = [{ key: 'all', rows: this.data, aggregates: {} }];
    }

    let html = this.renderBand('reportHeader', null);
    html += this.renderBand('pageHeader', null);

    groupedData.forEach((group) => {
      html += this.renderBand('groupHeader', group);
      group.rows.forEach((row) => {
        html += this.renderDetail(row);
      });
      html += this.renderBand('groupFooter', group);
    });

    html += this.renderBand('pageFooter', null);
    html += this.renderBand('reportFooter', null);

    return this.wrapHtml(html);
  }

  private renderBand(
    bandName: keyof CustomReportDefinition['bands'],
    group: GroupResult | null
  ): string {
    const band = this.reportDef.bands[bandName];
    if (!band) return '';

    let html = `<div class="band ${bandName}" style="min-height:${band.height}px;position:relative;">`;
    band.components.forEach((comp) => {
      html += this.renderComponent(comp, group, null);
    });
    html += '</div>';
    return html;
  }

  private renderDetail(row: Record<string, unknown>): string {
    const band = this.reportDef.bands.detail;
    if (!band) return '';

    let html = `<div class="band detail" style="min-height:${band.height}px;position:relative;">`;
    band.components.forEach((comp) => {
      html += this.renderComponent(comp, null, row);
    });
    html += '</div>';
    return html;
  }

  private renderComponent(
    comp: ReportComponent,
    group: GroupResult | null,
    row: Record<string, unknown> | null
  ): string {
    const formulaEngine = new FormulaEngine(
      group ? group.rows : this.data,
      this.reportDef.formulas,
      this.reportDef.dataSource.fields
    );

    switch (comp.type) {
      case 'text': {
        let text = comp.properties.text || '';
        Object.keys(this.parameters).forEach((key) => {
          text = text.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            String(this.parameters[key] ?? '')
          );
        });
        return `<div style="${this.getStyle(comp)}">${escapeHtml(text)}</div>`;
      }
      case 'field': {
        let value: unknown = '';
        const fieldName = comp.properties.fieldName;
        if (fieldName) {
          if (group && fieldName.includes(':')) {
            value = group.aggregates[fieldName] ?? '';
          } else if (row) {
            const field = this.reportDef.dataSource.fields.find(
              (f) => f.name === fieldName || f.source === fieldName
            );
            if (field?.formula) {
              value = formulaEngine.evaluate(field.formula, row);
            } else {
              value = row[field?.source || fieldName] ?? '';
            }
          } else if (group && group.rows[0]) {
            value = group.rows[0][fieldName] ?? '';
          }
        }
        return `<div style="${this.getStyle(comp)}">${escapeHtml(
          this.formatValue(value, comp.properties.format)
        )}</div>`;
      }
      case 'line':
        return `<hr style="border:none;border-top:${comp.properties.border?.width || 1}px solid ${
          comp.properties.color || '#000'
        };margin:4px 0;" />`;
      case 'box':
        return `<div style="${this.getStyle(comp)};box-sizing:border-box;"></div>`;
      case 'subReport':
        return `<div class="sub-report" style="${this.getStyle(comp)}">[Sub-report: ${
          comp.properties.subReportId || '?'
        }]</div>`;
      default:
        return '';
    }
  }

  private getStyle(comp: ReportComponent): string {
    const styles: string[] = [];
    const p = comp.properties;
    if (p.font) {
      styles.push(`font-family:${p.font.name || 'Arial'},sans-serif`);
      styles.push(`font-size:${p.font.size || 12}px`);
      if (p.font.bold) styles.push('font-weight:bold');
      if (p.font.italic) styles.push('font-style:italic');
    }
    if (p.color) styles.push(`color:${p.color}`);
    if (p.backgroundColor) styles.push(`background-color:${p.backgroundColor}`);
    if (p.alignment) styles.push(`text-align:${p.alignment}`);
    if (p.border) {
      styles.push(
        `border:${p.border.width}px ${p.border.style} ${p.border.color}`
      );
    }
    styles.push(
      `position:absolute;left:${comp.x}px;top:${comp.y}px;width:${comp.width}px;height:${comp.height}px;overflow:hidden`
    );
    return styles.join(';');
  }

  private formatValue(value: unknown, format?: string): string {
    if (value === null || value === undefined || value === '') return '';
    if (!format) return String(value);
    try {
      if (format === 'date') {
        const d = value instanceof Date ? value : new Date(String(value));
        return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-GB');
      }
      if (format === 'currency') {
        return `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
      }
      if (format === 'number') {
        return Number(value).toLocaleString();
      }
      return String(value);
    } catch {
      return String(value);
    }
  }

  private wrapHtml(content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(this.reportDef.name)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 16px; color: #111; }
    .band { position: relative; margin-bottom: 2px; width: 100%; }
    .reportHeader { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .groupHeader { background: #eef2ff; font-weight: 600; }
    .groupFooter { background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .pageFooter { border-top: 1px solid #cbd5e1; font-size: 11px; color: #64748b; }
    .sub-report { border: 1px dashed #94a3b8; padding: 8px; }
    @media print {
      body { margin: 0; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>${content}</body>
</html>`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
