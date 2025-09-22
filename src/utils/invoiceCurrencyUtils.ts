// Currency utilities for the invoice module
// Saudi Riyal symbol using Saudi Riyal Font: U+E900

// Import Saudi Riyal Font for invoice module
import '@emran-alhaddad/saudi-riyal-font/index.css';
// Import custom CSS for invoice currency styling
import './invoiceCurrency.css';

export const CURRENCY_SYMBOLS = {
  SAR: '\uE900', // Saudi Riyal symbol using Saudi Riyal Font (U+E900)
  USD: '$',  // US Dollar
  EUR: '€',  // Euro
  GBP: '£',  // British Pound
} as const;

export const CURRENCY_NAMES = {
  SAR: 'Saudi Riyal',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
} as const;

export type CurrencyCode = keyof typeof CURRENCY_SYMBOLS;

/**
 * Get Saudi Riyal symbol with fallback
 * @returns Saudi Riyal symbol or fallback
 */
const getSaudiRiyalSymbolWithFallback = (): string => {
  // Use new Saudi Riyal symbol for consistent display
  return '\uE900';
};

/**
 * Format currency amount with proper symbol
 * @param amount - The amount to format
 * @param currency - The currency code (default: SAR)
 * @param showSymbol - Whether to show the currency symbol (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number, 
  currency: CurrencyCode = 'SAR', 
  showSymbol: boolean = true
): string => {
  const formattedAmount = amount.toFixed(2);
  
  if (showSymbol) {
    // For SAR, put symbol after the amount (Arabic style)
    if (currency === 'SAR') {
      const symbol = getSaudiRiyalSymbolWithFallback();
      return `${formattedAmount} ${symbol}`;
    }
    // For other currencies, put symbol before the amount
    return `${CURRENCY_SYMBOLS[currency]}${formattedAmount}`;
  }
  
  return formattedAmount;
};

/**
 * Format currency with HTML for better symbol display
 * @param amount - The amount to format
 * @param currency - The currency code (default: SAR)
 * @returns HTML string with proper currency symbol
 */
export const formatCurrencyHTML = (
  amount: number, 
  currency: CurrencyCode = 'SAR'
): string => {
  const formattedAmount = amount.toFixed(2);
  
  if (currency === 'SAR') {
    // Use new Saudi Riyal symbol for consistent display
    const symbol = getSaudiRiyalSymbolWithFallback();
    const result = `${formattedAmount} ${symbol}`;
    console.log('🔍 formatCurrencyHTML - amount:', amount, 'currency:', currency, 'result:', result);
    return result;
  }
  
  return `${CURRENCY_SYMBOLS[currency]}${formattedAmount}`;
};

/**
 * Format currency for display in tables and cards
 * @param amount - The amount to format
 * @param currency - The currency code (default: SAR)
 * @returns Formatted currency string
 */
export const formatCurrencyDisplay = (
  amount: number, 
  currency: CurrencyCode = 'SAR'
): string => {
  return formatCurrency(amount, currency, true);
};

/**
 * Get currency symbol only
 * @param currency - The currency code (default: SAR)
 * @returns Currency symbol string
 */
export const getCurrencySymbol = (currency: CurrencyCode = 'SAR'): string => {
  if (currency === 'SAR') {
    return getSaudiRiyalSymbolWithFallback();
  }
  return CURRENCY_SYMBOLS[currency];
};

/**
 * Format amount with Saudi Riyal symbol
 * @param amount - The amount to format
 * @returns Formatted amount with Saudi Riyal symbol
 */
export const formatSaudiRiyal = (amount: number): string => {
  return formatCurrency(amount, 'SAR', true);
};
