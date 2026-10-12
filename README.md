# Smart ERP — ZATCA-Compliant Invoicing & Management System

A complete invoicing system built with React, TypeScript, and Convex, designed to meet ZATCA (Zakat, Tax and Customs Authority) Phase 2 compliance requirements for Saudi Arabia.

## 🚀 Features

### Core Invoicing
- **ZATCA Phase 2 Compliance**: Full compliance with Saudi Arabia's electronic invoicing requirements
- **QR Code Generation**: Automatic TLV-encoded QR codes for invoice validation
- **PDF Generation**: Professional invoice PDFs with proper Saudi Riyal symbol (﷼)
- **Multi-step Invoice Creation**: Guided workflow for invoice creation
- **Invoice Management**: Complete CRUD operations for invoices

### Customer Management
- **Customer Database**: Comprehensive customer information management
- **Bank Details**: Full banking information including IBAN, Swift codes, and account details
- **Address Components**: Detailed address fields for both English and Arabic
- **CRN Management**: Commercial Registration Number handling

### Organization Management
- **Multi-organization Support**: Handle multiple organizations with detailed settings
- **Address Management**: Complete address components for organizations
- **VAT Configuration**: Proper VAT number management with Arabic support
- **Logo Management**: Organization logo handling with fallback support

### Authentication & Security
- **Google OAuth**: Secure authentication with Google
- **Role-based Access**: Super admin, admin, and user roles
- **Permission System**: Granular permissions for different operations
- **Session Management**: Secure session handling with localStorage

### ZATCA Compliance
- **Phase 2 Requirements**: Meets all ZATCA Phase 2 specifications
- **TLV Encoding**: Proper Tag-Length-Value encoding for QR codes
- **Base64 Encoding**: Correct Base64 encoding for ZATCA compliance
- **Invoice Validation**: Built-in validation for ZATCA requirements
- **Compliance Dashboard**: Visual compliance checking and reporting

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Chakra UI
- **Backend**: Convex (Backend-as-a-Service)
- **Database**: Convex Database
- **Authentication**: Google OAuth 2.0
- **PDF Generation**: HTML to PDF conversion
- **Build Tool**: Vite
- **Styling**: Chakra UI with responsive design

## 📁 Project Structure

```
src/
├── components/
│   ├── invoices/           # Invoice-related components
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoiceTable.tsx
│   │   ├── ZATCAComplianceDashboard.tsx
│   │   └── steps/          # Multi-step form components
│   ├── CustomerForm.tsx    # Customer management
│   └── PermissionGuard.tsx # Access control
├── screens/
│   ├── InvoiceManagementScreen.tsx
│   ├── CustomerListScreen.tsx
│   └── LoginScreen.tsx
├── contexts/
│   └── shared/            # React contexts for state management
└── utils/
    └── invoiceCurrencyUtils.ts

convex/
├── invoiceManagement.ts   # Core invoice operations
├── zatcaInvoiceTemplate.ts # ZATCA-compliant HTML templates
├── customers.ts           # Customer management
├── organizations.ts       # Organization management
├── auth.ts               # Authentication
└── schema.ts             # Database schema
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Convex account
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoicing-module
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the local Convex backend**
   ```bash
   npm run convex:dev
   ```
   Keep this terminal running. The backend and its data stay on this computer.

4. **Configure the local frontend**
   In `.env.local`, set:
   ```
   VITE_CONVEX_URL=http://127.0.0.1:3210
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   The frontend rejects non-local Convex URLs while this local-only configuration is in place.

## 🔧 Configuration

### Google OAuth Setup
1. Create a Google Cloud Project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### Convex Setup
1. Create a new Convex project
2. Deploy the schema and functions
3. Configure authentication providers

## 📋 ZATCA Compliance Features

### Phase 2 Requirements Met
- ✅ **Seller Information**: Complete seller details with VAT number
- ✅ **Buyer Information**: Full buyer details with CRN
- ✅ **Invoice Details**: All required invoice fields
- ✅ **Line Items**: Detailed item information with VAT
- ✅ **QR Code**: TLV-encoded QR code with Base64
- ✅ **Digital Signature**: Cryptographic stamp support
- ✅ **Invoice Hash**: SHA-256 hash generation
- ✅ **Arabic Support**: Bilingual invoice support

### QR Code Structure
The QR code contains TLV-encoded data:
- Tag 1: Seller Name
- Tag 2: VAT Number
- Tag 3: Timestamp
- Tag 4: Invoice Total
- Tag 5: VAT Total
- Tag 6: Invoice Hash
- Tag 7: Cryptographic Stamp

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme switching
- **Arabic Support**: RTL layout support
- **Professional Styling**: Clean, modern interface
- **Accessibility**: WCAG compliant components

## 🔒 Security

- **Authentication**: Google OAuth 2.0
- **Authorization**: Role-based access control
- **Data Validation**: Input sanitization and validation
- **Secure Storage**: Encrypted session management
- **HTTPS**: Secure communication

## 📊 Database Schema

### Key Tables
- `invoices`: Invoice records with ZATCA fields
- `invoice_items`: Line items for invoices
- `customers`: Customer information with bank details
- `organizations`: Organization settings and details
- `user_profiles`: User authentication and roles

## 🚀 Deployment

### Production Deployment
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Convex**
   ```bash
   convex deploy --prod
   ```

3. **Deploy frontend**
   Deploy the `dist` folder to your hosting provider

### Environment Variables
- `VITE_CONVEX_URL`: Production Convex URL
- `VITE_GOOGLE_CLIENT_ID`: Production Google Client ID

## 📝 API Documentation

### Key Functions

#### Invoice Management
- `createInvoice`: Create new invoice
- `updateInvoice`: Update existing invoice
- `deleteInvoice`: Delete invoice
- `generateZATCAInvoicePDF`: Generate ZATCA-compliant PDF

#### Customer Management
- `createCustomer`: Create new customer
- `updateCustomer`: Update customer details
- `listCustomers`: Get customer list
- `getCustomer`: Get specific customer

#### ZATCA Compliance
- `generateZATCAQRCode`: Generate compliant QR code
- `validateZATCACompliance`: Validate invoice compliance
- `generateZATCAInvoicePDF`: Generate compliant PDF

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: mad2muz@gmail.com

## 🔄 Version History

- **v1.0.0**: Initial release with ZATCA Phase 2 compliance
- Complete invoicing system with PDF generation
- Customer and organization management
- Google OAuth authentication
- Multi-step invoice creation workflow

---

**Built with ❤️ for ZATCA compliance in Saudi Arabia**