/**
 * Safe-ish formula evaluation for field expressions.
 * Supports {fieldName} placeholders and basic arithmetic.
 */

export class FormulaEngine {
  private formulas: Record<string, string>;
  private fields: { name: string; source: string; formula?: string }[];

  constructor(
    _data: Record<string, unknown>[],
    formulas: Record<string, string>,
    fields: { name: string; source: string; formula?: string }[]
  ) {
    this.formulas = formulas;
    this.fields = fields;
  }

  evaluate(expression: string, row: Record<string, unknown>): unknown {
    const sanitized = this.sanitizeExpression(expression);
    try {
      let processed = sanitized;

      this.fields.forEach((field) => {
        const regex = new RegExp(`\\{${field.name}\\}`, 'g');
        if (field.formula) {
          const value = this.evaluate(field.formula, row);
          processed = processed.replace(
            regex,
            typeof value === 'string' ? JSON.stringify(value) : String(value ?? 0)
          );
        } else {
          const raw = row[field.source];
          processed = processed.replace(
            regex,
            typeof raw === 'string' ? JSON.stringify(raw) : String(raw ?? 0)
          );
        }
      });

      // Named formulas
      Object.entries(this.formulas).forEach(([name, expr]) => {
        const regex = new RegExp(`\\{${name}\\}`, 'g');
        if (processed.includes(`{${name}}`)) {
          const value = this.evaluate(expr, row);
          processed = processed.replace(
            regex,
            typeof value === 'string' ? JSON.stringify(value) : String(value ?? 0)
          );
        }
      });

      // eslint-disable-next-line no-new-func
      return new Function(`"use strict"; return (${processed});`)();
    } catch (error) {
      console.error('Formula error:', error, expression);
      return null;
    }
  }

  private sanitizeExpression(expression: string): string {
    return expression.replace(/[^a-zA-Z0-9_+\-*/().,{}\s"'%<>=!&|?:]/g, '');
  }

  aggregate(
    data: Record<string, unknown>[],
    field: string,
    type: 'sum' | 'avg' | 'min' | 'max' | 'count'
  ): number {
    const values = data
      .map((row) => Number(row[field]))
      .filter((v) => !Number.isNaN(v));

    switch (type) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'min':
        return values.length ? Math.min(...values) : 0;
      case 'max':
        return values.length ? Math.max(...values) : 0;
      case 'count':
        return data.length;
      default:
        return 0;
    }
  }
}
