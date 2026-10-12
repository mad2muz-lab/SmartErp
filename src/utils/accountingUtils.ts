/**
 * Accounting Utilities and Standard Chart of Accounts for Saudi Trading ERP
 */

export const isConvexOrgId = (orgId: any): boolean => {
  return Boolean(
    orgId &&
    typeof orgId === 'string' &&
    !orgId.startsWith('org_') &&
    !orgId.startsWith('demo_') &&
    !orgId.startsWith('temp_') &&
    !orgId.startsWith('local_') &&
    !orgId.startsWith('vnd_') &&
    !orgId.startsWith('vendor_')
  );
};

export interface DefaultAccount {
  _id: string;
  account_code: string;
  account_name: string;
  account_name_arabic?: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  account_category: string;
  parent_account_id?: string;
  is_active: boolean;
  is_system_account: boolean;
  description?: string;
}

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccount[] = [
  // Assets
  {
    _id: 'acc_1000',
    account_code: '1000',
    account_name: 'Current Assets (الأصول المتداولة)',
    account_name_arabic: 'الأصول المتداولة',
    account_type: 'ASSET',
    account_category: 'CURRENT_ASSET',
    is_active: true,
    is_system_account: true,
    description: 'Cash, bank balances, and short term assets',
  },
  {
    _id: 'acc_1100',
    account_code: '1100',
    account_name: 'Cash and Cash Equivalents (النقد وما في حكمه)',
    account_name_arabic: 'النقد وما في حكمه',
    account_type: 'ASSET',
    account_category: 'CURRENT_ASSET',
    parent_account_id: 'acc_1000',
    is_active: true,
    is_system_account: true,
    description: 'Cash in drawer and liquid bank balances',
  },
  {
    _id: 'acc_1110',
    account_code: '1110',
    account_name: 'Cash in Hand / POS Till (نقد بالصندوق / نقطة البيع)',
    account_name_arabic: 'نقد بالصندوق ونقطة البيع',
    account_type: 'ASSET',
    account_category: 'CURRENT_ASSET',
    parent_account_id: 'acc_1100',
    is_active: true,
    is_system_account: true,
    description: 'Physical cash drawer balance for retail store',
  },
  {
    _id: 'acc_1120',
    account_code: '1120',
    account_name: 'Bank Operational Account - \uE900 (الحساب البنكي الجاري)',
    account_name_arabic: 'الحساب البنكي الجاري',
    account_type: 'ASSET',
    account_category: 'CURRENT_ASSET',
    parent_account_id: 'acc_1100',
    is_active: true,
    is_system_account: true,
    description: 'Corporate bank operational account in Saudi Riyals',
  },
  {
    _id: 'acc_1200',
    account_code: '1200',
    account_name: 'Accounts Receivable (المدينون والعملاء)',
    account_name_arabic: 'المدينون والعملاء',
    account_type: 'ASSET',
    account_category: 'CURRENT_ASSET',
    parent_account_id: 'acc_1000',
    is_active: true,
    is_system_account: true,
    description: 'Trade debtors and customer accounts',
  },
  {
    _id: 'acc_1300',
    account_code: '1300',
    account_name: 'Merchandise Inventory (مخزون البضاعة)',
    account_name_arabic: 'مخزون البضاعة',
    account_type: 'ASSET',
    account_category: 'CURRENT_ASSET',
    parent_account_id: 'acc_1000',
    is_active: true,
    is_system_account: true,
    description: 'Inventory on hand at warehouse and store',
  },
  {
    _id: 'acc_1500',
    account_code: '1500',
    account_name: 'Fixed Assets & Store Equipment (الأصول الثابتة والمعدات)',
    account_name_arabic: 'الأصول الثابتة والمعدات',
    account_type: 'ASSET',
    account_category: 'FIXED_ASSET',
    is_active: true,
    is_system_account: true,
    description: 'Point of sale terminals, computers, furniture, and fittings',
  },
  {
    _id: 'acc_1520',
    account_code: '1520',
    account_name: 'Accumulated Depreciation (مجمع الإهلاك للأصول)',
    account_name_arabic: 'مجمع الإهلاك للأصول',
    account_type: 'ASSET',
    account_category: 'FIXED_ASSET',
    parent_account_id: 'acc_1500',
    is_active: true,
    is_system_account: true,
    description: 'Contra-asset account tracking wear and tear depreciation of fixed assets',
  },

  // Liabilities
  {
    _id: 'acc_2000',
    account_code: '2000',
    account_name: 'Current Liabilities (الالتزامات المتداولة)',
    account_name_arabic: 'الالتزامات المتداولة',
    account_type: 'LIABILITY',
    account_category: 'CURRENT_LIABILITY',
    is_active: true,
    is_system_account: true,
    description: 'Short-term liabilities due within one year',
  },
  {
    _id: 'acc_2100',
    account_code: '2100',
    account_name: 'Accounts Payable - Vendors (الدائنون والموردون)',
    account_name_arabic: 'الدائنون والموردون',
    account_type: 'LIABILITY',
    account_category: 'CURRENT_LIABILITY',
    parent_account_id: 'acc_2000',
    is_active: true,
    is_system_account: true,
    description: 'Trade suppliers and vendor payables',
  },
  {
    _id: 'acc_2300',
    account_code: '2300',
    account_name: 'ZATCA VAT Payable 15% (ضريبة القيمة المضافة المستحقة للهيئة)',
    account_name_arabic: 'ضريبة القيمة المضافة المستحقة',
    account_type: 'LIABILITY',
    account_category: 'CURRENT_LIABILITY',
    parent_account_id: 'acc_2000',
    is_active: true,
    is_system_account: true,
    description: 'Output VAT minus Input VAT payable to ZATCA',
  },

  // Equity
  {
    _id: 'acc_3000',
    account_code: '3000',
    account_name: "Owner's Equity & Capital (حقوق الملكية ورأس المال)",
    account_name_arabic: 'حقوق الملكية ورأس المال',
    account_type: 'EQUITY',
    account_category: 'OWNERS_EQUITY',
    is_active: true,
    is_system_account: true,
    description: 'Initial business capital and partner investments',
  },
  {
    _id: 'acc_3200',
    account_code: '3200',
    account_name: 'Retained Earnings (الأرباح المبقاة)',
    account_name_arabic: 'الأرباح المبقاة',
    account_type: 'EQUITY',
    account_category: 'OWNERS_EQUITY',
    parent_account_id: 'acc_3000',
    is_active: true,
    is_system_account: true,
    description: 'Cumulative business profits retained in the enterprise',
  },
  {
    _id: 'acc_3100',
    account_code: '3100',
    account_name: "Owner Drawings & Distributions (مسحوبات الشركاء والمالك)",
    account_name_arabic: 'مسحوبات الشركاء والمالك',
    account_type: 'EQUITY',
    account_category: 'OWNERS_EQUITY',
    parent_account_id: 'acc_3000',
    is_active: true,
    is_system_account: true,
    description: 'Personal distributions or withdrawals taken by business owners',
  },

  // Revenue
  {
    _id: 'acc_4000',
    account_code: '4000',
    account_name: 'Operating Sales Revenue (إيرادات المبيعات التشغيلية)',
    account_name_arabic: 'إيرادات المبيعات',
    account_type: 'REVENUE',
    account_category: 'OPERATING_REVENUE',
    is_active: true,
    is_system_account: true,
    description: 'Store and POS retail and wholesale sales',
  },
  {
    _id: 'acc_4200',
    account_code: '4200',
    account_name: 'Service & Delivery Revenue (إيرادات الخدمات والتوصيل)',
    account_name_arabic: 'إيرادات الخدمات والتوصيل',
    account_type: 'REVENUE',
    account_category: 'OPERATING_REVENUE',
    parent_account_id: 'acc_4000',
    is_active: true,
    is_system_account: true,
    description: 'Delivery and auxiliary service fees',
  },

  // Expenses
  {
    _id: 'acc_5000',
    account_code: '5000',
    account_name: 'Cost of Goods Sold - COGS (تكلفة البضاعة المباعة)',
    account_name_arabic: 'تكلفة البضاعة المباعة',
    account_type: 'EXPENSE',
    account_category: 'OPERATING_EXPENSE',
    is_active: true,
    is_system_account: true,
    description: 'Direct cost of inventory sold',
  },
  {
    _id: 'acc_5200',
    account_code: '5200',
    account_name: 'Store Operating Expenses (مصروفات تشغيل المتجر والفرع)',
    account_name_arabic: 'مصروفات تشغيل المتجر',
    account_type: 'EXPENSE',
    account_category: 'OPERATING_EXPENSE',
    is_active: true,
    is_system_account: true,
    description: 'Utilities, rent, packaging, and operating costs',
  },
  {
    _id: 'acc_5250',
    account_code: '5250',
    account_name: 'Depreciation & Amortization Expense (مصروف الإهلاك والاستهلاك)',
    account_name_arabic: 'مصروف الإهلاك والاستهلاك',
    account_type: 'EXPENSE',
    account_category: 'OPERATING_EXPENSE',
    parent_account_id: 'acc_5200',
    is_active: true,
    is_system_account: true,
    description: 'Periodic depreciation expense on vehicles, machinery, and store equipment',
  },
  {
    _id: 'acc_5400',
    account_code: '5400',
    account_name: 'Bank Charges & Commission (الرسوم والعمولات البنكية)',
    account_name_arabic: 'الرسوم والعمولات البنكية',
    account_type: 'EXPENSE',
    account_category: 'OPERATING_EXPENSE',
    parent_account_id: 'acc_5200',
    is_active: true,
    is_system_account: true,
    description: 'Bank monthly maintenance fees, transfer commissions, and POS terminal fees',
  },
];

export const DEFAULT_RECEIPTS = [
  {
    _id: 'rec_1001',
    receipt_number: 'REC-2026-001',
    date: '2026-10-01',
    customer_id: 'cust_01',
    customer_name: 'Al-Madina Construction & Trading Co.',
    amount: 15450,
    payment_method: 'bank_transfer' as const,
    reference_number: 'TXN-BNK-98231',
    description: 'Partial advance payment for project materials batch #104',
    status: 'confirmed' as const,
    created_by: 'system',
    created_at: new Date('2026-10-01T09:30:00Z').toISOString(),
    updated_at: new Date('2026-10-01T09:30:00Z').toISOString(),
    organization_id: 'default'
  },
  {
    _id: 'rec_1002',
    receipt_number: 'REC-2026-002',
    date: '2026-10-04',
    customer_id: 'cust_02',
    customer_name: 'Riyadh Modern Contracting',
    amount: 8200,
    payment_method: 'credit_card' as const,
    reference_number: 'POS-AUTH-44129',
    description: 'Settlement of Invoice #INV-2026-042 - Electrical supplies',
    status: 'confirmed' as const,
    created_by: 'system',
    created_at: new Date('2026-10-04T14:15:00Z').toISOString(),
    updated_at: new Date('2026-10-04T14:15:00Z').toISOString(),
    organization_id: 'default'
  },
  {
    _id: 'rec_1003',
    receipt_number: 'REC-2026-003',
    date: '2026-10-07',
    customer_id: 'cust_03',
    customer_name: 'Efficiency Global Supplies',
    amount: 3750,
    payment_method: 'cash' as const,
    reference_number: 'CASH-REC-008',
    description: 'Counter cash receipt for walk-in wholesale order',
    status: 'pending' as const,
    created_by: 'system',
    created_at: new Date('2026-10-07T11:00:00Z').toISOString(),
    updated_at: new Date('2026-10-07T11:00:00Z').toISOString(),
    organization_id: 'default'
  }
];

export const DEFAULT_PAYMENTS = [
  {
    _id: 'pay_2001',
    payment_number: 'PAY-2026-001',
    date: '2026-10-02',
    supplier_id: 'supp_01',
    supplier_name: 'FixFast Industrial Solutions',
    amount: 12500,
    payment_method: 'bank_transfer' as const,
    reference_number: 'IBAN-TRF-554201',
    description: 'Payment against Purchase Order PO-2026-088 - Fasteners & Hardware',
    status: 'confirmed' as const,
    created_by: 'system',
    created_at: new Date('2026-10-02T10:00:00Z').toISOString(),
    updated_at: new Date('2026-10-02T10:00:00Z').toISOString(),
    organization_id: 'default'
  },
  {
    _id: 'pay_2002',
    payment_number: 'PAY-2026-002',
    date: '2026-10-05',
    supplier_id: 'supp_02',
    supplier_name: 'Gulf Cable & Electricals Ltd.',
    amount: 6800,
    payment_method: 'check' as const,
    reference_number: 'CHK-77402',
    description: 'Supplier invoice clearance - Heavy duty electrical cables',
    status: 'confirmed' as const,
    created_by: 'system',
    created_at: new Date('2026-10-05T13:45:00Z').toISOString(),
    updated_at: new Date('2026-10-05T13:45:00Z').toISOString(),
    organization_id: 'default'
  },
  {
    _id: 'pay_2003',
    payment_number: 'PAY-2026-003',
    date: '2026-10-08',
    supplier_id: 'supp_03',
    supplier_name: 'Saudi Logistics & Transport',
    amount: 1450,
    payment_method: 'cash' as const,
    reference_number: 'PETTY-VOUCH-012',
    description: 'Direct freight delivery charges for shipment consignment #409',
    status: 'pending' as const,
    created_by: 'system',
    created_at: new Date('2026-10-08T08:30:00Z').toISOString(),
    updated_at: new Date('2026-10-08T08:30:00Z').toISOString(),
    organization_id: 'default'
  }
];

export const DEFAULT_JOURNAL_VOUCHERS = [
  {
    _id: 'jv_3001',
    voucher_number: 'JV-2026-001',
    voucher_date: '2026-10-01',
    reference_number: 'REF-OB-2026',
    description: 'Opening financial balances and capital allocation',
    status: 'POSTED' as const,
    total_amount: 100000,
    entries: [
      {
        account_id: 'acc_1120',
        account_name: 'Bank Operational Account - \uE900',
        debit_amount: 100000,
        credit_amount: 0,
        description: 'Initial capital deposit into corporate bank account'
      },
      {
        account_id: 'acc_3000',
        account_name: "Owner's Equity & Capital",
        debit_amount: 0,
        credit_amount: 100000,
        description: 'Shareholders initial subscribed equity capital'
      }
    ],
    created_by: 'system',
    created_at: new Date('2026-10-01T08:00:00Z').toISOString(),
    updated_at: new Date('2026-10-01T08:00:00Z').toISOString(),
    organization_id: 'default'
  },
  {
    _id: 'jv_3002',
    voucher_number: 'JV-2026-002',
    voucher_date: '2026-10-05',
    reference_number: 'INV-GRN-109',
    description: 'Inventory purchase on supplier credit terms with 15% VAT',
    status: 'POSTED' as const,
    total_amount: 23000,
    entries: [
      {
        account_id: 'acc_1300',
        account_name: 'Merchandise Inventory',
        debit_amount: 20000,
        credit_amount: 0,
        description: 'Stock received from FixFast industrial'
      },
      {
        account_id: 'acc_2300',
        account_name: 'ZATCA VAT Payable 15%',
        debit_amount: 3000,
        credit_amount: 0,
        description: 'Input VAT deductible (15% on 20,000 \uE900)'
      },
      {
        account_id: 'acc_2100',
        account_name: 'Accounts Payable - Vendors',
        debit_amount: 0,
        credit_amount: 23000,
        description: 'Trade payable to supplier invoice'
      }
    ],
    created_by: 'system',
    created_at: new Date('2026-10-05T11:20:00Z').toISOString(),
    updated_at: new Date('2026-10-05T11:20:00Z').toISOString(),
    organization_id: 'default'
  },
  {
    _id: 'jv_3003',
    voucher_number: 'JV-2026-003',
    voucher_date: '2026-10-08',
    reference_number: 'ADJ-MTH-END',
    description: 'Accrual for office utilities and store maintenance',
    status: 'DRAFT' as const,
    total_amount: 2500,
    entries: [
      {
        account_id: 'acc_5200',
        account_name: 'Store Operating Expenses',
        debit_amount: 2500,
        credit_amount: 0,
        description: 'Estimated monthly power and utility expense'
      },
      {
        account_id: 'acc_2000',
        account_name: 'Current Liabilities',
        debit_amount: 0,
        credit_amount: 2500,
        description: 'Accrued expenses payable'
      }
    ],
    created_by: 'system',
    created_at: new Date('2026-10-08T09:00:00Z').toISOString(),
    updated_at: new Date('2026-10-08T09:00:00Z').toISOString(),
    organization_id: 'default'
  }
];
