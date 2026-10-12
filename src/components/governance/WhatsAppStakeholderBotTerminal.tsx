import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  useToast,
  useColorModeValue,
  Tag,
  Tooltip,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FiSend,
  FiCheckCircle,
  FiShield,
  FiUsers,
  FiFileText,
  FiAlertTriangle,
  FiAward,
  FiUserCheck,
  FiCopy,
  FiPlus,
  FiClock,
  FiCheck,
  FiEye,
  FiActivity,
  FiExternalLink,
  FiEdit2,
  FiTrash2,
  FiCheckSquare,
  FiUpload,
  FiPaperclip,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { SaudiRiyalIcon } from '../icons/SaudiRiyalIcon';
import { useGovernance, StakeholderProfile } from './GovernanceContext';

interface WhatsAppStakeholderBotTerminalProps {
  organizationId?: string;
  userId?: string;
}

export const WhatsAppStakeholderBotTerminal: React.FC<WhatsAppStakeholderBotTerminalProps> = () => {
  const {
    stakeholders,
    addStakeholder,
    updateStakeholder,
    deleteStakeholder,
    brandPassports,
    whatsAppLogs,
    dispatchWhatsAppNotice,
    acceptRiskPassport,
    recordBilateralTransaction,
  } = useGovernance();

  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const chatBubbleBg = useColorModeValue('#DCF8C6', '#056162'); // WhatsApp green bubble
  const chatContainerBg = useColorModeValue('#E5DDD5', '#121B22'); // WhatsApp chat background
  const textColor = useColorModeValue('gray.800', 'white');

  // Modals
  const addStakeholderModal = useDisclosure();
  const editStakeholderModal = useDisclosure();
  const acceptRiskModal = useDisclosure();
  const submitSlipModal = useDisclosure();

  // Partner Slip Submission State (Mobile Bot Simulation)
  const [partnerSlipForm, setPartnerSlipForm] = useState({
    vendor_name: '',
    po_number: '',
    amount_excl_vat: 0,
    transfer_ref: '',
    slip_attachment_name: '',
    description: '',
    paying_org: 'Gulf Heavy Machinery LLC (Partner B)',
  });

  // Active Stakeholder Persona View (for Interactive Live Portal simulation)
  const [activePersonaId, setActivePersonaId] = useState<string>(stakeholders[2]?.id || 'stk_3'); // default to MEP Partner C who has pending acceptance

  // State for Notice Dispatcher Form
  const [selectedTemplate, setSelectedTemplate] = useState<string>('cr_risk_acceptance');
  const [selectedProject, setSelectedProject] = useState<string>('Riyadh Logistics Park Phase 2');
  const [targetPartnerOrg, setTargetPartnerOrg] = useState<string>('RedSea MEP Works (Partner C / شريك الكهروميكانيك)');
  const [liabilityCapSar, setLiabilityCapSar] = useState<number>(800000);
  const [scopeDetails, setScopeDetails] = useState<string>('Procurement of High-Voltage Cables, Transformers & Electrical Switchgear under Company A name');
  const [vendorName, setVendorName] = useState<string>('Saudi Ready-Mix Concrete Co.');
  const [paymentAmount, setPaymentAmount] = useState<number>(115000);
  const [vatAmount, setVatAmount] = useState<number>(15000);
  const [transferRef, setTransferRef] = useState<string>('ANB-982144-X');
  const [paidByOrg, setPaidByOrg] = useState<string>('Gulf Heavy Machinery LLC (Partner B)');
  const [poNumber, setPoNumber] = useState<string>('PO-A-2026-089');

  // Selected Stakeholders for Dispatch (IDs)
  const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<string[]>(
    stakeholders.map((s) => s.id)
  );

  // Acceptance Modal State
  const [targetPassportForAcceptance, setTargetPassportForAcceptance] = useState<any>(null);
  const [signatoryName, setSignatoryName] = useState<string>('Mr. Youssef El-Sayed (أ. يوسف السيد)');
  const [confirmSoleIndemnity, setConfirmSoleIndemnity] = useState<boolean>(false);

  // New Stakeholder Form State
  const [newStkName, setNewStkName] = useState('');
  const [newStkNameAr, setNewStkNameAr] = useState('');
  const [newStkCompany, setNewStkCompany] = useState('');
  const [newStkRole, setNewStkRole] = useState<'lead_cr_holder' | 'execution_partner' | 'mep_partner' | 'investor' | 'finance_lead'>('execution_partner');
  const [newStkPhone, setNewStkPhone] = useState('+9665');
  const [newStkIsSaudi, setNewStkIsSaudi] = useState(false);
  const [newStkNationalId, setNewStkNationalId] = useState('');
  const [newStkTier, setNewStkTier] = useState<'all_alerts' | 'high_value_only' | 'milestones_only'>('all_alerts');

  // Edit Stakeholder Form State
  const [editingStakeholder, setEditingStakeholder] = useState<StakeholderProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameAr, setEditNameAr] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editRole, setEditRole] = useState<'lead_cr_holder' | 'execution_partner' | 'mep_partner' | 'investor' | 'finance_lead'>('execution_partner');
  const [editPhone, setEditPhone] = useState('');
  const [editIsSaudi, setEditIsSaudi] = useState(false);
  const [editNationalId, setEditNationalId] = useState('');
  const [editTier, setEditTier] = useState<'all_alerts' | 'high_value_only' | 'milestones_only'>('all_alerts');

  // Find active persona object
  const activePersona = stakeholders.find((s) => s.id === activePersonaId) || stakeholders[0];

  // Helper to format currency
  const formatSAR = (amount: number) => {
    return `${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 }).format(amount)} \uE900`;
  };

  // Build the Message Body dynamically
  const generateMessageBody = (): string => {
    if (selectedTemplate === 'cr_risk_acceptance') {
      return `*🛡️ [نظام الحوكمة الرقمي / Digital Governance System]*
*طلب تفويض استخدام السجل التجاري والاسم التجاري وإقرار المخاطر*
*(CR & Brand Name Usage Authorization & Sole Indemnity Agreement)*
-----------------------------------
*المشروع / Project:* ${selectedProject}
*الجهة المفوضة / Authorized Partner:* ${targetPartnerOrg}
*سقف الالتزام المالي الأقصى:* ${formatSAR(liabilityCapSar)}
*نطاق الاستخدام المصرح به:* ${scopeDetails}

📋 *قائمة البنود والالتزامات المتفق عليها (Agreed Checklist):*
☑️ 1. سقف الالتزام المالي: محدد بـ ${formatSAR(liabilityCapSar)} كحد أقصى للتعاقد
☑️ 2. نطاق العمل المصرح: مقيد حصرياً بـ (${scopeDetails})
☑️ 3. الضامن الوحيد (Sole Indemnifier): يتحمل الشريك المنفذ المسؤولية المالية والقانونية والعمالية والضريبية بنسبة 100% ويبرئ ذمة المالك السعودي للشركة (أ) تماماً
☑️ 4. حظر نافذ (Nafith Ban): يُحظر قطعيًا إصدار أو التوقيع على أي سند لأمر عبر منصة نافذ باسم شركة (أ) دون موافقة كتابية صريحة
☑️ 5. التوثيق البنكي والضريبي (24h SLA): إلزامية تزويد الإدارة المالية بإشعارات التحويل البنكي وفواتير ضريبة المدخلات (15% ZATCA VAT) خلال 24 ساعة من أي سداد

*رابط الاعتماد الرقمي المباشر:*
https://erp.local/governance/accept-risk?token=tok_acc_live_${Date.now().toString().slice(-4)}
-----------------------------------
*يُعد الاعتماد دليلاً رقمياً ملزماً وفق نظام الإثبات السعودي (المرسوم م/43).*`;
    }

    if (selectedTemplate === 'payment_on_behalf') {
      return `*🟢 [إشعار سداد مورد معتمد / Supplier Payment Notification]*
-----------------------------------
*المشروع / Project:* ${selectedProject}
*المورد / Vendor:* ${vendorName}
*رقم أمر الشراء / PO Ref:* ${poNumber} *(تحت اسم شركة أ)*
*المبلغ المسدد / Amount Paid:* ${formatSAR(paymentAmount)} *(شامل ${formatSAR(vatAmount)} ضريبة)*
*الجهة المسددة / Paid By:* ${paidByOrg}
*مرجع التحويل البنكي / Bank Ref:* #${transferRef}
*الأثر الضريبي والزكوي:* توثيق رصيد ضريبة مدخلات (Input VAT) مخصوم لصالح شركة أ.
-----------------------------------
*إشعار آلي مجدول لحفظ حقوق الشركاء والشفافية التامة.*`;
    }

    if (selectedTemplate === 'nafith_alert') {
      return `*⚠️ [تنبيه منصة نافذ الحرج / Urgent Nafith Notice Alert]*
-----------------------------------
*المشروع / Project:* ${selectedProject}
*الجهة الطالبة / Creditor:* Al-Yamamah Ready Mix Concrete
*المبلغ المطالب به:* 145,000 \uE900
*المهلة النظامية:* 5 أيام قبل الإحالة لمحكمة التنفيذ
*الإجراء المتخذ:* تم توجيه الشريك التنفيذي (شركة ب) بالسداد الفوري وتزويد المالك بإشعار التحويل البنكي لحماية السجل وحسابات المالك.
-----------------------------------
*نظام الحماية والإنذار المبكر للسجل التجاري.*`;
    }

    if (selectedTemplate === 'client_milestone') {
      return `*💰 [تحصيل دفعة عميل وتوزيع المستحقات / Client Milestone Received]*
-----------------------------------
*المشروع / Project:* ${selectedProject}
*المستخلص المعتمد / IPC Ref:* IPC-003 (دفعة الإنجاز المرحلية)
*المبلغ المحصل في البنك:* 1,500,000 \uE900

*شلال توزيع المستحقات المالي:*
1. ضريبة القيمة المضافة المحتجزة لهيئة الزكاة: 195,000 \uE900
2. سداد التسهيلات البنكية (أولوية سداد أولى): 300,000 \uE900
3. استرداد مصاريف الشريك التنفيذي (شركة ب): 650,000 \uE900
4. صافي الأرباح الجاهزة للتحويل للشركاء: 355,000 \uE900
-----------------------------------
*الحسابات مطابقة وجاهزة للصرف.*`;
    }

    if (selectedTemplate === 'sanad_request_by_partner') {
      return `*📝 [طلب إصدار سند لأمر رسمي من الشريك / Promissory Note Request via Partner]*
-----------------------------------
*المشروع / Project:* ${selectedProject}
*الجهة الطالبة / Requesting Partner:* ${targetPartnerOrg}
*المورد المستفيد / Beneficiary Vendor:* ${vendorName}
*قيمة السند المطلوبة:* ${formatSAR(paymentAmount)}
*أمر الشراء المرتبط / PO Ref:* ${poNumber}

⚠️ *شرط الحوكمة والأمان الإلزامي (Mandatory Legal Pre-requisite):*
يُشترط قبل توقيع شركة (أ) على منصة نافذ، استلام "سند لأمر مضاد وحصري" (Back-to-Back Counter-Sanad) صادر من الشريك المنفذ ${targetPartnerOrg} لصالح شركة (أ) بنفس القيمة لضمان عدم تحميل المالك السعودي أي التزام مالي شخصي.

*خيارات الرد الفوري من الشريك:*
1️⃣ [موافق وأتعهد بإصدار السند المضاد فوراً / Confirm & Counter-Guarantee]
2️⃣ [إلغاء الطلب والسداد نقداً / Cancel & Pay Cash]
-----------------------------------
*طلب آلي عبر بوت واتساب حوكمة التحالف المعتمد.*`;
    }

    if (selectedTemplate === 'submit_procurement_slip_by_partner') {
      const calcVat = vatAmount || paymentAmount * 0.15;
      const totalWire = paymentAmount + calcVat;
      return `*🧾 [تقديم إشعار سداد مورد وفاتورة ضريبية من الشريك / Partner Procurement Slip Submission]*
-----------------------------------
*المشروع / Project:* ${selectedProject}
*الشريك المسدد / Submitting Partner:* ${paidByOrg || targetPartnerOrg}
*المورد المستفيد / Beneficiary Vendor:* ${vendorName}
*رقم أمر الشراء / PO Ref under Co. A:* ${poNumber}
*المبلغ قبل الضريبة / Excl. VAT:* ${formatSAR(paymentAmount)}
*ضريبة القيمة المضافة / 15% ZATCA VAT:* ${formatSAR(calcVat)}
*إجمالي الحوالة المسددة:* ${formatSAR(totalWire)}
*مرجع الحوالة البنكية / Wire Transfer Ref:* #${transferRef}
📎 *مرفق إشعار التحويل وفاتورة المورد:* تم إرفاق صورة السداد والفاتورة الضريبية رسمياً

⚖️ *الأثر المالي والنظامي (Financial & ZATCA Impact):*
1. توثيق حق الشريك المنفذ في استرداد كامل المبلغ عند تحصيل دفعة العميل.
2. ترحيل رصيد ضريبة المدخلات (15% Input VAT) فوراً لحساب شركة (أ) لحمايتها في الإقرار الزكوي والضريبي القادم.
-----------------------------------
*تم الرفع والتوثيق آلياً عبر بوت واتساب حوكمة التحالف.*`;
    }

    return `*📊 [التقرير المالي الأسبوعي للتحالف / Weekly Consortium Digest]*
-----------------------------------
*المشروع / Project:* ${selectedProject}
*الفترة:* الأسبوع المنتهي في 29 سبتمبر 2026
• إجمالي المصاريف المسددة من الشركاء: 435,000 \uE900
• رصيد فواتير المشتريات المعلقة: 0.00 \uE900
• إجمالي رصيد ضريبة القيمة المضافة الموثق: 65,250 \uE900
• حالة المنصات الحكومية (نافذ / قوى / الزكاة): 🟢 سليمة بالكامل (لا توجد مطالبات)
• صافي رصيد المقاصة المستحق للشريك المنفذ: 320,000 \uE900
-----------------------------------
*تم توليد هذا التقرير آلياً عبر بوت حوكمة التحالف.*`;
  };

  const currentMessageBody = generateMessageBody();

  // Dispatch via Bot Simulation & Log
  const handleSimulateDispatch = () => {
    if (selectedStakeholderIds.length === 0) {
      toast({
        title: 'يرجى اختيار شريك واحد على الأقل',
        description: 'Please select at least one stakeholder recipient.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const recipients = stakeholders
      .filter((s) => selectedStakeholderIds.includes(s.id))
      .map((s) => ({
        stakeholder_id: s.id,
        name: s.name,
        phone: s.phone,
        status: 'delivered' as const,
      }));

    dispatchWhatsAppNotice({
      notice_type: selectedTemplate as any,
      title:
        selectedTemplate === 'cr_risk_acceptance'
          ? 'طلب تفويض استخدام السجل وإقرار الضامن الوحيد'
          : selectedTemplate === 'payment_on_behalf'
          ? 'إشعار سداد مورد معتمد وإثبات الضريبة'
          : selectedTemplate === 'nafith_alert'
          ? 'إشعار منصة نافذ الحرج'
          : selectedTemplate === 'client_milestone'
          ? 'تحصيل دفعة عميل وشلال التوزيع'
          : selectedTemplate === 'sanad_request_by_partner'
          ? 'طلب إصدار سند لأمر وضمان مضاد من الشريك'
          : selectedTemplate === 'submit_procurement_slip_by_partner'
          ? 'إشعار سداد مورد وفاتورة ضريبية من الشريك'
          : 'التقرير المالي الأسبوعي للتحالف',
      project_name: selectedProject,
      recipients,
      message_body: currentMessageBody,
      requires_risk_acceptance: selectedTemplate === 'cr_risk_acceptance',
      acceptance_status: selectedTemplate === 'cr_risk_acceptance' ? 'pending' : undefined,
      related_entity_id: selectedTemplate === 'cr_risk_acceptance' ? 'pass_3' : undefined,
    });

    toast({
      title: 'تم إرسال وتوثيق الإشعار بنجاح',
      description: `Dispatched to ${recipients.length} stakeholders via Governance Bot.`,
      status: 'success',
      duration: 4000,
      isClosable: true,
    });
  };

  // Partner Submit Procurement Slip via Bot
  const handleSubmitPartnerSlip = () => {
    if (!partnerSlipForm.vendor_name.trim()) {
      toast({
        title: 'اسم المورد مطلوب',
        description: 'Please enter the vendor / supplier name.',
        status: 'warning',
      });
      return;
    }
    if (!partnerSlipForm.amount_excl_vat || partnerSlipForm.amount_excl_vat <= 0) {
      toast({
        title: 'المبلغ غير صحيح',
        description: 'Please enter a valid amount greater than 0.',
        status: 'warning',
      });
      return;
    }
    if (!partnerSlipForm.transfer_ref.trim()) {
      toast({
        title: 'رقم مرجع الحوالة مطلوب',
        description: 'Bank transfer reference # is required for proof of payment.',
        status: 'warning',
      });
      return;
    }

    const calculatedVat = Math.round(partnerSlipForm.amount_excl_vat * 0.15 * 100) / 100;
    const totalAmountVal = Math.round((partnerSlipForm.amount_excl_vat + calculatedVat) * 100) / 100;

    recordBilateralTransaction({
      debtor: 'Your Company',
      creditor: 'Partner Company',
      debtor_name: 'Apex Infrastructure Co. (Your Company / Lead CR)',
      creditor_name: partnerSlipForm.paying_org || activePersona.company_name || 'Gulf Heavy Machinery LLC (Partner B)',
      transaction_type: 'Direct Vendor Procurement (سداد مشتريات مورد)',
      description: partnerSlipForm.description || `Procurement from ${partnerSlipForm.vendor_name} under PO ${partnerSlipForm.po_number || 'N/A'}`,
      amount_excl_vat: partnerSlipForm.amount_excl_vat,
      vat_amount: calculatedVat,
      total_amount: totalAmountVal,
      vendor_name: partnerSlipForm.vendor_name,
      transfer_ref: partnerSlipForm.transfer_ref,
      po_ref: partnerSlipForm.po_number,
      slip_attachment_name: partnerSlipForm.slip_attachment_name || undefined,
      submitted_via: 'whatsapp_bot',
      transaction_date: new Date().toISOString().split('T')[0],
    });

    submitSlipModal.onClose();
    setPartnerSlipForm({
      vendor_name: '',
      po_number: '',
      amount_excl_vat: 0,
      transfer_ref: '',
      slip_attachment_name: '',
      description: '',
      paying_org: 'Gulf Heavy Machinery LLC (Partner B)',
    });

    toast({
      title: '✅ تم استلام إشعار سداد المورد وتوثيقه بالبوت',
      description: `Logged ${totalAmountVal.toLocaleString()} \uE900 via WhatsApp Bot. Linked to Step 4 & 15% ZATCA VAT credit registered.`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  // Open Direct WhatsApp Link (wa.me)
  const handleOpenWhatsAppWeb = (recipientPhone?: string) => {
    const phoneToUse = recipientPhone || (selectedStakeholderIds.length === 1
      ? stakeholders.find((s) => s.id === selectedStakeholderIds[0])?.phone
      : '');

    const cleanPhone = (phoneToUse || '').replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(currentMessageBody);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(url, '_blank');
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(currentMessageBody);
    toast({
      title: 'تم نسخ نص الرسالة',
      description: 'WhatsApp message text copied to clipboard.',
      status: 'info',
      duration: 2500,
      isClosable: true,
    });
  };

  // Save new stakeholder
  const handleCreateStakeholder = () => {
    if (!newStkName.trim() || !newStkPhone.trim()) {
      toast({
        title: 'بيانات غير مكتملة',
        description: 'Name and Phone number are required.',
        status: 'error',
      });
      return;
    }

    addStakeholder({
      name: newStkName,
      nameAr: newStkNameAr || newStkName,
      company_name: newStkCompany || 'Consortium Partner',
      company_role: newStkRole,
      phone: newStkPhone,
      is_saudi_national: newStkIsSaudi,
      national_id: newStkNationalId,
      notification_tier: newStkTier,
      is_active: true,
    });

    addStakeholderModal.onClose();
    setNewStkName('');
    setNewStkNameAr('');
    setNewStkCompany('');
    setNewStkPhone('+9665');
    setNewStkNationalId('');

    toast({
      title: 'تمت إضافة الشريك بنجاح',
      description: 'Stakeholder added to WhatsApp dispatch directory.',
      status: 'success',
    });
  };

  // Open Edit Modal for a Stakeholder
  const handleOpenEditModal = (stk: StakeholderProfile) => {
    setEditingStakeholder(stk);
    setEditName(stk.name);
    setEditNameAr(stk.nameAr || stk.name);
    setEditCompany(stk.company_name);
    setEditRole(stk.company_role);
    setEditPhone(stk.phone);
    setEditIsSaudi(stk.is_saudi_national);
    setEditNationalId(stk.national_id || '');
    setEditTier(stk.notification_tier);
    editStakeholderModal.onOpen();
  };

  // Save Stakeholder Edits
  const handleSaveEdit = () => {
    if (!editingStakeholder) return;
    if (!editName.trim() || !editPhone.trim()) {
      toast({
        title: 'بيانات غير مكتملة',
        description: 'Name and Phone number are required.',
        status: 'error',
      });
      return;
    }

    updateStakeholder(editingStakeholder.id, {
      name: editName,
      nameAr: editNameAr,
      company_name: editCompany,
      company_role: editRole,
      phone: editPhone,
      is_saudi_national: editIsSaudi,
      national_id: editNationalId,
      notification_tier: editTier,
    });

    editStakeholderModal.onClose();
    setEditingStakeholder(null);

    toast({
      title: 'تم تحديث بيانات الشريك بنجاح',
      description: 'Stakeholder profile and WhatsApp mobile updated.',
      status: 'success',
    });
  };

  // Delete Stakeholder
  const handleDeleteStakeholder = (id: string, name: string) => {
    if (stakeholders.length <= 1) {
      toast({
        title: 'لا يمكن حذف كافة الشركاء',
        description: 'At least one stakeholder must remain in the consortium.',
        status: 'warning',
      });
      return;
    }

    deleteStakeholder(id);
    toast({
      title: 'تم حذف الشريك من الدليل',
      description: `Removed ${name} from WhatsApp directory.`,
      status: 'info',
    });
  };

  // Execute Electronic Risk Acceptance
  const handleConfirmAcceptance = () => {
    if (!confirmSoleIndemnity) {
      toast({
        title: 'يجب تأكيد الإقرار بالضامن الوحيد',
        description: 'You must check the sole indemnification confirmation box.',
        status: 'warning',
      });
      return;
    }

    const passportCode = targetPassportForAcceptance?.passport_code || 'AUTH-2026-0099';
    acceptRiskPassport(passportCode, signatoryName);

    acceptRiskModal.onClose();
    setConfirmSoleIndemnity(false);

    toast({
      title: 'تم اعتماد إقرار المخاطر رسمياً وتوثيقه',
      description: 'CR Risk Passport activated. Confirmation WhatsApp alert dispatched to the Saudi Owner.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  // Open acceptance modal for specific passport
  const handleOpenAcceptanceModal = (passport: any) => {
    setTargetPassportForAcceptance(passport);
    setSignatoryName(
      passport.granted_to_org?.includes('RedSea')
        ? 'Mr. Youssef El-Sayed (أ. يوسف السيد)'
        : 'Eng. Tariq Mansoor (م. طارق منصور)'
    );
    acceptRiskModal.onOpen();
  };

  // Direct 1-Tap Accept from the Live Portal Feed
  const handleDirectPortalAccept = (passportCode: string, partnerName: string) => {
    acceptRiskPassport(passportCode, partnerName);
    toast({
      title: '✅ تم اعتماد الإقرار وتحمل المسؤولية الحصرية فورا',
      description: `Risk Passport #${passportCode} accepted by ${partnerName}. Saudi CR Owner notified on WhatsApp.`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box>
      {/* Top Header & Automated Bot Engine Status Card */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm" mb={6}>
        <CardBody p={5}>
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <HStack spacing={3.5}>
              <Box p={3} bg="green.500" color="white" rounded="xl" shadow="md">
                <FaWhatsapp size={32} />
              </Box>
              <Box>
                <HStack spacing={2} mb={1}>
                  <Text fontWeight="extrabold" fontSize="lg" color={textColor}>
                    Consortium WhatsApp Bot & Interactive Stakeholder Portal
                  </Text>
                  <Badge colorScheme="green" variant="solid" fontSize="11px" px={2} py={0.5}>
                    منظومة بوت الواتساب وبوابة الشركاء
                  </Badge>
                </HStack>
                <HStack spacing={2}>
                  <Badge colorScheme="teal" variant="subtle" fontSize="10px">
                    ● AUTO-TRIGGER ENGINE: ACTIVE
                  </Badge>
                  <Text fontSize="xs" color="gray.500">
                    All ERP payments, Nafith alerts & CR passes trigger real-time WhatsApp updates with one-tap digital acceptance.
                  </Text>
                </HStack>
              </Box>
            </HStack>

            <HStack spacing={2.5}>
              <Button
                size="sm"
                colorScheme="green"
                leftIcon={<FiPlus />}
                onClick={addStakeholderModal.onOpen}
              >
                Add Stakeholder (إضافة شريك)
              </Button>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Main Terminal Tabs */}
      <Tabs variant="enclosed" colorScheme="green">
        <TabList mb={4} borderBottomWidth="1px" borderColor={borderColor}>
          {/* TAB 1: INTERACTIVE STAKEHOLDER PORTAL & ONE-TAP ACCEPTANCE */}
          <Tab fontWeight="bold" fontSize="xs">
            <HStack spacing={2}>
              <FiEye color="#2B6CB0" />
              <Text>1. Stakeholder Live Portal & Approvals (بوابة الشركاء التفاعلية والاعتماد)</Text>
              {brandPassports.some((p) => p.status === 'pending_acceptance') && (
                <Badge colorScheme="red" rounded="full" fontSize="10px" px={1.5}>
                  1 Action Required
                </Badge>
              )}
            </HStack>
          </Tab>

          {/* TAB 2: MANUAL DISPATCHER & SMARTPHONE PREVIEW */}
          <Tab fontWeight="bold" fontSize="xs">
            <HStack spacing={2}>
              <FiSend />
              <Text>2. Notice Dispatcher & Bot Simulator (محرر الإشعارات والمعاينة)</Text>
            </HStack>
          </Tab>

          {/* TAB 3: CR RISK PASSPORTS & SOLE INDEMNITY REGISTER */}
          <Tab fontWeight="bold" fontSize="xs">
            <HStack spacing={2}>
              <FiAward />
              <Text>3. CR Risk Passports (سجل تفويضات السجل والضامن الوحيد)</Text>
            </HStack>
          </Tab>

          {/* TAB 4: MULTI-STAKEHOLDER DIRECTORY */}
          <Tab fontWeight="bold" fontSize="xs">
            <HStack spacing={2}>
              <FiUsers />
              <Text>4. Multi-Stakeholder Directory (دليل الشركاء وأرقام التواصل)</Text>
              <Badge colorScheme="gray" rounded="full" fontSize="10px" px={1.5}>
                {stakeholders.length}
              </Badge>
            </HStack>
          </Tab>

          {/* TAB 5: DELIVERY AUDIT TRAIL */}
          <Tab fontWeight="bold" fontSize="xs">
            <HStack spacing={2}>
              <FiClock />
              <Text>5. Delivery Audit Trail (سجل الإشعارات المؤرخة)</Text>
              <Badge colorScheme="blue" rounded="full" fontSize="10px" px={1.5}>
                {whatsAppLogs.length}
              </Badge>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* TAB 1: INTERACTIVE STAKEHOLDER LIVE PORTAL */}
          <TabPanel p={0}>
            {/* Persona Switcher Banner */}
            <Card bg={useColorModeValue('blue.50', 'gray.850')} borderWidth="1.5px" borderColor="blue.300" shadow="sm" mb={6}>
              <CardBody p={4}>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                  <Box>
                    <HStack spacing={2} mb={1}>
                      <Badge colorScheme="blue" fontSize="11px">
                        📱 STAKEHOLDER PORTAL SIMULATOR
                      </Badge>
                      <Text fontWeight="extrabold" fontSize="sm">
                        Simulate Stakeholder Mobile View (معاينة تجربة الشريك على جواله):
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.600">
                      Switch between partners to see how they receive automated WhatsApp notifications and accept legal liabilities:
                    </Text>
                  </Box>

                  <HStack spacing={2} flexWrap="wrap">
                    {stakeholders.map((s) => {
                      const isSelected = s.id === activePersonaId;
                      return (
                        <Button
                          key={s.id}
                          size="xs"
                          variant={isSelected ? 'solid' : 'outline'}
                          colorScheme={
                            s.is_saudi_national
                              ? 'green'
                              : s.company_role === 'execution_partner'
                              ? 'blue'
                              : s.company_role === 'mep_partner'
                              ? 'purple'
                              : 'gray'
                          }
                          onClick={() => setActivePersonaId(s.id)}
                        >
                          {s.is_saudi_national ? '🇸🇦 ' : ''}{s.name.split(' ')[0]} ({s.company_role.toUpperCase()})
                        </Button>
                      );
                    })}
                  </HStack>
                </Flex>
              </CardBody>
            </Card>

            {/* Active Stakeholder View Card */}
            <SimpleGrid columns={{ base: 1, lg: 12 }} gap={6} mb={6}>
              {/* Left Column: Stakeholder Profile & Role Context (4 cols) */}
              <Box gridColumn={{ base: 'span 12', lg: 'span 4' }}>
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
                  <CardHeader pb={2}>
                    <HStack spacing={2}>
                      <Icon as={FiUsers} color="blue.500" />
                      <Text fontWeight="bold" fontSize="sm">
                        Active Stakeholder (الشريك الحالي)
                      </Text>
                    </HStack>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      <Box p={3} bg={useColorModeValue('gray.50', 'gray.750')} rounded="lg">
                        <HStack justify="space-between" mb={1}>
                          <Text fontWeight="bold" fontSize="sm">{activePersona.name}</Text>
                          {activePersona.is_saudi_national && (
                            <Badge colorScheme="green" fontSize="9px">
                              🇸🇦 Saudi CR Owner
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="11px" color="gray.500">{activePersona.nameAr}</Text>
                        <Divider my={2} />
                        <HStack justify="space-between" fontSize="11px">
                          <Text color="gray.500">Company:</Text>
                          <Text fontWeight="bold">{activePersona.company_name}</Text>
                        </HStack>
                        <HStack justify="space-between" fontSize="11px" mt={1}>
                          <Text color="gray.500">Role:</Text>
                          <Badge colorScheme="blue" fontSize="9px">{activePersona.company_role.toUpperCase()}</Badge>
                        </HStack>
                        <HStack justify="space-between" fontSize="11px" mt={1}>
                          <Text color="gray.500">WhatsApp Mobile:</Text>
                          <Text fontWeight="mono" color="green.600">{activePersona.phone}</Text>
                        </HStack>

                        <Button
                          size="xs"
                          leftIcon={<FiEdit2 />}
                          colorScheme="blue"
                          variant="outline"
                          w="full"
                          mt={2.5}
                          onClick={() => handleOpenEditModal(activePersona)}
                        >
                          Edit Details & Mobile (تعديل البيانات والجوال)
                        </Button>
                      </Box>

                      {/* Perspective Summary */}
                      <Box p={3} rounded="lg" borderWidth="1px" borderColor={activePersona.is_saudi_national ? 'green.200' : 'purple.200'} bg={activePersona.is_saudi_national ? useColorModeValue('green.50', 'green.900') : useColorModeValue('purple.50', 'purple.900')}>
                        <Text fontWeight="bold" fontSize="xs" mb={1} color={activePersona.is_saudi_national ? 'green.700' : 'purple.700'}>
                          {activePersona.is_saudi_national ? '🛡️ Protection Summary for Saudi Owner:' : '⚖️ Partner Responsibilities & Scope:'}
                        </Text>
                        <Text fontSize="11px" lineHeight="1.5" color="gray.600">
                          {activePersona.is_saudi_national
                            ? 'All supplier POs and Nafith claims are monitored. Zero personal liability: executing partners sign sole indemnification before using CR.'
                            : 'Authorized to execute work and pay suppliers. Obligated to upload transfer slips within 24h and provide sole indemnity.'}
                        </Text>
                      </Box>

                      {/* Partner Action: Upload Procurement Slip & VAT (Step 4 Bot) */}
                      <Box
                        p={3}
                        bg={useColorModeValue('teal.50', 'teal.900')}
                        rounded="lg"
                        borderWidth="1px"
                        borderColor="teal.300"
                      >
                        <HStack justify="space-between" mb={1.5}>
                          <HStack spacing={1.5}>
                            <Icon as={SaudiRiyalIcon} color="teal.600" />
                            <Text fontWeight="bold" fontSize="xs" color={useColorModeValue('teal.800', 'teal.200')}>
                              Partner Site Procurement & VAT
                            </Text>
                          </HStack>
                          <Badge colorScheme="teal" fontSize="9px">STEP 4 BOT</Badge>
                        </HStack>
                        <Text fontSize="11px" color="gray.600" mb={3}>
                          Simulate partner uploading supplier wire slip & 15% ZATCA tax invoice on behalf of Co. A via WhatsApp:
                        </Text>
                        <Button
                          size="xs"
                          colorScheme="teal"
                          w="full"
                          leftIcon={<FiUpload />}
                          onClick={() => {
                            setPartnerSlipForm((prev) => ({
                              ...prev,
                              paying_org: activePersona.company_name,
                            }));
                            submitSlipModal.onOpen();
                          }}
                        >
                          + Submit Vendor Slip & 15% VAT (إرسال إشعار سداد المورد)
                        </Button>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>

              {/* Right Column: Actions Required & Real-Time WhatsApp Live Feed (8 cols) */}
              <Box gridColumn={{ base: 'span 12', lg: 'span 8' }}>
                {/* 1. Action Required Banner (If Pending Acceptance Exists) */}
                {brandPassports.some((p) => p.status === 'pending_acceptance') && (
                  <Card bg={useColorModeValue('orange.50', 'orange.950')} borderWidth="1.5px" borderColor="orange.400" shadow="md" mb={6}>
                    <CardBody p={4}>
                      <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                        <HStack spacing={3}>
                          <Box p={2.5} bg="orange.500" color="white" rounded="lg">
                            <FiAward size={24} />
                          </Box>
                          <Box>
                            <HStack spacing={2}>
                              <Badge colorScheme="red" variant="solid" fontSize="10px">
                                ACTION REQUIRED • إجراء عاجل مطلوب
                              </Badge>
                              <Text fontWeight="bold" fontSize="sm">
                                CR & Brand Usage Risk Authorization Pending Acceptance
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.600" mt={0.5}>
                              <b>RedSea MEP Works (Partner C)</b>: Authorization pass <b>#AUTH-2026-0099</b> (Max Limit: <b>800,000 \uE900</b>) requires sole indemnifier acceptance.
                            </Text>
                          </Box>
                        </HStack>

                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="purple"
                            leftIcon={<FiCheckCircle />}
                            onClick={() =>
                              handleDirectPortalAccept(
                                'AUTH-2026-0099',
                                'Mr. Youssef El-Sayed (RedSea MEP Works)'
                              )
                            }
                          >
                            One-Tap Accept & Confirm (اعتماد فوري)
                          </Button>
                        </HStack>
                      </Flex>
                    </CardBody>
                  </Card>
                )}

                {/* Agreed Consortium Covenants & Checklist Overview */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm" mb={6}>
                  <CardHeader pb={2}>
                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                      <HStack spacing={2}>
                        <Icon as={FiCheckSquare} color="blue.500" />
                        <Text fontWeight="bold" fontSize="sm">
                          Agreed Consortium Covenants & Checklist (قائمة البنود والالتزامات المتفق عليها بالمشروع)
                        </Text>
                      </HStack>
                      <Badge colorScheme="blue" variant="subtle" fontSize="10px">
                        MUTUALLY BINDING • التزامات ملزمة
                      </Badge>
                    </Flex>
                  </CardHeader>
                  <Divider />
                  <CardBody p={3.5}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={2.5}>
                      <HStack align="flex-start" p={2.5} bg={useColorModeValue('gray.50', 'gray.750')} rounded="md" borderWidth="1px" borderColor={borderColor}>
                        <Icon as={FiCheckCircle} color="green.500" mt={0.5} />
                        <Box fontSize="11px">
                          <Text fontWeight="bold">1. CR Identity & Aramco Code</Text>
                          <Text color="gray.500">سجل شركة (أ) المعتمد للفوترة والعميل</Text>
                        </Box>
                      </HStack>
                      <HStack align="flex-start" p={2.5} bg={useColorModeValue('gray.50', 'gray.750')} rounded="md" borderWidth="1px" borderColor={borderColor}>
                        <Icon as={FiCheckCircle} color="green.500" mt={0.5} />
                        <Box fontSize="11px">
                          <Text fontWeight="bold">2. Financial Liability Ceiling</Text>
                          <Text color="gray.500">سقف الالتزام المالي: 1,500,000 <span className="icon-saudi_riyal" /></Text>
                        </Box>
                      </HStack>
                      <HStack align="flex-start" p={2.5} bg={useColorModeValue('gray.50', 'gray.750')} rounded="md" borderWidth="1px" borderColor={borderColor}>
                        <Icon as={FiCheckCircle} color="green.500" mt={0.5} />
                        <Box fontSize="11px">
                          <Text fontWeight="bold">3. 100% Sole Indemnifier</Text>
                          <Text color="gray.500">الضامن الوحيد: إبراء ذمة المالك السعودي 100%</Text>
                        </Box>
                      </HStack>
                      <HStack align="flex-start" p={2.5} bg={useColorModeValue('gray.50', 'gray.750')} rounded="md" borderWidth="1px" borderColor={borderColor}>
                        <Icon as={FiCheckCircle} color="green.500" mt={0.5} />
                        <Box fontSize="11px">
                          <Text fontWeight="bold">4. Strict Nafith Ban</Text>
                          <Text color="gray.500">حظر السندات لأمر بدون موافقة صريحة</Text>
                        </Box>
                      </HStack>
                      <HStack align="flex-start" p={2.5} bg={useColorModeValue('gray.50', 'gray.750')} rounded="md" borderWidth="1px" borderColor={borderColor}>
                        <Icon as={FiCheckCircle} color="green.500" mt={0.5} />
                        <Box fontSize="11px">
                          <Text fontWeight="bold">5. 24h Bank Slips & VAT SLA</Text>
                          <Text color="gray.500">تسليم إشعارات التحويل وحفظ رصيد ضريبة المدخلات</Text>
                        </Box>
                      </HStack>
                      <HStack align="flex-start" p={2.5} bg={useColorModeValue('gray.50', 'gray.750')} rounded="md" borderWidth="1px" borderColor={borderColor}>
                        <Icon as={FiCheckCircle} color="green.500" mt={0.5} />
                        <Box fontSize="11px">
                          <Text fontWeight="bold">6. Senior Bank Debt Priority-1</Text>
                          <Text color="gray.500">أولوية سداد القروض البنكية قبل توزيع الأرباح</Text>
                        </Box>
                      </HStack>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* 2. Real-Time WhatsApp Live Feed */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
                  <CardHeader pb={3}>
                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                      <HStack spacing={2}>
                        <Icon as={FiActivity} color="green.500" />
                        <Text fontWeight="bold" fontSize="sm">
                          Real-Time Updates & Notification Feed (شريط الإشعارات والتحديثات المباشرة)
                        </Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Button
                          size="xs"
                          colorScheme="whatsapp"
                          leftIcon={<FiUpload />}
                          onClick={() => {
                            setPartnerSlipForm((prev) => ({
                              ...prev,
                              paying_org: activePersona.company_name,
                            }));
                            submitSlipModal.onOpen();
                          }}
                        >
                          + Submit Vendor Slip & 15% VAT (إرسال إشعار سداد مورد)
                        </Button>
                        <Badge colorScheme="green" fontSize="10px">
                          ● LIVE AUTO-DISPATCHED
                        </Badge>
                      </HStack>
                    </Flex>
                  </CardHeader>
                  <Divider />
                  <CardBody p={4}>
                    <VStack spacing={3.5} align="stretch">
                      {whatsAppLogs.map((log) => {
                        const isRiskAction = log.requires_risk_acceptance;
                        const isAccepted = log.acceptance_status === 'accepted';
                        return (
                          <Box
                            key={log._id || log.id}
                            p={3.5}
                            rounded="lg"
                            borderWidth="1px"
                            borderColor={isRiskAction && !isAccepted ? 'orange.300' : borderColor}
                            bg={isRiskAction && !isAccepted ? useColorModeValue('orange.50', 'gray.750') : useColorModeValue('gray.50', 'gray.750')}
                            transition="all 0.2s"
                          >
                            <Flex justify="space-between" align="flex-start" mb={2} flexWrap="wrap" gap={2}>
                              <HStack spacing={2}>
                                <Icon
                                  as={
                                    log.notice_type === 'cr_risk_acceptance'
                                      ? FiShield
                                      : log.notice_type === 'payment_on_behalf'
                                      ? SaudiRiyalIcon
                                      : log.notice_type === 'nafith_alert'
                                      ? FiAlertTriangle
                                      : FiFileText
                                  }
                                  color={
                                    log.notice_type === 'cr_risk_acceptance'
                                      ? 'purple.500'
                                      : log.notice_type === 'payment_on_behalf'
                                      ? 'green.500'
                                      : log.notice_type === 'nafith_alert'
                                      ? 'red.500'
                                      : 'blue.500'
                                  }
                                />
                                <Text fontWeight="bold" fontSize="xs">
                                  {log.title}
                                </Text>
                              </HStack>

                              <HStack spacing={1.5}>
                                <Text fontSize="10px" color="gray.400" fontFamily="mono">
                                  {log.timestamp}
                                </Text>
                                <Tag size="sm" fontSize="9px" colorScheme={isAccepted ? 'green' : 'blue'}>
                                  {isAccepted ? '✓ Accepted & Verified' : 'Delivered to All'}
                                </Tag>
                              </HStack>
                            </Flex>

                            {/* Message Body Content */}
                            <Box
                              p={2.5}
                              rounded="md"
                              bg={useColorModeValue('white', 'gray.800')}
                              fontSize="11px"
                              lineHeight="1.5"
                              whiteSpace="pre-wrap"
                              fontFamily="system-ui"
                              borderWidth="1px"
                              borderColor={borderColor}
                            >
                              {log.message_body}
                            </Box>

                            {/* Footer Actions */}
                            <Flex justify="space-between" align="center" mt={2.5}>
                              <HStack spacing={1}>
                                <Text fontSize="10px" color="gray.500">Recipients:</Text>
                                {log.recipients.map((r, idx) => (
                                  <Tag key={idx} size="sm" fontSize="8px" colorScheme="gray">
                                    {r.name.split(' ')[0]}
                                  </Tag>
                                ))}
                              </HStack>

                              <HStack spacing={2}>
                                {isRiskAction && !isAccepted && (
                                  <Button
                                    size="xs"
                                    colorScheme="purple"
                                    leftIcon={<FiCheckCircle />}
                                    onClick={() =>
                                      handleDirectPortalAccept(
                                        log.related_entity_id || 'AUTH-2026-0099',
                                        activePersona.name
                                      )
                                    }
                                  >
                                    Accept & Sign Risk (اعتماد الإقرار)
                                  </Button>
                                )}
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="green"
                                  leftIcon={<FaWhatsapp />}
                                  onClick={() => handleOpenWhatsAppWeb(activePersona.phone)}
                                >
                                  Open in WhatsApp
                                </Button>
                              </HStack>
                            </Flex>
                          </Box>
                        );
                      })}
                    </VStack>
                  </CardBody>
                </Card>
              </Box>
            </SimpleGrid>
          </TabPanel>

          {/* TAB 2: MANUAL DISPATCHER & SMARTPHONE PREVIEW */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, lg: 12 }} gap={6}>
              {/* Form (7 cols) */}
              <Box gridColumn={{ base: 'span 12', lg: 'span 7' }}>
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm" mb={6}>
                  <CardHeader pb={2}>
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <Icon as={FiFileText} color="green.500" />
                        <Text fontWeight="bold" fontSize="sm">
                          Notice Parameters & Content Configurator (إعداد محتوى الإشعار)
                        </Text>
                      </HStack>
                      <Badge colorScheme="green" fontSize="10px">
                        BILINGUAL DISPATCH
                      </Badge>
                    </HStack>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {/* Template Selector */}
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold">
                          Select Notice Template (اختر نوع الإشعار):
                        </FormLabel>
                        <Select
                          size="sm"
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          fontWeight="medium"
                        >
                          <option value="cr_risk_acceptance">
                            🛡️ 1. CR & Brand Usage Risk Authorization & Sole Indemnity (طلب تفويض السجل وإقرار الضامن الوحيد)
                          </option>
                          <option value="payment_on_behalf">
                            💳 2. Vendor Payment on Behalf & VAT Credit Proof (إشعار سداد مورد بالنيابة وإثبات الضريبة)
                          </option>
                          <option value="nafith_alert">
                            ⚠️ 3. Nafith Notice / Promissory Note Alert (إشعار منصة نافذ الحرج)
                          </option>
                          <option value="client_milestone">
                            💰 4. Client Milestone Receipt & Waterfall Split (تحصيل دفعة عميل وتقاسم المستحقات)
                          </option>
                          <option value="weekly_digest">
                            📊 5. Weekly Consortium Financial Digest (التقرير المالي الأسبوعي للتحالف)
                          </option>
                          <option value="sanad_request_by_partner">
                            📝 6. Partner Sanad Request & Counter-Indemnity (طلب إصدار سند لأمر وضمان مضاد)
                          </option>
                          <option value="submit_procurement_slip_by_partner">
                            🧾 7. Submit Vendor Procurement Slip & 15% VAT (تقديم إشعار سداد مورد وفاتورة الشراء من الشريك)
                          </option>
                        </Select>
                      </FormControl>

                      {/* Template Specific Fields */}
                      {selectedTemplate === 'cr_risk_acceptance' && (
                        <Box p={3.5} bg={useColorModeValue('purple.50', 'purple.900')} rounded="lg" borderWidth="1px" borderColor="purple.200">
                          <Text fontWeight="bold" fontSize="xs" color="purple.700" mb={3}>
                            CR Authorization & Risk Boundaries (محددات تفويض السجل والمسؤولية الحصرية):
                          </Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mb={3}>
                            <FormControl>
                              <FormLabel fontSize="11px">Authorized Partner (الشريك المفوض):</FormLabel>
                              <Select
                                size="xs"
                                value={targetPartnerOrg}
                                onChange={(e) => setTargetPartnerOrg(e.target.value)}
                              >
                                <option value="RedSea MEP Works (Partner C / شريك الكهروميكانيك)">
                                  RedSea MEP Works (Partner C / شريك الكهروميكانيك)
                                </option>
                                <option value="Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)">
                                  Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)
                                </option>
                              </Select>
                            </FormControl>

                            <FormControl>
                              <FormLabel fontSize="11px">Max Liability Ceiling (سقف الالتزام {'\uE900'}):</FormLabel>
                              <Input
                                size="xs"
                                type="number"
                                value={liabilityCapSar}
                                onChange={(e) => setLiabilityCapSar(Number(e.target.value))}
                              />
                            </FormControl>
                          </SimpleGrid>

                          <FormControl>
                            <FormLabel fontSize="11px">Authorized Scope (نطاق الاستخدام المحدد):</FormLabel>
                            <Input
                              size="xs"
                              value={scopeDetails}
                              onChange={(e) => setScopeDetails(e.target.value)}
                            />
                          </FormControl>
                        </Box>
                      )}

                      {selectedTemplate === 'payment_on_behalf' && (
                        <Box p={3.5} bg={useColorModeValue('green.50', 'green.900')} rounded="lg" borderWidth="1px" borderColor="green.200">
                          <Text fontWeight="bold" fontSize="xs" color="green.700" mb={3}>
                            Payment Details Executed by Partner B on Behalf of Company A:
                          </Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mb={3}>
                            <FormControl>
                              <FormLabel fontSize="11px">Vendor Name (اسم المورد):</FormLabel>
                              <Input
                                size="xs"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="11px">PO Ref under Co. A (أمر الشراء):</FormLabel>
                              <Input
                                size="xs"
                                value={poNumber}
                                onChange={(e) => setPoNumber(e.target.value)}
                              />
                            </FormControl>
                          </SimpleGrid>

                          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                            <FormControl>
                              <FormLabel fontSize="11px">Amount Paid (المبلغ المسدد {'\uE900'}):</FormLabel>
                              <Input
                                size="xs"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="11px">VAT Component (الضريبة 15%):</FormLabel>
                              <Input
                                size="xs"
                                type="number"
                                value={vatAmount}
                                onChange={(e) => setVatAmount(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="11px">Bank Transfer Ref (مرجع التحويل):</FormLabel>
                              <Input
                                size="xs"
                                value={transferRef}
                                onChange={(e) => setTransferRef(e.target.value)}
                              />
                            </FormControl>
                          </SimpleGrid>
                        </Box>
                      )}

                      {selectedTemplate === 'sanad_request_by_partner' && (
                        <Box p={3.5} bg={useColorModeValue('red.50', 'red.900')} rounded="lg" borderWidth="1px" borderColor="red.200">
                          <Text fontWeight="bold" fontSize="xs" color="red.700" mb={3}>
                            Partner Promissory Note (Sanad Amr) Request Details (تفاصيل طلب السند لأمر والضمان المقابل):
                          </Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mb={3}>
                            <FormControl>
                              <FormLabel fontSize="11px">Requesting Partner (الجهة الطالبة):</FormLabel>
                              <Select
                                size="xs"
                                value={targetPartnerOrg}
                                onChange={(e) => setTargetPartnerOrg(e.target.value)}
                              >
                                <option value="Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)">
                                  Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)
                                </option>
                                <option value="RedSea MEP Works (Partner C / شريك الكهروميكانيك)">
                                  RedSea MEP Works (Partner C / شريك الكهروميكانيك)
                                </option>
                              </Select>
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="11px">Beneficiary Vendor (المورد المستفيد من السند):</FormLabel>
                              <Input
                                size="xs"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                              />
                            </FormControl>
                          </SimpleGrid>

                          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                            <FormControl>
                              <FormLabel fontSize="11px">Promissory Note Amount (قيمة السند {'\uE900'}):</FormLabel>
                              <Input
                                size="xs"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="11px">Linked PO Ref (أمر الشراء المرتبط):</FormLabel>
                              <Input
                                size="xs"
                                value={poNumber}
                                onChange={(e) => setPoNumber(e.target.value)}
                              />
                            </FormControl>
                          </SimpleGrid>

                          <Box mt={3} p={2.5} bg={useColorModeValue('white', 'gray.800')} rounded="md" borderWidth="1px" borderColor="red.300">
                            <HStack spacing={2} align="flex-start">
                              <Icon as={FiShield} color="red.500" mt={0.5} boxSize={4} />
                              <Text fontSize="10.5px" color="gray.600">
                                <b>Counter-Indemnity Guard:</b> System strictly prompts Partner B to confirm an identical Back-to-Back Counter Note before Company A signs on the Nafith judicial platform.
                              </Text>
                            </HStack>
                          </Box>
                        </Box>
                      )}

                      {selectedTemplate === 'submit_procurement_slip_by_partner' && (
                        <Box p={3.5} bg={useColorModeValue('teal.50', 'teal.900')} rounded="lg" borderWidth="1px" borderColor="teal.200">
                          <Text fontWeight="bold" fontSize="xs" color="teal.700" mb={3}>
                            Partner Procurement Slip & 15% ZATCA VAT Submission (تفاصيل إشعار سداد المورد وفاتورة الشراء):
                          </Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mb={3}>
                            <FormControl>
                              <FormLabel fontSize="11px">Paying Partner (الشريك المسدد):</FormLabel>
                              <Select
                                size="xs"
                                value={paidByOrg}
                                onChange={(e) => setPaidByOrg(e.target.value)}
                              >
                                <option value="Gulf Heavy Machinery LLC (Partner B)">
                                  Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)
                                </option>
                                <option value="RedSea MEP Works (Partner C)">
                                  RedSea MEP Works (Partner C / شريك الكهروميكانيك)
                                </option>
                              </Select>
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="11px">Vendor Name (اسم المورد المستفيد):</FormLabel>
                              <Input
                                size="xs"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                              />
                            </FormControl>
                          </SimpleGrid>

                          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3} mb={3}>
                            <FormControl>
                              <FormLabel fontSize="11px">Amount Excl. VAT (المبلغ قبل الضريبة {'\uE900'}):</FormLabel>
                              <Input
                                size="xs"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => {
                                  const amt = Number(e.target.value);
                                  setPaymentAmount(amt);
                                  setVatAmount(Math.round(amt * 0.15 * 100) / 100);
                                }}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="11px">15% ZATCA VAT (ضريبة المدخلات {'\uE900'}):</FormLabel>
                              <Input
                                size="xs"
                                type="number"
                                value={vatAmount}
                                onChange={(e) => setVatAmount(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="11px">Bank Transfer Ref (مرجع التحويل):</FormLabel>
                              <Input
                                size="xs"
                                value={transferRef}
                                onChange={(e) => setTransferRef(e.target.value)}
                              />
                            </FormControl>
                          </SimpleGrid>

                          <FormControl mb={2}>
                            <FormLabel fontSize="11px">PO Ref under Co. A (أمر الشراء تحت اسم شركة أ):</FormLabel>
                            <Input
                              size="xs"
                              value={poNumber}
                              onChange={(e) => setPoNumber(e.target.value)}
                            />
                          </FormControl>

                          <Box mt={3} p={2.5} bg={useColorModeValue('white', 'gray.800')} rounded="md" borderWidth="1px" borderColor="teal.300">
                            <HStack spacing={2} align="flex-start">
                              <Icon as={FiCheckCircle} color="teal.500" mt={0.5} boxSize={4} />
                              <Text fontSize="10.5px" color="gray.600">
                                <b>Direct Step 4 Integration:</b> Submitting this slip creates an inter-company ledger credit under Step 4 and preserves the 15% ZATCA VAT credit in Step 5 reconciliation.
                              </Text>
                            </HStack>
                          </Box>
                        </Box>
                      )}

                      {/* Recipient Selection Matrix */}
                      <Box mt={2}>
                        <Flex justify="space-between" align="center" mb={2}>
                          <HStack spacing={2}>
                            <Icon as={FiUsers} color="blue.500" />
                            <Text fontSize="xs" fontWeight="bold">
                              Select Recipients (تحديد الشركاء المستلمين):
                            </Text>
                          </HStack>
                          <Checkbox
                            size="sm"
                            colorScheme="green"
                            isChecked={selectedStakeholderIds.length === stakeholders.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStakeholderIds(stakeholders.map((s) => s.id));
                              else setSelectedStakeholderIds([]);
                            }}
                          >
                            <Text fontSize="xs" fontWeight="bold">
                              Select All ({stakeholders.length})
                            </Text>
                          </Checkbox>
                        </Flex>

                        <VStack spacing={2} align="stretch">
                          {stakeholders.map((s) => {
                            const isChecked = selectedStakeholderIds.includes(s.id);
                            return (
                              <Flex
                                key={s.id}
                                p={2.5}
                                rounded="md"
                                borderWidth="1px"
                                borderColor={isChecked ? 'green.300' : borderColor}
                                bg={isChecked ? useColorModeValue('green.50', 'gray.750') : 'transparent'}
                                align="center"
                                justify="space-between"
                                cursor="pointer"
                                onClick={() => {
                                  if (isChecked) setSelectedStakeholderIds(selectedStakeholderIds.filter((id) => id !== s.id));
                                  else setSelectedStakeholderIds([...selectedStakeholderIds, s.id]);
                                }}
                              >
                                <HStack spacing={3}>
                                  <Checkbox
                                    size="sm"
                                    colorScheme="green"
                                    isChecked={isChecked}
                                  />
                                  <Box>
                                    <HStack spacing={2}>
                                      <Text fontSize="xs" fontWeight="bold">{s.name}</Text>
                                      {s.is_saudi_national && (
                                        <Badge colorScheme="green" fontSize="9px">
                                          🇸🇦 Saudi CR Owner
                                        </Badge>
                                      )}
                                      <Badge colorScheme="blue" fontSize="9px">{s.company_role.toUpperCase()}</Badge>
                                    </HStack>
                                    <Text fontSize="10px" color="gray.500">{s.company_name} • {s.phone}</Text>
                                  </Box>
                                </HStack>

                                <Tag size="sm" fontSize="9px" colorScheme="teal">{s.notification_tier}</Tag>
                              </Flex>
                            );
                          })}
                        </VStack>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>

              {/* Smartphone Simulator (5 cols) */}
              <Box gridColumn={{ base: 'span 12', lg: 'span 5' }}>
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
                  <CardHeader pb={2}>
                    <Flex justify="space-between" align="center">
                      <HStack spacing={2}>
                        <FaWhatsapp color="#25D366" size={18} />
                        <Text fontWeight="bold" fontSize="sm">
                          Live WhatsApp Chat Preview (معاينة حية للمحادثة)
                        </Text>
                      </HStack>
                      <Badge colorScheme="green" fontSize="10px">
                        ENCRYPTED TELEMETRY
                      </Badge>
                    </Flex>
                  </CardHeader>
                  <Divider />
                  <CardBody p={4}>
                    <Box
                      rounded="2xl"
                      borderWidth="3px"
                      borderColor={useColorModeValue('gray.700', 'gray.600')}
                      overflow="hidden"
                      shadow="lg"
                    >
                      <Box bg="#075E54" px={4} py={2.5} color="white">
                        <Flex justify="space-between" align="center">
                          <HStack spacing={2.5}>
                            <Box w="32px" h="32px" rounded="full" bg="#128C7E" display="flex" alignItems="center" justifyContent="center">
                              <FiShield size={16} />
                            </Box>
                            <Box>
                              <Text fontWeight="bold" fontSize="xs" lineHeight="1.2">
                                Consortium Governance Bot 🤖
                              </Text>
                              <Text fontSize="9px" color="gray.200">
                                Broadcast to {selectedStakeholderIds.length} partners
                              </Text>
                            </Box>
                          </HStack>
                          <Badge colorScheme="green" fontSize="8px">BOT ACTIVE</Badge>
                        </Flex>
                      </Box>

                      <Box
                        bg={chatContainerBg}
                        p={3}
                        minH="360px"
                        maxH="420px"
                        overflowY="auto"
                        fontSize="11.5px"
                      >
                        <Box textAlign="center" my={2}>
                          <Tag size="sm" bg="rgba(0,0,0,0.15)" color="gray.600" fontSize="9px" rounded="full">
                            TODAY • {new Date().toLocaleDateString('en-GB')}
                          </Tag>
                        </Box>

                        <Box
                          bg={chatBubbleBg}
                          color={textColor}
                          p={3}
                          rounded="lg"
                          roundedTopRight="none"
                          shadow="xs"
                          whiteSpace="pre-wrap"
                          lineHeight="1.5"
                          fontFamily="system-ui"
                        >
                          {currentMessageBody}
                          <Flex justify="flex-end" align="center" mt={1} gap={1}>
                            <Text fontSize="9px" color="gray.500">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Box color="#34B7F1">
                              <FiCheck size={12} style={{ display: 'inline' }} />
                              <FiCheck size={12} style={{ display: 'inline', marginLeft: '-6px' }} />
                            </Box>
                          </Flex>
                        </Box>
                      </Box>

                      <Box p={3} bg={useColorModeValue('gray.100', 'gray.700')}>
                        <VStack spacing={2}>
                          <Button
                            w="full"
                            size="sm"
                            colorScheme="green"
                            leftIcon={<FaWhatsapp />}
                            onClick={() => handleOpenWhatsAppWeb()}
                          >
                            Open in WhatsApp Web / App (إرسال مباشر)
                          </Button>

                          <SimpleGrid columns={2} gap={2} w="full">
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="blue"
                              leftIcon={<FiSend />}
                              onClick={handleSimulateDispatch}
                            >
                              Dispatch & Log Notice
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              leftIcon={<FiCopy />}
                              onClick={handleCopyText}
                            >
                              Copy Text (نسخ)
                            </Button>
                          </SimpleGrid>
                        </VStack>
                      </Box>
                    </Box>
                  </CardBody>
                </Card>
              </Box>
            </SimpleGrid>
          </TabPanel>

          {/* TAB 3: CR RISK PASSPORTS & SOLE INDEMNITY */}
          <TabPanel p={0}>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
              <CardHeader pb={3}>
                <HStack spacing={2}>
                  <Icon as={FiAward} color="purple.500" />
                  <Text fontWeight="bold" fontSize="md">
                    CR & Commercial Brand Authorization Passports (تصاريح استخدام السجل وإقرارات المخاطر)
                  </Text>
                </HStack>
              </CardHeader>
              <Divider />
              <CardBody p={0}>
                <Table variant="simple" size="sm">
                  <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                    <Tr>
                      <Th>Passport Code</Th>
                      <Th>Beneficiary Partner</Th>
                      <Th>Scope</Th>
                      <Th>Ceiling</Th>
                      <Th>Sole Indemnity</Th>
                      <Th>Status</Th>
                      <Th textAlign="right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {brandPassports.map((pass) => (
                      <Tr key={pass._id || pass.id}>
                        <Td fontWeight="bold" fontFamily="mono" fontSize="xs" color="purple.600">
                          {pass.passport_code}
                        </Td>
                        <Td>
                          <Text fontWeight="bold" fontSize="xs">{pass.granted_to_org || 'Consortium Partner'}</Text>
                          <Text fontSize="10px" color="gray.500">Ref: {pass.certificate_reference}</Text>
                        </Td>
                        <Td maxW="280px">
                          <Text fontSize="xs" noOfLines={2}>{pass.allowed_tender_scope}</Text>
                        </Td>
                        <Td fontWeight="bold" fontSize="xs">
                          {pass.liability_cap_sar ? formatSAR(pass.liability_cap_sar) : '1,000,000 \uE900'}
                        </Td>
                        <Td>
                          {pass.sole_indemnifier_accepted ? (
                            <Badge colorScheme="green" fontSize="10px">
                              ACCEPTED ✓ (محصن)
                            </Badge>
                          ) : (
                            <Badge colorScheme="orange" fontSize="10px">
                              PENDING ACCEPTANCE
                            </Badge>
                          )}
                        </Td>
                        <Td>
                          <Tag
                            size="sm"
                            colorScheme={
                              pass.status === 'active' && pass.sole_indemnifier_accepted
                                ? 'green'
                                : pass.status === 'pending_acceptance'
                                ? 'orange'
                                : 'gray'
                            }
                          >
                            {pass.status.toUpperCase()}
                          </Tag>
                        </Td>
                        <Td textAlign="right">
                          <HStack justify="flex-end" spacing={2}>
                            {pass.status === 'pending_acceptance' || !pass.sole_indemnifier_accepted ? (
                              <Button
                                size="xs"
                                colorScheme="purple"
                                leftIcon={<FiUserCheck />}
                                onClick={() => handleOpenAcceptanceModal(pass)}
                              >
                                Accept Risk (اعتماد الإقرار)
                              </Button>
                            ) : (
                              <Tooltip label={`Accepted by ${pass.risk_accepted_by || 'Partner'} at ${pass.risk_accepted_at || 'Verified'}`}>
                                <Badge colorScheme="teal" variant="subtle" fontSize="10px" p={1}>
                                  Digitally Signed ✓
                                </Badge>
                              </Tooltip>
                            )}

                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="green"
                              leftIcon={<FaWhatsapp />}
                              onClick={() => {
                                setSelectedTemplate('cr_risk_acceptance');
                                setTargetPartnerOrg(pass.granted_to_org || 'Consortium Partner');
                                setLiabilityCapSar(pass.liability_cap_sar || 800000);
                                setScopeDetails(pass.allowed_tender_scope);
                                toast({
                                  title: 'تم تجهيز قالب الواتساب',
                                  description: 'Switched to Dispatcher tab with this passport data.',
                                  status: 'info',
                                  duration: 2000,
                                });
                              }}
                            >
                              Dispatch via WA
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* TAB 4: MULTI-STAKEHOLDER DIRECTORY */}
          <TabPanel p={0}>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
              <CardHeader pb={3}>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                  <Box>
                    <HStack spacing={2}>
                      <Icon as={FiUsers} color="blue.500" />
                      <Text fontWeight="bold" fontSize="md">
                        Consortium Stakeholder Directory (دليل شركاء التحالف وأرقام الإشعارات)
                      </Text>
                    </HStack>
                  </Box>
                  <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={addStakeholderModal.onOpen}>
                    New Partner (إضافة شريك جديد)
                  </Button>
                </Flex>
              </CardHeader>
              <Divider />
              <CardBody p={0}>
                <Table variant="simple" size="sm">
                  <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                    <Tr>
                      <Th>Partner Name</Th>
                      <Th>Company</Th>
                      <Th>Role</Th>
                      <Th>WhatsApp Mobile</Th>
                      <Th>Saudi National</Th>
                      <Th>Tier</Th>
                      <Th textAlign="right">Quick WA</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {stakeholders.map((s) => (
                      <Tr key={s.id}>
                        <Td>
                          <Text fontWeight="bold" fontSize="xs">{s.name}</Text>
                          <Text fontSize="10px" color="gray.500">{s.nameAr}</Text>
                        </Td>
                        <Td fontSize="xs">{s.company_name}</Td>
                        <Td>
                          <Badge colorScheme="blue" fontSize="10px">{s.company_role.toUpperCase()}</Badge>
                        </Td>
                        <Td fontSize="xs" fontFamily="mono" color="green.600" fontWeight="medium">
                          {s.phone}
                        </Td>
                        <Td>
                          {s.is_saudi_national ? (
                            <Badge colorScheme="green" fontSize="10px">
                              🇸🇦 Yes (مالك السجل)
                            </Badge>
                          ) : (
                            <Text fontSize="xs" color="gray.500">Expat / Partner</Text>
                          )}
                        </Td>
                        <Td>
                          <Tag size="sm" colorScheme={s.notification_tier === 'all_alerts' ? 'teal' : 'gray'}>
                            {s.notification_tier}
                          </Tag>
                        </Td>
                        <Td textAlign="right">
                          <HStack justify="flex-end" spacing={1}>
                            <Tooltip label="Open WhatsApp">
                              <IconButton
                                aria-label="Direct WA"
                                icon={<FaWhatsapp />}
                                colorScheme="green"
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenWhatsAppWeb(s.phone)}
                              />
                            </Tooltip>
                            <Tooltip label="Edit Partner Details & Mobile (تعديل البيانات والجوال)">
                              <IconButton
                                aria-label="Edit Stakeholder"
                                icon={<FiEdit2 />}
                                colorScheme="blue"
                                size="xs"
                                variant="ghost"
                                onClick={() => handleOpenEditModal(s)}
                              />
                            </Tooltip>
                            <Tooltip label="Delete Partner (حذف)">
                              <IconButton
                                aria-label="Delete Stakeholder"
                                icon={<FiTrash2 />}
                                colorScheme="red"
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteStakeholder(s.id, s.name)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* TAB 5: DELIVERY AUDIT TRAIL */}
          <TabPanel p={0}>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
              <CardHeader pb={3}>
                <HStack spacing={2}>
                  <Icon as={FiClock} color="teal.500" />
                  <Text fontWeight="bold" fontSize="md">
                    Electronic Notice Dispatch & Acceptance Audit Trail (سجل الإشعارات المؤرخة)
                  </Text>
                </HStack>
              </CardHeader>
              <Divider />
              <CardBody p={0}>
                <Table variant="simple" size="sm">
                  <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                    <Tr>
                      <Th>Timestamp</Th>
                      <Th>Notice Title</Th>
                      <Th>Project</Th>
                      <Th>Recipients</Th>
                      <Th>Acceptance Status</Th>
                      <Th textAlign="right">View Body</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {whatsAppLogs.map((log) => (
                      <Tr key={log._id || log.id}>
                        <Td fontSize="xs" fontFamily="mono" color="gray.600">{log.timestamp}</Td>
                        <Td>
                          <Text fontWeight="bold" fontSize="xs">{log.title}</Text>
                          <Badge colorScheme="blue" fontSize="9px">{log.notice_type.toUpperCase()}</Badge>
                        </Td>
                        <Td fontSize="xs">{log.project_name}</Td>
                        <Td>
                          <HStack spacing={1} flexWrap="wrap">
                            {log.recipients.map((r, i) => (
                              <Tag key={i} size="sm" fontSize="9px" colorScheme="gray">
                                {r.name.split(' ')[0]} ({r.status})
                              </Tag>
                            ))}
                          </HStack>
                        </Td>
                        <Td>
                          {log.requires_risk_acceptance ? (
                            log.acceptance_status === 'accepted' ? (
                              <Badge colorScheme="green" fontSize="10px">
                                ✓ Accepted by {log.accepted_by}
                              </Badge>
                            ) : (
                              <Badge colorScheme="orange" fontSize="10px">
                                ⏳ Pending Acceptance
                              </Badge>
                            )
                          ) : (
                            <Badge colorScheme="teal" variant="subtle" fontSize="10px">
                              Informational
                            </Badge>
                          )}
                        </Td>
                        <Td textAlign="right">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                              toast({
                                title: log.title,
                                description: log.message_body,
                                duration: 8000,
                                isClosable: true,
                              });
                            }}
                          >
                            Read Body
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* MODAL: Electronic Risk Acceptance Agreement */}
      <Modal isOpen={acceptRiskModal.isOpen} onClose={acceptRiskModal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg="purple.600" color="white" borderTopRadius="md">
            <HStack spacing={2}>
              <FiShield size={20} />
              <Text fontSize="md">
                Electronic CR Risk & Sole Indemnity Agreement (إقرار الضامن الوحيد وتحمل المخاطر)
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={5}>
            <VStack spacing={4} align="stretch">
              <Box p={4} bg={useColorModeValue('purple.50', 'purple.900')} rounded="lg" borderWidth="1.5px" borderColor="purple.300">
                <Text fontWeight="extrabold" fontSize="xs" color="purple.800" mb={2}>
                  الإقرار النظامي الملزم وفق نظام المعاملات المدنية ونظام الإثبات السعودي:
                </Text>
                <Text fontSize="12px" lineHeight="1.7" color={textColor} textAlign="justify">
                  "أقر أنا المفوض بالتوقيع أدناه، بصفتي ممثلاً للشريك المنفذ، وبكامل الأهلية المعتبرة شرعاً ونظاماً، بأن استخدام السجل التجاري والاسم التجاري التابع لـ <b>(Apex Infrastructure Co. / صاحب السجل)</b> هو تفويض مشروط ومحصور حصراً لتنفيذ أعمال مشروع <b>(Riyadh Logistics Park Phase 2)</b> بسقف التزام مالي لا يتجاوز <b>{targetPassportForAcceptance?.liability_cap_sar ? formatSAR(targetPassportForAcceptance.liability_cap_sar) : '800,000 \uE900'}</b>.
                  <br /><br />
                  وعليه، ألتزم منفرداً بصفتي <b>(الضامن الوحيد الحصري - Sole Indemnifier)</b> بسداد كافة الالتزامات المالية وفواتير الموردين ومستحقات العمالة وضريبة القيمة المضافة لهيئة الزكاة، مع إبراء ذمة المالك السعودي للشركة إبراءً شاملاً وكاملاً من أي مطالبات أو دعاوى قضائية أو تنفيذية، وأتعهد بعدم إصدار أي سند لأمر عبر منصة نافذ باسم الشركة (أ)."
                </Text>
              </Box>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold">
                  Authorized Signatory Full Name (اسم المفوض بالتوقيع):
                </FormLabel>
                <Input
                  size="sm"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  fontWeight="bold"
                />
              </FormControl>

              <Checkbox
                colorScheme="purple"
                isChecked={confirmSoleIndemnity}
                onChange={(e) => setConfirmSoleIndemnity(e.target.checked)}
              >
                <Text fontSize="xs" fontWeight="bold">
                  I legally confirm full sole indemnification & digital acceptance under Saudi Royal Decree M/43.
                  (أؤكد الموافقة الرقمية وتحمل المسؤولية الحصرية نظاماً)
                </Text>
              </Checkbox>
            </VStack>
          </ModalBody>
          <ModalFooter bg={useColorModeValue('gray.50', 'gray.900')}>
            <Button size="sm" variant="ghost" mr={3} onClick={acceptRiskModal.onClose}>
              Cancel (إلغاء)
            </Button>
            <Button
              size="sm"
              colorScheme="purple"
              leftIcon={<FiCheckCircle />}
              isDisabled={!confirmSoleIndemnity}
              onClick={handleConfirmAcceptance}
            >
              Sign & Activate Risk Passport (اعتماد وتوثيق فوري)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL: Add New Stakeholder */}
      <Modal isOpen={addStakeholderModal.isOpen} onClose={addStakeholderModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg="green.600" color="white" borderTopRadius="md">
            <HStack spacing={2}>
              <FiUsers size={20} />
              <Text fontSize="md">Add Consortium Stakeholder (إضافة شريك جديد لمنظومة الواتساب)</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={5}>
            <VStack spacing={3.5} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Name (English):</FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g. Eng. Fahad Al-Zahrani"
                    value={newStkName}
                    onChange={(e) => setNewStkName(e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs">الاسم (بالعربي):</FormLabel>
                  <Input
                    size="sm"
                    placeholder="م. فهد الزهراني"
                    value={newStkNameAr}
                    onChange={(e) => setNewStkNameAr(e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Company / Entity (الجهة التابع لها):</FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g. Horizon Steel LLC"
                    value={newStkCompany}
                    onChange={(e) => setNewStkCompany(e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">WhatsApp Mobile (الجوال مع الرمز):</FormLabel>
                  <Input
                    size="sm"
                    placeholder="+966501234567"
                    value={newStkPhone}
                    onChange={(e) => setNewStkPhone(e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Consortium Role (الصفة في التحالف):</FormLabel>
                  <Select
                    size="sm"
                    value={newStkRole}
                    onChange={(e) => setNewStkRole(e.target.value as any)}
                  >
                    <option value="lead_cr_holder">Lead CR Holder (المالك وصاحب السجل)</option>
                    <option value="execution_partner">Execution Partner (الشريك المنفذ)</option>
                    <option value="mep_partner">MEP Partner (شريك الكهروميكانيك)</option>
                    <option value="investor">Financial Investor (مستثمر مالي)</option>
                    <option value="finance_lead">Finance & Tax Lead (مدير الحسابات)</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Notification Tier (مستوى الإشعار):</FormLabel>
                  <Select
                    size="sm"
                    value={newStkTier}
                    onChange={(e) => setNewStkTier(e.target.value as any)}
                  >
                    <option value="all_alerts">All Transactions (كافة الإشعارات لحظياً)</option>
                    <option value="high_value_only">High Value Only {'>'} 50k (العمليات الكبرى)</option>
                    <option value="milestones_only">Milestones & Weekly Only (الدفعات والتقرير)</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <Box p={3} bg={useColorModeValue('gray.50', 'gray.750')} rounded="md">
                <Checkbox
                  size="sm"
                  colorScheme="green"
                  isChecked={newStkIsSaudi}
                  onChange={(e) => setNewStkIsSaudi(e.target.checked)}
                  mb={2}
                >
                  <Text fontSize="xs" fontWeight="bold">
                    Saudi Citizen National (مواطن سعودي - مسجل رسمياً بالسجل التجاري)
                  </Text>
                </Checkbox>

                {newStkIsSaudi && (
                  <FormControl>
                    <FormLabel fontSize="10px">National ID (رقم الهوية الوطنية):</FormLabel>
                    <Input
                      size="xs"
                      placeholder="10XXXXXXXX"
                      value={newStkNationalId}
                      onChange={(e) => setNewStkNationalId(e.target.value)}
                    />
                  </FormControl>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter bg={useColorModeValue('gray.50', 'gray.900')}>
            <Button size="sm" variant="ghost" mr={3} onClick={addStakeholderModal.onClose}>
              Cancel (إلغاء)
            </Button>
            <Button size="sm" colorScheme="green" leftIcon={<FiCheck />} onClick={handleCreateStakeholder}>
              Save Stakeholder (حفظ الشريك)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL: Edit Stakeholder */}
      <Modal isOpen={editStakeholderModal.isOpen} onClose={editStakeholderModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg="blue.600" color="white" borderTopRadius="md">
            <HStack spacing={2}>
              <FiEdit2 size={20} />
              <Text fontSize="md">Edit Consortium Stakeholder (تعديل بيانات الشريك ورقم الجوال)</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={5}>
            <VStack spacing={3.5} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Name (English):</FormLabel>
                  <Input
                    size="sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs">الاسم (بالعربي):</FormLabel>
                  <Input
                    size="sm"
                    value={editNameAr}
                    onChange={(e) => setEditNameAr(e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Company / Entity (الجهة التابع لها):</FormLabel>
                  <Input
                    size="sm"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">WhatsApp Mobile (الجوال مع الرمز الدولي):</FormLabel>
                  <Input
                    size="sm"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    fontWeight="mono"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Consortium Role (الصفة في التحالف):</FormLabel>
                  <Select
                    size="sm"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                  >
                    <option value="lead_cr_holder">Lead CR Holder (المالك وصاحب السجل)</option>
                    <option value="execution_partner">Execution Partner (الشريك المنفذ)</option>
                    <option value="mep_partner">MEP Partner (شريك الكهروميكانيك)</option>
                    <option value="investor">Financial Investor (مستثمر مالي)</option>
                    <option value="finance_lead">Finance & Tax Lead (مدير الحسابات)</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Notification Tier (مستوى الإشعار):</FormLabel>
                  <Select
                    size="sm"
                    value={editTier}
                    onChange={(e) => setEditTier(e.target.value as any)}
                  >
                    <option value="all_alerts">All Transactions (كافة الإشعارات لحظياً)</option>
                    <option value="high_value_only">High Value Only {'>'} 50k (العمليات الكبرى)</option>
                    <option value="milestones_only">Milestones & Weekly Only (الدفعات والتقرير)</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <Box p={3} bg={useColorModeValue('gray.50', 'gray.750')} rounded="md">
                <Checkbox
                  size="sm"
                  colorScheme="green"
                  isChecked={editIsSaudi}
                  onChange={(e) => setEditIsSaudi(e.target.checked)}
                  mb={2}
                >
                  <Text fontSize="xs" fontWeight="bold">
                    Saudi Citizen National (مواطن سعودي - مسجل رسمياً بالسجل التجاري)
                  </Text>
                </Checkbox>

                {editIsSaudi && (
                  <FormControl>
                    <FormLabel fontSize="10px">National ID (رقم الهوية الوطنية):</FormLabel>
                    <Input
                      size="xs"
                      placeholder="10XXXXXXXX"
                      value={editNationalId}
                      onChange={(e) => setEditNationalId(e.target.value)}
                    />
                  </FormControl>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter bg={useColorModeValue('gray.50', 'gray.900')}>
            <Button size="sm" variant="ghost" mr={3} onClick={editStakeholderModal.onClose}>
              Cancel (إلغاء)
            </Button>
            <Button size="sm" colorScheme="blue" leftIcon={<FiCheck />} onClick={handleSaveEdit}>
              Save Changes (حفظ التعديلات)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL: Partner Submit Vendor Payment Slip & 15% VAT (Step 4 WhatsApp Bot) */}
      <Modal isOpen={submitSlipModal.isOpen} onClose={submitSlipModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg="whatsapp.600" color="white" borderTopRadius="md">
            <HStack spacing={2}>
              <FaWhatsapp size={22} />
              <Box>
                <Text fontSize="md">Submit Vendor Payment Slip via WhatsApp Bot</Text>
                <Text fontSize="xs" fontWeight="normal" color="whatsapp.100">
                  تقديم إشعار سداد المورد وفاتورة الشراء وضريبة القيمة المضافة 15%
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={5}>
            <VStack spacing={3.5} align="stretch">
              <Alert status="info" rounded="md" py={2} px={3}>
                <AlertIcon />
                <Box fontSize="11px">
                  <AlertTitle fontSize="xs">Instant Step 4 Ledger & ZATCA Registration</AlertTitle>
                  <AlertDescription>
                    All vendor invoices paid by the partner on behalf of Company A are credited to your reimbursement balance and register input VAT in Step 4.
                  </AlertDescription>
                </Box>
              </Alert>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Submitting Partner (الجهة الشريكة المسددة):</FormLabel>
                <Select
                  size="sm"
                  value={partnerSlipForm.paying_org}
                  onChange={(e) => setPartnerSlipForm({ ...partnerSlipForm, paying_org: e.target.value })}
                >
                  <option value="Gulf Heavy Machinery LLC (Partner B)">Gulf Heavy Machinery LLC (Partner B / الشريك المنفذ)</option>
                  <option value="RedSea MEP Works (Partner C)">RedSea MEP Works (Partner C / شريك الكهروميكانيك)</option>
                  <option value="Horizon Steel LLC">Horizon Steel LLC (Partner)</option>
                </Select>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Vendor / Supplier Name (اسم المورد):</FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g. Saudi Ready-Mix Concrete Co."
                    value={partnerSlipForm.vendor_name}
                    onChange={(e) => setPartnerSlipForm({ ...partnerSlipForm, vendor_name: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs">PO Number under Co. A (أمر الشراء):</FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g. PO-A-2026-089"
                    value={partnerSlipForm.po_number}
                    onChange={(e) => setPartnerSlipForm({ ...partnerSlipForm, po_number: e.target.value })}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Amount Excl. VAT <span className="icon-saudi_riyal" /> (المبلغ قبل الضريبة):</FormLabel>
                  <Input
                    size="sm"
                    type="number"
                    placeholder="e.g. 50000"
                    value={partnerSlipForm.amount_excl_vat || ''}
                    onChange={(e) => setPartnerSlipForm({ ...partnerSlipForm, amount_excl_vat: Number(e.target.value) || 0 })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Bank Transfer Reference # (مرجع التحويل البنكي):</FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g. ANB-982144-X / SNB-654321"
                    value={partnerSlipForm.transfer_ref}
                    onChange={(e) => setPartnerSlipForm({ ...partnerSlipForm, transfer_ref: e.target.value })}
                  />
                </FormControl>
              </SimpleGrid>

              {/* VAT and Total Summary Card */}
              <Box p={3} bg={useColorModeValue('teal.50', 'teal.900')} rounded="md" borderWidth="1px" borderColor="teal.200">
                <SimpleGrid columns={2} gap={2} fontSize="xs">
                  <Box>
                    <Text color="teal.700" fontWeight="medium">15% ZATCA Input VAT:</Text>
                    <Text fontWeight="extrabold" color="teal.800" fontSize="sm">
                      {formatSAR(partnerSlipForm.amount_excl_vat * 0.15)}
                    </Text>
                  </Box>
                  <Box>
                    <Text color="teal.700" fontWeight="medium">Total Wire Amount:</Text>
                    <Text fontWeight="extrabold" color="teal.800" fontSize="sm">
                      {formatSAR(partnerSlipForm.amount_excl_vat * 1.15)}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>

              <FormControl>
                <FormLabel fontSize="xs">Description / Materials (بيان المواد والأعمال):</FormLabel>
                <Input
                  size="sm"
                  placeholder="e.g. Structural concrete grade C40 for foundation slab"
                  value={partnerSlipForm.description}
                  onChange={(e) => setPartnerSlipForm({ ...partnerSlipForm, description: e.target.value })}
                />
              </FormControl>

              {/* Document File Attachment Input */}
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold">
                  Attach Wire Transfer Slip & Tax Invoice (إرفاق إشعار التحويل البنكي وفاتورة المورد):
                </FormLabel>
                <Input
                  size="sm"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  p={1}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPartnerSlipForm({ ...partnerSlipForm, slip_attachment_name: f.name });
                  }}
                />
                {partnerSlipForm.slip_attachment_name && (
                  <HStack mt={2} p={1.5} bg="green.50" rounded="md" borderWidth="1px" borderColor="green.200">
                    <Icon as={FiCheckCircle} color="green.600" />
                    <Text fontSize="11px" color="green.800" fontWeight="bold">
                      Attached: {partnerSlipForm.slip_attachment_name}
                    </Text>
                  </HStack>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter bg={useColorModeValue('gray.50', 'gray.900')}>
            <Button size="sm" variant="ghost" mr={3} onClick={submitSlipModal.onClose}>
              Cancel (إلغاء)
            </Button>
            <Button
              size="sm"
              colorScheme="whatsapp"
              leftIcon={<FiSend />}
              onClick={handleSubmitPartnerSlip}
            >
              Submit Slip to Governance Ledger (إرسال الإشعار وتوثيق العملية)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WhatsAppStakeholderBotTerminal;
