import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '@fontsource/noto-sans-arabic';

// Arabic text preprocessing function
const preprocessArabicText = (text: string): string => {
  // Replace problematic characters with their proper equivalents
  const arabicCharMap: { [key: string]: string } = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '،': ',', '؛': ';', '؟': '?', '۔': '.', 'ـ': '-',
    'ء': "'", 'آ': 'آ', 'أ': 'أ', 'إ': 'إ', 'ا': 'ا',
    'ب': 'ب', 'ت': 'ت', 'ث': 'ث', 'ج': 'ج', 'ح': 'ح',
    'خ': 'خ', 'د': 'د', 'ذ': 'ذ', 'ر': 'ر', 'ز': 'ز',
    'س': 'س', 'ش': 'ش', 'ص': 'ص', 'ض': 'ض', 'ط': 'ط',
    'ظ': 'ظ', 'ع': 'ع', 'غ': 'غ', 'ف': 'ف', 'ق': 'ق',
    'ك': 'ك', 'ل': 'ل', 'م': 'م', 'ن': 'ن', 'ه': 'ه',
    'ة': 'ة', 'و': 'و', 'ؤ': 'ؤ', 'ي': 'ي', 'ى': 'ى',
    'ئ': 'ئ', 'لا': 'لا'
  };
  
  return text.split('').map(char => arabicCharMap[char] || char).join('');
};

export interface PDFGenerationOptions {
  quotation: any;
  organizationDetails: any;
  customers: any[];
  getFileUrl: (params: { fileId: string }) => Promise<string | null>;
  getQuotationItemsForPDF: (params: { quotation_id: string }) => Promise<any[]>;
  action: 'download' | 'print';
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export class PDFGenerator {
  private pdf: jsPDF | null = null;
  private pageWidth: number = 210; // A4 width in mm
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 20;
  private fontSize: number = 12;
  private currentY: number = 20;

  // Helper function to check if text contains Arabic characters
  private containsArabic(text: string): boolean {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const hasArabic = arabicRegex.test(text);
    if (hasArabic) {
      console.log('Arabic text detected:', text);
    }
    return hasArabic;
  }

  // Helper function to add text with proper alignment
  private addText(text: string, x: number, y: number, options: any = {}) {
    if (!this.pdf) return;

    const {
      fontSize = this.fontSize,
      align = 'left',
      color = [0, 0, 0],
      font = 'helvetica'
    } = options;

    this.pdf.setFontSize(fontSize);
    this.pdf.setTextColor(color[0], color[1], color[2]);

    if (this.containsArabic(text)) {
      console.log('Rendering Arabic text:', text);
      
      // Simple approach: try to render Arabic text directly
      try {
        // Use Times font which has better Unicode support
        this.pdf.setFont('times', 'normal');
        this.pdf.text(text, x, y, { align: 'right' });
        console.log('Arabic text rendered successfully');
      } catch (error) {
        console.log('Arabic rendering failed, using transliteration');
        // Fallback to transliteration
        const transliteratedText = this.transliterateArabic(text);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.text(transliteratedText, x, y, { align: 'right' });
      }
    } else {
      // For English text, use normal alignment
      this.pdf.setFont(font, 'normal');
      this.pdf.text(text, x, y, { align });
    }
  }



  // Enhanced transliteration method with better Arabic handling
  private transliterateArabic(text: string): string {
    // More comprehensive Arabic to English mapping
    const arabicMap: { [key: string]: string } = {
      // Basic letters
      'ا': 'A', 'أ': 'A', 'إ': 'I', 'آ': 'Aa', 'ء': "'",
      'ب': 'B', 'ت': 'T', 'ث': 'Th', 'ج': 'J', 'ح': 'H', 'خ': 'Kh',
      'د': 'D', 'ذ': 'Dh', 'ر': 'R', 'ز': 'Z', 'س': 'S', 'ش': 'Sh',
      'ص': 'S', 'ض': 'D', 'ط': 'T', 'ظ': 'Z', 'ع': 'A', 'غ': 'Gh',
      'ف': 'F', 'ق': 'Q', 'ك': 'K', 'ل': 'L', 'م': 'M', 'ن': 'N',
      'ه': 'H', 'ة': 'h', 'و': 'W', 'ؤ': 'W', 'ي': 'Y', 'ى': 'a',
      'ئ': 'Y', 'لا': 'La',
      
      // Punctuation and numbers
      '،': ', ', '؛': '; ', '؟': '? ', '۔': '. ', 'ـ': '-',
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
      
      // Common words and phrases
      'شركة': 'Shirkah', 'مقاولات': 'Muqawalat', 'تجارة': 'Tijarah',
      'رياض': 'Riyadh', 'مملكة': 'Mamlakah', 'عربية': 'Arabiyah',
      'سعودية': 'Saudiyah', 'واسط': 'Wasit', 'روابي': 'Rawabi',
      'للمقاولات': 'Lil-Muqawalat', 'والتجارة': 'Wal-Tijarah',
      'المملكة': 'Al-Mamlakah', 'العربية': 'Al-Arabiyah',
      'السعودية': 'Al-Saudiyah'
    };
    
    // First, try to replace common phrases
    let result = text;
    for (const [arabic, english] of Object.entries(arabicMap)) {
      result = result.replace(new RegExp(arabic, 'g'), english);
    }
    
    // Then handle any remaining Arabic characters
    result = result.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, (char) => {
      return arabicMap[char] || char;
    });
    
    // Clean up extra spaces
    result = result.replace(/\s+/g, ' ').trim();
    
    console.log('Transliteration result:', { original: text, transliterated: result });
    return result;
  }

  // Helper function to add logo
  private async addLogo(logoUrl: string, x: number, y: number, width: number = 30, height: number = 20) {
    if (!this.pdf) return;

    try {
      const response = await fetch(logoUrl);
      if (response.ok) {
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        this.pdf.addImage(
          `data:${blob.type};base64,${base64}`,
          'JPEG',
          x,
          y,
          width,
          height
        );
        console.log('Logo added successfully');
      }
    } catch (error) {
      console.log('Logo loading failed:', error);
      // Add placeholder text
      this.addText('LOGO', x + width/2, y + height/2, { align: 'center', fontSize: 8 });
    }
  }

  // Helper function to add header
  private async addHeader(org: any, getFileUrl: (params: { fileId: string }) => Promise<string | null>) {
    if (!this.pdf) return;

    let yPos = this.margin;
    
    console.log('Organization details for header:', org);
    if (org.header_display_config) {
      const headerConfig = org.header_display_config;
      console.log('Header config:', headerConfig);
      
      // Logo (if enabled and available)
      if (headerConfig.logo && org.logo_url) {
        console.log('Logo check:', { 
          headerConfigLogo: headerConfig.logo, 
          orgLogoUrl: org.logo_url, 
          logoUrlType: typeof org.logo_url 
        });
        
        try {
          console.log('Getting logo URL for fileId:', org.logo_url);
          const logoUrl = await getFileUrl({ fileId: org.logo_url });
          console.log('Logo URL received:', logoUrl);
          
          if (logoUrl) {
            console.log('Adding logo from URL:', logoUrl);
            await this.addLogo(logoUrl, this.pageWidth/2 - 15, yPos, 30, 20);
            yPos += 25;
          }
        } catch (error) {
          console.log('Logo loading failed:', error);
        }
      }
      
      // Organization name (English) - Left aligned
      if (headerConfig.name && org.name) {
        this.addText(org.name, this.margin, yPos, { fontSize: 16 });
        yPos += 10;
      }
      
      // Organization name (Arabic) - Right aligned
      if (headerConfig.name_arabic && org.name_arabic) {
        this.addText(org.name_arabic, this.pageWidth - this.margin, yPos, { align: 'right', fontSize: 14 });
        yPos += 10;
      }
      
      // Contact information in two columns
      const leftCol = this.margin;
      const rightCol = this.pageWidth - this.margin;
      
      // Left column (English content)
      if (headerConfig.email && org.email) {
        this.addText(`Email: ${org.email}`, leftCol, yPos, { fontSize: 9 });
      }
      
      if (headerConfig.phone && org.phone) {
        this.addText(`Phone: ${org.phone}`, leftCol, yPos + 5, { fontSize: 9 });
      }
      
      if (headerConfig.address && org.address) {
        this.addText(`Address: ${org.address}`, leftCol, yPos + 10, { fontSize: 9 });
      }
      
      // Right column (English content)
      if (headerConfig.website && org.website) {
        this.addText(`Website: ${org.website}`, rightCol, yPos, { align: 'right', fontSize: 9 });
      }
      
      if (headerConfig.vat_number && org.vat_number) {
        this.addText(`VAT: ${org.vat_number}`, rightCol, yPos + 5, { align: 'right', fontSize: 9 });
      }
      
      if (headerConfig.cr_number && org.cr_number) {
        this.addText(`CR: ${org.cr_number}`, rightCol, yPos + 10, { align: 'right', fontSize: 9 });
      }
      
      // Arabic content (right-aligned)
      if (headerConfig.address_arabic && org.address_arabic) {
        this.addText(org.address_arabic, rightCol, yPos + 15, { align: 'right', fontSize: 9 });
      }
      
      if (headerConfig.vat_number_arabic && org.vat_number_arabic) {
        this.addText(org.vat_number_arabic, rightCol, yPos + 20, { align: 'right', fontSize: 9 });
      }
      
      if (headerConfig.cr_number_arabic && org.cr_number_arabic) {
        this.addText(org.cr_number_arabic, rightCol, yPos + 25, { align: 'right', fontSize: 9 });
      }
      
      yPos += 30;
    }
    
    this.currentY = yPos;
  }

  // Helper function to add footer
  private addFooter(org: any) {
    if (!this.pdf) return;

    const footerY = this.pageHeight - this.margin;
    
    // Add separator line
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, footerY - 10, this.pageWidth - this.margin, footerY - 10);
    
    if (org.footer_display_config) {
      const footerConfig = org.footer_display_config;
      
      const leftCol = this.margin;
      const rightCol = this.pageWidth - this.margin;
      
      // Left column (English content)
      if (footerConfig.name && org.name) {
        this.addText(org.name, leftCol, footerY, { fontSize: 8 });
      }
      
      if (footerConfig.email && org.email) {
        this.addText(`Email: ${org.email}`, leftCol, footerY + 5, { fontSize: 8 });
      }
      
      // Right column (English content)
      if (footerConfig.phone && org.phone) {
        this.addText(`Phone: ${org.phone}`, rightCol, footerY, { align: 'right', fontSize: 8 });
      }
      
      if (footerConfig.website && org.website) {
        this.addText(`Website: ${org.website}`, rightCol, footerY + 5, { align: 'right', fontSize: 8 });
      }
      
      // Arabic content (right-aligned)
      if (footerConfig.name_arabic && org.name_arabic) {
        this.addText(org.name_arabic, rightCol, footerY + 10, { align: 'right', fontSize: 8 });
      }
      
      if (footerConfig.address_arabic && org.address_arabic) {
        this.addText(org.address_arabic, rightCol, footerY + 15, { align: 'right', fontSize: 8 });
      }
      
      if (footerConfig.vat_number_arabic && org.vat_number_arabic) {
        this.addText(org.vat_number_arabic, rightCol, footerY + 20, { align: 'right', fontSize: 8 });
      }
      
      if (footerConfig.cr_number_arabic && org.cr_number_arabic) {
        this.addText(org.cr_number_arabic, rightCol, footerY + 25, { align: 'right', fontSize: 8 });
      }
    }
    
    // Page number
    this.addText(`Page 1`, this.pageWidth - this.margin, footerY + 5, { align: 'right', fontSize: 8 });
  }

  // Main PDF generation method
  public async generatePDF(options: PDFGenerationOptions) {
    try {
      const { quotation, organizationDetails, customers, getFileUrl, getQuotationItemsForPDF, action, onSuccess } = options;
      
      console.log('PDF Generation started with:', {
        quotationNumber: quotation?.quotation_number,
        orgName: organizationDetails?.name,
        orgNameArabic: organizationDetails?.name_arabic,
        orgAddressArabic: organizationDetails?.address_arabic,
        orgVatArabic: organizationDetails?.vat_number_arabic,
        orgLogoUrl: organizationDetails?.logo_url,
        headerConfig: organizationDetails?.header_display_config
      });

      // Validate inputs
      if (!quotation) {
        throw new Error('Invalid quotation data');
      }

      if (!organizationDetails) {
        throw new Error('Organization not found');
      }

      // Create PDF document with better font support
      this.pdf = new jsPDF('p', 'mm', 'a4');
      
      // Initialize with default fonts - no external font loading to avoid 404 errors
      console.log('PDF initialized with default fonts');
      
      this.currentY = this.margin;

      // Get customer details
      const customer = customers?.find(c => c._id === quotation.customer_id);
      const customerName = customer?.customer_company_name || quotation.customer_name || 'N/A';
      const customerAddress = customer?.address || '';

      // Use items passed from the caller instead of calling the action again
      const quotationItemsForPDF = quotation.items || [];

      // Add header
      await this.addHeader(organizationDetails, getFileUrl);
      
      // Quotation title
      this.addText('QUOTATION', this.pageWidth / 2, this.currentY, { 
        align: 'center', 
        fontSize: 24 
      });
      this.currentY += 15;
      
      // Quotation details
      const leftCol = this.margin;
      const rightCol = this.margin + 100;
      
      this.addText(`Quotation No: ${quotation.quotation_number}`, leftCol, this.currentY, { fontSize: 10 });
      this.addText(`Date: ${new Date().toLocaleDateString()}`, rightCol, this.currentY, { fontSize: 10 });
      this.currentY += 8;
      
      if (quotation.valid_until) {
        this.addText(`Valid Until: ${new Date(quotation.valid_until).toLocaleDateString()}`, rightCol, this.currentY, { fontSize: 10 });
        this.currentY += 8;
      }
      
      // Bill To section
      this.addText('Bill To:', this.margin, this.currentY, { fontSize: 12 });
      this.currentY += 8;
      
      this.addText(customerName, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 6;
      
      if (customerAddress) {
        this.addText(customerAddress, this.margin, this.currentY, { fontSize: 10 });
        this.currentY += 6;
      }
      
      this.currentY += 10;
      
      // Items table header
      this.addText('Items', this.margin, this.currentY, { fontSize: 14 });
      this.currentY += 10;
      
      // Prepare table data
      console.log('Quotation items for PDF:', quotationItemsForPDF);
      const tableData = [];
      if (quotationItemsForPDF && quotationItemsForPDF.length > 0) {
        for (let index = 0; index < quotationItemsForPDF.length; index++) {
          const item = quotationItemsForPDF[index];
          console.log('Processing item:', item);
          
          // Calculate VAT amount properly
          const unitPrice = item.unit_price || item.rate || 0;
          const quantity = item.quantity || 0;
          const vatPercentage = item.vat_percentage || quotation.tax_rate || 15;
          const vatAmount = (unitPrice * quantity * vatPercentage) / 100;
          const totalPrice = item.total_price || item.amount || (unitPrice * quantity);
          
          tableData.push([
            (index + 1).toString(),
            item.inventory_name || item.description || 'N/A',
            quantity.toString(),
            item.unit || 'pcs',
            `${quotation.currency} ${unitPrice.toFixed(2)}`,
            `${quotation.currency} ${totalPrice.toFixed(2)}`,
            `${quotation.currency} ${vatAmount.toFixed(2)}`
          ]);
        }
      } else {
        tableData.push(['No items added to this quotation']);
      }
      
             // Add table
       autoTable(this.pdf, {
         head: [['#', 'Item & Description', 'Qty', 'Unit', 'Unit Price', 'Total', 'VAT Amount']],
         body: tableData,
         startY: this.currentY,
         margin: { left: this.margin },
         styles: {
           fontSize: 9,
           cellPadding: 3
         },
         headStyles: {
           fillColor: [51, 51, 51],
           textColor: 255,
           fontStyle: 'bold'
         }
       });
       
       // Get the Y position after the table
       this.currentY = (this.pdf as any).lastAutoTable.finalY + 10;
      
      // Summary section
      this.addText('Summary', this.margin, this.currentY, { fontSize: 14 });
      this.currentY += 10;
      
      // Calculate totals
      let subtotal = 0;
      let totalVat = 0;
      
      if (quotationItemsForPDF && quotationItemsForPDF.length > 0) {
        for (const item of quotationItemsForPDF) {
          const unitPrice = item.unit_price || item.rate || 0;
          const quantity = item.quantity || 0;
          const vatPercentage = item.vat_percentage || quotation.tax_rate || 15;
          const itemTotal = item.total_price || item.amount || (unitPrice * quantity);
          const itemVat = (unitPrice * quantity * vatPercentage) / 100;
          
          subtotal += itemTotal;
          totalVat += itemVat;
        }
      }
      
      const total = subtotal + totalVat;
      
      const summaryData = [
        { label: 'Sub Total', value: `${quotation.currency} ${subtotal.toFixed(2)}` },
        { label: `VAT (${quotation.tax_rate}%)`, value: `${quotation.currency} ${totalVat.toFixed(2)}` },
        { label: 'Total', value: `${quotation.currency} ${total.toFixed(2)}` }
      ];
      
      summaryData.forEach((item, index) => {
        const isTotal = index === summaryData.length - 1;
        
        this.addText(item.label, this.pageWidth - this.margin - 80, this.currentY, { 
          align: 'right', 
          fontSize: isTotal ? 14 : 12 
        });
        
        this.addText(item.value, this.pageWidth - this.margin, this.currentY, { 
          align: 'right', 
          fontSize: isTotal ? 14 : 12 
        });
        
        this.currentY += 8;
      });
      
      // Add footer
      this.addFooter(organizationDetails);
      
      // Save or print the PDF
      if (action === 'download') {
        const fileName = `quotation_${quotation.quotation_number}_${new Date().toISOString().split('T')[0]}.pdf`;
        this.pdf.save(fileName);
        onSuccess('PDF downloaded successfully');
      } else if (action === 'print') {
        this.pdf.autoPrint();
        this.pdf.output('dataurlnewwindow');
        onSuccess('PDF opened for printing');
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      options.onError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
