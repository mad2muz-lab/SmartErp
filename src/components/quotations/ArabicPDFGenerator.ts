import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export class ArabicPDFGenerator {
  private quotationData: QuotationData;
  private orgData: OrganizationData;
  private options: PDFGenerationOptions;
  private pdf: jsPDF | null = null;

  constructor(quotationData: QuotationData, orgData: OrganizationData, options: PDFGenerationOptions = {}) {
    this.quotationData = quotationData;
    this.orgData = orgData;
    this.options = options;
  }

  async generatePDF(action: 'download' | 'print' = 'download'): Promise<void> {
    try {
      console.log('Professional PDF Generation started with direct text rendering');
      console.log('Quotation data:', this.quotationData);
      console.log('Organization data:', this.orgData);

      // Create PDF with A4 size
      this.pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = this.pdf.internal.pageSize.getWidth();
      const pageHeight = this.pdf.internal.pageSize.getHeight();
      const margin = 15;
      let currentY = margin;

      // Set professional colors
      const primaryColor = [51, 51, 51]; // Dark gray
      const accentColor = [0, 123, 255]; // Blue

      // Helper function to add text with styling
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        const {
          fontSize = 10,
          fontStyle = 'normal',
          color = primaryColor,
          align = 'left'
        } = options;

        this.pdf!.setFontSize(fontSize);
        this.pdf!.setFont('helvetica', fontStyle);
        this.pdf!.setTextColor(color[0], color[1], color[2]);
        this.pdf!.text(text, x, y, { align });
      };

      // Helper function to add Arabic text (right-aligned)
      const addArabicText = (text: string, x: number, y: number, options: any = {}) => {
        const {
          fontSize = 10,
          fontStyle = 'normal',
          color = primaryColor
        } = options;

        // For Arabic text, we'll use transliteration for now
        const transliteratedText = this.transliterateArabic(text);
        
        this.pdf!.setFontSize(fontSize);
        this.pdf!.setFont('helvetica', fontStyle);
        this.pdf!.setTextColor(color[0], color[1], color[2]);
        
        // Right-align Arabic text
        const textWidth = this.pdf!.getTextWidth(transliteratedText);
        this.pdf!.text(transliteratedText, x - textWidth, y);
      };

      // Helper function to add logo
      const addLogo = async (logoUrl: string, x: number, y: number, width: number, height: number) => {
        try {
          const response = await fetch(logoUrl);
          if (!response.ok) throw new Error('Failed to fetch logo');
          
          const blob = await response.blob();
          const reader = new FileReader();
          
          return new Promise<void>((resolve, reject) => {
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                this.pdf!.addImage(reader.result, 'PNG', x, y, width, height);
                console.log('Logo added successfully');
                resolve();
              } else {
                reject(new Error('Failed to convert logo'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.log('Failed to add logo:', error);
          throw error;
        }
      };

      // Add professional header
      currentY = await this.addProfessionalHeader(currentY, pageWidth, margin, addLogo, addText, addArabicText);
      
      // Add quotation title with styling
      currentY += 10;
      addText('QUOTATION', pageWidth / 2, currentY, { 
        fontSize: 14, 
        fontStyle: 'bold', 
        color: accentColor,
        align: 'center' 
      });
      currentY += 8;

      // Add quotation details in a professional layout
      currentY = this.addQuotationDetails(currentY, pageWidth, margin, addText);
      
      // Add customer section
      currentY = this.addCustomerSection(currentY, pageWidth, margin, addText);
      
      // Add professional items table
      currentY = this.addProfessionalItemsTable(currentY, pageWidth, margin);
      
      // Add professional summary
      currentY = this.addProfessionalSummary(currentY, pageWidth, margin, addText);
      
      // Add professional footer
      this.addProfessionalFooter(pageHeight, pageWidth, margin, addText, addArabicText);

      // Generate PDF
      if (action === 'download') {
        const fileName = `quotation-${this.quotationData.quotation_number}-${new Date().toISOString().split('T')[0]}.pdf`;
        this.pdf.save(fileName);
        this.options.onSuccess?.('Professional PDF downloaded successfully');
      } else if (action === 'print') {
        this.pdf.autoPrint();
        this.pdf.output('dataurlnewwindow');
        this.options.onSuccess?.('Professional PDF opened for printing');
      }

      console.log('Professional PDF generated successfully');

    } catch (error) {
      console.error('Error generating professional PDF:', error);
      this.options.onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async addProfessionalHeader(currentY: number, pageWidth: number, margin: number, addLogo: any, addText: any, addArabicText: any): Promise<number> {
    const headerY = currentY;
    
    // Calculate column widths
    const leftCol = margin;
    const rightCol = pageWidth - margin;
    const centerX = pageWidth / 2;
    
    // Add logo if available (centered)
    if (this.orgData.header_config?.logo && this.orgData.logo_url) {
      try {
        const logoWidth = 40;
        const logoHeight = 30;
        const logoX = centerX - logoWidth / 2;
        await addLogo(this.orgData.logo_url, logoX, headerY, logoWidth, logoHeight);
        currentY += logoHeight + 5;
      } catch (error) {
        console.log('Logo not added, continuing...');
      }
    }

    // Company name (English) - Left side
    if (this.orgData.header_config?.name && this.orgData.name) {
      addText(this.orgData.name, leftCol, currentY, { 
        fontSize: 10, 
        fontStyle: 'bold',
        color: [51, 51, 51]
      });
    }

    // Company name (Arabic) - Right side
    if (this.orgData.header_config?.name_arabic && this.orgData.name_arabic) {
      addArabicText(this.orgData.name_arabic, rightCol, currentY, { 
        fontSize: 10,
        color: [51, 51, 51]
      });
    }
    currentY += 6;

    // Company details in two columns
    // Left column (English)
    if (this.orgData.header_config?.address && this.orgData.address) {
      addText(`📍 ${this.orgData.address}`, leftCol, currentY, { fontSize: 10 });
    }
    if (this.orgData.header_config?.email && this.orgData.email) {
      addText(`📧 ${this.orgData.email}`, leftCol, currentY + 4, { fontSize: 10 });
    }
    if (this.orgData.header_config?.phone && this.orgData.phone) {
      addText(`📞 ${this.orgData.phone}`, leftCol, currentY + 8, { fontSize: 10 });
    }

    // Right column (English)
    if (this.orgData.header_config?.vat_number && this.orgData.vat_number) {
      addText(`VAT: ${this.orgData.vat_number}`, rightCol, currentY, { fontSize: 10, align: 'right' });
    }
    if (this.orgData.header_config?.cr_number && this.orgData.cr_number) {
      addText(`CR: ${this.orgData.cr_number}`, rightCol, currentY + 4, { fontSize: 10, align: 'right' });
    }
    if (this.orgData.header_config?.website && this.orgData.website) {
      addText(`🌐 ${this.orgData.website}`, rightCol, currentY + 8, { fontSize: 10, align: 'right' });
    }
    currentY += 8;

    // Arabic address
    if (this.orgData.header_config?.address_arabic && this.orgData.address_arabic) {
      addArabicText(this.orgData.address_arabic, rightCol, currentY, { fontSize: 10 });
    }
    currentY += 8;

    // Add separator line
    this.pdf!.setDrawColor(0, 123, 255);
    this.pdf!.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    return currentY;
  }

  private addQuotationDetails(currentY: number, pageWidth: number, margin: number, addText: any): number {
    const leftCol = margin;
    const rightCol = pageWidth - margin;

    // Quotation number
    addText(`Quotation No: ${this.quotationData.quotation_number}`, leftCol, currentY, { 
      fontSize: 10, 
      fontStyle: 'bold',
      color: [51, 51, 51]
    });

    // Date
    const dateText = this.quotationData.date ? new Date(this.quotationData.date).toLocaleDateString() : 'N/A';
    addText(`Date: ${dateText}`, rightCol, currentY, { 
      fontSize: 10, 
      align: 'right',
      color: [51, 51, 51]
    });
    currentY += 5;

    // Valid until
    if (this.quotationData.valid_until) {
      addText(`Valid Until: ${new Date(this.quotationData.valid_until).toLocaleDateString()}`, rightCol, currentY, { 
        fontSize: 10, 
        align: 'right',
        color: [51, 51, 51]
      });
      currentY += 5;
    }

    return currentY;
  }

  private addCustomerSection(currentY: number, pageWidth: number, margin: number, addText: any): number {
    currentY += 8;

    // Customer section header
    addText('Bill To:', margin, currentY, { 
      fontSize: 10, 
      fontStyle: 'bold',
      color: [51, 51, 51]
    });
    currentY += 5;

    // Customer name
    addText(this.quotationData.customer_name || 'N/A', margin, currentY, { 
      fontSize: 10,
      color: [51, 51, 51]
    });
    currentY += 8;

    return currentY;
  }

  private addProfessionalItemsTable(currentY: number, pageWidth: number, margin: number): number {
    // Items section header
    this.pdf!.setFontSize(10);
    this.pdf!.setFont('helvetica', 'bold');
    this.pdf!.setTextColor(51, 51, 51);
    this.pdf!.text('Items', margin, currentY);
    currentY += 5;

    // Prepare table data
    const tableData = [];
    if (this.quotationData.items && this.quotationData.items.length > 0) {
      this.quotationData.items.forEach((item, index) => {
        const unitPrice = item.unit_price || item.rate || 0;
        const quantity = item.quantity || 0;
        const vatPercentage = item.vat_percentage || this.quotationData.tax_rate || 15;
        const vatAmount = (unitPrice * quantity * vatPercentage) / 100;
        const totalPrice = item.total_price || item.amount || (unitPrice * quantity);

        tableData.push([
          (index + 1).toString(),
          item.inventory_name || item.description || 'N/A',
          quantity.toString(),
          `${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${unitPrice.toFixed(2)}`,
          `${vatPercentage}%`,
          `${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${vatAmount.toFixed(2)}`,
          `${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${totalPrice.toFixed(2)}`
        ]);
      });
    } else {
      tableData.push(['No items added to this quotation']);
    }

    // Add professional table
    autoTable(this.pdf!, {
      head: [['#', 'Item & Description', 'Qty', 'Rate', 'VAT %', 'VAT Amount', 'Amount']],
      body: tableData,
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 25 },
        6: { halign: 'right', cellWidth: 25 }
      }
    });

    // Get the Y position after the table
    return (this.pdf as any).lastAutoTable.finalY + 8;
  }

  private addProfessionalSummary(currentY: number, pageWidth: number, margin: number, addText: any): number {
    // Summary section header
    addText('Summary', margin, currentY, { 
      fontSize: 10, 
      fontStyle: 'bold',
      color: [51, 51, 51]
    });
    currentY += 8;

    // Calculate totals
    let subtotal = 0;
    let totalVat = 0;

    if (this.quotationData.items && this.quotationData.items.length > 0) {
      this.quotationData.items.forEach(item => {
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
    const rightCol = pageWidth - margin;

    // Summary details with professional styling
    addText('Sub Total', rightCol - 60, currentY, { fontSize: 10, align: 'right' });
    addText(`${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${subtotal.toFixed(2)}`, rightCol, currentY, { fontSize: 10, align: 'right' });
    currentY += 5;

    addText(`VAT (${this.quotationData.tax_rate || 15}%)`, rightCol - 60, currentY, { fontSize: 10, align: 'right' });
    addText(`${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${totalVat.toFixed(2)}`, rightCol, currentY, { fontSize: 10, align: 'right' });
    currentY += 5;

    // Total with emphasis
    addText('Total', rightCol - 60, currentY, { 
      fontSize: 12, 
      fontStyle: 'bold',
      color: [0, 123, 255],
      align: 'right' 
    });
    addText(`${this.quotationData.currency === 'SAR' || !this.quotationData.currency ? '\uE900' : this.quotationData.currency} ${total.toFixed(2)}`, rightCol, currentY, { 
      fontSize: 12, 
      fontStyle: 'bold',
      color: [0, 123, 255],
      align: 'right' 
    });

    return currentY + 10;
  }

  private addProfessionalFooter(pageHeight: number, pageWidth: number, margin: number, addText: any, addArabicText: any): void {
    const footerY = pageHeight - margin;

    // Add separator line
    this.pdf!.setDrawColor(200, 200, 200);
    this.pdf!.line(margin, footerY - 15, pageWidth - margin, footerY - 15);

    // Footer content
    const leftCol = margin;
    const rightCol = pageWidth - margin;

    // Left column
    if (this.orgData.footer_config?.email && this.orgData.email) {
      addText(`📧 ${this.orgData.email}`, leftCol, footerY - 10, { fontSize: 10 });
    }
    if (this.orgData.footer_config?.name && this.orgData.name) {
      addText(this.orgData.name, leftCol, footerY - 5, { fontSize: 10 });
    }

    // Right column
    if (this.orgData.footer_config?.phone && this.orgData.phone) {
      addText(`📞 ${this.orgData.phone}`, rightCol, footerY - 10, { fontSize: 10, align: 'right' });
    }
    if (this.orgData.footer_config?.website && this.orgData.website) {
      addText(`🌐 ${this.orgData.website}`, rightCol, footerY - 5, { fontSize: 10, align: 'right' });
    }

    // Arabic footer text
    if (this.orgData.footer_config?.address_arabic && this.orgData.address_arabic) {
      addArabicText(this.orgData.address_arabic, rightCol, footerY, { fontSize: 10 });
    }
  }

  // Enhanced transliteration method
  private transliterateArabic(text: string): string {
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
