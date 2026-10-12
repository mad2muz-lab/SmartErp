// Comprehensive input validation system
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Email format is invalid');
    }
    
    if (email.length > 254) {
      errors.push('Email is too long (max 254 characters)');
    }
    
    // Check for common malicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(email)) {
        errors.push('Email contains invalid characters');
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Name validation
export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  const errors: string[] = [];
  
  if (!name) {
    errors.push(`${fieldName} is required`);
  } else {
    if (name.length < 2) {
      errors.push(`${fieldName} must be at least 2 characters`);
    }
    
    if (name.length > 50) {
      errors.push(`${fieldName} is too long (max 50 characters)`);
    }
    
    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) {
      errors.push(`${fieldName} contains invalid characters`);
    }
    
    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(name)) {
        errors.push(`${fieldName} contains invalid characters`);
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Phone number validation
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone) {
    errors.push('Phone number is required');
  } else {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      errors.push('Phone number must have at least 10 digits');
    }
    
    if (digitsOnly.length > 15) {
      errors.push('Phone number is too long');
    }
    
    // Check for suspicious patterns
    if (/^0{5,}/.test(digitsOnly)) {
      errors.push('Phone number contains too many consecutive zeros');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Address validation
export const validateAddress = (address: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!address) {
    errors.push('Address is required');
  } else {
    if (address.length < 5) {
      errors.push('Address is too short');
    }
    
    if (address.length > 200) {
      errors.push('Address is too long (max 200 characters)');
    }
    
    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(address)) {
        errors.push('Address contains invalid characters');
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Company name validation
export const validateCompanyName = (companyName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!companyName) {
    errors.push('Company name is required');
  } else {
    if (companyName.length < 2) {
      errors.push('Company name must be at least 2 characters');
    }
    
    if (companyName.length > 100) {
      errors.push('Company name is too long (max 100 characters)');
    }
    
    // Allow letters, numbers, spaces, hyphens, apostrophes, and common business characters
    const companyRegex = /^[a-zA-Z0-9\s\-'&.,()]+$/;
    if (!companyRegex.test(companyName)) {
      errors.push('Company name contains invalid characters');
    }
    
    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(companyName)) {
        errors.push('Company name contains invalid characters');
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Currency validation
export const validateCurrency = (amount: string | number): ValidationResult => {
  const errors: string[] = [];
  
  if (amount === null || amount === undefined || amount === '') {
    errors.push('Amount is required');
  } else {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      errors.push('Amount must be a valid number');
    } else {
      if (numAmount < 0) {
        errors.push('Amount cannot be negative');
      }
      
      if (numAmount > 999999999.99) {
        errors.push('Amount is too large');
      }
      
      // Check for reasonable decimal places
      const decimalPlaces = amount.toString().split('.')[1]?.length || 0;
      if (decimalPlaces > 2) {
        errors.push('Amount can have maximum 2 decimal places');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Date validation
export const validateDate = (date: string | Date): ValidationResult => {
  const errors: string[] = [];
  
  if (!date) {
    errors.push('Date is required');
  } else {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      errors.push('Date is invalid');
    } else {
      const now = new Date();
      const minDate = new Date('1900-01-01');
      
      if (dateObj < minDate) {
        errors.push('Date cannot be before 1900');
      }
      
      if (dateObj > now) {
        errors.push('Date cannot be in the future');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// URL validation
export const validateUrl = (url: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!url) {
    errors.push('URL is required');
  } else {
    try {
      const urlObj = new URL(url);
      
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol');
      }
      
      if (url.length > 2048) {
        errors.push('URL is too long');
      }
    } catch {
      errors.push('URL format is invalid');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// VAT Number validation (15 digits only)
export const validateVATNumber = (vat: string): ValidationResult => {
  const errors: string[] = [];
  
  if (vat && vat.trim()) {
    // Remove any spaces or special characters
    const cleanVAT = vat.replace(/\s/g, '');
    
    if (!/^\d{15}$/.test(cleanVAT)) {
      errors.push('VAT number must be exactly 15 digits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// CR Number validation (10 digits only)
export const validateCRNumber = (cr: string): ValidationResult => {
  const errors: string[] = [];
  
  if (cr && cr.trim()) {
    // Remove any spaces or special characters
    const cleanCR = cr.replace(/\s/g, '');
    
    if (!/^\d{10}$/.test(cleanCR)) {
      errors.push('CR number must be exactly 10 digits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Credit Days validation
export const validateCreditDays = (days: string | number): ValidationResult => {
  const errors: string[] = [];
  
  if (days !== null && days !== undefined && days !== '') {
    const numDays = typeof days === 'string' ? parseInt(days, 10) : days;
    
    if (isNaN(numDays)) {
      errors.push('Credit days must be a valid number');
    } else if (numDays < 0) {
      errors.push('Credit days cannot be negative');
    } else if (numDays > 365) {
      errors.push('Credit days cannot exceed 365 days');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Building Number validation (numbers only, max 4 digits)
export const validateBuildingNumber = (building: string): ValidationResult => {
  const errors: string[] = [];
  
  if (building && building.trim()) {
    if (!/^\d{1,4}$/.test(building.trim())) {
      errors.push('Building number must be 1-4 digits only');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Additional Number validation (numbers only, exactly 4 digits)
export const validateAdditionalNumber = (additional: string): ValidationResult => {
  const errors: string[] = [];
  
  if (additional && additional.trim()) {
    if (!/^\d{4}$/.test(additional.trim())) {
      errors.push('Additional number must be exactly 4 digits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Zip/Postal Code validation (numbers only, exactly 5 digits)
export const validateZipCode = (zip: string): ValidationResult => {
  const errors: string[] = [];
  
  if (zip && zip.trim()) {
    if (!/^\d{5}$/.test(zip.trim())) {
      errors.push('Zip/Postal code must be exactly 5 digits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Enhanced Phone Number validation (numbers, +, -, () allowed)
export const validatePhoneNumberEnhanced = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (phone && phone.trim()) {
    // Allow numbers, +, -, spaces, and parentheses
    const phoneRegex = /^[\+]?[\d\-\s\(\)]+$/;
    
    if (!phoneRegex.test(phone)) {
      errors.push('Phone number can only contain numbers, +, -, spaces, and parentheses');
    } else {
      // Remove all non-digit characters to check length
      const digitsOnly = phone.replace(/\D/g, '');
      
      if (digitsOnly.length < 7) {
        errors.push('Phone number must have at least 7 digits');
      } else if (digitsOnly.length > 15) {
        errors.push('Phone number is too long (max 15 digits)');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Sanitize input (remove potentially dangerous content)
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Validate form data
export const validateFormData = (data: Record<string, any>): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};
  
  for (const [field, value] of Object.entries(data)) {
    switch (field.toLowerCase()) {
      case 'email':
        results[field] = validateEmail(value);
        break;
      case 'firstname':
      case 'first_name':
        results[field] = validateName(value, 'First name');
        break;
      case 'lastname':
      case 'last_name':
        results[field] = validateName(value, 'Last name');
        break;
      case 'phone':
      case 'phone_number':
        results[field] = validatePhoneNumberEnhanced(value);
        break;
      case 'address':
        results[field] = validateAddress(value);
        break;
      case 'company':
      case 'company_name':
        results[field] = validateCompanyName(value);
        break;
      case 'amount':
      case 'price':
      case 'cost':
        results[field] = validateCurrency(value);
        break;
      case 'date':
      case 'birth_date':
      case 'start_date':
      case 'end_date':
        results[field] = validateDate(value);
        break;
      case 'url':
      case 'website':
        results[field] = validateUrl(value);
        break;
      case 'vat_number':
        results[field] = validateVATNumber(value);
        break;
      case 'cr_number':
        results[field] = validateCRNumber(value);
        break;
      case 'credit_days':
        results[field] = validateCreditDays(value);
        break;
      case 'building_number':
        results[field] = validateBuildingNumber(value);
        break;
      case 'additional_number':
        results[field] = validateAdditionalNumber(value);
        break;
      case 'zip_postal_code':
      case 'zip_code':
      case 'postal_code':
        results[field] = validateZipCode(value);
        break;
      default:
        // For unknown fields, do basic sanitization
        const sanitized = sanitizeInput(value);
        results[field] = {
          isValid: sanitized.length > 0,
          errors: sanitized.length === 0 ? ['Field is required'] : [],
        };
    }
  }
  
  return results;
};
