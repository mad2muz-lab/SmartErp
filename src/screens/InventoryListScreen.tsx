import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  useDisclosure,
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
  Textarea,
  Select,
  useToast,
  useColorModeValue,
  IconButton,
  Tooltip,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Icon,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import { INVENTORY_CATEGORIES, INVENTORY_UNITS } from '../data/inventoryData';
import { SmartDropdown } from '../components/SmartDropdown';
import { getAllEntries } from '../data/customEntries';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiEye,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiUpload,
  FiDownload,
  FiFileText,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import ArabicField from '../components/ArabicField';
import { useLanguage } from '../contexts/shared/LanguageContext';
import QRCode from 'qrcode';
import FormattedCurrencyDisplay from '../components/FormattedCurrencyDisplay';

interface InventoryListItem {
  _id: string;
  name: string;
  sku?: string;
  qr_code?: string;
  category?: string;
  quantity: number;
  unit: string;
  min_quantity?: number;
  cost_price: number;
  selling_price: number;
  supplier_name?: string;
}

interface InventoryTableProps {
  items: InventoryListItem[];
  isSearching: boolean;
  currency: string;
  cardBg: string;
  borderColor: string;
  labels: {
    itemName: string;
    sku: string;
    category: string;
    stock: string;
    costPrice: string;
    sellingPrice: string;
    margin: string;
    supplier: string;
    actions: string;
    outOfStock: string;
    lowStock: string;
    inStock: string;
  };
  onShowQr: (item: InventoryListItem) => void;
  onEdit: (item: InventoryListItem) => void;
  onDelete: (id: string) => void;
}

const InventoryTable = React.memo(({
  items,
  isSearching,
  currency,
  cardBg,
  borderColor,
  labels,
  onShowQr,
  onEdit,
  onDelete,
}: InventoryTableProps) => (
  <Card bg={cardBg} border="1px" borderColor={borderColor}>
    <CardBody>
      {items.length === 0 ? (
        <VStack spacing={4} align="center" py={8}>
          <Text color="gray.500">No inventory items found</Text>
          <Text fontSize="sm" color="gray.400">
            {isSearching ? 'Try adjusting your search terms' : 'Create your first inventory item to get started'}
          </Text>
        </VStack>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>{labels.itemName}</Th>
                <Th>{labels.sku}</Th>
                <Th>{labels.category}</Th>
                <Th>{labels.stock}</Th>
                <Th>{labels.costPrice}</Th>
                <Th>{labels.sellingPrice}</Th>
                <Th>{labels.margin}</Th>
                <Th>{labels.supplier}</Th>
                <Th>{labels.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((item) => {
                const stockStatus = item.quantity <= 0
                  ? { color: 'red', text: labels.outOfStock }
                  : item.quantity <= (item.min_quantity || 0)
                    ? { color: 'orange', text: labels.lowStock }
                    : { color: 'green', text: labels.inStock };
                const profitMargin = item.cost_price === 0
                  ? 0
                  : ((item.selling_price - item.cost_price) / item.cost_price) * 100;

                return (
                  <Tr key={item._id}>
                    <Td fontWeight="medium">{item.name}</Td>
                    <Td>{item.sku || '-'}</Td>
                    <Td>{item.category || '-'}</Td>
                    <Td>
                      <VStack align="flex-start" spacing={1}>
                        <HStack spacing={2}>
                          <Text>{item.quantity} {item.unit}</Text>
                          <Badge colorScheme={stockStatus.color} size="sm">{stockStatus.text}</Badge>
                        </HStack>
                        {(item.min_quantity || 0) > 0 && (
                          <Text fontSize="xs" color="gray.500">Min: {item.min_quantity} {item.unit}</Text>
                        )}
                      </VStack>
                    </Td>
                    <Td><FormattedCurrencyDisplay amount={item.cost_price} currency={currency} /></Td>
                    <Td><FormattedCurrencyDisplay amount={item.selling_price} currency={currency} /></Td>
                    <Td>
                      <HStack spacing={1}>
                        <Icon
                          as={profitMargin >= 0 ? FiTrendingUp : FiTrendingDown}
                          boxSize={4}
                          color={profitMargin >= 0 ? 'green.400' : 'red.400'}
                        />
                        <Text color={profitMargin >= 0 ? 'green.500' : 'red.500'} fontSize="sm">
                          {profitMargin.toFixed(1)}%
                        </Text>
                      </HStack>
                    </Td>
                    <Td><Text fontSize="sm" color="gray.600">{item.supplier_name || '-'}</Text></Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="View or download item QR code">
                          <IconButton aria-label="View inventory QR code" icon={<FiEye />} size="sm" variant="ghost" onClick={() => onShowQr(item)} />
                        </Tooltip>
                        <Tooltip label="Edit Item">
                          <IconButton aria-label="Edit inventory item" icon={<FiEdit />} size="sm" variant="ghost" onClick={() => onEdit(item)} />
                        </Tooltip>
                        <Tooltip label="Delete Item">
                          <IconButton aria-label="Delete inventory item" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => onDelete(item._id)} />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      )}
    </CardBody>
  </Card>
));

const InventoryListScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [qrItem, setQrItem] = useState<{ name: string; payload: string } | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [isGeneratingMissingQrs, setIsGeneratingMissingQrs] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isQrOpen, onOpen: onQrOpen, onClose: onQrClose } = useDisclosure();
  const { isOpen: isBulkImportOpen, onOpen: onBulkImportOpen, onClose: onBulkImportClose } = useDisclosure();
  const { isOpen: isBulkExportOpen, onOpen: onBulkExportOpen, onClose: onBulkExportClose } = useDisclosure();
  const { selectedOrganization, organizationDetails } = useAuth();
  const chakraToast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    sku: '',
    description: '',
    description_arabic: '',
    category: '',
    category_arabic: '',
    unit: '',
    cost_price: 0,
    selling_price: 0,
    quantity: 0,
    min_quantity: 0,
    supplier_id: '',
    supplier_name: '',
    location: '',
    notes: '',
    brand: '',
    brand_arabic: '',
  });

  const isConvex = isConvexOrgId(selectedOrganization);

  // Fetch suppliers for dropdown
  const suppliers = useQuery(
    api.suppliers.listSuppliers,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Fetch inventory
  const rawInventory = useQuery(
    api.inventory.listInventory,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );
  const inventory = isConvex ? rawInventory : [];

  // Get all entries (predefined + custom) for smart dropdowns
  const allCategories = useMemo(
    () => getAllEntries('category', selectedOrganization || '', INVENTORY_CATEGORIES),
    [selectedOrganization]
  );
  const allUnits = useMemo(
    () => getAllEntries('unit', selectedOrganization || '', INVENTORY_UNITS),
    [selectedOrganization]
  );
  const supplierNames = useMemo(() => suppliers?.map(s => s.name) || [], [suppliers]);
  const allSuppliers = useMemo(
    () => getAllEntries('supplier', selectedOrganization || '', supplierNames),
    [selectedOrganization, supplierNames]
  );

  // Mutations - MUST be called before any conditional returns
  const createInventory = useMutation(api.inventory.createInventory);
  const updateInventory = useMutation(api.inventory.updateInventory);
  const deleteInventory = useMutation(api.inventory.deleteInventory);
  const ensureInventoryQr = useMutation(api.inventory.ensureInventoryQr);
  const ensureInventoryQrs = useMutation(api.inventory.ensureInventoryQrs);

  useEffect(() => {
    let active = true;
    if (qrItem) {
      QRCode.toDataURL(qrItem.payload, { width: 320, margin: 2 })
        .then((dataUrl) => {
          if (active) setQrImage(dataUrl);
        })
        .catch((error) => {
          console.error('Failed to generate inventory QR code:', error);
          toast.error('Unable to generate QR code');
          if (active) setQrImage('');
        });
    } else {
      setQrImage('');
    }
    return () => {
      active = false;
    };
  }, [qrItem]);

  const handleSubmit = async () => {
    if (!selectedOrganization) {
      toast.error('Please select an organization');
      return;
    }

    if (!isConvex) {
      toast.success(isEditMode ? 'Inventory item updated (offline mode)' : 'Inventory item created (offline mode)');
      onClose();
      resetForm();
      return;
    }

    // Use formData values directly since smart dropdowns handle custom entries

    try {
      if (isEditMode && selectedItem) {
        await updateInventory({
          id: selectedItem._id,
          name: formData.name,
          name_arabic: formData.name_arabic || undefined,
          sku: formData.sku || undefined,
          description: formData.description || undefined,
          description_arabic: formData.description_arabic || undefined,
          category: formData.category || undefined,
          category_arabic: formData.category_arabic || undefined,
          unit: formData.unit || undefined,
          cost_price: formData.cost_price,
          selling_price: formData.selling_price,
          quantity: formData.quantity,
          min_quantity: formData.min_quantity || undefined,
          supplier_id: formData.supplier_id || undefined,
          location: formData.location || undefined,
          notes: formData.notes || undefined,
          brand: formData.brand || undefined,
          brand_arabic: formData.brand_arabic || undefined,
        });
        toast.success('Inventory item updated successfully');
      } else {
        const createdId = await createInventory({
          name: formData.name,
          name_arabic: formData.name_arabic || undefined,
          sku: formData.sku || undefined,
          description: formData.description || undefined,
          description_arabic: formData.description_arabic || undefined,
          category: formData.category || undefined,
          category_arabic: formData.category_arabic || undefined,
          unit: formData.unit || undefined,
          cost_price: formData.cost_price,
          selling_price: formData.selling_price,
          quantity: formData.quantity,
          min_quantity: formData.min_quantity || undefined,
          supplier_id: formData.supplier_id || undefined,
          location: formData.location || undefined,
          notes: formData.notes || undefined,
          brand: formData.brand || undefined,
          brand_arabic: formData.brand_arabic || undefined,
          organization_id: selectedOrganization as any,
        });
        const payload = `smart-erp://inventory/${createdId}`;
        setQrItem({ name: formData.name, payload });
        onQrOpen();
        toast.success('Inventory item created successfully');
      }
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      toast.error('Error saving inventory item');
    }
  };

  const handleEdit = useCallback((item: any) => {
    setSelectedItem(item);
    setIsEditMode(true);
    setFormData({
      name: item.name,
      name_arabic: item.name_arabic || '',
      sku: item.sku || '',
      description: item.description || '',
      description_arabic: item.description_arabic || '',
      category: item.category || '',
      category_arabic: item.category_arabic || '',
      unit: item.unit || '',
      cost_price: item.cost_price || 0,
      selling_price: item.selling_price || 0,
      quantity: item.quantity || 0,
      min_quantity: item.min_quantity || 0,
      supplier_id: item.supplier_id || '',
      supplier_name: item.supplier_name || '',
      location: item.location || '',
      notes: item.notes || '',
      brand: item.brand || '',
      brand_arabic: item.brand_arabic || '',
    });
    onOpen();
  }, [onOpen]);

  const handleDelete = useCallback(async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteInventory({ id: itemId as any });
        toast.success('Inventory item deleted successfully');
      } catch (error) {
        toast.error('Error deleting inventory item');
        console.error('Error deleting inventory item:', error);
      }
    }
  }, [deleteInventory]);

  const resetForm = () => {
    setFormData({
      name: '',
      name_arabic: '',
      sku: '',
      description: '',
      description_arabic: '',
      category: '',
      category_arabic: '',
      unit: '',
      cost_price: 0,
      selling_price: 0,
      quantity: 0,
      min_quantity: 0,
      supplier_id: '',
      supplier_name: '',
      location: '',
      notes: '',
      brand: '',
      brand_arabic: '',
    });
    // Custom entries are now handled by smart dropdowns
    setSelectedItem(null);
    setIsEditMode(false);
  };

  const openNewItemModal = () => {
    resetForm();
    setIsEditMode(false);
    onOpen();
  };

  const handleShowQr = useCallback(async (item: InventoryListItem) => {
    try {
      if (!selectedOrganization || !isConvexOrgId(selectedOrganization)) {
        toast.error('Select a connected organization to generate an item QR code');
        return;
      }
      const payload = await ensureInventoryQr({
        id: item._id as any,
        organization_id: selectedOrganization as any,
      });
      setQrItem({ name: item.name, payload });
      onQrOpen();
    } catch (error) {
      console.error('Failed to load inventory QR code:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to load QR code');
    }
  }, [ensureInventoryQr, onQrOpen, selectedOrganization]);

  const handleGenerateMissingQrs = async () => {
    if (!selectedOrganization || !isConvexOrgId(selectedOrganization)) {
      toast.error('Select a connected organization to generate item QR codes');
      return;
    }
    const missingItems = (inventory || []).filter((item) => !item.qr_code);
    if (missingItems.length === 0) return;

    setIsGeneratingMissingQrs(true);
    try {
      let generatedCount = 0;
      for (let index = 0; index < missingItems.length; index += 25) {
        const batch = missingItems.slice(index, index + 25);
        generatedCount += await ensureInventoryQrs({
          ids: batch.map((item) => item._id as any),
          organization_id: selectedOrganization as any,
        });
      }
      toast.success(`Generated QR codes for ${generatedCount} existing materials`);
    } catch (error) {
      console.error('Failed to generate missing inventory QR codes:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to generate missing QR codes');
    } finally {
      setIsGeneratingMissingQrs(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrImage || !qrItem) return;
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `${qrItem.name.replace(/[^a-z0-9-_]/gi, '_')}-qr.png`;
    link.click();
  };

  // [2025-01-11] Added - Bulk operations handlers
  const handleDownloadTemplate = () => {
    const templateData = [
      // Header row with field descriptions
      [
        'name (Required)',
        'name_arabic (Optional)',
        'sku (Required)',
        'category (Required)',
        'category_arabic (Optional)',
        'description (Optional)',
        'description_arabic (Optional)',
        'unit (Required)',
        'location (Optional)',
        'cost_price (Required)',
        'selling_price (Required)',
        'quantity (Required)',
        'min_quantity (Optional)',
        'supplier (Optional)',
        'brand (Optional)',
        'brand_arabic (Optional)',
        'notes (Optional)'
      ],
      // Sample data row 1
      [
        'Laptop Computer',
        'كمبيوتر محمول',
        'LAPTOP-001',
        'Electronics',
        'إلكترونيات',
        'High-performance laptop for business use',
        'كمبيوتر محمول عالي الأداء للاستخدام التجاري',
        'pcs',
        'Warehouse A',
        '2500.00',
        '3500.00',
        '10',
        '2',
        'Tech Supplier Co.',
        'Dell',
        'ديل',
        'Latest model, in stock'
      ],
      // Sample data row 2
      [
        'Office Chair',
        'كرسي مكتب',
        'CHAIR-002',
        'Furniture',
        'أثاث',
        'Ergonomic office chair with lumbar support',
        'كرسي مكتب مريح مع دعم أسفل الظهر',
        'pcs',
        'Warehouse B',
        '150.00',
        '250.00',
        '25',
        '5',
        'Furniture World',
        'Herman Miller',
        'هيرمان ميلر',
        'Black color, adjustable height'
      ],
      // Sample data row 3
      [
        'Steel Rod',
        'قضيب فولاذي',
        'STEEL-003',
        'Construction',
        'بناء',
        'High-grade steel rod for construction',
        'قضيب فولاذي عالي الجودة للبناء',
        'meter',
        'Warehouse C',
        '25.00',
        '35.00',
        '100',
        '20',
        'Metal Works Ltd',
        'SteelCorp',
        'ستيلكورب',
        'Grade A steel, 6mm diameter'
      ]
    ];

    // Convert to CSV
    const csvContent = templateData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template downloaded successfully!');
  };

  const handleBulkImport = () => {
    // This will be implemented with the bulk import modal
    onBulkImportOpen();
  };

  const handleBulkExport = () => {
    // This will be implemented with the bulk export modal
    onBulkExportOpen();
  };

  // Filter inventory based on search term
  const filteredInventory = useMemo(() => inventory?.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [], [inventory, searchTerm]);

  const inventoryLabels = useMemo(() => ({
    itemName: t('colItemName'),
    sku: t('colSku'),
    category: t('colCategory'),
    stock: t('colStock'),
    costPrice: t('colCostPrice'),
    sellingPrice: t('colSellingPrice'),
    margin: t('colMargin'),
    supplier: t('colSupplier'),
    actions: t('colActions'),
    outOfStock: t('outOfStock'),
    lowStock: t('lowStock'),
    inStock: t('inStock'),
  }), [t]);

  // Keep conditional rendering below every hook so loading changes do not change hook order.
  if (inventory === undefined) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Inventory Management</Heading>
            <Text color="gray.600">Loading inventory...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  if (!selectedOrganization) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Inventory Management</Heading>
            <Text color="gray.600">Please select an organization to view inventory</Text>
          </Box>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="center">
                <Text color="gray.500">No organization selected</Text>
                <Text fontSize="sm" color="gray.400">Please select an organization from the dashboard to manage inventory</Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    );
  }

  return (
    <Box dir={dir}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>{t('invTitle')}</Heading>
          <Text color="gray.600">{t('invSub')}</Text>
        </Box>

        {/* Search and Actions */}
        <HStack justify="space-between" align="center">
          <InputGroup maxW="400px">
            <InputLeftElement>
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder={t('searchInvPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <HStack spacing={2}>
            {(inventory || []).some((item) => !item.qr_code) && (
              <Button
                variant="outline"
                colorScheme="blue"
                onClick={() => void handleGenerateMissingQrs()}
                isLoading={isGeneratingMissingQrs}
                loadingText="Generating QR codes"
              >
                Generate missing QR codes ({(inventory || []).filter((item) => !item.qr_code).length})
              </Button>
            )}
            <Button
              leftIcon={<FiTrendingUp />}
              variant="outline"
              colorScheme="teal"
              onClick={() => navigate('/inventory/movements')}
            >
              Stock In/Out
            </Button>
            <Button
              leftIcon={<FiFileText />}
              variant="outline"
              colorScheme="blue"
              onClick={handleDownloadTemplate}
            >
              CSV
            </Button>
            <Button
              leftIcon={<FiUpload />}
              variant="outline"
              colorScheme="green"
              onClick={onBulkImportOpen}
            >
              {t('bulkImportBtn')}
            </Button>
            <Button
              leftIcon={<FiDownload />}
              variant="outline"
              colorScheme="purple"
              onClick={onBulkExportOpen}
            >
              {t('bulkExportBtn')}
            </Button>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={openNewItemModal}
            >
              {t('addItemBtn')}
            </Button>
          </HStack>
        </HStack>

        <InventoryTable
          items={filteredInventory}
          isSearching={Boolean(searchTerm)}
          currency={organizationDetails?.currency || 'SAR'}
          cardBg={cardBg}
          borderColor={borderColor}
          labels={inventoryLabels}
          onShowQr={handleShowQr}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <Modal isOpen={isQrOpen} onClose={onQrClose} size="sm">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Inventory Item QR Code</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={3}>
                <Text fontWeight="semibold">{qrItem?.name}</Text>
                {qrImage ? (
                  <Box as="img" src={qrImage} alt={`QR code for ${qrItem?.name}`} boxSize="260px" />
                ) : (
                  <Text color="gray.500">Generating QR code...</Text>
                )}
                <Text fontSize="xs" color="gray.500" wordBreak="break-all" textAlign="center">
                  {qrItem?.payload}
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={handleDownloadQr} isDisabled={!qrImage} colorScheme="blue">
                Download QR
              </Button>
              <Button variant="ghost" ml={3} onClick={onQrClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Add/Edit Inventory Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Item Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                  />
                </FormControl>

                <ArabicField
                  label="Item Name"
                  englishValue={formData.name}
                  arabicValue={formData.name_arabic}
                  onArabicChange={(value) => setFormData({ ...formData, name_arabic: value })}
                  placeholder="Enter item name"
                  autoTranslate={true}
                />

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>SKU</FormLabel>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Stock keeping unit"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Category</FormLabel>
                    <SmartDropdown
                      value={formData.category}
                      onChange={(value) => setFormData({ ...formData, category: value })}
                      placeholder="Select category"
                      options={allCategories}
                      type="category"
                      organization_id={selectedOrganization || ''}
                      defaultValue="General Item"
                    />
                  </FormControl>
                </HStack>

                <ArabicField
                  label="Category"
                  englishValue={formData.category}
                  arabicValue={formData.category_arabic}
                  onArabicChange={(value) => setFormData({ ...formData, category_arabic: value })}
                  placeholder="Select category"
                  autoTranslate={true}
                />

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Item description"
                    rows={2}
                  />
                </FormControl>

                <ArabicField
                  label="Description"
                  englishValue={formData.description}
                  arabicValue={formData.description_arabic}
                  onArabicChange={(value) => setFormData({ ...formData, description_arabic: value })}
                  placeholder="Item description"
                  isTextarea={true}
                  autoTranslate={true}
                />

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Unit</FormLabel>
                    <SmartDropdown
                      value={formData.unit}
                      onChange={(value) => setFormData({ ...formData, unit: value })}
                      placeholder="Select unit"
                      options={allUnits}
                      type="unit"
                      organization_id={selectedOrganization || ''}
                      defaultValue="pcs"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Location</FormLabel>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Storage location"
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Cost Price</FormLabel>
                    <NumberInput
                      value={formData.cost_price}
                      onChange={(value) => setFormData({ ...formData, cost_price: Number(value) })}
                      min={0}
                      precision={2}
                    >
                      <NumberInputField placeholder="0.00" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Selling Price</FormLabel>
                    <NumberInput
                      value={formData.selling_price}
                      onChange={(value) => setFormData({ ...formData, selling_price: Number(value) })}
                      min={0}
                      precision={2}
                    >
                      <NumberInputField placeholder="0.00" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </HStack>

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Current Quantity</FormLabel>
                    <NumberInput
                      value={formData.quantity}
                      onChange={(value) => setFormData({ ...formData, quantity: Number(value) })}
                      min={0}
                    >
                      <NumberInputField placeholder="0" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Minimum Quantity</FormLabel>
                    <NumberInput
                      value={formData.min_quantity}
                      onChange={(value) => setFormData({ ...formData, min_quantity: Number(value) })}
                      min={0}
                    >
                      <NumberInputField placeholder="0" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Supplier</FormLabel>
                  <SmartDropdown
                    value={formData.supplier_name || ''}
                    onChange={(value) => {
                      // Find supplier by name and set the ID
                      const supplier = suppliers?.find(s => s.name === value);
                      setFormData({ 
                        ...formData, 
                        supplier_name: value,
                        supplier_id: supplier?._id || ''
                      });
                    }}
                    placeholder="Select supplier"
                    options={allSuppliers}
                    type="supplier"
                    organization_id={selectedOrganization || ''}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Brand</FormLabel>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Enter brand name"
                  />
                </FormControl>

                <ArabicField
                  label="Brand"
                  englishValue={formData.brand}
                  arabicValue={formData.brand_arabic}
                  onArabicChange={(value) => setFormData({ ...formData, brand_arabic: value })}
                  placeholder="Enter brand name"
                  autoTranslate={true}
                />

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this item"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleSubmit}>
                {isEditMode ? 'Update Item' : 'Create Item'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Bulk Import Modal */}
        <Modal isOpen={isBulkImportOpen} onClose={onBulkImportClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Bulk Import Inventory</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text color="gray.600">
                  Upload a CSV file to import multiple inventory items at once. 
                  Download the template first to see the required format.
                </Text>
                
                <Box p={4} bg="blue.50" borderRadius="md" w="full">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Import Instructions:</Text>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm">• Download the template CSV file first</Text>
                    <Text fontSize="sm">• Fill in your inventory data following the template format</Text>
                    <Text fontSize="sm">• Required fields: name, sku, category, unit, cost_price, selling_price, quantity</Text>
                    <Text fontSize="sm">• Optional fields: name_arabic, description, supplier, brand, etc.</Text>
                    <Text fontSize="sm">• Save as CSV format and upload here</Text>
                  </VStack>
                </Box>

                <FormControl>
                  <FormLabel>Select CSV File</FormLabel>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // TODO: Implement file processing
                        toast.success(`File selected: ${file.name}`);
                      }
                    }}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onBulkImportClose}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={() => {
                // TODO: Implement bulk import
                toast.info('Bulk import feature coming soon!');
                onBulkImportClose();
              }}>
                Import Items
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Bulk Export Modal */}
        <Modal isOpen={isBulkExportOpen} onClose={onBulkExportClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Bulk Export Inventory</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text color="gray.600">
                  Export your inventory data to CSV format for backup or external use.
                </Text>
                
                <FormControl>
                  <FormLabel>Export Options</FormLabel>
                  <VStack align="start" spacing={2}>
                    <Button
                      leftIcon={<FiDownload />}
                      variant="outline"
                      colorScheme="blue"
                      onClick={() => {
                        // TODO: Implement export all
                        toast.info('Export all feature coming soon!');
                        onBulkExportClose();
                      }}
                    >
                      Export All Items
                    </Button>
                    <Button
                      leftIcon={<FiDownload />}
                      variant="outline"
                      colorScheme="green"
                      onClick={() => {
                        // TODO: Implement filtered export
                        toast.info('Filtered export feature coming soon!');
                        onBulkExportClose();
                      }}
                    >
                      Export Filtered Items
                    </Button>
                  </VStack>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onBulkExportClose}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default InventoryListScreen;
