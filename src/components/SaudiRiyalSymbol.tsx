import React from 'react';
import { SaudiRiyalIcon as RiyalIcon } from './icons/SaudiRiyalIcon';

interface SaudiRiyalSymbolProps {
  amount?: number | string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showAmount?: boolean;
}

/**
 * Saudi Riyal Symbol Component using PNG image
 * Follows usage guidelines: symbol to the left with proper spacing
 */
export const SaudiRiyalSymbol: React.FC<SaudiRiyalSymbolProps> = ({
  amount,
  className = '',
  size = 'medium',
  showAmount = true
}) => {
  const sizeStyles = {
    small: { width: '1rem', height: '1rem' },
    medium: { width: '1.25rem', height: '1.25rem' },
    large: { width: '1.5rem', height: '1.5rem' }
  };

  return (
    <span className={`currency-display-sar ${className}`}>
      <RiyalIcon
        className="saudi-riyal-symbol"
        boxSize={sizeStyles[size].width}
        display="inline-block"
        verticalAlign="-0.12em"
        marginRight="0.25em"
        title="Saudi Riyal"
      />
      {showAmount && amount !== undefined && amount !== null && (
        <span className="amount">{amount}</span>
      )}
    </span>
  );
};

/**
 * Saudi Riyal Symbol with Amount Component
 * Displays the symbol followed by the formatted amount
 */
export const SaudiRiyalAmount: React.FC<{
  amount: number;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  decimalPlaces?: number;
}> = ({ 
  amount, 
  className = '', 
  size = 'medium',
  decimalPlaces = 2 
}) => {
  const formattedAmount = typeof amount === 'number' 
    ? amount.toFixed(decimalPlaces)
    : amount.toString();

  return (
    <SaudiRiyalSymbol
      amount={formattedAmount}
      className={className}
      size={size}
      showAmount={true}
    />
  );
};

/**
 * Saudi Riyal Symbol Only Component
 * Displays just the symbol without amount
 */
export const SaudiRiyalSymbolOnly: React.FC<{
  className?: string;
  size?: 'small' | 'medium' | 'large';
}> = ({ className = '', size = 'medium' }) => {
  return (
    <SaudiRiyalSymbol
      className={className}
      size={size}
      showAmount={false}
    />
  );
};

export default SaudiRiyalSymbol;
