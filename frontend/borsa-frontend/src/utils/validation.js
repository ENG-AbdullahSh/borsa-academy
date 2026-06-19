const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;

const emptyValue = (value) => (
  value === null
  || value === undefined
  || (typeof value === 'string' && value.trim() === '')
);

const rule = (test) => test;

export const validators = {
  required: (message = 'هذا الحقل مطلوب.') => rule((value) => (
    emptyValue(value) ? message : ''
  )),

  email: (message = 'يرجى إدخال بريد إلكتروني صحيح.') => rule((value) => (
    emptyValue(value) || EMAIL_PATTERN.test(String(value).trim()) ? '' : message
  )),

  minLength: (min, message = `يجب ألا يقل هذا الحقل عن ${min} أحرف.`) => rule((value) => (
    emptyValue(value) || String(value).trim().length >= min ? '' : message
  )),

  maxLength: (max, message = `يجب ألا يتجاوز هذا الحقل ${max} حرفاً.`) => rule((value) => (
    emptyValue(value) || String(value).trim().length <= max ? '' : message
  )),

  number: ({ min, max, message = 'يرجى إدخال رقم صحيح.' } = {}) => rule((value) => {
    if (emptyValue(value)) return '';

    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return message;
    if (min !== undefined && numberValue < min) return `يجب ألا يقل الرقم عن ${min}.`;
    if (max !== undefined && numberValue > max) return `يجب ألا يتجاوز الرقم ${max}.`;

    return '';
  }),

  url: (message = 'يرجى إدخال رابط صحيح يبدأ بـ http أو https.') => rule((value) => (
    emptyValue(value) || URL_PATTERN.test(String(value).trim()) ? '' : message
  )),

  fileSize: (maxBytes, message) => rule((file) => {
    if (!file) return '';
    return file.size <= maxBytes ? '' : message;
  }),

  fileType: (acceptedTypes, message = 'نوع الملف غير مدعوم.') => rule((file) => {
    if (!file) return '';

    const types = Array.isArray(acceptedTypes) ? acceptedTypes : [acceptedTypes];
    const fileName = file.name?.toLowerCase() || '';
    const isAccepted = types.some((type) => {
      const accepted = String(type).toLowerCase();
      if (accepted.endsWith('/*')) {
        return file.type?.toLowerCase().startsWith(accepted.replace('*', ''));
      }
      if (accepted.startsWith('.')) {
        return fileName.endsWith(accepted);
      }
      return file.type?.toLowerCase() === accepted;
    });

    return isAccepted ? '' : message;
  }),

  sameAs: (field, message = 'القيمتان غير متطابقتين.') => rule((value, values) => (
    value === values[field] ? '' : message
  )),
};

export function validateField(value, rules = [], values = {}) {
  for (const currentRule of rules) {
    const message = currentRule(value, values);
    if (message) return message;
  }

  return '';
}

export function validateFields(values, schema) {
  return Object.entries(schema).reduce((errors, [field, rules]) => {
    const message = validateField(values[field], rules, values);
    if (message) errors[field] = message;
    return errors;
  }, {});
}

export function hasValidationErrors(errors) {
  return Object.values(errors).some(Boolean);
}

export function normalizeLaravelErrors(error) {
  const errors = error?.data?.errors || error?.response?.data?.errors || error?.errors || {};

  return Object.entries(errors).reduce((result, [field, messages]) => {
    const value = Array.isArray(messages) ? messages[0] : messages;
    if (value) result[field] = value;
    return result;
  }, {});
}

export function firstLaravelError(error, fallback = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.') {
  const fieldErrors = normalizeLaravelErrors(error);
  return Object.values(fieldErrors).find(Boolean)
    || error?.data?.message
    || error?.response?.data?.message
    || error?.message
    || fallback;
}

export function invalidClass(error, className = 'is-invalid') {
  return error ? ` ${className}` : '';
}

export function invalidProps(error, id) {
  return {
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? id : undefined,
  };
}
