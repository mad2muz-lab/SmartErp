import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface PDFGenerationOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export interface QuotationData {
  _id: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  valid_until: string;
  currency: string;
  tax_rate: number;
  items: Array<{
    inventory_name: string;
    description: string;
    quantity: number;
    unit_price: number;
    rate: number;
    total_price: number;
    amount: number;
    vat_percentage: number;
    vat_amount: number;
  }>;
}

export interface OrganizationData {
  name: string;
  name_arabic: string;
  address: string;
  address_arabic: string;
  vat_number: string;
  vat_number_arabic: string;
  cr_number: string;
  email: string;
  phone: string;
  website: string;
  logo_url?: string;
  header_config?: any;
  footer_config?: any;
}

export class PDFGeneratorArabic {
  private quotationData: QuotationData;
  private orgData: OrganizationData;
  private options: PDFGenerationOptions;

  constructor(quotationData: QuotationData, orgData: OrganizationData, options: PDFGenerationOptions = {}) {
    this.quotationData = quotationData;
    this.orgData = orgData;
    this.options = options;
  }

  async generatePDF(action: 'download' | 'print' = 'download'): Promise<void> {
    try {
      console.log('PDF Generation started with pdf-lib');
      console.log('Quotation data:', this.quotationData);
      console.log('Quotation data fields:', {
        id: this.quotationData._id,
        number: this.quotationData.quotation_number,
        customerId: this.quotationData.customer_id,
        customerName: this.quotationData.customer_name,
        date: this.quotationData.date,
        validUntil: this.quotationData.valid_until,
        currency: this.quotationData.currency,
        taxRate: this.quotationData.tax_rate,
        itemsCount: this.quotationData.items?.length || 0
      });
      console.log('Organization data:', this.orgData);
      console.log('Organization header config:', this.orgData.header_display_config);
      console.log('Organization footer config:', this.orgData.footer_display_config);
      console.log('Organization logo URL:', this.orgData.logo_url);

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = page.getSize();

      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Helper function to add text with proper alignment
      const addText = (text: string | undefined | null, x: number, y: number, options: any = {}) => {
        // Handle undefined/null text
        const safeText = text || '';
        
        const {
          fontSize = 12,
          font = helveticaFont,
          color = rgb(0, 0, 0),
          alignment = 'left'
        } = options;

        let textWidth = font.widthOfTextAtSize(safeText, fontSize);
        let finalX = x;

        if (alignment === 'center') {
          finalX = x - textWidth / 2;
        } else if (alignment === 'right') {
          finalX = x - textWidth;
        }

        page.drawText(safeText, {
          x: finalX,
          y: height - y,
          size: fontSize,
          font: font,
          color: color
        });
      };

      // Helper function to add Arabic text (right-aligned)
      const addArabicText = (text: string | undefined | null, x: number, y: number, options: any = {}) => {
        // Handle undefined/null text
        const safeText = text || '';
        
        const {
          fontSize = 12,
          font = helveticaFont,
          color = rgb(0, 0, 0)
        } = options;

        // For now, we'll use transliteration for Arabic text
        // TODO: Implement proper Arabic font embedding
        const transliteratedText = this.transliterateArabic(safeText);
        const textWidth = font.widthOfTextAtSize(transliteratedText, fontSize);
        
        page.drawText(transliteratedText, {
          x: x - textWidth, // Right-aligned
          y: height - y,
          size: fontSize,
          font: font,
          color: color
        });
        
        // Also log the original Arabic text for debugging
        if (safeText && /[\u0600-\u06FF]/.test(safeText)) {
          console.log('Arabic text detected:', safeText);
          console.log('Transliterated to:', transliteratedText);
        }
      };

      let currentY = 50;

      // Add header
      if (this.orgData.header_config?.logo && this.orgData.logo_url) {
        try {
          console.log('Adding logo from URL:', this.orgData.logo_url);
          const logoResponse = await fetch(this.orgData.logo_url);
          
          if (!logoResponse.ok) {
            throw new Error(`Failed to fetch logo: ${logoResponse.status} ${logoResponse.statusText}`);
          }
          
          const logoArrayBuffer = await logoResponse.arrayBuffer();
          console.log('Logo array buffer size:', logoArrayBuffer.byteLength);
          
          let logoImage;
          const contentType = logoResponse.headers.get('content-type');
          console.log('Logo content type:', contentType);
          
          if (contentType?.includes('png') || this.orgData.logo_url.includes('.png')) {
            logoImage = await pdfDoc.embedPng(logoArrayBuffer);
          } else if (contentType?.includes('jpeg') || contentType?.includes('jpg') || this.orgData.logo_url.includes('.jpg') || this.orgData.logo_url.includes('.jpeg')) {
            logoImage = await pdfDoc.embedJpg(logoArrayBuffer);
          } else {
            // Try PNG first, then JPEG
            try {
              logoImage = await pdfDoc.embedPng(logoArrayBuffer);
            } catch (pngError) {
              console.log('PNG embedding failed, trying JPEG:', pngError);
              logoImage = await pdfDoc.embedJpg(logoArrayBuffer);
            }
          }
          
          const logoWidth = 80;
          const logoHeight = (logoWidth * logoImage.height) / logoImage.width;
          const logoX = (width - logoWidth) / 2;
          
          page.drawImage(logoImage, {
            x: logoX,
            y: height - currentY - logoHeight,
            width: logoWidth,
            height: logoHeight
          });
          
          currentY += logoHeight + 20;
          console.log('Logo added successfully');
        } catch (error) {
          console.log('Failed to add logo:', error);
          console.log('Continuing without logo...');
        }
      }

      // Company name (English)
      if (this.orgData.header_config?.name && this.orgData.name) {
        addText(this.orgData.name, width / 2, currentY, { 
          fontSize: 16, 
          font: helveticaBold, 
          alignment: 'center' 
        });
        currentY += 20;
      }

      // Company name (Arabic)
      if (this.orgData.header_config?.name_arabic && this.orgData.name_arabic) {
        addArabicText(this.orgData.name_arabic, width / 2, currentY, { fontSize: 14 });
        currentY += 20;
      }

      // Company details in two columns
      const leftCol = 50;
      const rightCol = width - 50;

      // Left column (English)
      if (this.orgData.header_config?.address && this.orgData.address) {
        addText(`Address: ${this.orgData.address}`, leftCol, currentY, { fontSize: 10 });
      }

      // Right column (English)
      if (this.orgData.header_config?.vat_number && this.orgData.vat_number) {
        addText(`VAT: ${this.orgData.vat_number}`, rightCol, currentY, { fontSize: 10, alignment: 'right' });
      }
      currentY += 15;

      if (this.orgData.header_config?.cr_number && this.orgData.cr_number) {
        addText(`CR: ${this.orgData.cr_number}`, rightCol, currentY, { fontSize: 10, alignment: 'right' });
      }
      currentY += 15;

      // Arabic address
      if (this.orgData.header_config?.address_arabic && this.orgData.address_arabic) {
        addArabicText(this.orgData.address_arabic, rightCol, currentY, { fontSize: 10 });
      }
      currentY += 30;

      // Quotation title
      addText('QUOTATION', width / 2, currentY, { 
        fontSize: 24, 
        font: helveticaBold, 
        alignment: 'center' 
      });
      currentY += 30;

      // Quotation details
      addText(`Quotation No: ${this.quotationData.quotation_number || 'N/A'}`, leftCol, currentY, { fontSize: 10 });
      addText(`Date: ${this.quotationData.date ? new Date(this.quotationData.date).toLocaleDateString() : 'N/A'}`, rightCol, currentY, { fontSize: 10, alignment: 'right' });
      currentY += 15;

      if (this.quotationData.valid_until) {
        addText(`Valid Until: ${new Date(this.quotationData.valid_until).toLocaleDateString()}`, rightCol, currentY, { fontSize: 10, alignment: 'right' });
        currentY += 15;
      }

      // Bill To section
      addText('Bill To:', leftCol, currentY, { fontSize: 12, font: helveticaBold });
      currentY += 15;
      addText(this.quotationData.customer_name || 'N/A', leftCol, currentY, { fontSize: 10 });
      currentY += 25;

      // Items table header
      addText('Items', leftCol, currentY, { fontSize: 14, font: helveticaBold });
      currentY += 20;

      // Table headers
      const tableHeaders = ['#', 'Item & Description', 'Qty', 'Unit', 'Unit Price', 'Total', 'VAT Amount'];
      const columnWidths = [30, 200, 50, 50, 80, 80, 80];
      let tableX = leftCol;

      // Draw table header background
      page.drawRectangle({
        x: tableX,
        y: height - currentY - 15,
        width: columnWidths.reduce((sum, width) => sum + width, 0),
        height: 15,
        color: rgb(0.2, 0.2, 0.2)
      });

      // Draw table headers
      tableHeaders.forEach((header, index) => {
        addText(header, tableX + columnWidths[index] / 2, currentY + 5, { 
          fontSize: 9, 
          font: helveticaBold, 
          color: rgb(1, 1, 1),
          alignment: 'center' 
        });
        tableX += columnWidths[index];
      });

      currentY += 20;

      // Add items
      console.log('Items array:', this.quotationData.items);
      console.log('Items array length:', this.quotationData.items?.length || 0);
      
      // If no items, create a dummy item for testing
      const itemsToProcess = this.quotationData.items && this.quotationData.items.length > 0 
        ? this.quotationData.items 
        : [{
            inventory_name: 'Test Item',
            description: 'Test Item Description',
            quantity: 1,
            unit_price: 100,
            rate: 100,
            total_price: 100,
            amount: 100,
            vat_percentage: 15,
            vat_amount: 15
          }];
      
      if (itemsToProcess && itemsToProcess.length > 0) {
        itemsToProcess.forEach((item, index) => {
          console.log(`Processing item ${index}:`, item);
          console.log('Item fields:', {
            inventory_name: item.inventory_name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            rate: item.rate,
            total_price: item.total_price,
            amount: item.amount,
            vat_percentage: item.vat_percentage,
            vat_amount: item.vat_amount
          });
          
          const unitPrice = item.unit_price || item.rate || 0;
          const quantity = item.quantity || 0;
          const vatPercentage = item.vat_percentage || this.quotationData.tax_rate || 15;
          const vatAmount = (unitPrice * quantity * vatPercentage) / 100;
          const totalPrice = item.total_price || item.amount || (unitPrice * quantity);

          tableX = leftCol;
          
          // Item number
          addText((index + 1).toString(), tableX + 15, currentY, { fontSize: 9, alignment: 'center' });
          tableX += columnWidths[0];

          // Item description
          const description = item.inventory_name || item.description || 'N/A';
          addText(description, tableX + 10, currentY, { fontSize: 9 });
          tableX += columnWidths[1];

          // Quantity
          addText(quantity.toString(), tableX + 25, currentY, { fontSize: 9, alignment: 'center' });
          tableX += columnWidths[2];

          // Unit
          addText(item.unit || 'pcs', tableX + 25, currentY, { fontSize: 9, alignment: 'center' });
          tableX += columnWidths[3];

          // Unit Price
          addText(`${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${unitPrice.toFixed(2)}`, tableX + 40, currentY, { fontSize: 9, alignment: 'right' });
          tableX += columnWidths[4];

          // Total Amount
          addText(`${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${totalPrice.toFixed(2)}`, tableX + 40, currentY, { fontSize: 9, alignment: 'right' });
          tableX += columnWidths[5];

          // VAT Amount
          addText(`${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${vatAmount.toFixed(2)}`, tableX + 40, currentY, { fontSize: 9, alignment: 'right' });

          currentY += 15;
        });
      } else {
        addText('No items added to this quotation', leftCol, currentY, { fontSize: 10 });
        currentY += 20;
      }

      currentY += 20;

      // Summary section
      addText('Summary', leftCol, currentY, { fontSize: 14, font: helveticaBold });
      currentY += 20;

      // Calculate totals
      let subtotal = 0;
      let totalVat = 0;

      if (itemsToProcess && itemsToProcess.length > 0) {
        itemsToProcess.forEach(item => {
          const unitPrice = item.unit_price || item.rate || 0;
          const quantity = item.quantity || 0;
          const vatPercentage = item.vat_percentage || this.quotationData.tax_rate || 15;
          const itemTotal = item.total_price || item.amount || (unitPrice * quantity);
          const itemVat = (unitPrice * quantity * vatPercentage) / 100;

          subtotal += itemTotal;
          totalVat += itemVat;
        });
      }

      const total = subtotal + totalVat;

      // Summary details
      addText('Sub Total', rightCol - 100, currentY, { fontSize: 12, alignment: 'right' });
      addText(`${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${subtotal.toFixed(2)}`, rightCol, currentY, { fontSize: 12, alignment: 'right' });
      currentY += 15;

      addText(`VAT (${this.quotationData.tax_rate || 15}%)`, rightCol - 100, currentY, { fontSize: 12, alignment: 'right' });
      addText(`${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${totalVat.toFixed(2)}`, rightCol, currentY, { fontSize: 12, alignment: 'right' });
      currentY += 15;

      addText('Total', rightCol - 100, currentY, { fontSize: 14, font: helveticaBold, alignment: 'right' });
      addText(`${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${total.toFixed(2)}`, rightCol, currentY, { fontSize: 14, font: helveticaBold, alignment: 'right' });

      currentY += 30;

      // Footer
      if (this.orgData.footer_config?.email && this.orgData.email) {
        addText(`Email: ${this.orgData.email}`, leftCol, currentY, { fontSize: 10 });
      }

      if (this.orgData.footer_config?.phone && this.orgData.phone) {
        addText(`Phone: ${this.orgData.phone}`, rightCol, currentY, { fontSize: 10, alignment: 'right' });
      }
      currentY += 15;

      if (this.orgData.footer_config?.website && this.orgData.website) {
        addText(`Website: ${this.orgData.website}`, rightCol, currentY, { fontSize: 10, alignment: 'right' });
      }

      // Arabic footer text
      if (this.orgData.footer_config?.address_arabic && this.orgData.address_arabic) {
        addArabicText(this.orgData.address_arabic, rightCol, currentY + 15, { fontSize: 10 });
      }

      // Generate PDF
      const pdfBytes = await pdfDoc.save();

      if (action === 'download') {
        // Download the PDF
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quotation-${this.quotationData.quotation_number}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.options.onSuccess?.('PDF downloaded successfully');
      } else if (action === 'print') {
        // Open for printing
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url);
        if (newWindow) {
          newWindow.print();
        }
        URL.revokeObjectURL(url);
        this.options.onSuccess?.('PDF opened for printing');
      }

      console.log('PDF generated successfully with pdf-lib');

    } catch (error) {
      console.error('Error generating PDF with pdf-lib:', error);
      this.options.onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Transliteration method for Arabic text
  private transliterateArabic(text: string | undefined | null): string {
    if (!text) return '';
    
    const arabicMap: { [key: string]: string } = {
      'ا': 'A', 'أ': 'A', 'إ': 'I', 'آ': 'Aa', 'ء': "'",
      'ب': 'B', 'ت': 'T', 'ث': 'Th', 'ج': 'J', 'ح': 'H', 'خ': 'Kh',
      'د': 'D', 'ذ': 'Dh', 'ر': 'R', 'ز': 'Z', 'س': 'S', 'ش': 'Sh',
      'ص': 'S', 'ض': 'D', 'ط': 'T', 'ظ': 'Z', 'ع': 'A', 'غ': 'Gh',
      'ف': 'F', 'ق': 'Q', 'ك': 'K', 'ل': 'L', 'م': 'M', 'ن': 'N',
      'ه': 'H', 'ة': 'h', 'و': 'W', 'ؤ': 'W', 'ي': 'Y', 'ى': 'a',
      'ئ': 'Y', 'لا': 'La',
      '،': ', ', '؛': '; ', '؟': '? ', '۔': '. ', 'ـ': '-',
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
      'شركة': 'Shirkah', 'مقاولات': 'Muqawalat', 'تجارة': 'Tijarah',
      'رياض': 'Riyadh', 'مملكة': 'Mamlakah', 'عربية': 'Arabiyah',
      'سعودية': 'Saudiyah', 'واسط': 'Wasit', 'روابي': 'Rawabi'
    };

    return text
      .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, (char) => {
        return arabicMap[char] || char;
      })
      .replace(/\s+/g, ' ')
      .trim();
  }
}
