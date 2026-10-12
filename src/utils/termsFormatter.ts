/**
 * Professional Terms & Conditions and Additional Information Formatter
 * 
 * Preserves the author's intended formatting (numbers, bullets, key-value pairs, paragraphs)
 * while rendering clean, executive-standard HTML for PDF generation, printouts, and UI previews.
 */

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlAndHighlightKey(content: string): string {
  // If line starts with "Key: Value" or "Key - Value", highlight the key (supports English & Arabic keys)
  const kvMatch = content.match(/^([A-Za-z0-9\u0600-\u06FF\s\/\-_&]+(?:\([^\)]+\))?)\s*[:：]\s*(.+)$/);
  if (kvMatch && kvMatch[1].length < 45) {
    return `<strong style="color: #1a202c; font-weight: 600;">${escapeHtml(kvMatch[1])}:</strong> <span>${escapeHtml(kvMatch[2])}</span>`;
  }
  return escapeHtml(content);
}

function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

/**
 * Formats terms & conditions or additional notes into clean, professional HTML.
 * Preserves copied format (numbered lists, bullets, indentation, paragraphs).
 */
export function formatTermsToHtml(termsText?: string): string {
  if (!termsText || termsText.trim() === '') {
    return '';
  }

  const trimmed = termsText.trim();

  // If text already has rich HTML tags (e.g. <ul>, <ol>, <li>, <p>, <table>)
  if (/<(ul|ol|li|p|div|br|table|span|b|strong)[^>]*>/i.test(trimmed)) {
    return `<div class="formatted-terms-html" style="line-height: 1.5; font-size: inherit;">${trimmed}</div>`;
  }

  const rawLines = trimmed.split(/\r?\n/);
  const htmlChunks: string[] = [];
  let currentListType: 'ol' | 'ul' | null = null;
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListType && currentListItems.length > 0) {
      if (currentListType === 'ol') {
        htmlChunks.push(
          `<ol style="margin: 4px 0 8px 0; padding-left: 20px; list-style-type: decimal; line-height: 1.5;">` +
          currentListItems.map(item => `<li style="margin-bottom: 4px; padding-left: 2px;">${item}</li>`).join('') +
          `</ol>`
        );
      } else {
        htmlChunks.push(
          `<ul style="margin: 4px 0 8px 0; padding-left: 20px; list-style-type: disc; line-height: 1.5;">` +
          currentListItems.map(item => `<li style="margin-bottom: 4px; padding-left: 2px;">${item}</li>`).join('') +
          `</ul>`
        );
      }
      currentListType = null;
      currentListItems = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const line = raw.trim();

    if (!line) {
      // Empty line signals list termination or paragraph break
      flushList();
      continue;
    }

    const isRtl = isArabicText(line);
    const dirAttr = isRtl ? ' dir="rtl" style="direction: rtl; text-align: right;"' : '';

    // Check if line is numbered item: e.g. "1. ", "1.1 ", "1) ", "(1) ", "١. ", "a) "
    const numberedMatch = line.match(/^(\d+(?:\.\d+)*|[a-zA-Z]|[ivxIVX]+|[٠-٩]+)[\.\)\:\-]\s+(.*)$/);
    if (numberedMatch) {
      if (currentListType && currentListType !== 'ol') {
        flushList();
      }
      currentListType = 'ol';
      const content = numberedMatch[2] || '';
      currentListItems.push(escapeHtmlAndHighlightKey(content));
      continue;
    }

    // Check if line is a bullet item: e.g. "• ", "- ", "* ", "– ", "▪ "
    const bulletMatch = line.match(/^[•\-\*–—▪▫►\+]\s+(.*)$/);
    if (bulletMatch) {
      if (currentListType && currentListType !== 'ul') {
        flushList();
      }
      currentListType = 'ul';
      const content = bulletMatch[1] || '';
      currentListItems.push(escapeHtmlAndHighlightKey(content));
      continue;
    }

    // Flush any ongoing list before handling standalone line
    flushList();

    // Check for key-value pair, e.g. "Payment Terms: 100% in advance" or "Validity: 30 days"
    const kvMatch = line.match(/^([A-Za-z0-9\u0600-\u06FF\s\/\-_&]+(?:\([^\)]+\))?)\s*[:：]\s*(.+)$/);
    if (kvMatch && kvMatch[1].length < 45) {
      htmlChunks.push(
        `<div${dirAttr} style="margin-bottom: 4px; line-height: 1.5;">` +
        `<strong style="color: #1a202c; font-weight: 600;">${escapeHtml(kvMatch[1])}:</strong> ` +
        `<span>${escapeHtml(kvMatch[2])}</span>` +
        `</div>`
      );
    } else {
      // Regular paragraph or heading line
      const isHeadingLike = line.endsWith(':') || (line.length < 50 && line === line.toUpperCase());
      if (isHeadingLike) {
        htmlChunks.push(
          `<div${dirAttr} style="font-weight: 600; color: #2d3748; margin-top: 6px; margin-bottom: 4px; font-size: 1.02em;">${escapeHtml(line)}</div>`
        );
      } else {
        htmlChunks.push(
          `<p${dirAttr} style="margin: 0 0 6px 0; line-height: 1.5; color: #2d3748;">${escapeHtml(line)}</p>`
        );
      }
    }
  }

  flushList();

  return htmlChunks.join('');
}

/**
 * Convert raw text into sequential numbered list
 */
export function formatToNumberedList(text: string): string {
  if (!text) return '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let count = 1;
  return lines.map(line => {
    // Strip existing bullets/numbers if present
    const clean = line.replace(/^([•\-\*–—▪▫►\+]|\d+[\.\)\:\-]|\([0-9a-zA-Z]+\))\s*/, '').trim();
    return `${count++}. ${clean}`;
  }).join('\n');
}

/**
 * Convert raw text into clean bullet points
 */
export function formatToBulletList(text: string): string {
  if (!text) return '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    // Strip existing bullets/numbers if present
    const clean = line.replace(/^([•\-\*–—▪▫►\+]|\d+[\.\)\:\-]|\([0-9a-zA-Z]+\))\s*/, '').trim();
    return `• ${clean}`;
  }).join('\n');
}

/**
 * Standard Trading Quotation Terms Template
 */
export function getStandardQuotationTerms(): string {
  return [
    '1. Validity: Prices quoted are valid for 30 calendar days from the date of this quotation.',
    '2. Payment Terms: 100% advance payment against proforma invoice before delivery/dispatch.',
    '3. Delivery Period: Within 7–10 working days upon receipt of approved Purchase Order.',
    '4. Delivery Terms: Ex-Works / Delivered to client project site as mutually agreed.',
    '5. Value Added Tax: Prices are exclusive of 15% VAT, which will be charged in accordance with ZATCA regulations.',
    '6. Warranty: Standard manufacturer warranty applies against defects in materials and workmanship.'
  ].join('\n');
}
