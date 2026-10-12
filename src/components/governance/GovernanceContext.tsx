import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// LOCAL OFFLINE-FIRST GOVERNANCE STORE & ENGINE
// Stores multi-company consortium risk data 100% locally on PC via localStorage
// Bilingual English + Arabic legal frameworks (KSA Ministry of Commerce / Nafith / ZATCA)
// ============================================================================

export interface SanadNote {
  _id: string;
  id: string;
  note_number: string;
  project_id: string;
  project_name: string;
  creditor_name: string;
  creditor_cr?: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  days_remaining: number;
  is_overdue: boolean;
  is_critical: boolean;
  purpose: string;
  counter_secured: boolean;
  counter_security_details: string;
  status: 'active' | 'discharged' | 'enforced';
  attachment_name?: string;
  attachment_url?: string;
  counter_attachment_name?: string;
}

export interface NafithAlert {
  _id: string;
  id: string;
  notice_number: string;
  creditor_name: string;
  creditor_cr?: string;
  amount: number;
  currency: string;
  project_id: string;
  project_name: string;
  received_at: string;
  is_authorized: boolean;
  status: 'pending_review' | 'counter_secured' | 'rejected' | 'accepted_on_nafith';
  notes?: string;
  counter_indemnity_ref?: string;
  attachment_name?: string;
  attachment_url?: string;
}

export interface BorrowingFacility {
  _id: string;
  id: string;
  facility_code: string;
  lender_name: string;
  facility_type: string;
  approved_limit: number;
  drawn_amount: number;
  finance_cost_rate: number;
  currency: string;
  expiry_date: string;
  counter_indemnity_verified: boolean;
  repayment_waterfall_priority: number;
  status: 'active' | 'closed';
}

export interface BrandPassport {
  _id: string;
  id: string;
  passport_code: string;
  credential_type: string;
  certificate_reference: string;
  allowed_tender_scope: string;
  valid_to: string;
  verification_token: string;
  allows_borrowing: boolean;
  status: 'active' | 'expired' | 'revoked' | 'pending_acceptance';
  granted_to_org?: string;
  liability_cap_sar?: number;
  sole_indemnifier_accepted?: boolean;
  risk_accepted_by?: string;
  risk_accepted_at?: string;
  acceptance_token?: string;
}

export interface StakeholderProfile {
  _id: string;
  id: string;
  name: string;
  nameAr: string;
  company_name: string;
  company_role: 'lead_cr_holder' | 'execution_partner' | 'mep_partner' | 'investor' | 'finance_lead';
  phone: string; // WhatsApp mobile with country code e.g. +966505123456
  email?: string;
  is_saudi_national: boolean;
  national_id?: string;
  notification_tier: 'all_alerts' | 'high_value_only' | 'milestones_only';
  is_active: boolean;
}

export interface WhatsAppNoticeLog {
  _id: string;
  id: string;
  timestamp: string;
  notice_type: 'cr_risk_acceptance' | 'payment_on_behalf' | 'nafith_alert' | 'client_milestone' | 'weekly_digest' | 'sanad_request_by_partner' | 'submit_procurement_slip_by_partner';
  title: string;
  project_name: string;
  recipients: {
    stakeholder_id: string;
    name: string;
    phone: string;
    status: 'delivered' | 'read' | 'accepted' | 'pending';
  }[];
  message_body: string;
  related_entity_id?: string;
  requires_risk_acceptance: boolean;
  acceptance_status?: 'pending' | 'accepted' | 'rejected';
  accepted_by?: string;
  accepted_at?: string;
  acceptance_hash?: string;
}

export interface GovernanceProject {
  _id: string;
  id: string;
  project_code: string;
  name: string;
  client_name: string;
  contract_value: number;
  currency: string;
  start_date: string;
  planned_end_date: string;
  status: 'tender' | 'active' | 'completed';
}

export interface CollaborationScope {
  _id: string;
  id: string;
  agreement_code: string;
  project_name: string;
  partner_name: string;
  lead_company_name?: string;
  client_name?: string;
  contract_value?: number;
  partner_mobile?: string;
  collaboration_type: string;
  management_fee_type: 'zero_fee' | 'percentage' | 'fixed_monthly';
  management_fee_value: number;
  liability_cap: number;
  effective_from: string;
  effective_to: string;
  status: 'active' | 'completed' | 'terminated';
  covenants_agreed?: boolean;
  notes?: string;
}

export interface BilateralTransaction {
  _id: string;
  id: string;
  transaction_code: string;
  debtor: 'Your Company' | 'Partner Company';
  creditor: 'Your Company' | 'Partner Company';
  debtor_name?: string;
  creditor_name?: string;
  transaction_type: string;
  description: string;
  total_amount: number;
  amount_excl_vat?: number;
  vat_amount?: number;
  is_settled: boolean;
  transaction_date: string;
  slip_attachment_name?: string;
  slip_attachment_url?: string;
  vendor_name?: string;
  transfer_ref?: string;
  po_ref?: string;
  submitted_via?: 'dashboard' | 'whatsapp_bot';
}

export interface SharedResource {
  _id: string;
  id: string;
  identifier: string;
  name: string;
  category: string;
  sub_category?: string;
  base_rate: number;
  standard_unit: string;
  current_status: 'available' | 'allocated' | 'maintenance';
  is_sharable_externally: boolean;
}

export interface ResourceRequestItem {
  _id: string;
  id: string;
  request_code: string;
  project_name: string;
  requesting_org: string;
  supplying_org: string;
  resource_name: string;
  category: string;
  quantity: number;
  unit: string;
  requested_rate: number;
  counter_rate?: number;
  status: 'pending' | 'counter_offered' | 'approved' | 'rejected';
  terms_conditions?: string;
  start_date: string;
  end_date: string;
}

export interface RaciAssignment {
  _id: string;
  id: string;
  project_id?: string;
  wbs_code: string;
  activity_name: string;
  discipline: string;
  contractor_name: string;
  raci_role: 'R' | 'A' | 'C' | 'I' | 'INDEMNIFIER';
  liability_notes: string;
}

export interface ConsortiumOrganization {
  _id: string;
  id: string;
  name: string;
  commercial_registration_number: string;
  role: string;
}

interface GovernanceContextType {
  sanadNotes: SanadNote[];
  nafithAlerts: NafithAlert[];
  borrowingFacilities: BorrowingFacility[];
  brandPassports: BrandPassport[];
  projects: GovernanceProject[];
  collaborations: CollaborationScope[];
  bilateralTransactions: BilateralTransaction[];
  resources: SharedResource[];
  resourceRequests: ResourceRequestItem[];
  raciAssignments: RaciAssignment[];
  consortiumOrganizations: ConsortiumOrganization[];
  stakeholders: StakeholderProfile[];
  whatsAppLogs: WhatsAppNoticeLog[];
  addStakeholder: (data: Partial<StakeholderProfile>) => void;
  updateStakeholder: (id: string, data: Partial<StakeholderProfile>) => void;
  deleteStakeholder: (id: string) => void;
  addCollaboration: (data: Partial<CollaborationScope>) => void;
  updateCollaboration: (id: string, data: Partial<CollaborationScope>) => void;
  deleteCollaboration: (id: string) => void;
  dispatchWhatsAppNotice: (notice: Omit<WhatsAppNoticeLog, '_id' | 'id' | 'timestamp'>) => WhatsAppNoticeLog;
  acceptRiskPassport: (passportId: string, acceptedByName: string, note?: string) => void;
  createSanadNote: (data: Partial<SanadNote>) => void;
  dischargeSanadNote: (id: string) => void;
  logNafithAlert: (data: Partial<NafithAlert>) => void;
  resolveNafithAlert: (alertId: string, action: 'accept' | 'reject') => void;
  createBorrowingFacility: (data: Partial<BorrowingFacility>) => void;
  grantBrandPassport: (data: Partial<BrandPassport>) => void;
  recordBilateralTransaction: (data: Partial<BilateralTransaction>) => void;
  executeBilateralDischarge: () => { clearedCount: number; netPayable: number; payer: string };
  createResource: (data: Partial<SharedResource>) => void;
  submitResourceRequest: (data: Partial<ResourceRequestItem>) => void;
  submitCounterOffer: (requestId: string, counterRate: number, terms: string) => void;
  acceptResourceRequest: (requestId: string) => void;
  createRaciAssignment: (data: Partial<RaciAssignment>) => void;
  resetToSampleData: () => void;
}

const STORAGE_KEY = 'trading_erp_governance_store_v3';

const defaultOrganizations: ConsortiumOrganization[] = [
  {
    _id: 'org_main',
    id: 'org_main',
    name: 'Apex Infrastructure Co. (Your Company / صاحب السجل)',
    commercial_registration_number: '1010884219',
    role: 'Lead Contractor / CR Holder',
  },
  {
    _id: 'org_heavy',
    id: 'org_heavy',
    name: 'Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)',
    commercial_registration_number: '1010398201',
    role: 'Execution Partner (Earthworks / Fleet)',
  },
  {
    _id: 'org_mep',
    id: 'org_mep',
    name: 'RedSea MEP Works (Partner C / شريك الكهروميكانيك)',
    commercial_registration_number: '1010882190',
    role: 'MEP Specialist Subcontractor',
  },
  {
    _id: 'org_rmc',
    id: 'org_rmc',
    name: 'Saudi Ready-Mix Concrete Co. (المورد الدائن)',
    commercial_registration_number: '1010294819',
    role: 'Material Supplier Creditor',
  },
];

const defaultProjects: GovernanceProject[] = [
  {
    _id: 'prj_1',
    id: 'prj_1',
    project_code: 'PRJ-RYD-042',
    name: 'Riyadh Logistics Park Phase 2 (مشروع لوجستي الرياض)',
    client_name: 'Logistics Parks Authority',
    contract_value: 45000000,
    currency: 'SAR',
    start_date: '2026-08-01',
    planned_end_date: '2027-10-31',
    status: 'active',
  },
  {
    _id: 'prj_2',
    id: 'prj_2',
    project_code: 'PRJ-QID-018',
    name: 'Qiddiya Theme Park Substation MEP (مشروع القدية)',
    client_name: 'Qiddiya Investment Co.',
    contract_value: 18500000,
    currency: 'SAR',
    start_date: '2026-09-15',
    planned_end_date: '2027-08-30',
    status: 'active',
  },
];

const defaultCollaborations: CollaborationScope[] = [
  {
    _id: 'col_1',
    id: 'col_1',
    agreement_code: 'AGR-2026-0041',
    project_name: 'Riyadh Logistics Park Phase 2 (مشروع لوجستي الرياض)',
    partner_name: 'Gulf Heavy Machinery LLC (Partner B)',
    collaboration_type: 'CR & Brand Sponsorship (رعاية السجل والتنفيذ)',
    management_fee_type: 'zero_fee',
    management_fee_value: 0,
    liability_cap: 5000000,
    effective_from: '2026-08-01',
    effective_to: '2027-10-31',
    status: 'active',
  },
  {
    _id: 'col_2',
    id: 'col_2',
    agreement_code: 'AGR-2026-0089',
    project_name: 'Qiddiya Theme Park Substation MEP (مشروع القدية)',
    partner_name: 'RedSea MEP Works (Partner C)',
    collaboration_type: 'Consortium JV / Subcontract (تحالف كهروميكانيكي)',
    management_fee_type: 'percentage',
    management_fee_value: 3.5,
    liability_cap: 2500000,
    effective_from: '2026-09-15',
    effective_to: '2027-08-30',
    status: 'active',
  },
];

const defaultNafithAlerts: NafithAlert[] = [
  {
    _id: 'naf_1',
    id: 'naf_1',
    notice_number: 'NAF-2026-88192',
    creditor_name: 'Saudi Ready-Mix Concrete Co.',
    creditor_cr: '1010294819',
    amount: 450000,
    currency: 'SAR',
    project_id: 'prj_1',
    project_name: 'Riyadh Logistics Park Phase 2',
    received_at: '2026-09-28 11:20 AM',
    is_authorized: true,
    status: 'counter_secured',
    notes: 'Concrete supply line. Partner Backup Guarantee (Sanad Mudhaad / سند مضاد) signed by Partner B CEO.',
    counter_indemnity_ref: 'SM-2026-004',
  },
];

const defaultSanadNotes: SanadNote[] = [
  {
    _id: 'san_1',
    id: 'san_1',
    note_number: 'SANAD-2026-001',
    project_id: 'prj_1',
    project_name: 'Riyadh Logistics Park Phase 2',
    creditor_name: 'Saudi Ready-Mix Concrete Co.',
    creditor_cr: '1010294819',
    amount: 450000,
    currency: 'SAR',
    issue_date: '2026-08-15',
    due_date: '2026-10-15',
    days_remaining: 17,
    is_overdue: false,
    is_critical: false,
    purpose: 'Ready-mix concrete monthly supplier guarantee',
    counter_secured: true,
    counter_security_details: 'Signed Partner Backup Guarantee (Sanad Mudhaad / سند مضاد) from Gulf Heavy CEO',
    status: 'active',
  },
  {
    _id: 'san_2',
    id: 'san_2',
    note_number: 'SANAD-2026-002',
    project_id: 'prj_1',
    project_name: 'Riyadh Logistics Park Phase 2',
    creditor_name: 'Gulf Crane Lease Co.',
    amount: 850000,
    currency: 'SAR',
    issue_date: '2026-09-01',
    due_date: '2026-11-30',
    days_remaining: 63,
    is_overdue: false,
    is_critical: false,
    purpose: '50-Ton Crawler Crane 90-Day Rental Guarantee',
    counter_secured: true,
    counter_security_details: 'Equipment asset pledge & corporate indemnity note',
    status: 'active',
  },
  {
    _id: 'san_3',
    id: 'san_3',
    note_number: 'SANAD-2026-003',
    project_id: 'prj_1',
    project_name: 'Riyadh Logistics Park Phase 2',
    creditor_name: 'Riyadh Steel Rebar Co.',
    amount: 1900000,
    currency: 'SAR',
    issue_date: '2026-09-10',
    due_date: '2027-02-28',
    days_remaining: 153,
    is_overdue: false,
    is_critical: false,
    purpose: '500 Tons ASTM Rebar Supply Credit Facility',
    counter_secured: true,
    counter_security_details: 'Client Milestone IPC #3 escrow holdback reservation',
    status: 'active',
  },
];

const defaultBorrowingFacilities: BorrowingFacility[] = [
  {
    _id: 'fac_1',
    id: 'fac_1',
    facility_code: 'FAC-SNB-001',
    lender_name: 'Saudi National Bank (SNB / البنك الأهلي السعودي)',
    facility_type: 'Invoice Factoring / Discounting (خصم فواتير)',
    approved_limit: 3000000,
    drawn_amount: 1800000,
    finance_cost_rate: 4.5,
    currency: 'SAR',
    expiry_date: '2027-06-30',
    counter_indemnity_verified: true,
    repayment_waterfall_priority: 1,
    status: 'active',
  },
  {
    _id: 'fac_2',
    id: 'fac_2',
    facility_code: 'FAC-RAJ-002',
    lender_name: 'Al Rajhi Bank Murabaha (مصرف الراجحي - مرابحة)',
    facility_type: 'Working Capital Line (تمويل رأس مال عامل)',
    approved_limit: 2000000,
    drawn_amount: 1000000,
    finance_cost_rate: 3.8,
    currency: 'SAR',
    expiry_date: '2027-09-30',
    counter_indemnity_verified: true,
    repayment_waterfall_priority: 1,
    status: 'active',
  },
];

const defaultBrandPassports: BrandPassport[] = [
  {
    _id: 'pass_1',
    id: 'pass_1',
    passport_code: 'AUTH-2026-0041',
    credential_type: 'CR & Class-1 License Pass (تصريح استخدام السجل التجاري)',
    certificate_reference: 'CR-1010-884219',
    allowed_tender_scope: 'Exclusively for Civil & Earthworks Bidding on Phase 2. Strictly No Borrowing.',
    valid_to: '2026-12-31',
    verification_token: 'tok_live_0x9f41b82c39',
    allows_borrowing: false,
    status: 'active',
    granted_to_org: 'Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)',
    liability_cap_sar: 1500000,
    sole_indemnifier_accepted: true,
    risk_accepted_by: 'Eng. Tariq Mansoor (م. طارق منصور)',
    risk_accepted_at: '2026-08-10 14:30',
    acceptance_token: 'tok_acc_gulf_8842',
  },
  {
    _id: 'pass_2',
    id: 'pass_2',
    passport_code: 'AUTH-2026-0088',
    credential_type: 'Aramco Vendor Code #100492 (كود أرامكو المعتمد)',
    certificate_reference: 'ARAMCO-VND-8821',
    allowed_tender_scope: 'Substation HV Transformer Installation Package Bidding Only.',
    valid_to: '2027-03-31',
    verification_token: 'tok_live_0x4a11f92e81',
    allows_borrowing: false,
    status: 'active',
    granted_to_org: 'RedSea MEP Works (Partner C / شريك الكهروميكانيك)',
    liability_cap_sar: 500000,
    sole_indemnifier_accepted: true,
    risk_accepted_by: 'Mr. Youssef El-Sayed (أ. يوسف السيد)',
    risk_accepted_at: '2026-09-02 09:15',
    acceptance_token: 'tok_acc_aramco_0088',
  },
  {
    _id: 'pass_3',
    id: 'pass_3',
    passport_code: 'AUTH-2026-0099',
    credential_type: 'CR & Commercial Brand Usage Pass (تصريح استخدام السجل والاسم التجاري)',
    certificate_reference: 'CR-1010-884219',
    allowed_tender_scope: 'Procurement of High-Voltage Cables & Substation Transformers under Company A name.',
    valid_to: '2027-01-31',
    verification_token: 'tok_live_0x7b88e14d23',
    allows_borrowing: false,
    status: 'pending_acceptance',
    granted_to_org: 'RedSea MEP Works (Partner C / شريك الكهروميكانيك)',
    liability_cap_sar: 800000,
    sole_indemnifier_accepted: false,
    acceptance_token: 'tok_acc_mep_9921',
  },
];

export const defaultStakeholders: StakeholderProfile[] = [
  {
    _id: 'stk_1',
    id: 'stk_1',
    name: 'Sheikh Fahad Al-Otaibi',
    nameAr: 'الشيخ فهد العتيبي (المالك السعودي للسجل)',
    company_name: 'Apex Infrastructure Co. (Your Company / صاحب السجل)',
    company_role: 'lead_cr_holder',
    phone: '+966505123456',
    email: 'fahad@apex-infra.sa',
    is_saudi_national: true,
    national_id: '1092837461',
    notification_tier: 'all_alerts',
    is_active: true,
  },
  {
    _id: 'stk_2',
    id: 'stk_2',
    name: 'Eng. Tariq Mansoor',
    nameAr: 'م. طارق منصور (الشريك التنفيذي المنفذ)',
    company_name: 'Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)',
    company_role: 'execution_partner',
    phone: '+966554987654',
    email: 'tariq@gulfheavy.com',
    is_saudi_national: false,
    notification_tier: 'all_alerts',
    is_active: true,
  },
  {
    _id: 'stk_3',
    id: 'stk_3',
    name: 'Mr. Youssef El-Sayed',
    nameAr: 'أ. يوسف السيد (شريك الكهروميكانيك)',
    company_name: 'RedSea MEP Works (Partner C / شريك الكهروميكانيك)',
    company_role: 'mep_partner',
    phone: '+966562345678',
    email: 'youssef@redseamep.com',
    is_saudi_national: false,
    notification_tier: 'high_value_only',
    is_active: true,
  },
  {
    _id: 'stk_4',
    id: 'stk_4',
    name: 'Sultan Al-Ghamdi',
    nameAr: 'أ. سلطان الغامدي (شريك ومستثمر مالي)',
    company_name: 'Horizon Equity Consortium (المستثمر المالي)',
    company_role: 'investor',
    phone: '+966541122334',
    email: 'sultan@horizonequity.sa',
    is_saudi_national: true,
    national_id: '1083749201',
    notification_tier: 'milestones_only',
    is_active: true,
  },
  {
    _id: 'stk_5',
    id: 'stk_5',
    name: 'Kareem Abdulrahman',
    nameAr: 'أ. كريم عبدالرحمن (مدير الحسابات والضريبة)',
    company_name: 'Apex & Consortium Financial Governance',
    company_role: 'finance_lead',
    phone: '+966539988776',
    email: 'kareem.finance@apex-infra.sa',
    is_saudi_national: false,
    notification_tier: 'all_alerts',
    is_active: true,
  },
];

export const defaultWhatsAppLogs: WhatsAppNoticeLog[] = [
  {
    _id: 'log_1',
    id: 'log_1',
    timestamp: '2026-09-28 16:45',
    notice_type: 'payment_on_behalf',
    title: 'إشعار سداد مورد / Supplier Payment on Behalf',
    project_name: 'Riyadh Logistics Park Phase 2',
    recipients: [
      { stakeholder_id: 'stk_1', name: 'Sheikh Fahad Al-Otaibi', phone: '+966505123456', status: 'read' },
      { stakeholder_id: 'stk_2', name: 'Eng. Tariq Mansoor', phone: '+966554987654', status: 'read' },
      { stakeholder_id: 'stk_5', name: 'Kareem Abdulrahman', phone: '+966539988776', status: 'read' },
    ],
    message_body: `*🟢 [إشعار سداد معتمد / Payment Confirmation]*\\n*المشروع:* Riyadh Logistics Park Phase 2\\n*المورد:* Saudi Ready-Mix Concrete Co.\\n*رقم أمر الشراء:* PO-A-2026-089 (تحت اسم شركة أ)\\n*المبلغ المسدد:* 115,000 \uE900 (شامل 15,000 \uE900 ضريبة)\\n*المسدد:* الشريك التنفيذي شركة ب (حوالة البنك الأهلي #982144)\\n*الأثر الضريبي:* توثيق رصيد ضريبة مدخلات لصالح شركة أ.`,
    requires_risk_acceptance: false,
  },
  {
    _id: 'log_2',
    id: 'log_2',
    timestamp: '2026-09-29 11:20',
    notice_type: 'cr_risk_acceptance',
    title: 'طلب تفويض استخدام السجل وإقرار الضامن الوحيد / CR Usage Authorization',
    project_name: 'Riyadh Logistics Park Phase 2',
    recipients: [
      { stakeholder_id: 'stk_1', name: 'Sheikh Fahad Al-Otaibi', phone: '+966505123456', status: 'delivered' },
      { stakeholder_id: 'stk_3', name: 'Mr. Youssef El-Sayed', phone: '+966562345678', status: 'pending' },
    ],
    related_entity_id: 'pass_3',
    requires_risk_acceptance: true,
    acceptance_status: 'pending',
    message_body: `*🛡️ [طلب تفويض استخدام السجل التجاري وإقرار المخاطر]*\\n*السادة / شركة ريد سي للأعمال الكهروميكانيكية (RedSea MEP)*\\n*المشروع:* Riyadh Logistics Park Phase 2\\n*سقف الالتزام المالي:* 800,000 \uE900\\n*النطاق المصرح:* شراء محولات وكابلات الجهد العالي فقط.\\n*الشرط النظامي:* الإقرار بالصفة الحصرية كـ (الضامن الوحيد) وإبراء ذمة المالك السعودي من أي التزامات غير معتمدة، مع حظر إصدار سندات نافذ.\\n*رابط الاعتماد الرقمي:* https://erp.local/governance/risk-passport?token=tok_acc_mep_9921`,
  },
];

const defaultBilateralTransactions: BilateralTransaction[] = [
  {
    _id: 'tx_1',
    id: 'tx_1',
    transaction_code: 'TX-2026-081',
    debtor: 'Your Company',
    creditor: 'Partner Company',
    debtor_name: 'Apex Infrastructure Co. (Your Company)',
    creditor_name: 'Gulf Heavy Machinery LLC (Partner)',
    transaction_type: '50-Ton Crane 30 Days Hire (إيجار ونش مجنزر)',
    description: 'PO-0105: Mobilization and monthly crawler crane operation',
    total_amount: 96600,
    amount_excl_vat: 84000,
    vat_amount: 12600,
    is_settled: false,
    transaction_date: '2026-09-20',
  },
  {
    _id: 'tx_2',
    id: 'tx_2',
    transaction_code: 'TX-2026-082',
    debtor: 'Partner Company',
    creditor: 'Your Company',
    debtor_name: 'Gulf Heavy Machinery LLC (Partner)',
    creditor_name: 'Apex Infrastructure Co. (Your Company)',
    transaction_type: 'Site Diesel Fuel Dispensed (ديزل موقع ووقود معدات)',
    description: 'Diesel pump meter log: 4,200 Litres dispensed to Partner machines',
    total_amount: 18975,
    amount_excl_vat: 16500,
    vat_amount: 2475,
    is_settled: false,
    transaction_date: '2026-09-22',
  },
  {
    _id: 'tx_3',
    id: 'tx_3',
    transaction_code: 'TX-2026-083',
    debtor: 'Partner Company',
    creditor: 'Your Company',
    debtor_name: 'Gulf Heavy Machinery LLC (Partner)',
    creditor_name: 'Apex Infrastructure Co. (Your Company)',
    transaction_type: 'Site Camp Housing & Catering (سكن وإعاشة عمال الموقع)',
    description: 'Camp block 4: 12 partner workers housed for 30 days',
    total_amount: 11040,
    amount_excl_vat: 9600,
    vat_amount: 1440,
    is_settled: false,
    transaction_date: '2026-09-24',
  },
  {
    _id: 'tx_4',
    id: 'tx_4',
    transaction_code: 'TX-2026-084',
    debtor: 'Partner Company',
    creditor: 'Your Company',
    debtor_name: 'Gulf Heavy Machinery LLC (Partner)',
    creditor_name: 'Apex Infrastructure Co. (Your Company)',
    transaction_type: 'HSE Safety Fine Contra-Charge (خصمية غرامة أمن وسلامة)',
    description: 'Municipality fine reimbursement for missing trench shoring flag',
    total_amount: 2300,
    amount_excl_vat: 2000,
    vat_amount: 300,
    is_settled: false,
    transaction_date: '2026-09-25',
  },
];

const defaultResources: SharedResource[] = [
  {
    _id: 'res_1',
    id: 'res_1',
    identifier: 'EQ-CRANE-08',
    name: 'Hitachi SCX550 Crawler Crane 50T (ونش مجنزر 50 طن)',
    category: 'Heavy Equipment (معدات ثقيلة)',
    sub_category: 'Crawler Crane',
    base_rate: 2800,
    standard_unit: 'day',
    current_status: 'available',
    is_sharable_externally: true,
  },
  {
    _id: 'res_2',
    id: 'res_2',
    identifier: 'EQ-EXC-02',
    name: 'CAT 320D Hydraulic Excavator (حفار كتربلر)',
    category: 'Heavy Equipment (معدات ثقيلة)',
    sub_category: 'Excavator',
    base_rate: 1800,
    standard_unit: 'day',
    current_status: 'available',
    is_sharable_externally: true,
  },
  {
    _id: 'res_3',
    id: 'res_3',
    identifier: 'MP-RIGGER-01',
    name: 'Aramco-Certified Rigger Crew (طاقم عمال ريقرز معتمد أرامكو)',
    category: 'Manpower (قوى عاملة متخصصة)',
    sub_category: 'Rigging Crew',
    base_rate: 1400,
    standard_unit: 'day',
    current_status: 'available',
    is_sharable_externally: true,
  },
  {
    _id: 'res_4',
    id: 'res_4',
    identifier: 'EQ-GEN-150',
    name: 'Cummins 150 kVA Silent Diesel Generator (مولد كهرباء صامت)',
    category: 'Power & Utilities (مولدات وطاقة)',
    sub_category: 'Generator',
    base_rate: 650,
    standard_unit: 'day',
    current_status: 'available',
    is_sharable_externally: true,
  },
];

const defaultResourceRequests: ResourceRequestItem[] = [
  {
    _id: 'req_1',
    id: 'req_1',
    request_code: 'REQ-2026-012',
    project_name: 'Riyadh Logistics Park Phase 2',
    requesting_org: 'Apex Infrastructure Co.',
    supplying_org: 'Gulf Heavy Machinery LLC',
    resource_name: 'Hitachi SCX550 Crawler Crane 50T',
    category: 'Heavy Equipment',
    quantity: 1,
    unit: 'day',
    requested_rate: 2500,
    counter_rate: 2800,
    status: 'counter_offered',
    terms_conditions: 'Counter-offer: 2,800 \uE900/day includes certified operator and rigging tools',
    start_date: '2026-10-01',
    end_date: '2026-10-31',
  },
];

const defaultRaciAssignments: RaciAssignment[] = [
  {
    _id: 'raci_1',
    id: 'raci_1',
    project_id: 'prj_1',
    wbs_code: 'ACT-01',
    activity_name: 'Client Billing & Escrow Collection (الفوترة وتحصيل المستخلصات)',
    discipline: 'Commercial & Billing',
    contractor_name: 'Apex Infrastructure Co. (Your Company / صاحب السجل)',
    raci_role: 'A',
    liability_notes: 'Holds primary legal contract with Client. Controls project bank account.',
  },
  {
    _id: 'raci_2',
    id: 'raci_2',
    project_id: 'prj_1',
    wbs_code: 'ACT-02',
    activity_name: 'Deep Trench Excavation & Grading (أعمال الحفر والردم والتمهيد)',
    discipline: 'Civil & Earthworks',
    contractor_name: 'Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)',
    raci_role: 'R',
    liability_notes: 'Executes physical excavation with certified operators.',
  },
  {
    _id: 'raci_3',
    id: 'raci_3',
    project_id: 'prj_1',
    wbs_code: 'ACT-03',
    activity_name: 'Trench Shoring & HSE Site Safety (تدعيم الحفر والسلامة المهنية)',
    discipline: 'HSE & Safety',
    contractor_name: 'Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)',
    raci_role: 'INDEMNIFIER',
    liability_notes: 'Holds 100% legal indemnification against trench collapses, worker injuries, or municipality site fines.',
  },
  {
    _id: 'raci_4',
    id: 'raci_4',
    project_id: 'prj_2',
    wbs_code: 'ACT-04',
    activity_name: 'Substation Transformer Fit & HV Cabling (تركيب المحولات والجهد العالي)',
    discipline: 'Electrical / MEP',
    contractor_name: 'RedSea MEP Works (Partner C / شريك الكهروميكانيك)',
    raci_role: 'R',
    liability_notes: 'Licensed testing and energized commissioning responsibility.',
  },
  {
    _id: 'raci_5',
    id: 'raci_5',
    project_id: 'prj_1',
    wbs_code: 'ACT-05',
    activity_name: 'Site Diesel Fuel Dispenser (تزويد الديزل والوقود للموقع)',
    discipline: 'Logistics',
    contractor_name: 'Apex Infrastructure Co. (Your Company / صاحب السجل)',
    raci_role: 'R',
    liability_notes: 'Maintains bulk fuel bowser; logs metered pump slips for contra-charge deduction.',
  },
];

const safeLoadJSON = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') return fallback;
    return JSON.parse(saved);
  } catch (err) {
    console.warn(`Failed to parse ${key} from localStorage:`, err);
    return fallback;
  }
};

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined);

export const GovernanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sanadNotes, setSanadNotes] = useState<SanadNote[]>(() => 
    safeLoadJSON(`${STORAGE_KEY}_sanad`, defaultSanadNotes)
  );

  const [nafithAlerts, setNafithAlerts] = useState<NafithAlert[]>(() => 
    safeLoadJSON(`${STORAGE_KEY}_nafith_alerts`, defaultNafithAlerts)
  );

  const [borrowingFacilities, setBorrowingFacilities] = useState<BorrowingFacility[]>(() => 
    safeLoadJSON(`${STORAGE_KEY}_facilities`, defaultBorrowingFacilities)
  );

  const [brandPassports, setBrandPassports] = useState<BrandPassport[]>(() => 
    safeLoadJSON(`${STORAGE_KEY}_passports`, defaultBrandPassports)
  );

  const [projects] = useState<GovernanceProject[]>(defaultProjects);
  const [collaborations, setCollaborations] = useState<CollaborationScope[]>(() =>
    safeLoadJSON(`${STORAGE_KEY}_collaborations`, defaultCollaborations)
  );
  const [consortiumOrganizations] = useState<ConsortiumOrganization[]>(defaultOrganizations);

  const [bilateralTransactions, setBilateralTransactions] = useState<BilateralTransaction[]>(() => 
    safeLoadJSON(`${STORAGE_KEY}_transactions`, defaultBilateralTransactions)
  );

  const [resources, setResources] = useState<SharedResource[]>(() => 
    safeLoadJSON(`${STORAGE_KEY}_resources`, defaultResources)
  );

  const [resourceRequests, setResourceRequests] = useState<ResourceRequestItem[]>(() => 
    safeLoadJSON(`${STORAGE_KEY}_resource_requests`, defaultResourceRequests)
  );

  const [raciAssignments, setRaciAssignments] = useState<RaciAssignment[]>(() => 
    safeLoadJSON(`${STORAGE_KEY}_raci`, defaultRaciAssignments)
  );

  const [stakeholders, setStakeholders] = useState<StakeholderProfile[]>(() => 
    safeLoadJSON(`${STORAGE_KEY}_stakeholders`, defaultStakeholders)
  );

  const [whatsAppLogs, setWhatsAppLogs] = useState<WhatsAppNoticeLog[]>(() => 
    safeLoadJSON(`${STORAGE_KEY}_whatsapp_logs`, defaultWhatsAppLogs)
  );

  // Save to localStorage whenever state mutations occur
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_sanad`, JSON.stringify(sanadNotes));
  }, [sanadNotes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_nafith_alerts`, JSON.stringify(nafithAlerts));
  }, [nafithAlerts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_facilities`, JSON.stringify(borrowingFacilities));
  }, [borrowingFacilities]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_passports`, JSON.stringify(brandPassports));
  }, [brandPassports]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_collaborations`, JSON.stringify(collaborations));
  }, [collaborations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(bilateralTransactions));
  }, [bilateralTransactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_resources`, JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_resource_requests`, JSON.stringify(resourceRequests));
  }, [resourceRequests]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_raci`, JSON.stringify(raciAssignments));
  }, [raciAssignments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_stakeholders`, JSON.stringify(stakeholders));
  }, [stakeholders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_whatsapp_logs`, JSON.stringify(whatsAppLogs));
  }, [whatsAppLogs]);

  const createSanadNote = (data: Partial<SanadNote>) => {
    const id = `san_${Date.now()}`;
    const newNote: SanadNote = {
      _id: id,
      id,
      note_number: `SANAD-2026-${String(sanadNotes.length + 1).padStart(3, '0')}`,
      project_id: data.project_id || 'prj_1',
      project_name: data.project_name || 'Riyadh Logistics Park Phase 2',
      creditor_name: data.creditor_name || 'Supplier',
      creditor_cr: data.creditor_cr,
      amount: data.amount || 100000,
      currency: 'SAR',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: data.due_date || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      days_remaining: 60,
      is_overdue: false,
      is_critical: false,
      purpose: data.purpose || 'Supplier Payment Guarantee (سند لأمر للمورد)',
      counter_secured: data.counter_secured ?? true,
      counter_security_details: data.counter_security_details || 'Signed Partner Backup Guarantee (Sanad Mudhaad / سند مضاد)',
      status: 'active',
      attachment_name: data.attachment_name,
      attachment_url: data.attachment_url,
      counter_attachment_name: data.counter_attachment_name,
    };
    setSanadNotes([newNote, ...sanadNotes]);
  };

  const dischargeSanadNote = (id: string) => {
    setSanadNotes(
      sanadNotes.map((n) => (n.id === id || n._id === id ? { ...n, status: 'discharged' as const } : n))
    );
  };

  const logNafithAlert = (data: Partial<NafithAlert>) => {
    const id = `naf_${Date.now()}`;
    const newAlert: NafithAlert = {
      _id: id,
      id,
      notice_number: data.notice_number || `NAF-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      creditor_name: data.creditor_name || 'Vendor / Bank',
      creditor_cr: data.creditor_cr,
      amount: data.amount || 50000,
      currency: 'SAR',
      project_id: data.project_id || 'prj_1',
      project_name: data.project_name || 'Riyadh Logistics Park Phase 2',
      received_at: new Date().toLocaleString(),
      is_authorized: data.is_authorized ?? true,
      status: data.is_authorized ? 'pending_review' : 'rejected',
      notes: data.notes || '',
      counter_indemnity_ref: data.counter_indemnity_ref,
      attachment_name: data.attachment_name,
      attachment_url: data.attachment_url,
    };
    setNafithAlerts([newAlert, ...nafithAlerts]);

    // If pre-authorized, optionally add to Sanad vault as monitored guarantee
    if (data.is_authorized) {
      createSanadNote({
        creditor_name: newAlert.creditor_name,
        amount: newAlert.amount,
        project_id: newAlert.project_id,
        project_name: newAlert.project_name,
        purpose: `Nafith Notice #${newAlert.notice_number}`,
        counter_secured: !!data.counter_indemnity_ref,
        counter_security_details: data.counter_indemnity_ref
          ? `Backed by Sanad Mudhaad #${data.counter_indemnity_ref}`
          : 'Pending Partner Counter-Signature',
      });
    }

    // AUTOMATIC WHATSAPP BOT TRIGGER FOR NAFITH NOTICE:
    const nafithAutoNotice: WhatsAppNoticeLog = {
      _id: `log_naf_${Date.now()}`,
      id: `log_naf_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notice_type: 'nafith_alert',
      title: `⚠️ تنبيه فوري: منصة نافذ #${newAlert.notice_number}`,
      project_name: newAlert.project_name,
      recipients: stakeholders.map((s) => ({
        stakeholder_id: s.id,
        name: s.name,
        phone: s.phone,
        status: 'delivered' as const,
      })),
      message_body: `*⚠️ [تنبيه منصة نافذ الحرج / Urgent Nafith Notice]*\\n*الجهة الدائنة:* ${newAlert.creditor_name}\\n*المبلغ:* ${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 }).format(newAlert.amount)} \uE900\\n*المشروع:* ${newAlert.project_name}\\n*تاريخ الإشعار:* ${newAlert.received_at}\\n*الإجراء العاجل:* تم إشعار كافة الشركاء بالسداد الفوري لتفادي إيقاف السجل التجاري وحسابات المالك السعودي.`,
      requires_risk_acceptance: false,
    };
    setWhatsAppLogs((prev) => [nafithAutoNotice, ...prev]);
  };

  const resolveNafithAlert = (alertId: string, action: 'accept' | 'reject') => {
    setNafithAlerts(
      nafithAlerts.map((a) =>
        a.id === alertId || a._id === alertId
          ? {
              ...a,
              status: action === 'accept' ? 'accepted_on_nafith' : 'rejected',
            }
          : a
      )
    );
  };

  const createBorrowingFacility = (data: Partial<BorrowingFacility>) => {
    const id = `fac_${Date.now()}`;
    const newFac: BorrowingFacility = {
      _id: id,
      id,
      facility_code: `FAC-${Date.now().toString().slice(-4)}`,
      lender_name: data.lender_name || 'Commercial Bank',
      facility_type: data.facility_type || 'Invoice Factoring (خصم فواتير)',
      approved_limit: data.approved_limit || 1000000,
      drawn_amount: 0,
      finance_cost_rate: data.finance_cost_rate || 4.0,
      currency: 'SAR',
      expiry_date: data.expiry_date || '2027-12-31',
      counter_indemnity_verified: true,
      repayment_waterfall_priority: 1,
      status: 'active',
    };
    setBorrowingFacilities([...borrowingFacilities, newFac]);
  };

  const grantBrandPassport = (data: Partial<BrandPassport>) => {
    const id = `pass_${Date.now()}`;
    const code = `AUTH-2026-${Date.now().toString().slice(-4)}`;
    const newPass: BrandPassport = {
      _id: id,
      id,
      passport_code: code,
      credential_type: data.credential_type || 'Project Permission Pass (تصريح السجل التجاري)',
      certificate_reference: data.certificate_reference || 'CR-REF-99',
      allowed_tender_scope: data.allowed_tender_scope || 'Project Bidding Only. Strictly No Borrowing.',
      valid_to: data.valid_to || '2026-12-31',
      verification_token: `tok_live_${Math.random().toString(36).substring(2, 10)}`,
      allows_borrowing: data.allows_borrowing ?? false,
      status: data.status || 'pending_acceptance',
      granted_to_org: data.granted_to_org || 'Consortium Partner (الشريك المنفذ)',
      liability_cap_sar: data.liability_cap_sar || 600000,
      sole_indemnifier_accepted: data.sole_indemnifier_accepted ?? false,
      acceptance_token: `tok_acc_${Math.random().toString(36).substring(2, 8)}`,
    };
    setBrandPassports((prev) => [...prev, newPass]);

    // AUTOMATIC WHATSAPP BOT TRIGGER:
    // Automatically dispatch risk authorization request to stakeholders
    const saudiOwner = stakeholders.find((s) => s.is_saudi_national && s.company_role === 'lead_cr_holder') || stakeholders[0];
    const executingPartner = stakeholders.find((s) => s.company_name.toLowerCase().includes((data.granted_to_org || '').toLowerCase())) || stakeholders[1];

    const autoNotice: WhatsAppNoticeLog = {
      _id: `log_auto_${Date.now()}`,
      id: `log_auto_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notice_type: 'cr_risk_acceptance',
      title: `🛡️ طلب تفويض استخدام السجل وإقرار الضامن الوحيد #${code}`,
      project_name: 'Consortium Project',
      recipients: [
        { stakeholder_id: executingPartner?.id || 'stk_2', name: executingPartner?.name || 'Executing Partner', phone: executingPartner?.phone || '+966554987654', status: 'delivered' },
        { stakeholder_id: saudiOwner?.id || 'stk_1', name: saudiOwner?.name || 'Saudi CR Owner', phone: saudiOwner?.phone || '+966505123456', status: 'delivered' },
      ],
      related_entity_id: code,
      requires_risk_acceptance: true,
      acceptance_status: 'pending',
      message_body: `*🛡️ [إشعار آلي فوري - طلب تفويض السجل وإقرار المخاطر]*\\n*الجهة المفوضة:* ${newPass.granted_to_org}\\n*كود التصريح:* #${code}\\n*سقف الالتزام:* ${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 }).format(newPass.liability_cap_sar || 600000)} \uE900\\n*النطاق المصرح به:* ${newPass.allowed_tender_scope}\\n*الشرط النظامي:* إقرار الصفة الحصرية كـ (الضامن الوحيد) وإبراء ذمة المالك السعودي وحظر إصدار سندات نافذ.\\n*رابط الاعتماد الفوري:* https://erp.local/governance/portal?action=accept&code=${code}`,
    };
    setWhatsAppLogs((prev) => [autoNotice, ...prev]);
  };

  const recordBilateralTransaction = (data: Partial<BilateralTransaction>) => {
    const id = `tx_${Date.now()}`;
    const totalAmount = data.total_amount || ((data.amount_excl_vat || 0) * 1.15);
    const newTx: BilateralTransaction = {
      _id: id,
      id,
      transaction_code: `TX-2026-${Date.now().toString().slice(-3)}`,
      debtor: data.debtor || 'Partner Company',
      creditor: data.creditor || 'Your Company',
      debtor_name: data.debtor_name || (data.debtor === 'Your Company' ? 'Apex Infrastructure Co. (Your Company)' : 'Gulf Heavy Machinery LLC (Partner)'),
      creditor_name: data.creditor_name || (data.creditor === 'Your Company' ? 'Apex Infrastructure Co. (Your Company)' : 'Gulf Heavy Machinery LLC (Partner)'),
      transaction_type: data.transaction_type || 'Site Service Contra-Charge (خصمية مصاريف موقع)',
      description: data.description || 'Inter-company operational expense recharge',
      total_amount: totalAmount,
      amount_excl_vat: data.amount_excl_vat || totalAmount / 1.15,
      vat_amount: data.vat_amount || totalAmount - (totalAmount / 1.15),
      is_settled: false,
      transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
      slip_attachment_name: data.slip_attachment_name,
      slip_attachment_url: data.slip_attachment_url,
      vendor_name: data.vendor_name,
      transfer_ref: data.transfer_ref,
      po_ref: data.po_ref,
      submitted_via: data.submitted_via || 'dashboard',
    };
    setBilateralTransactions((prev) => [newTx, ...prev]);

    // AUTOMATIC WHATSAPP BOT TRIGGER FOR PAYMENT ON BEHALF / EXPENSE:
    const txNotice: WhatsAppNoticeLog = {
      _id: `log_tx_${Date.now()}`,
      id: `log_tx_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notice_type: 'payment_on_behalf',
      title: `🟢 إشعار سداد معتمد #${newTx.transaction_code} (${newTx.transaction_type})`,
      project_name: 'Consortium Operations',
      recipients: stakeholders.slice(0, 3).map((s) => ({
        stakeholder_id: s.id,
        name: s.name,
        phone: s.phone,
        status: 'delivered' as const,
      })),
      message_body: `*🟢 [إشعار سداد وتوثيق ضريبي آلي / Payment Notification]*\\n*العملية:* ${newTx.transaction_type}\\n*المبلغ الإجمالي:* ${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 }).format(totalAmount)} \uE900\\n*الضريبة الموثقة (15%):* ${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 }).format(newTx.vat_amount || 0)} \uE900\\n*المدين:* ${newTx.debtor_name}\\n*الدائن (المسدد):* ${newTx.creditor_name}\\n*الأثر:* تم تسجيل رصيد المقاصة والمدخلات الضريبية لصالح شركة أ تلقائياً.`,
      requires_risk_acceptance: false,
    };
    setWhatsAppLogs((prev) => [txNotice, ...prev]);
  };

  const executeBilateralDischarge = () => {
    const unsettled = bilateralTransactions.filter((tx) => !tx.is_settled);
    const grossAtoB = unsettled
      .filter((t) => t.debtor === 'Your Company')
      .reduce((sum, t) => sum + t.total_amount, 0);
    const grossBtoA = unsettled
      .filter((t) => t.debtor === 'Partner Company')
      .reduce((sum, t) => sum + t.total_amount, 0);

    const netPayable = Math.abs(grossAtoB - grossBtoA);
    const payer = grossAtoB > grossBtoA ? 'Your Company' : 'Partner Company';
    const clearedCount = unsettled.length;

    setBilateralTransactions(
      bilateralTransactions.map((tx) => ({ ...tx, is_settled: true }))
    );

    // AUTOMATIC WHATSAPP BOT TRIGGER FOR NETTING DISCHARGE:
    const dischargeNotice: WhatsAppNoticeLog = {
      _id: `log_dis_${Date.now()}`,
      id: `log_dis_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notice_type: 'weekly_digest',
      title: `⚖️ إشعار تصفية المقاصة الثنائية (Bilateral Netting Settled)`,
      project_name: 'Consortium Financial Clearing',
      recipients: stakeholders.map((s) => ({
        stakeholder_id: s.id,
        name: s.name,
        phone: s.phone,
        status: 'delivered' as const,
      })),
      message_body: `*⚖️ [إشعار اعتماد المقاصة وتصفية الحسابات / Bilateral Netting]*\\n*عدد الفواتير المسواة:* ${clearedCount} عمليات\\n*صافي المبلغ المستحق:* ${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 }).format(netPayable)} \uE900\\n*الجهة المسددة:* ${payer}\\n*الحالة:* تم إغلاق وتصفية كافة الخصميات المتبادلة بين الشركاء.`,
      requires_risk_acceptance: false,
    };
    setWhatsAppLogs((prev) => [dischargeNotice, ...prev]);

    return { clearedCount, netPayable, payer };
  };

  const createResource = (data: Partial<SharedResource>) => {
    const id = `res_${Date.now()}`;
    const newRes: SharedResource = {
      _id: id,
      id,
      identifier: data.identifier || `EQ-${Date.now().toString().slice(-4)}`,
      name: data.name || 'Heavy Equipment Asset',
      category: data.category || 'Heavy Equipment',
      sub_category: data.sub_category,
      base_rate: data.base_rate || 1000,
      standard_unit: data.standard_unit || 'day',
      current_status: 'available',
      is_sharable_externally: data.is_sharable_externally ?? true,
    };
    setResources([...resources, newRes]);
  };

  const submitResourceRequest = (data: Partial<ResourceRequestItem>) => {
    const id = `req_${Date.now()}`;
    const newReq: ResourceRequestItem = {
      _id: id,
      id,
      request_code: `REQ-2026-${String(resourceRequests.length + 1).padStart(3, '0')}`,
      project_name: data.project_name || 'Riyadh Logistics Park Phase 2',
      requesting_org: data.requesting_org || 'Apex Infrastructure Co.',
      supplying_org: data.supplying_org || 'Gulf Heavy Machinery LLC',
      resource_name: data.resource_name || 'Specialist Equipment',
      category: data.category || 'Heavy Equipment',
      quantity: data.quantity || 1,
      unit: data.unit || 'day',
      requested_rate: data.requested_rate || 2000,
      status: 'pending',
      terms_conditions: data.terms_conditions,
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      end_date: data.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setResourceRequests([newReq, ...resourceRequests]);
  };

  const submitCounterOffer = (requestId: string, counterRate: number, terms: string) => {
    setResourceRequests(
      resourceRequests.map((r) =>
        r.id === requestId || r._id === requestId
          ? {
              ...r,
              counter_rate: counterRate,
              terms_conditions: terms,
              status: 'counter_offered' as const,
            }
          : r
      )
    );
  };

  const acceptResourceRequest = (requestId: string) => {
    setResourceRequests(
      resourceRequests.map((r) =>
        r.id === requestId || r._id === requestId
          ? { ...r, status: 'approved' as const }
          : r
      )
    );
  };

  const createRaciAssignment = (data: Partial<RaciAssignment>) => {
    const id = `raci_${Date.now()}`;
    const newRaci: RaciAssignment = {
      _id: id,
      id,
      project_id: data.project_id || 'prj_1',
      wbs_code: data.wbs_code || `ACT-${String(raciAssignments.length + 1).padStart(2, '0')}`,
      activity_name: data.activity_name || 'Project Activity',
      discipline: data.discipline || 'General Execution',
      contractor_name: data.contractor_name || 'Gulf Heavy Machinery LLC',
      raci_role: data.raci_role || 'R',
      liability_notes: data.liability_notes || '',
    };
    setRaciAssignments([...raciAssignments, newRaci]);
  };

  const addStakeholder = (data: Partial<StakeholderProfile>) => {
    const id = `stk_${Date.now()}`;
    const newStk: StakeholderProfile = {
      _id: id,
      id,
      name: data.name || 'New Stakeholder',
      nameAr: data.nameAr || data.name || 'شريك جديد',
      company_name: data.company_name || 'Consortium Partner',
      company_role: data.company_role || 'execution_partner',
      phone: data.phone || '+966500000000',
      email: data.email,
      is_saudi_national: data.is_saudi_national ?? false,
      national_id: data.national_id,
      notification_tier: data.notification_tier || 'all_alerts',
      is_active: data.is_active ?? true,
    };
    setStakeholders([...stakeholders, newStk]);
  };

  const updateStakeholder = (id: string, data: Partial<StakeholderProfile>) => {
    setStakeholders(
      stakeholders.map((s) => (s.id === id || s._id === id ? { ...s, ...data } : s))
    );
  };

  const deleteStakeholder = (id: string) => {
    setStakeholders(stakeholders.filter((s) => s.id !== id && s._id !== id));
  };

  const addCollaboration = (data: Partial<CollaborationScope>) => {
    const id = `col_${Date.now()}`;
    const newCol: CollaborationScope = {
      _id: id,
      id,
      agreement_code: data.agreement_code || `AGR-2026-${String(collaborations.length + 1).padStart(4, '0')}`,
      project_name: data.project_name || 'Commercial Contracting Consortium Project',
      partner_name: data.partner_name || 'Gulf Heavy Machinery LLC (Partner B)',
      lead_company_name: data.lead_company_name || 'Apex Infrastructure Co. (Your Company / Lead CR)',
      client_name: data.client_name || 'Project Owner / Client',
      contract_value: data.contract_value || 45000000,
      partner_mobile: data.partner_mobile || '+966505123456',
      collaboration_type: data.collaboration_type || 'CR Sponsorship & Execution Consortium',
      management_fee_type: data.management_fee_type || 'zero_fee',
      management_fee_value: data.management_fee_value ?? 0,
      liability_cap: data.liability_cap || 1500000,
      effective_from: data.effective_from || new Date().toISOString().split('T')[0],
      effective_to: data.effective_to || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: (data.status as any) || 'active',
      covenants_agreed: true,
      notes: data.notes || '',
    };
    setCollaborations([newCol, ...collaborations]);
  };

  const updateCollaboration = (id: string, data: Partial<CollaborationScope>) => {
    setCollaborations((prev) =>
      prev.map((c) => (c.id === id || c._id === id ? { ...c, ...data } : c))
    );
  };

  const deleteCollaboration = (id: string) => {
    setCollaborations((prev) => prev.filter((c) => c.id !== id && c._id !== id));
  };

  const dispatchWhatsAppNotice = (notice: Omit<WhatsAppNoticeLog, '_id' | 'id' | 'timestamp'>) => {
    const id = `log_${Date.now()}`;
    const rawRecipients = notice.recipients;
    const recipientsList = Array.isArray(rawRecipients)
      ? rawRecipients.map((r) => ({ ...r, status: 'delivered' as const }))
      : (notice as any).recipient_mobile
      ? [
          {
            stakeholder_id: 'stk_auto',
            name: (notice as any).recipient_name || 'Stakeholder',
            phone: (notice as any).recipient_mobile || '+966500000000',
            status: 'delivered' as const,
          },
        ]
      : [];

    const newLog: WhatsAppNoticeLog = {
      ...notice,
      title: notice.title || (notice as any).notice_type || 'Governance Notice',
      project_name: notice.project_name || 'Consortium Project',
      message_body: notice.message_body || (notice as any).content_body || '',
      requires_risk_acceptance: Boolean(notice.requires_risk_acceptance),
      _id: id,
      id,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      recipients: recipientsList,
    };
    setWhatsAppLogs((prev) => [newLog, ...(prev || [])]);
    return newLog;
  };

  const acceptRiskPassport = (passportId: string, acceptedByName: string, note?: string) => {
    // 1. Update Brand Passport
    setBrandPassports((prev) =>
      prev.map((p) => {
        if (p.id === passportId || p._id === passportId || p.passport_code === passportId) {
          return {
            ...p,
            status: 'active',
            sole_indemnifier_accepted: true,
            risk_accepted_by: acceptedByName,
            risk_accepted_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
        }
        return p;
      })
    );

    // 2. Update matching WhatsApp Log if pending
    setWhatsAppLogs((prev) =>
      prev.map((l) => {
        if (l.related_entity_id === passportId || l.related_entity_id === 'pass_3') {
          return {
            ...l,
            acceptance_status: 'accepted' as const,
            accepted_by: acceptedByName,
            accepted_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
            recipients: l.recipients.map((r) => ({ ...r, status: 'accepted' as const })),
          };
        }
        return l;
      })
    );

    // 3. Automatically dispatch confirmation notice to the Saudi CR Owner
    const saudiOwner =
      stakeholders.find((s) => s.is_saudi_national && s.company_role === 'lead_cr_holder') ||
      stakeholders[0];

    const confirmNotice: WhatsAppNoticeLog = {
      _id: `log_conf_${Date.now()}`,
      id: `log_conf_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notice_type: 'cr_risk_acceptance',
      title: '✅ تم اعتماد إقرار المخاطر رسمياً / Risk Passport Activated',
      project_name: 'Consortium Governance Shield',
      recipients: [
        {
          stakeholder_id: saudiOwner?._id || 'stk_1',
          name: saudiOwner?.name || 'Saudi CR Owner',
          phone: saudiOwner?.phone || '+966505123456',
          status: 'delivered',
        },
      ],
      message_body: `*✅ [إشعار اعتماد رسمي ومحصن - نظام الحوكمة]*\\n*المكرم / ${saudiOwner?.nameAr || 'المالك السعودي للسجل'}*\\nنحيطكم علماً بأن الشريك التنفيذي (*${acceptedByName}*) قد قام رسمياً بالاعتماد الإلكتروني لإقرار المخاطر والصفة الحصرية كـ (*الضامن الوحيد الحصري*) لتصريح استخدام السجل التجاري (#${passportId}).\\n*الحالة:* السجل التجاري محصن نظاماً 100% ضد أي مطالبات غير معتمدة.`,
      requires_risk_acceptance: false,
      acceptance_status: 'accepted',
      accepted_by: acceptedByName,
      accepted_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setWhatsAppLogs((prev) => [confirmNotice, ...prev]);
  };

  const resetToSampleData = () => {
    setSanadNotes(defaultSanadNotes);
    setNafithAlerts(defaultNafithAlerts);
    setBorrowingFacilities(defaultBorrowingFacilities);
    setBrandPassports(defaultBrandPassports);
    setBilateralTransactions(defaultBilateralTransactions);
    setResources(defaultResources);
    setResourceRequests(defaultResourceRequests);
    setRaciAssignments(defaultRaciAssignments);
    setStakeholders(defaultStakeholders);
    setWhatsAppLogs(defaultWhatsAppLogs);
    setCollaborations(defaultCollaborations);
  };

  return (
    <GovernanceContext.Provider
      value={{
        sanadNotes,
        nafithAlerts,
        borrowingFacilities,
        brandPassports,
        projects,
        collaborations,
        bilateralTransactions,
        resources,
        resourceRequests,
        raciAssignments,
        consortiumOrganizations,
        stakeholders,
        whatsAppLogs,
        addStakeholder,
        updateStakeholder,
        deleteStakeholder,
        addCollaboration,
        updateCollaboration,
        deleteCollaboration,
        dispatchWhatsAppNotice,
        acceptRiskPassport,
        createSanadNote,
        dischargeSanadNote,
        logNafithAlert,
        resolveNafithAlert,
        createBorrowingFacility,
        grantBrandPassport,
        recordBilateralTransaction,
        executeBilateralDischarge,
        createResource,
        submitResourceRequest,
        submitCounterOffer,
        acceptResourceRequest,
        createRaciAssignment,
        resetToSampleData,
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
};

export const useGovernance = () => {
  const context = useContext(GovernanceContext);
  if (!context) {
    throw new Error('useGovernance must be used within a GovernanceProvider');
  }
  return context;
};
