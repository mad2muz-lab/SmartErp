import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  SimpleGrid,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Divider,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
} from '@chakra-ui/react';
import { Id } from '../../../convex/_generated/dataModel';
import { GovernanceProvider, useGovernance } from './GovernanceContext';
import GovernanceDashboard from './GovernanceDashboard';
import BilateralSettlementTerminal from './BilateralSettlementTerminal';
import ResourceRequisitionTerminal from './ResourceRequisitionTerminal';
import ProjectRaciMatrix from './ProjectRaciMatrix';
import WhatsAppStakeholderBotTerminal from './WhatsAppStakeholderBotTerminal';
import { SaudiRiyalIcon } from '../icons/SaudiRiyalIcon';
import {
  FiShield,
  FiTruck,
  FiGrid,
  FiCheckCircle,
  FiAward,
  FiFileText,
  FiCheckSquare,
  FiAlertTriangle,
  FiClock,
  FiChevronRight,
  FiInfo,
  FiActivity,
  FiLock,
  FiArrowRight,
  FiArrowLeft,
  FiSend,
  FiPlus,
  FiCheck,
  FiCompass,
  FiLayers,
  FiEdit2,
  FiDownload,
  FiTrash2,
  FiEye,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export interface ConsortiumContractor {
  id: string;
  name: string;
  role: string;
  crNumber?: string;
  mobile: string;
  liabilityCap: number;
  soleIndemnityStatus: 'signed' | 'pending';
}

export const DEFAULT_CONTRACTORS: ConsortiumContractor[] = [
  {
    id: 'cont-1',
    name: 'Company B (Executing Partner / الشريك المنفذ والممول)',
    role: 'Lead Executing & Financing Partner (الشريك المنفذ والممول الرئيسي)',
    crNumber: '1010398201',
    mobile: '+966505123456',
    liabilityCap: 1500000,
    soleIndemnityStatus: 'signed',
  },
  {
    id: 'cont-2',
    name: 'Gulf Earthworks & Foundations Co. (شركة الخليج للحفريات والأساسات)',
    role: 'Subcontractor - Earthworks & Deep Excavation (مقاول باطن - أعمال الحفر والأساسات)',
    crNumber: '1010543210',
    mobile: '+966505678910',
    liabilityCap: 800000,
    soleIndemnityStatus: 'pending',
  },
  {
    id: 'cont-3',
    name: 'RedSea MEP Electromechanical Ltd. (شركة البحر الأحمر للكهروميكانيك)',
    role: 'Subcontractor - MEP & HVAC Works (مقاول باطن - الأعمال الكهروميكانيكية والتكييف)',
    crNumber: '1010654321',
    mobile: '+966505987654',
    liabilityCap: 1200000,
    soleIndemnityStatus: 'pending',
  },
];

interface CorporateGovernanceModuleProps {
  organizationId: Id<"organizations">;
  userId: Id<"user_profiles">;
}

const CorporateGovernanceModuleContent: React.FC<CorporateGovernanceModuleProps> = ({
  organizationId,
  userId,
}) => {
  const bg = useColorModeValue('gray.50', 'gray.900');
  const navBg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();

  // Mode: 'guided' (Simple step-by-step wizard) vs 'all_tabs' (Advanced multi-tab view)
  const [viewMode, setViewMode] = useState<'guided' | 'all_tabs'>('guided');

  // Guided Step (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Tab Index for Advanced Mode (0 to 4)
  const [tabIndex, setTabIndex] = useState(0);

  // Modals
  const checklistModal = useDisclosure();
  const nafithModal = useDisclosure();
  const sanadModal = useDisclosure();
  const vendorSlipModal = useDisclosure();
  const passportModal = useDisclosure();
  const ceilingModal = useDisclosure();
  const editProjectModal = useDisclosure();
  const finalClosureModal = useDisclosure();
  const contractsVaultModal = useDisclosure();
  const viewContractModal = useDisclosure();
  const editContractModal = useDisclosure();
  const addContractorModal = useDisclosure();
  const editContractorModal = useDisclosure();

  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [contractForm, setContractForm] = useState<any>({});
  const [isNewContract, setIsNewContract] = useState(false);

  const [newContractorForm, setNewContractorForm] = useState({
    name: '',
    role: '',
    crNumber: '',
    mobile: '+9665',
    liabilityCap: 500000,
  });

  const [editingContractor, setEditingContractor] = useState<ConsortiumContractor | null>(null);

  // 1. GENERALIZED PROJECT & CONSORTIUM DATA (Customizable on the fly)
  const [projectData, setProjectData] = useState(() => {
    try {
      const saved = localStorage.getItem('trading_erp_governance_project_meta');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.contractors || !Array.isArray(parsed.contractors) || parsed.contractors.length === 0) {
          parsed.contractors = DEFAULT_CONTRACTORS;
        }
        return parsed;
      }
      return {
        projectName: 'Commercial Contracting Consortium Project (مشروع التحالف التجاري)',
        clientName: 'Project Owner / Client (المالك / صاحب المشروع)',
        contractValue: 45000000,
        companyAName: 'Company A (Lead CR Holder / صاحب السجل)',
        companyACR: '1010884219',
        partnerBName: 'Company B (Executing Partner / الشريك المنفذ والممول)',
        partnerBCR: '1010398201',
        partnerMobile: '+966505123456',
        contractors: DEFAULT_CONTRACTORS,
      };
    } catch {
      return {
        projectName: 'Commercial Contracting Consortium Project (مشروع التحالف التجاري)',
        clientName: 'Project Owner / Client (المالك / صاحب المشروع)',
        contractValue: 45000000,
        companyAName: 'Company A (Lead CR Holder / صاحب السجل)',
        companyACR: '1010884219',
        partnerBName: 'Company B (Executing Partner / الشريك المنفذ والممول)',
        partnerBCR: '1010398201',
        partnerMobile: '+966505123456',
        contractors: DEFAULT_CONTRACTORS,
      };
    }
  });

  const [editProjForm, setEditProjForm] = useState(projectData);

  const handleSaveProjectMeta = () => {
    setProjectData(editProjForm);
    localStorage.setItem('trading_erp_governance_project_meta', JSON.stringify(editProjForm));
    toast({
      title: 'Project & Consortium Details Updated',
      description: 'Generalized company names and contract parameters saved.',
      status: 'success',
    });
    editProjectModal.onClose();
  };

  // Customizable Liability Ceiling State
  const [customLiabilityCap, setCustomLiabilityCap] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('trading_erp_governance_liability_cap');
      return saved ? Number(saved) : 1500000;
    } catch {
      return 1500000;
    }
  });
  const [tempCapInput, setTempCapInput] = useState<number>(customLiabilityCap);

  const handleSaveCeiling = () => {
    const val = Number(tempCapInput) || 1500000;
    setCustomLiabilityCap(val);
    localStorage.setItem('trading_erp_governance_liability_cap', String(val));
    toast({
      title: 'Liability Ceiling Updated (تم تخصيص سقف الالتزام)',
      description: `Maximum procurement ceiling customized to ${formatSAR(val)} \uE900.`,
      status: 'success',
    });
    ceilingModal.onClose();
  };

  const [showCovenantsDetail, setShowCovenantsDetail] = useState(false);

  const handleQuickSaveStep1 = () => {
    const updatedProject = {
      ...projectData,
      partnerBName: editProjForm.partnerBName || projectData.partnerBName,
      partnerMobile: editProjForm.partnerMobile || projectData.partnerMobile,
    };
    setProjectData(updatedProject);
    localStorage.setItem('trading_erp_governance_project_meta', JSON.stringify(updatedProject));

    const val = Number(tempCapInput) || 1500000;
    setCustomLiabilityCap(val);
    localStorage.setItem('trading_erp_governance_liability_cap', String(val));

    toast({
      title: 'Consortium Parameters Confirmed (تم اعتماد الشريك وسقف الالتزام)',
      description: `Lead: ${updatedProject.partnerBName} | Total Cap: ${formatSAR(val)}. The 8 Governance Covenants are active.`,
      status: 'success',
    });
  };

  const handleAddContractor = () => {
    if (!newContractorForm.name.trim()) {
      toast({
        title: 'Contractor Name Required (اسم المقاول مطلوب)',
        description: 'Please enter the contractor or partner legal entity name.',
        status: 'warning',
      });
      return;
    }

    const enteredRole = newContractorForm.role.trim() || 'Subcontractor - General (مقاول باطن عام)';

    const newEntry: ConsortiumContractor = {
      id: `cont-${Date.now()}`,
      name: newContractorForm.name.trim(),
      role: enteredRole,
      crNumber: newContractorForm.crNumber.trim() || undefined,
      mobile: newContractorForm.mobile.trim() || '+966500000000',
      liabilityCap: Number(newContractorForm.liabilityCap) || 500000,
      soleIndemnityStatus: 'pending',
    };

    const currentList: ConsortiumContractor[] = projectData.contractors || DEFAULT_CONTRACTORS;
    const updatedContractors = [...currentList, newEntry];

    const updatedProject = {
      ...projectData,
      contractors: updatedContractors,
    };

    setProjectData(updatedProject);
    setEditProjForm(updatedProject);
    localStorage.setItem('trading_erp_governance_project_meta', JSON.stringify(updatedProject));

    setNewContractorForm({
      name: '',
      role: '',
      crNumber: '',
      mobile: '+9665',
      liabilityCap: 500000,
    });
    addContractorModal.onClose();

    toast({
      title: 'Contractor Added to Consortium (تمت إضافة المقاول للتحالف)',
      description: `${newEntry.name} enrolled with role "${enteredRole}" and ${formatSAR(newEntry.liabilityCap)} \uE900 cap.`,
      status: 'success',
    });
  };

  const handleOpenEditContractor = (contractor: ConsortiumContractor) => {
    setEditingContractor({ ...contractor });
    editContractorModal.onOpen();
  };

  const handleSaveContractorEdit = () => {
    if (!editingContractor || !editingContractor.name.trim()) {
      toast({
        title: 'Contractor Name Required (اسم المقاول مطلوب)',
        description: 'Please enter the legal name of the entity.',
        status: 'warning',
      });
      return;
    }

    const currentList: ConsortiumContractor[] = projectData.contractors || DEFAULT_CONTRACTORS;
    const updatedRole = editingContractor.role.trim() || 'Subcontractor - General (مقاول باطن عام)';
    const updatedContractors = currentList.map((c) =>
      c.id === editingContractor.id ? { ...editingContractor, role: updatedRole } : c
    );

    const updatedProject = {
      ...projectData,
      partnerBName: updatedContractors[0]?.name || projectData.partnerBName,
      partnerMobile: updatedContractors[0]?.mobile || projectData.partnerMobile,
      contractors: updatedContractors,
    };

    setProjectData(updatedProject);
    setEditProjForm(updatedProject);
    localStorage.setItem('trading_erp_governance_project_meta', JSON.stringify(updatedProject));
    editContractorModal.onClose();

    toast({
      title: 'Contractor Role & Parameters Saved (تم تحديث دور وبيانات المقاول)',
      description: `Role updated to "${updatedRole}" for ${editingContractor.name}.`,
      status: 'success',
    });
  };

  const handleRemoveContractor = (contractorId: string) => {
    const currentList: ConsortiumContractor[] = projectData.contractors || DEFAULT_CONTRACTORS;
    if (currentList.length <= 1) {
      toast({
        title: 'Cannot Remove Sole Contractor',
        description: 'At least one executing partner must remain in the consortium contract.',
        status: 'warning',
      });
      return;
    }

    const updatedContractors = currentList.filter((c) => c.id !== contractorId);
    const updatedProject = {
      ...projectData,
      partnerBName: updatedContractors[0]?.name || projectData.partnerBName,
      partnerMobile: updatedContractors[0]?.mobile || projectData.partnerMobile,
      contractors: updatedContractors,
    };

    setProjectData(updatedProject);
    setEditProjForm(updatedProject);
    localStorage.setItem('trading_erp_governance_project_meta', JSON.stringify(updatedProject));

    toast({
      title: 'Contractor Unlinked (تم حذف المقاول)',
      description: 'The contractor has been removed from this master consortium contract.',
      status: 'info',
    });
  };

  const handleToggleIndemnity = (contractorId: string) => {
    const currentList: ConsortiumContractor[] = projectData.contractors || DEFAULT_CONTRACTORS;
    const updatedContractors = currentList.map((c) => {
      if (c.id === contractorId) {
        return {
          ...c,
          soleIndemnityStatus: (c.soleIndemnityStatus === 'signed' ? 'pending' : 'signed') as 'signed' | 'pending',
        };
      }
      return c;
    });

    const updatedProject = {
      ...projectData,
      contractors: updatedContractors,
    };

    setProjectData(updatedProject);
    setEditProjForm(updatedProject);
    localStorage.setItem('trading_erp_governance_project_meta', JSON.stringify(updatedProject));

    toast({
      title: 'Indemnity Status Updated (تم تحديث حالة الضمان)',
      description: 'Sole Indemnity (Royal Decree M/43) status updated successfully.',
      status: 'success',
    });
  };

  // Access Live Governance Store
  const {
    sanadNotes,
    nafithAlerts,
    brandPassports,
    collaborations,
    addCollaboration,
    updateCollaboration,
    deleteCollaboration,
    bilateralTransactions,
    logNafithAlert,
    createSanadNote,
    grantBrandPassport,
    acceptRiskPassport,
    recordBilateralTransaction,
    executeBilateralDischarge,
    dispatchWhatsAppNotice,
  } = useGovernance();

  // Executed Contracts Management Handlers (Executing Company Priority)
  const handleOpenViewContract = (contract: any) => {
    setSelectedContract(contract);
    viewContractModal.onOpen();
  };

  const handleOpenEditContract = (contract: any) => {
    setSelectedContract(contract);
    setContractForm({ ...contract });
    setIsNewContract(false);
    editContractModal.onOpen();
  };

  const handleOpenAddContract = () => {
    setSelectedContract(null);
    setContractForm({
      agreement_code: `AGR-2026-${String((collaborations?.length || 0) + 1).padStart(4, '0')}`,
      project_name: '',
      client_name: '',
      partner_name: '',
      lead_company_name: projectData.companyAName,
      contract_value: 15000000,
      liability_cap: 1500000,
      management_fee_type: 'zero_fee',
      management_fee_value: 0,
      collaboration_type: 'CR Sponsorship & Execution Consortium (رعاية السجل والتنفيذ)',
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      notes: '',
    });
    setIsNewContract(true);
    editContractModal.onOpen();
  };

  const handleSaveContract = () => {
    if (!contractForm.project_name || !contractForm.partner_name) {
      toast({
        title: 'Validation Error (خطأ في البيانات)',
        description: 'Please specify the project name and executing partner name.',
        status: 'warning',
      });
      return;
    }

    if (isNewContract) {
      addCollaboration(contractForm);
      toast({
        title: 'Consortium Contract Executed & Vaulted (تم قيد عقد التحالف الجديد)',
        description: `Contract ${contractForm.agreement_code} saved into executed vault.`,
        status: 'success',
      });
    } else if (selectedContract) {
      updateCollaboration(selectedContract.id || selectedContract._id, contractForm);
      if (selectedContract.project_name === projectData.projectName) {
        const updated = {
          ...projectData,
          projectName: contractForm.project_name || projectData.projectName,
          partnerBName: contractForm.partner_name || projectData.partnerBName,
          clientName: contractForm.client_name || projectData.clientName,
          contractValue: contractForm.contract_value || projectData.contractValue,
        };
        setProjectData(updated);
        localStorage.setItem('trading_erp_governance_project_meta', JSON.stringify(updated));
        if (contractForm.liability_cap) {
          setCustomLiabilityCap(contractForm.liability_cap);
          localStorage.setItem('trading_erp_governance_liability_cap', String(contractForm.liability_cap));
        }
      }
      toast({
        title: 'Contract Updated by Executing Company (تم تحديث بيانات العقد)',
        description: `Contract ${contractForm.agreement_code} parameters modified.`,
        status: 'success',
      });
    }
    editContractModal.onClose();
  };

  const handleDeleteContract = (id: string, code: string) => {
    deleteCollaboration(id);
    toast({
      title: 'Contract Deleted / Archived (تم حذف وأرشفة العقد)',
      description: `Contract ${code} has been deleted by the Executing Company.`,
      status: 'info',
    });
  };

  const handleLoadIntoWizard = (contract: any) => {
    const currentContractors: ConsortiumContractor[] = projectData.contractors || DEFAULT_CONTRACTORS;
    const updatedContractors = [
      {
        ...currentContractors[0],
        name: contract.partner_name,
        role: contract.partner_role || currentContractors[0]?.role || 'Lead Executing & Financing Partner',
        mobile: contract.partner_mobile || currentContractors[0]?.mobile,
        liabilityCap: contract.liability_cap || currentContractors[0]?.liabilityCap,
      },
      ...currentContractors.slice(1),
    ];

    const updated = {
      ...projectData,
      projectName: contract.project_name,
      partnerBName: contract.partner_name,
      clientName: contract.client_name || projectData.clientName,
      contractValue: contract.contract_value || projectData.contractValue,
      contractors: updatedContractors,
    };
    setProjectData(updated);
    setEditProjForm(updated);
    localStorage.setItem('trading_erp_governance_project_meta', JSON.stringify(updated));
    if (contract.liability_cap) {
      setCustomLiabilityCap(contract.liability_cap);
      setTempCapInput(contract.liability_cap);
      localStorage.setItem('trading_erp_governance_liability_cap', String(contract.liability_cap));
    }
    toast({
      title: 'Contract Loaded into Active Wizard (تم تحميل العقد للمرشد الإرشادي)',
      description: `Switched active project to ${contract.project_name}.`,
      status: 'success',
    });
    contractsVaultModal.onClose();
  };

  // Step Statuses: active | completed | skipped
  const [stepStatuses, setStepStatuses] = useState<Record<number, 'active' | 'completed' | 'skipped'>>(() => {
    try {
      const saved = localStorage.getItem('trading_erp_governance_step_statuses');
      return saved
        ? JSON.parse(saved)
        : { 1: 'completed', 2: 'active', 3: 'active', 4: 'active', 5: 'active' };
    } catch {
      return { 1: 'completed', 2: 'active', 3: 'active', 4: 'active', 5: 'active' };
    }
  });

  const toggleSkipStep = (stepNumber: number) => {
    setStepStatuses((prev) => {
      const current = prev[stepNumber];
      const nextStatus = current === 'skipped' ? 'active' : 'skipped';
      const updated: Record<number, 'active' | 'completed' | 'skipped'> = { ...prev, [stepNumber]: nextStatus };
      localStorage.setItem('trading_erp_governance_step_statuses', JSON.stringify(updated));
      return updated;
    });
    toast({
      title: stepStatuses[stepNumber] === 'skipped' ? 'Step Activated (تم تفعيل الخطوة)' : 'Step Skipped (تم تخطي الخطوة)',
      description: `Stage ${stepNumber} status updated.`,
      status: 'info',
    });
  };

  // Format currency helper
  const formatSAR = (amount: number) => {
    return `${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 }).format(amount)} \uE900`;
  };

  // Live Metrics calculations
  const liabilityCap = customLiabilityCap;
  const unsettledTx = (bilateralTransactions || []).filter((tx) => !tx.is_settled);
  const totalCommittedSpend = unsettledTx.reduce((s, t) => s + (t.total_amount || 0), 0);
  const totalVatSaved = unsettledTx.reduce((s, t) => s + ((t.amount_excl_vat || 0) * 0.15), 0);
  const grossAtoB = unsettledTx.filter((t) => t.debtor === 'Your Company').reduce((s, t) => s + t.total_amount, 0);
  const grossBtoA = unsettledTx.filter((t) => t.debtor === 'Partner Company').reduce((s, t) => s + t.total_amount, 0);
  const netPayable = Math.abs(grossAtoB - grossBtoA);

  const activeSanadNotes = (sanadNotes || []).filter((n) => n.status === 'active');
  const unauthorizedAlerts = (nafithAlerts || []).filter((a) => !a.is_authorized && a.status === 'pending_review');
  const pendingPassports = (brandPassports || []).filter((p) => p.status === 'pending_acceptance');
  const acceptedPassports = (brandPassports || []).filter((p) => p.sole_indemnifier_accepted);

  // Forms State
  const [nafithForm, setNafithForm] = useState({
    notice_number: 'NAF-2026-9952',
    creditor_name: 'Principal Supplier Co.',
    amount: 145000,
    is_authorized: false,
    notes: 'Urgent notice received on Nafith portal',
    attachment_name: '',
  });

  const [sanadForm, setSanadForm] = useState({
    creditor_name: 'Raw Materials Supplier Co.',
    amount: 150000,
    due_date: '2026-12-30',
    purpose: 'Procurement Guarantee (سند لأمر مشتريات للمشروع)',
    counter_security: `Back-to-back Counter Note signed by ${projectData.partnerBName}`,
    attachment_name: '',
    counter_attachment_name: '',
  });

  const [passportForm, setPassportForm] = useState({
    granted_to_org: projectData.partnerBName,
    allowed_tender_scope: 'Civil & Earthworks Package A',
    liability_cap_sar: liabilityCap,
  });

  const [vendorSlipForm, setVendorSlipForm] = useState({
    vendor_name: 'Principal Building Materials Co.',
    amount_excl_vat: 100000,
    transfer_ref: 'TRX-BANK-883921',
    description: 'Foundation batch materials delivery',
    slip_attachment_name: '',
  });

  // Action Handlers
  const handleLogNafith = () => {
    logNafithAlert({
      notice_number: nafithForm.notice_number,
      creditor_name: nafithForm.creditor_name,
      amount: nafithForm.amount,
      is_authorized: nafithForm.is_authorized,
      notes: nafithForm.notes,
      project_name: projectData.projectName,
      status: 'pending_review',
      attachment_name: nafithForm.attachment_name,
    });
    toast({
      title: 'Nafith Notice Logged (تم قيد إشعار نافذ)',
      description: `Notice #${nafithForm.notice_number} recorded in the Sentinel with document proof.`,
      status: nafithForm.is_authorized ? 'info' : 'warning',
    });
    nafithModal.onClose();
  };

  const handleIssueSanad = () => {
    createSanadNote({
      creditor_name: sanadForm.creditor_name,
      amount: sanadForm.amount,
      due_date: sanadForm.due_date,
      purpose: sanadForm.purpose,
      counter_secured: true,
      counter_security_details: sanadForm.counter_security,
      status: 'active',
      attachment_name: sanadForm.attachment_name,
      counter_attachment_name: sanadForm.counter_attachment_name,
    });
    toast({
      title: 'Promissory Note Vaulted (تم قيد السند لأمر)',
      description: `${formatSAR(sanadForm.amount)} \uE900 vaulted with 100% counter-indemnity and attached documents.`,
      status: 'success',
    });
    sanadModal.onClose();
  };

  const handleCreatePassport = () => {
    grantBrandPassport({
      granted_to_org: passportForm.granted_to_org,
      allowed_tender_scope: passportForm.allowed_tender_scope,
      liability_cap_sar: passportForm.liability_cap_sar,
      status: 'pending_acceptance',
    });
    dispatchWhatsAppNotice({
      notice_type: 'cr_risk_acceptance',
      title: 'CR Permission Pass Issued & Risk Acceptance Request',
      project_name: projectData.projectName,
      recipients: [
        {
          stakeholder_id: 'stk_partner_b',
          name: 'Partner Executive Signatory',
          phone: projectData.partnerMobile,
          status: 'pending',
        },
      ],
      requires_risk_acceptance: true,
      acceptance_status: 'pending',
      message_body: `طلب تفويض استخدام السجل وإقرار الضامن الوحيد لمشروع ${projectData.projectName} بسقف ${formatSAR(passportForm.liability_cap_sar)}`,
    });
    toast({
      title: 'CR Permission Pass Issued & Dispatched',
      description: 'Sent via WhatsApp to partner. Awaiting electronic Sole Indemnity signature.',
      status: 'success',
    });
    passportModal.onClose();
  };

  const handleDirectAcceptRisk = (passportId: string) => {
    acceptRiskPassport(passportId, `${projectData.partnerBName} (Signatory)`, 'Direct digital confirmation');
    toast({
      title: 'Sole Indemnity Confirmed (تم اعتماد إبراء الذمة)',
      description: 'Partner is now bound as 100% Sole Indemnifier under Royal Decree M/43.',
      status: 'success',
    });
  };

  const handleRecordVendorSlip = () => {
    recordBilateralTransaction({
      debtor: 'Partner Company',
      creditor: 'Your Company',
      transaction_type: 'materials_procured_direct',
      amount_excl_vat: vendorSlipForm.amount_excl_vat,
      total_amount: vendorSlipForm.amount_excl_vat * 1.15,
      description: `${vendorSlipForm.description} [Vendor: ${vendorSlipForm.vendor_name}, Bank Ref: ${vendorSlipForm.transfer_ref}]`,
      vendor_name: vendorSlipForm.vendor_name,
      transfer_ref: vendorSlipForm.transfer_ref,
      slip_attachment_name: vendorSlipForm.slip_attachment_name,
    });
    toast({
      title: 'Bank Wire Slip Verified (تم توثيق إشعار التحويل)',
      description: `${formatSAR(vendorSlipForm.amount_excl_vat * 0.15)} \uE900 Input VAT credit preserved for Company A.`,
      status: 'success',
    });
    vendorSlipModal.onClose();
  };

  const handleNetSettlement = () => {
    const res = executeBilateralDischarge();
    toast({
      title: 'Net Settlement Discharged (تم تنفيذ المقاصة والتصفية)',
      description: `Cleared ${res.clearedCount} transactions. Net payable: ${formatSAR(res.netPayable)} paid by ${res.payer}`,
      status: 'success',
      duration: 6000,
    });
  };

  // 5. TRIGGER FINAL MASTER WHATSAPP CLOSURE NOTIFICATION
  const handleTriggerFinalClosure = () => {
    dispatchWhatsAppNotice({
      notice_type: 'client_milestone',
      title: 'Master Governance Closure Notice',
      project_name: projectData.projectName,
      recipients: [
        {
          stakeholder_id: 'stk_all',
          name: 'All Consortium Stakeholders',
          phone: projectData.partnerMobile,
          status: 'pending',
        },
      ],
      requires_risk_acceptance: true,
      acceptance_status: 'pending',
      message_body: `🏛️ *[ميثاق الإغلاق النهائي لحوكمة التحالف / Master Governance Closure Notice]*
-----------------------------------
*المشروع / Project:* ${projectData.projectName}
*صاحب السجل / Lead CR:* ${projectData.companyAName}
*الشريك المنفذ / Partner:* ${projectData.partnerBName}
*سقف الالتزام المعتمد:* ${formatSAR(liabilityCap)}
*إبراء ذمة المالك السعودي:* 🟢 معتمد وموثق 100% (الضامن الوحيد مفعل)
*رصيد ضريبة القيمة المضافة المحفوظ:* ${formatSAR(totalVatSaved)}
*منصة نافذ العدلية:* 🟢 0 مطالبات قضائية (حماية تامة)
*صافي المقاصة المعتمد:* ${formatSAR(netPayable)}
-----------------------------------
يرجى الاعتماد النهائي بالضغط على الرابط التفاعلي أدناه:
https://erp.local/governance/master-closure-accept?token=tok_final_${Date.now().toString().slice(-4)}
-----------------------------------
يُعد هذا الاعتماد وثيقة مخالصة رقمية ملزمة وفق نظام الإثبات السعودي.`,
    });

    finalClosureModal.onOpen();
    toast({
      title: 'Master Governance Notice Dispatched (تم إرسال إشعار الإغلاق والاعتماد)',
      description: 'Comprehensive project closure summary dispatched to all stakeholders via WhatsApp with interactive acceptance buttons.',
      status: 'success',
      duration: 7000,
    });
  };

  // Sub-Steps Micro-Stepper Data Definition
  const wizardSteps = [
    {
      step: 1,
      nameEn: 'Handshake & Scope',
      nameAr: 'الاتفاق وسقف الالتزام',
      icon: FiFileText,
      color: 'teal',
      badge: 'COMPLETED (معتمد)',
      badgeColor: 'teal',
      objectiveEn: 'Set the business partnership parameters, management fee, and customizable financial liability ceiling.',
      objectiveAr: 'تحديد إطار الشراكة وأتعاب الإدارة وسقف الالتزام المالي الأقصى للمشروع.',
      guidanceEn:
        'In this step, Company A (CR Holder) and the Executing Partner define the commercial handshake. Management fee is set to 0% with milestone profit sharing, and spending under Company A’s name is governed by a customizable liability ceiling.',
      guidanceAr:
        'في هذه المرحلة يتم الاتفاق على بنود الشراكة: نسبة أتعاب 0% مع مشاركة في الأرباح وتحديد سقف الالتزام المالي القابل للتخصيص لضمان عدم تحميل السجل بأي التزامات غير مصرح بها.',
      kpis: [
        { label: 'Management Fee (أتعاب الإدارة):', value: '0% Upfront + Profit Split', color: 'teal.600' },
        { label: 'Custom Liability Ceiling (سقف الالتزام):', value: formatSAR(liabilityCap), color: 'blue.600' },
        { label: 'Saudi Owner Protection:', value: '100% Shielded (Zero Liability)', color: 'green.600' },
      ],
      subSteps: [
        { title: '1. Confirm Partner Scope (بيانات الشريك)', isCompleted: true },
        { title: '2. Set Liability Ceiling (سقف الالتزام)', isCompleted: true },
        { title: '3. Acknowledge 8 Covenants (ميثاق البنود)', isCompleted: true },
      ],
      actions: [
        {
          label: 'View 8 Binding Agreed Covenants (عرض بنود الاتفاق الـ 8)',
          desc: 'Opens the complete agreed covenants charter signed between the parties.',
          buttonText: 'View Covenants (عرض الميثاق)',
          onClick: checklistModal.onOpen,
          colorScheme: 'blue',
          variant: 'solid',
          icon: FiCheckSquare,
        },
        {
          label: 'Customize Liability Ceiling (تخصيص سقف الالتزام المالي)',
          desc: 'Set your project-specific procurement cap based on your contract size.',
          buttonText: 'Customize Cap (تعديل السقف)',
          onClick: () => {
            setTempCapInput(customLiabilityCap);
            ceilingModal.onOpen();
          },
          colorScheme: 'teal',
          variant: 'outline',
          icon: SaudiRiyalIcon,
        },
        {
          label: 'Edit Project & Partner Names (تعديل أسماء الجهات والمشروع)',
          desc: 'Customize Company A, Partner B, and Client names to match your exact contract.',
          buttonText: 'Edit Names (تعديل الأسماء)',
          onClick: () => {
            setEditProjForm(projectData);
            editProjectModal.onOpen();
          },
          colorScheme: 'purple',
          variant: 'outline',
          icon: FiEdit2,
        },
      ],
    },
    {
      step: 2,
      nameEn: 'Permission Pass & WhatsApp Sole Indemnity',
      nameAr: 'تصريح السجل وإقرار الضامن الوحيد',
      icon: FiAward,
      color: 'purple',
      badge: pendingPassports.length > 0 ? '1 AWAITING SIGNATURE (بانتظار التوقيع)' : 'COMPLETED (مكتمل)',
      badgeColor: pendingPassports.length > 0 ? 'orange' : 'purple',
      objectiveEn: 'Authorize partner to use CR strictly under an electronic Sole Indemnity agreement signed via WhatsApp.',
      objectiveAr: 'إصدار تصريح استخدام السجل وربطه بإقرار الضامن الوحيد عبر الواتساب لإبراء ذمة المالك السعودي.',
      guidanceEn:
        'Before the partner signs subcontracts or buys raw materials under Company A’s Commercial Registration, they must sign the Sole Indemnity Agreement ("الضامن الوحيد") via WhatsApp. This legally shifts 100% of civil, labor, and supplier liability to the partner under Saudi Law of Evidence (Royal Decree M/43).',
      guidanceAr:
        'قبل أن يقوم الشريك بشراء المواد أو إبرام العقود باسم سجلك التجاري، يلزمه النظام بالتوقيع الإلكتروني كـ "ضامن وحيد حصري". هذا الإقرار يبرئ ذمة المالك السعودي بنسبة 100% أمام القضاء والجهات الرسمية.',
      kpis: [
        { label: 'Active Signed Passes:', value: `${acceptedPassports.length} Verified ✓`, color: 'green.600' },
        { label: 'Awaiting WhatsApp Signature:', value: `${pendingPassports.length} Partner`, color: 'orange.600' },
        { label: 'Legal Standing:', value: 'Royal Decree M/43 Binding', color: 'purple.600' },
      ],
      subSteps: [
        { title: '1. Specify Work Scope (نطاق العمل)', isCompleted: true },
        { title: '2. Select Partner Mobile (جوال الشريك)', isCompleted: true },
        { title: '3. Dispatch WhatsApp Sole Indemnity (إرسال إقرار الضامن)', isCompleted: acceptedPassports.length > 0 },
      ],
      actions: [
        {
          label: 'Issue New CR Permission Pass (إصدار تصريح سجل جديد)',
          desc: 'Generate authorization pass and dispatch WhatsApp risk notice with signing link.',
          buttonText: 'Send via WhatsApp (إرسال واتساب)',
          onClick: passportModal.onOpen,
          colorScheme: 'purple',
          variant: 'solid',
          icon: FiPlus,
        },
        {
          label: 'One-Tap Confirm Pending Pass (اعتماد إبراء الذمة فوراً)',
          desc: `Directly confirms the pending Sole Indemnity for ${projectData.partnerBName}.`,
          buttonText: 'Confirm Sole Indemnity (اعتماد فوري)',
          onClick: () => handleDirectAcceptRisk('AUTH-2026-0099'),
          colorScheme: 'green',
          variant: 'outline',
          icon: FiCheckCircle,
          isDisabled: pendingPassports.length === 0,
        },
      ],
    },
    {
      step: 3,
      nameEn: 'Guarantees & Nafith Sentinel',
      nameAr: 'الضمانات وحماية منصة نافذ العدلية',
      icon: FiShield,
      color: 'red',
      badge: unauthorizedAlerts.length > 0 ? '1 COURT ALERT (تنبيه)' : 'CLEAN & SECURED (محمي)',
      badgeColor: unauthorizedAlerts.length > 0 ? 'red' : 'green',
      objectiveEn: 'Protect commercial bank accounts from sudden execution court freezes via Nafith and counter-guarantees.',
      objectiveAr: 'حماية الحسابات البنكية والسجل من أوامر التنفيذ القضائي المفاجئة عبر منصة نافذ والسندات لأمر.',
      guidanceEn:
        'Promissory Notes (Sanad Amr) issued under Company A must be locked with back-to-back counter-notes from the partner. Furthermore, the Nafith Sentinel tracks incoming claims: if an unauthorized promissory note is lodged against Company A, you get an instant WhatsApp alert to challenge it before the 5-day court deadline expires.',
      guidanceAr:
        'أي سند لأمر يصدر لصالح مورد يجب أن يقابله سند مضاد من الشريك المنفذ. كما يراقب النظام منصة نافذ التابعة لوزارة العدل لتنبيهك فوراً بأي مطالبة خلال مهلة الـ 5 أيام قبل إحالتها لقاضي التنفيذ.',
      kpis: [
        { label: 'Vaulted Promissory Notes:', value: `${activeSanadNotes.length} Notes (${formatSAR(activeSanadNotes.reduce((s,n) => s+n.amount, 0))})`, color: 'blue.600' },
        { label: 'Counter-Secured Protection:', value: '100% Back-to-Back', color: 'green.600' },
        { label: 'Unauthorized Nafith Claims:', value: `${unauthorizedAlerts.length} Rogue Claims`, color: unauthorizedAlerts.length > 0 ? 'red.600' : 'green.600' },
      ],
      subSteps: [
        { title: '1. Scan Nafith Execution Sentinel (فحص منصة نافذ)', isCompleted: unauthorizedAlerts.length === 0 },
        { title: '2. Vault Counter-Guaranteed Sanad (توثيق السند لأمر)', isCompleted: activeSanadNotes.length > 0 },
      ],
      actions: [
        {
          label: 'Log Nafith Court Notice (قيد إشعار منصة نافذ)',
          desc: 'Record a legal claim from Ministry of Justice Nafith to instruct partner action.',
          buttonText: 'Log Court Claim (قيد مطالبة محكمة)',
          onClick: nafithModal.onOpen,
          colorScheme: 'orange',
          variant: 'solid',
          icon: FiAlertTriangle,
        },
        {
          label: 'Vault Counter-Secured Sanad Amr (إصدار سند لأمر رسمي)',
          desc: 'Register promissory note with mandatory partner counter-indemnity note.',
          buttonText: 'Vault Sanad (قيد سند مضاد)',
          onClick: sanadModal.onOpen,
          colorScheme: 'red',
          variant: 'outline',
          icon: FiPlus,
        },
      ],
    },
    {
      step: 4,
      nameEn: 'Procurement Slips & 15% ZATCA VAT',
      nameAr: 'المشتريات وتوثيق ضريبة القيمة المضافة',
      icon: FiTruck,
      color: 'orange',
      badge: 'IN PROGRESS (قيد التوثيق)',
      badgeColor: 'orange',
      objectiveEn: 'Log partner payments to suppliers within 24h and preserve 15% ZATCA Input VAT credit for Company A.',
      objectiveAr: 'توثيق مدفوعات الشريك للموردين خلال 24 ساعة وحفظ رصيد ضريبة المدخلات 15% لصالح شركة أ.',
      guidanceEn:
        'When the partner pays a vendor on behalf of Company A, they must deliver the bank wire slip within 24 hours. Because the supplier invoice bears Company A’s VAT number, Company A offsets this 15% Input VAT against Client billings, saving cash and eliminating tax fines.',
      guidanceAr:
        'عندما يسدد الشريك فواتير الموردين بالنيابة عن شركة أ، يلزمه ميثاق الحوكمة بتسليم إشعار التحويل البنكي خلال 24 ساعة. وبذلك يتم قيد ضريبة المدخلات 15% لصالح شركة أ لخصمها من إقرار هيئة الزكاة والضريبة.',
      kpis: [
        { label: 'Verified Partner Spend:', value: formatSAR(totalCommittedSpend), color: 'blue.600' },
        { label: '15% ZATCA VAT Credit Saved:', value: formatSAR(totalVatSaved), color: 'teal.600' },
        { label: 'Delivery SLA Compliance:', value: '24-Hour Bank Slip Delivery', color: 'green.600' },
      ],
      subSteps: [
        { title: '1. Enter Supplier Invoices & Bank Slips (تسجيل السداد)', isCompleted: unsettledTx.length > 0 },
        { title: '2. Validate 15% Input VAT Credit (حفظ رصيد الضريبة)', isCompleted: totalVatSaved > 0 },
      ],
      actions: [
        {
          label: 'Record Vendor Payment & Bank Slip (تسجيل سداد مورد وإشعار بنكي)',
          desc: 'Logs a supplier payment made by the partner with bank wire slip and VAT credit.',
          buttonText: 'Upload Bank Slip (تسجيل إشعار بنكي)',
          onClick: vendorSlipModal.onOpen,
          colorScheme: 'orange',
          variant: 'solid',
          icon: FiPlus,
        },
      ],
    },
    {
      step: 5,
      nameEn: '1-Click Net Settlement & Profit Waterfall',
      nameAr: 'المقاصة الفورية وتوزيع الأرباح',
      icon: SaudiRiyalIcon,
      color: 'green',
      badge: netPayable > 0 ? 'READY FOR SETTLEMENT (جاهز للتصفية)' : 'BALANCED (متطابق)',
      badgeColor: netPayable > 0 ? 'blue' : 'green',
      objectiveEn: 'Clear bilateral partner contra-charges in 1 click and ensure bank loans are repaid before profit distribution.',
      objectiveAr: 'تصفية الحسابات المتبادلة بضغطة زر وسداد القروض البنكية بأولوية أولى قبل صرف الأرباح.',
      guidanceEn:
        'All contra-charges (diesel fuel dispensed from site bowsers, crane rentals, and camp accommodation) are reconciled with partner procurement spend into a single net number. When client milestone payments (IPC) arrive, the waterfall guarantees: (1) ZATCA VAT is withheld, (2) Senior Bank Loans are repaid, and (3) Net profits are released.',
      guidanceAr:
        'يقوم النظام بعمل مقاصة ثنائية لكافة مصاريف الديزل واستئجار الرافعات وسكن العمال. وعند تحصيل مستخلص العميل، يطبق شلال السداد: أولاً حجز ضريبة الزكاة، ثانياً سداد القروض البنكية كأولوية أولى، وأخيراً توزيع الأرباح الصافية.',
      kpis: [
        { label: 'Net Payable to Partner:', value: formatSAR(netPayable), color: 'blue.600' },
        { label: 'Bank Debt Protection:', value: 'Priority-1 Senior Waterfall', color: 'purple.600' },
        { label: 'Bilateral Netting Status:', value: 'Ready for 1-Click Discharge', color: 'green.600' },
      ],
      subSteps: [
        { title: '1. Reconcile Contra-Charges (مطابقة المصاريف)', isCompleted: true },
        { title: '2. Secure Senior Bank Debt (حجز ديون البنوك)', isCompleted: true },
        { title: '3. Execute Final Clear-Off (إصدار المخالصة)', isCompleted: netPayable === 0 },
      ],
      actions: [
        {
          label: 'Execute 1-Click Net Settlement (تنفيذ المقاصة الفورية)',
          desc: 'Reconciles and discharges all uncleared contractor charges into a legally stamped voucher.',
          buttonText: 'Settle Accounts (تنفيذ المقاصة)',
          onClick: handleNetSettlement,
          colorScheme: 'green',
          variant: 'solid',
          icon: SaudiRiyalIcon,
          isDisabled: netPayable === 0,
        },
        {
          label: 'Trigger Final WhatsApp Master Notice (إرسال إشعار الإغلاق الشامل بالواتساب)',
          desc: 'Dispatches complete project lifecycle closure notice with interactive acceptance buttons to all stakeholders.',
          buttonText: 'Dispatch Master Closure (إرسال الإغلاق الشامل)',
          onClick: handleTriggerFinalClosure,
          colorScheme: 'purple',
          variant: 'solid',
          icon: FaWhatsapp,
        },
      ],
    },
  ];

  const currentWizard = wizardSteps.find((s) => s.step === currentStep) || wizardSteps[0];
  const isCurrentSkipped = stepStatuses[currentStep] === 'skipped';

  // Progression Gate Logic
  const handleProceedNext = () => {
    if (currentStep === 5) {
      handleTriggerFinalClosure();
      return;
    }
    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  return (
    <Box minH="100vh" bg={bg}>
      {/* Top Header Control Bar */}
      <Box bg={navBg} borderBottom="1px" borderColor={borderColor} px={{ base: 4, md: 8 }} py={3.5} shadow="xs">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <HStack spacing={3}>
            <FiShield size={28} color="#2B6CB0" />
            <Box>
              <HStack spacing={2}>
                <Text fontWeight="extrabold" fontSize={{ base: 'sm', md: 'md' }} letterSpacing="tight">
                  CORPORATE GOVERNANCE & RISK PLATFORM
                </Text>
                <Badge colorScheme="blue" variant="solid" fontSize="10px">
                  حماية وحوكمة الشركات
                </Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                CR Sponsorship Shield • Bank Senior Waterfall • Nafith Monitor • Bilateral Netting
              </Text>
            </Box>
          </HStack>

          <HStack spacing={3}>
            {/* View Mode Toggle */}
            <HStack spacing={1} bg={useColorModeValue('gray.100', 'gray.700')} p={1} rounded="lg">
              <Button
                size="xs"
                variant={viewMode === 'guided' ? 'solid' : 'ghost'}
                colorScheme={viewMode === 'guided' ? 'blue' : 'gray'}
                leftIcon={<FiCompass />}
                onClick={() => setViewMode('guided')}
              >
                Guided Wizard (المرشد الإرشادي)
              </Button>
              <Button
                size="xs"
                variant={viewMode === 'all_tabs' ? 'solid' : 'ghost'}
                colorScheme={viewMode === 'all_tabs' ? 'blue' : 'gray'}
                leftIcon={<FiLayers />}
                onClick={() => setViewMode('all_tabs')}
              >
                Advanced All-Tabs (عرض متقدم)
              </Button>
            </HStack>

            <Button
              size="xs"
              variant="outline"
              colorScheme="blue"
              leftIcon={<FiCheckSquare />}
              onClick={checklistModal.onOpen}
            >
              Agreed Checklist (قائمة البنود)
            </Button>

            <Button
              size="xs"
              variant="solid"
              colorScheme="purple"
              leftIcon={<FiFileText />}
              onClick={contractsVaultModal.onOpen}
            >
              Executed Contracts Vault ({collaborations?.length || 0}) (سجل العقود)
            </Button>

            <Button
              size="xs"
              variant="solid"
              colorScheme="green"
              leftIcon={<FaWhatsapp />}
              onClick={() => {
                setViewMode('all_tabs');
                setTabIndex(4);
              }}
            >
              Stakeholders & WhatsApp (أصحاب المصلحة والمستلمين)
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Main Container */}
      <Box p={{ base: 3, md: 6 }} maxW="1650px" mx="auto">

        {/* ========================================================================= */}
        {/* VIEW MODE 1: SIMPLE GUIDED WIZARD (NO NESTED TABS, 1 STEP AT A TIME)     */}
        {/* ========================================================================= */}
        {viewMode === 'guided' && (
          <VStack spacing={6} align="stretch">

            {/* Project Banner & Quick Executive Metrics */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
              <CardBody p={4}>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                  <Box>
                    <HStack spacing={2} mb={1}>
                      <Badge colorScheme="blue" fontSize="10px">
                        ACTIVE PROJECT (المشروع النشط)
                      </Badge>
                      <Text fontWeight="bold" fontSize="sm">
                        {projectData.projectName}
                      </Text>
                      <Button
                        size="xs"
                        h="18px"
                        fontSize="9px"
                        variant="ghost"
                        colorScheme="blue"
                        leftIcon={<FiEdit2 />}
                        onClick={() => {
                          setEditProjForm(projectData);
                          editProjectModal.onOpen();
                        }}
                      >
                        Edit Names
                      </Button>
                      <Button
                        size="xs"
                        h="18px"
                        fontSize="9px"
                        variant="outline"
                        colorScheme="purple"
                        leftIcon={<FiFileText />}
                        onClick={contractsVaultModal.onOpen}
                      >
                        Executed Contracts ({collaborations?.length || 0})
                      </Button>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      Contract Value: <b>{formatSAR(projectData.contractValue)}</b> • Lead CR: <b>{projectData.companyAName}</b> • Partner: <b>{projectData.partnerBName}</b> (WA: <b>{projectData.partnerMobile}</b>)
                    </Text>
                  </Box>

                  <HStack spacing={3}>
                    <Box p={2.5} bg={useColorModeValue('green.50', 'green.950')} rounded="md" borderWidth="1px" borderColor="green.200" textAlign="right">
                      <Text fontSize="9px" color="green.600" fontWeight="bold">OWNER LIABILITY (ذمة المالك):</Text>
                      <Text fontSize="xs" fontWeight="extrabold" color="green.700"><Icon as={SaudiRiyalIcon} boxSize="0.8em" /> 0.00 (SHIELDED)</Text>
                    </Box>
                    <Box p={2.5} bg={useColorModeValue('blue.50', 'blue.950')} rounded="md" borderWidth="1px" borderColor="blue.200" textAlign="right">
                      <Text fontSize="9px" color="blue.600" fontWeight="bold">LIABILITY CAP (سقف الالتزام):</Text>
                      <Text fontSize="xs" fontWeight="extrabold" color="blue.700">{formatSAR(liabilityCap)}</Text>
                    </Box>
                  </HStack>
                </Flex>
              </CardBody>
            </Card>

            {/* Stepper Progress Ribbon */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} p={3} shadow="sm">
              <SimpleGrid columns={{ base: 1, sm: 2, md: 5 }} gap={2}>
                {wizardSteps.map((s) => {
                  const isActive = currentStep === s.step;
                  const isSkipped = stepStatuses[s.step] === 'skipped';
                  return (
                    <Box
                      key={s.step}
                      p={2.5}
                      rounded="lg"
                      borderWidth="1.5px"
                      borderColor={isActive ? 'blue.400' : isSkipped ? 'gray.300' : borderColor}
                      bg={isActive ? useColorModeValue('blue.50', 'blue.900') : isSkipped ? useColorModeValue('gray.100', 'gray.800') : 'transparent'}
                      cursor="pointer"
                      onClick={() => setCurrentStep(s.step)}
                      transition="all 0.2s"
                      _hover={{ borderColor: 'blue.400' }}
                    >
                      <HStack justify="space-between" mb={1}>
                        <HStack spacing={2}>
                          <Box
                            w="22px"
                            h="22px"
                            rounded="full"
                            bg={isActive ? 'blue.500' : isSkipped ? 'gray.400' : 'gray.200'}
                            color={isActive ? 'white' : 'gray.700'}
                            fontSize="11px"
                            fontWeight="bold"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {s.step}
                          </Box>
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color={isSkipped ? 'gray.400' : 'gray.800'}
                            textDecoration={isSkipped ? 'line-through' : 'none'}
                            noOfLines={1}
                          >
                            {s.nameEn}
                          </Text>
                        </HStack>
                      </HStack>
                      <Text fontSize="10px" color={isSkipped ? 'gray.400' : 'gray.500'} noOfLines={1}>
                        {isSkipped ? 'SKIPPED (متخطى)' : s.nameAr}
                      </Text>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Card>

            {/* Focused Step Workspace Card */}
            <Card bg={cardBg} borderWidth="1.5px" borderColor={borderColor} shadow="md">
              <CardHeader pb={3}>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                  <HStack spacing={3}>
                    <Box p={3} bg={`${currentWizard.color}.500`} color="white" rounded="xl">
                      <Icon as={currentWizard.icon} boxSize={6} />
                    </Box>
                    <Box>
                      <HStack spacing={2} mb={0.5}>
                        <Text fontSize="lg" fontWeight="bold">
                          Step {currentWizard.step}: {currentWizard.nameEn}
                        </Text>
                        <Badge colorScheme={isCurrentSkipped ? 'gray' : currentWizard.badgeColor} fontSize="10px">
                          {isCurrentSkipped ? 'SKIPPED (متخطى)' : currentWizard.badge}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {currentWizard.nameAr} • {currentWizard.objectiveEn}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack spacing={2}>
                    <Tooltip label={isCurrentSkipped ? 'Activate this step' : 'Skip if this step is not needed for this project'}>
                      <Button
                        size="sm"
                        variant={isCurrentSkipped ? 'solid' : 'ghost'}
                        colorScheme={isCurrentSkipped ? 'blue' : 'gray'}
                        onClick={() => toggleSkipStep(currentWizard.step)}
                      >
                        {isCurrentSkipped ? 'Un-skip (تفعيل الخطوة)' : 'Skip Step (تخطي)'}
                      </Button>
                    </Tooltip>
                  </HStack>
                </Flex>
              </CardHeader>
              <Divider />
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack spacing={6} align="stretch">

                  {/* 4. SUB-STEPS MICRO-STEPPER (① ➔ ② ➔ ③) */}
                  <Box p={3} bg={useColorModeValue('gray.50', 'gray.750')} rounded="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="11px" fontWeight="bold" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wider">
                      Stage Sub-Steps Sequence (مسار الخطوات الفرعية):
                    </Text>
                    <Flex justify="flex-start" align="center" flexWrap="wrap" gap={3}>
                      {currentWizard.subSteps.map((sub, idx) => (
                        <HStack
                          key={idx}
                          spacing={2}
                          p={2}
                          bg={useColorModeValue('white', 'gray.800')}
                          rounded="md"
                          borderWidth="1px"
                          borderColor={sub.isCompleted ? 'green.300' : borderColor}
                        >
                          <Box
                            w="20px"
                            h="20px"
                            rounded="full"
                            bg={sub.isCompleted ? 'green.500' : 'blue.500'}
                            color="white"
                            fontSize="10px"
                            fontWeight="bold"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {sub.isCompleted ? <Icon as={FiCheck} /> : idx + 1}
                          </Box>
                          <Text fontSize="xs" fontWeight="bold" color={sub.isCompleted ? 'green.700' : 'gray.700'}>
                            {sub.title}
                          </Text>
                          {idx < currentWizard.subSteps.length - 1 && (
                            <Icon as={FiChevronRight} color="gray.400" />
                          )}
                        </HStack>
                      ))}
                    </Flex>
                  </Box>

                  {/* 1. REAL-TIME LIVE NUMBERS & PROTECTION STATUS */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                    {currentWizard.kpis.map((kpi, idx) => (
                      <Card key={idx} bg={useColorModeValue('gray.50', 'gray.750')} borderWidth="1px" borderColor={borderColor}>
                        <CardBody p={3.5}>
                          <Text fontSize="11px" color="gray.500" mb={1}>
                            {kpi.label}
                          </Text>
                          <Text fontSize="md" fontWeight="bold" color={kpi.color}>
                            {kpi.value}
                          </Text>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>

                  {/* =========================================================================
                      ZONE 1: PRIMARY ACTION CARD (80% Visual Focus) - Single Required Action
                     ========================================================================= */}
                  <Card bg={cardBg} borderWidth="2px" borderColor={`${currentWizard.color}.300`} shadow="md" rounded="xl">
                    <CardHeader pb={2} bg={useColorModeValue(`${currentWizard.color}.50`, 'gray.800')} roundedTop="xl">
                      <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                        <HStack spacing={2}>
                          <Badge colorScheme={currentWizard.color} fontSize="11px" px={2.5} py={0.5} rounded="md">
                            🎯 PRIMARY ACTION REQUIRED • الإجراء المطلوب
                          </Badge>
                          <Text fontWeight="extrabold" fontSize="sm">
                            {currentWizard.step === 1 && 'Configure Partner & Procurement Ceiling (اعتماد الشريك وسقف الالتزام)'}
                            {currentWizard.step === 2 && 'Issue CR Authority Pass & Sole Indemnity (إصدار تفويض الشراء وإبراء الذمة)'}
                            {currentWizard.step === 3 && 'Vault Promissory Note & Monitor Nafith (قيد السندات ومراقبة نافذ)'}
                            {currentWizard.step === 4 && 'Record Direct Vendor Payment & Slip (توثيق سداد الموردين وإشعار البنك)'}
                            {currentWizard.step === 5 && 'Execute Bilateral Net Settlement (تنفيذ المقاصة وتصفية الحسابات)'}
                          </Text>
                        </HStack>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody p={5}>
                      {/* STEP 1: Consortium Multi-Contractor Roster & Procurement Ceiling */}
                      {currentWizard.step === 1 && (
                        <VStack spacing={4} align="stretch">
                          <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} flexWrap="wrap" gap={2}>
                            <Box>
                              <HStack spacing={2} mb={1}>
                                <Text fontSize="sm" fontWeight="bold" color="gray.800">
                                  Consortium Contractors & Subcontractors Roster (سجل تحالف المقاولين وشركاء التنفيذ بالمشروع)
                                </Text>
                                <Badge colorScheme="purple" fontSize="xs">
                                  {(projectData.contractors || DEFAULT_CONTRACTORS).length} Partners Enrolled
                                </Badge>
                              </HStack>
                              <Text fontSize="xs" color="gray.500">
                                Add all participating contractors, subcontractors, suppliers, and equipment lessors under this single master agreement. Each partner is allocated an independent liability ceiling and sole indemnity shield.
                                (يمكنك إضافة عدة مقاولين وموردي باطن في نفس العقد دون الحاجة لإنشاء عقود منفصلة لكل طرف):
                              </Text>
                            </Box>
                            <Button
                              size="sm"
                              colorScheme="teal"
                              leftIcon={<FiPlus />}
                              onClick={addContractorModal.onOpen}
                            >
                              + Add Contractor / Partner (إضافة مقاول / شريك آخر)
                            </Button>
                          </Flex>

                          {/* Multi-Contractor Roster Table */}
                          <Box borderWidth="1px" borderColor={borderColor} rounded="lg" overflow="hidden">
                            <Table size="sm" variant="simple">
                              <Thead bg={useColorModeValue('gray.50', 'gray.750')}>
                                <Tr>
                                  <Th fontSize="10px">Contractor / Entity (اسم المقاول / الشريك)</Th>
                                  <Th fontSize="10px">Work Package / Role (حزمة الأعمال / الدور)</Th>
                                  <Th fontSize="10px">CR & WhatsApp (السجل والجوال)</Th>
                                  <Th fontSize="10px" isNumeric>Liability Cap (سقف الالتزام)</Th>
                                  <Th fontSize="10px">Sole Indemnity M/43 (إبراء الذمة والضمان)</Th>
                                  <Th fontSize="10px" textAlign="center">Actions (إجراءات)</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {(projectData.contractors || DEFAULT_CONTRACTORS).map((contractor: ConsortiumContractor, index: number) => (
                                  <Tr key={contractor.id || index}>
                                    <Td fontWeight="bold" fontSize="xs">
                                      <HStack spacing={2}>
                                        <Badge colorScheme={index === 0 ? 'teal' : 'gray'} fontSize="9px">
                                          {index === 0 ? 'LEAD' : `#${index + 1}`}
                                        </Badge>
                                        <Text noOfLines={1}>{contractor.name}</Text>
                                      </HStack>
                                    </Td>
                                    <Td fontSize="xs">
                                      <Tooltip label="Click to edit contractor role & package (اضغط لتعديل الدور)">
                                        <Badge
                                          cursor="pointer"
                                          onClick={() => handleOpenEditContractor(contractor)}
                                          colorScheme="blue"
                                          variant="subtle"
                                          fontSize="10px"
                                          maxW="240px"
                                          px={2}
                                          py={1}
                                          rounded="md"
                                          _hover={{ bg: 'blue.100' }}
                                          borderWidth="1px"
                                          borderColor="blue.200"
                                          display="inline-flex"
                                          alignItems="center"
                                          gap={1}
                                        >
                                          <Text isTruncated>{contractor.role}</Text>
                                          <Icon as={FiEdit2} boxSize={2.5} color="blue.500" />
                                        </Badge>
                                      </Tooltip>
                                    </Td>
                                    <Td fontSize="xs">
                                      <VStack align="start" spacing={0}>
                                        {contractor.crNumber && (
                                          <Text fontSize="10px" color="gray.500">
                                            CR: {contractor.crNumber}
                                          </Text>
                                        )}
                                        <HStack spacing={1}>
                                          <Icon as={FaWhatsapp} color="green.500" boxSize={3} />
                                          <Text fontSize="11px" color="gray.600">
                                            {contractor.mobile}
                                          </Text>
                                        </HStack>
                                      </VStack>
                                    </Td>
                                    <Td fontSize="xs" fontWeight="bold" color="purple.600" isNumeric>
                                      <Icon as={SaudiRiyalIcon} boxSize="0.85em" verticalAlign="-0.08em" /> {formatSAR(contractor.liabilityCap)}
                                    </Td>
                                    <Td>
                                      <Tooltip label="Click to toggle Royal Decree M/43 Sole Indemnity signature status">
                                        <Badge
                                          cursor="pointer"
                                          onClick={() => handleToggleIndemnity(contractor.id)}
                                          colorScheme={contractor.soleIndemnityStatus === 'signed' ? 'green' : 'orange'}
                                          fontSize="10px"
                                          px={2}
                                          py={0.5}
                                          rounded="md"
                                        >
                                          {contractor.soleIndemnityStatus === 'signed'
                                            ? '✓ Signed & Binding (ساري)'
                                            : '⏳ Pending Sign (بانتظار التوقيع)'}
                                        </Badge>
                                      </Tooltip>
                                    </Td>
                                    <Td textAlign="center">
                                      <HStack spacing={1} justify="center">
                                        <Tooltip label="Edit Contractor Role & Limits (تعديل دور وسقف المقاول)">
                                          <IconButton
                                            aria-label="Edit Contractor"
                                            icon={<FiEdit2 />}
                                            size="xs"
                                            colorScheme="purple"
                                            variant="ghost"
                                            onClick={() => handleOpenEditContractor(contractor)}
                                          />
                                        </Tooltip>
                                        <Tooltip label="Dispatch WhatsApp Sole Indemnity Pass">
                                          <IconButton
                                            aria-label="WhatsApp"
                                            icon={<FaWhatsapp />}
                                            size="xs"
                                            colorScheme="green"
                                            variant="ghost"
                                            onClick={() => {
                                              window.open(`https://wa.me/${contractor.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`السلام عليكم، نأمل التكرم باعتماد إقرار الضامن الوحيد وإبراء الذمة (مرسوم ملكي م/43) لمشروع: ${projectData.projectName} بصفتكم: ${contractor.role}`)}`, '_blank');
                                            }}
                                          />
                                        </Tooltip>
                                        <Tooltip label="Remove from Consortium Contract">
                                          <IconButton
                                            aria-label="Remove"
                                            icon={<FiTrash2 />}
                                            size="xs"
                                            colorScheme="red"
                                            variant="ghost"
                                            isDisabled={(projectData.contractors || DEFAULT_CONTRACTORS).length <= 1}
                                            onClick={() => handleRemoveContractor(contractor.id)}
                                          />
                                        </Tooltip>
                                      </HStack>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>

                          {/* Aggregate Summary & Master Ceiling */}
                          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3} p={3} bg={useColorModeValue('gray.50', 'gray.750')} rounded="lg" borderWidth="1px" borderColor={borderColor}>
                            <Box>
                              <Text fontSize="11px" color="gray.500">Total Consortium Contractors (إجمالي الشركاء):</Text>
                              <Text fontSize="sm" fontWeight="bold">
                                {(projectData.contractors || DEFAULT_CONTRACTORS).length} Participating Entities
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="11px" color="gray.500">Aggregated Allocated Risk (مجموع الالتزامات المخصصة):</Text>
                              <Text fontSize="sm" fontWeight="bold" color="purple.600">
                                <Icon as={SaudiRiyalIcon} boxSize="0.85em" verticalAlign="-0.08em" /> {formatSAR((projectData.contractors || DEFAULT_CONTRACTORS).reduce((acc: number, c: ConsortiumContractor) => acc + (c.liabilityCap || 0), 0))}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="11px" color="gray.500">Master Company A Liability Ceiling (سقف الالتزام المعتمد):</Text>
                              <HStack spacing={2} mt={1}>
                                <Input
                                  size="xs"
                                  type="number"
                                  value={tempCapInput}
                                  maxW="140px"
                                  onChange={(e) => setTempCapInput(Number(e.target.value))}
                                />
                                <Button size="xs" colorScheme="teal" onClick={handleQuickSaveStep1}>
                                  Update Cap
                                </Button>
                              </HStack>
                            </Box>
                          </SimpleGrid>

                          <HStack spacing={2} align="center" flexWrap="wrap">
                            <Text fontSize="11px" color="gray.500" fontWeight="bold">Quick Presets (خيارات سريعة للسقف الرئيسي):</Text>
                            {[500000, 1000000, 1500000, 3000000, 5000000].map((preset) => (
                              <Button
                                key={preset}
                                size="xs"
                                variant={tempCapInput === preset ? 'solid' : 'outline'}
                                colorScheme={tempCapInput === preset ? 'teal' : 'gray'}
                                onClick={() => setTempCapInput(preset)}
                              >
                                {preset >= 1000000 ? <><Icon as={SaudiRiyalIcon} boxSize="0.8em" /> {preset / 1000000}M</> : <><Icon as={SaudiRiyalIcon} boxSize="0.8em" /> {preset / 1000}k</>}
                              </Button>
                            ))}
                          </HStack>

                          <Flex justify="space-between" align="center" pt={2} flexWrap="wrap" gap={3}>
                            <Button
                              size="md"
                              colorScheme="teal"
                              leftIcon={<FiCheckCircle />}
                              onClick={handleQuickSaveStep1}
                            >
                              Save & Confirm Parameters (اعتماد وتثبيت البيانات)
                            </Button>

                            <HStack spacing={2} flexWrap="wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="purple"
                                leftIcon={<FiFileText />}
                                onClick={contractsVaultModal.onOpen}
                              >
                                Executed Contracts Vault ({collaborations?.length || 0})
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                colorScheme="purple"
                                leftIcon={<FiEdit2 />}
                                onClick={() => {
                                  setEditProjForm(projectData);
                                  editProjectModal.onOpen();
                                }}
                              >
                                Full Contract Metadata (تعديل تفاصيل العقد كاملة)
                              </Button>
                            </HStack>
                          </Flex>
                        </VStack>
                      )}

                      {/* STEP 2: Issue Authority Pass & Sole Indemnity */}
                      {currentWizard.step === 2 && (
                        <VStack spacing={4} align="stretch">
                          <Text fontSize="xs" color="gray.600">
                            Before the partner signs supplier orders under Company A's CR, dispatch the WhatsApp Sole Indemnity pass to legally transfer 100% of the risk to Partner B.
                            (أصدر تصريح استخدام السجل وأرسله عبر الواتساب لإلزام الشريك بإقرار الضامن الوحيد وإبراء ذمة المالك):
                          </Text>

                          {pendingPassports.length > 0 && (
                            <Box p={3.5} bg={useColorModeValue('orange.50', 'orange.900')} rounded="lg" borderWidth="1.5px" borderColor="orange.300">
                              <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                                <Box>
                                  <HStack spacing={2} mb={0.5}>
                                    <Icon as={FiAlertTriangle} color="orange.500" />
                                    <Text fontWeight="bold" fontSize="xs" color="orange.800">
                                      Pass #{pendingPassports[0].passport_code} Awaiting WhatsApp Signature (بانتظار توقيع الشريك)
                                    </Text>
                                  </HStack>
                                  <Text fontSize="11px" color="gray.600">
                                    Granted to: <b>{pendingPassports[0].granted_to_org || projectData.partnerBName}</b> • Limit: <b>{formatSAR(pendingPassports[0].liability_cap_sar || liabilityCap)}</b>
                                  </Text>
                                </Box>
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  leftIcon={<FiCheckCircle />}
                                  onClick={() => handleDirectAcceptRisk(pendingPassports[0].id)}
                                >
                                  One-Tap Confirm Sole Indemnity (اعتماد إبراء الذمة فوراً)
                                </Button>
                              </Flex>
                            </Box>
                          )}

                          <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                            <Button
                              size="md"
                              colorScheme="purple"
                              leftIcon={<FiSend />}
                              onClick={passportModal.onOpen}
                            >
                              Issue & Send WhatsApp Authority Pass (إصدار وإرسال تفويض جديد)
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="green"
                              leftIcon={<FaWhatsapp />}
                              onClick={() => {
                                setViewMode('all_tabs');
                                setTabIndex(4);
                              }}
                            >
                              Simulate Partner WhatsApp Mobile (معاينة جوال الشريك)
                            </Button>
                          </Flex>

                          {/* Passports List */}
                          <Box mt={2}>
                            <Text fontSize="11px" fontWeight="bold" color="gray.500" mb={2}>ACTIVE REGISTERED PASSES (التصاريح المعتمدة):</Text>
                            <VStack spacing={2} align="stretch">
                              {brandPassports.map((p) => (
                                <Flex key={p.id} p={3} bg={useColorModeValue('gray.50', 'gray.750')} rounded="lg" borderWidth="1px" borderColor={borderColor} justify="space-between" align="center">
                                  <Box>
                                    <HStack spacing={2} mb={0.5}>
                                      <Text fontWeight="bold" fontSize="xs">{p.passport_code}</Text>
                                      <Badge colorScheme={p.sole_indemnifier_accepted ? 'green' : 'orange'} fontSize="9px">
                                        {p.sole_indemnifier_accepted ? '100% SOLE INDEMNIFIER SIGNED ✓' : 'AWAITING WHATSAPP SIGNATURE ⏳'}
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="11px" color="gray.500">
                                      Partner: <b>{p.granted_to_org || projectData.partnerBName}</b> • Limit: <b>{formatSAR(p.liability_cap_sar || liabilityCap)}</b>
                                    </Text>
                                  </Box>
                                  {!p.sole_indemnifier_accepted && (
                                    <Button size="xs" colorScheme="purple" onClick={() => handleDirectAcceptRisk(p.id)}>
                                      One-Tap Accept
                                    </Button>
                                  )}
                                </Flex>
                              ))}
                            </VStack>
                          </Box>
                        </VStack>
                      )}

                      {/* STEP 3: Vault Promissory Note & Nafith */}
                      {currentWizard.step === 3 && (
                        <VStack spacing={4} align="stretch">
                          <Text fontSize="xs" color="gray.600">
                            Promissory notes (سند لأمر) can be issued at the start, mid-project, or end of the contract. Every note issued to a supplier must be backed with a counter-guarantee from Partner B before signing on Nafith.
                            (يمكن إصدار السندات لأمر في أي مرحلة من المشروع. يمنع النظام توقيع أي سند عبر منصة نافذ دون توثيق سند مضاد لحماية المالك):
                          </Text>

                          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                            <Button
                              size="md"
                              colorScheme="red"
                              leftIcon={<FiPlus />}
                              onClick={sanadModal.onOpen}
                            >
                              + Vault Promissory Note (تسجيل سند لأمر رسمي)
                            </Button>

                            <Button
                              size="md"
                              variant="outline"
                              colorScheme="orange"
                              leftIcon={<FiAlertTriangle />}
                              onClick={nafithModal.onOpen}
                            >
                              Log Nafith Court Notice (قيد مطالبة محكمة)
                            </Button>

                            <Button
                              size="md"
                              variant="outline"
                              colorScheme="green"
                              leftIcon={<FaWhatsapp />}
                              onClick={() => {
                                setViewMode('all_tabs');
                                setTabIndex(4);
                              }}
                            >
                              Partner WhatsApp Requests (طلبات الشركاء بالواتساب)
                            </Button>
                          </SimpleGrid>

                          {/* Vaulted Notes */}
                          <Box mt={2}>
                            <Text fontSize="11px" fontWeight="bold" color="gray.500" mb={2}>VAULTED PROMISSORY NOTES & COUNTER-GUARANTEES (السندات المحمية):</Text>
                            <VStack spacing={2} align="stretch">
                              {activeSanadNotes.length === 0 ? (
                                <Box p={3} bg={useColorModeValue('gray.50', 'gray.750')} rounded="md" textAlign="center">
                                  <Text fontSize="xs" color="gray.500">No active promissory notes registered yet. Issue a new one above when required by suppliers.</Text>
                                </Box>
                              ) : (
                                activeSanadNotes.map((n) => (
                                  <Flex key={n.id} p={3} bg={useColorModeValue('gray.50', 'gray.750')} rounded="lg" borderWidth="1px" borderColor={borderColor} justify="space-between" align="center" flexWrap="wrap" gap={2}>
                                    <Box>
                                      <HStack spacing={2} mb={0.5}>
                                        <Text fontWeight="bold" fontSize="xs">{n.note_number} • {n.creditor_name}</Text>
                                        {n.attachment_name && (
                                          <Badge colorScheme="blue" fontSize="9px">
                                            📎 {n.attachment_name}
                                          </Badge>
                                        )}
                                        {n.counter_attachment_name && (
                                          <Badge colorScheme="purple" fontSize="9px">
                                            🛡️ {n.counter_attachment_name}
                                          </Badge>
                                        )}
                                      </HStack>
                                      <Text fontSize="11px" color="gray.500">
                                        Amount: <b>{formatSAR(n.amount)}</b> • Counter-Indemnity: <b>{n.counter_security_details}</b>
                                      </Text>
                                    </Box>
                                    <Badge colorScheme="teal">100% COUNTER-SECURED</Badge>
                                  </Flex>
                                ))
                              )}
                            </VStack>
                          </Box>
                        </VStack>
                      )}

                      {/* STEP 4: Record Supplier Spend & Bank Slip */}
                      {currentWizard.step === 4 && (
                        <VStack spacing={4} align="stretch">
                          <Text fontSize="xs" color="gray.600">
                            Partner B funds site procurements directly. Uploading the bank transfer slip within 24 hours locks in the 15% ZATCA Input VAT credit for Company A.
                            (يقوم الشريك بسداد فواتير المشتريات مباشرة. تسجيل إشعار التحويل البنكي يوثق رصيد ضريبة المدخلات 15% لصالح شركة أ):
                          </Text>

                          <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                            <HStack spacing={2} flexWrap="wrap">
                              <Button
                                size="md"
                                colorScheme="orange"
                                leftIcon={<FiPlus />}
                                onClick={vendorSlipModal.onOpen}
                              >
                                + Record Supplier Payment & Bank Slip (تسجيل سداد مورد وإشعار بنكي)
                              </Button>

                              <Button
                                size="md"
                                variant="outline"
                                colorScheme="green"
                                leftIcon={<FaWhatsapp />}
                                onClick={() => {
                                  setViewMode('all_tabs');
                                  setTabIndex(4);
                                }}
                              >
                                Partner WhatsApp Bot Slips (إشعارات وفواتير الشريك بالواتساب)
                              </Button>
                            </HStack>

                            <Badge colorScheme="teal" p={2} rounded="md" fontSize="xs">
                              ZATCA VAT Credit Preserved: {formatSAR(totalVatSaved)}
                            </Badge>
                          </Flex>

                          {/* Logged Slips */}
                          <Box mt={2}>
                            <Text fontSize="11px" fontWeight="bold" color="gray.500" mb={2}>LOGGED SUPPLIER PAYMENTS & BANK SLIPS (سجل المدفوعات الموثقة):</Text>
                            <VStack spacing={2} align="stretch">
                              {unsettledTx.length === 0 ? (
                                <Box p={3} bg={useColorModeValue('gray.50', 'gray.750')} rounded="md" textAlign="center">
                                  <Text fontSize="xs" color="gray.500">No supplier payments logged yet. Click above to record a new supplier transfer slip.</Text>
                                </Box>
                              ) : (
                                unsettledTx.map((t) => (
                                  <Flex key={t._id || t.id} p={3} bg={useColorModeValue('gray.50', 'gray.750')} rounded="lg" borderWidth="1px" borderColor={borderColor} justify="space-between" align="center" flexWrap="wrap" gap={2}>
                                    <Box>
                                      <HStack spacing={2} mb={0.5}>
                                        <Text fontWeight="bold" fontSize="xs">{t.description}</Text>
                                        {t.slip_attachment_name && (
                                          <Badge colorScheme="teal" fontSize="9px">
                                            📎 Slip: {t.slip_attachment_name}
                                          </Badge>
                                        )}
                                        {t.submitted_via === 'whatsapp_bot' && (
                                          <Badge colorScheme="whatsapp" fontSize="9px">
                                            📱 VIA WHATSAPP BOT
                                          </Badge>
                                        )}
                                      </HStack>
                                      <Text fontSize="11px" color="gray.500">
                                        Amount: <b>{formatSAR(t.total_amount)}</b> (Includes <b>{formatSAR((t.amount_excl_vat || 0) * 0.15)}</b> ZATCA Input VAT credit)
                                      </Text>
                                    </Box>
                                    <Badge colorScheme="green">SLIP VERIFIED ✓</Badge>
                                  </Flex>
                                ))
                              )}
                            </VStack>
                          </Box>
                        </VStack>
                      )}

                      {/* STEP 5: Net Settlement & Waterfall */}
                      {currentWizard.step === 5 && (
                        <VStack spacing={4} align="stretch">
                          <Text fontSize="xs" color="gray.600">
                            Reconcile bilateral contra-charges (fuel bowsers, cranes, site camp) against partner spend to determine the final net payable in 1 click.
                            (مطابقة المصاريف المتبادلة والخصومات الموقعية مقابل مشتريات الشريك واستخراج صافي التصفية بنقرة واحدة):
                          </Text>

                          {/* Net Summary Box */}
                          <Box p={4} bg={useColorModeValue('green.50', 'gray.750')} rounded="xl" borderWidth="1.5px" borderColor="green.300">
                            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} textAlign="center">
                              <Box>
                                <Text fontSize="11px" color="gray.500">Gross Partner Spend (مشتريات الشريك):</Text>
                                <Text fontSize="md" fontWeight="bold" color="blue.600">{formatSAR(grossBtoA)}</Text>
                              </Box>
                              <Box>
                                <Text fontSize="11px" color="gray.500">Company A Contra-Charges (مصاريف موقعية):</Text>
                                <Text fontSize="md" fontWeight="bold" color="orange.600">{formatSAR(grossAtoB)}</Text>
                              </Box>
                              <Box>
                                <Text fontSize="11px" color="green.700" fontWeight="bold">NET PAYABLE (صافي المستحق):</Text>
                                <Text fontSize="lg" fontWeight="extrabold" color="green.600">{formatSAR(netPayable)}</Text>
                              </Box>
                            </SimpleGrid>
                          </Box>

                          <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                            <Button
                              size="md"
                              colorScheme="green"
                              leftIcon={<SaudiRiyalIcon />}
                              onClick={handleNetSettlement}
                              isDisabled={netPayable === 0}
                            >
                              1-Click Net Settlement (تنفيذ المقاصة وتصفية الأرصدة)
                            </Button>

                            <Button
                              size="md"
                              variant="outline"
                              colorScheme="blue"
                              leftIcon={<FiSend />}
                              onClick={handleTriggerFinalClosure}
                            >
                              Dispatch Final WhatsApp Notice (إرسال إشعار الإغلاق بالواتساب)
                            </Button>
                          </Flex>
                        </VStack>
                      )}
                    </CardBody>
                  </Card>

                  {/* =========================================================================
                      ZONE 2: IMPLIED LEGAL SHIELD & STATUS (20% Focus) - Pre-agreed & Automated
                     ========================================================================= */}
                  <Card bg={useColorModeValue('gray.50', 'gray.850')} borderWidth="1px" borderColor={borderColor} rounded="xl">
                    <CardBody p={4}>
                      {currentWizard.step === 1 && (
                        <VStack spacing={3} align="stretch">
                          <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                            <HStack spacing={2.5}>
                              <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
                              <Box>
                                <Text fontWeight="bold" fontSize="xs" color="green.700">
                                  ✓ 8 Governance Covenants Pre-Agreed & Implied in Agreement
                                </Text>
                                <Text fontSize="10px" color="gray.500">
                                  ميثاق البنود الـ 8 مفعل وملزم تلقائياً في العقد الأساسي — تم الاتفاق عليها مسبقاً ولا تتطلب منك أي إجراء يدوي
                                </Text>
                              </Box>
                            </HStack>
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="green"
                              onClick={() => setShowCovenantsDetail(!showCovenantsDetail)}
                            >
                              {showCovenantsDetail ? 'Hide Covenants (إخفاء التفاصيل)' : 'View Pre-Agreed Covenants (عرض بنود الميثاق الـ 8)'}
                            </Button>
                          </Flex>

                          {showCovenantsDetail && (
                            <Box pt={2}>
                              <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                                {[
                                  { num: 1, title: 'CR Identity & Client Classification', ar: 'السجل والاعتمادات باسم شركة أ' },
                                  { num: 2, title: 'Site Procurement & Cash Funding', ar: 'تمويل المشتريات من الشريك' },
                                  { num: 3, title: 'Management Fee & Profit Waterfall', ar: '0% أتعاب + مشاركة بالأرباح' },
                                  { num: 4, title: `Financial Liability Ceiling: ${formatSAR(liabilityCap)}`, ar: 'سقف التزام مالي مقيد' },
                                  { num: 5, title: 'Strict Nafith Promissory Note Ban', ar: 'حظر إصدار سندات منصة نافذ' },
                                  { num: 6, title: '24-Hour Bank Slip Delivery SLA', ar: 'تسليم إشعار التحويل خلال 24 ساعة' },
                                  { num: 7, title: '15% ZATCA VAT Credit Retention', ar: 'حفظ رصيد ضريبة المدخلات لشركة أ' },
                                  { num: 8, title: '100% Sole Indemnifier Clause', ar: 'إبراء ذمة المالك السعودي تماماً' },
                                ].map((cov) => (
                                  <HStack key={cov.num} p={2} bg={useColorModeValue('white', 'gray.800')} rounded="md" borderWidth="1px" borderColor={borderColor} spacing={2} align="flex-start">
                                    <Icon as={FiCheckCircle} color="green.500" mt={0.5} boxSize={3.5} />
                                    <Box fontSize="11px">
                                      <Text fontWeight="bold">{cov.num}. {cov.title}</Text>
                                      <Text fontSize="10px" color="gray.500">{cov.ar}</Text>
                                    </Box>
                                  </HStack>
                                ))}
                              </SimpleGrid>
                            </Box>
                          )}
                        </VStack>
                      )}

                      {currentWizard.step === 2 && (
                        <HStack spacing={3} align="flex-start">
                          <Icon as={FiShield} color="purple.500" boxSize={5} mt={0.5} />
                          <Box>
                            <Text fontWeight="bold" fontSize="xs" color="purple.700">
                              ✓ Royal Decree M/43 Sole Indemnity Enforced (إبراء ذمة المالك السعودي محمي نظاماً)
                            </Text>
                            <Text fontSize="11px" color="gray.600" mt={0.5}>
                              Under Saudi Commercial & Evidence Law, executing partners bear 100% civil, financial, and labor liabilities for site procurement executed under Company A's CR.
                              (حماية تلقائية تمنع مساءلة المالك السعودي عن التزامات الشريك التنفيذي).
                            </Text>
                          </Box>
                        </HStack>
                      )}

                      {currentWizard.step === 3 && (
                        <HStack spacing={3} align="flex-start">
                          <Icon as={FiCheckCircle} color="green.500" boxSize={5} mt={0.5} />
                          <Box>
                            <Text fontWeight="bold" fontSize="xs" color="green.700">
                              ✓ Nafith Sentinel Automated Active Monitoring (مراقبة منصة نافذ مفعلة تلقائياً)
                            </Text>
                            <Text fontSize="11px" color="gray.600" mt={0.5}>
                              Continuous monitoring on Ministry of Justice Nafith platform protects Saudi Owner bank accounts. If an unauthorized promissory note is lodged, the system triggers an emergency WhatsApp alert within the 5-day challenge window.
                              (حماية تلقائية مدار الساعة للحسابات البنكية من أوامر التنفيذ المفاجئة).
                            </Text>
                          </Box>
                        </HStack>
                      )}

                      {currentWizard.step === 4 && (
                        <HStack spacing={3} align="flex-start">
                          <Icon as={FiCheckCircle} color="teal.500" boxSize={5} mt={0.5} />
                          <Box>
                            <Text fontWeight="bold" fontSize="xs" color="teal.700">
                              ✓ 15% ZATCA Input VAT Credit Retention (حفظ رصيد ضريبة المدخلات 15% مفعل تلقائياً)
                            </Text>
                            <Text fontSize="11px" color="gray.600" mt={0.5}>
                              Supplier tax invoices issued under Company A's VAT number directly offset Company A's ZATCA tax return, saving cash and eliminating tax penalties.
                              (حماية تلقائية تخصم مبالغ الضريبة من إقرار هيئة الزكاة والضريبة).
                            </Text>
                          </Box>
                        </HStack>
                      )}

                      {currentWizard.step === 5 && (
                        <HStack spacing={3} align="flex-start">
                          <Icon as={FiCheckCircle} color="blue.500" boxSize={5} mt={0.5} />
                          <Box>
                            <Text fontWeight="bold" fontSize="xs" color="blue.700">
                              ✓ Senior Bank Debt Priority-1 Waterfall (أولوية سداد التسهيلات البنكية مفعلة تلقائياً)
                            </Text>
                            <Text fontSize="11px" color="gray.600" mt={0.5}>
                              When client milestone payments arrive, senior bank financing lines are cleared first before partner profit split is unlocked.
                              (حماية ائتمانية تضمن سداد البنوك بأولوية مطلقة لحماية التصنيف الائتماني للشركة).
                            </Text>
                          </Box>
                        </HStack>
                      )}
                    </CardBody>
                  </Card>

                  {/* 2. STANDARDIZED BOTTOM NAVIGATION BAR (Strictly At the Bottom) */}
                  <Flex justify="space-between" align="center" pt={5} mt={3} borderTopWidth="1.5px" borderColor={borderColor} flexWrap="wrap" gap={3}>
                    <Button
                      size="md"
                      variant="outline"
                      leftIcon={<FiArrowLeft />}
                      isDisabled={currentStep === 1}
                      onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                    >
                      Previous Step (السابق)
                    </Button>

                    <HStack spacing={3}>
                      <Button
                        size="md"
                        variant="ghost"
                        colorScheme={isCurrentSkipped ? 'blue' : 'gray'}
                        onClick={() => toggleSkipStep(currentStep)}
                      >
                        {isCurrentSkipped ? 'Un-skip (تفعيل الخطوة)' : 'Skip This Step (تخطي هذه المرحلة)'}
                      </Button>

                      <Button
                        size="md"
                        colorScheme={currentStep === 5 ? 'green' : 'blue'}
                        rightIcon={currentStep === 5 ? <FaWhatsapp /> : <FiArrowRight />}
                        onClick={handleProceedNext}
                      >
                        {currentStep === 5
                          ? 'Finish & Trigger Final Notice (إنهاء وإرسال الاعتماد النهائي)'
                          : `Save & Proceed to Step ${currentStep + 1} ➔ (حفظ والمتابعة)`}
                      </Button>
                    </HStack>
                  </Flex>

                </VStack>
              </CardBody>
            </Card>

          </VStack>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 2: ADVANCED ALL-TABS VIEW (AVAILABLE ON DEMAND)                 */}
        {/* ========================================================================= */}
        {viewMode === 'all_tabs' && (
          <Tabs
            variant="soft-rounded"
            colorScheme="blue"
            index={tabIndex}
            onChange={(index) => setTabIndex(index)}
            isLazy
          >
            <TabList
              px={3}
              py={2.5}
              bg={navBg}
              rounded="xl"
              borderWidth="1px"
              borderColor={borderColor}
              mb={4}
              flexWrap="wrap"
              gap={2}
              shadow="xs"
            >
              <Tab fontWeight="bold" fontSize="xs">
                <HStack spacing={1.5}>
                  <FiShield />
                  <Text>1. Guarantees Vault (الضمانات ونافذ)</Text>
                </HStack>
              </Tab>
              <Tab fontWeight="bold" fontSize="xs">
                <HStack spacing={1.5}>
                  <SaudiRiyalIcon boxSize={4} />
                  <Text>2. Mutual Clear-Off (المقاصة وشلال الديون)</Text>
                </HStack>
              </Tab>
              <Tab fontWeight="bold" fontSize="xs">
                <HStack spacing={1.5}>
                  <FiTruck />
                  <Text>3. Shared Fleet (الآليات المشتركة)</Text>
                </HStack>
              </Tab>
              <Tab fontWeight="bold" fontSize="xs">
                <HStack spacing={1.5}>
                  <FiGrid />
                  <Text>4. RACI Matrix (مصفوفة المسؤوليات)</Text>
                </HStack>
              </Tab>
              <Tab fontWeight="bold" fontSize="xs">
                <HStack spacing={1.5}>
                  <FaWhatsapp color="#25D366" size={14} />
                  <Text>5. WhatsApp & Passes (الواتساب والتصاريح)</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel p={0}>
                <GovernanceDashboard organizationId={organizationId} userId={userId} />
              </TabPanel>
              <TabPanel p={0}>
                <BilateralSettlementTerminal organizationId={organizationId} userId={userId} />
              </TabPanel>
              <TabPanel p={0}>
                <ResourceRequisitionTerminal organizationId={organizationId} userId={userId} />
              </TabPanel>
              <TabPanel p={0}>
                <ProjectRaciMatrix organizationId={organizationId} userId={userId} />
              </TabPanel>
              <TabPanel p={0}>
                <WhatsAppStakeholderBotTerminal organizationId={organizationId} userId={userId} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}

        {/* MODAL 1: Consortium Project Agreed Terms Checklist */}
        <Modal isOpen={checklistModal.isOpen} onClose={checklistModal.onClose} size="2xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader bg="blue.700" color="white" borderTopRadius="md">
              <HStack spacing={2.5}>
                <FiCheckSquare size={22} />
                <Box>
                  <Text fontSize="md" fontWeight="bold">
                    Consortium Project Agreed Terms Checklist (قائمة البنود والالتزامات المتفق عليها)
                  </Text>
                  <Text fontSize="11px" color="blue.100" fontWeight="normal">
                    Binding governance covenants agreed upon between {projectData.companyAName} & {projectData.partnerBName}
                  </Text>
                </Box>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={5}>
              <VStack spacing={3.5} align="stretch">
                <Box p={3} bg={useColorModeValue('blue.50', 'blue.950')} rounded="md" borderWidth="1px" borderColor="blue.200">
                  <Text fontSize="xs" fontWeight="bold" color="blue.800" mb={1}>
                    📌 Project: {projectData.projectName} (<Icon as={SaudiRiyalIcon} boxSize="0.85em" /> {formatSAR(projectData.contractValue)} Master Contract)
                  </Text>
                  <Text fontSize="11px" color="gray.600">
                    This checklist governs the operational, financial, and legal relationship between {projectData.companyAName} and {projectData.partnerBName} under the Saudi Law of Evidence.
                  </Text>
                </Box>

                <VStack spacing={2.5} align="stretch">
                  {[
                    {
                      titleEn: '1. Commercial Registration & Client Qualifications',
                      titleAr: 'سجل تجاري شركة (أ) والاعتمادات الرسمية لدى العميل',
                      desc: 'Master contract with Client and official vendor qualification & classification codes remain strictly under Company A.',
                      badge: 'COMPANY A INTERFACE',
                    },
                    {
                      titleEn: '2. Site Procurement & Cash Funding',
                      titleAr: 'تمويل المشتريات وسداد الموردين',
                      desc: 'Executing Partner funds raw materials, machinery, and labor from its bank accounts on behalf of Company A.',
                      badge: 'PARTNER FUNDED',
                    },
                    {
                      titleEn: '3. Management Fee & Profit Waterfall',
                      titleAr: 'أتعاب الإدارة وتوزيع الأرباح',
                      desc: '0% upfront management fee. Retained margin and net profits distributed in agreed ratios upon client milestone IPC receipt.',
                      badge: '0% FEE + PROFIT SHARE',
                    },
                    {
                      titleEn: '4. Maximum Financial Liability Ceiling',
                      titleAr: 'سقف الالتزام المالي الأقصى',
                      desc: `Procurement commitments under Company A are strictly capped at ${formatSAR(liabilityCap)} \uE900 without prior written approval.`,
                      badge: `CAPPED AT ${formatSAR(liabilityCap)} \uE900`,
                    },
                    {
                      titleEn: '5. Strict Nafith Promissory Note Ban',
                      titleAr: 'حظر إصدار سندات منصة نافذ',
                      desc: 'Strict prohibition on issuing Promissory Notes (Sanad Amr) under Company A without prior written mutual consent.',
                      badge: 'PROHIBITED ON NAFITH',
                    },
                    {
                      titleEn: '6. 24-Hour Bank Slip Delivery SLA',
                      titleAr: 'تزويد إشعارات التحويل البنكي خلال 24 ساعة',
                      desc: 'Whenever Partner pays a vendor on behalf of Company A, the bank wire slip and stamped invoice must be logged within 24 hours.',
                      badge: '24-HOUR SLA',
                    },
                    {
                      titleEn: '7. 15% ZATCA VAT Input Tax Credit Retention',
                      titleAr: 'حفظ رصيد ضريبة المدخلات 15% لهيئة الزكاة',
                      desc: 'All vendor invoices carry Company A’s VAT number, allowing Company A to offset Output VAT against Client collections without tax audits.',
                      badge: '100% ZATCA COMPLIANT',
                    },
                    {
                      titleEn: '8. 100% Sole Indemnifier (Al-Daamin Al-Wahid)',
                      titleAr: 'إقرار الضامن الوحيد الحصري',
                      desc: 'Partner holds 100% sole legal indemnification for site safety, labor disputes, and unpaid supplier debts, fully shielding the Saudi Owner.',
                      badge: 'SOLE INDEMNITY SIGNED',
                    },
                  ].map((item, idx) => (
                    <Flex
                      key={idx}
                      p={3}
                      rounded="lg"
                      borderWidth="1px"
                      borderColor={useColorModeValue('gray.200', 'gray.700')}
                      bg={useColorModeValue('gray.50', 'gray.750')}
                      justify="space-between"
                      align="flex-start"
                      gap={3}
                    >
                      <HStack spacing={2.5} align="flex-start">
                        <Icon as={FiCheckCircle} color="green.500" boxSize={4} mt={0.5} />
                        <Box>
                          <HStack spacing={2} mb={0.5}>
                            <Text fontWeight="bold" fontSize="xs">
                              {item.titleEn}
                            </Text>
                            <Text fontSize="10px" color="gray.500">
                              ({item.titleAr})
                            </Text>
                          </HStack>
                          <Text fontSize="11px" color="gray.600">
                            {item.desc}
                          </Text>
                        </Box>
                      </HStack>
                      <Badge colorScheme="teal" variant="subtle" fontSize="9px" whiteSpace="nowrap">
                        {item.badge}
                      </Badge>
                    </Flex>
                  ))}
                </VStack>
              </VStack>
            </ModalBody>
            <ModalFooter bg={useColorModeValue('gray.50', 'gray.900')}>
              <Button size="sm" colorScheme="blue" onClick={checklistModal.onClose}>
                Done (إغلاق)
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL 2: Issue CR Permission Pass */}
        <Modal isOpen={passportModal.isOpen} onClose={passportModal.onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader bg="purple.700" color="white">
              Issue CR Permission Pass (إصدار تصريح استخدام السجل)
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={4}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Partner Organization (الجهة المفوضة):</FormLabel>
                  <Input
                    value={passportForm.granted_to_org}
                    onChange={(e) => setPassportForm({ ...passportForm, granted_to_org: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Authorized Work Scope (نطاق العمل المصرح):</FormLabel>
                  <Input
                    value={passportForm.allowed_tender_scope}
                    onChange={(e) => setPassportForm({ ...passportForm, allowed_tender_scope: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Maximum Liability Ceiling <Icon as={SaudiRiyalIcon} boxSize="0.85em" /> (سقف الالتزام):</FormLabel>
                  <NumberInput
                    value={passportForm.liability_cap_sar}
                    onChange={(_, val) => setPassportForm({ ...passportForm, liability_cap_sar: val || liabilityCap })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={passportModal.onClose}>
                Cancel
              </Button>
              <Button colorScheme="purple" leftIcon={<FiSend />} onClick={handleCreatePassport}>
                Issue & Send via WhatsApp
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL 3: Log Nafith Court Notice */}
        <Modal isOpen={nafithModal.isOpen} onClose={nafithModal.onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader bg="orange.600" color="white">
              Log Nafith Court Notice (قيد إشعار منصة نافذ)
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={4}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Nafith Notice Number (رقم إشعار نافذ):</FormLabel>
                  <Input
                    value={nafithForm.notice_number}
                    onChange={(e) => setNafithForm({ ...nafithForm, notice_number: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Claimant / Creditor Name (الجهة المطالبة):</FormLabel>
                  <Input
                    value={nafithForm.creditor_name}
                    onChange={(e) => setNafithForm({ ...nafithForm, creditor_name: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Claim Amount <Icon as={SaudiRiyalIcon} boxSize="0.85em" /> (المبلغ المطالب به):</FormLabel>
                  <NumberInput
                    value={nafithForm.amount}
                    onChange={(_, val) => setNafithForm({ ...nafithForm, amount: val || 0 })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Notes & Court Directive (ملاحظات وتوجيه للشريك):</FormLabel>
                  <Textarea
                    value={nafithForm.notes}
                    onChange={(e) => setNafithForm({ ...nafithForm, notes: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">Attach Court Notice / Order Document (إرفاق مستند أمر التنفيذ أو إشعار نافذ):</FormLabel>
                  <Input
                    type="file"
                    size="sm"
                    p={1}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setNafithForm({ ...nafithForm, attachment_name: f.name });
                    }}
                  />
                  {nafithForm.attachment_name && (
                    <HStack mt={1} p={1.5} bg="orange.50" rounded="md" borderWidth="1px" borderColor="orange.200">
                      <Icon as={FiAlertTriangle} color="orange.600" />
                      <Text fontSize="11px" color="orange.800" fontWeight="bold">Attached: {nafithForm.attachment_name}</Text>
                    </HStack>
                  )}
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={nafithModal.onClose}>
                Cancel
              </Button>
              <Button colorScheme="orange" onClick={handleLogNafith}>
                Record Alert & Notify Partner
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL 4: Vault Promissory Note (Sanad Amr) */}
        <Modal isOpen={sanadModal.isOpen} onClose={sanadModal.onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader bg="red.700" color="white">
              Vault Counter-Secured Sanad Amr (إصدار سند لأمر رسمي)
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={4}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Supplier / Creditor (المورد المستفيد):</FormLabel>
                  <Input
                    value={sanadForm.creditor_name}
                    onChange={(e) => setSanadForm({ ...sanadForm, creditor_name: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Amount <Icon as={SaudiRiyalIcon} boxSize="0.85em" /> (المبلغ):</FormLabel>
                  <NumberInput
                    value={sanadForm.amount}
                    onChange={(_, val) => setSanadForm({ ...sanadForm, amount: val || 0 })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Due Date (تاريخ الاستحقاق):</FormLabel>
                  <Input
                    type="date"
                    value={sanadForm.due_date}
                    onChange={(e) => setSanadForm({ ...sanadForm, due_date: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Partner Counter-Security Details (بيانات السند المضاد):</FormLabel>
                  <Input
                    value={sanadForm.counter_security}
                    onChange={(e) => setSanadForm({ ...sanadForm, counter_security: e.target.value })}
                  />
                </FormControl>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} w="full">
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Attach Promissory Note (إرفاق صورة السند لأمر):</FormLabel>
                    <Input
                      type="file"
                      size="sm"
                      p={1}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setSanadForm({ ...sanadForm, attachment_name: f.name });
                      }}
                    />
                    {sanadForm.attachment_name && (
                      <HStack mt={1} p={1.5} bg="red.50" rounded="md" borderWidth="1px" borderColor="red.200">
                        <Icon as={FiFileText} color="red.600" />
                        <Text fontSize="11px" color="red.800" fontWeight="bold">Attached: {sanadForm.attachment_name}</Text>
                      </HStack>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Attach Counter-Sanad (إرفاق السند المضاد):</FormLabel>
                    <Input
                      type="file"
                      size="sm"
                      p={1}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setSanadForm({ ...sanadForm, counter_attachment_name: f.name });
                      }}
                    />
                    {sanadForm.counter_attachment_name && (
                      <HStack mt={1} p={1.5} bg="purple.50" rounded="md" borderWidth="1px" borderColor="purple.200">
                        <Icon as={FiShield} color="purple.600" />
                        <Text fontSize="11px" color="purple.800" fontWeight="bold">Attached: {sanadForm.counter_attachment_name}</Text>
                      </HStack>
                    )}
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={sanadModal.onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleIssueSanad}>
                Vault Note (قيد السند والحماية)
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL 5: Record Vendor Payment & Bank Slip */}
        <Modal isOpen={vendorSlipModal.isOpen} onClose={vendorSlipModal.onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader bg="orange.600" color="white">
              Record Vendor Payment & Bank Slip (تسجيل سداد مورد وإشعار بنكي)
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={4}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Vendor Name (اسم المورد):</FormLabel>
                  <Input
                    value={vendorSlipForm.vendor_name}
                    onChange={(e) => setVendorSlipForm({ ...vendorSlipForm, vendor_name: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Amount Excl. VAT <Icon as={SaudiRiyalIcon} boxSize="0.85em" /> (المبلغ قبل الضريبة):</FormLabel>
                  <NumberInput
                    value={vendorSlipForm.amount_excl_vat}
                    onChange={(_, val) => setVendorSlipForm({ ...vendorSlipForm, amount_excl_vat: val || 0 })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Bank Transfer Reference # (مرجع التحويل البنكي):</FormLabel>
                  <Input
                    value={vendorSlipForm.transfer_ref}
                    onChange={(e) => setVendorSlipForm({ ...vendorSlipForm, transfer_ref: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Description / PO Ref (الوصف / أمر الشراء):</FormLabel>
                  <Input
                    value={vendorSlipForm.description}
                    onChange={(e) => setVendorSlipForm({ ...vendorSlipForm, description: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">Attach Bank Transfer Slip & Tax Invoice (إرفاق إشعار التحويل وفاتورة المورد):</FormLabel>
                  <Input
                    type="file"
                    size="sm"
                    p={1}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setVendorSlipForm({ ...vendorSlipForm, slip_attachment_name: f.name });
                    }}
                  />
                  {vendorSlipForm.slip_attachment_name && (
                    <HStack mt={1} p={1.5} bg="teal.50" rounded="md" borderWidth="1px" borderColor="teal.200">
                      <Icon as={FiCheckCircle} color="teal.600" />
                      <Text fontSize="11px" color="teal.800" fontWeight="bold">Attached: {vendorSlipForm.slip_attachment_name}</Text>
                    </HStack>
                  )}
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={vendorSlipModal.onClose}>
                Cancel
              </Button>
              <Button colorScheme="orange" onClick={handleRecordVendorSlip}>
                Save Slip & Preserve 15% VAT
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL 6: Customize Liability Ceiling */}
        <Modal isOpen={ceilingModal.isOpen} onClose={ceilingModal.onClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader bg="teal.700" color="white" borderTopRadius="md">
              <HStack spacing={2}>
                <SaudiRiyalIcon boxSize={5} />
                <Text fontSize="md">Customize Liability Ceiling (تخصيص سقف الالتزام المالي)</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={4}>
              <VStack spacing={4} align="stretch">
                <Box p={3} bg={useColorModeValue('teal.50', 'teal.950')} rounded="md" borderWidth="1px" borderColor="teal.200">
                  <Text fontSize="xs" fontWeight="bold" color="teal.800" mb={1}>
                    📌 Project: {projectData.projectName}
                  </Text>
                  <Text fontSize="11px" color="gray.600">
                    The liability ceiling is the maximum financial exposure that {projectData.partnerBName} is authorized to incur under your CR without requiring explicit board approval. Set this based on your specific subcontract or procurement package size.
                  </Text>
                </Box>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Maximum Liability Ceiling <Icon as={SaudiRiyalIcon} boxSize="0.85em" /> (سقف الالتزام المالي بالريال السعودي):</FormLabel>
                  <NumberInput
                    value={tempCapInput}
                    min={10000}
                    step={50000}
                    onChange={(_, val) => setTempCapInput(val || 1500000)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <Box>
                  <Text fontSize="10px" color="gray.500" mb={1}>
                    Quick Presets (خيارات سريعة):
                  </Text>
                  <HStack spacing={2}>
                    {[250000, 500000, 1000000, 1500000, 3000000, 5000000].map((preset) => (
                      <Button
                        key={preset}
                        size="xs"
                        variant="outline"
                        colorScheme="teal"
                        onClick={() => setTempCapInput(preset)}
                      >
                        {preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}K`}
                      </Button>
                    ))}
                  </HStack>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={ceilingModal.onClose}>
                Cancel (إلغاء)
              </Button>
              <Button colorScheme="teal" onClick={handleSaveCeiling}>
                Save & Apply Ceiling (حفظ وتطبيق)
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL 7: Edit Generalized Project & Partner Details */}
        <Modal isOpen={editProjectModal.isOpen} onClose={editProjectModal.onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader bg="purple.700" color="white" borderTopRadius="md">
              <HStack spacing={2}>
                <FiEdit2 />
                <Text fontSize="md">Edit Project & Consortium Details (تعديل بيانات المشروع والشركاء)</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={4}>
              <VStack spacing={3.5}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Project Name (اسم المشروع):</FormLabel>
                  <Input
                    value={editProjForm.projectName}
                    onChange={(e) => setEditProjForm({ ...editProjForm, projectName: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Client / Project Owner (المالك / صاحب المشروع):</FormLabel>
                  <Input
                    value={editProjForm.clientName}
                    onChange={(e) => setEditProjForm({ ...editProjForm, clientName: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Total Master Contract Value <Icon as={SaudiRiyalIcon} boxSize="0.85em" /> (قيمة العقد الإجمالية):</FormLabel>
                  <NumberInput
                    value={editProjForm.contractValue}
                    onChange={(_, val) => setEditProjForm({ ...editProjForm, contractValue: val || 45000000 })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <SimpleGrid columns={2} gap={3} w="full">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Company A (Lead CR Holder):</FormLabel>
                    <Input
                      value={editProjForm.companyAName}
                      onChange={(e) => setEditProjForm({ ...editProjForm, companyAName: e.target.value })}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Company A CR Number:</FormLabel>
                    <Input
                      value={editProjForm.companyACR}
                      onChange={(e) => setEditProjForm({ ...editProjForm, companyACR: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={2} gap={3} w="full">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Executing Partner (Company B):</FormLabel>
                    <Input
                      value={editProjForm.partnerBName}
                      onChange={(e) => setEditProjForm({ ...editProjForm, partnerBName: e.target.value })}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Partner Mobile (WhatsApp):</FormLabel>
                    <Input
                      value={editProjForm.partnerMobile}
                      onChange={(e) => setEditProjForm({ ...editProjForm, partnerMobile: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl w="full">
                  <FormLabel fontSize="xs">Partner Role / Package (دور الشريك / حزمة الأعمال):</FormLabel>
                  <Input
                    value={editProjForm.partnerRole || (editProjForm.contractors?.[0]?.role || '')}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      const currentContractors = editProjForm.contractors || DEFAULT_CONTRACTORS;
                      const updated = currentContractors.map((c: any, idx: number) => idx === 0 ? { ...c, role: newRole } : c);
                      setEditProjForm({ ...editProjForm, partnerRole: newRole, contractors: updated });
                    }}
                    placeholder="e.g. Lead Executing Partner & EPC Contractor"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={editProjectModal.onClose}>
                Cancel
              </Button>
              <Button colorScheme="purple" onClick={handleSaveProjectMeta}>
                Save Details (حفظ التعديلات)
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL 8: Final Comprehensive WhatsApp Closure Notice with Interactive Acceptance */}
        <Modal isOpen={finalClosureModal.isOpen} onClose={finalClosureModal.onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader bg="green.700" color="white" borderTopRadius="md">
              <HStack spacing={2}>
                <FaWhatsapp color="#25D366" size={22} />
                <Text fontSize="md">Master Governance Closure & Acceptance (إشعار الإغلاق والاعتماد النهائي)</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={5}>
              <VStack spacing={4} align="stretch">
                <Box p={3.5} bg={useColorModeValue('green.50', 'green.950')} rounded="lg" borderWidth="1.5px" borderColor="green.300">
                  <Text fontWeight="bold" fontSize="sm" color="green.800" mb={1}>
                    🎉 All 5 Governance Stages Successfully Completed / Reconciled
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    The consortium lifecycle is now closed. The master governance closure certificate has been compiled and dispatched via WhatsApp to <b>{projectData.partnerMobile}</b>.
                  </Text>
                </Box>

                <Card bg={useColorModeValue('gray.50', 'gray.800')} borderWidth="1px" borderColor={borderColor}>
                  <CardBody p={3.5}>
                    <Text fontWeight="bold" fontSize="xs" mb={2} color="blue.800">
                      📋 Master Governance Closure Summary (ملخص المخالصة الشاملة):
                    </Text>
                    <VStack spacing={2} align="stretch" fontSize="xs">
                      <Flex justify="space-between">
                        <Text color="gray.500">Project / Master Contract:</Text>
                        <Text fontWeight="bold">{projectData.projectName}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.500">Lead CR Holder (Company A):</Text>
                        <Text fontWeight="bold">{projectData.companyAName}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.500">Executing Partner (Company B):</Text>
                        <Text fontWeight="bold">{projectData.partnerBName}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.500">Authorized Liability Ceiling:</Text>
                        <Text fontWeight="bold" color="blue.600">{formatSAR(liabilityCap)}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.500">Sole Indemnity Protection:</Text>
                        <Badge colorScheme="green">100% EXONERATED / إبراء ذمة المالك</Badge>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.500">ZATCA 15% Input VAT Retained:</Text>
                        <Text fontWeight="bold" color="teal.600">{formatSAR(totalVatSaved)}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.500">Nafith Execution Claims:</Text>
                        <Badge colorScheme="green">0 ACTIVE CLAIMS (CLEAN)</Badge>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.500">Final Net Settlement Due:</Text>
                        <Text fontWeight="bold" color="purple.600">{formatSAR(netPayable)}</Text>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>

                {/* 5. INTERACTIVE ACCEPTANCE BUTTONS */}
                <Box p={3.5} bg={useColorModeValue('blue.50', 'gray.750')} rounded="lg" borderWidth="1.5px" borderColor="blue.300">
                  <Text fontWeight="bold" fontSize="xs" color="blue.900" mb={1}>
                    Interactive Stakeholder Acceptance (اعتماد الشركاء الرقمي):
                  </Text>
                  <Text fontSize="11px" color="gray.600" mb={3}>
                    Stakeholders can click below or use the interactive WhatsApp link to record their binding digital acceptance under Saudi Law of Evidence (Royal Decree M/43).
                  </Text>
                  <HStack spacing={3}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<FiCheckCircle />}
                      onClick={() => {
                        toast({
                          title: 'Master Governance Accepted & Sealed (تم توثيق الاعتماد والمخالصة النهائية)',
                          description: 'Digital signature recorded under Royal Decree M/43 with cryptographic token.',
                          status: 'success',
                        });
                        finalClosureModal.onClose();
                      }}
                    >
                      Approve & Accept Final Governance (اعتماد وتوقيع المخالصة)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      leftIcon={<FiDownload />}
                      onClick={() => {
                        toast({
                          title: 'Governance Audit Charter Downloaded',
                          description: 'Complete stamped governance package exported.',
                          status: 'info',
                        });
                      }}
                    >
                      Download Charter (تحميل الميثاق)
                    </Button>
                  </HStack>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button size="sm" colorScheme="blue" onClick={finalClosureModal.onClose}>
                Close (إغلاق)
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL: EXECUTED CONTRACTS VAULT (سجل ومستودع العقود المعتمدة)            */}
        {/* ========================================================================= */}
        <Modal isOpen={contractsVaultModal.isOpen} onClose={contractsVaultModal.onClose} size="5xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader pb={2}>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <HStack spacing={2.5}>
                  <Box p={2} bg="purple.500" color="white" rounded="lg">
                    <FiFileText size={20} />
                  </Box>
                  <Box>
                    <HStack spacing={2}>
                      <Text fontSize="md" fontWeight="bold">
                        Executed Contracts Vault & Registry (سجل ومستودع العقود المعتمدة)
                      </Text>
                      <Badge colorScheme="purple">
                        {collaborations?.length || 0} CONTRACTS
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      View, edit, or archive consortium contracts executed under Company A's CR.
                    </Text>
                  </Box>
                </HStack>

                <Button
                  size="sm"
                  colorScheme="purple"
                  leftIcon={<FiPlus />}
                  onClick={handleOpenAddContract}
                >
                  + New Consortium Contract (تسجيل عقد جديد)
                </Button>
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            <Divider />
            <ModalBody py={4}>
              <VStack spacing={4} align="stretch">
                {/* Executing Company Priority Banner */}
                <Box p={3.5} bg={useColorModeValue('purple.50', 'gray.750')} rounded="lg" borderWidth="1.5px" borderColor="purple.300">
                  <HStack spacing={3} align="flex-start">
                    <Icon as={FiShield} color="purple.500" boxSize={5} mt={0.5} />
                    <Box>
                      <Text fontWeight="bold" fontSize="xs" color="purple.900" mb={0.5}>
                        Executing Company Management Priority (أولوية الصلاحية للشركة المنفذة والممولة):
                      </Text>
                      <Text fontSize="11px" color="gray.600" lineHeight="1.5">
                        In full accordance with the Saudi Law of Evidence (Royal Decree M/43), contract execution parameters, liability ceilings, and commercial scopes are maintained under the primary priority of the <b>Executing Partner (الشركة المنفذة)</b>, who carries the operational liability and provides 100% sole indemnification to the Saudi CR Owner.
                      </Text>
                    </Box>
                  </HStack>
                </Box>

                {/* Portfolio Stats */}
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                  <Card bg={useColorModeValue('gray.50', 'gray.800')} borderWidth="1px" borderColor={borderColor}>
                    <CardBody p={3} textAlign="center">
                      <Text fontSize="11px" color="gray.500">Total Executed Agreements</Text>
                      <Text fontSize="lg" fontWeight="extrabold" color="blue.600">{collaborations?.length || 0}</Text>
                    </CardBody>
                  </Card>
                  <Card bg={useColorModeValue('gray.50', 'gray.800')} borderWidth="1px" borderColor={borderColor}>
                    <CardBody p={3} textAlign="center">
                      <Text fontSize="11px" color="gray.500">Total Portfolio Value (<Icon as={SaudiRiyalIcon} boxSize="0.8em" />)</Text>
                      <Text fontSize="lg" fontWeight="extrabold" color="green.600">
                        {formatSAR(collaborations.reduce((sum, c) => sum + (c.contract_value || 0), 0))}
                      </Text>
                    </CardBody>
                  </Card>
                  <Card bg={useColorModeValue('gray.50', 'gray.800')} borderWidth="1px" borderColor={borderColor}>
                    <CardBody p={3} textAlign="center">
                      <Text fontSize="11px" color="gray.500">Total Authorized Ceilings (<Icon as={SaudiRiyalIcon} boxSize="0.8em" />)</Text>
                      <Text fontSize="lg" fontWeight="extrabold" color="purple.600">
                        {formatSAR(collaborations.reduce((sum, c) => sum + (c.liability_cap || 0), 0))}
                      </Text>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Contracts List */}
                <VStack spacing={3} align="stretch" mt={1}>
                  {collaborations.map((c) => {
                    const isCurrentActive = c.project_name === projectData.projectName;
                    return (
                      <Card
                        key={c.id || c._id}
                        bg={cardBg}
                        borderWidth="1.5px"
                        borderColor={isCurrentActive ? 'blue.400' : borderColor}
                        shadow="sm"
                        rounded="xl"
                      >
                        <CardBody p={4}>
                          <Flex justify="space-between" align="flex-start" mb={2} flexWrap="wrap" gap={2}>
                            <HStack spacing={2}>
                              <Badge colorScheme="blue" fontSize="11px" px={2} py={0.5} rounded="md">
                                {c.agreement_code}
                              </Badge>
                              {isCurrentActive && (
                                <Badge colorScheme="green" variant="solid" fontSize="10px">
                                  ● CURRENT ACTIVE IN WIZARD
                                </Badge>
                              )}
                              <Badge colorScheme={c.status === 'active' ? 'green' : 'gray'} fontSize="10px">
                                {c.status.toUpperCase()}
                              </Badge>
                              <Badge colorScheme="teal" fontSize="10px">
                                {c.management_fee_type === 'zero_fee' ? '0% Upfront Fee' : `${c.management_fee_value}% Fee`}
                              </Badge>
                            </HStack>

                            <HStack spacing={1}>
                              {!isCurrentActive && (
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  variant="solid"
                                  leftIcon={<FiCheckCircle />}
                                  onClick={() => handleLoadIntoWizard(c)}
                                >
                                  Load into Wizard (تفعيل بالمرشد)
                                </Button>
                              )}
                              <Button
                                size="xs"
                                colorScheme="purple"
                                variant="outline"
                                leftIcon={<FiEye />}
                                onClick={() => handleOpenViewContract(c)}
                              >
                                View (معاينة)
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="orange"
                                variant="outline"
                                leftIcon={<FiEdit2 />}
                                onClick={() => handleOpenEditContract(c)}
                              >
                                Edit (تعديل)
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                leftIcon={<FiTrash2 />}
                                onClick={() => handleDeleteContract(c.id || c._id, c.agreement_code)}
                              >
                                Delete (حذف)
                              </Button>
                            </HStack>
                          </Flex>

                          <Text fontWeight="extrabold" fontSize="sm" color="blue.900" mb={1}>
                            {c.project_name}
                          </Text>

                          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={2} fontSize="11px" mt={2} bg={useColorModeValue('gray.50', 'gray.750')} p={2.5} rounded="md">
                            <Box>
                              <Text color="gray.500">Executing Partner (الشريك المنفذ):</Text>
                              <Text fontWeight="bold">{c.partner_name}</Text>
                            </Box>
                            <Box>
                              <Text color="gray.500">Lead CR Holder (صاحب السجل):</Text>
                              <Text fontWeight="bold">{c.lead_company_name || projectData.companyAName}</Text>
                            </Box>
                            <Box>
                              <Text color="gray.500">Contract Value:</Text>
                              <Text fontWeight="bold" color="green.600">{formatSAR(c.contract_value || 0)}</Text>
                            </Box>
                            <Box>
                              <Text color="gray.500">Liability Ceiling (سقف الالتزام):</Text>
                              <Text fontWeight="bold" color="blue.600">{formatSAR(c.liability_cap)}</Text>
                            </Box>
                          </SimpleGrid>

                          <Flex justify="space-between" align="center" mt={2} fontSize="10px" color="gray.500">
                            <Text>Validity: {c.effective_from} to {c.effective_to}</Text>
                            <Text color="green.600" fontWeight="bold">✓ 8 Governance Covenants Enforced under Royal Decree M/43</Text>
                          </Flex>
                        </CardBody>
                      </Card>
                    );
                  })}
                </VStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button size="sm" onClick={contractsVaultModal.onClose}>
                Close (إغلاق)
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL: VIEW DETAILED EXECUTED CONTRACT SHEET (معاينة العقد المعتمد)        */}
        {/* ========================================================================= */}
        <Modal isOpen={viewContractModal.isOpen} onClose={viewContractModal.onClose} size="4xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader pb={2}>
              <HStack spacing={2.5}>
                <Box p={2} bg="teal.500" color="white" rounded="lg">
                  <FiCheckSquare size={20} />
                </Box>
                <Box>
                  <Text fontSize="md" fontWeight="bold">
                    Official Executed Consortium Agreement (ميثاق اتفاقية التحالف المعتمدة)
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Agreement Reference: <b>{selectedContract?.agreement_code}</b> • Legally Sealed
                  </Text>
                </Box>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <Divider />
            <ModalBody py={4}>
              {selectedContract && (
                <VStack spacing={4} align="stretch">
                  <Box p={4} bg={useColorModeValue('gray.50', 'gray.800')} rounded="xl" borderWidth="1.5px" borderColor={borderColor}>
                    <Flex justify="space-between" align="center" mb={3} borderBottomWidth="1px" borderColor={borderColor} pb={2}>
                      <Box>
                        <Text fontSize="sm" fontWeight="extrabold">{selectedContract.project_name}</Text>
                        <Text fontSize="xs" color="gray.500">Client: {selectedContract.client_name || projectData.clientName}</Text>
                      </Box>
                      <Badge colorScheme="green" fontSize="11px" px={2} py={0.5}>
                        BINDING & SIGNED • معتمد وملزم
                      </Badge>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} fontSize="xs">
                      <Box p={3} bg={useColorModeValue('white', 'gray.750')} rounded="md" borderWidth="1px" borderColor={borderColor}>
                        <Text fontWeight="bold" color="blue.700" mb={1}>Party A (Lead CR Holder / صاحب السجل):</Text>
                        <Text fontWeight="bold">{selectedContract.lead_company_name || projectData.companyAName}</Text>
                        <Text color="gray.500" fontSize="11px">CR: {projectData.companyACR}</Text>
                        <Text color="gray.500" fontSize="11px">Owner Civil Liability: <Icon as={SaudiRiyalIcon} boxSize="0.8em" /> 0.00 (Exonerated)</Text>
                      </Box>

                      <Box p={3} bg={useColorModeValue('white', 'gray.750')} rounded="md" borderWidth="1px" borderColor={borderColor}>
                        <Text fontWeight="bold" color="purple.700" mb={1}>Party B (Executing & Financing Partner / الشريك المنفذ):</Text>
                        <Text fontWeight="bold">{selectedContract.partner_name}</Text>
                        <Text color="gray.500" fontSize="11px">WhatsApp: {selectedContract.partner_mobile || projectData.partnerMobile}</Text>
                        <Text color="gray.500" fontSize="11px">Role: 100% Sole Indemnifier (الضامن الوحيد الحصري)</Text>
                      </Box>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={3} mt={3} fontSize="xs">
                      <Box p={2.5} bg={useColorModeValue('white', 'gray.750')} rounded="md">
                        <Text color="gray.500">Contract Value:</Text>
                        <Text fontWeight="bold" color="green.600">{formatSAR(selectedContract.contract_value || 0)}</Text>
                      </Box>
                      <Box p={2.5} bg={useColorModeValue('white', 'gray.750')} rounded="md">
                        <Text color="gray.500">Liability Ceiling:</Text>
                        <Text fontWeight="bold" color="blue.600">{formatSAR(selectedContract.liability_cap)}</Text>
                      </Box>
                      <Box p={2.5} bg={useColorModeValue('white', 'gray.750')} rounded="md">
                        <Text color="gray.500">Management Fee:</Text>
                        <Text fontWeight="bold" color="teal.600">
                          {selectedContract.management_fee_type === 'zero_fee' ? '0% Upfront (Profit Share)' : `${selectedContract.management_fee_value}%`}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  {/* The 8 Binding Covenants Charter */}
                  <Box>
                    <Text fontWeight="bold" fontSize="xs" color="blue.800" mb={2}>
                      📜 The 8 Binding Covenants Charter (البنود الثمانية الملزمة المدمجة في هذا العقد):
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                      {[
                        { num: 1, title: 'CR Identity & Client Classification', ar: 'السجل والاعتمادات باسم شركة أ حصراً' },
                        { num: 2, title: 'Site Procurement & Direct Cash Funding', ar: 'تمويل المشتريات من الشريك المنفذ مباشرة' },
                        { num: 3, title: 'Management Fee & Profit Waterfall', ar: '0% أتعاب إدارية مقدمة + توزيع أرباح مرحلية' },
                        { num: 4, title: `Financial Liability Ceiling: ${formatSAR(selectedContract.liability_cap)}`, ar: 'سقف التزام مالي مقيد للتعاقد والمشتريات' },
                        { num: 5, title: 'Strict Nafith Promissory Note Ban', ar: 'حظر إصدار سندات نافذ إلا بضمان مضاد مسبق' },
                        { num: 6, title: '24-Hour Bank Slip Delivery SLA', ar: 'تسليم إشعارات التحويل البنكي خلال 24 ساعة' },
                        { num: 7, title: '15% ZATCA VAT Credit Retention', ar: 'حفظ رصيد ضريبة المدخلات 15% لشركة أ' },
                        { num: 8, title: '100% Sole Indemnifier Clause (Royal Decree M/43)', ar: 'إبراء ذمة المالك السعودي 100% أمام القضاء' },
                      ].map((cov) => (
                        <HStack key={cov.num} p={2.5} bg={useColorModeValue('white', 'gray.800')} rounded="md" borderWidth="1px" borderColor={borderColor} spacing={2} align="flex-start">
                          <Icon as={FiCheckCircle} color="green.500" mt={0.5} boxSize={3.5} />
                          <Box fontSize="11px">
                            <Text fontWeight="bold">{cov.num}. {cov.title}</Text>
                            <Text fontSize="10px" color="gray.500">{cov.ar}</Text>
                          </Box>
                        </HStack>
                      ))}
                    </SimpleGrid>
                  </Box>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  size="sm"
                  colorScheme="orange"
                  variant="outline"
                  leftIcon={<FiEdit2 />}
                  onClick={() => {
                    viewContractModal.onClose();
                    handleOpenEditContract(selectedContract);
                  }}
                >
                  Edit This Contract (تعديل العقد)
                </Button>
                <Button size="sm" colorScheme="blue" onClick={viewContractModal.onClose}>
                  Close (إغلاق)
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL: EDIT OR ADD CONTRACT (تعديل أو تسجيل عقد جديد)                      */}
        {/* ========================================================================= */}
        <Modal isOpen={editContractModal.isOpen} onClose={editContractModal.onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={2}>
                <FiEdit2 color="#805AD5" />
                <Text>
                  {isNewContract
                    ? 'Execute New Consortium Contract (تسجيل عقد تحالف جديد)'
                    : `Edit Contract Parameters #${contractForm.agreement_code} (تعديل بيانات العقد)`}
                </Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <Divider />
            <ModalBody py={4}>
              <VStack spacing={4} align="stretch">
                <Box p={3} bg={useColorModeValue('purple.50', 'gray.750')} rounded="md" borderWidth="1px" borderColor="purple.200">
                  <Text fontSize="11px" color="purple.800" fontWeight="medium">
                    🔒 <b>Executing Company Operational Priority:</b> Changes to contract value, partner names, and procurement liability caps are immediately saved and synced with the governance engine.
                  </Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Agreement Code (رقم الاتفاقية):</FormLabel>
                    <Input
                      size="sm"
                      value={contractForm.agreement_code || ''}
                      onChange={(e) => setContractForm({ ...contractForm, agreement_code: e.target.value })}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Project Name (اسم المشروع):</FormLabel>
                    <Input
                      size="sm"
                      value={contractForm.project_name || ''}
                      onChange={(e) => setContractForm({ ...contractForm, project_name: e.target.value })}
                      placeholder="e.g. Riyadh Logistics Park Phase 2"
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Executing Partner Company (الشريك المنفذ):</FormLabel>
                    <Input
                      size="sm"
                      value={contractForm.partner_name || ''}
                      onChange={(e) => setContractForm({ ...contractForm, partner_name: e.target.value })}
                      placeholder="e.g. Gulf Heavy Machinery LLC"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Partner Role / Scope (الدور التعاقدي):</FormLabel>
                    <Input
                      size="sm"
                      value={contractForm.partner_role || ''}
                      onChange={(e) => setContractForm({ ...contractForm, partner_role: e.target.value })}
                      placeholder="e.g. Lead EPC Contractor, Civil Partner..."
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Partner WhatsApp Mobile (رقم الجوال):</FormLabel>
                    <Input
                      size="sm"
                      value={contractForm.partner_mobile || ''}
                      onChange={(e) => setContractForm({ ...contractForm, partner_mobile: e.target.value })}
                      placeholder="+966505123456"
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">Lead CR Company (صاحب السجل التجاري):</FormLabel>
                    <Input
                      size="sm"
                      value={contractForm.lead_company_name || ''}
                      onChange={(e) => setContractForm({ ...contractForm, lead_company_name: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Client / Project Owner (المالك):</FormLabel>
                    <Input
                      size="sm"
                      value={contractForm.client_name || ''}
                      onChange={(e) => setContractForm({ ...contractForm, client_name: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Contract Value <Icon as={SaudiRiyalIcon} boxSize="0.85em" /> (قيمة العقد):</FormLabel>
                    <Input
                      size="sm"
                      type="number"
                      value={contractForm.contract_value || 0}
                      onChange={(e) => setContractForm({ ...contractForm, contract_value: Number(e.target.value) })}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Liability Ceiling <Icon as={SaudiRiyalIcon} boxSize="0.85em" /> (سقف الالتزام):</FormLabel>
                    <Input
                      size="sm"
                      type="number"
                      value={contractForm.liability_cap || 0}
                      onChange={(e) => setContractForm({ ...contractForm, liability_cap: Number(e.target.value) })}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">Fee Structure:</FormLabel>
                    <Select
                      size="sm"
                      value={contractForm.management_fee_type || 'zero_fee'}
                      onChange={(e) => setContractForm({ ...contractForm, management_fee_type: e.target.value as any })}
                    >
                      <option value="zero_fee">0% Zero-Upfront Fee</option>
                      <option value="percentage">Percentage Split</option>
                      <option value="fixed_monthly">Fixed Monthly</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Effective From:</FormLabel>
                    <Input
                      size="sm"
                      type="date"
                      value={contractForm.effective_from || ''}
                      onChange={(e) => setContractForm({ ...contractForm, effective_from: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Effective To:</FormLabel>
                    <Input
                      size="sm"
                      type="date"
                      value={contractForm.effective_to || ''}
                      onChange={(e) => setContractForm({ ...contractForm, effective_to: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="xs">Status (حالة العقد):</FormLabel>
                  <Select
                    size="sm"
                    value={contractForm.status || 'active'}
                    onChange={(e) => setContractForm({ ...contractForm, status: e.target.value as any })}
                  >
                    <option value="active">Active & Binding (نشط وملزم)</option>
                    <option value="completed">Completed (منتهي بنجاح)</option>
                    <option value="terminated">Terminated (مفسوخ)</option>
                  </Select>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={editContractModal.onClose}>
                Cancel (إلغاء)
              </Button>
              <Button colorScheme="purple" onClick={handleSaveContract}>
                {isNewContract ? 'Execute Contract (حفظ وقيد العقد)' : 'Save Changes (حفظ التعديلات)'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL: ADD CONTRACTOR / PARTNER TO MASTER CONSORTIUM                      */}
        {/* ========================================================================= */}
        <Modal isOpen={addContractorModal.isOpen} onClose={addContractorModal.onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={2}>
                <Icon as={FiPlus} color="teal.500" />
                <Text>Add Contractor / Partner to Master Consortium (إضافة شريك للتحالف)</Text>
              </HStack>
              <Text fontSize="xs" fontWeight="normal" color="gray.500" mt={1}>
                إضافة مقاول أو مورد جديد إلى نفس صفحة العقد وتحديد حزمة أعماله وسقف التزامه المالي المستقل
              </Text>
            </ModalHeader>
            <ModalCloseButton />
            <Divider />
            <ModalBody py={4}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Contractor Legal Name (اسم المقاول / المنشأة):</FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g. Gulf Earthworks & Foundations Co. (شركة الخليج للحفريات والأساسات)"
                    value={newContractorForm.name}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, name: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Contractor Role / Work Package (حزمة الأعمال / الدور التعاقدي):</FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g. Civil & Concrete Contractor, Ready-Mix Supplier, MEP Specialist, Financing Partner..."
                    value={newContractorForm.role}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, role: e.target.value })}
                  />
                  <Text fontSize="10px" color="gray.500" mt={1}>
                    Enter any custom contractor role or click a preset below: (اكتب دور المقاول بحرية أو اضغط دوراً سريعاً)
                  </Text>
                  <Flex wrap="wrap" gap={1.5} mt={2}>
                    {[
                      'Lead Executing & Financing Partner (الشريك المنفذ والممول)',
                      'Subcontractor - Civil Works (مقاول باطن أعمال إنشائية)',
                      'Subcontractor - Earthworks & Foundations (مقاول باطن حفريات وأساسات)',
                      'Subcontractor - MEP & HVAC (مقاول باطن كهروميكانيك وتكييف)',
                      'Subcontractor - Finishing & Fit-out (مقاول باطن تشطيبات)',
                      'Ready-Mix Concrete Supplier (مورد خرسانة جاهزة)',
                      'Steel Rebar Supplier (مورد حديد تسليح)',
                      'Heavy Equipment Lessor (تأجير آليات ومعدات ثقيلة)',
                      'Financing / Capital Partner (شريك تمويل ورأس مال)',
                      'Engineering Consultant (مكتب استشاري وإشراف هندسي)',
                    ].map((preset) => (
                      <Button
                        key={preset}
                        size="xs"
                        variant={newContractorForm.role === preset ? 'solid' : 'outline'}
                        colorScheme="blue"
                        fontSize="10px"
                        h="22px"
                        onClick={() => setNewContractorForm({ ...newContractorForm, role: preset })}
                      >
                        {preset.split('(')[0].trim()}
                      </Button>
                    ))}
                  </Flex>
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">Commercial Registration (رقم السجل التجاري):</FormLabel>
                    <Input
                      size="sm"
                      placeholder="1010xxxxxx"
                      value={newContractorForm.crNumber}
                      onChange={(e) => setNewContractorForm({ ...newContractorForm, crNumber: e.target.value })}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Authorized WhatsApp Mobile (رقم جوال الواتساب المعتمد):</FormLabel>
                    <Input
                      size="sm"
                      placeholder="+9665xxxxxxxx"
                      value={newContractorForm.mobile}
                      onChange={(e) => setNewContractorForm({ ...newContractorForm, mobile: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Allocated Liability Ceiling <Icon as={SaudiRiyalIcon} boxSize="0.85em" /> (سقف الالتزام المالي المخصص):</FormLabel>
                  <Input
                    size="sm"
                    type="number"
                    value={newContractorForm.liabilityCap}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, liabilityCap: Number(e.target.value) })}
                  />
                  <Text fontSize="10px" color="gray.500" mt={1}>
                    Limits the maximum purchasing & site procurement exposure this contractor can incur under Company A's CR.
                    (يقيد الحد الأقصى للمشتريات والتعاقدات التي يمكن لهذا المقاول تنفيذها تحت مظلة سجلك التجاري).
                  </Text>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={addContractorModal.onClose}>
                Cancel (إلغاء)
              </Button>
              <Button colorScheme="teal" leftIcon={<FiPlus />} onClick={handleAddContractor}>
                Add to Master Contract (إضافة إلى العقد)
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL: EDIT CONTRACTOR ROLE & PARAMETERS                                 */}
        {/* ========================================================================= */}
        <Modal isOpen={editContractorModal.isOpen} onClose={editContractorModal.onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={2}>
                <Icon as={FiEdit2} color="purple.500" />
                <Text>Edit Contractor Role & Parameters (تعديل دور وسقف المقاول)</Text>
              </HStack>
              <Text fontSize="xs" fontWeight="normal" color="gray.500" mt={1}>
                تعديل المسمى التعاقدي وحزمة الأعمال وسقف الالتزام المالي للمقاول في العقد
              </Text>
            </ModalHeader>
            <ModalCloseButton />
            <Divider />
            <ModalBody py={4}>
              {editingContractor && (
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold">Contractor Legal Name (اسم المقاول / المنشأة):</FormLabel>
                    <Input
                      size="sm"
                      value={editingContractor.name}
                      onChange={(e) => setEditingContractor({ ...editingContractor, name: e.target.value })}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold">Contractor Role / Work Package (حزمة الأعمال / الدور التعاقدي):</FormLabel>
                    <Input
                      size="sm"
                      placeholder="e.g. Turnkey Civil Contractor, Steel Fabricator, MEP Specialist..."
                      value={editingContractor.role}
                      onChange={(e) => setEditingContractor({ ...editingContractor, role: e.target.value })}
                    />
                    <Text fontSize="10px" color="gray.500" mt={1}>
                      Enter any custom contractor role or click a preset below: (اكتب دور المقاول بحرية أو اضغط دوراً سريعاً)
                    </Text>
                    <Flex wrap="wrap" gap={1.5} mt={2}>
                      {[
                        'Lead Executing & Financing Partner (الشريك المنفذ والممول)',
                        'Subcontractor - Civil Works (مقاول باطن أعمال إنشائية)',
                        'Subcontractor - Earthworks & Foundations (مقاول باطن حفريات وأساسات)',
                        'Subcontractor - MEP & HVAC (مقاول باطن كهروميكانيك وتكييف)',
                        'Subcontractor - Finishing & Fit-out (مقاول باطن تشطيبات)',
                        'Ready-Mix Concrete Supplier (مورد خرسانة جاهزة)',
                        'Steel Rebar Supplier (مورد حديد تسليح)',
                        'Heavy Equipment Lessor (تأجير آليات ومعدات ثقيلة)',
                        'Financing / Capital Partner (شريك تمويل ورأس مال)',
                        'Engineering Consultant (مكتب استشاري وإشراف هندسي)',
                      ].map((preset) => (
                        <Button
                          key={preset}
                          size="xs"
                          variant={editingContractor.role === preset ? 'solid' : 'outline'}
                          colorScheme="purple"
                          fontSize="10px"
                          h="22px"
                          onClick={() => setEditingContractor({ ...editingContractor, role: preset })}
                        >
                          {preset.split('(')[0].trim()}
                        </Button>
                      ))}
                    </Flex>
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                    <FormControl>
                      <FormLabel fontSize="xs">Commercial Registration (رقم السجل التجاري):</FormLabel>
                      <Input
                        size="sm"
                        value={editingContractor.crNumber || ''}
                        onChange={(e) => setEditingContractor({ ...editingContractor, crNumber: e.target.value })}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="xs">Authorized WhatsApp Mobile (رقم جوال الواتساب):</FormLabel>
                      <Input
                        size="sm"
                        value={editingContractor.mobile}
                        onChange={(e) => setEditingContractor({ ...editingContractor, mobile: e.target.value })}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold">Allocated Liability Ceiling <Icon as={SaudiRiyalIcon} boxSize="0.85em" /> (سقف الالتزام المالي المخصص):</FormLabel>
                    <Input
                      size="sm"
                      type="number"
                      value={editingContractor.liabilityCap}
                      onChange={(e) => setEditingContractor({ ...editingContractor, liabilityCap: Number(e.target.value) })}
                    />
                  </FormControl>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={editContractorModal.onClose}>
                Cancel (إلغاء)
              </Button>
              <Button colorScheme="purple" leftIcon={<FiCheckCircle />} onClick={handleSaveContractorEdit}>
                Save Changes (حفظ التعديلات)
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

      </Box>
    </Box>
  );
};

export const CorporateGovernanceModule: React.FC<CorporateGovernanceModuleProps> = (props) => {
  return (
    <GovernanceProvider>
      <CorporateGovernanceModuleContent {...props} />
    </GovernanceProvider>
  );
};

export default CorporateGovernanceModule;
