import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  useColorModeValue,
  Icon,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import { 
  FiPlus, 
  FiSave, 
  FiEdit3, 
  FiTrash2, 
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiPlus,
  FiUser,
  FiDollarSign,
  FiPercent,
  FiCheck,
  FiX
} from 'react-icons/fi';

// Types for the Excel-like table data
interface ProfitSharingRow {
  id: string;
  quotation_id?: string;
  quotation_number: string;
  total_value_without_vat: number;
  vat_15_percent: number;
  customer_name: string;
  status: string;
  markup_percentage: number;
  profit_value: number;
  
  // VAT Calculations
  input_vat_paid_total: number;
  total_purchase: number;
  output_vat_received_total: number;
  total_sale: number;
  vat_balance_to_pay: number;
  
  // Existing fields
  saudi_sponsor_id?: string;
  saudi_sponsor_name?: string;
  saudi_sponsor_percentage: number;
  saudi_sponsor_amount: number;
  // Optional fields with Yes/No selection
  has_customer_referral: boolean;
  customer_referral_percentage?: number;
  customer_referral_amount?: number;
  has_investor: boolean;
  investor_percentage?: number;
  investor_amount?: number;
  
  // New fields
  zakat: number;
  expenses: number;
  net_profit: number;
  
  // Partner distributions
  partner_1_percentage: number;
  partner_1_amount: number;
  partner_2_percentage: number;
  partner_2_amount: number;
  partner_3_percentage: number;
  partner_3_amount: number;
  payment_status: 'Paid' | 'Due';
  is_editing?: boolean;
  is_new?: boolean;
}

interface ExcelLikeProfitTableProps {
  organizationId: string;
  onDataChange?: (data: ProfitSharingRow[]) => void;
  onDataSaved?: () => void; // Callback to refresh dashboard data
}

export const ExcelLikeProfitTable: React.FC<ExcelLikeProfitTableProps> = ({
  organizationId,
  onDataChange,
  onDataSaved
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  
  // State for table data
  const [tableData, setTableData] = useState<ProfitSharingRow[]>([]);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  // Refs for table navigation
  const tableRef = useRef<HTMLTableElement>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: string } | null>(null);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const editingBg = useColorModeValue('yellow.50', 'yellow.900');

  // Queries for data
  const quotations = useQuery(api.profitSharing.getQuotationsForExcelInterface, 
    organizationId ? { organization_id: organizationId as any, limit: 50 } : "skip"
  );
  
  const activePartners = useQuery(api.profitSharing.getActivePartners,
    organizationId ? { organization_id: organizationId as any } : "skip"
  );

  const profitSharingConfig = useQuery(api.profitSharing.getProfitSharingConfig,
    organizationId ? { organization_id: organizationId as any } : "skip"
  );

  // Mutations
  const calculateOrderProfit = useMutation(api.profitSharing.calculateOrderProfit);
  const saveExcelTableData = useMutation(api.profitSharing.saveExcelTableData);
  const initializeProfitSharing = useMutation(api.profitSharing.initializeProfitSharingForOrganization);

  // Calculate partner distributions
  const calculatePartnerDistributions = useCallback((row: ProfitSharingRow) => {
    // Use net profit for partner distribution (after all deductions)
    const netProfitForDistribution = row.net_profit;
    
    // Reset partner amounts
    row.partner_1_amount = 0;
    row.partner_2_amount = 0;
    row.partner_3_amount = 0;
    
    if (activePartners && activePartners.length > 0) {
      const businessPartners = activePartners.filter(p => p.role === 'business_partner' || p.role === 'investor');
      
      if (businessPartners.length > 0) {
        const totalPercentage = businessPartners.reduce((sum, partner) => sum + (partner.profit_percentage || 0), 0);
        
        if (totalPercentage > 0) {
          // Distribute based on percentages
          const partner1 = businessPartners[0];
          const partner2 = businessPartners[1];
          const partner3 = businessPartners[2];
          
          row.partner_1_percentage = partner1?.profit_percentage || 0;
          row.partner_1_amount = Math.round((netProfitForDistribution * (partner1?.profit_percentage || 0)) / totalPercentage * 100) / 100;
          
          row.partner_2_percentage = partner2?.profit_percentage || 0;
          row.partner_2_amount = Math.round((netProfitForDistribution * (partner2?.profit_percentage || 0)) / totalPercentage * 100) / 100;
          
          row.partner_3_percentage = partner3?.profit_percentage || 0;
          row.partner_3_amount = Math.round((netProfitForDistribution * (partner3?.profit_percentage || 0)) / totalPercentage * 100) / 100;
        } else {
          // Equal distribution of net profit
          const equalShare = Math.round((netProfitForDistribution / Math.min(businessPartners.length, 3)) * 100) / 100;
          row.partner_1_amount = equalShare;
          row.partner_2_amount = businessPartners.length > 1 ? equalShare : 0;
          row.partner_3_amount = businessPartners.length > 2 ? equalShare : 0;
        }
      }
    }
    
    return row;
  }, [activePartners]);

  // Initialize table data when quotations are loaded
  useEffect(() => {
    console.log('📊 Excel Table - Quotations loaded:', quotations);
    console.log('📊 Excel Table - Quotations count:', quotations?.length);
    console.log('📊 Excel Table - Organization ID:', organizationId);
    console.log('📊 Excel Table - Active Partners:', activePartners);
    console.log('📊 Excel Table - Active Partners count:', activePartners?.length);
    console.log('📊 Excel Table - Profit Sharing Config:', profitSharingConfig);
    console.log('📊 Excel Table - Current table data:', tableData);
    
    if (quotations && quotations.length > 0) {
      console.log('📊 Excel Table - Creating initial data from quotations');
      const initialData: ProfitSharingRow[] = quotations.map((quotation, index) => {
        // Calculate profit properly
        const markup = quotation.markup_percentage || 0;
        const markupMultiplier = 1 + (markup / 100);
        const purchasePrice = quotation.subtotal / markupMultiplier;
        const profitValue = Math.round((quotation.subtotal - purchasePrice) * 100) / 100;
        
        // Calculate Saudi sponsor amount
        const sponsorPct = profitSharingConfig?.saudi_sponsor_percentage || 2;
        const sponsorAmount = Math.round((quotation.subtotal * sponsorPct / 100) * 100) / 100;
        
        // Get business partners
        const businessPartners = activePartners?.filter(p => p.role === 'business_partner') || [];
        
        const row: ProfitSharingRow = {
          id: `row-${index}`,
          quotation_id: quotation._id,
          quotation_number: quotation.quotation_number,
          total_value_without_vat: quotation.subtotal,
          vat_15_percent: quotation.tax_amount,
          customer_name: quotation.customer_name || 'N/A',
          status: quotation.status,
          markup_percentage: markup,
          profit_value: profitValue,
          
          // VAT Calculations - will be calculated by recalculateAllFields
          input_vat_paid_total: 0,
          total_purchase: 0,
          output_vat_received_total: 0,
          total_sale: 0,
          vat_balance_to_pay: 0,
          
          // Existing fields
          saudi_sponsor_id: undefined,
          saudi_sponsor_name: undefined,
          saudi_sponsor_percentage: sponsorPct,
          saudi_sponsor_amount: sponsorAmount,
          has_customer_referral: false,
          customer_referral_percentage: 0,
          customer_referral_amount: 0,
          has_investor: false,
          investor_percentage: 0,
          investor_amount: 0,
          
          // New fields
          zakat: 0,
          expenses: 0,
          net_profit: 0,
          
          // Partner distributions
          partner_1_percentage: businessPartners[0]?.profit_percentage || 0,
          partner_1_amount: 0,
          partner_2_percentage: businessPartners[1]?.profit_percentage || 0,
          partner_2_amount: 0,
          partner_3_percentage: businessPartners[2]?.profit_percentage || 0,
          partner_3_amount: 0,
          payment_status: 'Due' as const,
          is_editing: false,
          is_new: false,
        };
        
        // Calculate partner distributions
        const finalRow = calculatePartnerDistributions(row);
        return finalRow;
      });
      
      console.log('📊 Excel Table - Initial data created:', initialData);
      setTableData(initialData);
    } else if (quotations && quotations.length === 0) {
      // If no quotations, create a sample row for testing
      console.log('📊 Excel Table - No quotations found, creating sample row');
      const sampleRow: ProfitSharingRow = {
        id: 'sample-row',
        quotation_id: undefined,
        quotation_number: '',
        total_value_without_vat: 2000,
        vat_15_percent: 300,
        customer_name: 'Sample Customer',
        status: 'delivered',
        markup_percentage: 100,
        profit_value: 1000,
        
        // VAT Calculations - will be calculated by recalculateAllFields
        input_vat_paid_total: 0,
        total_purchase: 0,
        output_vat_received_total: 0,
        total_sale: 0,
        vat_balance_to_pay: 0,
        
        // Existing fields
        saudi_sponsor_id: undefined,
        saudi_sponsor_name: undefined,
        saudi_sponsor_percentage: 2,
        saudi_sponsor_amount: 40,
        has_customer_referral: false,
        customer_referral_percentage: 0,
        customer_referral_amount: 0,
        has_investor: false,
        investor_percentage: 0,
        investor_amount: 0,
        
        // New fields
        zakat: 0,
        expenses: 0,
        net_profit: 0,
        
        // Partner distributions
        partner_1_percentage: 30,
        partner_1_amount: 288,
        partner_2_percentage: 25,
        partner_2_amount: 240,
        partner_3_percentage: 20,
        partner_3_amount: 192,
        payment_status: 'Due' as const,
        is_editing: false,
        is_new: false,
      };
      setTableData([sampleRow]);
    }
  }, [quotations, profitSharingConfig, activePartners]);

  // Recalculate all dependent fields
  const recalculateAllFields = useCallback((currentRow: ProfitSharingRow) => {
    // VAT Calculations
    // Total Sale = total_value_without_vat + vat_15_percent
    currentRow.total_sale = Math.round((currentRow.total_value_without_vat + currentRow.vat_15_percent) * 100) / 100;
    currentRow.output_vat_received_total = currentRow.vat_15_percent;
    
    // Calculate Input VAT and Total Purchase from profit calculation
    // If purchase price = 1000, markup = 50%, then order value = 1500, profit = 500
    const markupMultiplier = 1 + (currentRow.markup_percentage / 100);
    const costPrice = currentRow.total_value_without_vat / markupMultiplier;
    currentRow.total_purchase = Math.round(costPrice * 100) / 100;
    
    // Input VAT is 15% of total purchase (since purchase prices include VAT)
    currentRow.input_vat_paid_total = Math.round((currentRow.total_purchase * 0.15) * 100) / 100;
    
    // VAT Balance = Output VAT - Input VAT
    currentRow.vat_balance_to_pay = Math.round((currentRow.output_vat_received_total - currentRow.input_vat_paid_total) * 100) / 100;
    
    // Recalculate profit based on markup percentage (2 decimal places)
    currentRow.profit_value = Math.round((currentRow.total_value_without_vat - costPrice) * 100) / 100;
    
    // Recalculate Saudi sponsor amount (2 decimal places) - from order value (not profit)
    currentRow.saudi_sponsor_amount = Math.round((currentRow.total_value_without_vat * currentRow.saudi_sponsor_percentage) / 100 * 100) / 100;
    
    // Recalculate customer referral amount (2 decimal places) - from order value (not profit)
    if (currentRow.has_customer_referral && currentRow.customer_referral_percentage) {
      currentRow.customer_referral_amount = Math.round((currentRow.total_value_without_vat * currentRow.customer_referral_percentage / 100) * 100) / 100;
    } else {
      currentRow.customer_referral_amount = 0;
    }
    
    // Recalculate investor amount (2 decimal places) - from order value (not profit)
    if (currentRow.has_investor && currentRow.investor_percentage) {
      currentRow.investor_amount = Math.round((currentRow.total_value_without_vat * currentRow.investor_percentage / 100) * 100) / 100;
    } else {
      currentRow.investor_amount = 0;
    }
    
    // Calculate Zakat (2.5% of net profit after deductions)
    const profitAfterDeductions = currentRow.profit_value - currentRow.saudi_sponsor_amount - (currentRow.customer_referral_amount || 0) - (currentRow.investor_amount || 0);
    currentRow.zakat = Math.round((profitAfterDeductions * 0.025) * 100) / 100;
    
    // Calculate Net Profit (after all deductions including expenses)
    currentRow.net_profit = Math.round((profitAfterDeductions - currentRow.zakat - currentRow.expenses) * 100) / 100;
    
    return currentRow;
  }, []);

  // Update existing table data when partners are loaded - REAL-TIME UPDATE
  useEffect(() => {
    if (activePartners && activePartners.length > 0 && tableData.length > 0) {
      console.log('🔄 Real-time update: Partners changed, recalculating all rows');
      const updatedData = tableData.map(row => {
        // First recalculate all fields, then partner distributions
        const recalculatedRow = recalculateAllFields({ ...row });
        return calculatePartnerDistributions(recalculatedRow);
      });
      setTableData(updatedData);
      onDataChange?.(updatedData);
    }
  }, [activePartners, recalculateAllFields, calculatePartnerDistributions, onDataChange]);

  // Update table data when profit sharing config changes - REAL-TIME UPDATE
  useEffect(() => {
    if (profitSharingConfig && tableData.length > 0) {
      console.log('🔄 Real-time update: Profit sharing config changed, recalculating all rows');
      const updatedData = tableData.map(row => {
        // Update Saudi sponsor percentage from config
        row.saudi_sponsor_percentage = profitSharingConfig.saudi_sponsor_percentage || 2;
        
        // Recalculate all fields and partner distributions
        const recalculatedRow = recalculateAllFields({ ...row });
        return calculatePartnerDistributions(recalculatedRow);
      });
      setTableData(updatedData);
      onDataChange?.(updatedData);
    }
  }, [profitSharingConfig, recalculateAllFields, calculatePartnerDistributions, onDataChange]);

  // Handle multiple cell changes at once (for atomic updates)
  const handleBulkCellChange = (rowIndex: number, updates: Partial<ProfitSharingRow>) => {
    const newData = [...tableData];
    const row = { ...newData[rowIndex] };
    
    // Apply all updates
    Object.entries(updates).forEach(([field, value]) => {
      (row as any)[field] = value;
    });
    
    // Recalculate all dependent fields
    const updatedRow = recalculateAllFields(row);
    
    // Recalculate partner distributions
    const finalRow = calculatePartnerDistributions(updatedRow);
    newData[rowIndex] = finalRow;
    
    setTableData(newData);
    onDataChange?.(newData);
  };

  // Handle cell value change
  const handleCellChange = (rowIndex: number, field: keyof ProfitSharingRow, value: any) => {
    const newData = [...tableData];
    const row = { ...newData[rowIndex] };
    
    // Update the field
    (row as any)[field] = value;
    
    // Handle specific field logic
    if (field === 'has_customer_referral') {
      if (!value) {
        row.customer_referral_percentage = 0;
        row.customer_referral_amount = 0;
      }
    }
    
    if (field === 'has_investor') {
      if (!value) {
        row.investor_percentage = 0;
        row.investor_amount = 0;
      }
    }
    
    // Recalculate all fields
    const updatedRow = recalculateAllFields(row);
    
    // Recalculate partner distributions
    const finalRow = calculatePartnerDistributions(updatedRow);
    newData[rowIndex] = finalRow;
    
    setTableData(newData);
    onDataChange?.(newData);
  };

  // Add new row
  const addNewRow = () => {
    const newRow: ProfitSharingRow = {
      id: `new-row-${Date.now()}`,
      quotation_number: '',
      total_value_without_vat: 0,
      vat_15_percent: 0,
      customer_name: '',
      status: 'Draft',
      markup_percentage: 0,
      profit_value: 0,
      
      // VAT Calculations - will be calculated by recalculateAllFields
      input_vat_paid_total: 0,
      total_purchase: 0,
      output_vat_received_total: 0,
      total_sale: 0,
      vat_balance_to_pay: 0,
      
      // Existing fields
      saudi_sponsor_id: undefined,
      saudi_sponsor_name: undefined,
      saudi_sponsor_percentage: profitSharingConfig?.saudi_sponsor_percentage || 2,
      saudi_sponsor_amount: 0,
      has_customer_referral: false,
      customer_referral_percentage: 0,
      customer_referral_amount: 0,
      has_investor: false,
      investor_percentage: 0,
      investor_amount: 0,
      
      // New fields
      zakat: 0,
      expenses: 0,
      net_profit: 0,
      
      // Partner distributions
      partner_1_percentage: activePartners && activePartners.filter(p => p.role === 'business_partner')[0]?.profit_percentage || 0,
      partner_1_amount: 0,
      partner_2_percentage: activePartners && activePartners.filter(p => p.role === 'business_partner')[1]?.profit_percentage || 0,
      partner_2_amount: 0,
      partner_3_percentage: activePartners && activePartners.filter(p => p.role === 'business_partner')[2]?.profit_percentage || 0,
      partner_3_amount: 0,
      payment_status: 'Due',
      is_editing: true,
      is_new: true,
    };
    
    setTableData([newRow, ...tableData]);
    setEditingCell({ row: 0, col: 'quotation_number' });
  };

  // Delete selected rows
  const deleteSelectedRows = () => {
    const newData = tableData.filter((_, index) => !selectedRows.has(index));
    setTableData(newData);
    setSelectedRows(new Set());
    onDataChange?.(newData);
  };

  // Save data
  const saveData = async () => {
    if (!user || !organizationId) {
      toast({
        title: "Error",
        description: "User or organization not found.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const result = await saveExcelTableData({
        organization_id: organizationId as any,
        table_data: tableData.map(row => ({
          quotation_id: row.quotation_id as any,
          quotation_number: row.quotation_number,
          total_value_without_vat: row.total_value_without_vat,
          vat_15_percent: row.vat_15_percent,
          customer_name: row.customer_name,
          status: row.status,
          markup_percentage: row.markup_percentage,
          profit_value: row.profit_value,
          
          // VAT Calculations
          input_vat_paid_total: row.input_vat_paid_total,
          total_purchase: row.total_purchase,
          output_vat_received_total: row.output_vat_received_total,
          total_sale: row.total_sale,
          vat_balance_to_pay: row.vat_balance_to_pay,
          
          // Existing fields
          saudi_sponsor_percentage: row.saudi_sponsor_percentage,
          saudi_sponsor_amount: row.saudi_sponsor_amount,
          customer_referral_percentage: row.customer_referral_percentage,
          customer_referral_amount: row.customer_referral_amount,
          investor_percentage: row.investor_percentage,
          investor_amount: row.investor_amount,
          
          // New fields
          zakat: row.zakat,
          expenses: row.expenses,
          net_profit: row.net_profit,
          
          // Partner distributions
          partner_1_percentage: row.partner_1_percentage,
          partner_1_amount: row.partner_1_amount,
          partner_2_percentage: row.partner_2_percentage,
          partner_2_amount: row.partner_2_amount,
          partner_3_percentage: row.partner_3_percentage,
          partner_3_amount: row.partner_3_amount,
          payment_status: row.payment_status,
        })),
        created_by: user.email || user.name || "Unknown User",
      });

      if (result.success) {
        toast({
          title: "Data Saved",
          description: result.message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // Refresh dashboard data
        onDataSaved?.();
      } else {
        toast({
          title: "Error",
          description: result.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save data. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Export to Excel (placeholder)
  const exportToExcel = () => {
    toast({
      title: "Export Feature",
      description: "Excel export feature will be implemented in the next update.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Import from Excel (placeholder)
  const importFromExcel = () => {
    toast({
      title: "Import Feature",
      description: "Excel import feature will be implemented in the next update.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Initialize profit sharing for organization
  const handleInitializeProfitSharing = async () => {
    if (!organizationId || !user) return;
    
    try {
      const result = await initializeProfitSharing({
        organization_id: organizationId as any,
        created_by: user.email || user.name || "Unknown User",
      });
      
      if (result.success) {
        toast({
          title: "Profit Sharing Initialized",
          description: result.message,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Refresh the page to reload data
        window.location.reload();
      } else {
        toast({
          title: "Initialization Failed",
          description: result.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to initialize profit sharing: ${error}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Render cell content
  const renderCell = (row: ProfitSharingRow, rowIndex: number, field: keyof ProfitSharingRow, value: any) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === field;
    const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === field;
    
    const cellStyle = {
      bg: isEditing ? editingBg : isFocused ? selectedBg : 'transparent',
      border: isFocused ? '2px solid' : '1px solid',
      borderColor: isFocused ? 'blue.300' : borderColor,
      p: 1,
      minW: '120px',
    };

    if (field === 'quotation_number') {
      return (
        <Td {...cellStyle}>
          {isEditing ? (
            <Select
              value={value}
              onChange={(e) => {
                const selectedQuotation = quotations?.find(q => q.quotation_number === e.target.value);
                if (selectedQuotation) {
                  console.log('📊 Auto-populating from quotation:', selectedQuotation);
                  
                  // Update all fields at once to avoid multiple re-renders
                  const newData = [...tableData];
                  const row = { ...newData[rowIndex] };
                  
                  // Basic quotation data
                  row.quotation_id = selectedQuotation._id;
                  row.quotation_number = selectedQuotation.quotation_number;
                  row.total_value_without_vat = selectedQuotation.subtotal;
                  row.vat_15_percent = selectedQuotation.tax_amount;
                  row.customer_name = selectedQuotation.customer_name || 'N/A';
                  row.status = selectedQuotation.status;
                  row.markup_percentage = selectedQuotation.markup_percentage || 0;
                  
                  // Calculate profit based on markup percentage (2 decimal places)
                  const markup = selectedQuotation.markup_percentage || 0;
                  const markupMultiplier = 1 + (markup / 100);
                  const purchasePrice = selectedQuotation.subtotal / markupMultiplier;
                  row.profit_value = Math.round((selectedQuotation.subtotal - purchasePrice) * 100) / 100;
                  
                  // Saudi sponsor amount (2 decimal places)
                  const saudiSponsorPct = profitSharingConfig?.saudi_sponsor_percentage || 2;
                  row.saudi_sponsor_id = undefined;
                  row.saudi_sponsor_name = undefined;
                  row.saudi_sponsor_percentage = saudiSponsorPct;
                  row.saudi_sponsor_amount = Math.round((selectedQuotation.subtotal * saudiSponsorPct / 100) * 100) / 100;
                  
                  // Reset optional fields
                  row.has_customer_referral = false;
                  row.customer_referral_percentage = 0;
                  row.customer_referral_amount = 0;
                  row.has_investor = false;
                  row.investor_percentage = 0;
                  row.investor_amount = 0;
                  
                  // Auto-populate partners from partner management
                  if (activePartners && activePartners.length > 0) {
                    // Filter business partners only (not investors or sponsors)
                    const businessPartners = activePartners.filter(p => p.role === 'business_partner');
                    const partners = businessPartners.slice(0, 3); // Take first 3 business partners
                    
                    partners.forEach((partner, index) => {
                      const partnerKey = `partner_${index + 1}` as keyof ProfitSharingRow;
                      const percentageKey = `${partnerKey}_percentage` as keyof ProfitSharingRow;
                      const amountKey = `${partnerKey}_amount` as keyof ProfitSharingRow;
                      
                      (row as any)[percentageKey] = partner.profit_percentage || 0;
                      (row as any)[amountKey] = Math.round((selectedQuotation.subtotal * (partner.profit_percentage || 0) / 100) * 100) / 100;
                    });
                  }
                  
                  newData[rowIndex] = row;
                  setTableData(newData);
                  onDataChange?.(newData);
                  
                  console.log('📊 Auto-populated row:', row);
                }
                setEditingCell(null);
              }}
              size="sm"
              autoFocus
            >
              <option value="">Select Quotation</option>
              {quotations?.map((quotation) => {
                console.log('📊 Dropdown - Quotation:', quotation.quotation_number, quotation.customer_name, quotation.subtotal);
                return (
                  <option key={quotation._id} value={quotation.quotation_number}>
                    {quotation.quotation_number} - {quotation.customer_name} - {quotation.subtotal} ر.س
                  </option>
                );
              })}
            </Select>
          ) : (
            <Text
              fontSize="sm"
              cursor="pointer"
              onClick={() => setEditingCell({ row: rowIndex, col: field })}
            >
              {value || 'Click to select'}
            </Text>
          )}
        </Td>
      );
    }

    if (field === 'has_customer_referral' || field === 'has_investor') {
      return (
        <Td {...cellStyle}>
          {isEditing ? (
            <Select
              value={value ? 'Yes' : 'No'}
              onChange={(e) => {
                handleCellChange(rowIndex, field, e.target.value === 'Yes');
                setEditingCell(null);
              }}
              size="sm"
              autoFocus
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </Select>
          ) : (
            <Badge 
              colorScheme={value ? 'green' : 'gray'} 
              size="sm"
              cursor="pointer"
              onClick={() => setEditingCell({ row: rowIndex, col: field })}
            >
              {value ? 'Yes' : 'No'}
            </Badge>
          )}
        </Td>
      );
    }

    if (field === 'saudi_sponsor_percentage') {
      // Saudi Sponsor dropdown - show available Saudi sponsors from partners
      // Look for partners with role 'saudi_sponsor' or partners with low percentages (likely sponsors)
      const saudiSponsors = activePartners?.filter(p => 
        p.role === 'saudi_sponsor' || 
        (p.role === 'investor' && p.profit_percentage <= 10) ||
        (p.role === 'business_partner' && p.profit_percentage <= 10)
      ) || [];
      
      return (
        <Td {...cellStyle}>
          {isEditing ? (
            <Select
              value={row.saudi_sponsor_id || ''}
              onChange={(e) => {
                const selectedSponsor = saudiSponsors.find(s => s._id === e.target.value);
                if (selectedSponsor) {
                  // Update all Saudi sponsor fields at once
                  handleBulkCellChange(rowIndex, {
                    saudi_sponsor_id: selectedSponsor._id,
                    saudi_sponsor_name: selectedSponsor.name,
                    saudi_sponsor_percentage: selectedSponsor.profit_percentage,
                  });
                }
                setEditingCell(null);
              }}
              size="sm"
              autoFocus
            >
              <option value="">Select Saudi Sponsor</option>
              {saudiSponsors.map((sponsor) => (
                <option key={sponsor._id} value={sponsor._id}>
                  {sponsor.name} ({sponsor.profit_percentage}%)
                </option>
              ))}
            </Select>
          ) : (
            <Text 
              fontSize="sm" 
              fontWeight="medium"
              cursor="pointer"
              onClick={() => setEditingCell({ row: rowIndex, col: field })}
              color={row.saudi_sponsor_name ? "blue.600" : "gray.500"}
            >
              {row.saudi_sponsor_name ? `${row.saudi_sponsor_name} (${value}%)` : 'Select Sponsor'}
            </Text>
          )}
        </Td>
      );
    }

    if (field === 'customer_referral_percentage' || field === 'investor_percentage') {
      // Check if referral/investor is enabled
      const isReferralEnabled = field === 'customer_referral_percentage' ? row.has_customer_referral : row.has_investor;
      
      return (
        <Td {...cellStyle}>
          {isEditing && isReferralEnabled ? (
            <NumberInput
              value={value || 0}
              onChange={(valueString, valueNumber) => {
                handleCellChange(rowIndex, field, valueNumber || 0);
                setEditingCell(null);
              }}
              size="sm"
              min={0}
              max={100}
              precision={2}
              autoFocus
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          ) : (
            <Text 
              fontSize="sm" 
              fontWeight="medium"
              cursor={isReferralEnabled ? "pointer" : "not-allowed"}
              color={isReferralEnabled ? "inherit" : "gray.400"}
              onClick={() => isReferralEnabled && setEditingCell({ row: rowIndex, col: field })}
            >
              {isReferralEnabled ? (value ? `${value}%` : '0%') : 'N/A'}
            </Text>
          )}
        </Td>
      );
    }

    if (field === 'payment_status') {
      return (
        <Td {...cellStyle}>
          {isEditing ? (
            <Select
              value={value}
              onChange={(e) => {
                handleCellChange(rowIndex, field, e.target.value);
                setEditingCell(null);
              }}
              size="sm"
              autoFocus
            >
              <option value="Due">Due</option>
              <option value="Paid">Paid</option>
            </Select>
          ) : (
            <Badge
              colorScheme={value === 'Paid' ? 'green' : 'orange'}
              size="sm"
              cursor="pointer"
              onClick={() => setEditingCell({ row: rowIndex, col: field })}
            >
              {value}
            </Badge>
          )}
        </Td>
      );
    }

    if (typeof value === 'number' && (field.includes('percentage') || field.includes('amount'))) {
      return (
        <Td {...cellStyle}>
          {isEditing ? (
            <NumberInput
              value={value}
              onChange={(valueString, valueNumber) => handleCellChange(rowIndex, field, valueNumber || 0)}
              size="sm"
              precision={2}
              min={0}
              max={field.includes('percentage') ? 100 : undefined}
            >
              <NumberInputField autoFocus />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          ) : (
            <Text
              fontSize="sm"
              cursor="pointer"
              onClick={() => setEditingCell({ row: rowIndex, col: field })}
              color={field.includes('amount') ? 'green.600' : 'blue.600'}
              fontWeight={field.includes('amount') ? 'medium' : 'normal'}
            >
              {field.includes('percentage') ? `${value}%` : `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`}
            </Text>
          )}
        </Td>
      );
    }

    // Handle new VAT and financial fields
    if (field === 'input_vat_paid_total' || field === 'total_purchase' || field === 'output_vat_received_total' || 
        field === 'total_sale' || field === 'vat_balance_to_pay' || field === 'zakat' || field === 'net_profit') {
      return (
        <Td {...cellStyle}>
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={field === 'vat_balance_to_pay' ? (value >= 0 ? 'green.600' : 'red.600') : 
                   field === 'net_profit' ? 'green.600' : 'blue.600'}
          >
            {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
          </Text>
        </Td>
      );
    }

    // Handle expenses field (editable)
    if (field === 'expenses') {
      return (
        <Td {...cellStyle}>
          {isEditing ? (
            <NumberInput
              value={value || 0}
              onChange={(valueString, valueNumber) => {
                handleCellChange(rowIndex, field, valueNumber || 0);
                setEditingCell(null);
              }}
              size="sm"
              min={0}
              precision={2}
              autoFocus
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          ) : (
            <Text
              fontSize="sm"
              cursor="pointer"
              onClick={() => setEditingCell({ row: rowIndex, col: field })}
              color="orange.600"
              fontWeight="medium"
            >
              {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
            </Text>
          )}
        </Td>
      );
    }

    return (
      <Td {...cellStyle}>
        {isEditing ? (
          <Input
            value={value}
            onChange={(e) => handleCellChange(rowIndex, field, e.target.value)}
            size="sm"
            autoFocus
            onBlur={() => setEditingCell(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditingCell(null);
              }
            }}
          />
        ) : (
          <Text
            fontSize="sm"
            cursor="pointer"
            onClick={() => setEditingCell({ row: rowIndex, col: field })}
          >
            {value}
          </Text>
        )}
      </Td>
    );
  };

  // Show loading state
  if (!quotations) {
    return (
      <Box p={6} textAlign="center">
        <Text>Loading quotations...</Text>
      </Box>
    );
  }

  // Show error state if no quotations
  if (quotations.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>No Quotations Found</AlertTitle>
          <AlertDescription>
            No quotations found for this organization. Please create some quotations first.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Debug Info */}
      <Box p={2} bg="gray.100" borderRadius="md" mb={4}>
        <VStack spacing={1} align="start">
          <Text fontSize="sm">
            📊 Debug: Found {quotations.length} quotations for organization {organizationId}
          </Text>
          <Text fontSize="sm">
            👥 Partners: {activePartners?.length || 0} active partners found
          </Text>
          <Text fontSize="sm">
            ⚙️ Config: {profitSharingConfig ? 'Loaded' : 'Not found'}
          </Text>
          {activePartners && activePartners.length > 0 && (
            <Text fontSize="sm">
              📋 Partner List: {activePartners.map(p => `${p.name} (${p.profit_percentage}%)`).join(', ')}
            </Text>
          )}
        </VStack>
      </Box>
      {/* Toolbar */}
      <HStack spacing={4} mb={4} p={4} bg={headerBg} borderRadius="md">
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="blue"
          size="sm"
          onClick={addNewRow}
        >
          Add Row
        </Button>
        
        <Button
          leftIcon={<Icon as={FiSave} />}
          colorScheme="green"
          size="sm"
          onClick={saveData}
        >
          Save
        </Button>
        
        <Button
          leftIcon={<Icon as={FiDownload} />}
          variant="outline"
          size="sm"
          onClick={exportToExcel}
        >
          Export
        </Button>
        
        <Button
          leftIcon={<Icon as={FiUpload} />}
          variant="outline"
          size="sm"
          onClick={importFromExcel}
        >
          Import
        </Button>
        
        {(!activePartners || activePartners.length === 0) && (
          <Button
            leftIcon={<Icon as={FiUser} />}
            colorScheme="orange"
            size="sm"
            onClick={handleInitializeProfitSharing}
          >
            Initialize Partners
          </Button>
        )}
        
        {selectedRows.size > 0 && (
          <Button
            leftIcon={<Icon as={FiTrash2} />}
            colorScheme="red"
            size="sm"
            onClick={deleteSelectedRows}
          >
            Delete ({selectedRows.size})
          </Button>
        )}
        
        <Button
          leftIcon={<Icon as={FiRefreshCw} />}
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </HStack>

      {/* Table */}
      <Box overflowX="auto" border="1px solid" borderColor={borderColor} borderRadius="md" maxW="100%">
        <Text fontSize="xs" color="gray.500" p={2}>
          Debug: Table has {tableData.length} rows. First row data: {JSON.stringify(tableData[0] || {}, null, 2)}
        </Text>
        <Table ref={tableRef} size="sm" variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              <Th p={2} minW="50px">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(tableData.map((_, index) => index)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                />
              </Th>
              <Th p={2} minW="120px">Quotation Number</Th>
              <Th p={2} minW="120px">Total Value (excl. VAT)</Th>
              <Th p={2} minW="100px">15% VAT</Th>
              <Th p={2} minW="120px">Customer Name</Th>
              <Th p={2} minW="100px">Status</Th>
              <Th p={2} minW="100px">Markup %</Th>
              <Th p={2} minW="120px">Profit</Th>
              
              {/* VAT Calculations */}
              <Th p={2} minW="120px" bg="orange.100">Input VAT Paid</Th>
              <Th p={2} minW="120px" bg="orange.100">Total Purchase</Th>
              <Th p={2} minW="120px" bg="blue.100">Output VAT Received</Th>
              <Th p={2} minW="120px" bg="blue.100">Total Sale</Th>
              <Th p={2} minW="120px" bg="green.100">VAT Balance</Th>
              
              <Th p={2} minW="120px">Saudi Sponsor</Th>
              <Th p={2} minW="120px">Sponsor Amount</Th>
              <Th p={2} minW="80px">Has Referral?</Th>
              <Th p={2} minW="100px">Ref %</Th>
              <Th p={2} minW="120px">Customer Referral</Th>
              <Th p={2} minW="80px">Has Investor?</Th>
              <Th p={2} minW="100px">Investor %</Th>
              <Th p={2} minW="120px">Investor</Th>
              
              {/* New Fields */}
              <Th p={2} minW="100px" bg="purple.100">Zakat</Th>
              <Th p={2} minW="120px" bg="yellow.100">Expenses</Th>
              <Th p={2} minW="120px" bg="green.200">Net Profit</Th>
              
              <Th p={2} minW="120px">
                {activePartners && activePartners.filter(p => p.role === 'business_partner')[0]?.name || 'Partner-1'}
              </Th>
              <Th p={2} minW="120px">
                {activePartners && activePartners.filter(p => p.role === 'business_partner')[1]?.name || 'Partner-2'}
              </Th>
              <Th p={2} minW="120px">
                {activePartners && activePartners.filter(p => p.role === 'business_partner')[2]?.name || 'Partner-3'}
              </Th>
              <Th p={2} minW="100px">Payment Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tableData.map((row, rowIndex) => (
              <Tr
                key={row.id}
                bg={selectedRows.has(rowIndex) ? selectedBg : 'transparent'}
                _hover={{ bg: selectedBg }}
              >
                <Td p={2}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIndex)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedRows);
                      if (e.target.checked) {
                        newSelected.add(rowIndex);
                      } else {
                        newSelected.delete(rowIndex);
                      }
                      setSelectedRows(newSelected);
                    }}
                  />
                </Td>
                {renderCell(row, rowIndex, 'quotation_number', row.quotation_number)}
                {renderCell(row, rowIndex, 'total_value_without_vat', row.total_value_without_vat)}
                {renderCell(row, rowIndex, 'vat_15_percent', row.vat_15_percent)}
                {renderCell(row, rowIndex, 'customer_name', row.customer_name)}
                {renderCell(row, rowIndex, 'status', row.status)}
                {renderCell(row, rowIndex, 'markup_percentage', row.markup_percentage)}
                {renderCell(row, rowIndex, 'profit_value', row.profit_value)}
                
                {/* VAT Calculations */}
                {renderCell(row, rowIndex, 'input_vat_paid_total', row.input_vat_paid_total)}
                {renderCell(row, rowIndex, 'total_purchase', row.total_purchase)}
                {renderCell(row, rowIndex, 'output_vat_received_total', row.output_vat_received_total)}
                {renderCell(row, rowIndex, 'total_sale', row.total_sale)}
                {renderCell(row, rowIndex, 'vat_balance_to_pay', row.vat_balance_to_pay)}
                
                {renderCell(row, rowIndex, 'saudi_sponsor_percentage', row.saudi_sponsor_percentage)}
                {renderCell(row, rowIndex, 'saudi_sponsor_amount', row.saudi_sponsor_amount)}
                {renderCell(row, rowIndex, 'has_customer_referral', row.has_customer_referral)}
                {renderCell(row, rowIndex, 'customer_referral_percentage', row.customer_referral_percentage)}
                {renderCell(row, rowIndex, 'customer_referral_amount', row.customer_referral_amount)}
                {renderCell(row, rowIndex, 'has_investor', row.has_investor)}
                {renderCell(row, rowIndex, 'investor_percentage', row.investor_percentage)}
                {renderCell(row, rowIndex, 'investor_amount', row.investor_amount)}
                
                {/* New Fields */}
                {renderCell(row, rowIndex, 'zakat', row.zakat)}
                {renderCell(row, rowIndex, 'expenses', row.expenses)}
                {renderCell(row, rowIndex, 'net_profit', row.net_profit)}
                
                {renderCell(row, rowIndex, 'partner_1_amount', row.partner_1_amount)}
                {renderCell(row, rowIndex, 'partner_2_amount', row.partner_2_amount)}
                {renderCell(row, rowIndex, 'partner_3_amount', row.partner_3_amount)}
                {renderCell(row, rowIndex, 'payment_status', row.payment_status)}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Summary */}
      {tableData.length > 0 && (
        <Box mt={4} p={4} bg={headerBg} borderRadius="md">
          <HStack spacing={8} justify="center">
            <VStack spacing={1}>
              <Text fontSize="sm" color="gray.600">Total Orders</Text>
              <Text fontSize="lg" fontWeight="bold">{tableData.length}</Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="sm" color="gray.600">Total Profit</Text>
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                {tableData.reduce((sum, row) => sum + row.profit_value, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="sm" color="gray.600">Total Saudi Sponsor</Text>
              <Text fontSize="lg" fontWeight="bold" color="purple.600">
                {tableData.reduce((sum, row) => sum + row.saudi_sponsor_amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="sm" color="gray.600">Paid Orders</Text>
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                {tableData.filter(row => row.payment_status === 'Paid').length}
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}

      {/* Instructions */}
      <Alert status="info" mt={4}>
        <AlertIcon />
        <Box>
          <AlertTitle>Excel-like Interface Instructions:</AlertTitle>
          <AlertDescription>
            • Click on any cell to edit it • Use Tab/Enter to navigate between cells • 
            Select quotations from dropdown to auto-populate data • 
            Partner distributions are calculated automatically based on your organization's partner configuration
          </AlertDescription>
        </Box>
      </Alert>
    </Box>
  );
};
