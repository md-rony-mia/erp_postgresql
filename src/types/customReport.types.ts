/**
 * Crystal Reports-style band-based report definition types.
 * Separate from jsreport templates — stored in collection `custom_reports`.
 */

export interface CustomReportDefinition {
  id: string;
  name: string;
  description?: string;
  dataSource: DataSource;
  parameters: ReportParameter[];
  bands: Bands;
  formulas: Record<string, string>;
  groups?: GroupDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DataSource {
  /** Collection name in Nexova dataStore, or 'sql' / 'json' */
  type: 'collection' | 'sql' | 'json' | 'api';
  /** e.g. invoices, products, transactions */
  collection?: string;
  connection?: string;
  query?: string;
  fields: Field[];
}

export interface Field {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  source: string;
  formula?: string;
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'range' | 'multiSelect';
  required: boolean;
  defaultValue?: unknown;
  values?: unknown[];
  dependsOn?: string;
}

export interface Bands {
  reportHeader: Band;
  pageHeader: Band;
  groupHeader?: Band;
  detail: Band;
  groupFooter?: Band;
  pageFooter: Band;
  reportFooter: Band;
}

export interface Band {
  height: number;
  components: ReportComponent[];
}

export interface ReportComponent {
  id: string;
  type: 'text' | 'field' | 'line' | 'box' | 'image' | 'chart' | 'subReport' | 'crossTab';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: ComponentProperties;
}

export interface ComponentProperties {
  text?: string;
  fieldName?: string;
  font?: { name: string; size: number; bold?: boolean; italic?: boolean };
  color?: string;
  backgroundColor?: string;
  border?: { color: string; width: number; style: 'solid' | 'dashed' | 'dotted' };
  alignment?: 'left' | 'center' | 'right' | 'justify';
  format?: string;
  condition?: string;
  chartType?: 'pie' | 'bar' | 'line' | 'area';
  subReportId?: string;
}

export interface GroupDefinition {
  field: string;
  aggregates?: string[]; // e.g. "total:sum", "id:count"
}

export interface GroupResult {
  key: string;
  rows: Record<string, unknown>[];
  subGroups?: GroupResult[];
  aggregates: Record<string, unknown>;
}

export function createEmptyReport(name = 'New Custom Report'): CustomReportDefinition {
  return {
    id: `creport_${Date.now()}`,
    name,
    dataSource: {
      type: 'collection',
      collection: 'invoices',
      fields: [
        { name: 'invoiceNo', type: 'string', source: 'invoiceNo' },
        { name: 'customerName', type: 'string', source: 'customerName' },
        { name: 'date', type: 'date', source: 'date' },
        { name: 'total', type: 'currency', source: 'total' },
      ],
    },
    parameters: [],
    bands: {
      reportHeader: { height: 48, components: [] },
      pageHeader: { height: 28, components: [] },
      detail: { height: 28, components: [] },
      pageFooter: { height: 24, components: [] },
      reportFooter: { height: 36, components: [] },
    },
    formulas: {},
    groups: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
