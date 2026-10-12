import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Checkbox,
  useDisclosure,
  useToast,
  useColorModeValue,
  Icon,
  IconButton,
  Tooltip,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  Divider,
  Tag,
  Alert,
  AlertIcon,
  InputGroup,
  InputRightAddon,
  Flex,
  Avatar,
  PinInput,
  PinInputField,
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { useLanguage } from '../contexts/shared/LanguageContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import {
  FiUsers,
  FiUserPlus,
  FiDollarSign,
  FiDownload,
  FiPhone,
  FiLock,
  FiRefreshCw,
  FiCheck,
  FiXCircle,
  FiPlus,
  FiShield,
  FiGitCommit,
  FiLayers,
  FiCheckCircle,
  FiEdit2,
  FiTrash2,
  FiCalendar,
  FiGlobe,
  FiPaperclip,
  FiMapPin,
  FiExternalLink,
  FiFileText,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { RiyalCurrencySymbol } from '../components/icons/SaudiRiyalIcon';

// Default Saudi Bank Directory
const DEFAULT_SAUDI_BANKS = [
  { name: 'Al Rajhi Bank (مصرف الراجحي)', swift: 'RJHISARI' },
  { name: 'Saudi National Bank - SNB (البنك الأهلي السعودي)', swift: 'NCBKSARI' },
  { name: 'Riyad Bank (بنك الرياض)', swift: 'RIBLSARI' },
  { name: 'Alinma Bank (مصرف الإنماء)', swift: 'INMASARI' },
  { name: 'Saudi Awwal Bank - SAB (البنك الأول)', swift: 'SABBSARI' },
  { name: 'Arab National Bank - ANB (البنك العربي الوطني)', swift: 'ARNBSARI' },
  { name: 'Banque Saudi Fransi (البنك السعودي الفرنسي)', swift: 'BSFRSARI' },
  { name: 'Bank AlJazira (بنك الجزيرة)', swift: 'BJAZSARI' },
  { name: 'Bank Albilad (بنك البلاد)', swift: 'ALBISARI' },
  { name: 'Gulf International Bank - meem (بنك الخليج الدولي - ميم)', swift: 'GIBKSARI' },
];

// Employment Levels 1 to 7 Definition
export const EMPLOYMENT_LEVELS: Record<number, { level: number; titleEn: string; titleAr: string; color: string; desc: string }> = {
  1: { level: 1, titleEn: 'Level 1: Executive Leadership (C-Suite)', titleAr: 'المستوى 1: القيادة التنفيذية العليا', color: 'purple', desc: 'CEO, Managing Director, Founder, Partner' },
  2: { level: 2, titleEn: 'Level 2: Directors & Division Heads', titleAr: 'المستوى 2: مديرو العموم والقطاعات', color: 'blue', desc: 'Operations Director, Sales Director, CFO' },
  3: { level: 3, titleEn: 'Level 3: Department Managers', titleAr: 'المستوى 3: مديرو الإدارات والأقسام', color: 'teal', desc: 'Branch Manager, Procurement Manager, Finance Manager' },
  4: { level: 4, titleEn: 'Level 4: Supervisors & Team Leads', titleAr: 'المستوى 4: المشرفون وقادة الفرق', color: 'cyan', desc: 'Shift Supervisor, Sales Team Lead' },
  5: { level: 5, titleEn: 'Level 5: Senior Specialists & Engineers', titleAr: 'المستوى 5: كبار الأخصائيين والمهندسين', color: 'green', desc: 'Senior Accountant, Senior Procurement Specialist' },
  6: { level: 6, titleEn: 'Level 6: Associates, Specialists & Cashiers', titleAr: 'المستوى 6: الأخصائيون والكاشير', color: 'orange', desc: 'Sales Rep, Cashier, Inventory Clerk' },
  7: { level: 7, titleEn: 'Level 7: Entry-Level, Assistants & Support', titleAr: 'المستوى 7: المساعدون والمتدربون', color: 'gray', desc: 'Office Assistant, Intern, Support Staff' },
};

export const HRManagementScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedOrganization } = useAuth();
  const { currentLanguage, isRtl, t } = useLanguage();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const subBg = useColorModeValue('gray.50', 'gray.900');

  const isConvex = isConvexOrgId(selectedOrganization);

  // Available ERP System Modules
  const SYSTEM_MODULES = useMemo(() => [
    { id: 'quotations', label: t('navQuotations', 'Quotations & Sales') },
    { id: 'invoices', label: t('navInvoices', 'Invoices & Billing (ZATCA)') },
    { id: 'customers', label: t('navCustomers', 'Customers CRM') },
    { id: 'delivery_notes', label: t('navDeliveryNotes', 'Delivery Notes') },
    { id: 'leads', label: t('navLeads', 'Leads & Pipeline') },
    { id: 'procurement', label: t('navProcurement', 'Procurement Hub') },
    { id: 'suppliers', label: t('navSuppliers', 'Suppliers Directory') },
    { id: 'inventory', label: t('navInventory', 'Inventory & Stock') },
    { id: 'pos', label: t('navQuickPos', 'Quick POS Cashier') },
    { id: 'accounting', label: t('navAccounting', 'Accounting & Ledger') },
    { id: 'governance', label: t('navGovernance', 'Corporate Governance') },
    { id: 'settings', label: t('navSettings', 'System Settings') },
  ], [t]);

  const allModuleIds = useMemo(() => SYSTEM_MODULES.map((m) => m.id), [SYSTEM_MODULES]);

  // Role labels
  const roleLabels: Record<string, string> = {
    sales_rep: t('roleSalesRep', 'Sales Representative'),
    cashier: t('roleCashier', 'POS Cashier'),
    procurement_officer: t('roleProcurement', 'Procurement Officer'),
    inventory_clerk: t('roleInventoryClerk', 'Inventory Custodian'),
    accountant: t('roleAccountant', 'General Accountant'),
    data_analyst: t('roleDataAnalyst', 'Data Analyst / BI (محلل بيانات)'),
    it_technician: t('roleItTechnician', 'IT Technician & Support (تقنية المعلومات)'),
    custom: t('roleCustom', 'Custom Role'),
  };

  // Queries
  const employees = useQuery(
    api.employees.listEmployees,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const departments = useQuery(
    api.departmentsAndOrgChart.listDepartments,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const customBanks = useQuery(
    api.departmentsAndOrgChart.listOrganizationBanks,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const orgChartData = useQuery(
    api.departmentsAndOrgChart.getOrgChart,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const approvers = useQuery(
    api.whatsappApprovals.listApprovers,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const approvalRequests = useQuery(
    api.whatsappApprovals.listApprovalRequests,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const payrollRuns = useQuery(
    api.payroll.listPayrollRuns,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const leaves = useQuery(
    (api as any).leaves.listLeaves,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );
  const exitReentryTasks = useQuery(
    (api as any).leaves.listExitReentryTasks,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Mutations
  const createEmployeeMutation = useMutation(api.employees.createEmployee);
  const updateErpAccessMutation = useMutation(api.employees.updateErpAccess);
  const saveCompensationMutation = useMutation(api.compensation.saveCompensationContract);
  const dispatchApprovalMutation = useMutation(api.whatsappApprovals.dispatchApprovalRequest);
  const processApprovalMutation = useMutation(api.whatsappApprovals.processApprovalDecision);
  const createApproverMutation = useMutation(api.whatsappApprovals.createApprover);
  const updateApproverMutation = useMutation((api as any).whatsappApprovals.updateApprover);
  const deleteApproverMutation = useMutation((api as any).whatsappApprovals.deleteApprover);
  const generatePayrollMutation = useMutation(api.payroll.generateMonthlyPayroll);
  const submitPayrollApprovalMutation = useMutation(api.payroll.submitPayrollForWhatsAppApproval);

  // New mutations
  const createDepartmentMutation = useMutation(api.departmentsAndOrgChart.createDepartment);
  const createBankMutation = useMutation(api.departmentsAndOrgChart.createOrganizationBank);
  const send2faOtpMutation = useMutation(api.phone2fa.sendPhoneVerificationOtp);
  const verify2faOtpMutation = useMutation(api.phone2fa.verifyPhoneOtp);
  const submitLeaveMutation = useMutation((api as any).leaves.submitLeave);
  const deleteLeaveMutation = useMutation((api as any).leaves.deleteLeave);

  // Legal Documents & Assets Queries
  const expiringDocs = useQuery(
    api.legalDocuments.listExpiringDocuments,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );
  const availableAssets = useQuery(
    api.assets.listAssets,
    isConvex ? { organization_id: selectedOrganization as any, status: 'available' } : 'skip'
  );

  // Legal Documents & Compliance Mutations
  const addLegalDocMutation = useMutation(api.legalDocuments.addLegalDocument);
  const deleteLegalDocMutation = useMutation(api.legalDocuments.deleteLegalDocument);
  const runComplianceCheckMutation = useMutation(api.stakeholderNotifications.runDailyComplianceCheck);

  // Modal disclosures
  const { isOpen: isAddEmpOpen, onOpen: onAddEmpOpen, onClose: onAddEmpClose } = useDisclosure();
  const { isOpen: isAccessModalOpen, onOpen: onAccessModalOpen, onClose: onAccessModalClose } = useDisclosure();
  const { isOpen: isSalaryModalOpen, onOpen: onSalaryModalOpen, onClose: onSalaryModalClose } = useDisclosure();
  const { isOpen: isApproverModalOpen, onOpen: onApproverModalOpen, onClose: onApproverModalClose } = useDisclosure();
  const { isOpen: isAddDeptOpen, onOpen: onAddDeptOpen, onClose: onAddDeptClose } = useDisclosure();
  const { isOpen: isAddBankOpen, onOpen: onAddBankOpen, onClose: onAddBankClose } = useDisclosure();
  const { isOpen: is2faModalOpen, onOpen: on2faModalOpen, onClose: on2faModalClose } = useDisclosure();
  const { isOpen: isAddLeaveOpen, onOpen: onAddLeaveOpen, onClose: onAddLeaveClose } = useDisclosure();
  const { isOpen: isAddDocModalOpen, onOpen: onAddDocModalOpen, onClose: onAddDocModalClose } = useDisclosure();

  // Selected Employee for modals
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  // Combined Banks list (System defaults + Custom Banks)
  const allBanks = useMemo(() => {
    const list = [...DEFAULT_SAUDI_BANKS];
    if (customBanks && customBanks.length > 0) {
      customBanks.forEach((cb) => {
        list.push({
          name: cb.bank_name_arabic ? `${cb.bank_name} (${cb.bank_name_arabic})` : cb.bank_name,
          swift: cb.swift_code,
        });
      });
    }
    return list;
  }, [customBanks]);

  // Employee Form State
  const [empForm, setEmpForm] = useState({
    firstName: '',
    lastName: '',
    fullNameArabic: '',
    nationalId: '',
    nationality: 'Saudi Arabia',
    isSaudi: true,
    gender: 'male',
    jobTitle: '',
    jobTitleArabic: '',
    department: 'Sales & Marketing',
    employmentLevel: 6,
    reportsToId: '',
    hireDate: new Date().toISOString().split('T')[0],
    contractType: 'indefinite',
    qiwaContractId: '',
    qiwaContractStatus: 'authenticated',
    email: '',
    phone: '',
    phone2faVerified: false,
    twoFactorEnabled: false,
    bankName: DEFAULT_SAUDI_BANKS[0].name,
    bankSwiftCode: DEFAULT_SAUDI_BANKS[0].swift,
    iban: '',
    erpAccessEnabled: true,
    assignedRole: 'sales_rep',
    modulePermissions: ['quotations', 'invoices', 'customers'],
    dataScope: 'department_only',
    // Extended Onboarding & Compliance Fields
    employmentType: 'permanent',
    workLocation: 'head_office_riyadh',
    siteProjectName: '',
    workLocationSpl: '', // Saudi Post (SPL) Short Address for Work Location e.g. RRRD2929
    workLocationGps: '', // GPS Coordinates e.g. 24.7136, 46.6753
    workLocationMapsUrl: '',
    // National Address (SPL)
    shortAddress: '', // Primary SPL National Short Address e.g. RRRD2929
    showManualAddressBreakdown: false, // Optional toggle for manual building/street details
    buildingNumber: '',
    streetName: '',
    district: '',
    city: 'Riyadh',
    postalCode: '',
    emergencyName: '',
    emergencyRel: 'spouse',
    emergencyPhone: '',
    bloodGroup: 'O+',
    gosiNumber: '',
    passportNumber: '',
    passportExpiry: '',
    iqamaExpiry: '',
    insurancePolicy: '',
    insuranceClass: 'Class A',
    insuranceExpiry: '',
    // Medical Examination & Reports (Efada Platform)
    medicalFitStatus: 'fit', // "fit" | "unfit" | "pending_results"
    medicalCenter: 'Dr. Sulaiman Al Habib Hospital',
    medicalExamDate: new Date().toISOString().split('T')[0],
    medicalReportRef: '',
    medicalAttachmentUrl: '',
    medicalAttachmentName: '',
    medicalNotes: '',
    assignedAssetIds: [] as string[],
  });

  // Legal Document Form State (for adding docs to existing employees)
  const [docForm, setDocForm] = useState({
    employeeId: '',
    documentType: 'iqama',
    documentNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    issuingAuthority: 'Jawazat',
    insuranceProvider: '',
    insuranceClass: 'Class A',
    insurancePolicyNumber: '',
    notes: '',
  });

  // 2FA Verification Modal State
  const [twoFaState, setTwoFaState] = useState({
    phone: '',
    otpInput: '',
    simulatedCode: '',
    isVerifying: false,
    isSent: false,
  });

  // Department Form State
  const [deptForm, setDeptForm] = useState({
    name: '',
    nameArabic: '',
    code: '',
    description: '',
  });

  // Custom Bank Form State
  const [bankForm, setBankForm] = useState({
    bankName: '',
    bankNameArabic: '',
    swiftCode: '',
    accountNumber: '',
    iban: '',
  });

  // ERP Access Modal Form State
  const [accessForm, setAccessForm] = useState({
    erpAccessEnabled: false,
    assignedRole: 'custom',
    modulePermissions: [] as string[],
    dataScope: 'department_only',
  });

  // Salary Calculator Form State
  const [salaryForm, setSalaryForm] = useState({
    basicSalary: 6000,
    housingAllowance: 1500,
    transportAllowance: 600,
    otherAllowances: 0,
    effectiveDate: new Date().toISOString().split('T')[0],
    qiwaContractId: '',
    qiwaContractStatus: 'authenticated',
    notes: 'Standard Saudi Labor Contract (KSA WPS & Mudad)',
  });

  // Approver Form State
  const [approverForm, setApproverForm] = useState({
    fullName: '',
    role: 'sponsor',
    phoneNumber: '+9665',
    approvalScope: ['all'],
  });
  const [editingApproverId, setEditingApproverId] = useState<string | null>(null);

  // Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'annual',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    daysCount: 5,
    travelOutsideSaudi: false,
    medicalReportRef: '',
    notes: '',
  });

  // Payroll Month Selector
  const [payrollMonth, setPayrollMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Org Chart View Mode: 'level' or 'department'
  const [orgChartView, setOrgChartView] = useState<'level' | 'department'>('level');

  // Main Tabs Active Index
  const [tabIndex, setTabIndex] = useState(0);

  // Qiwa compliance pre-flight check list
  const unlinkedQiwaEmployees = useMemo(() => {
    return (employees || []).filter((e) => !e.qiwa_contract_id || e.qiwa_contract_status !== 'authenticated');
  }, [employees]);

  // Calculations for Salary Calculator Tab / Modal
  const isTargetSaudi = selectedEmp ? selectedEmp.is_saudi : true;
  const grossSalary =
    salaryForm.basicSalary +
    salaryForm.housingAllowance +
    salaryForm.transportAllowance +
    salaryForm.otherAllowances;
  const gosiSubjectWage = Math.min(salaryForm.basicSalary + salaryForm.housingAllowance, 45000);
  const employeeGosiRate = isTargetSaudi ? 0.0975 : 0.0;
  const employerGosiRate = isTargetSaudi ? 0.1175 : 0.02;
  const employeeGosiDeduction = Math.round(gosiSubjectWage * employeeGosiRate * 100) / 100;
  const employerGosiCost = Math.round(gosiSubjectWage * employerGosiRate * 100) / 100;
  const netPayable = Math.round((grossSalary - employeeGosiDeduction) * 100) / 100;
  const monthlyEosbAccrual = Math.round(((salaryForm.basicSalary + salaryForm.housingAllowance) * 0.5 / 12) * 100) / 100;

  // Workforce KPI Summary
  const kpis = useMemo(() => {
    if (!employees || employees.length === 0) {
      return {
        total: 0,
        saudiCount: 0,
        expatCount: 0,
        saudizationRate: 0,
        activeErpUsers: 0,
        pendingApprovalsCount: 0,
      };
    }
    const total = employees.length;
    const saudiCount = employees.filter((e) => e.is_saudi).length;
    const expatCount = total - saudiCount;
    const saudizationRate = Math.round((saudiCount / total) * 100);
    const activeErpUsers = employees.filter((e) => e.erp_access_enabled && e.access_approval_status === 'approved').length;
    const pendingApprovalsCount = (approvalRequests || []).filter((r) => r.status === 'pending').length;

    return {
      total,
      saudiCount,
      expatCount,
      saudizationRate,
      activeErpUsers,
      pendingApprovalsCount,
    };
  }, [employees, approvalRequests]);

  // Handle Bank Selection change
  const handleBankChange = (bankName: string) => {
    const found = allBanks.find((b) => b.name === bankName);
    setEmpForm((prev) => ({
      ...prev,
      bankName,
      bankSwiftCode: found ? found.swift : '',
    }));
  };

  // Helper: auto calculate standard allowances
  const setStandardAllowances = (basic: number) => {
    const housing = Math.round(basic * 0.25);
    const transport = Math.round(basic * 0.10);
    setSalaryForm((prev) => ({
      ...prev,
      basicSalary: basic,
      housingAllowance: housing,
      transportAllowance: transport,
    }));
  };

  // Trigger 2FA Send OTP
  const handleInitiate2fa = async (phone: string) => {
    if (!phone || phone.length < 8) {
      toast({
        title: t('invalidPhone', 'Invalid Phone Number'),
        description: t('enterValidPhoneTip', 'Please enter a valid mobile number first'),
        status: 'warning',
      });
      return;
    }

    try {
      setTwoFaState((p) => ({ ...p, isVerifying: true }));
      const res = await send2faOtpMutation({ phone_number: phone });
      setTwoFaState({
        phone: res.phone_number,
        otpInput: '',
        simulatedCode: res.simulated_code,
        isVerifying: false,
        isSent: true,
      });
      on2faModalOpen();
      toast({
        title: t('otpDispatched', '2FA OTP Dispatched'),
        description: res.message,
        status: 'info',
      });
    } catch (err: any) {
      setTwoFaState((p) => ({ ...p, isVerifying: false }));
      toast({
        title: t('error', 'Error sending 2FA code'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Confirm 2FA OTP
  const handleConfirm2fa = async () => {
    if (!twoFaState.otpInput || twoFaState.otpInput.length < 6) {
      toast({
        title: t('incompleteCode', 'Please enter the 6-digit verification code'),
        status: 'warning',
      });
      return;
    }

    try {
      await verify2faOtpMutation({
        phone_number: twoFaState.phone,
        otp_code: twoFaState.otpInput,
      });

      setEmpForm((prev) => ({
        ...prev,
        phone2faVerified: true,
        twoFactorEnabled: true,
      }));

      toast({
        title: t('phoneVerified', 'Mobile Number Verified via 2FA'),
        description: t('phoneVerifiedDesc', 'Two-factor authentication successfully attached to employee'),
        status: 'success',
      });
      on2faModalClose();
    } catch (err: any) {
      toast({
        title: t('invalidCode', 'Invalid verification code'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Create Custom Department
  const handleCreateDepartment = async () => {
    if (!deptForm.name) {
      toast({ title: t('deptNameRequired', 'Department name is required'), status: 'warning' });
      return;
    }

    try {
      await createDepartmentMutation({
        organization_id: selectedOrganization as any,
        name: deptForm.name,
        name_arabic: deptForm.nameArabic || deptForm.name,
        code: deptForm.code || deptForm.name.slice(0, 4).toUpperCase(),
        description: deptForm.description,
      });

      toast({
        title: t('departmentAdded', 'Department Added Successfully'),
        status: 'success',
      });
      setDeptForm({ name: '', nameArabic: '', code: '', description: '' });
      onAddDeptClose();
    } catch (err: any) {
      toast({ title: t('error', 'Error creating department'), description: err.message, status: 'error' });
    }
  };

  // Create Custom Bank
  const handleCreateBank = async () => {
    if (!bankForm.bankName || !bankForm.swiftCode) {
      toast({ title: t('bankNameSwiftRequired', 'Bank name and SWIFT BIC are required'), status: 'warning' });
      return;
    }

    try {
      await createBankMutation({
        organization_id: selectedOrganization as any,
        bank_name: bankForm.bankName,
        bank_name_arabic: bankForm.bankNameArabic || bankForm.bankName,
        swift_code: bankForm.swiftCode,
        account_number: bankForm.accountNumber || undefined,
        iban: bankForm.iban || undefined,
      });

      toast({
        title: t('bankAdded', 'Bank Account Added Successfully'),
        status: 'success',
      });
      setBankForm({ bankName: '', bankNameArabic: '', swiftCode: '', accountNumber: '', iban: '' });
      onAddBankClose();
    } catch (err: any) {
      toast({ title: t('error', 'Error registering bank'), description: err.message, status: 'error' });
    }
  };

  // Handle Data Scope Change: Auto-grant all modules if "All Organization Records" is selected
  const handleDataScopeChange = (scope: string, isModalForm = false) => {
    if (isModalForm) {
      setAccessForm((prev) => {
        const isAll = scope === 'all_organization_records';
        return {
          ...prev,
          dataScope: scope,
          modulePermissions: isAll ? allModuleIds : prev.modulePermissions,
        };
      });
    } else {
      setEmpForm((prev) => {
        const isAll = scope === 'all_organization_records';
        return {
          ...prev,
          dataScope: scope,
          modulePermissions: isAll ? allModuleIds : prev.modulePermissions,
        };
      });
    }

    if (scope === 'all_organization_records') {
      toast({
        title: t('allOrgScopeSelected', 'Enterprise Scope Selected'),
        description: t('allModulesAutoGrantedTip', 'Access to all ERP modules has been automatically granted for full organization visibility.'),
        status: 'info',
        duration: 3000,
      });
    }
  };

  // Helper: Get GPS Location from Device Browser
  const handleGetGpsLocation = (target: 'work' | 'address') => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser or device does not support GPS location.',
        status: 'warning',
      });
      return;
    }
    toast({
      title: 'Acquiring GPS...',
      description: 'Requesting device coordinates',
      status: 'info',
      duration: 2000,
    });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const coordStr = `${lat}, ${lng}`;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        if (target === 'work') {
          setEmpForm((prev) => ({
            ...prev,
            workLocationGps: coordStr,
            workLocationMapsUrl: mapsUrl,
          }));
        }
        toast({
          title: '📍 GPS Location Acquired',
          description: `Coordinates: ${coordStr}`,
          status: 'success',
        });
      },
      (err) => {
        toast({
          title: 'GPS Location Error',
          description: err.message,
          status: 'error',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Helper: Handle Medical Report File Upload
  const handleMedicalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Medical report attachment should be under 5MB',
        status: 'warning',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setEmpForm((prev) => ({
        ...prev,
        medicalAttachmentUrl: dataUrl,
        medicalAttachmentName: file.name,
      }));
      toast({
        title: 'Medical Report Attached',
        description: `${file.name} ready to submit`,
        status: 'info',
      });
    };
    reader.readAsDataURL(file);
  };

  // Action: Create Employee
  const handleCreateEmployee = async () => {
    if (!empForm.firstName || !empForm.nationalId || !empForm.iban) {
      toast({
        title: t('incompleteData', 'Incomplete Information'),
        description: t('empFormValidationTip', 'Please enter employee name, National ID/Iqama, and valid Saudi IBAN'),
        status: 'warning',
      });
      return;
    }

    try {
      const res = await createEmployeeMutation({
        organization_id: selectedOrganization as any,
        first_name: empForm.firstName,
        last_name: empForm.lastName,
        full_name_arabic: empForm.fullNameArabic || `${empForm.firstName} ${empForm.lastName}`,
        national_id_or_iqama: empForm.nationalId,
        nationality: empForm.nationality,
        is_saudi: empForm.isSaudi,
        gender: empForm.gender,
        job_title: empForm.jobTitle,
        job_title_arabic: empForm.jobTitleArabic || empForm.jobTitle,
        department: empForm.department,
        employment_level: empForm.employmentLevel,
        reports_to_id: empForm.reportsToId || undefined,
        hire_date: empForm.hireDate,
        contract_type: empForm.contractType,
        qiwa_contract_id: empForm.qiwaContractId?.trim() || undefined,
        qiwa_contract_status: empForm.qiwaContractStatus || 'authenticated',
        email: empForm.email || undefined,
        phone: empForm.phone || undefined,
        phone_2fa_verified: empForm.phone2faVerified,
        two_factor_enabled: empForm.twoFactorEnabled,
        bank_name: empForm.bankName,
        bank_swift_code: empForm.bankSwiftCode,
        iban: empForm.iban,
        erp_access_enabled: empForm.erpAccessEnabled,
        assigned_role: empForm.assignedRole,
        module_permissions: empForm.modulePermissions,
        data_scope: empForm.dataScope,
        // Extended Onboarding & Compliance Parameters
        employment_type: empForm.employmentType,
        work_location: empForm.workLocation,
        site_project_name: empForm.siteProjectName || undefined,
        work_location_spl: empForm.workLocationSpl?.trim() || undefined,
        work_location_gps: empForm.workLocationGps?.trim() || undefined,
        work_location_maps_url: empForm.workLocationMapsUrl || (empForm.workLocationGps ? `https://www.google.com/maps?q=${empForm.workLocationGps.replace(/\s+/g, '')}` : undefined),
        blood_group: empForm.bloodGroup || undefined,
        gosi_subscriber_number: empForm.gosiNumber || undefined,
        // National Address: SPL Short Address takes precedence and avoids manual breakdown
        national_address: (empForm.shortAddress || empForm.buildingNumber)
          ? {
              short_address: empForm.shortAddress?.trim() || undefined,
              spl_address: empForm.shortAddress?.trim() || undefined,
              building_number: empForm.buildingNumber || undefined,
              street_name: empForm.streetName || undefined,
              district: empForm.district || undefined,
              city: empForm.city || undefined,
              postal_code: empForm.postalCode || undefined,
            }
          : undefined,
        // Medical Examination & Report
        medical_report: (empForm.medicalFitStatus || empForm.medicalCenter || empForm.medicalReportRef || empForm.medicalAttachmentUrl)
          ? {
              status: empForm.medicalFitStatus,
              medical_center: empForm.medicalCenter || 'Primary Healthcare',
              exam_date: empForm.medicalExamDate || empForm.hireDate,
              report_reference_no: empForm.medicalReportRef?.trim() || undefined,
              attachment_url: empForm.medicalAttachmentUrl || undefined,
              file_name: empForm.medicalAttachmentName || undefined,
              notes: empForm.medicalNotes?.trim() || undefined,
            }
          : undefined,
        emergency_contact: empForm.emergencyName
          ? {
              name: empForm.emergencyName,
              relationship: empForm.emergencyRel,
              phone_primary: empForm.emergencyPhone || empForm.phone || '0000000000',
              city: empForm.city,
            }
          : undefined,
        initial_legal_docs: [
          ...(empForm.iqamaExpiry
            ? [
                {
                  document_type: empForm.isSaudi ? 'national_id' : 'iqama',
                  document_number: empForm.nationalId,
                  issue_date_gregorian: empForm.hireDate,
                  expiry_date_gregorian: empForm.iqamaExpiry,
                  issuing_authority: empForm.isSaudi ? 'Ahwal Madani' : 'Jawazat',
                },
              ]
            : []),
          ...(empForm.passportNumber && empForm.passportExpiry
            ? [
                {
                  document_type: 'passport',
                  document_number: empForm.passportNumber,
                  issue_date_gregorian: empForm.hireDate,
                  expiry_date_gregorian: empForm.passportExpiry,
                  issuing_authority: 'Passport Office',
                },
              ]
            : []),
          ...(empForm.insurancePolicy && empForm.insuranceExpiry
            ? [
                {
                  document_type: 'medical_insurance',
                  document_number: empForm.insurancePolicy,
                  issue_date_gregorian: empForm.hireDate,
                  expiry_date_gregorian: empForm.insuranceExpiry,
                  insurance_provider: 'CCHI Partner',
                  insurance_class: empForm.insuranceClass,
                  insurance_policy_number: empForm.insurancePolicy,
                },
              ]
            : []),
        ],
        initial_asset_ids: empForm.assignedAssetIds.length > 0 ? empForm.assignedAssetIds : undefined,
      });

      if (empForm.erpAccessEnabled && res.employee_id) {
        await dispatchApprovalMutation({
          organization_id: selectedOrganization as any,
          request_type: 'erp_access',
          reference_id: res.employee_number,
          reference_record_id: res.employee_id,
          summary_text: `🔐 *ERP Access Request - طلب صلاحيات دخول*\n👤 Employee: ${empForm.fullNameArabic || empForm.firstName}\n🆔 ID/Iqama: ${empForm.nationalId}\n💼 Title: ${empForm.jobTitle} (${empForm.department}) - Level ${empForm.employmentLevel}\n📋 Qiwa Contract: ${empForm.qiwaContractId || 'Not linked'} (${empForm.qiwaContractStatus})\n🔑 Permissions: ${empForm.modulePermissions.join(', ')}\n🌐 Scope: ${empForm.dataScope}\n🛡️ 2FA: ${empForm.phone2faVerified ? 'Verified' : 'Disabled'}`,
        });
      }

      toast({
        title: t('employeeCreatedSuccess', 'Employee Profile Created Successfully'),
        description: empForm.erpAccessEnabled
          ? `${t('whatsAppApprovalDispatched', 'Approval request dispatched via WhatsApp')} (${res.employee_number})`
          : `${t('savedSuccessfully', 'Saved successfully')} (${res.employee_number})`,
        status: 'success',
      });
      onAddEmpClose();
    } catch (err: any) {
      toast({
        title: t('error', 'Error'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Open Access Modal
  const openAccessModal = (emp: any) => {
    setSelectedEmp(emp);
    setAccessForm({
      erpAccessEnabled: emp.erp_access_enabled ?? false,
      assignedRole: emp.assigned_role || 'sales_rep',
      modulePermissions: emp.module_permissions || [],
      dataScope: emp.data_scope || 'department_only',
    });
    onAccessModalOpen();
  };

  // Save Access settings
  const handleSaveAccess = async () => {
    if (!selectedEmp) return;
    try {
      await updateErpAccessMutation({
        employee_id: selectedEmp._id,
        erp_access_enabled: accessForm.erpAccessEnabled,
        assigned_role: accessForm.assignedRole,
        module_permissions: accessForm.modulePermissions,
        data_scope: accessForm.dataScope,
      });

      if (accessForm.erpAccessEnabled) {
        await dispatchApprovalMutation({
          organization_id: selectedOrganization as any,
          request_type: 'erp_access',
          reference_id: selectedEmp.employee_number,
          reference_record_id: selectedEmp._id,
          summary_text: `🔐 *ERP Permission Update - تحديث صلاحيات*\n👤 Employee: ${selectedEmp.full_name_arabic || selectedEmp.first_name}\n💼 Position: ${selectedEmp.job_title || selectedEmp.jobTitle}\n🔑 Modules: ${accessForm.modulePermissions.join(', ')}\n🌐 Data Scope: ${accessForm.dataScope}`,
        });
      }

      toast({
        title: t('permissionsSaved', 'Permissions Saved'),
        status: 'success',
      });
      onAccessModalClose();
    } catch (err: any) {
      toast({
        title: t('error', 'Error saving permissions'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Open Salary Modal / Navigate to Salary Tab
  const openSalaryModal = (emp: any) => {
    setSelectedEmp(emp);
    if (emp.compensation) {
      setSalaryForm({
        basicSalary: emp.compensation.basic_salary,
        housingAllowance: emp.compensation.housing_allowance,
        transportAllowance: emp.compensation.transport_allowance || 0,
        otherAllowances: emp.compensation.other_allowances || 0,
        effectiveDate: emp.compensation.effective_date || new Date().toISOString().split('T')[0],
        qiwaContractId: emp.compensation.qiwa_contract_id || emp.qiwa_contract_id || '',
        qiwaContractStatus: emp.compensation.qiwa_contract_status || emp.qiwa_contract_status || 'authenticated',
        notes: emp.compensation.notes || '',
      });
    } else {
      setStandardAllowances(6000);
      setSalaryForm((prev) => ({
        ...prev,
        qiwaContractId: emp.qiwa_contract_id || '',
        qiwaContractStatus: emp.qiwa_contract_status || 'authenticated',
      }));
    }
    setTabIndex(2);
    onSalaryModalOpen();
  };

  // Save Salary Contract
  const handleSaveSalaryContract = async () => {
    if (!selectedEmp) return;
    try {
      const res = await saveCompensationMutation({
        employee_id: selectedEmp._id,
        organization_id: selectedOrganization as any,
        basic_salary: salaryForm.basicSalary,
        housing_allowance: salaryForm.housingAllowance,
        transport_allowance: salaryForm.transportAllowance,
        other_allowances: salaryForm.otherAllowances,
        effective_date: salaryForm.effectiveDate,
        notes: salaryForm.notes,
        qiwa_contract_id: salaryForm.qiwaContractId?.trim() || undefined,
        qiwa_contract_status: salaryForm.qiwaContractStatus || 'authenticated',
      });

      await dispatchApprovalMutation({
        organization_id: selectedOrganization as any,
        request_type: 'salary_contract',
        reference_id: selectedEmp.employee_number,
        reference_record_id: res.contract_id,
        summary_text: `📄 *Salary Contract Authorization - عقد عمل سعودي*\n👤 Employee: ${selectedEmp.full_name_arabic || selectedEmp.first_name} (${selectedEmp.is_saudi ? 'Saudi' : 'Expat'})\n📋 Qiwa Contract: ${salaryForm.qiwaContractId || 'Not linked'} (${salaryForm.qiwaContractStatus})\n💵 Basic: ${salaryForm.basicSalary.toLocaleString()} \uE900\n🏠 Housing (25%): ${salaryForm.housingAllowance.toLocaleString()} \uE900\n🚗 Transport: ${salaryForm.transportAllowance.toLocaleString()} \uE900\n🛡️ GOSI Deduction: ${employeeGosiDeduction.toLocaleString()} \uE900\n💳 Net Bank Payout: ${netPayable.toLocaleString()} \uE900\n🏛️ Employer GOSI: ${employerGosiCost.toLocaleString()} \uE900`,
      });

      toast({
        title: t('contractSaved', 'Salary Contract Saved & Dispatched'),
        status: 'success',
      });
      onSalaryModalClose();
    } catch (err: any) {
      toast({
        title: t('error', 'Error saving contract'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Open Create Approver Modal
  const openCreateApproverModal = () => {
    setEditingApproverId(null);
    setApproverForm({
      fullName: '',
      role: 'sponsor',
      phoneNumber: '+9665',
      approvalScope: ['all'],
    });
    onApproverModalOpen();
  };

  // Open Edit Approver Modal
  const openEditApproverModal = (app: any) => {
    setEditingApproverId(app._id);
    setApproverForm({
      fullName: app.full_name,
      role: app.role,
      phoneNumber: app.phone_number,
      approvalScope: app.approval_scope || ['all'],
    });
    onApproverModalOpen();
  };

  // Delete Approver
  const handleDeleteApprover = async (approverId: string, name: string) => {
    if (!window.confirm(t('confirmDeleteApprover', `Are you sure you want to remove stakeholder ${name}?`))) {
      return;
    }
    try {
      await deleteApproverMutation({ approver_id: approverId as any });
      toast({
        title: t('approverDeleted', 'Stakeholder Removed Successfully'),
        status: 'success',
      });
    } catch (err: any) {
      toast({
        title: t('error', 'Error'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Save Approver (Create or Update)
  const handleSaveApprover = async () => {
    if (!approverForm.fullName || !approverForm.phoneNumber) {
      toast({
        title: t('incompleteData', 'Incomplete Data'),
        status: 'warning',
      });
      return;
    }
    try {
      if (editingApproverId) {
        await updateApproverMutation({
          approver_id: editingApproverId as any,
          full_name: approverForm.fullName,
          role: approverForm.role,
          phone_number: approverForm.phoneNumber,
          approval_scope: approverForm.approvalScope,
        });
        toast({
          title: t('approverUpdated', 'Stakeholder Approver Updated Successfully'),
          status: 'success',
        });
      } else {
        await createApproverMutation({
          organization_id: selectedOrganization as any,
          full_name: approverForm.fullName,
          role: approverForm.role,
          phone_number: approverForm.phoneNumber,
          approval_scope: approverForm.approvalScope,
        });
        toast({
          title: t('approverSaved', 'Stakeholder Approver Registered Successfully'),
          status: 'success',
        });
      }
      onApproverModalClose();
    } catch (err: any) {
      toast({
        title: t('error', 'Error saving stakeholder'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = async () => {
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate || leaveForm.daysCount <= 0) {
      toast({
        title: t('incompleteData', 'Incomplete Data'),
        description: t('leaveValidationDesc', 'Please select employee, dates, and positive day count'),
        status: 'warning',
      });
      return;
    }
    try {
      const result = await submitLeaveMutation({
        organization_id: selectedOrganization as any,
        employee_id: leaveForm.employeeId as any,
        leave_type: leaveForm.leaveType,
        start_date: leaveForm.startDate,
        end_date: leaveForm.endDate,
        days_count: Number(leaveForm.daysCount),
        travel_outside_saudi: leaveForm.travelOutsideSaudi,
        medical_report_ref: leaveForm.medicalReportRef || undefined,
        notes: leaveForm.notes || undefined,
      });
      toast({
        title: t('leaveRecorded', 'Leave Request Submitted'),
        description: `${t('pendingManagerApproval', 'Pending immediate manager approval')}: ${result.approver_name} (${result.approver_phone})`,
        status: 'success',
      });
      onAddLeaveClose();
    } catch (err: any) {
      toast({
        title: t('error', 'Error'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Delete Leave Request
  const handleDeleteLeave = async (leaveId: string) => {
    if (!window.confirm(t('confirmDeleteLeave', 'Are you sure you want to cancel this leave record?'))) {
      return;
    }
    try {
      await deleteLeaveMutation({ leave_id: leaveId as any });
      toast({
        title: t('leaveDeleted', 'Leave Record Cancelled'),
        status: 'success',
      });
    } catch (err: any) {
      toast({
        title: t('error', 'Error'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Process Approval Simulation
  const handleDecision = async (token: string, decision: 'approved' | 'rejected') => {
    try {
      const res = await processApprovalMutation({
        verification_token: token,
        decision,
      });
      toast({
        title: decision === 'approved' ? `✅ ${t('approved', 'Approved')}` : `❌ ${t('rejected', 'Rejected')}`,
        description: res.message,
        status: decision === 'approved' ? 'success' : 'info',
      });
    } catch (err: any) {
      toast({
        title: t('error', 'Error processing decision'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Generate Monthly Payroll
  const handleGeneratePayroll = async () => {
    try {
      const res = await generatePayrollMutation({
        organization_id: selectedOrganization as any,
        payroll_month: payrollMonth,
      });
      toast({
        title: t('payrollGenerated', 'Monthly Payroll Generated Successfully'),
        description: `${res.eligible_employees} ${t('eligibleEmployees', 'Eligible Employees')} - ${t('totalNetPayable', 'Total Net')}: ${res.total_net_payable.toLocaleString()} \uE900`,
        status: 'success',
      });
    } catch (err: any) {
      toast({
        title: t('error', 'Failed to generate payroll'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Submit Payroll to WhatsApp
  const handleSubmitPayrollToWhatsApp = async (run: any) => {
    try {
      const res = await submitPayrollApprovalMutation({
        payroll_run_id: run._id,
        organization_id: selectedOrganization as any,
      });

      await dispatchApprovalMutation({
        organization_id: selectedOrganization as any,
        request_type: 'payroll_batch',
        reference_id: `PAY-${run.payroll_month}`,
        reference_record_id: run._id,
        summary_text: res.summary_text,
      });

      toast({
        title: t('payrollSubmittedWhatsApp', 'Payroll Dispatched for WhatsApp Sign-off'),
        status: 'success',
      });
    } catch (err: any) {
      toast({
        title: t('error', 'Failed to submit payroll'),
        description: err.message,
        status: 'error',
      });
    }
  };

  // Download SIF File
  const handleDownloadSif = (run: any) => {
    if (!run.sif_file_content) {
      toast({
        title: t('sifNotReady', 'SIF File Not Ready'),
        status: 'warning',
      });
      return;
    }

    if (unlinkedQiwaEmployees.length > 0) {
      toast({
        title: t('qiwaComplianceNotice', 'Qiwa & Mudad WPS Compliance Notice'),
        description: `${unlinkedQiwaEmployees.length} employee(s) have unlinked or pending Qiwa contracts. Mudad may flag compliance discrepancies.`,
        status: 'warning',
        duration: 7000,
        isClosable: true,
      });
    }

    const blob = new Blob([run.sif_file_content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mudad_WPS_${run.payroll_month}_RJHISARI.sif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: t('sifDownloaded', 'Downloaded SAMA / Mudad SIF File'),
      status: 'success',
    });
  };

  return (
    <Box p={{ base: 3, md: 6 }} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 🌟 Header & Quick Actions */}
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }} mb={6} gap={4}>
        <Box>
          <HStack spacing={3}>
            <Heading size="lg" fontWeight="extrabold" color="brand.600">
              {t('hrTitle', 'HR & Workforce Management')}
            </Heading>
            <Badge colorScheme="green" fontSize="sm" px={2.5} py={0.5} borderRadius="full">
              {t('hrKsaComplianceBadge', 'KSA Labor Law & WPS Compliant')}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {t('hrSub', 'Manage restricted ERP access, Saudi Labor contracts & GOSI contributions, WPS payroll, and WhatsApp stakeholder approvals')}
          </Text>
        </Box>
        <HStack spacing={3} wrap="wrap">
          <Button
            leftIcon={<FiGlobe />}
            colorScheme="purple"
            onClick={() => navigate('/hr/mobilization-demo')}
            size="md"
          >
            International Hiring Demo
          </Button>
          <Button
            leftIcon={<FiPlus />}
            variant="outline"
            colorScheme="blue"
            onClick={onAddDeptOpen}
            size="md"
          >
            {t('addDepartment', '+ Add Department')}
          </Button>
          <Button
            leftIcon={<FiPlus />}
            variant="outline"
            colorScheme="purple"
            onClick={onAddBankOpen}
            size="md"
          >
            {t('addBank', '+ Add Bank Account')}
          </Button>
          <Button
            leftIcon={<FaWhatsapp />}
            colorScheme="whatsapp"
            variant="outline"
            onClick={onApproverModalOpen}
            size="md"
          >
            {t('manageWhatsAppApprovers', 'WhatsApp Approvers')}
          </Button>
          <Button
            leftIcon={<FiUserPlus />}
            colorScheme="blue"
            onClick={onAddEmpOpen}
            size="md"
          >
            {t('addNewEmployee', '+ Add New Employee')}
          </Button>
        </HStack>
      </Flex>

      {/* 📊 KPI Ribbon */}
      <SimpleGrid columns={{ base: 2, md: 4, lg: 5 }} spacing={4} mb={6}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardBody p={4}>
            <Stat>
              <StatLabel color="gray.500" fontSize="xs">{t('totalWorkforce', 'Total Workforce')}</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold">{kpis.total}</StatNumber>
              <StatHelpText mb={0} fontSize="xs">
                {kpis.saudiCount} {t('saudiCitizen', 'Saudi')} • {kpis.expatCount} {t('expatriate', 'Expat')}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardBody p={4}>
            <Stat>
              <StatLabel color="gray.500" fontSize="xs">{t('saudizationRate', 'Saudization (Nitaqat)')}</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="teal.500">
                {kpis.saudizationRate}%
              </StatNumber>
              <StatHelpText mb={0} fontSize="xs">
                <Badge colorScheme={kpis.saudizationRate >= 40 ? 'green' : 'orange'}>
                  {kpis.saudizationRate >= 40 ? 'High Green (أخضر مرتفع)' : 'Medium (متوسط)'}
                </Badge>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardBody p={4}>
            <Stat>
              <StatLabel color="gray.500" fontSize="xs">{t('departments', 'Departments')}</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="purple.500">
                {departments?.length || 0}
              </StatNumber>
              <StatHelpText mb={0} fontSize="xs">{t('customAndDynamic', 'Custom & Dynamic')}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardBody p={4}>
            <Stat>
              <StatLabel color="gray.500" fontSize="xs">{t('pendingWhatsAppApprovals', 'Pending Approvals')}</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={kpis.pendingApprovalsCount > 0 ? 'orange.500' : 'gray.400'}>
                {kpis.pendingApprovalsCount}
              </StatNumber>
              <StatHelpText mb={0} fontSize="xs">{t('whatsAppSignOff', 'WhatsApp Sign-off')}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardBody p={4}>
            <Stat>
              <StatLabel color="gray.500" fontSize="xs">{t('wageProtectionSystem', 'Wage Protection (WPS)')}</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="green.500">Mudad SAMA</StatNumber>
              <StatHelpText mb={0} fontSize="xs">{t('wpsMudadCompliant', '100% SAMA SIF Ready')}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* 📑 Main Tabs */}
      <Tabs index={tabIndex} onChange={(i) => setTabIndex(i)} variant="enclosed" colorScheme="blue">
        <TabList mb={4}>
          <Tab fontWeight="bold">{t('tabEmployees', '👥 Employee Directory & ERP Access')}</Tab>
          <Tab fontWeight="bold">
            <HStack spacing={1}>
              <Icon as={FiLayers} color="purple.500" />
              <Text>{t('tabOrgChart', '🏢 Org Chart (الهيكل التنظيمي)')}</Text>
            </HStack>
          </Tab>
          <Tab fontWeight="bold">{t('tabSalaryGosi', '💵 Salary & GOSI Calculator')}</Tab>
          <Tab fontWeight="bold">
            <HStack spacing={2}>
              <Icon as={FaWhatsapp} color="whatsapp.500" />
              <Text>{t('tabWhatsApp', 'WhatsApp Approvals')} ({kpis.pendingApprovalsCount})</Text>
            </HStack>
          </Tab>
          <Tab fontWeight="bold">{t('tabPayrollWps', '🏦 Monthly Payroll & WPS (Mudad)')}</Tab>
          <Tab fontWeight="bold">
            <HStack spacing={1}>
              <Icon as={FiCalendar} color="teal.500" />
              <Text>{t('tabLeavesVacations', '🏖️ Leaves & Vacations')}</Text>
            </HStack>
          </Tab>
          <Tab fontWeight="bold">
            <HStack spacing={1}>
              <Icon as={FiCheckCircle} color="orange.500" />
              <Text>{t('tabLegalDocs', '📜 Legal Documents & Expiries (الوثائق والتجديدات)')}</Text>
              {expiringDocs && expiringDocs.length > 0 && (
                <Badge colorScheme="red" fontSize="2xs">{expiringDocs.length}</Badge>
              )}
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* ========================================================================= */}
          {/* TAB 1: EMPLOYEES & ERP ACCESS */}
          {/* ========================================================================= */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
              <CardBody p={0}>
                <Table variant="simple" size="sm">
                  <Thead bg={subBg}>
                    <Tr>
                      <Th>{t('empNumber', 'Emp #')}</Th>
                      <Th>{t('employeeName', 'Employee Name')}</Th>
                      <Th>{t('employmentLevel', 'Level')}</Th>
                      <Th>{t('jobTitleAndDept', 'Job Title & Dept')}</Th>
                      <Th>{t('qiwaContractCol', 'Qiwa Contract')}</Th>
                      <Th>{t('security2fa', '2FA Security')}</Th>
                      <Th>{t('bankAndIban', 'Bank & IBAN')}</Th>
                      <Th>{t('erpAccessCol', 'ERP Access')}</Th>
                      <Th>{t('approvalStatusCol', 'Approval Status')}</Th>
                      <Th textAlign="center">{t('actions', 'Actions')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(!employees || employees.length === 0) ? (
                      <Tr>
                        <Td colSpan={10} textAlign="center" py={8} color="gray.500">
                          {t('noEmployeesYet', 'No employees registered yet. Click "+ Add New Employee" to get started.')}
                        </Td>
                      </Tr>
                    ) : (
                      employees.map((emp) => {
                        const lvlInfo = EMPLOYMENT_LEVELS[emp.employment_level || 6];
                        return (
                          <Tr key={emp._id} _hover={{ bg: subBg }}>
                            <Td fontWeight="bold" color="blue.600">
                              {emp.employee_number}
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="semibold">
                                  {emp.full_name_arabic || `${emp.first_name} ${emp.last_name}`}
                                </Text>
                                <HStack spacing={1}>
                                  <Badge size="xs" colorScheme={emp.is_saudi ? 'green' : 'purple'}>
                                    {emp.is_saudi ? `🇸🇦 ${t('saudiCitizen', 'Saudi')}` : `🌐 ${t('expatriate', 'Expat')}`}
                                  </Badge>
                                  {emp.email && <Text fontSize="xs" color="gray.400">{emp.email}</Text>}
                                </HStack>
                              </VStack>
                            </Td>
                            <Td>
                              <Badge colorScheme={lvlInfo?.color || 'gray'} variant="subtle" fontSize="10px">
                                L{emp.employment_level || 6}
                              </Badge>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm">{emp.job_title_arabic || emp.job_title}</Text>
                                <Text fontSize="xs" color="gray.500">{emp.department}</Text>
                              </VStack>
                            </Td>
                            <Td>
                              {emp.qiwa_contract_id ? (
                                <VStack align="start" spacing={0.5}>
                                  <Badge
                                    colorScheme={
                                      emp.qiwa_contract_status === 'authenticated'
                                        ? 'green'
                                        : emp.qiwa_contract_status === 'pending_signature'
                                        ? 'yellow'
                                        : emp.qiwa_contract_status === 'draft'
                                        ? 'blue'
                                        : 'gray'
                                    }
                                    fontSize="10px"
                                  >
                                    {emp.qiwa_contract_status === 'authenticated'
                                      ? `✓ ${emp.qiwa_contract_id}`
                                      : emp.qiwa_contract_status === 'pending_signature'
                                      ? `⏳ ${emp.qiwa_contract_id}`
                                      : emp.qiwa_contract_id}
                                  </Badge>
                                  <Text fontSize="10px" color="gray.500">
                                    {emp.qiwa_contract_status === 'authenticated'
                                      ? t('qiwaAuthenticated', 'Authenticated')
                                      : emp.qiwa_contract_status === 'pending_signature'
                                      ? t('qiwaPendingSignature', 'Pending Absher')
                                      : emp.qiwa_contract_status === 'draft'
                                      ? t('qiwaDraft', 'Draft')
                                      : t('qiwaUnlinked', 'Unlinked')}
                                  </Text>
                                </VStack>
                              ) : (
                                <Badge colorScheme="gray" fontSize="10px">
                                  {t('qiwaUnlinked', 'Unlinked')}
                                </Badge>
                              )}
                            </Td>
                            <Td>
                              {emp.phone_2fa_verified ? (
                                <Badge colorScheme="green" variant="solid" fontSize="10px">
                                  <HStack spacing={1}>
                                    <Icon as={FiCheckCircle} />
                                    <Text>2FA Active</Text>
                                  </HStack>
                                </Badge>
                              ) : (
                                <Badge colorScheme="gray" fontSize="10px">
                                  No 2FA
                                </Badge>
                              )}
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs" fontFamily="mono" color="gray.700">
                                  {emp.iban ? `${emp.iban.slice(0, 8)}...${emp.iban.slice(-4)}` : '-'}
                                </Text>
                                <Text fontSize="10px" color="gray.400">{emp.bank_name?.split('(')[0]}</Text>
                              </VStack>
                            </Td>
                            <Td>
                              {emp.erp_access_enabled ? (
                                <VStack align="start" spacing={0.5}>
                                  <Badge colorScheme={emp.data_scope === 'all_organization_records' ? 'purple' : 'blue'}>
                                    {roleLabels[emp.assigned_role] || emp.assigned_role || 'User'}
                                  </Badge>
                                  <Text fontSize="10px" color="gray.500">
                                    {emp.data_scope === 'all_organization_records'
                                      ? t('allOrgScope', 'All Org (Full Access)')
                                      : `${emp.module_permissions?.length || 0} ${t('modulesCount', 'modules')}`}
                                  </Text>
                                </VStack>
                              ) : (
                                <Badge colorScheme="gray">{t('noAccess', 'No Access')}</Badge>
                              )}
                            </Td>
                            <Td>
                              {emp.access_approval_status === 'approved' && (
                                <Badge colorScheme="green" variant="solid">{t('statusApprovedWhatsApp', 'Approved via WhatsApp')}</Badge>
                              )}
                              {emp.access_approval_status === 'pending_whatsapp_approval' && (
                                <Badge colorScheme="orange" variant="outline">{t('statusPendingWhatsApp', 'Pending WhatsApp Sign-off')}</Badge>
                              )}
                              {emp.access_approval_status === 'rejected' && (
                                <Badge colorScheme="red">{t('statusRejected', 'Rejected')}</Badge>
                              )}
                              {(!emp.access_approval_status || emp.access_approval_status === 'none') && (
                                <Badge colorScheme="gray">-</Badge>
                              )}
                            </Td>
                            <Td textAlign="center">
                              <HStack spacing={1} justify="center">
                                <Tooltip label={t('editPermissions', 'Configure ERP Permissions')}>
                                  <IconButton
                                    aria-label="Access"
                                    icon={<FiLock />}
                                    size="xs"
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() => openAccessModal(emp)}
                                  />
                                </Tooltip>
                                <Tooltip label={t('salaryContractAndGosi', 'Salary Contract & GOSI')}>
                                  <IconButton
                                    aria-label="Salary"
                                    icon={<FiDollarSign />}
                                    size="xs"
                                    colorScheme="green"
                                    variant="ghost"
                                    onClick={() => openSalaryModal(emp)}
                                  />
                                </Tooltip>
                              </HStack>
                            </Td>
                          </Tr>
                        );
                      })
                    )}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* ========================================================================= */}
          {/* TAB 2: DYNAMIC REAL-TIME ORG CHART (Levels 1 to 7 & Departments) */}
          {/* ========================================================================= */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm" mb={4}>
              <CardBody p={4}>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }} gap={4}>
                  <Box>
                    <Heading size="md" color="brand.600">
                      {orgChartData?.company?.name || 'Enterprise'} - {t('orgChartTitle', 'Interactive Organizational Chart (الهيكل التنظيمي)')}
                    </Heading>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {t('orgChartSub', 'Real-time hierarchy automatically calculated across C-Suite (Level 1) down to Associates (Level 7) and custom departments.')}
                    </Text>
                  </Box>

                  <HStack spacing={3}>
                    <RadioGroup value={orgChartView} onChange={(v: any) => setOrgChartView(v)}>
                      <Stack direction="row" spacing={4}>
                        <Radio value="level">{t('viewByLevel', 'By Employment Level (1 to 7)')}</Radio>
                        <Radio value="department">{t('viewByDept', 'By Department Hierarchy')}</Radio>
                      </Stack>
                    </RadioGroup>
                  </HStack>
                </Flex>
              </CardBody>
            </Card>

            {/* LEVEL-BASED HIERARCHY VIEW */}
            {orgChartView === 'level' && (
              <VStack spacing={4} align="stretch">
                {orgChartData?.levels?.map((lvl: any) => {
                  const levelDef = EMPLOYMENT_LEVELS[lvl.level];
                  return (
                    <Card
                      key={lvl.level}
                      bg={cardBg}
                      borderColor={lvl.count > 0 ? `${lvl.color}.300` : borderColor}
                      borderWidth="1px"
                      shadow="sm"
                    >
                      <CardBody p={4}>
                        <Flex justify="space-between" align="center" mb={3}>
                          <HStack spacing={2}>
                            <Badge colorScheme={lvl.color} fontSize="sm" px={2} py={0.5} borderRadius="md">
                              Level {lvl.level}
                            </Badge>
                            <Heading size="sm">
                              {currentLanguage === 'ar' ? levelDef?.titleAr : levelDef?.titleEn}
                            </Heading>
                            <Text fontSize="xs" color="gray.400">
                              ({levelDef?.desc})
                            </Text>
                          </HStack>
                          <Badge colorScheme={lvl.count > 0 ? 'blue' : 'gray'}>
                            {lvl.count} {t('members', 'Members')}
                          </Badge>
                        </Flex>

                        {lvl.count === 0 ? (
                          <Text fontSize="xs" color="gray.400" fontStyle="italic">
                            {t('noEmployeesAtLevel', 'No positions currently assigned at this level.')}
                          </Text>
                        ) : (
                          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                            {lvl.employees.map((emp: any) => (
                              <Box
                                key={emp._id}
                                p={3}
                                borderRadius="md"
                                borderWidth="1px"
                                bg={subBg}
                                borderColor={borderColor}
                              >
                                <HStack spacing={3} align="start">
                                  <Avatar name={emp.name} size="sm" bg={`${lvl.color}.500`} color="white" />
                                  <Box flex={1}>
                                    <Text fontWeight="bold" fontSize="sm">{emp.name}</Text>
                                    <Text fontSize="xs" color="gray.600">{emp.job_title}</Text>
                                    <HStack spacing={1} mt={1}>
                                      <Tag size="xs" colorScheme="blue">{emp.department}</Tag>
                                      {emp.is_saudi && <Tag size="xs" colorScheme="green">🇸🇦 KSA</Tag>}
                                      {emp.erp_access_enabled && <Tag size="xs" colorScheme="purple">ERP User</Tag>}
                                    </HStack>
                                  </Box>
                                </HStack>
                              </Box>
                            ))}
                          </SimpleGrid>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </VStack>
            )}

            {/* DEPARTMENT HIERARCHY VIEW */}
            {orgChartView === 'department' && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {orgChartData?.departments?.map((dept: any) => (
                  <Card key={dept._id} bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                    <CardBody p={4}>
                      <Flex justify="space-between" align="start" mb={2}>
                        <Box>
                          <Heading size="sm" color="blue.600">
                            {currentLanguage === 'ar' && dept.name_arabic ? dept.name_arabic : dept.name}
                          </Heading>
                          {dept.code && <Badge fontSize="10px" colorScheme="gray">{dept.code}</Badge>}
                        </Box>
                        <Badge colorScheme="purple" fontSize="xs">
                          {dept.member_count} {t('members', 'Staff')}
                        </Badge>
                      </Flex>

                      <Text fontSize="xs" color="gray.500" mb={3}>
                        {dept.description || t('activeDepartment', 'Active company department')}
                      </Text>

                      <Divider my={2} />

                      <VStack align="stretch" spacing={2}>
                        {dept.employees.length === 0 ? (
                          <Text fontSize="xs" color="gray.400" fontStyle="italic">
                            {t('noStaffInDept', 'No staff currently assigned to this department.')}
                          </Text>
                        ) : (
                          dept.employees.map((member: any) => (
                            <HStack key={member._id} justify="space-between" p={1.5} bg={subBg} borderRadius="sm">
                              <Box>
                                <Text fontSize="xs" fontWeight="semibold">{member.name}</Text>
                                <Text fontSize="10px" color="gray.500">{member.job_title}</Text>
                              </Box>
                              <Badge size="xs" colorScheme={EMPLOYMENT_LEVELS[member.level]?.color || 'gray'}>
                                L{member.level}
                              </Badge>
                            </HStack>
                          ))
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </TabPanel>

          {/* ========================================================================= */}
          {/* TAB 3: SALARY & GOSI CALCULATOR */}
          {/* ========================================================================= */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
              {/* Form Input Card */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                <CardBody>
                  <Heading size="md" mb={4} color="brand.600">
                    {t('salaryContractAndGosi', 'Salary Contract & GOSI Engine')}
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">{t('selectEmployee', 'Select Employee')}</FormLabel>
                      <Select
                        value={selectedEmp?._id || ''}
                        onChange={(e) => {
                          const found = (employees || []).find((x) => x._id === e.target.value);
                          if (found) openSalaryModal(found);
                        }}
                      >
                        <option value="">-- {t('selectEmployee', 'Select Employee')} --</option>
                        {(employees || []).map((e) => (
                          <option key={e._id} value={e._id}>
                            {e.employee_number} - {e.full_name_arabic || e.first_name} ({e.is_saudi ? t('saudiCitizen', 'Saudi') : t('expatriate', 'Expat')})
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="sm">{t('basicSalary', 'Basic Salary')}</FormLabel>
                      <InputGroup>
                        <NumberInput
                          value={salaryForm.basicSalary}
                          min={1000}
                          onChange={(_, val) => {
                            if (!isNaN(val)) setStandardAllowances(val);
                          }}
                          w="full"
                        >
                          <NumberInputField />
                        </NumberInput>
                        <InputRightAddon><RiyalCurrencySymbol /></InputRightAddon>
                      </InputGroup>
                    </FormControl>

                    <FormControl isRequired>
                      <HStack justify="space-between" mb={1}>
                        <FormLabel fontSize="sm" mb={0}>{t('housingAllowance', 'Housing Allowance')}</FormLabel>
                        <Button
                          size="xs"
                          variant="link"
                          colorScheme="blue"
                          onClick={() =>
                            setSalaryForm((prev) => ({
                              ...prev,
                              housingAllowance: Math.round(prev.basicSalary * 0.25),
                            }))
                          }
                        >
                          {t('standard25Pct', 'Standard (25%)')}
                        </Button>
                      </HStack>
                      <InputGroup>
                        <NumberInput
                          value={salaryForm.housingAllowance}
                          min={0}
                          onChange={(_, val) =>
                            setSalaryForm((p) => ({ ...p, housingAllowance: isNaN(val) ? 0 : val }))
                          }
                          w="full"
                        >
                          <NumberInputField />
                        </NumberInput>
                        <InputRightAddon><RiyalCurrencySymbol /></InputRightAddon>
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <HStack justify="space-between" mb={1}>
                        <FormLabel fontSize="sm" mb={0}>{t('transportAllowance', 'Transportation Allowance')}</FormLabel>
                        <Button
                          size="xs"
                          variant="link"
                          colorScheme="blue"
                          onClick={() =>
                            setSalaryForm((prev) => ({
                              ...prev,
                              transportAllowance: Math.round(prev.basicSalary * 0.10),
                            }))
                          }
                        >
                          {t('standard10Pct', 'Standard (10%)')}
                        </Button>
                      </HStack>
                      <InputGroup>
                        <NumberInput
                          value={salaryForm.transportAllowance}
                          min={0}
                          onChange={(_, val) =>
                            setSalaryForm((p) => ({ ...p, transportAllowance: isNaN(val) ? 0 : val }))
                          }
                          w="full"
                        >
                          <NumberInputField />
                        </NumberInput>
                        <InputRightAddon><RiyalCurrencySymbol /></InputRightAddon>
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">{t('otherAllowances', 'Other Allowances')}</FormLabel>
                      <InputGroup>
                        <NumberInput
                          value={salaryForm.otherAllowances}
                          min={0}
                          onChange={(_, val) =>
                            setSalaryForm((p) => ({ ...p, otherAllowances: isNaN(val) ? 0 : val }))
                          }
                          w="full"
                        >
                          <NumberInputField />
                        </NumberInput>
                        <InputRightAddon><RiyalCurrencySymbol /></InputRightAddon>
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">{t('effectiveDate', 'Effective Date')}</FormLabel>
                      <Input
                        type="date"
                        value={salaryForm.effectiveDate}
                        onChange={(e) =>
                          setSalaryForm((p) => ({ ...p, effectiveDate: e.target.value }))
                        }
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">{t('qiwaContractNumber', 'Qiwa Contract Number (رقم عقد قوى)')}</FormLabel>
                      <Input
                        fontFamily="mono"
                        placeholder="QW-10829471"
                        value={salaryForm.qiwaContractId}
                        onChange={(e) =>
                          setSalaryForm((p) => ({ ...p, qiwaContractId: e.target.value.toUpperCase() }))
                        }
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">{t('qiwaContractStatus', 'Qiwa Contract Status (حالة العقد)')}</FormLabel>
                      <Select
                        value={salaryForm.qiwaContractStatus}
                        onChange={(e) =>
                          setSalaryForm((p) => ({ ...p, qiwaContractStatus: e.target.value }))
                        }
                      >
                        <option value="authenticated">{t('qiwaAuthenticated', 'Authenticated & Active (موثق وساري)')}</option>
                        <option value="pending_signature">{t('qiwaPendingSignature', 'Pending Employee Acceptance in Absher (بانتظار قبول الموظف)')}</option>
                        <option value="draft">{t('qiwaDraft', 'Draft Contract (مسودة عقد)')}</option>
                        <option value="unlinked">{t('qiwaUnlinked', 'Unlinked (غير مربوط)')}</option>
                      </Select>
                    </FormControl>

                    <Button
                      leftIcon={<FaWhatsapp />}
                      colorScheme="whatsapp"
                      size="lg"
                      mt={2}
                      isDisabled={!selectedEmp}
                      onClick={handleSaveSalaryContract}
                    >
                      {t('saveAndSendWhatsApp', 'Save & Request WhatsApp Sign-off')}
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Real-time Saudi Labor Law & GOSI Breakdown Card */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm" gridColumn={{ lg: 'span 2' }}>
                <CardBody>
                  <Heading size="md" mb={4} color="green.600">
                    🏛️ {t('gosiLawBreakdownTitle', 'Automated GOSI & Saudi Labor Law Breakdown')}
                  </Heading>

                  <Alert status="info" borderRadius="md" mb={4}>
                    <AlertIcon />
                    <Box fontSize="xs">
                      {t('gosiWageLawRule', 'GOSI contributory wage is strictly (Basic Salary + Housing Allowance) capped at 45,000 Saudi Riyals. Saudi citizens contribute 9.75% (Annuities + SANED), while employers contribute 11.75% (Annuities + SANED + Hazards). Expats incur 2% employer hazard only.')}
                    </Box>
                  </Alert>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                    <Box p={4} borderRadius="md" bg={subBg} borderWidth="1px">
                      <Text fontSize="xs" color="gray.500">{t('grossSalary', 'Gross Nominal Salary')}</Text>
                      <Heading size="lg" color="blue.600" mt={1}>
                        {grossSalary.toLocaleString()} <RiyalCurrencySymbol size="0.8em" />
                      </Heading>
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {t('basicSalary', 'Basic')} {salaryForm.basicSalary.toLocaleString()} + {t('housingAllowance', 'Housing')} {salaryForm.housingAllowance.toLocaleString()} + {t('transportAllowance', 'Transport')} {salaryForm.transportAllowance.toLocaleString()}
                      </Text>
                    </Box>

                    <Box p={4} borderRadius="md" bg={subBg} borderWidth="1px">
                      <Text fontSize="xs" color="gray.500">{t('gosiSubjectWage', 'GOSI Subject Wage')}</Text>
                      <Heading size="lg" color="purple.600" mt={1}>
                        {gosiSubjectWage.toLocaleString()} <RiyalCurrencySymbol size="0.8em" />
                      </Heading>
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {gosiSubjectWage >= 45000 ? t('gosiCapApplied', 'Capped at 45,000 Saudi Riyals') : t('withinGosiCap', 'Within Statutory Cap')}
                      </Text>
                    </Box>

                    <Box p={4} borderRadius="md" bg="red.50" borderWidth="1px" borderColor="red.200">
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="red.700" fontWeight="bold">{t('employeeGosiDeduction', 'Employee GOSI Deduction')}</Text>
                        <Badge colorScheme="red">{isTargetSaudi ? '9.75%' : '0% (Expat)'}</Badge>
                      </HStack>
                      <Heading size="lg" color="red.600" mt={1}>
                        - {employeeGosiDeduction.toLocaleString()} <RiyalCurrencySymbol size="0.8em" />
                      </Heading>
                      <Text fontSize="xs" color="red.500" mt={1}>
                        {t('deductedFromPayroll', 'Deducted directly from monthly bank payout')}
                      </Text>
                    </Box>

                    <Box p={4} borderRadius="md" bg="green.50" borderWidth="1px" borderColor="green.200">
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="green.700" fontWeight="bold">{t('netSalary', 'Net Bank Payable Salary')}</Text>
                        <Badge colorScheme="green">WPS / مُدد</Badge>
                      </HStack>
                      <Heading size="lg" color="green.600" mt={1}>
                        {netPayable.toLocaleString()} <RiyalCurrencySymbol size="0.8em" />
                      </Heading>
                      <Text fontSize="xs" color="green.600" mt={1}>
                        {t('wpsPayableCertified', 'Certified SAMA / Mudad EDR payout record')}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  <Divider my={4} />

                  <Heading size="sm" mb={3} color="gray.700">
                    💼 {t('employerLiabilities', 'Monthly Employer Liabilities')}
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box p={3} borderRadius="md" bg={subBg} borderWidth="1px">
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.600">{t('employerGosiCost', 'Employer GOSI Contribution')}</Text>
                        <Badge colorScheme="orange">{isTargetSaudi ? '11.75%' : '2% (Hazards)'}</Badge>
                      </HStack>
                      <Text fontSize="md" fontWeight="bold" color="orange.600" mt={1}>
                        + {employerGosiCost.toLocaleString()} <RiyalCurrencySymbol size="0.8em" /> / mo
                      </Text>
                    </Box>

                    <Box p={3} borderRadius="md" bg={subBg} borderWidth="1px">
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.600">{t('eosbMonthlyLiability', 'End of Service Accrual (Art. 84)')}</Text>
                        <Badge colorScheme="blue">0.5 mo/yr</Badge>
                      </HStack>
                      <Text fontSize="md" fontWeight="bold" color="blue.600" mt={1}>
                        + {monthlyEosbAccrual.toLocaleString()} <RiyalCurrencySymbol size="0.8em" /> / mo
                      </Text>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>

          {/* ========================================================================= */}
          {/* TAB 4: WHATSAPP STAKEHOLDER APPROVALS */}
          {/* ========================================================================= */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
              {/* Approvers List */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                <CardBody>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md" color="whatsapp.600">
                      {t('registeredStakeholders', 'Registered Stakeholder Approvers')}
                    </Heading>
                    <Button size="xs" colorScheme="whatsapp" onClick={openCreateApproverModal}>
                      {t('addApprover', '+ Add Approver')}
                    </Button>
                  </Flex>

                  <VStack spacing={3} align="stretch">
                    {(!approvers || approvers.length === 0) ? (
                      <Alert status="warning" borderRadius="md" size="sm">
                        <AlertIcon />
                        <Box fontSize="xs">
                          {t('noApproversConfiguredTip', 'No stakeholders registered yet. Dispatches will route to a demo fallback.')}
                        </Box>
                      </Alert>
                    ) : (
                      approvers.map((app) => (
                        <Box
                          key={app._id}
                          p={3}
                          borderRadius="md"
                          borderWidth="1px"
                          bg={subBg}
                        >
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="sm">{app.full_name}</Text>
                            <HStack spacing={1}>
                              <Badge colorScheme="green">{app.role}</Badge>
                              <Tooltip label={t('edit', 'Edit')}>
                                <IconButton
                                  aria-label="Edit Approver"
                                  icon={<FiEdit2 />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => openEditApproverModal(app)}
                                />
                              </Tooltip>
                              <Tooltip label={t('delete', 'Delete')}>
                                <IconButton
                                  aria-label="Delete Approver"
                                  icon={<FiTrash2 />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDeleteApprover(app._id, app.full_name)}
                                />
                              </Tooltip>
                            </HStack>
                          </HStack>
                          <HStack spacing={1} mt={1} color="whatsapp.600" fontSize="xs">
                            <Icon as={FiPhone} />
                            <Text fontFamily="mono">{app.phone_number}</Text>
                          </HStack>
                          <HStack spacing={1} mt={2}>
                            {app.approval_scope?.map((scope: string) => (
                              <Tag size="sm" key={scope} colorScheme="blue">
                                {scope === 'all' ? t('all', 'All Scopes') : scope}
                              </Tag>
                            ))}
                          </HStack>
                        </Box>
                      ))
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Approval Requests Log & Simulator */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm" gridColumn={{ lg: 'span 2' }}>
                <CardBody>
                  <Heading size="md" mb={4} color="blue.600">
                    {t('liveWhatsAppAuditTrail', 'Live WhatsApp Approval Audit Trail')}
                  </Heading>

                  <VStack spacing={4} align="stretch">
                    {(!approvalRequests || approvalRequests.length === 0) ? (
                      <Box textAlign="center" py={8} color="gray.500">
                        {t('noApprovalRequestsYet', 'No pending approval requests. Modifying employee access or salary contracts will populate here instantly.')}
                      </Box>
                    ) : (
                      approvalRequests.map((req) => (
                        <Box
                          key={req._id}
                          p={4}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor={req.status === 'pending' ? 'orange.300' : borderColor}
                          bg={req.status === 'pending' ? useColorModeValue('orange.50', 'gray.800') : subBg}
                        >
                          <Flex justify="space-between" align="start">
                            <HStack spacing={2}>
                              <Icon as={FaWhatsapp} color="whatsapp.500" boxSize={5} />
                              <Box>
                                <HStack>
                                  <Text fontWeight="bold" fontSize="sm">
                                    {req.request_type === 'erp_access' && `🔑 ${t('erpAccessCol', 'ERP Access')}`}
                                    {req.request_type === 'salary_contract' && `💵 ${t('salaryContractAndGosi', 'Salary Contract')}`}
                                    {req.request_type === 'payroll_batch' && `🏦 ${t('tabPayrollWps', 'Monthly Payroll')}`}
                                    {(req.request_type === 'leave_manager' || req.request_type === 'leave_hr') && `🏖️ ${t('leaveRequest', 'Employee Leave')}${req.request_type === 'leave_manager' ? ` • ${t('immediateManager', 'Manager')}` : ` • ${t('hrAdminManager', 'HR Admin Manager')}`}`}
                                  </Text>
                                  <Badge
                                    colorScheme={
                                      req.status === 'approved'
                                        ? 'green'
                                        : req.status === 'rejected'
                                        ? 'red'
                                        : 'orange'
                                    }
                                  >
                                    {req.status === 'approved' && t('statusApprovedWhatsApp', 'Approved via WhatsApp')}
                                    {req.status === 'rejected' && t('statusRejected', 'Rejected')}
                                    {req.status === 'pending' && t('statusPendingWhatsApp', 'Pending Stakeholder Reply')}
                                  </Badge>
                                </HStack>
                                <Text fontSize="xs" color="gray.500">
                                  Ref: #{req.reference_id} • Target: {req.approver_name} ({req.approver_phone})
                                </Text>
                              </Box>
                            </HStack>
                            <Text fontSize="xs" color="gray.400">
                              {new Date(req.sent_at).toLocaleTimeString()}
                            </Text>
                          </Flex>

                          <Box
                            mt={3}
                            p={3}
                            bg={useColorModeValue('white', 'gray.900')}
                            borderRadius="md"
                            fontSize="xs"
                            whiteSpace="pre-wrap"
                            fontFamily="mono"
                            borderWidth="1px"
                          >
                            {req.summary_text}
                          </Box>

                          {/* Quick Interactive Approval / Webhook actions */}
                          <HStack spacing={3} mt={3} justify="flex-end">
                            <Button
                              as="a"
                              href={`https://wa.me/${req.approver_phone.replace('+', '')}?text=${encodeURIComponent(
                                req.summary_text +
                                  `\n\nReply:\n[Approve] or [1] to approve\n[Reject] or [2] to reject\nVerification Token: ${req.verification_token}`
                              )}`}
                              target="_blank"
                              size="xs"
                              leftIcon={<FaWhatsapp />}
                              colorScheme="whatsapp"
                              variant="outline"
                            >
                              {t('sendWhatsAppPing', 'Send WhatsApp Ping')}
                            </Button>

                            {req.status === 'pending' &&
                              req.request_type !== 'leave_manager' &&
                              req.request_type !== 'leave_hr' && (
                              <>
                                <Button
                                  size="xs"
                                  leftIcon={<FiCheck />}
                                  colorScheme="green"
                                  onClick={() => handleDecision(req.verification_token, 'approved')}
                                >
                                  {t('simulateApproval', 'Simulate Approval')}
                                </Button>
                                <Button
                                  size="xs"
                                  leftIcon={<FiXCircle />}
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDecision(req.verification_token, 'rejected')}
                                >
                                  {t('simulateRejection', 'Reject')}
                                </Button>
                              </>
                            )}
                          </HStack>
                        </Box>
                      ))
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>

          {/* ========================================================================= */}
          {/* TAB 5: PAYROLL & SAMA / MUDAD WPS SIF */}
          {/* ========================================================================= */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm" mb={6}>
              <CardBody>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }} gap={4}>
                  <Box>
                    <Heading size="md" color="brand.600">
                      {t('tabPayrollWps', 'Monthly Payroll & WPS (Mudad)')}
                    </Heading>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {t('wpsSubDesc', 'Generate certified monthly payroll batches, dispatch for WhatsApp sign-off, and export standardized SAMA / Mudad SIF banking files.')}
                    </Text>
                  </Box>
                  <HStack spacing={3}>
                    <FormControl w="180px">
                      <Input
                        type="month"
                        value={payrollMonth}
                        onChange={(e) => setPayrollMonth(e.target.value)}
                        size="sm"
                      />
                    </FormControl>
                    <Button
                      leftIcon={<FiRefreshCw />}
                      colorScheme="blue"
                      size="sm"
                      onClick={handleGeneratePayroll}
                    >
                      {t('generateMonthlyPayroll', 'Generate Monthly Payroll')}
                    </Button>
                  </HStack>
                </Flex>
              </CardBody>
            </Card>

            {/* Qiwa & Mudad Pre-Flight Compliance Verification Banner */}
            {unlinkedQiwaEmployees.length > 0 ? (
              <Alert status="warning" borderRadius="md" mb={6}>
                <AlertIcon />
                <Box flex="1">
                  <Text fontWeight="bold" fontSize="sm">
                    ⚠️ {t('qiwaPreFlightWarningTitle', 'Pre-Flight Qiwa & Mudad Compliance Check')}
                  </Text>
                  <Text fontSize="xs" mt={1}>
                    {t('qiwaPreFlightWarningDesc', 'There are employees without authenticated Qiwa contracts. Mudad automatically verifies payroll files against Qiwa authenticated contracts.')}
                  </Text>
                  <HStack spacing={2} mt={2} flexWrap="wrap">
                    {unlinkedQiwaEmployees.slice(0, 6).map((e) => (
                      <Badge key={e._id} colorScheme="orange" variant="subtle" fontSize="10px">
                        {e.full_name_arabic || e.first_name}: {e.qiwa_contract_id || t('qiwaUnlinked', 'Unlinked')}
                      </Badge>
                    ))}
                    {unlinkedQiwaEmployees.length > 6 && (
                      <Text fontSize="10px" color="gray.600">+{unlinkedQiwaEmployees.length - 6} more</Text>
                    )}
                  </HStack>
                </Box>
              </Alert>
            ) : (
              employees && employees.length > 0 && (
                <Alert status="success" borderRadius="md" mb={6}>
                  <AlertIcon />
                  <Box fontSize="xs">
                    <strong>{t('qiwaFullyCompliant', '✅ 100% Qiwa & Mudad WPS Compliant')}: </strong>
                    {t('qiwaFullyCompliantDesc', 'All employees have active, authenticated Qiwa contracts and are fully eligible for WPS Mudad submission without compliance violations.')}
                  </Box>
                </Alert>
              )
            )}

            {/* Payroll Runs List */}
            <VStack spacing={4} align="stretch">
              {(!payrollRuns || payrollRuns.length === 0) ? (
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardBody textAlign="center" py={8} color="gray.500">
                    {t('noPayrollRunsYet', 'No payroll batches generated yet. Select a month above and click "Generate Monthly Payroll".')}
                  </CardBody>
                </Card>
              ) : (
                payrollRuns.map((run) => (
                  <Card key={run._id} bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                    <CardBody p={5}>
                      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }} gap={4}>
                        <VStack align="start" spacing={1}>
                          <HStack spacing={2}>
                            <Heading size="md">{run.payroll_month}</Heading>
                            <Badge
                              colorScheme={
                                run.status === 'approved'
                                  ? 'green'
                                  : run.status === 'pending_whatsapp_approval'
                                  ? 'orange'
                                  : 'blue'
                              }
                            >
                              {run.status === 'approved' && t('statusApprovedWhatsApp', 'Approved via WhatsApp')}
                              {run.status === 'pending_whatsapp_approval' && t('statusPendingWhatsApp', 'Pending WhatsApp Sign-off')}
                              {run.status === 'draft' && t('draft', 'Draft Ready')}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            {t('eligibleEmployees', 'Employees')}: {run.total_employees} • {t('basicSalary', 'Basic')}: {run.total_basic.toLocaleString()} <RiyalCurrencySymbol size="0.8em" /> • {t('employeeGosiDeduction', 'GOSI')}: {run.total_gosi_deductions.toLocaleString()} <RiyalCurrencySymbol size="0.8em" />
                          </Text>
                        </VStack>

                        <HStack spacing={6}>
                          <Box textAlign={{ base: 'start', md: 'end' }}>
                            <Text fontSize="xs" color="gray.500">{t('totalNetPayable', 'Total Net Bank Payout')}</Text>
                            <Heading size="md" color="green.600">
                              {run.total_net_payable.toLocaleString()} <RiyalCurrencySymbol size="0.8em" />
                            </Heading>
                          </Box>

                          <HStack spacing={2}>
                            {run.status !== 'approved' && (
                              <Button
                                leftIcon={<FaWhatsapp />}
                                colorScheme="whatsapp"
                                size="sm"
                                onClick={() => handleSubmitPayrollToWhatsApp(run)}
                              >
                                {t('submitWhatsAppApproval', 'Submit for WhatsApp Sign-off')}
                              </Button>
                            )}

                            <Button
                              leftIcon={<FiDownload />}
                              colorScheme="purple"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadSif(run)}
                            >
                              {t('downloadSifMudad', 'Download SIF for Mudad')}
                            </Button>
                          </HStack>
                        </HStack>
                      </Flex>

                      {/* WPS SIF Preview Accordion */}
                      {run.sif_file_content && (
                        <Box mt={4} p={3} bg={subBg} borderRadius="md" borderWidth="1px">
                          <Text fontSize="xs" fontWeight="bold" color="purple.700" mb={1}>
                            📄 {t('wpsSifReady', 'SAMA / Mudad SIF File Structure Ready for Bank Deposit')}:
                          </Text>
                          <Text fontSize="11px" fontFamily="mono" color="gray.600" whiteSpace="pre-wrap">
                            {run.sif_file_content.split('\n').slice(0, 5).join('\n')}
                            {run.sif_file_content.split('\n').length > 5 && '\n...'}
                          </Text>
                        </Box>
                      )}
                    </CardBody>
                  </Card>
                ))
              )}
            </VStack>
          </TabPanel>

          {/* ========================================================================= */}
          {/* TAB 6: LEAVES & VACATIONS (SAUDI LABOR LAW ARTICLES 109-117) */}
          {/* ========================================================================= */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm" mb={6}>
              <CardBody>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }} gap={4}>
                  <Box>
                    <Heading size="md" color="teal.600">
                      {t('tabLeavesVacations', '🏖️ Leaves & Vacations Management')}
                    </Heading>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {t('leavesSubDesc', 'Track annual, sick, and unpaid leaves compliant with Saudi Labor Law (Articles 109-117) with automated payroll deduction adjustments and Mudad (WPS) codes.')}
                    </Text>
                  </Box>
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="teal"
                    size="sm"
                    onClick={() => {
                      setLeaveForm({
                        employeeId: employees && employees.length > 0 ? employees[0]._id : '',
                        leaveType: 'annual',
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
                        daysCount: 5,
                        medicalReportRef: '',
                        notes: '',
                      });
                      onAddLeaveOpen();
                    }}
                  >
                    {t('recordLeaveRequest', '+ Record Employee Leave')}
                  </Button>
                </Flex>
              </CardBody>
            </Card>

            {/* Saudi Labor Law Legal Guides Ribbon */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
              <Box p={3} borderRadius="md" bg={subBg} borderWidth="1px">
                <HStack justify="space-between">
                  <Text fontSize="xs" fontWeight="bold" color="green.600">🌴 {t('annualLeave', 'Annual Leave (Art. 109)')}</Text>
                  <Badge colorScheme="green">100% Paid</Badge>
                </HStack>
                <Text fontSize="11px" color="gray.500" mt={1}>
                  21 days minimum (30 days after 5 yrs). Unaffected in WPS Mudad.
                </Text>
              </Box>

              <Box p={3} borderRadius="md" bg={subBg} borderWidth="1px">
                <HStack justify="space-between">
                  <Text fontSize="xs" fontWeight="bold" color="orange.600">🏥 {t('sickLeave', 'Sick Leave (Art. 117)')}</Text>
                  <Badge colorScheme="orange">Sehhaty صحتي</Badge>
                </HStack>
                <Text fontSize="11px" color="gray.500" mt={1}>
                  1-30d: 100% | 31-90d: 75% | 91-120d: 0% (Auto attaches SL code).
                </Text>
              </Box>

              <Box p={3} borderRadius="md" bg={subBg} borderWidth="1px">
                <HStack justify="space-between">
                  <Text fontSize="xs" fontWeight="bold" color="red.600">⛔ {t('unpaidLeave', 'Unpaid Leave (Art. 116)')}</Text>
                  <Badge colorScheme="red">Deducted (UL)</Badge>
                </HStack>
                <Text fontSize="11px" color="gray.500" mt={1}>
                  Pro-rata salary reduction with official Mudad UL reason code.
                </Text>
              </Box>
            </SimpleGrid>

            {/* Leaves Table */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
              <CardBody p={0}>
                <Table variant="simple" size="sm">
                  <Thead bg={subBg}>
                    <Tr>
                      <Th>{t('employeeName', 'Employee')}</Th>
                      <Th>{t('leaveType', 'Leave Type')}</Th>
                      <Th>{t('startDate', 'Start Date')}</Th>
                      <Th>{t('endDate', 'End Date')}</Th>
                      <Th>{t('daysCount', 'Days')}</Th>
                      <Th>{t('medicalReportRef', 'Medical Ref #')}</Th>
                      <Th>{t('mudadCodeCol', 'Mudad WPS Code')}</Th>
                      <Th>{t('status', 'Approval Status')}</Th>
                      <Th>{t('exitReentry', 'Exit/Re-entry')}</Th>
                      <Th textAlign="center">{t('actions', 'Actions')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(!leaves || leaves.length === 0) ? (
                      <Tr>
                        <Td colSpan={10} textAlign="center" py={8} color="gray.500">
                          {t('noLeavesRecorded', 'No leave records submitted yet. Click "+ Record Employee Leave" above.')}
                        </Td>
                      </Tr>
                    ) : (
                      leaves.map((lv: any) => {
                        const targetEmp = (employees || []).find((e) => e._id === lv.employee_id);
                        return (
                          <Tr key={lv._id}>
                            <Td fontWeight="semibold">
                              {targetEmp ? (targetEmp.full_name_arabic || targetEmp.first_name) : lv.employee_id}
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  lv.leave_type === 'annual' ? 'green' :
                                  lv.leave_type === 'sick' ? 'orange' :
                                  lv.leave_type === 'unpaid' ? 'red' : 'purple'
                                }
                              >
                                {lv.leave_type.toUpperCase()}
                              </Badge>
                            </Td>
                            <Td fontFamily="mono" fontSize="xs">{lv.start_date}</Td>
                            <Td fontFamily="mono" fontSize="xs">{lv.end_date}</Td>
                            <Td fontWeight="bold">{lv.days_count} d</Td>
                            <Td fontFamily="mono" fontSize="xs">{lv.medical_report_ref || '-'}</Td>
                            <Td>
                              <Tag size="sm" colorScheme={lv.leave_type === 'sick' ? 'orange' : lv.leave_type === 'unpaid' ? 'red' : 'gray'}>
                                {lv.leave_type === 'sick' ? 'SL' : lv.leave_type === 'unpaid' ? 'UL' : 'NONE'}
                              </Tag>
                            </Td>
                            <Td>
                              <Badge colorScheme={lv.status === 'approved' ? 'green' : lv.status === 'rejected' ? 'red' : 'orange'}>
                                {lv.status === 'pending_manager_approval' ? t('pendingManagerApproval', 'Pending Manager') :
                                  lv.status === 'pending_hr_approval' ? t('pendingHrApproval', 'Pending HR') :
                                    lv.status === 'approved' ? t('approved', 'Approved') : t('rejected', 'Rejected')}
                              </Badge>
                            </Td>
                            <Td>
                              {lv.travel_outside_saudi && lv.status === 'approved'
                                ? (exitReentryTasks || []).some((task: any) => task.leave_id === lv._id)
                                  ? <Badge colorScheme="purple">{t('hrVisaTaskPending', 'HR/Muqeem task created')}</Badge>
                                  : <Badge colorScheme="gray">{t('visaTaskAfterApproval', 'Created after approval')}</Badge>
                                : lv.travel_outside_saudi
                                  ? <Text fontSize="xs">{t('afterFinalApproval', 'After final approval')}</Text>
                                  : <Text fontSize="xs" color="gray.500">-</Text>}
                            </Td>
                            <Td textAlign="center">
                              <IconButton
                                aria-label="Delete Leave"
                                icon={<FiTrash2 />}
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleDeleteLeave(lv._id)}
                              />
                            </Td>
                          </Tr>
                        );
                      })
                    )}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* ========================================================================= */}
          {/* TAB 7: LEGAL DOCUMENTS & EXPIRIES (IQAMA, PASSPORT, CCHI, LICENSES) */}
          {/* ========================================================================= */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm" mb={6}>
              <CardBody>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }} gap={4}>
                  <VStack align="start" spacing={1}>
                    <HStack spacing={2}>
                      <Icon as={FiCheckCircle} color="orange.500" boxSize={5} />
                      <Heading size="sm">
                        {currentLanguage === 'ar'
                          ? 'مركز متابعة الوثائق والتجديدات الحكومية'
                          : 'Government Legal Documents & Expiries Center'}
                      </Heading>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {currentLanguage === 'ar'
                        ? 'تتبع صلاحيات الإقامات (مقيم)، الجوازات، التأمين الطبي (مجلس الضمان الصحي CCHI)، والتراخيص المهنية'
                        : 'Track Iqama (Muqeem), Passport, CCHI Medical Insurance, and professional accreditations'}
                    </Text>
                  </VStack>

                  <HStack spacing={3}>
                    <Button
                      leftIcon={<FiRefreshCw />}
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      onClick={async () => {
                        try {
                          const res = await runComplianceCheckMutation({ organization_id: selectedOrganization as any });
                          toast({
                            title: 'Scan Complete',
                            description: `Compliance scan complete. ${res.triggered_notifications} stakeholder notifications evaluated.`,
                            status: 'info',
                          });
                        } catch (e: any) {
                          toast({ title: 'Error', description: e.message, status: 'error' });
                        }
                      }}
                    >
                      {currentLanguage === 'ar' ? 'فحص وإرسال التنبيهات للمسؤولين' : 'Dispatch Stakeholder Alerts'}
                    </Button>
                    <Button
                      leftIcon={<FiPlus />}
                      size="sm"
                      colorScheme="orange"
                      onClick={onAddDocModalOpen}
                    >
                      {currentLanguage === 'ar' ? '+ إضافة وثيقة جديدة' : '+ Add Legal Document'}
                    </Button>
                  </HStack>
                </Flex>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
              <CardBody p={0}>
                <Table variant="simple" size="sm">
                  <Thead bg={subBg}>
                    <Tr>
                      <Th>{currentLanguage === 'ar' ? 'الموظف' : 'Employee'}</Th>
                      <Th>{currentLanguage === 'ar' ? 'نوع الوثيقة' : 'Document Type'}</Th>
                      <Th>{currentLanguage === 'ar' ? 'رقم الوثيقة / البوليصة' : 'Document / Policy No'}</Th>
                      <Th>{currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</Th>
                      <Th>{currentLanguage === 'ar' ? 'الأيام المتبقية' : 'Days Remaining'}</Th>
                      <Th>{currentLanguage === 'ar' ? 'جهة الإصدار / المزود' : 'Authority / Provider'}</Th>
                      <Th textAlign="center">{currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {!expiringDocs || expiringDocs.length === 0 ? (
                      <Tr>
                        <Td colSpan={7} textAlign="center" py={8} color="gray.500">
                          {currentLanguage === 'ar'
                            ? 'لا توجد وثائق مسجلة أو قاربت على الانتهاء'
                            : 'No legal documents registered or expiring'}
                        </Td>
                      </Tr>
                    ) : (
                      expiringDocs.map((doc: any) => {
                        const isExpired = doc.days_until_expiry < 0;
                        const isUrgent = doc.days_until_expiry >= 0 && doc.days_until_expiry <= 30;
                        const isAttention = doc.days_until_expiry > 30 && doc.days_until_expiry <= 60;

                        return (
                          <Tr key={doc._id}>
                            <Td>
                              <HStack spacing={2}>
                                <Avatar size="xs" name={doc.employee_name} />
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold" fontSize="xs">
                                    {currentLanguage === 'ar' && doc.employee_name_arabic ? doc.employee_name_arabic : doc.employee_name}
                                  </Text>
                                  <Text fontSize="2xs" color="gray.500">
                                    {doc.employee_number} • {doc.job_title}
                                  </Text>
                                </VStack>
                              </HStack>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  doc.document_type === 'iqama' || doc.document_type === 'national_id'
                                    ? 'blue'
                                    : doc.document_type === 'passport'
                                    ? 'purple'
                                    : doc.document_type === 'medical_insurance'
                                    ? 'teal'
                                    : 'gray'
                                }
                                fontSize="2xs"
                                px={2}
                              >
                                {doc.document_type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </Td>
                            <Td fontFamily="mono" fontSize="xs">
                              {doc.document_number}
                              {doc.insurance_class && (
                                <Text as="span" ml={1} fontSize="2xs" color="gray.500">
                                  ({doc.insurance_class})
                                </Text>
                              )}
                            </Td>
                            <Td fontSize="xs" fontWeight="medium">
                              {doc.expiry_date_gregorian}
                              {doc.expiry_date_hijri && (
                                <Text fontSize="2xs" color="gray.500">
                                  {doc.expiry_date_hijri}
                                </Text>
                              )}
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={isExpired ? 'red' : isUrgent ? 'red' : isAttention ? 'orange' : 'green'}
                                fontSize="xs"
                                px={2}
                                py={0.5}
                              >
                                {isExpired
                                  ? currentLanguage === 'ar' ? 'منتهية الصلاحية' : `Expired (${Math.abs(doc.days_until_expiry)}d ago)`
                                  : currentLanguage === 'ar' ? `متبقي ${doc.days_until_expiry} يوم` : `${doc.days_until_expiry} days left`}
                              </Badge>
                            </Td>
                            <Td fontSize="xs">
                              {doc.insurance_provider || doc.issuing_authority || '-'}
                            </Td>
                            <Td textAlign="center">
                              <IconButton
                                aria-label="Delete document"
                                icon={<FiTrash2 />}
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this document record?')) {
                                    await deleteLegalDocMutation({ document_id: doc._id });
                                    toast({ title: 'Deleted', status: 'info' });
                                  }
                                }}
                              />
                            </Td>
                          </Tr>
                        );
                      })
                    )}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW EMPLOYEE (With Levels 1-7, Reports To, and 2FA) */}
      {/* ========================================================================= */}
      <Modal isOpen={isAddEmpOpen} onClose={onAddEmpClose} size="5xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'} maxW={{ base: '98vw', md: '920px', lg: '1150px' }}>
          <ModalHeader pb={2} borderBottomWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
              <HStack spacing={3}>
                <Box p={2} bg="blue.50" color="blue.600" borderRadius="lg">
                  <Icon as={FiUserPlus} boxSize={5} />
                </Box>
                <Box>
                  <Heading size="md">
                    {currentLanguage === 'ar' ? 'إضافة موظف جديد وإجراءات التعيين الشاملة' : 'Add New Employee & Onboarding'}
                  </Heading>
                  <Text fontSize="xs" color="gray.500">
                    {currentLanguage === 'ar'
                      ? 'تسجيل الهوية، العنوان الوطني، مقر العمل، الفحص الطبي، العهد، والصلاحيات الإدارية'
                      : 'Register official identity, SPL national address, work location, medical clearance & assets'}
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={2}>
                <Badge colorScheme="blue" px={2.5} py={1} borderRadius="md" fontSize="xs">
                  🇸🇦 {currentLanguage === 'ar' ? 'منصة قوى والبريد السعودي' : 'KSA Labor, Qiwa & SPL'}
                </Badge>
              </HStack>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5}>
            <VStack spacing={5} align="stretch">
              {/* SECTION 1: PERSONAL & EMPLOYMENT INFORMATION */}
              <Box p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} bg={cardBg}>
                <HStack spacing={2} mb={3}>
                  <Badge colorScheme="blue" fontSize="xs">1</Badge>
                  <Heading size="xs" color="blue.600" textTransform="uppercase">
                    {t('personalAndJobInfo', 'Personal & Official Identification')}
                  </Heading>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">{t('firstNameEn', 'First Name (En)')}</FormLabel>
                    <Input
                      size="sm"
                      value={empForm.firstName}
                      onChange={(e) => setEmpForm((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="e.g. Tariq"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">{t('lastNameEn', 'Last Name (En)')}</FormLabel>
                    <Input
                      size="sm"
                      value={empForm.lastName}
                      onChange={(e) => setEmpForm((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="e.g. Al-Otaibi"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl isRequired mb={3}>
                  <FormLabel fontSize="xs">{t('fullNameOfficial', 'Full Name as in ID / Iqama (Arabic/Official)')}</FormLabel>
                  <Input
                    size="sm"
                    value={empForm.fullNameArabic}
                    onChange={(e) => setEmpForm((p) => ({ ...p, fullNameArabic: e.target.value }))}
                    placeholder="طارق محمد العتيبي"
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">{t('nationalIdOrIqama', 'National ID / Iqama (10 Digits)')}</FormLabel>
                    <Input
                      size="sm"
                      maxLength={10}
                      value={empForm.nationalId}
                      onChange={(e) => setEmpForm((p) => ({ ...p, nationalId: e.target.value }))}
                      placeholder="1XXXXXXXXX / 2XXXXXXXXX"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'تاريخ انتهاء الهوية / الإقامة' : 'Iqama / ID Expiry Date'}</FormLabel>
                    <Input
                      size="sm"
                      type="date"
                      value={empForm.iqamaExpiry}
                      onChange={(e) => setEmpForm((p) => ({ ...p, iqamaExpiry: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">{t('nationality', 'Nationality')}</FormLabel>
                    <HStack spacing={4} mt={1}>
                      <Checkbox
                        isChecked={empForm.isSaudi}
                        onChange={(e) =>
                          setEmpForm((p) => ({
                            ...p,
                            isSaudi: e.target.checked,
                            nationality: e.target.checked ? 'Saudi Arabia' : 'Other',
                          }))
                        }
                      >
                        {t('saudiCitizen', 'Saudi Citizen')}
                      </Checkbox>
                    </HStack>
                  </FormControl>
                </SimpleGrid>

                {/* Passport & Medical Insurance (CCHI) */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'رقم جواز السفر' : 'Passport Number'}</FormLabel>
                    <Input
                      size="sm"
                      value={empForm.passportNumber}
                      onChange={(e) => setEmpForm((p) => ({ ...p, passportNumber: e.target.value }))}
                      placeholder="e.g. N12345678"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'انتهاء جواز السفر' : 'Passport Expiry Date'}</FormLabel>
                    <Input
                      size="sm"
                      type="date"
                      value={empForm.passportExpiry}
                      onChange={(e) => setEmpForm((p) => ({ ...p, passportExpiry: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'فصيلة الدم' : 'Blood Group'}</FormLabel>
                    <Select
                      size="sm"
                      value={empForm.bloodGroup}
                      onChange={(e) => setEmpForm((p) => ({ ...p, bloodGroup: e.target.value }))}
                    >
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="AB+">AB+</option>
                      <option value="O-">O-</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="AB-">AB-</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                {/* CCHI Medical Insurance Details */}
                <Box p={3} bg="teal.50" borderRadius="md" borderWidth="1px" borderColor="teal.200">
                  <Text fontSize="xs" fontWeight="bold" color="teal.700" mb={2}>
                    🏥 {currentLanguage === 'ar' ? 'التأمين الصحي المعتمد (مجلس الضمان الصحي CCHI)' : 'CCHI Medical Insurance Policy'}
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'رقم بوليصة التأمين' : 'Policy / Member ID'}</FormLabel>
                      <Input
                        size="sm"
                        value={empForm.insurancePolicy}
                        onChange={(e) => setEmpForm((p) => ({ ...p, insurancePolicy: e.target.value }))}
                        placeholder="e.g. CCHI-9021481"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'فئة التأمين' : 'Insurance Class'}</FormLabel>
                      <Select
                        size="sm"
                        value={empForm.insuranceClass}
                        onChange={(e) => setEmpForm((p) => ({ ...p, insuranceClass: e.target.value }))}
                      >
                        <option value="VIP">VIP (كبار الشخصيات)</option>
                        <option value="Class A">Class A (فئة أ)</option>
                        <option value="Class B">Class B (فئة ب)</option>
                        <option value="Class C">Class C (فئة ج)</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'انتهاء وثيقة التأمين' : 'Policy Expiry Date'}</FormLabel>
                      <Input
                        size="sm"
                        type="date"
                        value={empForm.insuranceExpiry}
                        onChange={(e) => setEmpForm((p) => ({ ...p, insuranceExpiry: e.target.value }))}
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>
              </Box>

              {/* SECTION 2: WORK LOCATION & EMPLOYMENT TYPE (WITH SPL & GPS) */}
              <Box p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} bg={cardBg}>
                <HStack spacing={2} mb={3}>
                  <Badge colorScheme="purple" fontSize="xs">2</Badge>
                  <Heading size="xs" color="purple.600" textTransform="uppercase">
                    {currentLanguage === 'ar' ? 'نوع العقد وتحديد موقع ومقر العمل (العنوان الوطني سبل & GPS)' : 'Employment Type & Work Location (SPL & GPS)'}
                  </Heading>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'نوع التوظيف' : 'Employment Type'}</FormLabel>
                    <Select
                      size="sm"
                      value={empForm.employmentType}
                      onChange={(e) => setEmpForm((p) => ({ ...p, employmentType: e.target.value }))}
                    >
                      <option value="permanent">Full-Time Permanent (دوام كامل - دائم)</option>
                      <option value="fixed_term">Fixed-Term Contract (عقد محدد المدة)</option>
                      <option value="probationary">Probationary Period (تحت التجربة)</option>
                      <option value="part_time">Part-Time (دوام جزئي)</option>
                      <option value="temporary">Temporary / Seasonal (مؤقت / موسمي)</option>
                      <option value="consultant">Independent Consultant (مستشار مستقل)</option>
                      <option value="ajeer_subcontracted">Seconded / Ajeer (معار عبر أجير)</option>
                      <option value="intern_tamheer">CO-OP / Tamheer Intern (متدرب تمهير)</option>
                      <option value="remote">Remote Work / Telework (عمل عن بُعد)</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'مقر العمل الرئيسي' : 'Work Location'}</FormLabel>
                    <Select
                      size="sm"
                      value={empForm.workLocation}
                      onChange={(e) => setEmpForm((p) => ({ ...p, workLocation: e.target.value }))}
                    >
                      <option value="head_office_riyadh">Head Office (Riyadh) - المقر الرئيسي</option>
                      <option value="khobar_branch">Eastern Province (Khobar) - فرع الخبر</option>
                      <option value="jeddah_hub">Western Hub (Jeddah) - مركز جدة</option>
                      <option value="site_project">Site / Client Project - موقع المشروع</option>
                      <option value="remote">Remote - عن بُعد</option>
                    </Select>
                  </FormControl>

                  {empForm.workLocation === 'site_project' ? (
                    <FormControl>
                      <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'اسم المشروع / الموقع' : 'Project / Site Name'}</FormLabel>
                      <Input
                        size="sm"
                        value={empForm.siteProjectName}
                        onChange={(e) => setEmpForm((p) => ({ ...p, siteProjectName: e.target.value }))}
                        placeholder="e.g. NEOM Spine / Aramco Package 4"
                      />
                    </FormControl>
                  ) : (
                    <FormControl>
                      <FormLabel fontSize="xs">{t('hireDate', 'Hire Date')}</FormLabel>
                      <Input
                        size="sm"
                        type="date"
                        value={empForm.hireDate}
                        onChange={(e) => setEmpForm((p) => ({ ...p, hireDate: e.target.value }))}
                      />
                    </FormControl>
                  )}
                </SimpleGrid>

                {/* SPL & GPS Location for Work Facility */}
                <Box p={3} bg="purple.50" borderRadius="md" borderWidth="1px" borderColor="purple.200" mb={3}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <HStack spacing={2}>
                      <Icon as={FiMapPin} color="purple.600" />
                      <Text fontSize="xs" fontWeight="bold" color="purple.800">
                        {currentLanguage === 'ar' ? 'تحديد العنوان الوطني (سبل SPL) وإحداثيات الموقع (GPS)' : 'Work Location SPL Address & GPS Pin'}
                      </Text>
                    </HStack>
                    <Button
                      size="xs"
                      colorScheme="purple"
                      variant="solid"
                      leftIcon={<FiMapPin />}
                      onClick={() => handleGetGpsLocation('work')}
                    >
                      {currentLanguage === 'ar' ? '📍 التقاط إحداثيات GPS الحالية' : '📍 Capture Current GPS'}
                    </Button>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="xs">
                        {currentLanguage === 'ar' ? 'العنوان الوطني المختصر للمقر (سبل SPL)' : 'SPL Short Address (Saudi Post)'}
                      </FormLabel>
                      <Input
                        size="sm"
                        bg="white"
                        placeholder="e.g. RRRD2929"
                        maxLength={8}
                        fontFamily="mono"
                        value={empForm.workLocationSpl}
                        onChange={(e) => setEmpForm((p) => ({ ...p, workLocationSpl: e.target.value.toUpperCase() }))}
                      />
                      <Text fontSize="2xs" color="gray.500" mt={0.5}>
                        {currentLanguage === 'ar' ? 'رمز العنوان الوطني المكون من 4 أحرف و 4 أرقام يحدد العقار بدقة' : '4 letters + 4 digits uniquely resolves the building in SPL'}
                      </Text>
                    </FormControl>

                    <FormControl>
                      <HStack justify="space-between" mb={1}>
                        <FormLabel fontSize="xs" mb={0}>
                          {currentLanguage === 'ar' ? 'إحداثيات GPS (خط العرض، الطول)' : 'GPS Coordinates (Lat, Long)'}
                        </FormLabel>
                        {empForm.workLocationGps && (
                          <Button
                            as="a"
                            href={empForm.workLocationMapsUrl || `https://www.google.com/maps?q=${empForm.workLocationGps.replace(/\s+/g, '')}`}
                            target="_blank"
                            size="2xs"
                            colorScheme="blue"
                            variant="link"
                            rightIcon={<FiExternalLink />}
                          >
                            Google Maps
                          </Button>
                        )}
                      </HStack>
                      <Input
                        size="sm"
                        bg="white"
                        placeholder="e.g. 24.713552, 46.675296"
                        value={empForm.workLocationGps}
                        onChange={(e) => setEmpForm((p) => ({ ...p, workLocationGps: e.target.value }))}
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Department & Employment Level (1 to 7) */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                  <FormControl isRequired>
                    <HStack justify="space-between" mb={1}>
                      <FormLabel fontSize="xs" mb={0}>{t('department', 'Department')}</FormLabel>
                      <Button size="xs" variant="link" colorScheme="blue" onClick={onAddDeptOpen}>
                        + {t('newDept', 'New Dept')}
                      </Button>
                    </HStack>
                    <Select
                      size="sm"
                      value={empForm.department}
                      onChange={(e) => setEmpForm((p) => ({ ...p, department: e.target.value }))}
                    >
                      {departments?.map((d: any) => (
                        <option key={d._id} value={d.name}>
                          {currentLanguage === 'ar' && d.name_arabic ? `${d.name_arabic} (${d.name})` : d.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">{t('employmentLevel', 'Employment Level (1 to 7)')}</FormLabel>
                    <Select
                      size="sm"
                      value={empForm.employmentLevel}
                      onChange={(e) => setEmpForm((p) => ({ ...p, employmentLevel: parseInt(e.target.value, 10) }))}
                    >
                      {Object.values(EMPLOYMENT_LEVELS).map((lvl) => (
                        <option key={lvl.level} value={lvl.level}>
                          {currentLanguage === 'ar' ? lvl.titleAr : lvl.titleEn}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                {/* Job Title & Reports-To Hierarchy */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">{t('jobTitle', 'Job Title')}</FormLabel>
                    <Input
                      size="sm"
                      value={empForm.jobTitle}
                      onChange={(e) => setEmpForm((p) => ({ ...p, jobTitle: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">{t('reportsToManager', 'Reports To (Direct Supervisor)')}</FormLabel>
                    <Select
                      size="sm"
                      value={empForm.reportsToId}
                      onChange={(e) => setEmpForm((p) => ({ ...p, reportsToId: e.target.value }))}
                    >
                      <option value="">-- {t('noneTopLevel', 'None / Top Level Executive')} --</option>
                      {employees?.map((mgr: any) => (
                        <option key={mgr._id} value={mgr._id}>
                          {mgr.employee_number} - {mgr.full_name_arabic || mgr.first_name} (L{mgr.employment_level || 6} - {mgr.job_title})
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                {/* Email & Phone with 2FA Button */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">{t('email', 'Email Address')}</FormLabel>
                    <Input
                      size="sm"
                      type="email"
                      value={empForm.email}
                      onChange={(e) => setEmpForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl>
                    <HStack justify="space-between" mb={1}>
                      <FormLabel fontSize="xs" mb={0}>{t('phoneNumber', 'Phone / Mobile')}</FormLabel>
                      {empForm.phone2faVerified ? (
                        <Badge colorScheme="green" fontSize="10px">🛡️ 2FA Verified</Badge>
                      ) : (
                        <Button
                          size="xs"
                          colorScheme="teal"
                          variant="link"
                          isDisabled={!empForm.phone || empForm.phone.length < 8}
                          onClick={() => handleInitiate2fa(empForm.phone)}
                        >
                          🔒 {t('verify2fa', 'Verify via 2FA')}
                        </Button>
                      )}
                    </HStack>
                    <Input
                      size="sm"
                      placeholder="+966501234567"
                      value={empForm.phone}
                      onChange={(e) =>
                        setEmpForm((p) => ({
                          ...p,
                          phone: e.target.value,
                          phone2faVerified: false,
                        }))
                      }
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* SECTION 3: STREAMLINED NATIONAL ADDRESS (SPL) & EMERGENCY CONTACT */}
              <Box p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} bg={cardBg}>
                <HStack spacing={2} mb={2}>
                  <Badge colorScheme="green" fontSize="xs">3</Badge>
                  <Heading size="xs" color="green.600" textTransform="uppercase">
                    {currentLanguage === 'ar' ? 'العنوان الوطني للموظف (سبل SPL) وجهة اتصال الطوارئ' : 'Employee National Address (SPL) & Emergency Contact'}
                  </Heading>
                </HStack>

                <Alert status="info" size="sm" borderRadius="md" mb={3} py={2}>
                  <AlertIcon />
                  <Box fontSize="xs">
                    {currentLanguage === 'ar'
                      ? 'العنوان الوطني المعتمد (سبل SPL): عند تدوين العنوان المختصر (مثل RRRD2929)، يتم تحديد المبنى والشارع والحي والمدينة تلقائياً دون الحاجة لتعبئة التفاصيل اليدوية.'
                      : 'Subul (SPL) National Address: The 8-character Short Address (e.g. RRRD2929) uniquely identifies the building, street, district, and postal code. Manual breakdown is not required.'}
                  </Box>
                </Alert>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">
                      {currentLanguage === 'ar' ? 'العنوان الوطني المختصر (4 أحرف + 4 أرقام)' : 'SPL National Short Address (4 letters + 4 digits)'}
                    </FormLabel>
                    <Input
                      size="sm"
                      placeholder="e.g. RRRD2929"
                      maxLength={8}
                      fontFamily="mono"
                      value={empForm.shortAddress}
                      onChange={(e) => setEmpForm((p) => ({ ...p, shortAddress: e.target.value.toUpperCase() }))}
                    />
                  </FormControl>

                  <FormControl display="flex" flexDirection="column" justify="center">
                    <HStack spacing={2} mt={{ md: 6 }}>
                      <Switch
                        id="manual-address-switch"
                        size="sm"
                        isChecked={empForm.showManualAddressBreakdown}
                        onChange={(e) => setEmpForm((p) => ({ ...p, showManualAddressBreakdown: e.target.checked }))}
                      />
                      <FormLabel htmlFor="manual-address-switch" fontSize="xs" mb="0" cursor="pointer">
                        {currentLanguage === 'ar' ? 'إدخال تفاصيل المبنى والشارع يدوياً (اختياري)' : 'Manual breakdown (Building, Street, District)?'}
                      </FormLabel>
                    </HStack>
                  </FormControl>
                </SimpleGrid>

                {empForm.showManualAddressBreakdown && (
                  <Box p={3} bg={subBg} borderRadius="md" borderWidth="1px" mb={3}>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'رقم المبنى' : 'Building No'}</FormLabel>
                        <Input
                          size="sm"
                          maxLength={4}
                          placeholder="1234"
                          value={empForm.buildingNumber}
                          onChange={(e) => setEmpForm((p) => ({ ...p, buildingNumber: e.target.value }))}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'اسم الشارع' : 'Street Name'}</FormLabel>
                        <Input
                          size="sm"
                          placeholder="King Fahd Rd"
                          value={empForm.streetName}
                          onChange={(e) => setEmpForm((p) => ({ ...p, streetName: e.target.value }))}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'الحي' : 'District'}</FormLabel>
                        <Input
                          size="sm"
                          placeholder="Al Olaya"
                          value={empForm.district}
                          onChange={(e) => setEmpForm((p) => ({ ...p, district: e.target.value }))}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'الرمز البريدي والمدينة' : 'City / Postal Code'}</FormLabel>
                        <Input
                          size="sm"
                          placeholder="Riyadh 12345"
                          value={empForm.city}
                          onChange={(e) => setEmpForm((p) => ({ ...p, city: e.target.value }))}
                        />
                      </FormControl>
                    </SimpleGrid>
                  </Box>
                )}

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'جهة اتصال الطوارئ (الاسم)' : 'Emergency Contact Name'}</FormLabel>
                    <Input
                      size="sm"
                      placeholder="Contact Name"
                      value={empForm.emergencyName}
                      onChange={(e) => setEmpForm((p) => ({ ...p, emergencyName: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'صلة القرابة' : 'Relationship'}</FormLabel>
                    <Select
                      size="sm"
                      value={empForm.emergencyRel}
                      onChange={(e) => setEmpForm((p) => ({ ...p, emergencyRel: e.target.value }))}
                    >
                      <option value="spouse">Spouse (زوج / زوجة)</option>
                      <option value="parent">Parent (والد / والدة)</option>
                      <option value="sibling">Sibling (أخ / أخت)</option>
                      <option value="relative">Relative (قريب)</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'هاتف الطوارئ' : 'Emergency Phone'}</FormLabel>
                    <Input
                      size="sm"
                      placeholder="+96650..."
                      value={empForm.emergencyPhone}
                      onChange={(e) => setEmpForm((p) => ({ ...p, emergencyPhone: e.target.value }))}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* SECTION 4: MEDICAL EXAMINATION & HEALTH CLEARANCE REPORTS */}
              <Box p={4} borderRadius="lg" borderWidth="1px" borderColor="teal.300" bg="teal.50">
                <HStack justify="space-between" mb={3} wrap="wrap">
                  <HStack spacing={2}>
                    <Badge colorScheme="teal" fontSize="xs">4</Badge>
                    <Heading size="xs" color="teal.800" textTransform="uppercase">
                      🩺 {currentLanguage === 'ar' ? 'الكشف الطبي وفحص اللياقة المهنية (منصة إفادة Efada / الفحص الطبي)' : 'Medical Examination & Health Clearance (Efada Platform)'}
                    </Heading>
                  </HStack>
                  <Badge colorScheme="teal" variant="solid" fontSize="10px">
                    {currentLanguage === 'ar' ? 'إلزامي لإصدار الإقامة والتأمين' : 'Mandatory for Iqama & CCHI'}
                  </Badge>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'نتيجة الفحص الطبي' : 'Medical Fitness Status'}</FormLabel>
                    <Select
                      size="sm"
                      bg="white"
                      value={empForm.medicalFitStatus}
                      onChange={(e) => setEmpForm((p) => ({ ...p, medicalFitStatus: e.target.value }))}
                    >
                      <option value="fit">✓ Fit for Work (لائق طبياً - معتمد)</option>
                      <option value="pending_results">⏳ Pending Lab Results (بانتظار النتائج)</option>
                      <option value="unfit">✗ Unfit for Work (غير لائق طبياً)</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'المركز الطبي / المستشفى المعتمد' : 'Accredited Medical Center'}</FormLabel>
                    <Input
                      size="sm"
                      bg="white"
                      placeholder="e.g. Dr. Sulaiman Al Habib Hospital"
                      value={empForm.medicalCenter}
                      onChange={(e) => setEmpForm((p) => ({ ...p, medicalCenter: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'تاريخ إجراء الفحص' : 'Examination Date'}</FormLabel>
                    <Input
                      size="sm"
                      bg="white"
                      type="date"
                      value={empForm.medicalExamDate}
                      onChange={(e) => setEmpForm((p) => ({ ...p, medicalExamDate: e.target.value }))}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">
                      {currentLanguage === 'ar' ? 'رقم تقرير منصة إفادة / وزارة الصحة' : 'Efada / MoH Report Reference No'}
                    </FormLabel>
                    <Input
                      size="sm"
                      bg="white"
                      placeholder="e.g. EFD-2026-90412"
                      value={empForm.medicalReportRef}
                      onChange={(e) => setEmpForm((p) => ({ ...p, medicalReportRef: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">
                      {currentLanguage === 'ar' ? 'إرفاق ملف الكشف الطبي (PDF / صورة)' : 'Attach Medical Report Document'}
                    </FormLabel>
                    <HStack spacing={2}>
                      <input
                        type="file"
                        id="medical-report-file-input"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={handleMedicalFileUpload}
                      />
                      <Button
                        as="label"
                        htmlFor="medical-report-file-input"
                        size="sm"
                        colorScheme="teal"
                        variant="outline"
                        bg="white"
                        cursor="pointer"
                        leftIcon={<FiPaperclip />}
                        flex={1}
                      >
                        {empForm.medicalAttachmentName
                          ? `${empForm.medicalAttachmentName.slice(0, 18)}...`
                          : currentLanguage === 'ar' ? 'اختر ملف التقرير الطبي' : 'Choose File (PDF/Image)'}
                      </Button>

                      {empForm.medicalAttachmentName && (
                        <IconButton
                          aria-label="Remove attachment"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => setEmpForm((p) => ({ ...p, medicalAttachmentUrl: '', medicalAttachmentName: '' }))}
                        />
                      )}
                    </HStack>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'ملاحظات الكشف الطبي / القيود الصحية' : 'Medical Notes & Health Conditions'}</FormLabel>
                  <Input
                    size="sm"
                    bg="white"
                    placeholder="e.g. Cleared for field duty; annual renewal required"
                    value={empForm.medicalNotes}
                    onChange={(e) => setEmpForm((p) => ({ ...p, medicalNotes: e.target.value }))}
                  />
                </FormControl>
              </Box>

              {/* SECTION 5: INITIAL ASSETS CUSTODY PROVISIONING */}
              {availableAssets && availableAssets.length > 0 && (
                <Box p={4} bg="blue.50" borderRadius="lg" borderWidth="1px" borderColor="blue.200">
                  <HStack justify="space-between" mb={2}>
                    <HStack spacing={2}>
                      <Badge colorScheme="blue" fontSize="xs">5</Badge>
                      <Text fontSize="xs" fontWeight="bold" color="blue.700">
                        💻 🚗 {currentLanguage === 'ar' ? 'تسليم عهدة أولية للموظف (لابتوب / مركبة / هاتف)' : 'Initial Asset Custody Provisioning'}
                      </Text>
                    </HStack>
                    <Badge colorScheme="blue" variant="subtle" fontSize="10px">
                      {availableAssets.length} {currentLanguage === 'ar' ? 'أصل متاح' : 'assets available'}
                    </Badge>
                  </HStack>
                  <Text fontSize="2xs" color="gray.600" mb={3}>
                    {currentLanguage === 'ar'
                      ? 'حدد الأصول المتاحة بالمستودع لتسليمها فورياً للموظف وإشعار مسؤولي الدعم الفني والأسطول'
                      : 'Select available warehouse assets to assign custody immediately and alert IT & Fleet stakeholders'}
                  </Text>
                  <VStack align="stretch" spacing={2} maxH="130px" overflowY="auto">
                    {availableAssets.map((ast) => (
                      <Checkbox
                        key={ast._id}
                        size="sm"
                        isChecked={empForm.assignedAssetIds.includes(ast._id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEmpForm((prev) => ({
                            ...prev,
                            assignedAssetIds: checked
                              ? [...prev.assignedAssetIds, ast._id]
                              : prev.assignedAssetIds.filter((id) => id !== ast._id),
                          }));
                        }}
                      >
                        <Text fontSize="xs" fontWeight="medium">
                          {ast.asset_tag} - {ast.asset_name} ({ast.category})
                        </Text>
                      </Checkbox>
                    ))}
                  </VStack>
                </Box>
              )}

              <Divider my={2} />

              {/* SECTION 6: BANKING & WPS */}
              <Box p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} bg={cardBg}>
                <HStack spacing={2} mb={3}>
                  <Badge colorScheme="purple" fontSize="xs">6</Badge>
                  <Heading size="xs" color="purple.600" textTransform="uppercase">
                    {t('bankingAndWpsSama', 'Banking & Wage Protection (WPS SAMA)')}
                  </Heading>
                </HStack>

                <FormControl isRequired mb={3}>
                  <HStack justify="space-between" mb={1}>
                    <FormLabel fontSize="xs" mb={0}>{t('beneficiaryBank', 'Saudi Beneficiary Bank')}</FormLabel>
                    <Button size="xs" variant="link" colorScheme="purple" onClick={onAddBankOpen}>
                      + {t('addCustomBank', 'Add Custom Bank / Account')}
                    </Button>
                  </HStack>
                  <Select
                    size="sm"
                    value={empForm.bankName}
                    onChange={(e) => handleBankChange(e.target.value)}
                  >
                    {allBanks.map((b) => (
                      <option key={b.name + b.swift} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">{t('saudiIban', 'Saudi IBAN (24 characters starting with SA)')}</FormLabel>
                  <Input
                    size="sm"
                    fontFamily="mono"
                    placeholder="SA0000000000000000000000"
                    value={empForm.iban}
                    onChange={(e) => setEmpForm((p) => ({ ...p, iban: e.target.value.toUpperCase() }))}
                  />
                </FormControl>
              </Box>

              <Divider my={2} />

              {/* SECTION 7: ERP ACCESS & QIWA CONTRACT */}
              <Box p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} bg={cardBg}>
                <HStack spacing={2} mb={3}>
                  <Badge colorScheme="teal" fontSize="xs">7</Badge>
                  <Heading size="xs" color="teal.600" textTransform="uppercase">
                    {t('erpAccessCol', 'ERP Access Control & Qiwa Contract')}
                  </Heading>
                </HStack>

                <FormControl display="flex" alignItems="center" mb={3}>
                  <FormLabel fontSize="xs" mb="0">
                    {t('enableErpAccess', 'Enable ERP System Access for Employee')}
                  </FormLabel>
                  <Switch
                    isChecked={empForm.erpAccessEnabled}
                    onChange={(e) =>
                      setEmpForm((p) => ({ ...p, erpAccessEnabled: e.target.checked }))
                    }
                    colorScheme="blue"
                  />
                </FormControl>

                {empForm.erpAccessEnabled && (
                  <Box p={3} bg={subBg} borderRadius="md" borderWidth="1px" mb={3}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                      <FormControl>
                        <FormLabel fontSize="xs">{t('assignedRole', 'Assigned Role')}</FormLabel>
                        <Select
                          size="sm"
                          value={empForm.assignedRole}
                          onChange={(e) => {
                            const r = e.target.value;
                            let mods = empForm.modulePermissions;
                            if (r === 'data_analyst') mods = ['invoices', 'quotations', 'procurement', 'inventory', 'accounting'];
                            else if (r === 'it_technician') mods = ['settings', 'governance'];
                            else if (r === 'cashier') mods = ['pos', 'invoices'];
                            else if (r === 'sales_rep') mods = ['quotations', 'invoices', 'customers', 'leads', 'delivery_notes'];
                            else if (r === 'procurement_officer') mods = ['procurement', 'suppliers', 'inventory'];
                            else if (r === 'inventory_clerk') mods = ['inventory', 'delivery_notes'];
                            else if (r === 'accountant') mods = ['accounting', 'invoices', 'governance'];
                            setEmpForm((p) => ({ ...p, assignedRole: r, modulePermissions: mods }));
                          }}
                        >
                          <option value="sales_rep">{roleLabels.sales_rep}</option>
                          <option value="cashier">{roleLabels.cashier}</option>
                          <option value="procurement_officer">{roleLabels.procurement_officer}</option>
                          <option value="inventory_clerk">{roleLabels.inventory_clerk}</option>
                          <option value="accountant">{roleLabels.accountant}</option>
                          <option value="data_analyst">{roleLabels.data_analyst}</option>
                          <option value="it_technician">{roleLabels.it_technician}</option>
                          <option value="custom">{roleLabels.custom}</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="xs">{t('dataScope', 'Data Visibility Scope')}</FormLabel>
                        <Select
                          size="sm"
                          value={empForm.dataScope}
                          onChange={(e) => handleDataScopeChange(e.target.value, false)}
                        >
                          <option value="own_records_only">{t('scopeOwnRecords', 'Own Records Only')}</option>
                          <option value="department_only">{t('scopeDeptRecords', 'Department Records Only')}</option>
                          <option value="all_organization_records">{t('scopeAllOrgRecords', 'All Organization Records (Unrestricted)')}</option>
                        </Select>
                      </FormControl>
                    </SimpleGrid>

                    {empForm.dataScope === 'all_organization_records' && (
                      <Alert status="info" size="sm" mb={3} borderRadius="md">
                        <AlertIcon />
                        <Box fontSize="11px">
                          {t('allOrgScopeAutoGrantNotice', 'When "All Organization Records" is selected, the user is automatically granted full access across all modules of the enterprise.')}
                        </Box>
                      </Alert>
                    )}

                    <Text fontSize="xs" fontWeight="bold" mb={2}>
                      {t('allowedModules', 'Authorized System Modules')}:
                    </Text>
                    <SimpleGrid columns={2} spacing={2}>
                      {SYSTEM_MODULES.map((m) => (
                        <Checkbox
                          key={m.id}
                          size="sm"
                          isChecked={empForm.modulePermissions.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEmpForm((p) => ({
                                ...p,
                                modulePermissions: [...p.modulePermissions, m.id],
                              }));
                            } else {
                              setEmpForm((p) => ({
                                ...p,
                                modulePermissions: p.modulePermissions.filter((x) => x !== m.id),
                              }));
                            }
                          }}
                        >
                          {m.label}
                        </Checkbox>
                      ))}
                    </SimpleGrid>

                    <Alert status="warning" size="sm" mt={3} borderRadius="md">
                      <AlertIcon />
                      <Box fontSize="11px">
                        {t('erpWhatsAppSignOffNote', 'Enabling or modifying ERP access automatically dispatches a WhatsApp sign-off request to stakeholders.')}
                      </Box>
                    </Alert>
                  </Box>
                )}

                {/* Qiwa Contract */}
                <Heading size="xs" color="blue.700" textTransform="uppercase" mb={2}>
                  {t('qiwaContractTitle', 'Qiwa Platform Contract Authentication (منصة قوى)')}
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">{t('qiwaContractNumber', 'Qiwa Contract Number (رقم عقد قوى)')}</FormLabel>
                    <Input
                      size="sm"
                      fontFamily="mono"
                      placeholder="QW-10829471"
                      value={empForm.qiwaContractId}
                      onChange={(e) => setEmpForm((p) => ({ ...p, qiwaContractId: e.target.value.toUpperCase() }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">{t('qiwaContractStatus', 'Qiwa Contract Status (حالة العقد)')}</FormLabel>
                    <Select
                      size="sm"
                      value={empForm.qiwaContractStatus}
                      onChange={(e) => setEmpForm((p) => ({ ...p, qiwaContractStatus: e.target.value }))}
                    >
                      <option value="authenticated">{t('qiwaAuthenticated', 'Authenticated & Active (موثق وساري)')}</option>
                      <option value="pending_signature">{t('qiwaPendingSignature', 'Pending Employee Acceptance in Absher (بانتظار قبول الموظف)')}</option>
                      <option value="draft">{t('qiwaDraft', 'Draft Contract (مسودة عقد)')}</option>
                      <option value="unlinked">{t('qiwaUnlinked', 'Unlinked (غير مربوط)')}</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
            <Button variant="ghost" mr={3} onClick={onAddEmpClose}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button colorScheme="blue" onClick={handleCreateEmployee} px={6}>
              {t('saveEmployee', 'Save Employee & Route Approvals')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>


      {/* ========================================================================= */}
      {/* MODAL: 2FA PHONE OTP VERIFICATION */}
      {/* ========================================================================= */}
      <Modal isOpen={is2faModalOpen} onClose={on2faModalClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={FiShield} color="teal.500" />
              <Text>{t('verifyPhone2fa', '2FA Phone Verification')}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="xs" color="gray.600" textAlign="center">
                {t('otpSentPrompt', 'Enter the 6-digit security OTP sent to:')}
                <Text as="span" fontWeight="bold" display="block" color="blue.600" mt={1}>
                  {twoFaState.phone}
                </Text>
              </Text>

              {twoFaState.simulatedCode && (
                <Alert status="info" size="sm" borderRadius="md">
                  <AlertIcon />
                  <Box fontSize="xs">
                    {t('simulatedOtpHint', 'Demo / Simulation Code:')} <strong>{twoFaState.simulatedCode}</strong>
                  </Box>
                </Alert>
              )}

              <HStack justify="center">
                <PinInput
                  otp
                  size="lg"
                  value={twoFaState.otpInput}
                  onChange={(val) => setTwoFaState((p) => ({ ...p, otpInput: val }))}
                >
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                </PinInput>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={on2faModalClose}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button colorScheme="teal" onClick={handleConfirm2fa}>
              {t('verifyAndConfirm', 'Verify & Confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOM DEPARTMENT */}
      {/* ========================================================================= */}
      <Modal isOpen={isAddDeptOpen} onClose={onAddDeptClose}>
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>{t('addDepartment', '+ Add New Department')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs">{t('deptNameEn', 'Department Name (En)')}</FormLabel>
                <Input
                  size="sm"
                  placeholder="e.g. Engineering & IT"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm((p) => ({ ...p, name: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">{t('deptNameAr', 'Department Name (Arabic)')}</FormLabel>
                <Input
                  size="sm"
                  placeholder="مثال: الهندسة وتقنية المعلومات"
                  value={deptForm.nameArabic}
                  onChange={(e) => setDeptForm((p) => ({ ...p, nameArabic: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">{t('deptCode', 'Department Code (Short)')}</FormLabel>
                <Input
                  size="sm"
                  placeholder="e.g. IT, ENG, MKT"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">{t('description', 'Description')}</FormLabel>
                <Input
                  size="sm"
                  placeholder="Department operational scope"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm((p) => ({ ...p, description: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddDeptClose}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button colorScheme="blue" onClick={handleCreateDepartment}>
              {t('save', 'Save Department')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOM BANK / ACCOUNT */}
      {/* ========================================================================= */}
      <Modal isOpen={isAddBankOpen} onClose={onAddBankClose}>
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>{t('addBank', '+ Add Bank Account')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs">{t('bankNameEn', 'Bank Name (En)')}</FormLabel>
                <Input
                  size="sm"
                  placeholder="e.g. Standard Chartered / Custom Bank"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">{t('bankNameAr', 'Bank Name (Arabic)')}</FormLabel>
                <Input
                  size="sm"
                  placeholder="مثال: البنك الأهلي التجاري"
                  value={bankForm.bankNameArabic}
                  onChange={(e) => setBankForm((p) => ({ ...p, bankNameArabic: e.target.value }))}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs">{t('swiftCode', 'SWIFT / BIC Code (8-11 Chars)')}</FormLabel>
                <Input
                  size="sm"
                  fontFamily="mono"
                  placeholder="e.g. SCBLSARI"
                  value={bankForm.swiftCode}
                  onChange={(e) => setBankForm((p) => ({ ...p, swiftCode: e.target.value.toUpperCase() }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">{t('accountNumber', 'Account Number')}</FormLabel>
                <Input
                  size="sm"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm((p) => ({ ...p, accountNumber: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">{t('iban', 'IBAN')}</FormLabel>
                <Input
                  size="sm"
                  fontFamily="mono"
                  placeholder="SA0000000000000000000000"
                  value={bankForm.iban}
                  onChange={(e) => setBankForm((p) => ({ ...p, iban: e.target.value.toUpperCase() }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddBankClose}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button colorScheme="purple" onClick={handleCreateBank}>
              {t('save', 'Save Bank')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE ERP ACCESS (With Auto All-Org Grant) */}
      {/* ========================================================================= */}
      <Modal isOpen={isAccessModalOpen} onClose={onAccessModalClose} size="lg">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>
            {t('editPermissions', 'Configure ERP Permissions')}: {selectedEmp?.full_name_arabic || selectedEmp?.first_name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel fontSize="sm" mb="0">
                  {t('enableErpAccess', 'Enable ERP System Access for Employee')}
                </FormLabel>
                <Switch
                  isChecked={accessForm.erpAccessEnabled}
                  onChange={(e) =>
                    setAccessForm((p) => ({ ...p, erpAccessEnabled: e.target.checked }))
                  }
                  colorScheme="blue"
                />
              </FormControl>

              {accessForm.erpAccessEnabled && (
                <>
                  <SimpleGrid columns={2} spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="xs">{t('assignedRole', 'Role')}</FormLabel>
                      <Select
                        size="sm"
                        value={accessForm.assignedRole}
                        onChange={(e) => {
                          const r = e.target.value;
                          let mods = accessForm.modulePermissions;
                          if (r === 'data_analyst') mods = ['invoices', 'quotations', 'procurement', 'inventory', 'accounting'];
                          else if (r === 'it_technician') mods = ['settings', 'governance'];
                          else if (r === 'cashier') mods = ['pos', 'invoices'];
                          else if (r === 'sales_rep') mods = ['quotations', 'invoices', 'customers', 'leads', 'delivery_notes'];
                          else if (r === 'procurement_officer') mods = ['procurement', 'suppliers', 'inventory'];
                          else if (r === 'inventory_clerk') mods = ['inventory', 'delivery_notes'];
                          else if (r === 'accountant') mods = ['accounting', 'invoices', 'governance'];
                          setAccessForm((p) => ({ ...p, assignedRole: r, modulePermissions: mods }));
                        }}
                      >
                        <option value="sales_rep">{roleLabels.sales_rep}</option>
                        <option value="cashier">{roleLabels.cashier}</option>
                        <option value="procurement_officer">{roleLabels.procurement_officer}</option>
                        <option value="inventory_clerk">{roleLabels.inventory_clerk}</option>
                        <option value="accountant">{roleLabels.accountant}</option>
                        <option value="data_analyst">{roleLabels.data_analyst}</option>
                        <option value="it_technician">{roleLabels.it_technician}</option>
                        <option value="custom">{roleLabels.custom}</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="xs">{t('dataScope', 'Data Visibility Scope')}</FormLabel>
                      <Select
                        size="sm"
                        value={accessForm.dataScope}
                        onChange={(e) => handleDataScopeChange(e.target.value, true)}
                      >
                        <option value="own_records_only">{t('scopeOwnRecords', 'Own Records Only')}</option>
                        <option value="department_only">{t('scopeDeptRecords', 'Department Records Only')}</option>
                        <option value="all_organization_records">{t('scopeAllOrgRecords', 'All Organization Records (Unrestricted)')}</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  {accessForm.dataScope === 'all_organization_records' && (
                    <Alert status="info" size="sm" borderRadius="md">
                      <AlertIcon />
                      <Box fontSize="11px">
                        {t('allOrgScopeAutoGrantNotice', 'When "All Organization Records" is selected, the user is automatically granted full access across all modules of the enterprise.')}
                      </Box>
                    </Alert>
                  )}

                  <Text fontSize="xs" fontWeight="bold">
                    {t('allowedModules', 'Authorized System Modules')}:
                  </Text>
                  <SimpleGrid columns={2} spacing={2}>
                    {SYSTEM_MODULES.map((m) => (
                      <Checkbox
                        key={m.id}
                        size="sm"
                        isChecked={accessForm.modulePermissions.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAccessForm((p) => ({
                              ...p,
                              modulePermissions: [...p.modulePermissions, m.id],
                            }));
                          } else {
                            setAccessForm((p) => ({
                              ...p,
                              modulePermissions: p.modulePermissions.filter((x) => x !== m.id),
                            }));
                          }
                        }}
                      >
                        {m.label}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAccessModalClose}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button colorScheme="blue" onClick={handleSaveAccess}>
              {t('saveAndSendWhatsApp', 'Save & Request WhatsApp Sign-off')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD STAKEHOLDER APPROVER */}
      {/* ========================================================================= */}
      <Modal isOpen={isApproverModalOpen} onClose={onApproverModalClose}>
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>
            {editingApproverId
              ? t('editStakeholderApprover', 'Edit Stakeholder Approver')
              : t('manageWhatsAppApprovers', 'Register Stakeholder Approver')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs">{t('stakeholderFullName', 'Stakeholder Full Name')}</FormLabel>
                <Input
                  size="sm"
                  placeholder="e.g. Sheikh Abdullah (Sponsor / الكفيل)"
                  value={approverForm.fullName}
                  onChange={(e) => setApproverForm((p) => ({ ...p, fullName: e.target.value }))}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">{t('roleOrTitle', 'Role / Stakeholder Title')}</FormLabel>
                <Select
                  size="sm"
                  value={approverForm.role}
                  onChange={(e) => setApproverForm((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="sponsor">{t('saudiSponsor', 'Saudi Sponsor (الكفيل)')}</option>
                  <option value="owner">{t('owner', 'Owner / Founder (المالك)')}</option>
                  <option value="managing_director">{t('managingDirector', 'Managing Director (المدير العام)')}</option>
                  <option value="cfo">{t('cfo', 'Chief Financial Officer (CFO)')}</option>
                  <option value="hr_manager">{t('hrAdminManager', 'HR Admin Manager')}</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">{t('whatsAppPhoneInternational', 'WhatsApp Phone (with Country Code +966)')}</FormLabel>
                <Input
                  size="sm"
                  fontFamily="mono"
                  placeholder="+966501234567"
                  value={approverForm.phoneNumber}
                  onChange={(e) => setApproverForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs">{t('approvalScope', 'Authorized Approval Scope')}</FormLabel>
                <Checkbox
                  isChecked={approverForm.approvalScope.includes('all')}
                  onChange={(e) =>
                    setApproverForm((p) => ({
                      ...p,
                      approvalScope: e.target.checked ? ['all'] : ['erp_access'],
                    }))
                  }
                >
                  {t('allScopesCheckbox', 'All Approvals (ERP Access, Salary Contracts & WPS Payroll)')}
                </Checkbox>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onApproverModalClose}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button colorScheme="whatsapp" onClick={handleSaveApprover}>
              {editingApproverId ? t('updateApproverBtn', 'Update Approver') : t('saveApproverBtn', 'Save Approver')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RECORD LEAVE REQUEST (SAUDI LABOR LAW COMPLIANT) */}
      {/* ========================================================================= */}
      <Modal isOpen={isAddLeaveOpen} onClose={onAddLeaveClose} size="lg">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>{t('recordLeaveRequest', '+ Record Employee Leave')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs">{t('selectEmployee', 'Select Employee')}</FormLabel>
                <Select
                  size="sm"
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, employeeId: e.target.value }))}
                >
                  <option value="">-- {t('selectEmployee', 'Select Employee')} --</option>
                  {(employees || []).map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.employee_number} - {e.full_name_arabic || e.first_name} ({e.job_title})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">{t('leaveType', 'Leave Type')}</FormLabel>
                <Select
                  size="sm"
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, leaveType: e.target.value }))}
                >
                  <option value="annual">{t('annualLeave', 'Annual Leave (100% Paid - Art. 109)')}</option>
                  <option value="sick">{t('sickLeave', 'Sick Leave (Art. 117 Tiers: 30d@100%, 60d@75%, 30d@0%)')}</option>
                  <option value="unpaid">{t('unpaidLeave', 'Unpaid Leave (Art. 116 - Pro-rata Salary Deduction)')}</option>
                  <option value="marriage">{t('marriageLeave', 'Marriage Leave (5 Days Paid - Art. 113)')}</option>
                  <option value="paternity">{t('paternityLeave', 'Paternity Leave (3 Days Paid - Art. 113)')}</option>
                  <option value="bereavement">{t('bereavementLeave', 'Bereavement Leave (5 Days Paid - Art. 113)')}</option>
                  <option value="maternity">{t('maternityLeave', 'Maternity Leave (10 Weeks Paid - Art. 151)')}</option>
                  <option value="hajj">{t('hajjLeave', 'Hajj Pilgrimage Leave (10-15 Days - Art. 114)')}</option>
                </Select>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">{t('startDate', 'Start Date')}</FormLabel>
                  <Input
                    size="sm"
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">{t('endDate', 'End Date')}</FormLabel>
                  <Input
                    size="sm"
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, endDate: e.target.value }))}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">{t('daysCount', 'Duration (Days)')}</FormLabel>
                  <NumberInput
                    size="sm"
                    min={1}
                    value={leaveForm.daysCount}
                    onChange={(_, val) => setLeaveForm((p) => ({ ...p, daysCount: isNaN(val) ? 1 : val }))}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              {leaveForm.leaveType === 'sick' && (
                <FormControl>
                  <FormLabel fontSize="xs">{t('medicalReportRef', 'Medical Report Number (Sehhaty صحتي)')}</FormLabel>
                  <Input
                    size="sm"
                    placeholder="SL-2026-XXXXX"
                    value={leaveForm.medicalReportRef}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, medicalReportRef: e.target.value }))}
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel fontSize="xs">{t('notes', 'Notes / Justification')}</FormLabel>
                <Input
                  size="sm"
                  placeholder="Optional internal justification"
                  value={leaveForm.notes}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </FormControl>

              <Checkbox
                isChecked={leaveForm.travelOutsideSaudi}
                onChange={(e) => setLeaveForm((p) => ({ ...p, travelOutsideSaudi: e.target.checked }))}
              >
                {t('travelOutsideSaudi', 'Employee plans to travel outside Saudi Arabia (creates an HR/Muqeem task after final approval)')}
              </Checkbox>

              <Alert status="info" size="sm" borderRadius="md">
                <AlertIcon />
                <Box fontSize="11px">
                  {leaveForm.leaveType === 'annual' && t('annualNotice', 'Annual leave is 100% fully paid. Net payroll and WPS SIF files remain normal.')}
                  {leaveForm.leaveType === 'sick' && t('sickNotice', 'Sick leave automatically calculates cumulative days this year per Article 117 and assigns Mudad code "SL".')}
                  {leaveForm.leaveType === 'unpaid' && t('unpaidNotice', 'Unpaid leave automatically deducts pro-rata daily wage in the monthly payroll batch with Mudad code "UL".')}
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddLeaveClose}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button colorScheme="teal" onClick={handleSubmitLeave}>
              {t('submitLeaveForApproval', 'Submit for Manager Approval')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 9: ADD / RENEW LEGAL DOCUMENT (IQAMA, PASSPORT, CCHI, LICENSES) */}
      {/* ========================================================================= */}
      <Modal isOpen={isAddDocModalOpen} onClose={onAddDocModalClose} size="lg">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>
            {currentLanguage === 'ar' ? 'إضافة / تجديد وثيقة قانونية' : 'Add / Renew Legal Document'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'الموظف' : 'Select Employee'}</FormLabel>
                <Select
                  size="sm"
                  value={docForm.employeeId}
                  onChange={(e) => setDocForm((p) => ({ ...p, employeeId: e.target.value }))}
                >
                  <option value="">-- {currentLanguage === 'ar' ? 'اختر الموظف' : 'Select Employee'} --</option>
                  {employees?.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.employee_number} - {emp.full_name_arabic || emp.first_name} ({emp.job_title})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'نوع الوثيقة' : 'Document Type'}</FormLabel>
                  <Select
                    size="sm"
                    value={docForm.documentType}
                    onChange={(e) => setDocForm((p) => ({ ...p, documentType: e.target.value }))}
                  >
                    <option value="iqama">Iqama (إقامة مقيم)</option>
                    <option value="national_id">National ID (هوية وطنية)</option>
                    <option value="passport">Passport (جواز سفر)</option>
                    <option value="medical_insurance">Medical Insurance (تأمين طبي CCHI)</option>
                    <option value="driving_license">Driving License (رخصة قيادة)</option>
                    <option value="professional_accreditation">Accreditation (اعتماد مهني SCE/SOCPA)</option>
                    <option value="ajeer_notice">Ajeer Notice (إشعار أجير)</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'رقم الوثيقة / الإقامة' : 'Document / ID Number'}</FormLabel>
                  <Input
                    size="sm"
                    value={docForm.documentNumber}
                    onChange={(e) => setDocForm((p) => ({ ...p, documentNumber: e.target.value }))}
                    placeholder="e.g. 2489102841"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}</FormLabel>
                  <Input
                    size="sm"
                    type="date"
                    value={docForm.issueDate}
                    onChange={(e) => setDocForm((p) => ({ ...p, issueDate: e.target.value }))}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</FormLabel>
                  <Input
                    size="sm"
                    type="date"
                    value={docForm.expiryDate}
                    onChange={(e) => setDocForm((p) => ({ ...p, expiryDate: e.target.value }))}
                  />
                </FormControl>
              </SimpleGrid>

              {docForm.documentType === 'medical_insurance' && (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'شركة التأمين' : 'Provider'}</FormLabel>
                    <Input
                      size="sm"
                      placeholder="e.g. Bupa / Tawuniya"
                      value={docForm.insuranceProvider}
                      onChange={(e) => setDocForm((p) => ({ ...p, insuranceProvider: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'فئة التأمين' : 'Class'}</FormLabel>
                    <Select
                      size="sm"
                      value={docForm.insuranceClass}
                      onChange={(e) => setDocForm((p) => ({ ...p, insuranceClass: e.target.value }))}
                    >
                      <option value="VIP">VIP</option>
                      <option value="Class A">Class A</option>
                      <option value="Class B">Class B</option>
                      <option value="Class C">Class C</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'رقم البوليصة' : 'Policy No'}</FormLabel>
                    <Input
                      size="sm"
                      value={docForm.insurancePolicyNumber}
                      onChange={(e) => setDocForm((p) => ({ ...p, insurancePolicyNumber: e.target.value }))}
                    />
                  </FormControl>
                </SimpleGrid>
              )}

              <FormControl>
                <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'جهة الإصدار' : 'Issuing Authority'}</FormLabel>
                <Input
                  size="sm"
                  value={docForm.issuingAuthority}
                  onChange={(e) => setDocForm((p) => ({ ...p, issuingAuthority: e.target.value }))}
                  placeholder="Jawazat / CCHI / Moroor / SCE"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" mr={3} onClick={onAddDocModalClose}>
              {currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              colorScheme="orange"
              onClick={async () => {
                if (!docForm.employeeId || !docForm.documentNumber || !docForm.expiryDate) {
                  toast({
                    title: 'Validation Error',
                    description: 'Employee, document number, and expiry date are required',
                    status: 'warning',
                  });
                  return;
                }
                try {
                  await addLegalDocMutation({
                    organization_id: selectedOrganization as any,
                    employee_id: docForm.employeeId as any,
                    document_type: docForm.documentType,
                    document_number: docForm.documentNumber,
                    issue_date_gregorian: docForm.issueDate,
                    expiry_date_gregorian: docForm.expiryDate,
                    issuing_authority: docForm.issuingAuthority,
                    insurance_provider: docForm.insuranceProvider || undefined,
                    insurance_class: docForm.insuranceClass || undefined,
                    insurance_policy_number: docForm.insurancePolicyNumber || undefined,
                  });

                  toast({
                    title: 'Document Registered',
                    description: 'Legal document saved with automated expiry countdown',
                    status: 'success',
                  });
                  onAddDocModalClose();
                } catch (e: any) {
                  toast({ title: 'Error', description: e.message, status: 'error' });
                }
              }}
            >
              {currentLanguage === 'ar' ? 'حفظ الوثيقة' : 'Save Document'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HRManagementScreen;
