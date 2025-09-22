import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Text,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Box
} from '@chakra-ui/react';
import { useQuery, useConvex } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useAuth } from '../../../contexts/shared/AuthContext';

interface InvoiceItem {
  id: string;
  description: string;
  description_arabic: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percentage: number;
  vat_rate: number;
  supply_type: string;
  supply_type_arabic: string;
  is_zero_rated: boolean;
  is_exempt: boolean;
  inventory_id?: Id<"inventory">;
  sku?: string;
  purchase_price?: number;
  markup_amount?: number;
  inventory_name?: string;
  notes?: string;
  total_price?: number;
  vat_amount?: number;
}

interface InvoiceFormData {
  customer_id: string;
  customer_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  description: string;
  terms_conditions: string;
  notes: string;
  items: InvoiceItem[];
  currency: string;
  markup_percentage: number;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  status: string;
}

interface Step1CustomerInfoProps {
  formData: InvoiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
  quotationId?: Id<"quotations">;
}

const Step1CustomerInfo: React.FC<Step1CustomerInfoProps> = ({
  formData,
  setFormData,
  quotationId
}) => {
  const { selectedOrganization } = useAuth();
  const client = useConvex();
  
  // Fetch customers
  const customers = useQuery(api.customers.listCustomers, 
    selectedOrganization ? { organization_id: selectedOrganization } : "skip"
  );

  // Load quotation data if quotationId is provided
  useEffect(() => {
    const loadQuotationData = async () => {
      if (!quotationId || !selectedOrganization) return;

      try {
        console.log('🔄 Loading quotation data for:', quotationId);
        
        // Fetch quotation details
        const quotation = await client.query(api.quotations.getQuotation, { id: quotationId });
        if (quotation) {
          console.log('📋 Quotation found:', quotation);
          
          setFormData(prev => ({
            ...prev,
            customer_id: quotation.customer_id,
            customer_name: quotation.customer_name || '',
            description: quotation.description || '',
            terms_conditions: quotation.terms_conditions || '',
            notes: quotation.notes || '',
            currency: quotation.currency || 'SAR',
            markup_percentage: quotation.markup_percentage || 0,
            subtotal: quotation.subtotal || 0,
            vat_rate: quotation.tax_rate || 15,
            vat_amount: quotation.tax_amount || 0,
            total_amount: quotation.total_amount || 0
          }));
        }

        // Fetch quotation items
        const quotationItems = await client.query(api.quotations.getQuotationItems, { 
          quotation_id: quotationId 
        });
        
        if (quotationItems && quotationItems.length > 0) {
          console.log('📦 Quotation items found:', quotationItems.length);
          
          const items: InvoiceItem[] = quotationItems.map((item, index) => ({
            id: `item-${index}`,
            description: item.description,
            description_arabic: item.description_arabic,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage || 0,
            vat_rate: item.vat_rate,
            supply_type: item.supply_type,
            supply_type_arabic: item.supply_type_arabic || '',
            is_zero_rated: item.is_zero_rated || false,
            is_exempt: item.is_exempt || false,
            inventory_id: item.inventory_id,
            sku: item.sku,
            purchase_price: item.purchase_price || 0,
            markup_amount: item.markup_amount || 0,
            inventory_name: item.inventory_name || item.description,
            notes: item.notes || '',
            total_price: item.total_price || (item.quantity * item.unit_price),
            vat_amount: item.vat_amount || 0
          }));

          setFormData(prev => ({
            ...prev,
            items: items
          }));
        }
      } catch (error) {
        console.error('❌ Error loading quotation data:', error);
      }
    };

    loadQuotationData();
  }, [quotationId, selectedOrganization, client, setFormData]);

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerChange = (customerId: string) => {
    const selectedCustomer = customers?.find(c => c._id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: selectedCustomer?.customer_company_name || ''
    }));
  };

  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="lg" fontWeight="bold" color="blue.600">
        Step 1: Customer & Basic Information
      </Text>
      
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Customer Selection */}
            <FormControl isRequired>
              <FormLabel>Customer</FormLabel>
              {customers ? (
                <Select
                  placeholder="Select a customer..."
                  value={formData.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  size="lg"
                >
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>
                      {customer.customer_company_name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Box p={4} textAlign="center">
                  <Spinner size="md" />
                  <Text mt={2}>Loading customers...</Text>
                </Box>
              )}
            </FormControl>

            {/* Invoice Number - Auto-generated */}
            <FormControl isRequired>
              <FormLabel>Invoice Number</FormLabel>
              <Input
                value={formData.invoice_number}
                isReadOnly
                bg="gray.50"
                placeholder="Auto-generated"
                size="lg"
                _dark={{ bg: "gray.700" }}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Invoice number is automatically generated (preview shown)
              </Text>
            </FormControl>

            {/* Invoice Date */}
            <FormControl isRequired>
              <FormLabel>Invoice Date</FormLabel>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                size="lg"
              />
            </FormControl>

            {/* Due Date */}
            <FormControl isRequired>
              <FormLabel>Due Date</FormLabel>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                size="lg"
              />
            </FormControl>


            {/* Description */}
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter invoice description (optional)"
                rows={3}
              />
            </FormControl>

            {/* Terms & Conditions */}
            <FormControl>
              <FormLabel>Terms & Conditions</FormLabel>
              <Textarea
                value={formData.terms_conditions}
                onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                placeholder="Enter terms and conditions (optional)"
                rows={3}
              />
            </FormControl>

            {/* Notes */}
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter additional notes (optional)"
                rows={2}
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* Quotation Info Alert */}
      {quotationId && (
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>Converting from Quotation!</AlertTitle>
            <AlertDescription>
              This invoice is being created from quotation {quotationId}. 
              Customer and basic information will be pre-filled.
            </AlertDescription>
          </Box>
        </Alert>
      )}
    </VStack>
  );
};

export default Step1CustomerInfo;
