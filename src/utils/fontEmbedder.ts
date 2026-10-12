// Font embedding utility for PDF generation - Browser compatible
// Use the Saudi Riyal symbol glyph in generated documents.

/**
 * Generate CSS for reliable currency display in PDF context
 * Uses the bundled Saudi Riyal symbol font glyph (U+E900).
 */
export function generateSaudiRiyalFontCSS(): string {
  return `
    @font-face {
      font-family: 'SaudiRiyalSymbol';
      src: url('/fonts/saudiriyalsymbol.woff2') format('woff2'),
           url('/fonts/saudiriyalsymbol.woff') format('woff'),
           url('/fonts/saudiriyalsymbol.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    /* Currency symbol styling for PDF compatibility */
    .currency-sar-symbol {
      font-family: 'SaudiRiyalSymbol', 'Arial Unicode MS', 'Arial', sans-serif;
      font-size: 1em;
      color: #2c5aa0;
      font-weight: bold;
    }
    
    .invoice-currency-sar {
      font-family: 'SaudiRiyalSymbol', 'Arial Unicode MS', 'Arial', sans-serif;
    }
    
    .detail-value, .summary-value, .total-value {
      font-family: 'SaudiRiyalSymbol', 'Arial Unicode MS', 'Arial', sans-serif;
      color: #2c5aa0;
      font-weight: 500;
    }
    
    .items-table td, .summary-value, .total-value {
      font-family: 'SaudiRiyalSymbol', 'Arial Unicode MS', 'Arial', sans-serif;
    }
  `;
}
