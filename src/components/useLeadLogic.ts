import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import toast from 'react-hot-toast';
import { isConvexOrgId } from '../utils/accountingUtils';

interface LeadItem {
  id: string;
  item_name: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string;
}

interface LeadFormData {
  lead_number: string;
  name: string;
  status: string;
  priority: string;
  assigned_to: string;
  
  // Quotation-like fields
  customer_id: string;
  customer_name: string;
  subject: string;
  description: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  terms_conditions: string;
  notes: string;
  
  // Legacy fields for backward compatibility
  company: string;
  email: string;
  phone: string;
  source: string;
  estimated_value: number;
}

export const useLeadLogic = (selectedOrganization: string | null) => {
  // Form state
  const [formData, setFormData] = useState<LeadFormData>({
    lead_number: '',
    name: '',
    status: 'new',
    priority: 'medium',
    assigned_to: '',
    customer_id: undefined as any,
    customer_name: '',
    subject: '',
    description: '',
    currency: 'SAR',
    subtotal: 0,
    tax_rate: 15,
    tax_amount: 0,
    total_amount: 0,
    terms_conditions: '',
    notes: '',
    company: '',
    email: '',
    phone: '',
    source: 'unknown',
    estimated_value: 0,
  });

  // Items state
  const [leadItems, setLeadItems] = useState<LeadItem[]>([]);
  
  // Refresh keys for dropdowns
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  
  // Selected lead for editing items
  const [selectedLeadForItems, setSelectedLeadForItems] = useState<string | null>(null);

  // Queries
  const isConvex = isConvexOrgId(selectedOrganization);

  const leads = useQuery(
    api.leads.listLeads,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const customers = useQuery(
    api.customers.listCustomers,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const inventory = useQuery(
    api.inventory.listInventory,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Lead items query
  const leadItemsData = useQuery(
    api.lead_items.listLeadItems,
    selectedLeadForItems ? { lead_id: selectedLeadForItems as any } : 'skip'
  );

  // Mutations
  const createLead = useMutation(api.leads.createLead);
  const updateLead = useMutation(api.leads.updateLead);
  const deleteLead = useMutation(api.leads.deleteLead);
  const createLeadItem = useMutation(api.lead_items.createLeadItem);
  const updateLeadItem = useMutation(api.lead_items.updateLeadItem);
  const deleteLeadItem = useMutation(api.lead_items.deleteLeadItem);
  const createCustomer = useMutation(api.customers.createCustomer);
  const createInventory = useMutation(api.inventory.createInventory);
  const generateLeadNumber = useMutation(api.reminders.generateLeadNumber);

  // Prepare dropdown options
  const allCustomers = customers?.map(c => {
    const englishName = c.customer_company_name;
    const arabicName = c.customer_company_name_arabic;
    // If Arabic name exists, show both: "English Name | الاسم العربي"
    return arabicName ? `${englishName} | ${arabicName}` : englishName;
  }) || [];
  
  const allInventoryItems = inventory?.map(i => {
    const englishName = i.name;
    const arabicName = i.name_arabic;
    // If Arabic name exists, show both: "English Name | الاسم العربي"
    return arabicName ? `${englishName} | ${arabicName}` : englishName;
  }) || [];

  // Load lead items when editing
  useEffect(() => {
    if (selectedLeadForItems && leadItemsData) {
      const items: LeadItem[] = leadItemsData.map((item: any) => ({
        id: item._id,
        item_name: item.item_name,
        item_id: item._id, // For lead items, we use the item ID as item_id
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        description: item.description || '',
      }));
      setLeadItems(items);
    }
  }, [selectedLeadForItems, leadItemsData]);

  // Customer selection handler
  const handleCustomerSelection = async (customerName: string) => {
    if (!selectedOrganization) return;
    
    try {
      const newCustomerId = await createCustomer({
        customer_company_name: customerName,
        customer_type: 'business',
        organization_id: selectedOrganization as any,
        email: '',
        phone: '',
        address: '',
        contact_person: '',
      });
      
      // Set the customer_id after creating the customer
      setFormData(prev => ({
        ...prev,
        customer_name: customerName,
        customer_id: newCustomerId,
      }));
      
      setCustomerRefreshKey(prev => prev + 1);
      toast.success(`Customer "${customerName}" created successfully`);
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error(`Error creating customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCustomerChange = (customerName: string) => {
    // Find customer by matching either the English name or the combined name format
    const selectedCustomer = customers?.find(c => {
      const englishName = c.customer_company_name;
      const arabicName = c.customer_company_name_arabic;
      const combinedName = arabicName ? `${englishName} | ${arabicName}` : englishName;
      
      return customerName === englishName || customerName === combinedName;
    });
    
    setFormData(prev => ({
      ...prev,
      customer_name: customerName,
      customer_id: selectedCustomer?._id || undefined,
    }));
  };

  // Inventory item selection handler
  const handleInventoryItemSelection = async (itemName: string) => {
    if (!selectedOrganization) return null;
    
    try {
      const newItemId = await createInventory({
        name: itemName,
        sku: `SKU-${Date.now()}`,
        category: 'General Item',
        unit: 'pcs',
        cost_price: 0,
        selling_price: 0,
        quantity: 0,
        organization_id: selectedOrganization as any,
      });
      
      setInventoryRefreshKey(prev => prev + 1);
      toast.success(`Inventory item "${itemName}" created successfully`);
      
      return { _id: newItemId, selling_price: 0 };
    } catch (error) {
      console.error('Error creating inventory item:', error);
      toast.error(`Error creating inventory item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const handleItemChange = (itemName: string, itemIndex: number) => {
    const updatedItems = [...leadItems];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      item_name: itemName,
      item_id: inventory?.find(i => i.name === itemName)?._id || undefined,
      unit_price: inventory?.find(i => i.name === itemName)?.selling_price || 0,
    };
    
    // Recalculate total price
    updatedItems[itemIndex].total_price = updatedItems[itemIndex].quantity * updatedItems[itemIndex].unit_price;
    
    setLeadItems(updatedItems);
    updateSubtotal();
  };

  // Lead item management
  const updateLeadItemField = (index: number, field: string, value: any) => {
    const updatedItems = [...leadItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    
    // Recalculate total price if quantity or unit_price changed
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setLeadItems(updatedItems);
    updateSubtotal();
  };

  const addLeadItem = () => {
    const newItem: LeadItem = {
      id: `temp-${Date.now()}`,
      item_name: '',
      item_id: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      description: '',
    };
    setLeadItems([...leadItems, newItem]);
  };

  const removeLeadItem = (index: number) => {
    const updatedItems = leadItems.filter((_, i) => i !== index);
    setLeadItems(updatedItems);
    updateSubtotal();
  };

  // Calculate subtotal from items
  const updateSubtotal = () => {
    const subtotal = leadItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = (subtotal * formData.tax_rate) / 100;
    const totalAmount = subtotal + taxAmount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      estimated_value: totalAmount, // Map to legacy field
    }));
  };

  // Generate lead number
  const generateLeadNumberFunc = async () => {
    if (!selectedOrganization) return '';
    
    try {
      const number = await generateLeadNumber({ organization_id: selectedOrganization as any });
      return number as string;
    } catch (error) {
      console.error('Error generating lead number:', error);
      return '';
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      lead_number: '',
      name: '',
      status: 'new',
      priority: 'medium',
      assigned_to: '',
      customer_id: undefined as any,
      customer_name: '',
      subject: '',
      description: '',
      currency: 'SAR',
      subtotal: 0,
      tax_rate: 15,
      tax_amount: 0,
      total_amount: 0,
      terms_conditions: '',
      notes: '',
      company: '',
      email: '',
      phone: '',
      source: 'unknown',
      estimated_value: 0,
    });
    setLeadItems([]);
    setSelectedLeadForItems(null);
  };

  return {
    // Form state
    formData,
    setFormData,
    leadItems,
    setLeadItems,
    
    // Refresh keys
    customerRefreshKey,
    inventoryRefreshKey,
    selectedLeadForItems,
    setSelectedLeadForItems,
    
    // Data
    leads,
    customers,
    inventory,
    allCustomers,
    allInventoryItems,
    
    // Mutations
    createLead,
    updateLead,
    deleteLead,
    createLeadItem,
    updateLeadItem,
    deleteLeadItem,
    createCustomer,
    createInventory,
    
    // Handlers
    handleCustomerSelection,
    handleCustomerChange,
    handleInventoryItemSelection,
    handleItemChange,
    updateLeadItemField,
    addLeadItem,
    removeLeadItem,
    updateSubtotal,
    generateLeadNumber: generateLeadNumberFunc,
    resetForm,
  };
};
