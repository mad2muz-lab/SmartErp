import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Heading,
  Icon,
} from '@chakra-ui/react';
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi';
import { useAuth } from '../contexts/shared/AuthContext';
import { useQuotationLogic } from '../components/quotations/useQuotationLogic';
import QuotationForm from '../components/quotations/QuotationForm';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../convex/_generated/api';

interface QuotationFormScreenProps {
  quotationId?: string;
  isEditMode?: boolean;
}

const QuotationFormScreen: React.FC<QuotationFormScreenProps> = ({ 
  quotationId, 
  isEditMode = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, selectedOrganization, loading: authLoading } = useAuth();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Get quotation data from location state or props
  const selectedQuotation = location.state?.quotation || null;
  const editMode = isEditMode || location.state?.isEditMode || false;

  // Pass auth data to the hook to avoid context timing issues
  const quotationLogic = useQuotationLogic(selectedOrganization, { user, loading: authLoading });
  
  // Initialize form data when quotation is provided
  useEffect(() => {
    console.log('QuotationFormScreen useEffect triggered');
    console.log('selectedQuotation:', selectedQuotation);
    console.log('editMode:', editMode);
    console.log('quotationLogic:', quotationLogic);
    
    if (selectedQuotation && quotationLogic) {
      console.log('Loading quotation data for editing:', selectedQuotation._id);
      console.log('Full quotation data:', selectedQuotation);
      
      // Load quotation data into form
      const { setFormData } = quotationLogic;
      
      // Get customer name from customer ID
      let customerName = selectedQuotation.customer_name || '';
      if (selectedQuotation.customer_id && quotationLogic.customers) {
        const customer = quotationLogic.customers.find(c => c._id === selectedQuotation.customer_id);
        if (customer) {
          customerName = customer.customer_company_name;
        }
      }
      
      setFormData({
        quotation_number: selectedQuotation.quotation_number,
        customer_id: selectedQuotation.customer_id || '',
        customer_name: customerName,
        reference_number: selectedQuotation.reference_number || selectedQuotation.subject || '',
        description: selectedQuotation.description || '',
        status: selectedQuotation.status,
        valid_until: selectedQuotation.valid_until || '',
        terms_conditions: selectedQuotation.terms_conditions || '',
        notes: selectedQuotation.notes || '',
        subtotal: selectedQuotation.subtotal || 0,
        tax_rate: selectedQuotation.tax_rate || 0,
        tax_amount: selectedQuotation.tax_amount || 0,
        total_amount: selectedQuotation.total_amount || 0,
        currency: selectedQuotation.currency || 'SAR',
        salesperson: selectedQuotation.salesperson || '',
        markup_percentage: selectedQuotation.markup_percentage || 0,
        lead_id: selectedQuotation.lead_id,
        lead_number: selectedQuotation.lead_number,
      });
      
      // Use the existing mechanism to load quotation items
      if (editMode) {
        console.log('Setting selectedQuotationForItems to:', selectedQuotation._id);
        setSelectedQuotationForItems(selectedQuotation._id);
      }
    }
  }, [selectedQuotation, editMode]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Quotation Management</Heading>
            <Text color="gray.600">Loading...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Show loading if quotationLogic is not ready
  if (!quotationLogic) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Quotation Management</Heading>
            <Text color="gray.600">Loading quotation data...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Extract values from the quotation logic hook
  const {
    formData,
    setFormData,
    quotationItems,
    setQuotationItems,
    allCustomers,
    allInventoryItems,
    allUnits,
    customerRefreshKey,
    inventoryRefreshKey,
    handleCustomerSelection,
    handleCustomerChange,
    handleItemChange,
    handleInventoryItemSelection,
    updateQuotationItem,
    addQuotationItem,
    removeQuotationItem,
    updateSubtotal,
    handleImportItems,
    handleExportItems,
    handleMarkupChange,
    saveTermsToOrganization,
    handleExportTemplate,
    customers,
    inventory,
    saveCustomUnits,
    initializeUnitsForOrganization,
    generateQuotationNumber,
    client,
    selectedQuotationForItems,
    setSelectedQuotationForItems,
  } = quotationLogic;

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (editMode && selectedQuotation) {
        // Update existing quotation
        await quotationLogic.updateQuotation({
          ...formData,
          quotation_id: selectedQuotation._id,
        });
      } else {
        // Create new quotation - include organization_id and generate quotation number if empty
        const quotationData = {
          ...formData,
          organization_id: quotationLogic.selectedOrganization as any,
        };
        
        // Generate quotation number if not already set
        if (!quotationData.quotation_number) {
          quotationData.quotation_number = generateQuotationNumber();
        }
        
        await quotationLogic.createQuotation(quotationData);
      }
      
      // Navigate back to quotation list
      navigate('/quotations');
    } catch (error) {
      console.error('Error saving quotation:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/quotations');
  };

  return (
    <Box p={6} bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header with breadcrumb and actions */}
        <Box bg={cardBg} p={6} borderRadius="lg" border="1px" borderColor={borderColor}>
          <VStack spacing={4} align="stretch">
            {/* Breadcrumb */}
            <HStack spacing={2} fontSize="sm" color="gray.600">
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/quotations')}
                color="blue.500"
                _hover={{ textDecoration: 'underline' }}
              >
                Quotations
              </Button>
              <Text>/</Text>
              <Text color="blue.500" fontWeight="medium">
                {editMode ? 'Edit Quotation' : selectedQuotation ? 'View Quotation' : 'Create New Quotation'}
              </Text>
            </HStack>

            {/* Title and Actions */}
            <HStack justify="space-between" align="center">
              <Heading size="lg">
                {editMode ? 'Edit Quotation' : selectedQuotation ? 'View Quotation' : 'Create New Quotation'}
              </Heading>
              
              <HStack spacing={3}>
                <Button
                  leftIcon={<FiArrowLeft />}
                  variant="outline"
                  onClick={handleCancel}
                >
                  Back to List
                </Button>
                
                {!selectedQuotation && (
                  <Button
                    leftIcon={<FiSave />}
                    colorScheme="blue"
                    onClick={handleSubmit}
                    isDisabled={!formData.customer_id || quotationItems.length === 0}
                  >
                    Save Quotation
                  </Button>
                )}
              </HStack>
            </HStack>
          </VStack>
        </Box>

        {/* Quotation Form */}
        <Box bg={cardBg} p={6} borderRadius="lg" border="1px" borderColor={borderColor}>
          <QuotationForm
            formData={formData}
            setFormData={setFormData}
            quotationItems={quotationItems}
            setQuotationItems={setQuotationItems}
            isEditMode={editMode}
            isReadOnly={!editMode && selectedQuotation} // Read-only when viewing existing quotation
            selectedOrganization={selectedOrganization}
            allCustomers={allCustomers}
            allInventoryItems={allInventoryItems}
            allUnits={allUnits} // Pass units from database
            customerRefreshKey={customerRefreshKey}
            inventoryRefreshKey={inventoryRefreshKey}
            onCustomerSelection={handleCustomerSelection}
            onCustomerChange={handleCustomerChange}
            onItemChange={handleItemChange}
            onInventoryItemSelection={handleInventoryItemSelection}
            updateQuotationItem={updateQuotationItem}
            addQuotationItem={addQuotationItem}
            removeQuotationItem={removeQuotationItem}
            updateSubtotal={updateSubtotal}
            onImportItems={handleImportItems}
            onExportItems={handleExportItems}
            onMarkupChange={handleMarkupChange}
            onSaveTerms={saveTermsToOrganization}
            onExportTemplate={handleExportTemplate}
            customers={customers}
            inventory={inventory}
          />
        </Box>
      </VStack>
    </Box>
  );
};

export default QuotationFormScreen;
