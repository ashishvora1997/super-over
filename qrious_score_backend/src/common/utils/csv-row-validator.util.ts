export interface FieldRule {
  field: string;
  required: boolean;
  type?: 'string' | 'number';
  validValues?: string[];
}

export function validateCSVRow(
  row: Record<string, string>,
  rules: FieldRule[],
): string | null {
  for (const rule of rules) {
    const value = row[rule.field]?.trim();

    if (rule.required && !value) {
      return `${rule.field} is required`;
    }

    if (value && rule.validValues && !rule.validValues.includes(value)) {
      return `${rule.field} must be one of: ${rule.validValues.join(', ')}`;
    }

    if (value && rule.type === 'number' && isNaN(Number(value))) {
      return `${rule.field} must be a valid number`;
    }
  }

  return null;
}
