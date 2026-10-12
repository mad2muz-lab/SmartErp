"use node";

// Import from modular components
import { action } from "./_generated/server";
import { v } from "convex/values";

// Import types
import { QuotationData, DeliveryNoteData, OrganizationData, PDFGenerationResult } from "./types/pdfTypes";

// Import utilities
import { formatDetailedAddress, formatDetailedDeliveryAddress, processTextForPDF, formatCurrency, validatePDFData } from "./utils/pdfHelpers";

// Import PDF generators
import { generateArabicPDF } from "./pdf/quotationGenerator";
import { generateDeliveryNotePDF } from "./pdf/deliveryNoteGenerator";

// Export types for backward compatibility
export type { QuotationData, DeliveryNoteData, OrganizationData, PDFGenerationResult };

// Export utility functions for backward compatibility
export { formatDetailedAddress, formatDetailedDeliveryAddress, processTextForPDF, formatCurrency, validatePDFData };

// Re-export the main PDF generation functions
export { generateArabicPDF, generateDeliveryNotePDF };

// Additional PDF generation functions can be added here as needed
// This file serves as the main entry point for all PDF-related functionality
