import React, { useState, useMemo, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Card,
  CardBody,
  useColorModeValue,
  useToast,
  Select,
  useDisclosure,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Progress,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiUploadCloud,
  FiDownload,
  FiArrowLeft,
  FiShoppingBag,
  FiPackage,
  FiCheckCircle,
  FiFileText,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/shared/AuthContext';
import { useLanguage } from '../contexts/shared/LanguageContext';
import { vendorAuthService, VendorProduct } from '../services/vendorAuthService';
import { RiyalCurrencySymbol } from '../components/icons/SaudiRiyalIcon';
import { QuickAddProductModal } from '../components/pos/QuickAddProductModal';

export const VendorProductsScreen: React.FC = () => {
  const { user, organizationDetails, activeVendor } = useAuth();
  const { currentLanguage, isRtl, dir, t } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();

  const [localVendorProducts, setLocalVendorProducts] = useState<VendorProduct[]>(() => {
    return vendorAuthService.getVendorProducts(activeVendor?.id);
  });

  React.useEffect(() => {
    const handleProductsChanged = (e: any) => {
      setLocalVendorProducts(e.detail || vendorAuthService.getVendorProducts(activeVendor?.id));
    };
    window.addEventListener('vendor-products-changed', handleProductsChanged);
    return () => window.removeEventListener('vendor-products-changed', handleProductsChanged);
  }, [activeVendor?.id]);

  React.useEffect(() => {
    setLocalVendorProducts(vendorAuthService.getVendorProducts(activeVendor?.id));
  }, [activeVendor?.id]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure();
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Edit State
  const [editingItem, setEditingItem] = useState<any>(null);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  // Mutations
  const createInventory = useMutation(api.inventory.createInventory);
  const updateInventory = useMutation(api.inventory.updateInventory);
  const deleteInventory = useMutation(api.inventory.deleteInventory);

  // Load Inventory (only for valid convex organizations)
  const isConvexOrg = Boolean(
    user?.organizationId &&
    !user.organizationId.startsWith('org_') &&
    user?.role !== 'vendor'
  );

  const rawInventory = useQuery(
    api.inventory.listInventory,
    isConvexOrg
      ? {
          organization_id: user.organizationId as Id<'organizations'>,
        }
      : 'skip'
  );

  const inventory = useMemo(() => {
    const local = localVendorProducts.map((p) => ({
      _id: p.id,
      name: p.name,
      name_arabic: p.nameArabic,
      selling_price: p.price,
      current_price: p.price,
      cost_price: p.costPrice || p.price,
      category: p.category,
      category_arabic: p.categoryArabic || p.category,
      sku: p.sku,
      quantity_in_stock: p.quantity || 100,
      unit: p.unit || 'Pcs',
      vat_rate: p.vatRate || 15,
      min_quantity: p.minQuantity || 5,
    }));

    const merged = new Map<string, any>();
    const makeKey = (item: any) => {
      const rawSku = (item?.sku || '').trim();
      if (rawSku) return `sku:${rawSku.toLowerCase()}`;
      const name = (item?.name || '').trim().toLowerCase();
      const category = (item?.category || '').trim().toLowerCase();
      return `name:${name}|category:${category}`;
    };

    [...(rawInventory || []), ...local].forEach((item: any) => {
      const key = makeKey(item);
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, item);
        return;
      }

      merged.set(key, {
        ...existing,
        ...item,
        _id: existing._id || item._id,
        name: existing.name || item.name,
        sku: existing.sku || item.sku,
        category: existing.category || item.category,
      });
    });

    return Array.from(merged.values());
  }, [localVendorProducts, rawInventory]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((i: any) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [inventory]);

  // Filtered Inventory
  const filteredItems = useMemo(() => {
    return inventory.filter((item: any) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        item.name.toLowerCase().includes(q) ||
        (item.name_arabic && item.name_arabic.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [inventory, selectedCategory, searchTerm]);

  // Handle Delete
  const handleDelete = async (id: Id<'inventory'>, name: string) => {
    if (!window.confirm(`${t('deleteProductConfirm')} (${name})`)) return;
    try {
      await deleteInventory({ id });
      toast({
        title: t('delete'),
        description: name,
        status: 'info',
        duration: 2500,
      });
    } catch (e: any) {
      toast({
        title: e.message || 'Error',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Handle Edit Save
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await updateInventory({
        id: editingItem._id,
        name: editingItem.name,
        name_arabic: editingItem.name_arabic || editingItem.name,
        selling_price: parseFloat(editingItem.selling_price) || 0,
        cost_price: parseFloat(editingItem.cost_price) || parseFloat(editingItem.selling_price) || 0,
        category: editingItem.category || 'General',
        sku: editingItem.sku,
        quantity: editingItem.quantity || 100,
      });
      toast({
        title: 'تم تعديل الصنف بنجاح',
        status: 'success',
        duration: 2500,
      });
      onEditClose();
    } catch (e: any) {
      toast({
        title: 'فشل التعديل',
        description: e.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Handle Bulk CSV Import
  const handleBulkImport = async () => {
    if (!bulkCsvText.trim()) {
      toast({
        title: 'نص CSV فارغ',
        description: 'يرجى لصق بيانات الأصناف أولاً أو رفع الملف',
        status: 'warning',
        duration: 2500,
      });
      return;
    }

    setIsBulkUploading(true);
    setBulkProgress(10);

    try {
      const lines = bulkCsvText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) return;

      const firstLineLower = lines[0].toLowerCase();
      const startIndex =
        firstLineLower.includes('name') ||
        firstLineLower.includes('اسم') ||
        firstLineLower.includes('صنف') ||
        firstLineLower.includes('arabic')
          ? 1
          : 0;

      const dataLines = lines.slice(startIndex);
      const newImportedProducts: VendorProduct[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const cols = line.includes('\t')
          ? line.split('\t').map((c) => c.trim().replace(/^"|"$/g, ''))
          : line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));

        if (cols.length < 2) continue;

        const nameArabic = cols[0] || 'صنف جديد';
        const nameEnglish = cols[1] || nameArabic;

        let sellingPrice = 10.0;
        let costPrice = 10.0;
        let category = 'General / عام';
        let sku = `BAR-${Date.now().toString().slice(-6)}-${i + 1}`;
        let quantity = 100;
        let unit = 'Pcs';
        let vatRate = 15;
        let minQuantity = 5;

        const col2Num = parseFloat(cols[2]);
        const col3Num = parseFloat(cols[3]);

        if (!isNaN(col2Num)) {
          sellingPrice = col2Num;
        }

        if (!isNaN(col3Num)) {
          // 10-column / Full format: [nameAr, nameEn, sellPrice, costPrice, category, barcode, qty, unit, vat, min]
          costPrice = col3Num;
          category = cols[4] || 'General / عام';
          sku = cols[5] || `BAR-${Date.now().toString().slice(-6)}-${i + 1}`;
          if (cols[6] && !isNaN(parseFloat(cols[6]))) quantity = parseFloat(cols[6]);
          if (cols[7]) unit = cols[7];
          if (cols[8] && !isNaN(parseFloat(cols[8]))) vatRate = parseFloat(cols[8]);
          if (cols[9] && !isNaN(parseFloat(cols[9]))) minQuantity = parseFloat(cols[9]);
        } else {
          // 5-column / Legacy format: [nameAr, nameEn, sellPrice, category, barcode, qty, unit, ...]
          costPrice = sellingPrice;
          category = cols[3] || 'General / عام';
          sku = cols[4] || `BAR-${Date.now().toString().slice(-6)}-${i + 1}`;
          if (cols[5] && !isNaN(parseFloat(cols[5]))) quantity = parseFloat(cols[5]);
          if (cols[6]) unit = cols[6];
          if (cols[7] && !isNaN(parseFloat(cols[7]))) vatRate = parseFloat(cols[7]);
          if (cols[8] && !isNaN(parseFloat(cols[8]))) minQuantity = parseFloat(cols[8]);
        }

        const product: VendorProduct = {
          id: `prod_${Date.now()}_${i}`,
          name: nameEnglish,
          nameArabic,
          sku,
          price: sellingPrice,
          costPrice,
          category,
          quantity,
          minQuantity,
          unit,
          vatRate,
          createdAt: new Date().toISOString(),
        };

        newImportedProducts.push(product);

        // Also sync to Convex DB if connected
        if (user?.organizationId) {
          try {
            createInventory({
              organization_id: user.organizationId as any,
              name: nameEnglish,
              name_arabic: nameArabic,
              selling_price: sellingPrice,
              cost_price: costPrice,
              category,
              category_arabic: category,
              sku,
              unit,
              quantity,
              min_quantity: minQuantity,
              created_by: user.email || 'bulk-uploader',
            }).catch(() => {});
          } catch (e) {
            // Ignore backend sync failure
          }
        }

        setBulkProgress(Math.round(((i + 1) / dataLines.length) * 100));
      }

      // Persist in vendor service
      const existing = vendorAuthService.getVendorProducts(activeVendor?.id);
      const combined = [...newImportedProducts, ...existing];
      const unique = combined.filter((item, idx, arr) => arr.findIndex((x) => x.sku === item.sku) === idx);
      vendorAuthService.saveVendorProducts(unique, activeVendor?.id);
      setLocalVendorProducts(unique);

      toast({
        title: 'تم استيراد الأصناف بنجاح',
        description: `تمت إضافة ${newImportedProducts.length} صنف جديد للكتالوج`,
        status: 'success',
        duration: 4000,
      });

      setBulkCsvText('');
      onBulkClose();
    } catch (e: any) {
      toast({
        title: 'خطأ أثناء الاستيراد',
        description: e.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsBulkUploading(false);
      setBulkProgress(0);
    }
  };

  // Download Sample CSV template with UTF-8 BOM (\uFEFF) for crystal clear Arabic support in Microsoft Excel
  const handleDownloadSampleCsv = () => {
    const headers = [
      'اسم الصنف بالعربي (Arabic Name)',
      'English Name (الاسم بالإنجليزي)',
      'سعر البيع (Selling Price \uE900)',
      'سعر التكلفة (Cost Price \uE900)',
      'التصنيف (Category)',
      'الباركود / SKU (Barcode)',
      'الكمية المتاحة (Stock Qty)',
      'الوحدة (Unit)',
      'نسبة الضريبة (VAT Rate %)',
      'الحد الأدنى للتنبيه (Min Stock Alert)',
    ].join(',');

    const sampleRows = [
      'شاي كرك مميز,Special Karak Tea,3.50,1.50,مشروبات / Beverages,628100100001,200,حبة / Pcs,15,20',
      'عطر عود ملكي 100 مل,Royal Oud Perfume 100ml,180.00,110.00,عطور / Perfumes,628100100002,45,حبة / Pcs,15,5',
      'ساندوتش فلافل سوبر,Falafel Roll Super,8.00,3.50,مأكولات / Food,628100100003,150,حبة / Pcs,15,15',
      'دلة قهوة عربية مع تمر,Arabic Coffee Dallah with Dates,18.00,7.00,مشروبات / Beverages,628100100004,80,حبة / Pcs,15,10',
      'تغيير زيت محرك أصلي وفلتر,Engine Oil & Filter Change,95.00,55.00,خدمات / Services,628100100005,100,خدمة / Service,15,10',
      'مياه معدنية 330 مل,Mineral Water 330ml,1.50,0.65,مشروبات / Beverages,628100100006,500,حبة / Pcs,15,50',
    ].join('\n');

    const csvContent = headers + '\n' + sampleRows + '\n';

    // UTF-8 BOM (\uFEFF) ensures Microsoft Excel recognizes UTF-8 Arabic correctly without mojibake (Ø§Ø³Ù...)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vendor_products_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box p={{ base: 3, md: 6 }} maxW="1500px" mx="auto" dir={dir}>
      {/* Top Banner Navigation */}
      <Flex
        bg={cardBg}
        p={4}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={borderColor}
        align="center"
        justify="space-between"
        mb={5}
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.05)"
      >
        <HStack spacing={3}>
          <IconButton
            aria-label="Back to POS"
            icon={<FiArrowLeft />}
            variant="ghost"
            onClick={() => navigate('/pos')}
          />
          <Box p={2.5} bg="teal.500" color="white" borderRadius="xl">
            <FiPackage size={22} />
          </Box>
          <VStack align="start" spacing={0}>
            <HStack spacing={2}>
              <Text fontWeight="extrabold" fontSize={{ base: 'md', md: 'xl' }}>
                {t('vendorCatalogTitle')}
              </Text>
              <Badge colorScheme="teal" borderRadius="full" px={2}>
                {inventory.length} {t('itemsUnit')}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              {t('vendorCatalogSub')}
            </Text>
          </VStack>
        </HStack>

        <HStack spacing={3}>
          <Button
            leftIcon={<FiShoppingBag />}
            colorScheme="teal"
            variant="outline"
            borderRadius="xl"
            onClick={() => navigate('/pos')}
          >
            {t('goToPosBtn')}
          </Button>

          <Button
            leftIcon={<FiUploadCloud />}
            colorScheme="purple"
            variant="solid"
            borderRadius="xl"
            onClick={onBulkOpen}
          >
            {t('bulkCsvBtn')}
          </Button>

          <Button
            leftIcon={<FiPlus />}
            colorScheme="teal"
            variant="solid"
            borderRadius="xl"
            onClick={onAddOpen}
          >
            {t('addNewProductBtn')}
          </Button>
        </HStack>
      </Flex>

      {/* Filter and Search Bar */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4} mb={5}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="#94a3b8" />
            </InputLeftElement>
            <Input
              placeholder={t('searchProductPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="xl"
            />
          </InputGroup>

          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            borderRadius="xl"
          >
            <option value="all">{t('allCategoriesOpt')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <HStack justify="flex-end">
            <Text fontSize="sm" color="gray.500">
              {t('displayedCount')}: <strong>{filteredItems.length}</strong>
            </Text>
          </HStack>
        </SimpleGrid>
      </Card>

      {/* Products Table */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" overflow="hidden">
        <TableContainer>
          <Table variant="simple" size="md">
            <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
              <Tr>
                <Th>{t('productArabicName')}</Th>
                <Th>{t('productEnglishName')}</Th>
                <Th>{t('colVatPrice')}</Th>
                <Th>{t('productCategory')}</Th>
                <Th>{t('colSku')}</Th>
                <Th textAlign="center">{t('actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredItems.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={12} color="gray.500">
                    <VStack spacing={2}>
                      <FiPackage size={40} color="#cbd5e1" />
                      <Text fontWeight="semibold">{t('noProductsInCatalog')}</Text>
                      <Button size="sm" colorScheme="teal" leftIcon={<FiPlus />} onClick={onAddOpen}>
                        {t('addFirstProductPrompt')}
                      </Button>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                filteredItems.map((item: any) => (
                  <Tr key={item._id} _hover={{ bg: useColorModeValue('gray.50', 'gray.750') }}>
                    <Td fontWeight="bold">
                      <Text>{item.name_arabic || item.name}</Text>
                    </Td>
                    <Td>
                      <Text color="gray.600" fontSize="sm">
                        {item.name}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme="teal" fontSize="sm" px={2} py={0.5} borderRadius="lg">
                        {(item.selling_price || item.cost_price || 0).toFixed(2)} <RiyalCurrencySymbol boxSize="0.9em" ml="2px" />
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue" variant="subtle" borderRadius="md">
                        {item.category || t('catGeneral')}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="xs" fontFamily="monospace" color="gray.500">
                        {item.sku || '-'}
                      </Text>
                    </Td>
                    <Td textAlign="center">
                      <HStack spacing={1} justify="center">
                        <IconButton
                          aria-label="Edit"
                          icon={<FiEdit />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => {
                            setEditingItem({ ...item });
                            onEditOpen();
                          }}
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(item._id, item.name_arabic || item.name)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>

      {/* Quick Add Modal (Option 1) */}
      <QuickAddProductModal isOpen={isAddOpen} onClose={onAddClose} />

      {/* Bulk Add Modal (Option 2) */}
      <Modal isOpen={isBulkOpen} onClose={onBulkClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={2}>
          <ModalHeader pb={2}>
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                {t('bulkImportTitle')}
              </Text>
              <Button
                size="xs"
                variant="outline"
                leftIcon={<FiDownload />}
                colorScheme="teal"
                onClick={handleDownloadSampleCsv}
              >
                {t('downloadSampleCsvBtn')}
              </Button>
            </HStack>
            <Text fontSize="xs" color="gray.500" fontWeight="normal">
              {t('pasteCsvOrExcel')}
            </Text>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={3}>
            <VStack spacing={3} align="stretch">
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold">
                  {t('csvDataLabel')}
                </FormLabel>
                <Textarea
                  placeholder={`اسم الصنف بالعربي, English Name, سعر البيع, سعر التكلفة, التصنيف, الباركود, الكمية, الوحدة, نسبة الضريبة, الحد الأدنى\nشاي كرك مميز, Special Karak Tea, 3.50, 1.50, مشروبات / Beverages, 628100100001, 200, حبة, 15, 20\nعطر عود ملكي, Royal Oud, 180.00, 110.00, عطور / Perfumes, 628100100002, 45, حبة, 15, 5`}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  rows={8}
                  fontFamily="monospace"
                  fontSize="xs"
                  borderRadius="xl"
                />
              </FormControl>

              {isBulkUploading && (
                <Box>
                  <Text fontSize="xs" mb={1} color="teal.600" fontWeight="bold">
                    {t('uploadingProducts')} {bulkProgress}%
                  </Text>
                  <Progress value={bulkProgress} size="sm" colorScheme="teal" borderRadius="full" hasStripe isAnimated />
                </Box>
              )}

              <Box p={3} bg="teal.50" border="1px solid" borderColor="teal.200" borderRadius="xl" fontSize="xs" color="teal.900">
                <Text fontWeight="bold" mb={1}>{t('supportedColumnsTip')}</Text>
                <Text fontSize="2xs" color="teal.700">
                  {t('supportedColumnsList')}
                </Text>
                <Text fontSize="2xs" mt={1} color="teal.600">
                  {t('bulkImportTip')}
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" pt={3}>
            <HStack spacing={2} justify="flex-end" w="100%">
              <Button variant="ghost" onClick={onBulkClose} borderRadius="xl" isDisabled={isBulkUploading}>
                {t('cancelBtn')}
              </Button>
              <Button
                colorScheme="purple"
                leftIcon={<FiUploadCloud />}
                onClick={handleBulkImport}
                isLoading={isBulkUploading}
                borderRadius="xl"
                fontWeight="bold"
                px={6}
              >
                {t('importAllProductsNow')}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Single Item Modal */}
      {editingItem && (
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="md" isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl" p={2}>
            <ModalHeader pb={2}>
              <Text fontSize="lg" fontWeight="bold">
                {t('editProductModalTitle')}
              </Text>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody py={3}>
              <VStack spacing={3} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('productArabicName')}
                  </FormLabel>
                  <Input
                    value={editingItem.name_arabic || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name_arabic: e.target.value })}
                    dir="rtl"
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('productEnglishName')}
                  </FormLabel>
                  <Input
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>

                <SimpleGrid columns={2} spacing={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold">
                      {t('priceVatIncl')} (<RiyalCurrencySymbol boxSize="0.85em" />)
                    </FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingItem.selling_price || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, selling_price: e.target.value })}
                      borderRadius="xl"
                      fontWeight="bold"
                      color="teal.600"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">
                      {t('barcodeOptional')}
                    </FormLabel>
                    <Input
                      value={editingItem.sku || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                      borderRadius="xl"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('productCategory')}
                  </FormLabel>
                  <Input
                    value={editingItem.category || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter borderTopWidth="1px" pt={3}>
              <HStack spacing={2} justify="flex-end" w="100%">
                <Button variant="ghost" onClick={onEditClose} borderRadius="xl">
                  {t('cancelBtn')}
                </Button>
                <Button colorScheme="teal" onClick={handleSaveEdit} borderRadius="xl" fontWeight="bold">
                  {t('saveChangesBtn')}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default VendorProductsScreen;
