/**
 * Shared validation rules for the Nexova ERP core engine.
 * Supports bilingual error message generation.
 */

export interface ValidationResult {
  isValid: boolean;
  message: string; // Bilingual formatted message
}

export function validateRequired(value: string, fieldNameEn: string, fieldNameBn: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      message: `${fieldNameEn} is required / ${fieldNameBn} আবশ্যক`,
    };
  }
  return { isValid: true, message: '' };
}

export function validatePositiveNumber(value: number | string, fieldNameEn: string, fieldNameBn: string, allowZero = true): ValidationResult {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) {
    return {
      isValid: false,
      message: `${fieldNameEn} must be a valid number / ${fieldNameBn} একটি সঠিক সংখ্যা হতে হবে`,
    };
  }
  if (allowZero) {
    if (num < 0) {
      return {
        isValid: false,
        message: `${fieldNameEn} cannot be negative / ${fieldNameBn} ঋণাত্মক হতে পারে না`,
      };
    }
  } else {
    if (num <= 0) {
      return {
        isValid: false,
        message: `${fieldNameEn} must be greater than 0 / ${fieldNameBn} ০-এর বেশি হতে হবে`,
      };
    }
  }
  return { isValid: true, message: '' };
}

export function validateEmail(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true, message: '' }; // Optional email is valid
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      isValid: false,
      message: 'Invalid email format / ইমেল ফরম্যাটটি সঠিক নয়',
    };
  }
  return { isValid: true, message: '' };
}

export function validatePhone(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true, message: '' }; // Optional phone is valid
  }
  // Bangladeshi phone regex: allow optional +880 or 880, then 013-019 followed by 8 digits (total 11 digits for local).
  const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
  if (!bdPhoneRegex.test(value.trim())) {
    return {
      isValid: false,
      message: 'Invalid phone format (+8801... or 01...) / ফোন নম্বরটি সঠিক নয় (+৮৮০১... বা ০১...)',
    };
  }
  return { isValid: true, message: '' };
}

export function validateDate(value: string, fieldNameEn: string, fieldNameBn: string, preventPast = false): ValidationResult {
  if (!value) {
    return {
      isValid: false,
      message: `${fieldNameEn} is required / ${fieldNameBn} আবশ্যক`,
    };
  }
  const inputDate = new Date(value);
  if (isNaN(inputDate.getTime())) {
    return {
      isValid: false,
      message: `Invalid date format / তারিখ ফরম্যাটটি সঠিক নয়`,
    };
  }
  if (preventPast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate < today) {
      return {
        isValid: false,
        message: `${fieldNameEn} cannot be in the past / ${fieldNameBn} অতীত তারিখ হতে পারবে না`,
      };
    }
  }
  return { isValid: true, message: '' };
}

// =========================================================================
// NEW: Schema Validation Helpers for Firestore Documents
// =========================================================================

export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'phone' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: (string | number)[];
  custom?: (value: any) => ValidationResult;
}

export type DocumentSchema = Record<string, SchemaField>;

export interface SchemaValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates a document against a schema definition.
 * Returns detailed error messages per field.
 */
export function validateDocument(data: Record<string, any>, schema: DocumentSchema): SchemaValidationResult {
  const errors: Record<string, string> = {};

  for (const [fieldName, fieldDef] of Object.entries(schema)) {
    const value = data[fieldName];

    // Required check
    if (fieldDef.required && (value === undefined || value === null || value === '')) {
      errors[fieldName] = `${fieldName} is required`;
      continue;
    }

    // Skip further validation if optional and empty
    if (!fieldDef.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    switch (fieldDef.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors[fieldName] = `${fieldName} must be a string`;
          continue;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors[fieldName] = `${fieldName} must be a valid number`;
          continue;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors[fieldName] = `${fieldName} must be a boolean`;
          continue;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors[fieldName] = `${fieldName} must be an array`;
          continue;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors[fieldName] = `${fieldName} must be an object`;
          continue;
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[fieldName] = `${fieldName} must be a valid email`;
          continue;
        }
        break;
      case 'phone':
        if (typeof value !== 'string' || !/^(?:\+?88)?01[3-9]\d{8}$/.test(value.trim())) {
          errors[fieldName] = `${fieldName} must be a valid Bangladeshi phone number`;
          continue;
        }
        break;
      case 'date':
        if (typeof value !== 'string' || isNaN(new Date(value).getTime())) {
          errors[fieldName] = `${fieldName} must be a valid date`;
          continue;
        }
        break;
    }

    // Range validation for numbers
    if (fieldDef.type === 'number') {
      if (fieldDef.min !== undefined && value < fieldDef.min) {
        errors[fieldName] = `${fieldName} must be at least ${fieldDef.min}`;
        continue;
      }
      if (fieldDef.max !== undefined && value > fieldDef.max) {
        errors[fieldName] = `${fieldName} must be at most ${fieldDef.max}`;
        continue;
      }
    }

    // Length validation for strings
    if (fieldDef.type === 'string' || fieldDef.type === 'email' || fieldDef.type === 'phone') {
      const strValue = String(value);
      if (fieldDef.minLength !== undefined && strValue.length < fieldDef.minLength) {
        errors[fieldName] = `${fieldName} must be at least ${fieldDef.minLength} characters`;
        continue;
      }
      if (fieldDef.maxLength !== undefined && strValue.length > fieldDef.maxLength) {
        errors[fieldName] = `${fieldName} must be at most ${fieldDef.maxLength} characters`;
        continue;
      }
    }

    // Pattern validation
    if (fieldDef.pattern && typeof value === 'string' && !fieldDef.pattern.test(value)) {
      errors[fieldName] = `${fieldName} format is invalid`;
      continue;
    }

    // Enum validation
    if (fieldDef.enum !== undefined && !fieldDef.enum.includes(value)) {
      errors[fieldName] = `${fieldName} must be one of: ${fieldDef.enum.join(', ')}`;
      continue;
    }

    // Custom validation
    if (fieldDef.custom) {
      const result = fieldDef.custom(value);
      if (!result.isValid) {
        errors[fieldName] = result.message;
        continue;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// =========================================================================
// Predefined Schemas for Core ERP Entities
// =========================================================================

export const ProductSchema: DocumentSchema = {
  id: { type: 'string', required: true, minLength: 1, maxLength: 50 },
  name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
  sku: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  category: { type: 'string', required: true },
  unit: { type: 'string', required: true },
  warehouse: { type: 'string', required: true },
  price: { type: 'number', required: true, min: 0 },
  cost: { type: 'number', required: true, min: 0 },
  stock: { type: 'number', required: true, min: 0 },
  alertQty: { type: 'number', required: true, min: 0 },
};

export const CustomerSchema: DocumentSchema = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
  phone: { type: 'phone' },
  email: { type: 'email' },
  group: { type: 'string' },
  outstandingBalance: { type: 'number', required: true, min: 0 },
};

export const InvoiceSchema: DocumentSchema = {
  id: { type: 'string', required: true },
  invoiceNo: { type: 'string', required: true, minLength: 1 },
  customerId: { type: 'string', required: true },
  customerName: { type: 'string', required: true },
  date: { type: 'date', required: true },
  subtotal: { type: 'number', required: true, min: 0 },
  taxRate: { type: 'number', required: true, min: 0, max: 100 },
  taxAmount: { type: 'number', required: true, min: 0 },
  discount: { type: 'number', required: true, min: 0 },
  total: { type: 'number', required: true, min: 0 },
  paymentMethod: { type: 'string', required: true, enum: ['Cash', 'Credit', 'Mobile Banking'] },
  isPaid: { type: 'boolean', required: true },
};

export const EmployeeSchema: DocumentSchema = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
  designation: { type: 'string', required: true },
  department: { type: 'string', required: true },
  email: { type: 'email' },
  phone: { type: 'phone' },
  joiningDate: { type: 'date', required: true },
  salary: { type: 'number', required: true, min: 0 },
  status: { type: 'string', required: true, enum: ['Active', 'Inactive'] },
};
