import React, { useState, useEffect, useMemo } from 'react';
import { SaudiRiyalSymbolOnly } from '../components/SaudiRiyalSymbol';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  HStack,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  useDisclosure,
  useToast,
  useColorModeValue,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Tag,
  TagLabel,
  TagLeftIcon,
  Divider,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiShoppingBag,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiExternalLink,
  FiKey,
  FiCheckCircle,
  FiXCircle,
  FiMoreVertical,
  FiPhone,
  FiMail,
  FiLayers,
  FiPackage,
  FiUser,
  FiShield,
  FiArrowRight,
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { vendorAuthService, VendorAccount } from '../services/vendorAuthService';
import { useAuth } from '../contexts/shared/AuthContext';
import { useLanguage } from '../contexts/shared/LanguageContext';

const BUSINESS_CATEGORIES = [
  'General / عام',
  'Beverages & Cafes / مقاهي ومشروبات',
  'Food & Restaurant / مطاعم ومأكولات',
  'Grocery & Supermarket / بقالة وتموينات',
  'Perfumes & Cosmetics / عطور وتجميل',
  'Auto & Spare Parts / سيارات وقطع غيار',
  'Clothing & Fashion / ملابس وأزياء',
  'Electronics & Mobiles / إلكترونيات وجوالات',
  'Services & Maintenance / خدمات وصيانة',
];

export const VendorManagementScreen: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { loginVendor } = useAuth();
  const { currentLanguage, isRtl, dir, t } = useLanguage();

  // State
  const [vendors, setVendors] = useState<VendorAccount[]>(() => vendorAuthService.getAllVendors());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modals
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();

  // Active item in modal
  const [selectedVendor, setSelectedVendor] = useState<VendorAccount | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    storeName: '',
    storeNameArabic: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    vatNumber: '310860308200003',
    crNumber: '1010123456',
    businessCategory: 'General / عام',
  });

  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Refresh vendors list
  const loadVendors = () => {
    setVendors(vendorAuthService.getAllVendors());
  };

  useEffect(() => {
    loadVendors();
    const handleDirUpdate = () => loadVendors();
    window.addEventListener('vendor-directory-updated', handleDirUpdate);
    window.addEventListener('vendor-session-changed', handleDirUpdate);
    return () => {
      window.removeEventListener('vendor-directory-updated', handleDirUpdate);
      window.removeEventListener('vendor-session-changed', handleDirUpdate);
    };
  }, []);

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        v.storeName.toLowerCase().includes(q) ||
        (v.storeNameArabic && v.storeNameArabic.includes(searchTerm)) ||
        v.ownerName.toLowerCase().includes(q) ||
        v.phone.includes(searchTerm) ||
        (v.email && v.email.toLowerCase().includes(q)) ||
        (v.vatNumber && v.vatNumber.includes(searchTerm)) ||
        (v.crNumber && v.crNumber.includes(searchTerm));

      const matchesCategory =
        selectedCategory === 'all' || v.businessCategory === selectedCategory;

      const isVendorActive = v.isActive !== false;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isVendorActive) ||
        (statusFilter === 'suspended' && !isVendorActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [vendors, searchTerm, selectedCategory, statusFilter]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.isActive !== false).length;
    let totalProducts = 0;
    vendors.forEach((v) => {
      const prods = vendorAuthService.getVendorProducts(v.id);
      totalProducts += prods.length;
    });
    const categoriesCount = new Set(vendors.map((v) => v.businessCategory)).size;

    return { total, active, totalProducts, categoriesCount };
  }, [vendors]);

  // Launch POS as Vendor
  const handleLaunchVendorPos = (vendor: VendorAccount) => {
    loginVendor(vendor);
    toast({
      title: 'تم تسجيل الدخول كمتجر',
      description: `جاري فتح نقطة بيع متجر: ${vendor.storeNameArabic || vendor.storeName}`,
      status: 'success',
      duration: 2500,
    });
    navigate('/pos');
  };

  // Launch Vendor Catalog Management
  const handleLaunchVendorProducts = (vendor: VendorAccount) => {
    loginVendor(vendor);
    navigate('/pos/products');
  };

  // Create new vendor
  const handleCreateVendor = async () => {
    if (!formData.storeName || !formData.phone || !formData.ownerName) {
      toast({
        title: 'بيانات غير مكتملة',
        description: 'يرجى إدخال اسم المتجر، اسم المالك، ورقم الجوال',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    const res = await vendorAuthService.registerVendor({
      storeName: formData.storeName,
      storeNameArabic: formData.storeNameArabic || formData.storeName,
      ownerName: formData.ownerName,
      phone: formData.phone,
      email: formData.email,
      password: formData.password || '123456',
      vatNumber: formData.vatNumber,
      crNumber: formData.crNumber,
      businessCategory: formData.businessCategory,
    });

    if (res.success) {
      toast({
        title: 'تم تسجيل المتجر بنجاح',
        description: `تمت إضافة ${formData.storeName} إلى شبكة المتاجر`,
        status: 'success',
        duration: 3500,
      });
      onCreateClose();
      loadVendors();
      setFormData({
        storeName: '',
        storeNameArabic: '',
        ownerName: '',
        phone: '',
        email: '',
        password: '',
        vatNumber: '310860308200003',
        crNumber: '1010123456',
        businessCategory: 'General / عام',
      });
    } else {
      toast({
        title: 'فشل التسجيل',
        description: res.error,
        status: 'error',
        duration: 4000,
      });
    }
  };

  // Open Edit Modal
  const openEditModal = (vendor: VendorAccount) => {
    setSelectedVendor(vendor);
    setFormData({
      storeName: vendor.storeName,
      storeNameArabic: vendor.storeNameArabic || vendor.storeName,
      ownerName: vendor.ownerName,
      phone: vendor.phone,
      email: vendor.email || '',
      password: '',
      vatNumber: vendor.vatNumber || '',
      crNumber: vendor.crNumber || '',
      businessCategory: vendor.businessCategory || 'General / عام',
    });
    onEditOpen();
  };

  // Save Edit
  const handleSaveEdit = () => {
    if (!selectedVendor) return;
    const ok = vendorAuthService.updateVendor(selectedVendor.id, {
      storeName: formData.storeName,
      storeNameArabic: formData.storeNameArabic || formData.storeName,
      ownerName: formData.ownerName,
      phone: formData.phone,
      email: formData.email,
      vatNumber: formData.vatNumber,
      crNumber: formData.crNumber,
      businessCategory: formData.businessCategory,
    });

    if (ok) {
      toast({
        title: 'تم تحديث بيانات المتجر',
        status: 'success',
        duration: 3000,
      });
      onEditClose();
      loadVendors();
    }
  };

  // Toggle Status
  const handleToggleStatus = (vendor: VendorAccount) => {
    const newStatus = vendor.isActive === false ? true : false;
    vendorAuthService.toggleVendorActive(vendor.id, newStatus);
    toast({
      title: newStatus ? 'تم تنشيط المتجر' : 'تم إيقاف المتجر مؤقتاً',
      status: newStatus ? 'success' : 'info',
      duration: 2500,
    });
    loadVendors();
  };

  // Delete Vendor
  const handleDeleteVendor = (vendor: VendorAccount) => {
    if (window.confirm(`هل أنت متأكد من حذف متجر "${vendor.storeNameArabic || vendor.storeName}" بالكامل؟`)) {
      vendorAuthService.deleteVendor(vendor.id);
      toast({
        title: 'تم حذف المتجر',
        status: 'info',
        duration: 3000,
      });
      loadVendors();
    }
  };

  // Reset Password
  const openResetModal = (vendor: VendorAccount) => {
    setSelectedVendor(vendor);
    setNewPasswordInput('');
    onResetOpen();
  };

  const handleSaveResetPassword = async () => {
    if (!selectedVendor || !newPasswordInput.trim()) return;
    await vendorAuthService.adminResetVendorPassword(selectedVendor.id, newPasswordInput.trim());
    toast({
      title: 'تم تغيير كلمة المرور بنجاح',
      description: `كلمة المرور الجديدة لمتجر ${selectedVendor.storeName} مفعلة الآن`,
      status: 'success',
      duration: 3000,
    });
    onResetClose();
  };

  // Export Vendors Directory CSV (UTF-8 with BOM)
  const handleExportVendorsCsv = () => {
    const headers = [
      'اسم المتجر (بالعربي)',
      'Store Name (English)',
      'اسم المالك (Owner Name)',
      'رقم الجوال (Mobile Phone)',
      'البريد الإلكتروني (Email)',
      'نشاط المتجر (Category)',
      'الرقم الضريبي (VAT Number)',
      'السجل التجاري (CR Number)',
      'عدد أصناف الكتالوج (Products Count)',
      'الحالة (Status)',
      'تاريخ التسجيل (Created At)',
    ].join(',');

    const rows = vendors.map((v) => {
      const prodsCount = vendorAuthService.getVendorProducts(v.id).length;
      const statusStr = v.isActive !== false ? 'Active / نشط' : 'Suspended / موقوف';
      return [
        `"${v.storeNameArabic || v.storeName}"`,
        `"${v.storeName}"`,
        `"${v.ownerName}"`,
        `"${v.phone}"`,
        `"${v.email || ''}"`,
        `"${v.businessCategory}"`,
        `"${v.vatNumber || ''}"`,
        `"${v.crNumber || ''}"`,
        prodsCount,
        `"${statusStr}"`,
        `"${new Date(v.createdAt).toLocaleDateString()}"`,
      ].join(',');
    });

    const csvContent = headers + '\n' + rows.join('\n') + '\n';
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vendors_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box p={{ base: 3, md: 6 }} maxW="1600px" mx="auto" dir={dir}>
      {/* Top Banner & Header */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        mb={6}
        gap={4}
      >
        <Box>
          <HStack spacing={3} mb={1}>
            <Icon as={FaStore} boxSize={7} color="purple.500" />
            <Heading size="lg" color="gray.800">
              {t('vendorsTitle')}
            </Heading>
          </HStack>
          <Text fontSize="sm" color="gray.500">
            {t('vendorsSub')}
          </Text>
        </Box>

        <HStack spacing={3}>
          <Button
            leftIcon={<FiDownload />}
            variant="outline"
            colorScheme="teal"
            size="md"
            borderRadius="xl"
            onClick={handleExportVendorsCsv}
          >
            {t('exportDirectoryCsv')}
          </Button>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="purple"
            size="md"
            borderRadius="xl"
            px={6}
            fontWeight="bold"
            onClick={onCreateOpen}
          >
            {t('registerNewVendor')}
          </Button>
        </HStack>
      </Flex>

      {/* Metric Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">
                {t('totalRegisteredVendors')}
              </StatLabel>
              <StatNumber fontSize="2xl" color="purple.600" fontWeight="extrabold">
                {stats.total}
              </StatNumber>
              <StatHelpText fontSize="2xs" color="gray.500" mb={0}>
                Registered Stores
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">
                {t('activeStores')}
              </StatLabel>
              <StatNumber fontSize="2xl" color="green.600" fontWeight="extrabold">
                {stats.active}
              </StatNumber>
              <StatHelpText fontSize="2xs" color="gray.500" mb={0}>
                Active & Live POS
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">
                {t('catalogedItems')}
              </StatLabel>
              <StatNumber fontSize="2xl" color="blue.600" fontWeight="extrabold">
                {stats.totalProducts}
              </StatNumber>
              <StatHelpText fontSize="2xs" color="gray.500" mb={0}>
                Store Products
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">
                {t('businessSectors')}
              </StatLabel>
              <StatNumber fontSize="2xl" color="teal.600" fontWeight="extrabold">
                {stats.categoriesCount}
              </StatNumber>
              <StatHelpText fontSize="2xs" color="gray.500" mb={0}>
                Sectors & Verticals
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filter & Search Bar */}
      <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={6}>
        <CardBody p={4}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder={t('searchVendorsPlaceholder')}
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
              <option value="all">{t('allSectors')}</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              borderRadius="xl"
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="active">{t('activeOnly')}</option>
              <option value="suspended">{t('suspendedOnly')}</option>
            </Select>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Vendors Directory Table */}
      <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm">
        <TableContainer>
          <Table variant="simple">
            <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
              <Tr>
                <Th>{t('colStoreOwner')}</Th>
                <Th>{t('colContact')}</Th>
                <Th>{t('businessSectors')}</Th>
                <Th>{t('colSectorTax')}</Th>
                <Th isNumeric>{t('colCatalog')}</Th>
                <Th>{t('colStatus')}</Th>
                <Th textAlign="center">{t('colActions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredVendors.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" py={12}>
                    <VStack spacing={3}>
                      <Icon as={FaStore} boxSize={10} color="gray.400" />
                      <Text fontWeight="bold" color="gray.600">
                        {t('noVendorsFound')}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {t('noVendorsSub')}
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const prodsCount = vendorAuthService.getVendorProducts(vendor.id).length;
                  const isVendorActive = vendor.isActive !== false;

                  return (
                    <Tr key={vendor.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                      {/* Store Name */}
                      <Td>
                        <HStack spacing={3}>
                          <Box
                            w={10}
                            h={10}
                            borderRadius="xl"
                            bg="purple.50"
                            color="purple.600"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontWeight="bold"
                            fontSize="lg"
                            border="1px solid"
                            borderColor="purple.200"
                          >
                            {(vendor.storeNameArabic || vendor.storeName).charAt(0)}
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm" color="gray.800">
                              {vendor.storeNameArabic || vendor.storeName}
                            </Text>
                            {vendor.storeNameArabic && (
                              <Text fontSize="xs" color="gray.500">
                                {vendor.storeName}
                              </Text>
                            )}
                            <Text fontSize="2xs" color="gray.400">
                              ID: {vendor.id}
                            </Text>
                          </VStack>
                        </HStack>
                      </Td>

                      {/* Owner & Contact */}
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack spacing={1}>
                            <Icon as={FiUser} color="gray.400" boxSize={3} />
                            <Text fontSize="sm" fontWeight="medium">
                              {vendor.ownerName}
                            </Text>
                          </HStack>
                          <HStack spacing={2}>
                            <HStack spacing={1}>
                              <Icon as={FiPhone} color="green.500" boxSize={3} />
                              <Text fontSize="xs" color="gray.600" dir="ltr">
                                {vendor.phone}
                              </Text>
                            </HStack>
                            <Tooltip label={t('whatsappTooltip')}>
                              <IconButton
                                as="a"
                                href={`https://wa.me/966${vendor.phone.replace(/^0/, '')}`}
                                target="_blank"
                                aria-label="WhatsApp"
                                icon={<FiExternalLink />}
                                size="xs"
                                variant="ghost"
                                colorScheme="green"
                              />
                            </Tooltip>
                          </HStack>
                          {vendor.email && (
                            <HStack spacing={1}>
                              <Icon as={FiMail} color="gray.400" boxSize={3} />
                              <Text fontSize="2xs" color="gray.500">
                                {vendor.email}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </Td>

                      {/* Business Category */}
                      <Td>
                        <Tag size="sm" colorScheme="purple" borderRadius="full">
                          <TagLabel fontSize="2xs">{vendor.businessCategory || 'General'}</TagLabel>
                        </Tag>
                        <Text fontSize="2xs" color="gray.400" mt={1}>
                          {t('currencyLabel')}: {vendor.currency === 'SAR'
                            ? <SaudiRiyalSymbolOnly size="small" />
                            : (vendor.currency || t('currencySymbol'))}
                        </Text>
                      </Td>

                      {/* VAT & CR */}
                      <Td>
                        <VStack align="start" spacing={0} fontSize="xs">
                          <Text color="gray.600">
                            <strong>{t('vatShort')}:</strong> {vendor.vatNumber || '—'}
                          </Text>
                          <Text color="gray.500">
                            <strong>{t('crShort')}:</strong> {vendor.crNumber || '—'}
                          </Text>
                        </VStack>
                      </Td>

                      {/* Products Count */}
                      <Td isNumeric>
                        <Badge colorScheme={prodsCount > 0 ? 'blue' : 'gray'} borderRadius="full" px={2} py={0.5}>
                          {prodsCount} {t('itemsUnit')}
                        </Badge>
                      </Td>

                      {/* Status */}
                      <Td>
                        <Badge
                          colorScheme={isVendorActive ? 'green' : 'red'}
                          variant="subtle"
                          borderRadius="full"
                          px={2}
                          py={0.5}
                          fontSize="2xs"
                        >
                          {isVendorActive ? t('activeStatus') : t('suspendedStatus')}
                        </Badge>
                      </Td>

                      {/* Actions */}
                      <Td textAlign="center">
                        <HStack spacing={1} justify="center">
                          <Tooltip label={t('launchPosBtn')}>
                            <Button
                              size="xs"
                              colorScheme="purple"
                              leftIcon={<FiShoppingBag />}
                              borderRadius="lg"
                              onClick={() => handleLaunchVendorPos(vendor)}
                            >
                              POS
                            </Button>
                          </Tooltip>

                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FiMoreVertical />}
                              size="xs"
                              variant="ghost"
                              borderRadius="lg"
                              aria-label="Options"
                            />
                            <MenuList zIndex={10} fontSize="sm">
                              <MenuItem
                                icon={<FiShoppingBag color="purple" />}
                                onClick={() => handleLaunchVendorPos(vendor)}
                              >
                                {t('launchPosBtn')}
                              </MenuItem>
                              <MenuItem
                                icon={<FiPackage color="blue" />}
                                onClick={() => handleLaunchVendorProducts(vendor)}
                              >
                                {t('manageCatalogBtn')} ({prodsCount})
                              </MenuItem>
                              <MenuDivider />
                              <MenuItem icon={<FiEdit />} onClick={() => openEditModal(vendor)}>
                                {t('editStoreBtn')}
                              </MenuItem>
                              <MenuItem icon={<FiKey />} onClick={() => openResetModal(vendor)}>
                                {t('changePasswordBtn')}
                              </MenuItem>
                              <MenuItem
                                icon={isVendorActive ? <FiXCircle color="orange" /> : <FiCheckCircle color="green" />}
                                onClick={() => handleToggleStatus(vendor)}
                              >
                                {isVendorActive ? t('suspendStoreBtn') : t('activateStoreBtn')}
                              </MenuItem>
                              <MenuDivider />
                              <MenuItem
                                icon={<FiTrash2 color="red" />}
                                color="red.500"
                                onClick={() => handleDeleteVendor(vendor)}
                              >
                                {t('deleteStoreBtn')}
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal: Create Vendor */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={2}>
          <ModalHeader pb={2}>
            <Heading size="md" color="purple.700">
              {t('registerVendorTitle')}
            </Heading>
            <Text fontSize="xs" color="gray.500">
              {t('registerVendorSub')}
            </Text>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={4}>
            <VStack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="100%">
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('storeArabicName')}
                  </FormLabel>
                  <Input
                    placeholder="مقهى ومحمص الأمل"
                    value={formData.storeNameArabic}
                    onChange={(e) => setFormData({ ...formData, storeNameArabic: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('storeNameLabel')} (English)
                  </FormLabel>
                  <Input
                    placeholder="Al-Amal Roastery & Cafe"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="100%">
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('ownerManagerName')}
                  </FormLabel>
                  <Input
                    placeholder="Abdullah Mohammed"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('mobileUsername')}
                  </FormLabel>
                  <Input
                    placeholder="05XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="100%">
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('emailOptional')}
                  </FormLabel>
                  <Input
                    type="email"
                    placeholder="store@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('initialPassword')}
                  </FormLabel>
                  <Input
                    type="password"
                    placeholder="123456"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold">
                  {t('businessSector')}
                </FormLabel>
                <Select
                  value={formData.businessCategory}
                  onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                  borderRadius="xl"
                >
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="100%">
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('vatNumber15')}
                  </FormLabel>
                  <Input
                    placeholder="310860308200003"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('crNumber')}
                  </FormLabel>
                  <Input
                    placeholder="1010123456"
                    value={formData.crNumber}
                    onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px">
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onCreateClose} borderRadius="xl">
                {t('cancelBtn')}
              </Button>
              <Button colorScheme="purple" borderRadius="xl" px={6} onClick={handleCreateVendor}>
                {t('saveRegisterVendor')}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: Edit Vendor */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={2}>
          <ModalHeader pb={2}>
            <Heading size="md" color="purple.700">
              {t('editVendorTitle')}
            </Heading>
            <Text fontSize="xs" color="gray.500">
              {t('editVendorSub')}
            </Text>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={4}>
            <VStack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="100%">
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('storeArabicName')}
                  </FormLabel>
                  <Input
                    value={formData.storeNameArabic}
                    onChange={(e) => setFormData({ ...formData, storeNameArabic: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('storeNameLabel')} (English)
                  </FormLabel>
                  <Input
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="100%">
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('ownerNameLabel')}
                  </FormLabel>
                  <Input
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('mobileLabel')}
                  </FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold">
                  {t('emailOptional')}
                </FormLabel>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold">
                  {t('businessSector')}
                </FormLabel>
                <Select
                  value={formData.businessCategory}
                  onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                  borderRadius="xl"
                >
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="100%">
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('vatNumber15')}
                  </FormLabel>
                  <Input
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('crNumber')}
                  </FormLabel>
                  <Input
                    value={formData.crNumber}
                    onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px">
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onEditClose} borderRadius="xl">
                {t('cancelBtn')}
              </Button>
              <Button colorScheme="purple" borderRadius="xl" px={6} onClick={handleSaveEdit}>
                {t('saveChangesBtn')}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: Reset Password */}
      <Modal isOpen={isResetOpen} onClose={onResetClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={2}>
          <ModalHeader pb={2}>
            <Heading size="sm">{t('resetPasswordTitle')}</Heading>
            <Text fontSize="xs" color="gray.500">
              {selectedVendor?.storeNameArabic || selectedVendor?.storeName}
            </Text>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={3}>
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="bold">
                {t('newPasswordLabel')}
              </FormLabel>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                borderRadius="xl"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter borderTopWidth="1px">
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onResetClose} borderRadius="xl">
                {t('cancelBtn')}
              </Button>
              <Button colorScheme="purple" borderRadius="xl" onClick={handleSaveResetPassword}>
                {t('updatePasswordBtn')}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default VendorManagementScreen;
