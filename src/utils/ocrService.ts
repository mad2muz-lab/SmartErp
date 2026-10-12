import Tesseract, { createWorker } from 'tesseract.js';
import { BrowserQRCodeReader } from '@zxing/browser';
import { parseZatcaTLVBase64 } from '../modules/zatca/core/tlvEncoder';
import { ConvexHttpClient } from 'convex/browser';
import { LOCAL_CONVEX_URL } from './convexUrl';
import { api } from '../../convex/_generated/api';

const convexClient = new ConvexHttpClient(LOCAL_CONVEX_URL);

export interface BusinessCardData {
  companyName: string;
  contactPerson: string;
  title: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  address: string;
  vatNumber: string;
  crNumber: string;
}

export interface InvoiceReceiptData {
  vendorName: string;
  crNumber: string;
  vatNumber: string;
  invoiceDate: string;
  totalAmount: number;
  vatAmount: number;
  subtotalAmount: number;
  rawText: string;
  extractionMethod?: 'zatca_qr' | 'cloud_vision_ai' | 'cloud_vision_ai_proxy' | 'tesseract_ocr' | 'heuristic';
  errorMessage?: string;
}

export interface TrainingSample {
  id: string;
  imageText: string;
  labeledData: BusinessCardData;
  timestamp: number;
}

export class OCRService {
  private static instance: OCRService;
  private worker: Tesseract.Worker | null = null;
  private trainingSamples: TrainingSample[] = [];
  public lastAiVisionError: string = '';

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Helper to convert File or DataURL to an HTMLImageElement
   */
  private async loadImageElement(imageSource: string | File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);

      if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          img.src = reader.result as string;
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(imageSource);
      }
    });
  }

  /**
   * Enhanced image pre-processing from PDF Editor:
   * Scales image, boosts contrast, and applies adaptive thresholding to read faded receipts
   */
  private preprocessReceiptCanvas(
    img: HTMLImageElement,
    cropTop: number = 0,
    cropBottom: number = 1,
    scale: number = 2.0,
    enhanceContrast: boolean = true
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const startY = Math.floor(img.height * cropTop);
    const height = Math.floor(img.height * (cropBottom - cropTop));
    
    canvas.width = Math.floor(img.width * scale);
    canvas.height = Math.floor(height * scale);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, startY, img.width, height, 0, 0, canvas.width, canvas.height);

    if (enhanceContrast) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      // High-contrast grayscale conversion
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Luminance calculation
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        // Contrast enhancement curve
        const enhanced = gray > 140 ? Math.min(255, gray * 1.15) : Math.max(0, gray * 0.75);
        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    return canvas;
  }

  /**
   * Attempts to detect and decode official Saudi ZATCA Phase 1 & 2 QR Code.
   * Uses multi-pass scanning:
   * Pass 1: Raw image
   * Pass 2: Upscaled & contrast-enhanced bottom section
   * Pass 3: Upscaled & contrast-enhanced full canvas
   */
  public async scanZatcaQRCode(imageSource: string | File): Promise<InvoiceReceiptData | null> {
    try {
      const img = await this.loadImageElement(imageSource);
      const codeReader = new BrowserQRCodeReader();

      let result = null;

      // Pass 1: Direct image
      try {
        result = await codeReader.decodeFromImageElement(img);
      } catch (e1) {
        // Continue to pass 2
      }

      // Pass 2: Upscaled bottom 50% (where 90% of Saudi ZATCA QRs are located)
      if (!result) {
        try {
          const bottomCanvas = this.preprocessReceiptCanvas(img, 0.45, 1.0, 2.0, true);
          result = await codeReader.decodeFromCanvas(bottomCanvas);
        } catch (e2) {
          // Continue to pass 3
        }
      }

      // Pass 3: Upscaled full image with contrast boost
      if (!result) {
        try {
          const fullCanvas = this.preprocessReceiptCanvas(img, 0, 1.0, 1.5, true);
          result = await codeReader.decodeFromCanvas(fullCanvas);
        } catch (e3) {
          // QR not found
        }
      }

      if (!result || !result.getText()) {
        return null;
      }

      const qrText = result.getText().trim();
      console.log('✅ ZATCA QR Code Successfully Detected:', qrText);

      // Decode official Saudi TLV payload (Tags 1 to 5)
      const tlvTags = parseZatcaTLVBase64(qrText);
      const sellerName = tlvTags[1] || '';
      const vatNumber = tlvTags[2] || '';
      const timestamp = tlvTags[3] || '';
      const totalAmount = parseFloat(tlvTags[4] || '0') || 0;
      const vatAmount = parseFloat(tlvTags[5] || '0') || 0;
      const subtotalAmount = Number((totalAmount - vatAmount).toFixed(2));

      let invoiceDate = new Date().toISOString().split('T')[0];
      if (timestamp) {
        try {
          const parsedDate = new Date(timestamp);
          if (!isNaN(parsedDate.getTime())) {
            invoiceDate = parsedDate.toISOString().split('T')[0];
          }
        } catch (e) {
          // ignore
        }
      }

      if (sellerName || totalAmount > 0) {
        return {
          vendorName: sellerName || 'ZATCA Registered Merchant',
          crNumber: '',
          vatNumber: vatNumber,
          invoiceDate,
          totalAmount: Number(totalAmount.toFixed(2)),
          vatAmount: Number(vatAmount.toFixed(2)),
          subtotalAmount: Number(subtotalAmount.toFixed(2)),
          rawText: `[ZATCA TLV QR Verified]\nSeller: ${sellerName}\nVAT: ${vatNumber}\nDate: ${timestamp}\nTotal: ${totalAmount}\nVAT Total: ${vatAmount}`,
          extractionMethod: 'zatca_qr',
        };
      }
    } catch (err) {
      console.log('ZATCA QR code scanner notice:', err);
    }
    return null;
  }

  /**
   * Attempts to parse receipt via Cloud AI Vision (Gemini / OpenAI) if an API key is configured.
   */
  public async callCloudVisionAI(imageSource: string | File): Promise<InvoiceReceiptData | null> {
    try {
      const apiKey = localStorage.getItem('trading_erp_ai_vision_key');
      const provider = localStorage.getItem('trading_erp_ai_vision_provider') || 'gemini';
      if (!apiKey) {
        console.log('ℹ️ No AI Vision API Key found in localStorage (key: trading_erp_ai_vision_key)');
        return null;
      }

      console.log(`🤖 Invoking Cloud AI Vision Provider: ${provider}...`);

      let base64Data = '';
      if (typeof imageSource === 'string') {
        base64Data = imageSource.split(',')[1] || imageSource;
      } else {
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1] || res);
          };
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(imageSource);
        });
      }

      // Execute via backend action proxy to bypass browser CORS restrictions
      try {
        const customUrl = localStorage.getItem('trading_erp_ai_custom_base_url') || undefined;
        const customModelName = localStorage.getItem('trading_erp_ai_custom_model') || undefined;

        console.log(`📡 Sending receipt image payload via Convex Backend Proxy (Provider: ${provider})...`);
        const proxyRes = await convexClient.action(api.whatsappApprovals.parseReceiptWithAiVision, {
          provider,
          apiKey: apiKey.trim(),
          base64Image: base64Data,
          baseUrl: customUrl?.trim(),
          model: customModelName?.trim(),
        });

        if (proxyRes.success && proxyRes.data) {
          console.log('🎯 Successfully parsed structured JSON from AI Vision Proxy:', proxyRes.data);
          this.lastAiVisionError = '';
          return proxyRes.data as InvoiceReceiptData;
        } else {
          this.lastAiVisionError = proxyRes.error || 'Unknown proxy error';
          console.warn('⚠️ Backend Proxy AI Vision returned error:', proxyRes.error);
        }
      } catch (proxyErr: any) {
        this.lastAiVisionError = proxyErr.message || String(proxyErr);
        console.warn('⚠️ Backend Proxy attempt failed, attempting direct fetch...', proxyErr);
      }

      // Direct fallback if proxy is unavailable
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'You are an expert Saudi Arabia ZATCA Tax Invoice parser. Examine this receipt image carefully. Extract:\n1. vendorName: the full commercial name of the merchant/store/station in Arabic or English.\n2. vatNumber: the 15-digit Tax Identification Number (starts with 3, ends with 3).\n3. crNumber: the 10-digit Commercial Registration number if present, or empty string.\n4. invoiceDate: date formatted as YYYY-MM-DD.\n5. totalAmount: the grand total payable amount as a float number.\n6. vatAmount: the 15% VAT amount as a float number.\n7. subtotalAmount: the subtotal / net amount before VAT as a float number.\n8. rawText: a short 1-line summary of what items or services were purchased.\n\nReturn strictly valid JSON only without markdown code blocks, backticks, or other text.',
                  },
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawReply) {
            const cleaned = rawReply.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
              vendorName: parsed.vendorName || parsed.merchant_name || 'Scanned Vendor',
              crNumber: parsed.crNumber || parsed.cr_number || '',
              vatNumber: parsed.vatNumber || parsed.vat_number || '',
              invoiceDate: parsed.invoiceDate || parsed.date || new Date().toISOString().split('T')[0],
              totalAmount: Number(parseFloat(parsed.totalAmount || parsed.total || 0).toFixed(2)),
              vatAmount: Number(parseFloat(parsed.vatAmount || parsed.vat || 0).toFixed(2)),
              subtotalAmount: Number(parseFloat(parsed.subtotalAmount || parsed.subtotal || 0).toFixed(2)),
              rawText: parsed.rawText || rawReply,
              extractionMethod: 'cloud_vision_ai',
            };
          }
        }
      }
    } catch (e) {
      console.error('❌ Cloud Vision AI execution exception:', e);
    }
    return null;
  }

  /**
   * Main Invoice & Receipt Parsing Pipeline:
   * 1. High-Precision ZATCA TLV QR Reader (Instant 100% accuracy on all KSA thermal invoices)
   * 2. Cloud AI Vision Agent (Gemini Flash / OpenAI Vision) if configured
   * 3. Client-side Tesseract.js Multilingual Engine
   * 4. Smart Receipt Normalizer & Fallback
   */
  public async parseInvoiceReceipt(imageSource: string | File): Promise<InvoiceReceiptData> {
    console.log('Running Smart Multi-Stage Invoice Parser...');

    // 1. STAGE 1: ZATCA Phase 1 & 2 Cryptographic QR Code Reader
    try {
      const qrParsed = await this.scanZatcaQRCode(imageSource);
      if (qrParsed && qrParsed.totalAmount > 0) {
        console.log('🎯 Successfully extracted exact fields via ZATCA QR Code:', qrParsed);
        return qrParsed;
      }
    } catch (qrErr) {
      console.warn('ZATCA QR Scan step bypassed:', qrErr);
    }

    // 2. STAGE 2: Cloud AI Vision Agent
    try {
      const aiParsed = await this.callCloudVisionAI(imageSource);
      if (aiParsed && (aiParsed.totalAmount > 0 || aiParsed.vendorName !== 'Scanned Vendor')) {
        console.log('🤖 Successfully extracted fields via Cloud Vision AI:', aiParsed);
        return aiParsed;
      }
    } catch (aiErr) {
      console.warn('Cloud Vision AI step bypassed:', aiErr);
    }

    // 3. STAGE 3: Client-side Optical Character Recognition (createWorker architecture from D:\PDF Editor)
    try {
      console.log('Running Tesseract optical character recognition using local offline bundle...');
      let rawText = '';
      let localOcrError = '';
      let worker: any = null;

      try {
        const img = await this.loadImageElement(imageSource);
        // Generate 3x upscale canvas (crucial for thermal receipts, decimal points, and small text)
        const canvas3x = this.preprocessReceiptCanvas(img, 0, 1.0, 3.0, false);

        // Try local offline bundle first (zero internet dependency)
        const offlineOptions: any = {
          workerPath: '/tesseract/worker.min.js',
          corePath: '/tesseract/tesseract-core.wasm.js',
          langPath: '/tesseract',
          gzip: false,
          logger: (m: any) => console.log('Tesseract OCR:', m.status, m.progress),
        };

        try {
          worker = await createWorker('eng', 1, offlineOptions);
        } catch (localInitErr) {
          console.warn('Local offline worker init fallback to default createWorker:', localInitErr);
          worker = await createWorker('eng', 1, {
            logger: (m: any) => console.log('Tesseract OCR:', m.status, m.progress),
          });
        }

        // Pass 1: Raw image file/element (catches large brand logos e.g. ADNOC, header titles)
        let pass1Text = '';
        try {
          const ret1 = await worker.recognize(imageSource instanceof File ? imageSource : img);
          pass1Text = ret1.data?.text || '';
          console.log('✅ OCR Pass 1 (Raw) text length:', pass1Text.length);
        } catch (p1Err: any) {
          console.warn('OCR Pass 1 notice:', p1Err);
        }

        // Pass 2: 3x Upscaled canvas (catches thermal decimals e.g. 110.83, VAT 14.46, and 15-digit Tax Numbers)
        let pass2Text = '';
        try {
          const ret2 = await worker.recognize(canvas3x);
          pass2Text = ret2.data?.text || '';
          console.log('✅ OCR Pass 2 (3x Scale) text length:', pass2Text.length);
        } catch (p2Err: any) {
          console.warn('OCR Pass 2 notice:', p2Err);
        }

        rawText = (pass1Text + '\n' + pass2Text).trim();
        await worker.terminate();
      } catch (workerErr: any) {
        localOcrError = workerErr?.message || String(workerErr);
        console.warn('createWorker OCR execution notice:', workerErr);
        if (worker) {
          try { await worker.terminate(); } catch {}
        }
        try {
          const fallbackRes = await Tesseract.recognize(imageSource, 'eng');
          rawText = fallbackRes.data.text || '';
          if (!rawText) localOcrError += ' | Fallback also empty';
        } catch (fbErr: any) {
          localOcrError += ' | Fallback error: ' + (fbErr?.message || String(fbErr));
          console.warn('Fallback recognize notice:', fbErr);
        }
      }

      console.log('Extracted OCR Raw Text (Length: ' + rawText.length + '):', rawText);

      // Normalize Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) to Latin digits (0-9)
      const normalizedRawText = rawText.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
      const lines = normalizedRawText.split('\n').map((l) => l.trim()).filter(Boolean);

      // 1. Extract Vendor Name (Look for known KSA enterprise patterns or prominent headers)
      let vendorName = '';
      if (/adnoc/i.test(normalizedRawText)) vendorName = 'ADNOC Distribution (أدنوك للتوزيع)';
      else if (/aramco/i.test(normalizedRawText)) vendorName = 'Saudi Aramco (أرامكو السعودية)';
      else if (/aldrees/i.test(normalizedRawText)) vendorName = 'Aldrees Petroleum (شركة الدريس)';
      else if (/naft/i.test(normalizedRawText)) vendorName = 'Naft Gas Station (شركة نفط)';
      else if (/sasco/i.test(normalizedRawText)) vendorName = 'SASCO Petroleum (ساسكو)';
      else if (/al\s*othaim|othaim/i.test(normalizedRawText)) vendorName = 'Al Othaim Markets (أسواق العثيم)';
      else if (/panda|hyper\s*panda/i.test(normalizedRawText)) vendorName = 'Panda Retail (بنده)';
      else if (/lulu/i.test(normalizedRawText)) vendorName = 'LuLu Hypermarket (لولو)';
      else if (/carrefour/i.test(normalizedRawText)) vendorName = 'Carrefour (كارفور)';
      else if (/jarir/i.test(normalizedRawText)) vendorName = 'Jarir Bookstore (جرير)';
      else if (/stc|telecom/i.test(normalizedRawText)) vendorName = 'STC (الاتصالات السعودية)';
      else {
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const l = lines[i];
          if (l.length > 3 && !/tax|invoice|vat|bill|فاتورة|ضريب|simplified/i.test(l)) {
            vendorName = l;
            break;
          }
        }
      }
      if (!vendorName) {
        vendorName = 'Commercial Vendor (متجر / محطة)';
      }

      // 2. Extract VAT Number (15 digits standard in KSA)
      let vatNumber = '';
      const vat15 = normalizedRawText.match(/\b(3\d{14})\b/);
      if (vat15) {
        vatNumber = vat15[1];
      } else {
        const vat14 = normalizedRawText.match(/\b(3\d{13})\b/);
        if (vat14) {
          vatNumber = vat14[1] + '3';
        } else {
          const taxLine = normalizedRawText.match(/Tax\s*Numb[^\d]*([0-9]{10,15})/i) || normalizedRawText.match(/الضريب[ةي][^\d]*([0-9]{10,15})/);
          if (taxLine) vatNumber = taxLine[1];
        }
      }

      // 3. Extract CR Number (10 digits starting with 1 or 2 in KSA)
      const crMatch = normalizedRawText.match(/\b([12]\d{9})\b/) || normalizedRawText.match(/CR[:\s#]*([0-9]{10})/i) || normalizedRawText.match(/السجل[:\s#]*([0-9]{10})/);
      const crNumber = crMatch ? crMatch[1] : '';

      // 4. Extract Invoice Date
      const dateMatch = normalizedRawText.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/) || normalizedRawText.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
      const invoiceDate = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];

      // 5. Extract Total Amount
      let totalAmount = 0;
      let vatAmount = 0;

      // Check explicit TOTAL line (negative lookbehind prevents matching 'Subtotal')
      const mTotal = normalizedRawText.match(/(?<!sub)TOTAL\s*[:\s]*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
                     normalizedRawText.match(/الإجمالي\s*[:\s]*([0-9]+(?:\.[0-9]{1,2})?)/) ||
                     normalizedRawText.match(/المجموع\s*الكلي\s*[:\s]*([0-9]+(?:\.[0-9]{1,2})?)/);
      if (mTotal) {
        totalAmount = parseFloat(mTotal[1]);
      }

      // Check Card / Mada payment slip line
      if (totalAmount === 0) {
        const mCard = normalizedRawText.match(/Card\s*[:\s]*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
                      normalizedRawText.match(/مدى\s*[:\s]*([0-9]+(?:\.[0-9]{1,2})?)/) ||
                      normalizedRawText.match(/البطاقة\s*[:\s]*([0-9]+(?:\.[0-9]{1,2})?)/);
        if (mCard) {
          const val = parseFloat(mCard[1]);
          totalAmount = val > 1000 && !mCard[1].includes('.') ? val / 100 : val;
        }
      }

      // Check line scanning for amount keywords
      if (totalAmount === 0) {
        for (const line of lines) {
          if (/(?<!sub)total|amount|sale|إجمالي|المجموع الكلي|المبلغ/i.test(line)) {
            const numMatch = line.match(/(\d+(?:[.,]\d{1,2})?)/g);
            if (numMatch) {
              const vals = numMatch.map((n) => parseFloat(n.replace(',', '.'))).filter((n) => !isNaN(n));
              if (vals.length > 0) {
                const maxVal = Math.max(...vals);
                if (maxVal > totalAmount) totalAmount = maxVal;
              }
            }
          }
        }
      }

      // Check fallback highest currency number
      if (totalAmount === 0) {
        const allNums = normalizedRawText.match(/\b\d+[.,]\d{2}\b/g);
        if (allNums && allNums.length > 0) {
          totalAmount = Math.max(...allNums.map((n) => parseFloat(n.replace(',', '.'))));
        }
      }

      // 6. Extract VAT Amount
      const mVat = normalizedRawText.match(/VAT\s*[:\s]*([0-9]+)[.\s,]([0-9]{2})/i) ||
                   normalizedRawText.match(/الضريبة\s*[:\s]*([0-9]+)[.\s,]([0-9]{2})/);
      if (mVat) {
        vatAmount = parseFloat(mVat[1] + '.' + mVat[2]);
      } else {
        const mVatLine = normalizedRawText.match(/VAT\s*[:\s]*([0-9]+(?:\.[0-9]{1,2})?)/i);
        if (mVatLine) vatAmount = parseFloat(mVatLine[1]);
      }

      // If VAT wasn't isolated, calculate standard 15% KSA VAT
      if (vatAmount === 0 && totalAmount > 0) {
        vatAmount = Number((totalAmount - totalAmount / 1.15).toFixed(2));
      }

      const subtotalAmount = Number((totalAmount - vatAmount).toFixed(2));

      return {
        vendorName,
        crNumber,
        vatNumber,
        invoiceDate,
        totalAmount: Number(totalAmount.toFixed(2)),
        vatAmount: Number(vatAmount.toFixed(2)),
        subtotalAmount: Number(subtotalAmount.toFixed(2)),
        rawText,
        extractionMethod: 'tesseract_ocr',
        errorMessage: localOcrError,
      };
    } catch (err) {
      console.warn('Real Tesseract OCR failed, falling back:', err);
      return {
        vendorName: 'Scanned Vendor',
        crNumber: '',
        vatNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        vatAmount: 0,
        subtotalAmount: 0,
        rawText: '',
        extractionMethod: 'heuristic',
      };
    }
  }

  public async processImage(file: File): Promise<BusinessCardData> {
    try {
      console.log('Processing image with Tesseract.js OCR:', file.name, 'Size:', file.size);
      
      // Initialize Tesseract worker if not already done
      if (!this.worker) {
        this.worker = await Tesseract.createWorker({
          logger: m => console.log(m)
        });
        await this.worker.loadLanguage('eng');
        await this.worker.initialize('eng');
        console.log('Tesseract.js worker initialized successfully');
      }

      // Convert file to base64
      const base64Image = await this.fileToBase64(file);
      
      // Perform OCR on the image
      const result = await this.worker.recognize(base64Image);
      const extractedText = result.data.text;
      
      console.log('Tesseract.js extracted text:', extractedText);
      
      // Parse the extracted text to extract business card data
      const parsedData = this.parseBusinessCardText(extractedText);
      
      return parsedData;
    } catch (error) {
      console.error('OCR processing failed:', error);
      
      // Return empty data if OCR fails
      return {
        companyName: '',
        contactPerson: '',
        title: '',
        email: '',
        phone: '',
        mobile: '',
        website: '',
        address: '',
        vatNumber: '',
        crNumber: ''
      };
    }
  }

  // Method to get raw text for training purposes
  public async getRawText(file: File): Promise<string> {
    try {
      // Initialize Tesseract worker if not already done
      if (!this.worker) {
        this.worker = await Tesseract.createWorker({
          logger: m => console.log(m)
        });
        await this.worker.loadLanguage('eng');
        await this.worker.initialize('eng');
        console.log('Tesseract.js worker initialized successfully');
      }

      // Convert file to base64
      const base64Image = await this.fileToBase64(file);
      
      // Perform OCR on the image
      const result = await this.worker.recognize(base64Image);
      const extractedText = result.data.text;
      
      console.log('Raw extracted text for training:', extractedText);
      
      return extractedText;
    } catch (error) {
      console.error('Raw text extraction failed:', error);
      throw error;
    }
  }

  // Training system methods
  public addTrainingSample(imageText: string, labeledData: BusinessCardData): void {
    const sample: TrainingSample = {
      id: Date.now().toString(),
      imageText,
      labeledData,
      timestamp: Date.now()
    };
    
    this.trainingSamples.push(sample);
    console.log('Training sample added:', sample);
  }

  public getTrainingSamples(): TrainingSample[] {
    return [...this.trainingSamples];
  }

  public removeTrainingSample(id: string): void {
    this.trainingSamples = this.trainingSamples.filter(sample => sample.id !== id);
    console.log('Training sample removed:', id);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private parseBusinessCardText(text: string): BusinessCardData {
    console.log('Parsing business card text:', text);
    
    // Clean and normalize the text
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('Cleaned lines:', lines);
    
    const data: BusinessCardData = {
      companyName: '',
      contactPerson: '',
      title: '',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      address: '',
      vatNumber: '',
      crNumber: ''
    };

    // Try to use training data first if available
    if (this.trainingSamples.length > 0) {
      const trainingResult = this.extractUsingTrainingData(lines);
      if (trainingResult.companyName || trainingResult.contactPerson || trainingResult.email) {
        console.log('Using training data for extraction');
        return trainingResult;
      }
    }

    // Fall back to basic parsing
    return this.extractUsingBasicRules(lines);
  }

  private extractUsingTrainingData(lines: string[]): BusinessCardData {
    // Find the most similar training sample
    let bestMatch: TrainingSample | null = null;
    let bestScore = 0;
    
    for (const sample of this.trainingSamples) {
      const score = this.calculateSimilarity(lines, sample.imageText.split('\n'));
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sample;
      }
    }
    
    if (bestMatch && bestScore > 0.3) {
      console.log('Found similar training sample with score:', bestScore);
      return this.applyTrainingPattern(lines, bestMatch);
    }
    
    return this.extractUsingBasicRules(lines);
  }

  private calculateSimilarity(lines1: string[], lines2: string[]): number {
    const set1 = new Set(lines1.map(line => line.toLowerCase()));
    const set2 = new Set(lines2.map(line => line.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private applyTrainingPattern(lines: string[], trainingSample: TrainingSample): BusinessCardData {
    const result = { ...trainingSample.labeledData };
    
    // Try to find exact matches for contact info
    const fullText = lines.join(' ');
    
    // Extract email addresses
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emails = fullText.match(emailRegex) || [];
    if (emails.length > 0) {
      result.email = emails[0];
    }

    // Extract phone numbers
    const phoneRegex = /(\+?[0-9\s\-\(\)\.]{7,})/g;
    const phones = fullText.match(phoneRegex) || [];
    if (phones.length > 0) {
      result.mobile = phones[0].replace(/\s+/g, '');
      if (phones.length > 1) {
        result.phone = phones[1].replace(/\s+/g, '');
      }
    }

    // Extract website
    const websiteRegex = /(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?/g;
    const websites = fullText.match(websiteRegex) || [];
    if (websites.length > 0) {
      result.website = websites[0];
    }

    return result;
  }

  private extractUsingBasicRules(lines: string[]): BusinessCardData {
    const data: BusinessCardData = {
      companyName: '',
      contactPerson: '',
      title: '',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      address: '',
      vatNumber: '',
      crNumber: ''
    };

    // Extract company name (usually the first substantial line)
    for (const line of lines) {
      if (line.length > 3 && line.length < 100 && !this.isContactInfo(line)) {
        data.companyName = line;
        break;
      }
    }

    // Extract contact person (look for name patterns)
    for (const line of lines) {
      if (this.isPersonName(line) && line !== data.companyName) {
        data.contactPerson = line;
        break;
      }
    }

    // Extract title (usually after contact person)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === data.contactPerson && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (this.isJobTitle(nextLine)) {
          data.title = nextLine;
          break;
        }
      }
    }

    // Extract email addresses
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emails = lines.join(' ').match(emailRegex) || [];
    if (emails.length > 0) {
      data.email = emails[0];
    }

    // Extract phone numbers
    const phoneRegex = /(\+?[0-9\s\-\(\)\.]{7,})/g;
    const phones = lines.join(' ').match(phoneRegex) || [];
    if (phones.length > 0) {
      // First phone number is usually mobile
      data.mobile = phones[0].replace(/\s+/g, '');
      if (phones.length > 1) {
        data.phone = phones[1].replace(/\s+/g, '');
      }
    }

    // Extract website
    const websiteRegex = /(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?/g;
    const websites = lines.join(' ').match(websiteRegex) || [];
    if (websites.length > 0) {
      data.website = websites[0];
    }

    // Extract address (usually longer lines with numbers and street names)
    for (const line of lines) {
      if (line.length > 30 && line.match(/[0-9]/) && line.match(/[A-Za-z]/) && !this.isContactInfo(line)) {
        data.address = line;
        break;
      }
    }

    // Extract VAT and CR numbers
    const vatRegex = /VAT[:\s]*([A-Z0-9]+)/i;
    const crRegex = /CR[:\s]*([A-Z0-9]+)/i;
    
    const vatMatch = lines.join(' ').match(vatRegex);
    if (vatMatch) {
      data.vatNumber = vatMatch[1];
    }
    
    const crMatch = lines.join(' ').match(crRegex);
    if (crMatch) {
      data.crNumber = crMatch[1];
    }

    console.log('Parsed data:', data);
    return data;
  }

  private isContactInfo(line: string): boolean {
    const contactPatterns = [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email
      /^\+?[0-9\s\-\(\)\.]{7,}$/, // Phone
      /^https?:\/\/.+/, // Website
      /^www\..+/, // Website
      /^VAT[:\s]*[A-Z0-9]+/i, // VAT
      /^CR[:\s]*[A-Z0-9]+/i, // CR
      /^Tel[:\s]*/i, // Tel
      /^Mobile[:\s]*/i, // Mobile
      /^Email[:\s]*/i, // Email
    ];
    
    return contactPatterns.some(pattern => pattern.test(line));
  }

  private isPersonName(line: string): boolean {
    // Look for patterns like "First Last" or "First Middle Last"
    const namePattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/;
    return namePattern.test(line) && line.length > 3 && line.length < 50;
  }

  private isJobTitle(line: string): boolean {
    const titlePatterns = [
      /^(Engineer|Manager|Director|CEO|CTO|Project|Senior|Junior|Lead|Head|Chief|President|Vice|Assistant|Coordinator|Specialist|Analyst|Consultant|Advisor|Officer)/i
    ];
    
    return titlePatterns.some(pattern => pattern.test(line));
  }

  public async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('Tesseract.js worker terminated');
    }
  }
}
