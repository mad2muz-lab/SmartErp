import React from 'react';
import { Text, TextProps } from '@chakra-ui/react';
// Import Saudi Riyal Font for consistent currency display
import '@emran-alhaddad/saudi-riyal-font/index.css';

interface FormattedCurrencyDisplayProps extends TextProps {
  amount: number;
  currency?: string;
  showSymbol?: boolean;
  showCurrency?: boolean;
}

/**
 * Safe display component for formatted currency values with comma separators
 * This component ONLY handles display formatting and does NOT affect any business logic
 * 
 * Features:
 * - Adds comma separators to numbers (1,000.00, 10,000.00, etc.)
 * - Maintains 2 decimal places
 * - Supports different currency symbols
 * - Zero risk to existing functionality
 */
export const FormattedCurrencyDisplay: React.FC<FormattedCurrencyDisplayProps> = ({
  amount,
  currency = 'SAR',
  showSymbol = true,
  showCurrency = false,
  ...textProps
}) => {
  // Safe formatting function - only affects display, not calculations
  const formatAmount = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Get currency symbol
  const getCurrencySymbol = (curr: string): string => {
    switch (curr) {
      case 'SAR':
        return '\uE900'; // New Saudi Riyal symbol (U+E900) using Saudi Riyal Font
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'CAD':
        return 'C$';
      default:
        return curr;
    }
  };

  const formattedAmount = formatAmount(amount);
  const currencySymbol = getCurrencySymbol(currency);

  // Build display text
  let displayText = formattedAmount;
  
  if (showCurrency && showSymbol) {
    displayText = currency === 'SAR'
      ? `${formattedAmount} ${currencySymbol}`
      : `${formattedAmount} ${currency} ${currencySymbol}`;
  } else if (showCurrency) {
    displayText = `${formattedAmount} ${currency}`;
  } else if (showSymbol) {
    displayText = `${formattedAmount} ${currencySymbol}`;
  }

  return (
    <Text 
      as="span"
      {...textProps}
      className={currency === 'SAR' ? 'procurement-currency-sar' : undefined}
      style={currency === 'SAR' ? { fontFamily: "'saudi_riyal', 'Arial Unicode MS', 'Arial', sans-serif" } : undefined}
    >
      {displayText}
    </Text>
  );
};

/**
 * Simple number formatter for display only (no currency symbol)
 * Use this for quantities, percentages, etc.
 */
export const FormattedNumberDisplay: React.FC<TextProps & { value: number }> = ({
  value,
  ...textProps
}) => {
  const formattedValue = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <Text {...textProps}>
      {formattedValue}
    </Text>
  );
};

export default FormattedCurrencyDisplay;
