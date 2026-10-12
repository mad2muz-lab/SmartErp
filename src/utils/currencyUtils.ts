// Currency utilities for the procurement module
// Saudi Riyal symbol using Saudi Riyal Font: U+E900

// Import Saudi Riyal Font for procurement module
import '@emran-alhaddad/saudi-riyal-font/index.css';
// Import custom CSS for procurement & official Saudi Riyal currency styling
import './saudiRiyalSymbol.css';
import './procurementCurrency.css';

export const CURRENCY_SYMBOLS = {
  SAR: '\uE900',
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
 * @returns Saudi Riyal symbol (U+E900)
 */
const getSaudiRiyalSymbolWithFallback = (): string => {
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
 * Get currency display text for dropdowns and labels
 * @param currency - The currency code
 * @returns Formatted currency display text
 */
export const getCurrencyDisplay = (currency: CurrencyCode): string => {
  const name = CURRENCY_NAMES[currency];
  
  if (currency === 'SAR') {
    const symbol = getSaudiRiyalSymbolWithFallback();
    return `${symbol} (${name})`;
  }
  return `${currency} (${name})`;
};

/**
 * Get currency options for dropdowns
 * @returns Array of currency options
 */
export const getCurrencyOptions = () => {
  return Object.keys(CURRENCY_SYMBOLS).map(code => ({
    value: code,
    label: getCurrencyDisplay(code as CurrencyCode)
  }));
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
 * Format currency for PDF generation
 * @param amount - The amount to format
 * @param currency - The currency code (default: SAR)
 * @returns Formatted currency string for PDF
 */
export const formatCurrencyForPDF = (
  amount: number, 
  currency: CurrencyCode = 'SAR'
): string => {
  return formatCurrency(amount, currency, true);
};

/**
 * Get Saudi Riyal symbol
 * @returns Saudi Riyal symbol
 */
export const getSaudiRiyalSymbol = (): string => {
  return getSaudiRiyalSymbolWithFallback();
};

/**
 * Format amount with Saudi Riyal symbol
 * @param amount - The amount to format
 * @returns Formatted amount with Saudi Riyal symbol
 */
export const formatSaudiRiyal = (amount: number): string => {
  return formatCurrency(amount, 'SAR', true);
};

/**
 * Format currency with icon for display in components
 * @param amount - The amount to format
 * @param currency - The currency code (default: SAR)
 * @returns Formatted currency string with icon
 */
export const formatCurrencyWithIcon = (
  amount: number, 
  currency: CurrencyCode = 'SAR'
): string => {
  return formatCurrency(amount, currency, true);
};
