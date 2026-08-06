import type { GroupResult } from '../../../types/customReport.types';

export class GroupingEngine {
  private data: Record<string, unknown>[];
  private groupFields: string[];
  private aggregateFields: string[];

  constructor(
    data: Record<string, unknown>[],
    groupFields: string[],
    aggregateFields: string[]
  ) {
    this.data = data;
    this.groupFields = groupFields;
    this.aggregateFields = aggregateFields;
  }

  group(): GroupResult[] {
    if (this.groupFields.length === 0) {
      return [
        {
          key: 'all',
          rows: this.data,
          aggregates: this.calculateAggregates(this.data),
        },
      ];
    }

    const groups = new Map<string, Record<string, unknown>[]>();

    this.data.forEach((row) => {
      const key = this.groupFields.map((f) => String(row[f] ?? '')).join('||');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });

    const result: GroupResult[] = [];
    groups.forEach((rows, key) => {
      const group: GroupResult = {
        key,
        rows,
        aggregates: this.calculateAggregates(rows),
      };
      if (this.groupFields.length > 1) {
        const subEngine = new GroupingEngine(
          rows,
          this.groupFields.slice(1),
          this.aggregateFields
        );
        group.subGroups = subEngine.group();
      }
      result.push(group);
    });

    return result;
  }

  private calculateAggregates(rows: Record<string, unknown>[]): Record<string, unknown> {
    const aggregates: Record<string, unknown> = {};

    this.aggregateFields.forEach((field) => {
      const [fieldName, functionName] = field.split(':');
      const values = rows
        .map((row) => Number(row[fieldName]))
        .filter((v) => !Number.isNaN(v));

      switch (functionName) {
        case 'sum':
          aggregates[field] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregates[field] = values.length
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
          break;
        case 'min':
          aggregates[field] = values.length ? Math.min(...values) : 0;
          break;
        case 'max':
          aggregates[field] = values.length ? Math.max(...values) : 0;
          break;
        case 'count':
          aggregates[field] = rows.length;
          break;
        default:
          aggregates[field] = null;
      }
    });

    return aggregates;
  }
}
