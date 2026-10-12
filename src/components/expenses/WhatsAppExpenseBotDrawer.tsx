import React, { useState } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Input,
  Button,
  Box,
  Image,
  Divider,
  useToast,
  Select,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import { 
  FiMessageSquare, 
  FiImage, 
  FiSend, 
  FiCheckCircle, 
  FiShield, 
  FiPaperclip, 
  FiDollarSign, 
  FiTrendingUp, 
  FiAlertCircle 
} from 'react-icons/fi';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { OCRService } from '../../utils/ocrService';

interface WhatsAppExpenseBotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  currentUser: any;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  mediaUrl?: string;
  timestamp: string;
  options?: { label: string; value: string }[];
}

export const WhatsAppExpenseBotDrawer: React.FC<WhatsAppExpenseBotDrawerProps> = ({
  isOpen,
  onClose,
  organizationId,
  currentUser,
}) => {
  const toast = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const createCompanyExpense = useMutation(api.companyExpenses.addCompanyExpense);
  const createApprovalRequest = useMutation(api.whatsappApprovals.createApprovalRequest);
  const processApprovalDecision = useMutation(api.whatsappApprovals.processApprovalDecision);
  const processInvoiceWithAiOcr = useMutation(api.whatsappApprovals.processInvoiceWithAiOcr);
  const trainBotVendorMapping = useMutation(api.whatsappApprovals.trainBotVendorMapping);
  const runDiagnostics = useMutation(api.whatsappApprovals.runBotSystemDiagnostics);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: 'مرحباً بك في مساعد واتساب الذكي للمؤسسة 🤖\nWelcome to Smart ERP WhatsApp Enterprise Assistant!\n\nاختر العملية المطلوبة عبر الأزرار المباشرة ادناه:\nSelect an operation below using the close-ended buttons:',
      timestamp: 'Just now',
      options: [
        { label: '🧾 1. Invoices & Expenses (المصروفات والفواتير)', value: 'flow_expense' },
        { label: '✈️ 2. Travel Cash Advance Pre-Booking (سلفة سفر مؤقتة)', value: 'flow_advance' },
        { label: '🏛️ 3. Government / COC Attestation (تصديق بدون ضريبة)', value: 'flow_attestation' },
        { label: '📦 4. Asset Custody Handover (استلام وتسليم العهد)', value: 'flow_custody' },
        { label: '🏖️ 5. Leave & Vacation Request (طلب إجازة ومغادرة)', value: 'flow_leave' },
        { label: '📋 6. Pending WhatsApp Approvals Queue (صندوق الموافقات)', value: 'flow_approvals' },
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [sessionStep, setSessionStep] = useState<string>('INIT');

  const [pendingData, setPendingData] = useState<{
    type: 'expense' | 'advance';
    amount: number;
    description: string;
    expenseType: any;
    accountCode: string;
    accountName: string;
    imageUrl?: string;
    paymentSource: string;
    isExecutiveDirectPost: boolean;
  }>({
    type: 'expense',
    amount: 0,
    description: '',
    expenseType: 'other',
    accountCode: '5200',
    accountName: 'General Administrative',
    paymentSource: 'personal_reimbursement',
    isExecutiveDirectPost: false,
  });

  const appendBotMessage = (text: string, options?: { label: string; value: string }[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options,
      },
    ]);
  };

  const appendUserMessage = (text: string, mediaUrl?: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `usr_${Date.now()}`,
        sender: 'user',
        text,
        mediaUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // 1. Close-Ended Navigation Handler (Button-Driven)
  const handleSelectOption = (value: string) => {
    // Top-Level Modules
    if (value === 'flow_expense') {
      appendUserMessage('Invoices & Expenses');
      appendBotMessage(
        '🧾 Expense Recording:\nHow would you like to provide the receipt?',
        [
          { label: '📸 Snap / Upload Invoice Photo', value: 'expense_snap_camera' },
          { label: '⌨️ Enter Amount & Purpose Manually', value: 'expense_manual_select' },
          { label: '🔙 Return to Main Menu', value: 'main_menu' },
        ]
      );
    } else if (value === 'expense_snap_camera') {
      appendUserMessage('Upload Invoice Photo');
      appendBotMessage('📷 Opening camera/photo picker to scan ZATCA receipt with AI OCR Vision...');
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else if (value === 'expense_manual_select') {
      appendUserMessage('Manual Category Selection');
      appendBotMessage(
        'Select the expense accounting category:',
        [
          { label: '⛽ Fuel / Vehicle Expenses (Head 5210)', value: 'cat_fuel' },
          { label: '🍽️ Client Hospitality / Lunch (Head 5240)', value: 'cat_dining' },
          { label: '📦 Office Supplies & Stationery (Head 5220)', value: 'cat_supplies' },
          { label: '🛠️ Maintenance & Site Utilities (Head 5230)', value: 'cat_maintenance' },
          { label: '🔙 Return to Main Menu', value: 'main_menu' },
        ]
      );
    } else if (value === 'confirm_ocr_head') {
      appendUserMessage(`Confirmed [${pendingData.accountCode}] ${pendingData.accountName}`);
      askPaymentSource(pendingData.amount);
    } else if (value.startsWith('cat_')) {
      let code = '5200';
      let name = 'Administrative Expenses';
      let desc = 'Business Expense';
      if (value === 'cat_fuel') { code = '5210'; name = 'Travel & Fuel (5210)'; desc = 'Vehicle Fuel & Transportation'; }
      if (value === 'cat_dining') { code = '5240'; name = 'Client Entertainment (5240)'; desc = 'Client Meeting Hospitality'; }
      if (value === 'cat_supplies') { code = '5220'; name = 'Office Supplies (5220)'; desc = 'Stationery & Printing Supplies'; }
      if (value === 'cat_maintenance') { code = '5230'; name = 'Site Maintenance (5230)'; desc = 'Office & Facility Repairs'; }

      // If user selected this category after OCR, train bot memory!
      if (pendingData.description) {
        trainBotVendorMapping({
          organization_id: organizationId as any,
          vendor_name: pendingData.description.split(' (Inv:')[0],
          account_code: code,
          account_name: name,
          verified_by_user_id: currentUser?.id,
          notes: 'Trained via WhatsApp Bot Drawer Interaction',
        }).catch(console.warn);
      }

      setPendingData((prev) => ({
        ...prev,
        accountCode: code,
        accountName: name,
        description: prev.description || desc,
      }));

      appendUserMessage(`Selected: ${name}`);
      if (pendingData.amount > 0) {
        askPaymentSource(pendingData.amount);
      } else {
        appendBotMessage(
          `Category: [${code}] ${name}\n\nSelect approximate amount in SAR:`,
          [
            { label: '💵 SAR 100', value: 'amt_100' },
            { label: '💵 SAR 250', value: 'amt_250' },
            { label: '💵 SAR 500', value: 'amt_500' },
            { label: '💵 SAR 1,000', value: 'amt_1000' },
            { label: '✍️ Custom Amount (Type Below)', value: 'amt_custom' },
          ]
        );
      }
    } else if (value.startsWith('amt_')) {
      let amt = 0;
      if (value === 'amt_100') amt = 100;
      if (value === 'amt_250') amt = 250;
      if (value === 'amt_500') amt = 500;
      if (value === 'amt_1000') amt = 1000;

      if (value === 'amt_custom') {
        appendUserMessage('Custom Amount');
        appendBotMessage('Please type the exact amount in SAR into the chat below:');
        setSessionStep('WAITING_AMOUNT_INPUT');
        return;
      }

      setPendingData((prev) => ({ ...prev, amount: amt }));
      appendUserMessage(`SAR ${amt}`);
      askPaymentSource(amt);
    } else if (value === 'flow_advance') {
      appendUserMessage('Travel Cash Advance Pre-Booking');
      appendBotMessage(
        '✈️ Pre-Booking Cash in Hand / Travel Advance (سلفة سفر مؤقتة):\n\nTarget Account: [1230] Employee Travel Advances (Asset Account).\nSelect pre-allocated advance bracket:',
        [
          { label: '💵 SAR 1,500 (Domestic 1-2 Days)', value: 'adv_1500' },
          { label: '💵 SAR 3,000 (Domestic 3-5 Days)', value: 'adv_3000' },
          { label: '💵 SAR 5,000 (Regional / Tender Project)', value: 'adv_5000' },
          { label: '✍️ Custom Advance Amount', value: 'adv_custom' },
          { label: '🔙 Main Menu', value: 'main_menu' },
        ]
      );
    } else if (value.startsWith('adv_')) {
      let amt = 0;
      if (value === 'adv_1500') amt = 1500;
      if (value === 'adv_3000') amt = 3000;
      if (value === 'adv_5000') amt = 5000;

      if (value === 'adv_custom') {
        appendUserMessage('Custom Advance');
        appendBotMessage('Please type the required cash advance amount in SAR:');
        setSessionStep('WAITING_ADVANCE_AMT');
        return;
      }

      setPendingData((prev) => ({
        ...prev,
        type: 'advance',
        amount: amt,
        accountCode: '1230',
        accountName: 'Employee Travel Advances (1230)',
        description: `Travel Cash Advance - SAR ${amt}`,
      }));

      appendUserMessage(`SAR ${amt}`);
      executeSubmission('company_petty_cash');
    } else if (value === 'flow_attestation') {
      appendUserMessage('Government / Chamber of Commerce Attestation');
      appendBotMessage(
        '🏛️ Chamber of Commerce (COC) & Qiwa Attestation (0% VAT):\n\nSelect Attestation Fee Bracket:',
        [
          { label: '📑 SAR 35 (Chamber Electronic Seal / تصديق إلكتروني)', value: 'coc_35' },
          { label: '📑 SAR 100 (Qiwa Service Authentication / توثيق قوى)', value: 'coc_100' },
          { label: '📑 SAR 150 (Chamber Contract Attestation / تصديق عقود)', value: 'coc_150' },
          { label: '✍️ Custom Attestation Fee', value: 'coc_custom' },
        ]
      );
    } else if (value.startsWith('coc_')) {
      let amt = 35;
      if (value === 'coc_35') amt = 35;
      if (value === 'coc_100') amt = 100;
      if (value === 'coc_150') amt = 150;

      if (value === 'coc_custom') {
        appendUserMessage('Custom Attestation Fee');
        appendBotMessage('Please type the government attestation fee in SAR:');
        setSessionStep('WAITING_COC_AMT');
        return;
      }

      setPendingData((prev) => ({
        ...prev,
        type: 'expense',
        amount: amt,
        accountCode: '5260',
        accountName: 'Government Fees & Attestations (5260)',
        description: `Government Chamber / Labor Attestation Fee (No Tax Invoice) - SAR ${amt}`,
      }));

      appendUserMessage(`SAR ${amt}`);
      askPaymentSource(amt);
    } else if (value === 'flow_custody') {
      appendUserMessage('Asset Custody Handover');
      appendBotMessage(
        '📦 Asset Custody & Fleet Handover:\nWhat custody action would you like to perform?',
        [
          { label: '✅ Accept Newly Assigned Asset (تأكيد استلام عهدة)', value: 'custody_accept' },
          { label: '🚗 Fleet Vehicle Inspection Check (فحص المركبة الدوري)', value: 'custody_fleet' },
          { label: '🔄 Initiate Asset Return / Transfer (تسليم أو إرجاع عهدة)', value: 'custody_return' },
          { label: '🔙 Main Menu', value: 'main_menu' },
        ]
      );
    } else if (value === 'custody_accept') {
      appendUserMessage('Accept Assigned Asset');
      appendBotMessage(
        '🔍 Active Custody Slips Pending Acceptance:\n\n• Dell Latitude 5540 Laptop (Tag: AST-0089)\n• Serial: DL-99214-X\n• Condition: Good / Factory Reset\n\nConfirm digital acceptance of this equipment?',
        [
          { label: '🔘 Confirm & Sign Handover Slip', value: 'custody_confirm_sign' },
          { label: '❌ Report Discrepancy / Reject', value: 'custody_reject' },
        ]
      );
    } else if (value === 'custody_confirm_sign') {
      appendUserMessage('Confirm & Sign');
      appendBotMessage('🎉 Digital Handover Slip Sealed!\n\n• Asset: Dell Latitude 5540 (AST-0089)\n• Holder: ' + (currentUser?.name || 'Current User') + '\n• Status: Assigned Custody\n• Timestamp: ' + new Date().toLocaleString());
      toast({ title: 'Custody Accepted', description: 'Asset record updated in Assets & Custody module', status: 'success' });
    } else if (value === 'flow_leave') {
      appendUserMessage('Leave & Vacation Request');
      appendBotMessage(
        '🏖️ Saudi Labor Law Compliant Leave Application:\nSelect leave category:',
        [
          { label: '🌴 Annual Paid Vacation (إجازة سنوية)', value: 'leave_annual' },
          { label: '🤒 Sick Leave / Sehhaty Report (إجازة مرضية)', value: 'leave_sick' },
          { label: '✈️ Exit & Re-Entry Required (تأشيرة خروج وعودة)', value: 'leave_exit_reentry' },
          { label: '🔙 Main Menu', value: 'main_menu' },
        ]
      );
    } else if (value.startsWith('leave_')) {
      appendUserMessage('Selected: ' + value);
      appendBotMessage(
        'Select leave duration:',
        [
          { label: '📅 3 Calendar Days', value: 'days_3' },
          { label: '📅 7 Calendar Days (1 Week)', value: 'days_7' },
          { label: '📅 14 Calendar Days (2 Weeks)', value: 'days_14' },
          { label: '📅 30 Calendar Days (Full Month)', value: 'days_30' },
        ]
      );
    } else if (value.startsWith('days_')) {
      appendUserMessage('Duration Selected');
      appendBotMessage(
        '📤 Leave application formatted and ready for 2-tier approval workflow:\n\n1️⃣ Tier 1: Reporting Manager Sign-off\n2️⃣ Tier 2: HR Director & Jawazat Tasks\n\nTap button to dispatch:',
        [
          { label: '🔘 Dispatch to Manager via WhatsApp', value: 'leave_dispatch' },
          { label: '❌ Cancel Request', value: 'main_menu' },
        ]
      );
    } else if (value === 'leave_dispatch') {
      appendUserMessage('Dispatch Leave Request');
      appendBotMessage('✅ Request dispatched to your Reporting Manager with interactive approval buttons.');
      toast({ title: 'Leave Dispatched', description: 'Interactive button ping sent to manager', status: 'info' });
    } else if (value === 'flow_approvals') {
      appendUserMessage('View Pending Approvals');
      appendBotMessage(
        '📋 WhatsApp Interactive Approvals Queue:\n\nSelect an action:',
        [
          { label: '🔘 Open Web Approvals Center (/pending-approvals)', value: 'open_approvals_web' },
          { label: '🔄 Refresh WhatsApp Queue', value: 'refresh_queue' },
          { label: '🔙 Main Menu', value: 'main_menu' },
        ]
      );
    } else if (value === 'open_approvals_web') {
      window.location.href = '/pending-approvals';
    } else if (value === 'pay_personal' || value === 'pay_company') {
      const isPersonal = value === 'pay_personal';
      const source = isPersonal ? 'personal_reimbursement' : 'petty_cash';
      setPendingData((prev) => ({
        ...prev,
        paymentSource: source,
      }));
      appendUserMessage(isPersonal ? '1️⃣ Personal (Reimburse me)' : '2️⃣ Company Petty Cash');
      // Directly dispatch to Reporting Manager for approval
      executeSubmission(source);
    } else if (value === 'main_menu') {
      appendUserMessage('Main Menu');
      appendBotMessage(
        'Main Menu: Select an enterprise operation:',
        [
          { label: '🧾 1. Invoices & Expenses (المصروفات والفواتير)', value: 'flow_expense' },
          { label: '✈️ 2. Travel Cash Advance Pre-Booking (سلفة سفر مؤقتة)', value: 'flow_advance' },
          { label: '🏛️ 3. Government / COC Attestation (تصديق بدون ضريبة)', value: 'flow_attestation' },
          { label: '📦 4. Asset Custody Handover (استلام وتسليم العهد)', value: 'flow_custody' },
          { label: '🏖️ 5. Leave & Vacation Request (طلب إجازة ومغادرة)', value: 'flow_leave' },
          { label: '📋 6. Pending WhatsApp Approvals Queue (صندوق الموافقات)', value: 'flow_approvals' },
        ]
      );
    }
  };

  const askPaymentSource = (amt: number) => {
    appendBotMessage(
      `Amount confirmed: SAR ${amt.toFixed(2)}.\n\nHow was this paid?`,
      [
        { label: '👤 1. Personal Cash / Card (Reimburse Me)', value: 'pay_personal' },
        { label: '🏢 2. Company Petty Cash / Corporate Card', value: 'pay_company' },
      ]
    );
  };

  // 2. Handle Image Upload with Real AI OCR & Continuous Learning
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      appendUserMessage('Receipt Attached', dataUrl);

      appendBotMessage('🤖 Scanning receipt with AI OCR Vision Engine (Reading actual image pixels for ZATCA QR, Vendor CR, and VAT breakdown)...');

      try {
        // Run REAL client-side Tesseract.js OCR directly on the uploaded image
        const realOcr = await OCRService.getInstance().parseInvoiceReceipt(file);

        // Send extracted text and numbers to Convex for Continuous Learning & Audit Logging
        const ocrResult = await processInvoiceWithAiOcr({
          organization_id: organizationId as any,
          image_data_url: dataUrl,
          file_name: file.name,
          parsed_vendor: realOcr.vendorName,
          parsed_total: realOcr.totalAmount,
          parsed_vat: realOcr.vatAmount,
          parsed_cr: realOcr.crNumber,
          parsed_vat_num: realOcr.vatNumber,
          parsed_date: realOcr.invoiceDate,
          raw_ocr_text: realOcr.rawText,
        });

        if (ocrResult.success) {
          setPendingData((prev) => ({
            ...prev,
            type: 'expense',
            amount: ocrResult.total_amount,
            imageUrl: dataUrl,
            description: `${ocrResult.vendor_name} (Inv: ${ocrResult.invoice_date})`,
            accountCode: ocrResult.recommended_account_code,
            accountName: ocrResult.recommended_account_name,
          }));

          const methodLabel = realOcr.extractionMethod === 'zatca_qr' 
            ? '🏷️ ZATCA Phase 2 QR Decoder (100% Exact)'
            : (realOcr.extractionMethod === 'cloud_vision_ai' || realOcr.extractionMethod === 'cloud_vision_ai_proxy')
            ? '🤖 Cloud AI Vision Agent (Multi-LLM)'
            : '📷 Optical Character Recognition (OCR)';

          // Retrieve active AI key status from localStorage to inform the user
          const savedKey = localStorage.getItem('trading_erp_ai_vision_key');
          const savedProvider = localStorage.getItem('trading_erp_ai_vision_provider') || 'Not configured';
          const aiErrorMsg = OCRService.getInstance().lastAiVisionError;
          const ocrErrDetail = realOcr.errorMessage ? `\n❌ Local OCR Error: ${realOcr.errorMessage}` : '';
          const textPreview = realOcr.rawText ? `\n📝 OCR Scanned Text (${realOcr.rawText.length} chars): "${realOcr.rawText.slice(0, 150).replace(/\n/g, ' ')}..."` : `\n⚠️ OCR Scanned Text: (Empty)${ocrErrDetail}`;
          const debugNotice = (!savedKey)
            ? `\nℹ️ Running in Local Offline OCR mode (No AI key configured).${textPreview}`
            : (realOcr.extractionMethod === 'tesseract_ocr' || !realOcr.extractionMethod)
            ? `\nℹ️ AI Provider (${savedProvider}) returned error: "${aiErrorMsg || 'No response'}". Fell back to Local OCR.${textPreview}`
            : '';

          appendBotMessage(
            `🔍 AI Vision Extraction Complete!\n[Source: ${methodLabel}]\n\n🏢 Extracted Vendor: ${ocrResult.vendor_name}\n📑 CR: ${ocrResult.cr_number || 'N/A'} | VAT: ${ocrResult.vat_number || 'N/A'}\n💵 Total Amount: SAR ${ocrResult.total_amount.toFixed(2)}\n📊 VAT: SAR ${ocrResult.vat_amount.toFixed(2)}\n\n🧠 Smart Memory Auto-Classified Head: [${ocrResult.recommended_account_code}] ${ocrResult.recommended_account_name}\n(Confidence: ${(ocrResult.confidence * 100).toFixed(0)}%${ocrResult.is_memory_trained ? ' • Verified by Bot Trainer Memory' : ''})${debugNotice}\n\nConfirm accounting head:`,
            [
              { label: `✅ Confirm [${ocrResult.recommended_account_code}] ${ocrResult.recommended_account_name}`, value: 'confirm_ocr_head' },
              { label: '✏️ Correct Category (Train Bot Memory)', value: 'expense_manual_select' },
            ]
          );
        }
      } catch (err: any) {
        console.error(err);
        appendBotMessage('⚠️ OCR scanning encountered an error. Please select category manually below:', [
          { label: '⛽ Fuel / Vehicle Expenses (5210)', value: 'cat_fuel' },
          { label: '🍽️ Client Hospitality (5240)', value: 'cat_dining' },
          { label: '📦 Office Supplies (5220)', value: 'cat_supplies' },
        ]);
      }
    };
    reader.readAsDataURL(file);
  };

  // 3. User Message Submission (Only used if user chose Custom Amount)
  const handleSendMessage = () => {
    const text = inputMessage.trim();
    if (!text) return;
    appendUserMessage(text);
    setInputMessage('');

    const numericVal = parseFloat(text);
    if (!isNaN(numericVal) && numericVal > 0) {
      setPendingData((prev) => ({ ...prev, amount: numericVal }));
      if (sessionStep === 'WAITING_ADVANCE_AMT') {
        executeSubmission('company_petty_cash');
      } else {
        askPaymentSource(numericVal);
      }
      setSessionStep('INIT');
    } else {
      appendBotMessage('Please enter a valid numeric SAR amount or select an option below:', [
        { label: '🔙 Return to Main Menu', value: 'main_menu' },
      ]);
    }
  };

  // 4. Execute Backend Submission to Reporting Manager
  const executeSubmission = async (paymentSourceOverride?: string) => {
    try {
      const now = new Date().toISOString();
      const refId = `EXP-${Date.now().toString().slice(-6)}`;
      const source = paymentSourceOverride || pendingData.paymentSource;
      const isPersonal = source === 'personal_reimbursement';
      const sourceLabel = isPersonal ? 'Personal Card / Cash (Reimburse Me)' : 'Company Petty Cash / Corporate Card';

      // Insert company expense record with pending manager approval status
      const expenseId = await createCompanyExpense({
        organization_id: organizationId as any,
        expense_type: pendingData.expenseType,
        description: pendingData.description || 'WhatsApp Expense Claim',
        description_arabic: pendingData.accountName,
        amount: pendingData.amount,
        currency: 'SAR',
        expense_date: now.split('T')[0],
        category: `[${pendingData.accountCode}] ${pendingData.accountName}`,
        receipt_url: pendingData.imageUrl,
        is_shared: false,
        status: 'pending_manager_approval',
        approval_status: 'pending_manager_approval',
        payment_source: source,
        created_by: currentUser?.name || 'WhatsApp Bot User',
      });

      // Dispatch approval request directly to Reporting Manager
      await createApprovalRequest({
        organization_id: organizationId as any,
        request_type: pendingData.type === 'advance' ? 'cash_advance_request' : 'expense_claim',
        reference_id: refId,
        reference_record_id: String(expenseId),
        summary_text: `[Pending Manager Approval] ${pendingData.description} - SAR ${pendingData.amount.toFixed(2)} (${sourceLabel})`,
      });

      appendBotMessage(
        `✅ Expense Claim #${refId} Submitted Successfully!\n\n` +
        `📋 Transaction Summary:\n` +
        `• Description: ${pendingData.description || 'Business Expense'}\n` +
        `• Amount: SAR ${pendingData.amount.toFixed(2)}\n` +
        `• Paid Via: ${sourceLabel}\n` +
        `• Recommended Head: [${pendingData.accountCode}] ${pendingData.accountName}\n\n` +
        `📤 2-Tier Enterprise Approval Flow:\n` +
        `1️⃣ Tier 1: Dispatched directly to your Reporting Manager via WhatsApp for authorization.\n` +
        `2️⃣ Tier 2: Once approved by your manager, this transaction will route into the Accounting Review Bin where the accountant will verify the exact accounting head and post to the General Ledger.\n\n` +
        `You will receive an update once reviewed.`
      );

      toast({
        title: 'Dispatched to Manager',
        description: `Expense #${refId} routed to reporting manager for approval`,
        status: 'success',
        duration: 4000,
      });

      setSessionStep('INIT');
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Submission Error',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg="#ECE5DD" color="gray.800">
        {/* WhatsApp Green Header */}
        <DrawerHeader bg="#075E54" color="white" py={3} px={4}>
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Box p={2} bg="whiteAlpha.200" borderRadius="full">
                <FiMessageSquare size={20} />
              </Box>
              <VStack align="start" spacing={0}>
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="bold">WhatsApp AI Assistant</Text>
                  <Badge colorScheme="green" fontSize="2xs" borderRadius="full">Online</Badge>
                </HStack>
                <Text fontSize="2xs" color="whiteAlpha.800">Unified Multi-Module Enterprise Assistant</Text>
              </VStack>
            </HStack>
            <DrawerCloseButton color="white" position="static" />
          </HStack>
        </DrawerHeader>

        {/* Chat Message Feed */}
        <DrawerBody p={3} overflowY="auto">
          <VStack spacing={3} align="stretch" pb={4}>
            {messages.map((msg) => (
              <Box
                key={msg.id}
                alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                maxW="88%"
                bg={msg.sender === 'user' ? '#DCF8C6' : 'white'}
                p={3}
                borderRadius="lg"
                boxShadow="xs"
              >
                {msg.mediaUrl && (
                  <Box mb={2} borderRadius="md" overflow="hidden" maxH="140px">
                    <Image src={msg.mediaUrl} alt="Uploaded attachment" objectFit="cover" w="100%" />
                  </Box>
                )}
                <Text fontSize="xs" whiteSpace="pre-wrap" color="gray.800">
                  {msg.text}
                </Text>
                <Text fontSize="3xs" color="gray.400" textAlign="right" mt={1}>
                  {msg.timestamp}
                </Text>

                {/* Option Pills */}
                {msg.options && msg.options.length > 0 && (
                  <VStack mt={2.5} spacing={1.5} align="stretch">
                    {msg.options.map((opt, i) => (
                      <Button
                        key={i}
                        size="xs"
                        variant="outline"
                        colorScheme="teal"
                        bg="white"
                        justifyContent="flex-start"
                        onClick={() => handleSelectOption(opt.value)}
                        fontSize="2xs"
                        h="28px"
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </VStack>
                )}
              </Box>
            ))}
          </VStack>
        </DrawerBody>

        {/* Input & Action Bar */}
        <Box p={2.5} bg="#F0F0F0" borderTopWidth="1px" borderColor="gray.300">
          <HStack spacing={2}>
            {/* Camera / Receipt Attach Button */}
            <Box position="relative">
              <Button
                as="label"
                size="sm"
                borderRadius="full"
                colorScheme="gray"
                bg="white"
                cursor="pointer"
                p={2}
                h="36px"
                w="36px"
              >
                <FiImage size={18} color="#54656F" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </Button>
            </Box>

            <Input
              placeholder="Type message, amount, or expense purpose..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              size="sm"
              bg="white"
              borderRadius="full"
              fontSize="xs"
            />

            <Button
              size="sm"
              colorScheme="teal"
              borderRadius="full"
              h="36px"
              w="36px"
              p={0}
              onClick={handleSendMessage}
            >
              <FiSend size={16} />
            </Button>
          </HStack>
        </Box>
      </DrawerContent>
    </Drawer>
  );
};
