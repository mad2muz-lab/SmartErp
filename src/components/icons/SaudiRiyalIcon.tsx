import React from 'react';
import { Icon, IconProps } from '@chakra-ui/react';
import '../../utils/saudiRiyalSymbol.css';

/**
 * Official Saudi Riyal (SAR) Currency Emblem Icon
 * Source: Official SAMA Guidelines & abdulrysrr/new-saudi-riyal-symbol
 * High-precision vector paths matching the national Saudi Riyal symbol standard.
 */
export const SaudiRiyalIcon: React.FC<IconProps> = (props) => (
  <Icon
    viewBox="0 0 1125 1257"
    fill="currentColor"
    aria-label="Saudi Riyal Symbol"
    {...props}
  >
    <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
    <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
  </Icon>
);

/**
 * Official Saudi Riyal Symbol Font component
 * Renders the symbol from the official saudiriyalsymbol font (U+E900)
 */
export const SaudiRiyalSymbolFont: React.FC<{
  className?: string;
  style?: React.CSSProperties;
  size?: string | number;
}> = ({ className = '', style = {}, size }) => (
  <span
    className={`icon-saudi_riyal ${className}`}
    style={{
      fontSize: size,
      fontFamily: "'SaudiRiyalSymbol', 'saudi_riyal', sans-serif",
      ...style,
    }}
  >
    &#xe900;
  </span>
);

/**
 * Inline Saudi Riyal Currency Symbol Component
 * Drop-in inline symbol for prices, totals, badges, and headers across POS, invoices, and accounting.
 */
export const RiyalCurrencySymbol: React.FC<{
  size?: string | number;
  boxSize?: string | number;
  mx?: string | number;
  ml?: string | number;
  mr?: string | number;
  className?: string;
}> = ({
  size = '1.05em',
  boxSize,
  mx = '2px',
  ml,
  mr,
  className = '',
}) => {
  const effectiveSize = boxSize || size;
  return (
    <Icon
      as={SaudiRiyalIcon}
      boxSize={effectiveSize}
      display="inline-block"
      verticalAlign="-0.12em"
      mx={mx}
      ml={ml}
      mr={mr}
      className={className}
      aria-label="Saudi Riyal symbol"
    />
  );
};

/**
 * Saudi Riyal Cash Banknote Icon
 * Used for Cash payment methods in POS instead of the dollar sign ($)
 */
export const CashBanknoteIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 8h.01M19 8h.01M5 16h.01M19 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
);

export default SaudiRiyalIcon;
