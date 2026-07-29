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
  // E.g., +8801712345678, 01712345678, 8801712345678, etc.
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
