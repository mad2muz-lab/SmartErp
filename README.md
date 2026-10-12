# 🏢 Smart ERP Enterprise System

A comprehensive, multi-organization Enterprise Resource Planning (ERP) platform built with **React 18**, **TypeScript**, **Convex Database & Realtime Functions**, and **Vite**. Engineered specifically for Saudi Arabian business operations with full bilingual support (English/Arabic), native Saudi Riyal (`﷼`) typography, ZATCA Phase 2 e-invoicing compliance, automated WhatsApp procurement & expense bots, local OCR receipt scanning, and a multi-tier accounting review engine.

---

## 🌟 Complete Integrated Modules

### 1. 📑 ZATCA Phase 2 Electronic Invoicing
- **Full Phase 2 Compliance**: UBL 2.1 XML builder, cryptographic hashing, and automated ZATCA onboarding simulation.
- **TLV & Base64 QR Encoding**: High-speed Tag-Length-Value QR generator meeting all ZATCA specifications.
- **One-Click Invoice Generation**: Create invoices directly from approved **Quotations** or signed **Delivery Notes**.
- **Interactive Modals & Viewers**: Live ZATCA XML viewer modal, raw UBL inspector, and audit badge status.

### 2. 📦 Procurement, RFQ & Sourcing Suite
- **RFQ Dispatches & Tracking**: Multi-supplier RFQ management with real-time quote detection and comparison.
- **Purchase Requisitions (PR) & Orders (PO)**: Dual-tier approval workflows, printable multi-page commercial PDFs, and supplier assignment.
- **Material Receipt Notes (MRN)**: Warehouse intake logging with discrepancy tracking against active Purchase Orders.
- **WhatsApp QC Inspector Simulator**: In-browser simulation for warehouse quality inspectors to approve or reject shipments via WhatsApp webhooks.
- **ProcureFlow Mail Viewer Bridge**: Pop-out window communication bridge allowing one-click **Reply**, **Reply All**, and **Forward** dispatches.

### 3. 📄 Quotations & Delivery Notes Engine
- **Arabic Typography & Font Loader**: Custom font embedding (`Amiri`, `Tajawal`) for high-fidelity bilingual document rendering.
- **Commercial PDF Engine**: Clean headers/footers, itemized tax breakdowns, currency in words, and digital signatures.
- **Contract Terms Wizard**: Multi-clause contract terms and conditions customizer with bilingual presets.
- **Delivery Note Tracking**: Multi-status fulfillment workflow (Pending, Dispatched, Delivered, Invoiced).

### 4. 📈 Smart Profit Sharing & Commercial Models
- **Real-Time Profit Sharing Matrix**: Dynamic partner contribution splitting with tiered commission structures.
- **Smart Profit Sharing Dashboard**: Interactive visual KPI cards, gross profit vs. net profit analytics, and partner dividend calculators.
- **Excel-Style Profit Grid**: Keyboard-navigable inline editing for financial controllers.

### 5. 🏛️ Double-Entry Accounting & Accounting Review Bin
- **Accounting Review Bin (صندوق المراجعة المحاسبية)**: 
  - Tier-2 financial audit inbox for operational expenses and reimbursements approved by department managers.
  - Receipt preview modal with side-by-side VAT inspection and tax number validation.
  - Dropdown Chart of Accounts selector with live AI category recommendations.
- **Automated Double-Entry Journal Vouchers (`#JV-EXP-`)**:
  - Automatically balances Dr Expense Head, Dr Input VAT (`1250`), and Cr Cash/Accounts Payable (`1010`/`2010`).
- **Full Chart of Accounts & General Ledger**: Multi-level account hierarchy, trial balance, balance sheet, and P&L financial reporting.

### 6. 📱 WhatsApp Expense Bot & Offline OCR Scanner
- **Local OCR Engine (Tesseract WASM)**: Runs 100% in-browser using compiled WebAssembly and SIMD-LSTM models (`ara.traineddata` + `eng.traineddata`) with zero third-party API exposure.
- **Smart Receipt Detail Extraction**: Scans vendor name, invoice date, Commercial Registration (CR), VAT number, subtotal, and tax amount.
- **Multi-Tier Separation of Duties (SoD)**:
  - Employees upload receipts and choose payment source (Personal Reimbursement vs Company Petty Cash).
  - Automatically dispatches to Reporting Manager for Tier-1 operational approval.
  - Automatically routes to the Accounting Review Bin upon approval for Tier-2 posting to the General Ledger.
- **Continuous Learning Loop**: Learns from accountant head corrections with a persistent training memory table.

### 7. 👥 HR, Leaves & Global Mobilization
- **HR Employee Hub**: Complete employee master records, Iqama tracking, Saudi labor law contract parameters, and department organization charts.
- **Leave Request & WhatsApp Approvals**: Sick leaves, annual leaves, and emergency exit requests with automated reporting manager routing.
- **International Hiring & Mobilization**: Candidate workflow tracker with visa quotas, medical checkups, ticketing, and orientation milestones.

### 8. 🛡️ Corporate Governance & Bilateral Settlements
- **Project RACI Matrix**: Responsible, Accountable, Consulted, and Informed mapping across multi-company joint ventures.
- **Bilateral Settlement Terminal**: Reconciles cross-company shared expenses, management fees, and intercompany receivables.
- **Resource Requisition Terminal**: Tracks personnel and equipment mobilization across internal business units.

### 9. 🏪 Inventory Movements & Vendor POS
- **Multi-Warehouse Stock Movements**: Real-time bin locations, batch tracking, transfer orders, and stock adjustments.
- **Offline-First Vendor POS**: Cashier point-of-sale terminal with barcode scanning, instant receipt printing, and local cache sync.
- **Vendor Onboarding Portal**: Self-service registration for supplier bank details, tax compliance certificates, and product catalogues.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite |
| **Backend & DB** | Convex Realtime Database, Server Functions, Mutations, Crons & Webhooks |
| **OCR & Vision** | Tesseract.js (WASM + SIMD-LSTM, Arabic `ara` & English `eng` traineddata) |
| **PDF & Documents**| Custom HTML Canvas Engine, KaTeX, jsPDF, Arabic Reshaper |
| **Standards** | ZATCA Phase 2 E-Invoicing (UBL 2.1, TLV QR), Saudi Labor Law, Double-Entry GL |

---

## 📁 Repository Structure

```
SmartErp/
├── convex/                          # Convex Realtime Backend & Schema
│   ├── accounting/                  # Chart of Accounts, Journal Vouchers, GL, Reports
│   ├── pdf/                         # Server-side PDF generators
│   ├── companyExpenses.ts           # Expense submission & tracking
│   ├── deliveryNotes.ts             # Delivery notes mutations & queries
│   ├── governance.ts                # RACI matrix, settlements & requisitions
│   ├── http.ts                      # Webhook endpoints (WhatsApp & external services)
│   ├── inventory.ts                 # Stock levels & movement mutations
│   ├── invoiceManagement.ts         # ZATCA Phase 2 invoice mutations
│   ├── leaves.ts                    # HR leave requests & approvals
│   ├── profitSharing.ts             # Profit sharing calculation engine
│   ├── quotations.ts                # Quotations & sales orders
│   ├── schema.ts                    # Central database schema definitions
│   └── whatsappApprovals.ts         # WhatsApp approval flows & bot memory
│
├── public/
│   ├── fonts/                       # Official Saudi Riyal symbol (﷼) fonts
│   └── tesseract/                   # Local OCR WebAssembly engine & traineddata
│
└── src/
    ├── components/
    │   ├── accounting/              # Accounting Review Bin, GL, Journal Vouchers
    │   ├── deliveryNotes/           # Delivery note creation & templates
    │   ├── expenseManagement/       # Expense dashboards & tables
    │   ├── expenses/                # WhatsApp Expense Bot drawer
    │   ├── governance/              # Governance terminals & RACI matrix
    │   ├── invoices/                # ZATCA compliance modals & step forms
    │   ├── procurement/             # RFQs, POs, MRNs, WhatsApp QC simulator
    │   ├── profitSharing/           # Smart Profit Sharing cards & dashboards
    │   ├── quotations/              # Quotation wizard & Arabic PDF renderer
    │   └── pos/                     # Vendor POS terminals
    │
    ├── modules/
    │   └── zatca/                   # ZATCA Phase 2 Core (TLV, UBL, QR generator)
    │
    └── screens/                     # Full-page application screens
        ├── AccountingScreen.tsx
        ├── CorporateGovernanceScreen.tsx
        ├── DeliveryNoteListScreen.tsx
        ├── HRManagementScreen.tsx
        ├── IntelligentProcessFlowScreen.tsx
        ├── InventoryListScreen.tsx
        ├── InvoiceManagementScreen.tsx
        ├── ProcurementDashboardScreen.tsx
        ├── ProfitSharingDashboardScreen.tsx
        ├── QuotationListScreen.tsx
        └── VendorPosScreen.tsx
```

---

## 🚦 Quick Start & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mad2muz-lab/SmartErp.git
   cd SmartErp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file with your Convex deployment:
   ```env
   VITE_CONVEX_URL="https://your-deployment.convex.cloud"
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.