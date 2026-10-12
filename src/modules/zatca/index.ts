/**
 * ZATCA E-Invoicing Standalone Module
 * 
 * Complete, self-contained solution for Saudi ZATCA E-Invoicing Phase 1 & Phase 2.
 * Ready to be used inside TradingERP or exported as an independent microservice / npm package.
 */

// Types
export * from './types/zatca.types';

// Core
export * from './core/tlvEncoder';
export * from './core/qrGenerator';
export * from './core/validator';

// UBL 2.1 XML Generator
export * from './ubl/ublTypes';
export * from './ubl/ublBuilder';

// UI Components
export * from './ui/ZatcaBadge';
export * from './ui/ZatcaQRView';
export * from './ui/ZatcaOnboardingModal';
export * from './ui/ZatcaXmlViewerModal';
export * from './ui/ZatcaInvoiceReceiptModal';
