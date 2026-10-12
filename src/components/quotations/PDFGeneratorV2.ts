// Import pdfmake only in browser environment
let pdfMake: any = null;

if (typeof window !== 'undefined') {
  // Dynamic import to avoid SSR issues
  import('pdfmake/build/pdfmake').then((module) => {
    pdfMake = module.default;
    return import('pdfmake/build/vfs_fonts');
  }).then((pdfFonts) => {
    if (pdfMake && pdfFonts.pdfMake) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs;
    }
  }).catch((error) => {
    console.warn('Failed to initialize pdfmake:', error);
  });
}

export interface PDFGenerationOptions {
  onSuccess?: (fileName: string) => void;
  onError?: (error: string) => void;
}

export interface QuotationData {
  quotationNumber: string;
  date: string;
  validUntil: string;
  customerName: string;
  customerAddress: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    vatPercentage: number;
    vatAmount: number;
    amount: number;
  }>;
  subTotal: number;
  vatAmount: number;
  total: number;
}

export interface OrganizationData {
  name: string;
  nameArabic: string;
  address: string;
  addressArabic: string;
  vat: string;
  vatArabic: string;
  cr: string;
  email: string;
  phone: string;
  website: string;
  logo_url?: string;
}

export class PDFGeneratorV2 {
  private quotationData: QuotationData;
  private orgData: OrganizationData;
  private options: PDFGenerationOptions;

  constructor(quotationData: QuotationData, orgData: OrganizationData, options: PDFGenerationOptions = {}) {
    this.quotationData = quotationData;
    this.orgData = orgData;
    this.options = options;
  }

  async generatePDF(): Promise<void> {
    try {
      console.log('PDF Generation started with pdfmake');
      
      // Check if pdfMake is available
      if (!pdfMake) {
        throw new Error('pdfMake is not initialized. Please wait a moment and try again.');
      }
      
      // Define document content
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        defaultStyle: {
          font: 'Roboto',
          fontSize: 10
        },
        // Add Arabic font support
        fonts: {
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf'
          }
        },
        content: [
          // Header
          await this.createHeader(),
          { text: '', margin: [0, 20, 0, 20] },
          
          // Quotation Title
          { text: 'QUOTATION', style: 'quotationTitle', alignment: 'center' },
          { text: '', margin: [0, 10, 0, 10] },
          
          // Quotation Details
          this.createQuotationDetails(),
          { text: '', margin: [0, 15, 0, 15] },
          
          // Bill To Section
          this.createBillToSection(),
          { text: '', margin: [0, 15, 0, 15] },
          
          // Items Table
          this.createItemsTable(),
          { text: '', margin: [0, 15, 0, 15] },
          
          // Summary
          this.createSummarySection(),
          { text: '', margin: [0, 20, 0, 20] },
          
          // Footer
          this.createFooter()
        ],
        styles: {
          quotationTitle: {
            fontSize: 24,
            bold: true,
            margin: [0, 0, 0, 20]
          },
          headerText: {
            fontSize: 12,
            bold: true
          },
          arabicText: {
            fontSize: 12,
            alignment: 'right',
            font: 'Roboto'
          },
          englishText: {
            fontSize: 12,
            alignment: 'left'
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'white',
            fillColor: '#2c3e50'
          },
          summaryLabel: {
            fontSize: 12,
            bold: true
          },
          summaryValue: {
            fontSize: 12,
            alignment: 'right'
          }
        }
      };

      // Generate PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Download the PDF
      const fileName = `quotation-${this.quotationData.quotationNumber}.pdf`;
      pdfDoc.download(fileName);
      
      console.log('PDF generated successfully with pdfmake');
      this.options.onSuccess?.(fileName);
      
    } catch (error) {
      console.error('Error generating PDF with pdfmake:', error);
      this.options.onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async createHeader() {
    const headerContent = [];
    
    // Company Logo (if available)
    if (this.orgData.logo_url) {
      try {
        console.log('Attempting to load logo from:', this.orgData.logo_url);
        // Convert logo URL to data URL for pdfmake
        const logoDataUrl = await this.convertImageToDataUrl(this.orgData.logo_url);
        console.log('Logo converted successfully, adding to header');
        headerContent.push({
          image: logoDataUrl,
          width: 80,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        });
      } catch (error) {
        console.warn('Failed to load logo, continuing without it:', error);
        // Continue without logo if it fails to load
      }
    } else {
      console.log('No logo URL provided, skipping logo');
    }
    
    // Company Name (English and Arabic)
    console.log('Arabic company name:', this.orgData.nameArabic);
    headerContent.push(
      { text: this.orgData.name, style: 'headerText', alignment: 'center' },
      { text: this.orgData.nameArabic, style: 'arabicText', alignment: 'center' },
      { text: '', margin: [0, 5, 0, 5] }
    );
    
    // Company Details in two columns
    headerContent.push({
      columns: [
        // Left column - English
        {
          width: '*',
          text: [
            { text: `Address: ${this.orgData.address}`, style: 'englishText' }
          ]
        },
        // Right column - Arabic and VAT/CR
        {
          width: '*',
          text: [
            { text: `VAT: ${this.orgData.vat}`, style: 'englishText', alignment: 'right' },
            { text: `CR: ${this.orgData.cr}`, style: 'englishText', alignment: 'right' },
            { text: this.orgData.addressArabic, style: 'arabicText' }
          ]
        }
      ]
    });
    
    return headerContent;
  }

  private createQuotationDetails() {
    return {
      columns: [
        {
          width: '*',
          text: `Quotation No: ${this.quotationData.quotationNumber}`
        },
        {
          width: '*',
          text: [
            { text: `Date: ${this.quotationData.date}`, alignment: 'right' },
            { text: `Valid Until: ${this.quotationData.validUntil}`, alignment: 'right' }
          ]
        }
      ]
    };
  }

  private createBillToSection() {
    return {
      text: [
        { text: 'Bill To: ', bold: true },
        { text: this.quotationData.customerName },
        { text: '\n' + this.quotationData.customerAddress }
      ]
    };
  }

  private createItemsTable() {
    const tableBody = [
      // Header row
      [
        { text: '#', style: 'tableHeader' },
        { text: 'Item & Description', style: 'tableHeader' },
        { text: 'Qty', style: 'tableHeader' },
        { text: 'Unit', style: 'tableHeader' },
        { text: 'Unit Price', style: 'tableHeader' },
        { text: 'Total', style: 'tableHeader' },
        { text: 'VAT Amount', style: 'tableHeader' }
      ]
    ];
    
    // Add item rows
    this.quotationData.items.forEach((item, index) => {
      tableBody.push([
        { text: (index + 1).toString() },
        { text: item.description || '' },
        { text: (item.quantity || 0).toString() },
        { text: item.unit || 'pcs' },
        { text: `${(item.rate || 0).toFixed(2)} \uE900` },
        { text: `${(item.amount || 0).toFixed(2)} \uE900` },
        { text: `${(item.vatAmount || 0).toFixed(2)} \uE900` }
      ]);
    });
    
    return {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
        body: tableBody
      },
      layout: {
        fillColor: function (rowIndex: number) {
          return rowIndex === 0 ? '#2c3e50' : (rowIndex % 2 === 0 ? '#f8f9fa' : '#ffffff');
        }
      }
    };
  }

  private createSummarySection() {
    return {
      text: [
        { text: 'Summary', style: 'summaryLabel', margin: [0, 0, 0, 10] },
        {
          columns: [
            { text: 'Sub Total', style: 'summaryLabel' },
            { text: `${(this.quotationData.subTotal || 0).toFixed(2)} \uE900`, style: 'summaryValue' }
          ]
        },
        {
          columns: [
            { text: `VAT (${this.quotationData.items[0]?.vatPercentage || 15}%)`, style: 'summaryLabel' },
            { text: `${(this.quotationData.vatAmount || 0).toFixed(2)} \uE900`, style: 'summaryValue' }
          ]
        },
        {
          columns: [
            { text: 'Total', style: 'summaryLabel' },
            { text: `${(this.quotationData.total || 0).toFixed(2)} \uE900`, style: 'summaryValue' }
          ]
        }
      ]
    };
  }

  private createFooter() {
    return {
      columns: [
        // Left column
        {
          width: '*',
          text: `Email: ${this.orgData.email}`
        },
        // Right column
        {
          width: '*',
          text: [
            { text: `Phone: ${this.orgData.phone}`, alignment: 'right' },
            { text: `Website: ${this.orgData.website}`, alignment: 'right' },
            { text: this.orgData.addressArabic, style: 'arabicText' }
          ]
        }
      ]
    };
  }

  // Convert image URL to data URL for pdfmake
  private async convertImageToDataUrl(imageUrl: string): Promise<string> {
    try {
      console.log('Converting image URL to data URL:', imageUrl);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Image blob type:', blob.type, 'size:', blob.size);
      
      // Check if the blob has a valid image type
      if (!blob.type.startsWith('image/')) {
        throw new Error(`Invalid image type: ${blob.type}`);
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          console.log('Data URL generated, length:', dataUrl.length);
          resolve(dataUrl);
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      throw error;
    }
  }
}
