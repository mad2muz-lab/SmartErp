import React from 'react';

/**
 * Saudi Riyal Symbol Utilities
 * Converts SAR text to styled display with PNG image symbol
 */

/**
 * Convert SAR text to HTML with styled Saudi Riyal symbol
 * @param text - Text containing "SAR" to be styled
 * @returns HTML string with styled Saudi Riyal symbol
 */
export const convertSARToStyledHTML = (text: string): string => {
  return text.replace(/SAR\s+(\d+(?:\.\d{2})?)/g, (match, amount) => {
    return `<span class="currency-display-sar"><span class="saudi-riyal-symbol"></span><span class="amount">${amount}</span></span>`;
  });
};

/**
 * Convert SAR amount to HTML with styled Saudi Riyal symbol
 * @param amount - The amount to format
 * @returns HTML string with styled Saudi Riyal symbol
 */
export const convertSARAmountToStyledHTML = (amount: number): string => {
  const formattedAmount = amount.toFixed(2);
  return `<span class="currency-display-sar"><span class="saudi-riyal-symbol"></span><span class="amount">${formattedAmount}</span></span>`;
};

/**
 * Convert SAR text to React JSX structure
 * @param text - Text containing "SAR" to be styled
 * @returns Array of React elements
 */
export const convertSARToReactElements = (text: string): (string | JSX.Element)[] => {
  const parts = text.split(/(SAR\s+(\d+(?:\.\d{2})?))/g);
  
  return parts.map((part, index) => {
    const match = part.match(/SAR\s+(\d+(?:\.\d{2})?)/);
    if (match) {
      const amount = match[1];
      return (
        <span key={index} className="currency-display-sar">
          <span className="saudi-riyal-symbol"></span>
          <span className="amount">{amount}</span>
        </span>
      );
    }
    return part;
  });
};

/**
 * Convert SAR amount to React JSX structure
 * @param amount - The amount to format
 * @returns React element with styled Saudi Riyal symbol
 */
export const convertSARAmountToReactElement = (amount: number): JSX.Element => {
  const formattedAmount = amount.toFixed(2);
  return (
    <span className="currency-display-sar">
      <span className="saudi-riyal-symbol"></span>
      <span className="amount">{formattedAmount}</span>
    </span>
  );
};

/**
 * Check if text contains SAR currency
 * @param text - Text to check
 * @returns True if text contains SAR
 */
export const containsSAR = (text: string): boolean => {
  return /SAR\s+\d+(?:\.\d{2})?/.test(text);
};

/**
 * Extract amount from SAR text
 * @param text - Text containing SAR amount
 * @returns Extracted amount or null
 */
export const extractSARAmount = (text: string): number | null => {
  const match = text.match(/SAR\s+(\d+(?:\.\d{2})?)/);
  return match ? parseFloat(match[1]) : null;
};
