import React, { useState, useMemo } from 'react';
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
  Select,
  NumberInput,
  NumberInputField,
  useDisclosure,
  useToast,
  useColorModeValue,
  Icon,
  IconButton,
  Tooltip,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Tag,
  Alert,
  AlertIcon,
  Flex,
  Avatar,
  Textarea,
  Switch,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { useLanguage } from '../contexts/shared/LanguageContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import {
  FiLayers,
  FiPlus,
  FiTruck,
  FiMonitor,
  FiCheckCircle,
  FiAlertTriangle,
  FiTool,
  FiRefreshCw,
  FiPrinter,
  FiUserCheck,
  FiClock,
  FiShare2,
  FiSearch,
  FiBell,
  FiCheck,
  FiXCircle,
  FiPhone,
  FiSend,
  FiCamera,
  FiImage,
} from 'react-icons/fi';
import { FaWhatsapp, FaQrcode } from 'react-icons/fa';
import QRCode from 'qrcode';
import { RiyalCurrencySymbol } from '../components/icons/SaudiRiyalIcon';

// Asset Categories Definition
const ASSET_CATEGORIES = [
  { key: 'it_hardware', labelEn: 'IT & Hardware', labelAr: 'أجهزة وتقنية المعلومات' },
  { key: 'vehicles_fleet', labelEn: 'Vehicles & Fleet', labelAr: 'المركبات والأسطول' },
  { key: 'mobile_telecom', labelEn: 'Mobile & SIMs', labelAr: 'الهواتف والشرائح' },
  { key: 'machinery_tools', labelEn: 'Machinery & Tools', labelAr: 'المعدات والأدوات' },
  { key: 'furniture', labelEn: 'Office Furniture', labelAr: 'الأثاث المكتبي' },
  { key: 'facility_equipment', labelEn: 'Facility Equipment', labelAr: 'تجهيزات المنشأة' },
];

export const AssetManagementScreen: React.FC = () => {
  const { selectedOrganization, user } = useAuth();
  const { currentLanguage, isRtl, t } = useLanguage();
  const toast = useToast();

  const isConvex = isConvexOrgId(selectedOrganization);

  // Queries
  const assets = useQuery(
    api.assets.listAssets,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const assetStats = useQuery(
    api.assets.getAssetStats,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const employees = useQuery(
    api.employees.listEmployees,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const notifications = useQuery(
    api.stakeholderNotifications.listNotifications,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const approvalRequests = useQuery(
    api.whatsappApprovals.listApprovalRequests,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const approvers = useQuery(
    api.whatsappApprovals.listApprovers,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  const assetAudits = useQuery(
    api.assets.listAssetAudits,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Mutations
  const createAssetMutation = useMutation(api.assets.createAsset);
  const assignCustodyMutation = useMutation(api.assets.assignAssetCustody);
  const returnCustodyMutation = useMutation(api.assets.returnAssetCustody);
  const recordMaintenanceMutation = useMutation(api.assets.recordMaintenanceLog);
  const runComplianceCheckMutation = useMutation(api.stakeholderNotifications.runDailyComplianceCheck);
  const markNotificationReadMutation = useMutation(api.stakeholderNotifications.markNotificationRead);
  const processApprovalDecisionMutation = useMutation(api.whatsappApprovals.processApprovalDecision);
  const dispatchApprovalRequestMutation = useMutation(api.whatsappApprovals.dispatchApprovalRequest);
  const submitAssetSelfAuditMutation = useMutation(api.assets.submitAssetSelfAudit);
  const reviewAssetAuditMutation = useMutation(api.assets.reviewAssetAudit);

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssetForAction, setSelectedAssetForAction] = useState<any>(null);

  // QR Code Sticker modal state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const { isOpen: isQrModalOpen, onOpen: onQrModalOpen, onClose: onQrModalClose } = useDisclosure();

  // Employee Self-Audit modal state
  const { isOpen: isSelfAuditOpen, onOpen: onSelfAuditOpen, onClose: onSelfAuditClose } = useDisclosure();
  const [selfAuditForm, setSelfAuditForm] = useState({
    condition: 'good',
    operationalStatus: 'fully_operational',
    qrScanned: true,
    scannedPayload: '',
    notes: '',
    photos: [] as string[],
    gpsLat: undefined as number | undefined,
    gpsLng: undefined as number | undefined,
  });

  // Modals
  const { isOpen: isAddAssetOpen, onOpen: onAddAssetOpen, onClose: onAddAssetClose } = useDisclosure();
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  const { isOpen: isReturnOpen, onOpen: onReturnOpen, onClose: onReturnClose } = useDisclosure();
  const { isOpen: isMaintenanceOpen, onOpen: onMaintenanceOpen, onClose: onMaintenanceClose } = useDisclosure();
  const { isOpen: isPrintSlipOpen, onOpen: onPrintSlipOpen, onClose: onPrintSlipClose } = useDisclosure();

  // Add Asset Form State
  const [newAssetForm, setNewAssetForm] = useState({
    name: '',
    nameArabic: '',
    category: 'it_hardware',
    subCategory: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 0,
    physicalLocation: 'Main Office',
    notes: '',
    // Vehicle details
    plateNumber: '',
    plateNumberArabic: '',
    istimaraExpiry: '',
    fahasExpiry: '',
    insurancePolicyNumber: '',
    insuranceExpiry: '',
    fuelCardNumber: '',
    currentOdometerKm: 0,
    assignedEmployeeId: '',
  });

  // Assign Custody Form State
  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    condition: 'good',
    notes: '',
    requireWhatsApp: true,
  });

  // Return Custody Form State
  const [returnForm, setReturnForm] = useState({
    condition: 'good',
    notes: '',
  });

  // Maintenance Form State
  const [maintForm, setMaintForm] = useState({
    serviceType: 'routine_inspection',
    cost: 0,
    serviceProvider: '',
    invoiceRef: '',
    nextDueDate: '',
    notes: '',
  });

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const subBg = useColorModeValue('gray.50', 'gray.900');

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((a) => {
      const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || a.status === selectedStatus;
      const matchSearch =
        searchQuery === '' ||
        a.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.serial_number && a.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.holder_name && a.holder_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchStatus && matchSearch;
    });
  }, [assets, selectedCategory, selectedStatus, searchQuery]);

  // Handlers
  const handleCreateAsset = async () => {
    if (!newAssetForm.name || !newAssetForm.brand) {
      toast({
        title: 'Validation Error',
        description: 'Asset name and brand are required',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const isVehicle = newAssetForm.category === 'vehicles_fleet';
      const vehicleDetails = isVehicle
        ? {
            plate_number: newAssetForm.plateNumber,
            plate_number_arabic: newAssetForm.plateNumberArabic,
            istimara_expiry: newAssetForm.istimaraExpiry,
            fahas_expiry: newAssetForm.fahasExpiry,
            insurance_policy_number: newAssetForm.insurancePolicyNumber,
            insurance_expiry: newAssetForm.insuranceExpiry,
            fuel_card_number: newAssetForm.fuelCardNumber || undefined,
            current_odometer_km: Number(newAssetForm.currentOdometerKm) || 0,
          }
        : undefined;

      await createAssetMutation({
        organization_id: selectedOrganization as any,
        asset_name: newAssetForm.name,
        asset_name_arabic: newAssetForm.nameArabic || undefined,
        category: newAssetForm.category,
        sub_category: newAssetForm.subCategory || undefined,
        brand: newAssetForm.brand,
        model: newAssetForm.model,
        serial_number: newAssetForm.serialNumber || undefined,
        purchase_date: newAssetForm.purchaseDate,
        purchase_cost: Number(newAssetForm.purchaseCost) || 0,
        currency: 'SAR',
        physical_location: newAssetForm.physicalLocation,
        notes: newAssetForm.notes || undefined,
        vehicle_details: vehicleDetails,
        assigned_to_employee_id: newAssetForm.assignedEmployeeId || undefined,
      });

      toast({
        title: 'Asset Added',
        description: 'New asset registered successfully with unique asset tag',
        status: 'success',
        duration: 3000,
      });

      onAddAssetClose();
      // Reset form
      setNewAssetForm({
        name: '',
        nameArabic: '',
        category: 'it_hardware',
        subCategory: '',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: 0,
        physicalLocation: 'Main Office',
        notes: '',
        plateNumber: '',
        plateNumberArabic: '',
        istimaraExpiry: '',
        fahasExpiry: '',
        insurancePolicyNumber: '',
        insuranceExpiry: '',
        fuelCardNumber: '',
        currentOdometerKm: 0,
        assignedEmployeeId: '',
      });
    } catch (err: any) {
      toast({
        title: 'Error Creating Asset',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    }
  };

  const handleAssignCustody = async () => {
    if (!assignForm.employeeId || !selectedAssetForAction) {
      toast({
        title: 'Selection required',
        description: 'Please select an employee to receive this asset',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const res = await assignCustodyMutation({
        asset_id: selectedAssetForAction._id,
        employee_id: assignForm.employeeId as any,
        assigned_date: new Date().toISOString().split('T')[0],
        condition_at_handover: assignForm.condition as any,
        handed_over_by_user_id: user?.email || 'hr_admin',
        notes: assignForm.notes,
        require_whatsapp_acceptance: assignForm.requireWhatsApp,
      });

      if (res?.whatsapp_requested) {
        toast({
          title: 'WhatsApp Handover Ping Dispatched',
          description: `Custody acceptance request sent to ${res.employee_phone}. Asset is pending employee WhatsApp sign-off.`,
          status: 'info',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Custody Handed Over',
          description: 'Asset assigned successfully',
          status: 'success',
          duration: 3000,
        });
      }
      onAssignClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    }
  };

  const handleSimulateWhatsAppDecision = async (verificationToken: string, decision: 'approved' | 'rejected') => {
    try {
      await processApprovalDecisionMutation({
        verification_token: verificationToken,
        decision,
        rejection_reason: decision === 'rejected' ? 'Rejected by employee / عهدة غير مقبولة' : undefined,
      });
      toast({
        title: decision === 'approved' ? 'Custody Accepted' : 'Custody Rejected',
        description: `Decision processed via WhatsApp workflow (${decision.toUpperCase()})`,
        status: decision === 'approved' ? 'success' : 'warning',
        duration: 3000,
      });
    } catch (err: any) {
      toast({
        title: 'Decision Error',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    }
  };

  const handleOpenQrSticker = async (asset: any) => {
    setSelectedAssetForAction(asset);
    try {
      const qrData = asset.barcode_or_qr_code || `ERP-ASSET:${asset.organization_id}:${asset.asset_tag}`;
      const url = await QRCode.toDataURL(qrData, {
        width: 320,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrCodeDataUrl(url);
      onQrModalOpen();
    } catch (err: any) {
      toast({
        title: 'QR Generation Error',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleOpenSelfAudit = (asset: any) => {
    setSelectedAssetForAction(asset);
    setSelfAuditForm({
      condition: 'good',
      operationalStatus: 'fully_operational',
      qrScanned: true,
      scannedPayload: asset.barcode_or_qr_code || asset.asset_tag,
      notes: '',
      photos: [],
      gpsLat: undefined,
      gpsLng: undefined,
    });
    // Attempt GPS capture
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSelfAuditForm((p) => ({
            ...p,
            gpsLat: pos.coords.latitude,
            gpsLng: pos.coords.longitude,
          }));
        },
        () => {}
      );
    }
    onSelfAuditOpen();
  };

  const handleAuditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelfAuditForm((p) => ({
            ...p,
            photos: [...p.photos, reader.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitSelfAudit = async () => {
    if (!selectedAssetForAction) return;

    try {
      const res = await submitAssetSelfAuditMutation({
        organization_id: selectedOrganization as any,
        asset_id: selectedAssetForAction._id,
        employee_id: (selectedAssetForAction.current_holder_employee_id || employees?.[0]?._id) as any,
        reported_condition: selfAuditForm.condition,
        operational_status: selfAuditForm.operationalStatus,
        qr_scanned_verified: selfAuditForm.qrScanned,
        scanned_tag_payload: selfAuditForm.scannedPayload,
        photos: selfAuditForm.photos,
        gps_latitude: selfAuditForm.gpsLat,
        gps_longitude: selfAuditForm.gpsLng,
        notes: selfAuditForm.notes,
      });

      toast({
        title: 'Self-Audit Submitted',
        description:
          res.verification_status === 'flagged_discrepancy'
            ? 'Audit logged with maintenance flag. IT Admin notified.'
            : 'Asset physical verification recorded successfully.',
        status: res.verification_status === 'flagged_discrepancy' ? 'warning' : 'success',
        duration: 4000,
      });
      onSelfAuditClose();
    } catch (err: any) {
      toast({
        title: 'Submission Error',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    }
  };

  const handleReturnCustody = async () => {
    if (!selectedAssetForAction) return;

    try {
      await returnCustodyMutation({
        asset_id: selectedAssetForAction._id,
        returned_date: new Date().toISOString().split('T')[0],
        condition_at_return: returnForm.condition as any,
        received_by_user_id: user?.email || 'asset_manager',
        notes: returnForm.notes,
      });

      toast({
        title: 'Asset Returned',
        description: 'Custody returned and asset availability updated',
        status: 'success',
        duration: 3000,
      });
      onReturnClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    }
  };

  const handleRecordMaintenance = async () => {
    if (!selectedAssetForAction) return;

    try {
      await recordMaintenanceMutation({
        asset_id: selectedAssetForAction._id,
        service_type: maintForm.serviceType,
        service_date: new Date().toISOString().split('T')[0],
        cost: Number(maintForm.cost) || 0,
        service_provider: maintForm.serviceProvider,
        invoice_reference: maintForm.invoiceRef,
        next_service_due_date: maintForm.nextDueDate || undefined,
        performed_by: user?.email || 'admin',
        notes: maintForm.notes,
      });

      toast({
        title: 'Maintenance Logged',
        description: 'Maintenance record and costs saved',
        status: 'success',
        duration: 3000,
      });
      onMaintenanceClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    }
  };

  const handleRunComplianceScan = async () => {
    try {
      const res = await runComplianceCheckMutation({
        organization_id: selectedOrganization as any,
      });
      toast({
        title: 'Compliance Scan Completed',
        description: `Automated scan completed. ${res.triggered_notifications} stakeholder notifications evaluated and queued.`,
        status: 'info',
        duration: 4000,
      });
    } catch (err: any) {
      toast({
        title: 'Scan Error',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    }
  };

  if (!selectedOrganization) {
    return (
      <Box p={8} textAlign="center">
        <Alert status="warning" maxW="md" mx="auto" borderRadius="md">
          <AlertIcon />
          Please select an active organization to manage company assets and custody.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        mb={6}
        gap={4}
      >
        <VStack align="flex-start" spacing={1}>
          <HStack spacing={3}>
            <Icon as={FiLayers} boxSize={7} color="blue.600" />
            <Heading size="lg">
              {currentLanguage === 'ar' ? 'إدارة الأصول والعهد' : 'Assets & Custody Management'}
            </Heading>
          </HStack>
          <Text color="gray.500" fontSize="sm">
            {currentLanguage === 'ar'
              ? 'تتبع أجهزة الشركة، أسطول المركبات، تسليم واسترداد العهد للموظفين، وتنبيهات المسؤولين'
              : 'Track corporate equipment, fleet vehicles, employee custody handovers, and stakeholder compliance alerts'}
          </Text>
        </VStack>

        <HStack spacing={3} wrap="wrap">
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            size="sm"
            colorScheme="blue"
            onClick={handleRunComplianceScan}
          >
            {currentLanguage === 'ar' ? 'فحص الامتثال والتجديدات' : 'Run Compliance Scan'}
          </Button>

          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            size="sm"
            onClick={onAddAssetOpen}
          >
            {currentLanguage === 'ar' ? '+ إضافة أصل جديد' : '+ Register New Asset'}
          </Button>
        </HStack>
      </Flex>

      {/* Summary KPI Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel color="gray.500" fontSize="xs">
                {currentLanguage === 'ar' ? 'إجمالي قيمة الأصول' : 'Total Asset Book Value'}
              </StatLabel>
              <StatNumber fontSize="2xl" color="blue.600">
                <HStack spacing={1}>
                  <Text>{(assetStats?.totalValueSAR || 0).toLocaleString()}</Text>
                  <RiyalCurrencySymbol />
                </HStack>
              </StatNumber>
              <StatHelpText fontSize="xs">
                {assetStats?.totalCount || 0} {currentLanguage === 'ar' ? 'أصل مسجل' : 'Registered Assets'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel color="gray.500" fontSize="xs">
                {currentLanguage === 'ar' ? 'في العهدة (مُسلّم للموظفين)' : 'Assigned in Custody'}
              </StatLabel>
              <StatNumber fontSize="2xl" color="green.600">
                {assetStats?.assignedCount || 0}
              </StatNumber>
              <StatHelpText fontSize="xs">
                {assetStats?.availableCount || 0} {currentLanguage === 'ar' ? 'متاح بالمستودع' : 'Available in storage'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel color="gray.500" fontSize="xs">
                {currentLanguage === 'ar' ? 'أسطول المركبات' : 'Fleet & Vehicles'}
              </StatLabel>
              <StatNumber fontSize="2xl" color="purple.600">
                {assetStats?.vehiclesCount || 0}
              </StatNumber>
              <StatHelpText fontSize="xs" color={assetStats?.urgentFleetRenewals ? 'red.500' : 'gray.500'}>
                {assetStats?.urgentFleetRenewals || 0}{' '}
                {currentLanguage === 'ar' ? 'تجديدات استمارة/فحص قريبة' : 'Due for Moroor renewals'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel color="gray.500" fontSize="xs">
                {currentLanguage === 'ar' ? 'الأجهزة والتقنية' : 'IT & Hardware'}
              </StatLabel>
              <StatNumber fontSize="2xl" color="teal.600">
                {assetStats?.itCount || 0}
              </StatNumber>
              <StatHelpText fontSize="xs">
                {currentLanguage === 'ar' ? 'لابتوبات، شاشات وملحقات' : 'Laptops, displays & accessories'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Tabs */}
      <Tabs colorScheme="blue" variant="enclosed" bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} p={4}>
        <TabList mb={4} flexWrap="wrap">
          <Tab fontWeight="bold" fontSize="sm">
            <HStack spacing={2}>
              <Icon as={FiLayers} />
              <Text>{currentLanguage === 'ar' ? 'دليل الأصول' : 'Asset Catalog'}</Text>
              <Badge colorScheme="blue">{assets?.length || 0}</Badge>
            </HStack>
          </Tab>

          <Tab fontWeight="bold" fontSize="sm">
            <HStack spacing={2}>
              <Icon as={FiUserCheck} />
              <Text>{currentLanguage === 'ar' ? 'العهد المسلمة للموظفين' : 'Employee Custody'}</Text>
              <Badge colorScheme="green">{assetStats?.assignedCount || 0}</Badge>
            </HStack>
          </Tab>

          <Tab fontWeight="bold" fontSize="sm">
            <HStack spacing={2}>
              <Icon as={FiTruck} />
              <Text>{currentLanguage === 'ar' ? 'أسطول المركبات' : 'Fleet & Vehicles'}</Text>
              <Badge colorScheme="purple">{assetStats?.vehiclesCount || 0}</Badge>
            </HStack>
          </Tab>

          <Tab fontWeight="bold" fontSize="sm">
            <HStack spacing={2}>
              <Icon as={FiBell} />
              <Text>{currentLanguage === 'ar' ? 'تنبيهات المسؤولين' : 'Stakeholder Alerts'}</Text>
              {notifications && notifications.length > 0 && (
                <Badge colorScheme="red">{notifications.filter((n) => !n.is_read).length}</Badge>
              )}
            </HStack>
          </Tab>

          <Tab fontWeight="bold" fontSize="sm">
            <HStack spacing={2}>
              <Icon as={FaWhatsapp} color="whatsapp.500" />
              <Text>{currentLanguage === 'ar' ? 'موافقات واستلام الواتساب' : 'WhatsApp Approvals & Bot'}</Text>
              {approvalRequests && approvalRequests.filter((r) => r.status === 'pending').length > 0 && (
                <Badge colorScheme="orange">
                  {approvalRequests.filter((r) => r.status === 'pending').length}
                </Badge>
              )}
            </HStack>
          </Tab>

          <Tab fontWeight="bold" fontSize="sm">
            <HStack spacing={2}>
              <Icon as={FiCamera} color="teal.500" />
              <Text>{currentLanguage === 'ar' ? 'الجرد والتدقيق الذاتي' : 'Self-Audits & Log'}</Text>
              {assetAudits && assetAudits.length > 0 && (
                <Badge colorScheme="teal">{assetAudits.length}</Badge>
              )}
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* TAB 1: Asset Catalog */}
          <TabPanel px={0}>
            {/* Filter controls */}
            <Flex direction={{ base: 'column', md: 'row' }} gap={3} mb={4} justify="space-between">
              <HStack spacing={3} flex="1">
                <Input
                  placeholder={currentLanguage === 'ar' ? 'بحث باسم الأصل، الكود، الرقم التسلسلي...' : 'Search by name, tag, S/N...'}
                  size="sm"
                  maxW="300px"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select
                  size="sm"
                  maxW="200px"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">{currentLanguage === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</option>
                  {ASSET_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {currentLanguage === 'ar' ? c.labelAr : c.labelEn}
                    </option>
                  ))}
                </Select>
                <Select
                  size="sm"
                  maxW="160px"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">{currentLanguage === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
                  <option value="available">{currentLanguage === 'ar' ? 'متاح' : 'Available'}</option>
                  <option value="assigned_custody">{currentLanguage === 'ar' ? 'في العهدة' : 'Assigned'}</option>
                  <option value="under_maintenance">{currentLanguage === 'ar' ? 'تحت الصيانة' : 'Maintenance'}</option>
                </Select>
              </HStack>
            </Flex>

            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead bg={subBg}>
                  <Tr>
                    <Th>{currentLanguage === 'ar' ? 'رمز الأصل' : 'Asset Tag'}</Th>
                    <Th>{currentLanguage === 'ar' ? 'اسم الأصل' : 'Asset Name'}</Th>
                    <Th>{currentLanguage === 'ar' ? 'التصنيف' : 'Category'}</Th>
                    <Th>{currentLanguage === 'ar' ? 'الموديل / الرقم التسلسلي' : 'Brand / Model / S/N'}</Th>
                    <Th>{currentLanguage === 'ar' ? 'الموقع' : 'Location'}</Th>
                    <Th>{currentLanguage === 'ar' ? 'الحالة' : 'Status'}</Th>
                    <Th>{currentLanguage === 'ar' ? 'حامل العهدة' : 'Current Holder'}</Th>
                    <Th textAlign="center">{currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredAssets.length === 0 ? (
                    <Tr>
                      <Td colSpan={8} textAlign="center" py={8} color="gray.500">
                        {currentLanguage === 'ar' ? 'لا توجد أصول مطابقة للبحث' : 'No assets found'}
                      </Td>
                    </Tr>
                  ) : (
                    filteredAssets.map((asset) => (
                      <Tr key={asset._id}>
                        <Td fontWeight="bold" fontFamily="mono" color="blue.600">
                          {asset.asset_tag}
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">{asset.asset_name}</Text>
                            {asset.asset_name_arabic && (
                              <Text fontSize="2xs" color="gray.500">{asset.asset_name_arabic}</Text>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <Badge fontSize="2xs" colorScheme="gray">
                            {asset.category.replace('_', ' ')}
                          </Badge>
                        </Td>
                        <Td fontSize="xs">
                          {asset.brand} {asset.model}
                          {asset.serial_number && (
                            <Text fontSize="2xs" color="gray.500" fontFamily="mono">
                              S/N: {asset.serial_number}
                            </Text>
                          )}
                        </Td>
                        <Td fontSize="xs">{asset.physical_location}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              asset.status === 'assigned_custody'
                                ? 'green'
                                : asset.status === 'pending_handover_acceptance'
                                ? 'orange'
                                : asset.status === 'available'
                                ? 'blue'
                                : 'purple'
                            }
                            fontSize="2xs"
                          >
                            {asset.status === 'assigned_custody'
                              ? currentLanguage === 'ar' ? 'في العهدة' : 'In Custody'
                              : asset.status === 'pending_handover_acceptance'
                              ? currentLanguage === 'ar' ? 'بانتظار قبول الواتساب' : 'Pending WhatsApp'
                              : asset.status === 'available'
                              ? currentLanguage === 'ar' ? 'متاح' : 'Available'
                              : currentLanguage === 'ar' ? 'صيانة' : 'Maintenance'}
                          </Badge>
                        </Td>
                        <Td>
                          {asset.holder_name ? (
                            <HStack spacing={2}>
                              <Avatar size="2xs" name={asset.holder_name} />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs" fontWeight="medium">{asset.holder_name}</Text>
                                <Text fontSize="2xs" color="gray.500">{asset.holder_department || asset.holder_employee_number}</Text>
                              </VStack>
                            </HStack>
                          ) : (
                            <Text fontSize="xs" color="gray.400">-</Text>
                          )}
                        </Td>
                        <Td textAlign="center">
                          <HStack spacing={1} justify="center">
                            {asset.status === 'available' ? (
                              <Button
                                size="xs"
                                colorScheme="green"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAssetForAction(asset);
                                  onAssignOpen();
                                }}
                              >
                                {currentLanguage === 'ar' ? 'تسليم عهدة' : 'Assign'}
                              </Button>
                            ) : asset.status === 'pending_handover_acceptance' ? (
                              <Badge colorScheme="orange" fontSize="2xs" px={2} py={1}>
                                <HStack spacing={1}>
                                  <Icon as={FaWhatsapp} />
                                  <Text>{currentLanguage === 'ar' ? 'قيد الموافقة' : 'Pending Sign-off'}</Text>
                                </HStack>
                              </Badge>
                            ) : asset.status === 'assigned_custody' ? (
                              <Button
                                size="xs"
                                colorScheme="orange"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAssetForAction(asset);
                                  onReturnOpen();
                                }}
                              >
                                {currentLanguage === 'ar' ? 'استرداد' : 'Return'}
                              </Button>
                            ) : null}

                            <Tooltip label={currentLanguage === 'ar' ? 'ملصق الباركود QR' : 'QR Label Sticker'}>
                              <IconButton
                                aria-label="QR Sticker"
                                icon={<FaQrcode />}
                                size="xs"
                                colorScheme="purple"
                                variant="ghost"
                                onClick={() => handleOpenQrSticker(asset)}
                              />
                            </Tooltip>

                            <Tooltip label={currentLanguage === 'ar' ? 'فحص وتدقيق ذاتي' : 'Self-Audit'}>
                              <IconButton
                                aria-label="Self-Audit"
                                icon={<FiCamera />}
                                size="xs"
                                colorScheme="teal"
                                variant="ghost"
                                onClick={() => handleOpenSelfAudit(asset)}
                              />
                            </Tooltip>

                            <IconButton
                              aria-label="Maintenance"
                              icon={<FiTool />}
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                setSelectedAssetForAction(asset);
                                onMaintenanceOpen();
                              }}
                            />
                            {asset.status === 'assigned_custody' && (
                              <IconButton
                                aria-label="Print Slip"
                                icon={<FiPrinter />}
                                size="xs"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedAssetForAction(asset);
                                  onPrintSlipOpen();
                                }}
                              />
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>

          {/* TAB 2: Employee Custody */}
          <TabPanel px={0}>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color="gray.500">
                {currentLanguage === 'ar'
                  ? 'عرض الأصول المسلمة كعهدة شخصية لكل موظف ونماذج إخلاء الطرف الرسمية'
                  : 'View assets currently held under employee custody and generate handover / clearance slips'}
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {employees?.map((emp) => {
                  const held = assets?.filter((a) => a.current_holder_employee_id === emp._id) || [];
                  return (
                    <Card key={emp._id} borderWidth="1px" borderColor={borderColor} bg={cardBg}>
                      <CardBody>
                        <HStack justify="space-between" mb={3}>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={`${emp.first_name} ${emp.last_name}`} />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="sm">
                                {emp.first_name} {emp.last_name}
                              </Text>
                              <Text fontSize="2xs" color="gray.500">
                                {emp.employee_number} • {emp.job_title}
                              </Text>
                            </VStack>
                          </HStack>
                          <Badge colorScheme={held.length > 0 ? 'blue' : 'gray'}>
                            {held.length} {currentLanguage === 'ar' ? 'أصل' : 'Assets'}
                          </Badge>
                        </HStack>

                        <Divider mb={3} />

                        {held.length === 0 ? (
                          <Text fontSize="xs" color="gray.400" py={2}>
                            {currentLanguage === 'ar' ? 'لا توجد عهد مسجلة بحوزة هذا الموظف' : 'No assets currently in custody'}
                          </Text>
                        ) : (
                          <VStack align="stretch" spacing={2}>
                            {held.map((item) => (
                              <Flex
                                key={item._id}
                                justify="space-between"
                                align="center"
                                p={2}
                                bg={subBg}
                                borderRadius="md"
                                fontSize="xs"
                              >
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium">{item.asset_name}</Text>
                                  <Text fontSize="2xs" color="gray.500" fontFamily="mono">
                                    {item.asset_tag}
                                  </Text>
                                </VStack>
                                <HStack spacing={1}>
                                  <IconButton
                                    aria-label="Return"
                                    icon={<FiRefreshCw />}
                                    size="xs"
                                    colorScheme="orange"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedAssetForAction(item);
                                      onReturnOpen();
                                    }}
                                  />
                                  <IconButton
                                    aria-label="Print Slip"
                                    icon={<FiPrinter />}
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedAssetForAction(item);
                                      onPrintSlipOpen();
                                    }}
                                  />
                                </HStack>
                              </Flex>
                            ))}
                          </VStack>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </VStack>
          </TabPanel>

          {/* TAB 3: Fleet & Vehicles */}
          <TabPanel px={0}>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color="gray.500">
                {currentLanguage === 'ar'
                  ? 'متابعة صلاحيات الاستمارة، الفحص الدوري، وتأمين أسطول المركبات طبقاً لمتطلبات المرور'
                  : 'Track vehicle registrations (Istimara), technical inspections (Fahas), and vehicle insurance compliance'}
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {assets?.filter((a) => a.category === 'vehicles_fleet').map((v) => {
                  const details = v.vehicle_details;
                  return (
                    <Card key={v._id} borderWidth="1px" borderColor={borderColor} bg={cardBg}>
                      <CardBody>
                        <HStack justify="space-between" mb={2}>
                          <HStack spacing={2}>
                            <Icon as={FiTruck} boxSize={5} color="purple.600" />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold">{v.asset_name}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {v.brand} {v.model}
                              </Text>
                            </VStack>
                          </HStack>
                          <Badge colorScheme="purple" fontSize="xs" px={2} py={1}>
                            {details?.plate_number || 'No Plate'}
                          </Badge>
                        </HStack>

                        <Divider my={2} />

                        <VStack align="stretch" spacing={2} fontSize="xs">
                          <HStack justify="space-between">
                            <Text color="gray.500">{currentLanguage === 'ar' ? 'السائق الحالي:' : 'Current Driver:'}</Text>
                            <Text fontWeight="medium">{v.holder_name || (currentLanguage === 'ar' ? 'غير مسند' : 'Unassigned')}</Text>
                          </HStack>

                          <HStack justify="space-between">
                            <Text color="gray.500">{currentLanguage === 'ar' ? 'انتهاء الاستمارة:' : 'Istimara Expiry:'}</Text>
                            <Badge
                              colorScheme={
                                v.vehicleCompliance && v.vehicleCompliance.istimaraDays <= 30
                                  ? 'red'
                                  : 'green'
                              }
                            >
                              {details?.istimara_expiry || 'Not set'}
                            </Badge>
                          </HStack>

                          <HStack justify="space-between">
                            <Text color="gray.500">{currentLanguage === 'ar' ? 'الفحص الدوري (فحص):' : 'Fahas Expiry:'}</Text>
                            <Badge
                              colorScheme={
                                v.vehicleCompliance && v.vehicleCompliance.fahasDays <= 14
                                  ? 'red'
                                  : 'green'
                              }
                            >
                              {details?.fahas_expiry || 'Not set'}
                            </Badge>
                          </HStack>

                          <HStack justify="space-between">
                            <Text color="gray.500">{currentLanguage === 'ar' ? 'تأمين المركبة:' : 'Insurance Expiry:'}</Text>
                            <Text>{details?.insurance_expiry || 'Not set'}</Text>
                          </HStack>

                          {details?.fuel_card_number && (
                            <HStack justify="space-between">
                              <Text color="gray.500">{currentLanguage === 'ar' ? 'بطاقة الوقود:' : 'Fuel Card:'}</Text>
                              <Text fontFamily="mono">{details.fuel_card_number}</Text>
                            </HStack>
                          )}
                        </VStack>

                        <HStack mt={4} justify="flex-end">
                          <Button
                            size="xs"
                            leftIcon={<FiTool />}
                            variant="outline"
                            onClick={() => {
                              setSelectedAssetForAction(v);
                              onMaintenanceOpen();
                            }}
                          >
                            {currentLanguage === 'ar' ? 'تسجيل صيانة / زيت' : 'Log Maintenance'}
                          </Button>
                        </HStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </VStack>
          </TabPanel>

          {/* TAB 4: Stakeholder Alerts */}
          <TabPanel px={0}>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">
                  {currentLanguage === 'ar'
                    ? 'التنبيهات الموجهة إلى المسؤولين عن الإقامات، الجوازات، الأسطول، والتجهيزات'
                    : 'Targeted alerts dispatched to specific stakeholders (GRO Officer, Fleet Manager, IT Admin)'}
                </Text>
              </HStack>

              {notifications?.length === 0 ? (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  {currentLanguage === 'ar'
                    ? 'لا توجد تنبيهات عاجلة. جميع الوثائق والعهد في حالة ممتازة.'
                    : 'No pending alerts. All documents and assets are compliant.'}
                </Alert>
              ) : (
                notifications?.map((notif) => (
                  <Card
                    key={notif._id}
                    borderWidth="1px"
                    borderColor={notif.urgency === 'critical' ? 'red.300' : borderColor}
                    bg={cardBg}
                  >
                    <CardBody py={3}>
                      <Flex justify="space-between" align="center">
                        <HStack spacing={3}>
                          <Icon
                            as={notif.urgency === 'critical' ? FiAlertTriangle : FiBell}
                            color={notif.urgency === 'critical' ? 'red.500' : 'blue.500'}
                            boxSize={5}
                          />
                          <VStack align="start" spacing={0}>
                            <HStack spacing={2}>
                              <Text fontWeight="bold" fontSize="sm">
                                {currentLanguage === 'ar' ? notif.title_arabic : notif.title}
                              </Text>
                              <Badge colorScheme={notif.urgency === 'critical' ? 'red' : 'orange'} fontSize="2xs">
                                {notif.target_role.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.600">
                              {currentLanguage === 'ar' ? notif.message_arabic : notif.message}
                            </Text>
                          </VStack>
                        </HStack>

                        <HStack spacing={2}>
                          {!notif.is_read && (
                            <Button
                              size="xs"
                              leftIcon={<FiCheck />}
                              variant="ghost"
                              onClick={() => markNotificationReadMutation({ notification_id: notif._id })}
                            >
                              {currentLanguage === 'ar' ? 'تم الاطلاع' : 'Mark Read'}
                            </Button>
                          )}
                        </HStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))
              )}
            </VStack>
          </TabPanel>

          {/* TAB 5: WhatsApp Approvals & Bot */}
          <TabPanel px={0}>
            <VStack align="stretch" spacing={4}>
              <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={2}>
                <VStack align="start" spacing={0}>
                  <HStack spacing={2}>
                    <Icon as={FaWhatsapp} color="whatsapp.500" boxSize={5} />
                    <Heading size="sm" color="whatsapp.600">
                      {currentLanguage === 'ar' ? 'سجل موافقات وتأكيدات الواتساب' : 'WhatsApp Approval & Acceptance Queue'}
                    </Heading>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {currentLanguage === 'ar'
                      ? 'متابعة إشعارات تسليم العهد للموظفين، تأكيدات الاستلام، وموافقات الإدارة عبر البوت'
                      : 'Track custody handover requests sent to employee WhatsApp, sign-off confirmations, and management bot approvals'}
                  </Text>
                </VStack>

                <Badge colorScheme="whatsapp" px={3} py={1} borderRadius="full" fontSize="xs">
                  {approvers?.length || 0} {currentLanguage === 'ar' ? 'مسؤول معتمد مسجل' : 'Configured Approvers'}
                </Badge>
              </Flex>

              {/* Approval Requests List */}
              {(!approvalRequests || approvalRequests.length === 0) ? (
                <Alert status="info" borderRadius="md" fontSize="xs">
                  <AlertIcon />
                  {currentLanguage === 'ar'
                    ? 'لا توجد طلبات موافقة أو استلام عبر الواتساب حالياً.'
                    : 'No WhatsApp approval or custody acceptance requests on record yet.'}
                </Alert>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {approvalRequests
                    .filter((r) => r.request_type === 'asset_custody_acceptance' || r.request_type === 'asset_disposal')
                    .map((req) => (
                      <Box
                        key={req._id}
                        p={4}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={req.status === 'pending' ? 'orange.300' : borderColor}
                        bg={req.status === 'pending' ? useColorModeValue('orange.50', 'gray.800') : subBg}
                      >
                        <Flex justify="space-between" align="start">
                          <HStack spacing={3}>
                            <Icon as={FaWhatsapp} color="whatsapp.500" boxSize={6} />
                            <Box>
                              <HStack spacing={2}>
                                <Text fontWeight="bold" fontSize="sm">
                                  {req.request_type === 'asset_custody_acceptance' ? '📦 Custody Acceptance (إقرار استلام عهدة)' : '🗑️ Asset Disposal (استبعاد أصل)'}
                                </Text>
                                <Badge
                                  colorScheme={
                                    req.status === 'approved'
                                      ? 'green'
                                      : req.status === 'rejected'
                                      ? 'red'
                                      : 'orange'
                                  }
                                  fontSize="2xs"
                                >
                                  {req.status === 'approved'
                                    ? currentLanguage === 'ar' ? 'مقبول عبر واتساب' : 'Accepted via WhatsApp'
                                    : req.status === 'rejected'
                                    ? currentLanguage === 'ar' ? 'مرفوض' : 'Rejected'
                                    : currentLanguage === 'ar' ? 'بانتظار رد الموظف' : 'Pending Employee Reply'}
                                </Badge>
                              </HStack>
                              <Text fontSize="xs" color="gray.500">
                                Ref: #{req.reference_id} • Target: {req.approver_name} ({req.approver_phone})
                              </Text>
                            </Box>
                          </HStack>
                          <Text fontSize="xs" color="gray.400">
                            {new Date(req.sent_at).toLocaleDateString()} {new Date(req.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </Flex>

                        <Box
                          mt={3}
                          p={3}
                          bg={useColorModeValue('white', 'gray.900')}
                          borderRadius="md"
                          fontSize="xs"
                          whiteSpace="pre-wrap"
                          fontFamily="mono"
                          borderWidth="1px"
                        >
                          {req.summary_text}
                        </Box>

                        {/* Interactive WhatsApp Ping Link & Simulation */}
                        <HStack spacing={3} mt={3} justify="flex-end">
                          <Button
                            as="a"
                            href={`https://wa.me/${req.approver_phone.replace('+', '')}?text=${encodeURIComponent(
                              req.summary_text +
                                `\n\nReply:\n[Approve] or [1] to accept custody\n[Reject] or [2] to reject\nVerification Token: ${req.verification_token}`
                            )}`}
                            target="_blank"
                            size="xs"
                            leftIcon={<FaWhatsapp />}
                            colorScheme="whatsapp"
                            variant="outline"
                          >
                            {currentLanguage === 'ar' ? 'إرسال تنبيه عبر واتساب' : 'Open in WhatsApp'}
                          </Button>

                          {req.status === 'pending' && (
                            <>
                              <Button
                                size="xs"
                                leftIcon={<FiCheck />}
                                colorScheme="green"
                                onClick={() => handleSimulateWhatsAppDecision(req.verification_token, 'approved')}
                              >
                                {currentLanguage === 'ar' ? 'محاكاة قبول الاستلام' : 'Simulate Acceptance'}
                              </Button>
                              <Button
                                size="xs"
                                leftIcon={<FiXCircle />}
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleSimulateWhatsAppDecision(req.verification_token, 'rejected')}
                              >
                                {currentLanguage === 'ar' ? 'محاكاة الرفض' : 'Simulate Rejection'}
                              </Button>
                            </>
                          )}
                        </HStack>
                      </Box>
                    ))}
                </VStack>
              )}
            </VStack>
          </TabPanel>

          {/* TAB 6: Employee Self-Audits & Physical Verification Log */}
          <TabPanel px={0}>
            <VStack align="stretch" spacing={4}>
              <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={2}>
                <VStack align="start" spacing={0}>
                  <HStack spacing={2}>
                    <Icon as={FiCamera} color="teal.500" boxSize={5} />
                    <Heading size="sm" color="teal.600">
                      {currentLanguage === 'ar' ? 'سجل التدقيق والفحص الذاتي للأصول' : 'Employee Self-Audit & Physical Attestation Log'}
                    </Heading>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {currentLanguage === 'ar'
                      ? 'نتائج فحص العهد المنجزة ذاتياً من الموظفين عبر فحص الباركود، تقييم الحالة التشغيلية، والصور الحية'
                      : 'Physical audit logs completed directly by employee asset holders via QR scanning, condition rating, and live photos'}
                  </Text>
                </VStack>

                <HStack spacing={2}>
                  <Badge colorScheme="teal" px={3} py={1} borderRadius="full" fontSize="xs">
                    {assetAudits?.length || 0} {currentLanguage === 'ar' ? 'عملية فحص مسجلة' : 'Recorded Audits'}
                  </Badge>
                </HStack>
              </Flex>

              {(!assetAudits || assetAudits.length === 0) ? (
                <Alert status="info" borderRadius="md" fontSize="xs">
                  <AlertIcon />
                  {currentLanguage === 'ar'
                    ? 'لم يتم إجراء أي فحص ذاتي حتى الآن. يمكن للموظفين فحص العهدة بالنقر على أيقونة الكاميرا في جدول الأصول.'
                    : 'No self-audits recorded yet. Employees can perform self-audits by clicking the Camera icon on their asset row.'}
                </Alert>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {assetAudits.map((audit) => (
                    <Card
                      key={audit._id}
                      borderWidth="1px"
                      borderColor={
                        audit.verification_status === 'flagged_discrepancy'
                          ? 'red.300'
                          : audit.verification_status === 'approved'
                          ? 'green.300'
                          : borderColor
                      }
                      bg={cardBg}
                    >
                      <CardBody py={4}>
                        <Flex justify="space-between" align="start" wrap="wrap" gap={3}>
                          <HStack spacing={3} align="start">
                            <Icon
                              as={audit.verification_status === 'flagged_discrepancy' ? FiAlertTriangle : FiCheckCircle}
                              color={audit.verification_status === 'flagged_discrepancy' ? 'red.500' : 'teal.500'}
                              boxSize={6}
                              mt={1}
                            />
                            <VStack align="start" spacing={1}>
                              <HStack spacing={2} wrap="wrap">
                                <Text fontWeight="bold" fontSize="sm">
                                  {audit.asset_tag} — {audit.asset_name}
                                </Text>
                                <Badge
                                  colorScheme={
                                    audit.verification_status === 'approved'
                                      ? 'green'
                                      : audit.verification_status === 'flagged_discrepancy'
                                      ? 'red'
                                      : 'blue'
                                  }
                                  fontSize="2xs"
                                >
                                  {audit.verification_status.toUpperCase()}
                                </Badge>
                                <Badge colorScheme="purple" fontSize="2xs">
                                  {audit.reported_condition.replace('_', ' ').toUpperCase()}
                                </Badge>
                                {audit.qr_scanned_verified && (
                                  <Badge colorScheme="green" fontSize="2xs">
                                    ✓ QR VERIFIED
                                  </Badge>
                                )}
                              </HStack>

                              <Text fontSize="xs" color="gray.600">
                                Audited by: <Text as="span" fontWeight="medium">{audit.employee_name}</Text> • Date: {audit.audit_date}
                              </Text>

                              {audit.notes && (
                                <Text fontSize="xs" color="gray.700" bg={subBg} p={2} borderRadius="sm" mt={1}>
                                  Note: "{audit.notes}"
                                </Text>
                              )}

                              {/* Photo Previews */}
                              {audit.photos && audit.photos.length > 0 && (
                                <HStack spacing={2} mt={2}>
                                  {audit.photos.map((photo, i) => (
                                    <Box
                                      key={i}
                                      as="img"
                                      src={photo}
                                      alt={`Audit photo ${i + 1}`}
                                      boxSize="60px"
                                      objectFit="cover"
                                      borderRadius="md"
                                      borderWidth="1px"
                                      borderColor="gray.200"
                                      cursor="pointer"
                                      onClick={() => window.open(photo, '_blank')}
                                    />
                                  ))}
                                </HStack>
                              )}
                            </VStack>
                          </HStack>

                          {/* Review Actions */}
                          <HStack spacing={2}>
                            {audit.verification_status === 'submitted' && (
                              <>
                                <Button
                                  size="xs"
                                  colorScheme="green"
                                  leftIcon={<FiCheck />}
                                  onClick={() =>
                                    reviewAssetAuditMutation({
                                      audit_id: audit._id,
                                      decision: 'approved',
                                      reviewed_by: user?.email || 'admin',
                                    })
                                  }
                                >
                                  Accept & Verify
                                </Button>
                                <Button
                                  size="xs"
                                  colorScheme="red"
                                  variant="outline"
                                  leftIcon={<FiAlertTriangle />}
                                  onClick={() =>
                                    reviewAssetAuditMutation({
                                      audit_id: audit._id,
                                      decision: 'flagged_discrepancy',
                                      reviewed_by: user?.email || 'admin',
                                    })
                                  }
                                >
                                  Flag Discrepancy
                                </Button>
                              </>
                            )}
                          </HStack>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* MODAL 1: Register New Asset */}
      <Modal isOpen={isAddAssetOpen} onClose={onAddAssetClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>
            {currentLanguage === 'ar' ? '+ تسجيل أصل جديد' : '+ Register New Asset'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'اسم الأصل (إنجليزي)' : 'Asset Name (En)'}</FormLabel>
                  <Input
                    size="sm"
                    value={newAssetForm.name}
                    onChange={(e) => setNewAssetForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Dell Latitude 5540"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'اسم الأصل (عربي)' : 'Asset Name (Ar)'}</FormLabel>
                  <Input
                    size="sm"
                    value={newAssetForm.nameArabic}
                    onChange={(e) => setNewAssetForm((p) => ({ ...p, nameArabic: e.target.value }))}
                    placeholder="مثال: لابتوب ديل 5540"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'التصنيف' : 'Category'}</FormLabel>
                  <Select
                    size="sm"
                    value={newAssetForm.category}
                    onChange={(e) => setNewAssetForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {currentLanguage === 'ar' ? c.labelAr : c.labelEn}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'العلامة التجارية / الماركة' : 'Brand'}</FormLabel>
                  <Input
                    size="sm"
                    value={newAssetForm.brand}
                    onChange={(e) => setNewAssetForm((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="e.g. Dell / Toyota / Apple"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'الموديل' : 'Model'}</FormLabel>
                  <Input
                    size="sm"
                    value={newAssetForm.model}
                    onChange={(e) => setNewAssetForm((p) => ({ ...p, model: e.target.value }))}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'الرقم التسلسلي (S/N)' : 'Serial Number'}</FormLabel>
                  <Input
                    size="sm"
                    value={newAssetForm.serialNumber}
                    onChange={(e) => setNewAssetForm((p) => ({ ...p, serialNumber: e.target.value }))}
                  />
                </FormControl>
              </SimpleGrid>

              {/* Special Vehicle Fields */}
              {newAssetForm.category === 'vehicles_fleet' && (
                <Box p={3} bg="purple.50" borderRadius="md" borderWidth="1px" borderColor="purple.200">
                  <Heading size="xs" color="purple.700" mb={3}>
                    {currentLanguage === 'ar' ? 'بيانات رخصة وتأمين المركبة (المرور)' : 'Vehicle Registration & Moroor Compliance'}
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                    <FormControl isRequired>
                      <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'رقم اللوحة' : 'Plate Number'}</FormLabel>
                      <Input
                        size="sm"
                        placeholder="e.g. ABC 1234"
                        value={newAssetForm.plateNumber}
                        onChange={(e) => setNewAssetForm((p) => ({ ...p, plateNumber: e.target.value }))}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'انتهاء الاستمارة' : 'Istimara Expiry'}</FormLabel>
                      <Input
                        size="sm"
                        type="date"
                        value={newAssetForm.istimaraExpiry}
                        onChange={(e) => setNewAssetForm((p) => ({ ...p, istimaraExpiry: e.target.value }))}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <FormControl isRequired>
                      <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'انتهاء الفحص الدوري' : 'Fahas Expiry'}</FormLabel>
                      <Input
                        size="sm"
                        type="date"
                        value={newAssetForm.fahasExpiry}
                        onChange={(e) => setNewAssetForm((p) => ({ ...p, fahasExpiry: e.target.value }))}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'انتهاء تأمين المركبة' : 'Insurance Expiry'}</FormLabel>
                      <Input
                        size="sm"
                        type="date"
                        value={newAssetForm.insuranceExpiry}
                        onChange={(e) => setNewAssetForm((p) => ({ ...p, insuranceExpiry: e.target.value }))}
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>
              )}

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'تكلفة الشراء (ريال)' : 'Purchase Cost (SAR)'}</FormLabel>
                  <NumberInput
                    size="sm"
                    value={newAssetForm.purchaseCost}
                    onChange={(_, val) => setNewAssetForm((p) => ({ ...p, purchaseCost: val || 0 }))}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'الموقع الفعلي' : 'Location'}</FormLabel>
                  <Input
                    size="sm"
                    value={newAssetForm.physicalLocation}
                    onChange={(e) => setNewAssetForm((p) => ({ ...p, physicalLocation: e.target.value }))}
                  />
                </FormControl>
              </SimpleGrid>

              {/* Immediate Assignment Option */}
              <FormControl>
                <FormLabel fontSize="xs">
                  {currentLanguage === 'ar' ? 'تسليم العهدة فوراً إلى موظف (اختياري)' : 'Assign directly to Employee (Optional)'}
                </FormLabel>
                <Select
                  size="sm"
                  value={newAssetForm.assignedEmployeeId}
                  onChange={(e) => setNewAssetForm((p) => ({ ...p, assignedEmployeeId: e.target.value }))}
                >
                  <option value="">-- {currentLanguage === 'ar' ? 'بدون تسليم (بالمستودع)' : 'Unassigned (In Storage)'} --</option>
                  {employees?.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.employee_number} - {emp.first_name} {emp.last_name} ({emp.job_title})
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" mr={3} onClick={onAddAssetClose}>
              {currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button size="sm" colorScheme="blue" onClick={handleCreateAsset}>
              {currentLanguage === 'ar' ? 'حفظ الأصل' : 'Save Asset'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL 2: Assign Custody */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="md">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>
            {currentLanguage === 'ar' ? 'تسليم عهدة أصل' : 'Assign Asset Custody'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Alert status="info" fontSize="xs" borderRadius="md">
                <AlertIcon />
                {selectedAssetForAction?.asset_tag}: {selectedAssetForAction?.asset_name}
              </Alert>

              <FormControl isRequired>
                <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'الموظف المستلم' : 'Receiving Employee'}</FormLabel>
                <Select
                  size="sm"
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm((p) => ({ ...p, employeeId: e.target.value }))}
                >
                  <option value="">-- Select Employee --</option>
                  {employees?.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.employee_number} - {emp.first_name} {emp.last_name} ({emp.job_title})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'حالة الأصل عند التسليم' : 'Condition at Handover'}</FormLabel>
                <Select
                  size="sm"
                  value={assignForm.condition}
                  onChange={(e) => setAssignForm((p) => ({ ...p, condition: e.target.value }))}
                >
                  <option value="new">New (جديد)</option>
                  <option value="excellent">Excellent (ممتاز)</option>
                  <option value="good">Good (جيد)</option>
                  <option value="fair">Fair (مقبول)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'ملاحظات التسليم' : 'Handover Notes'}</FormLabel>
                <Textarea
                  size="sm"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Includes charger, case, accessories..."
                />
              </FormControl>

              <Box p={3} bg="whatsapp.50" borderWidth="1px" borderColor="whatsapp.200" borderRadius="md">
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Icon as={FaWhatsapp} color="whatsapp.500" />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" fontWeight="bold" color="whatsapp.800">
                        {currentLanguage === 'ar' ? 'إرسال طلب استلام وقبول عبر الواتساب' : 'Dispatch WhatsApp Acceptance Ping'}
                      </Text>
                      <Text fontSize="2xs" color="gray.600">
                        {currentLanguage === 'ar'
                          ? 'يتلقى الموظف رسالة واتساب آلية للتأكيد وقبول المسؤولية الرسمية عن العهدة'
                          : 'Employee receives interactive WhatsApp message to sign off and accept custody'}
                      </Text>
                    </VStack>
                  </HStack>
                  <Switch
                    colorScheme="whatsapp"
                    isChecked={assignForm.requireWhatsApp}
                    onChange={(e) => setAssignForm((p) => ({ ...p, requireWhatsApp: e.target.checked }))}
                  />
                </Flex>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" mr={3} onClick={onAssignClose}>
              Cancel
            </Button>
            <Button size="sm" colorScheme="green" leftIcon={<FaWhatsapp />} onClick={handleAssignCustody}>
              {assignForm.requireWhatsApp
                ? (currentLanguage === 'ar' ? 'تسليم وإرسال عبر الواتساب' : 'Handover & Send WhatsApp Ping')
                : (currentLanguage === 'ar' ? 'تسليم فوري مباشر' : 'Confirm Immediate Handover')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL 3: Return Custody */}
      <Modal isOpen={isReturnOpen} onClose={onReturnClose} size="md">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>
            {currentLanguage === 'ar' ? 'استرداد عهدة وفحص' : 'Return Asset Custody'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Alert status="warning" fontSize="xs" borderRadius="md">
                <AlertIcon />
                Returning {selectedAssetForAction?.asset_tag} from {selectedAssetForAction?.holder_name}
              </Alert>

              <FormControl isRequired>
                <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'الحالة بعد الفحص والاستلام' : 'Inspected Condition at Return'}</FormLabel>
                <Select
                  size="sm"
                  value={returnForm.condition}
                  onChange={(e) => setReturnForm((p) => ({ ...p, condition: e.target.value }))}
                >
                  <option value="good">Good / Functional (سليم وصالح)</option>
                  <option value="damaged">Damaged / Needs Repair (تالف / يتطلب إصلاح)</option>
                  <option value="lost">Lost / Missing (مفقود)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'تقرير الفحص وملاحظات الاستلام' : 'Inspection Report Notes'}</FormLabel>
                <Textarea
                  size="sm"
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Inspected by IT/Fleet manager, condition details..."
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" mr={3} onClick={onReturnClose}>
              Cancel
            </Button>
            <Button size="sm" colorScheme="orange" onClick={handleReturnCustody}>
              Confirm Return
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL 4: Record Maintenance */}
      <Modal isOpen={isMaintenanceOpen} onClose={onMaintenanceOpen} size="md">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>
            {currentLanguage === 'ar' ? 'تسجيل صيانة أو إصلاح' : 'Log Maintenance & Service'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Text fontSize="xs" color="gray.500">
                Asset: {selectedAssetForAction?.asset_tag} ({selectedAssetForAction?.asset_name})
              </Text>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Service Type</FormLabel>
                <Select
                  size="sm"
                  value={maintForm.serviceType}
                  onChange={(e) => setMaintForm((p) => ({ ...p, serviceType: e.target.value }))}
                >
                  <option value="routine_inspection">Routine Inspection / فحص دوري</option>
                  <option value="preventative">Preventative Service / صيانة وقائية</option>
                  <option value="repair">Hardware Repair / إصلاح أعطال</option>
                  <option value="accident_damage">Accident Damage / صيانة حادث</option>
                </Select>
              </FormControl>

              <SimpleGrid columns={2} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs">Cost (SAR)</FormLabel>
                  <NumberInput
                    size="sm"
                    value={maintForm.cost}
                    onChange={(_, val) => setMaintForm((p) => ({ ...p, cost: val || 0 }))}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Workshop / Vendor</FormLabel>
                  <Input
                    size="sm"
                    value={maintForm.serviceProvider}
                    onChange={(e) => setMaintForm((p) => ({ ...p, serviceProvider: e.target.value }))}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="xs">Next Service Due (Date)</FormLabel>
                <Input
                  size="sm"
                  type="date"
                  value={maintForm.nextDueDate}
                  onChange={(e) => setMaintForm((p) => ({ ...p, nextDueDate: e.target.value }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs">Notes</FormLabel>
                <Textarea
                  size="sm"
                  value={maintForm.notes}
                  onChange={(e) => setMaintForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" mr={3} onClick={onMaintenanceClose}>
              Cancel
            </Button>
            <Button size="sm" colorScheme="blue" onClick={handleRecordMaintenance}>
              Save Maintenance Log
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL 5: Printable Custody Slip (نموذج تسليم عهدة) */}
      <Modal isOpen={isPrintSlipOpen} onClose={onPrintSlipClose} size="2xl">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>
            {currentLanguage === 'ar' ? 'نموذج إقرار استلام عهدة رسمية' : 'Official Asset Custody Handover Slip'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box p={6} borderWidth="1px" borderColor="gray.300" borderRadius="md" bg="white" color="black" id="custody-slip">
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center" borderBottom="2px solid" borderColor="gray.800" pb={3}>
                  <VStack align="start" spacing={0}>
                    <Heading size="md">إقرار استلام عهدة رسمية</Heading>
                    <Text fontSize="xs" color="gray.600">OFFICIAL ASSET CUSTODY ACKNOWLEDGMENT</Text>
                  </VStack>
                  <Text fontFamily="mono" fontWeight="bold">REF: {selectedAssetForAction?.asset_tag}</Text>
                </Flex>

                <SimpleGrid columns={2} spacing={3} fontSize="xs" bg="gray.50" p={3} borderRadius="sm">
                  <Box>
                    <Text fontWeight="bold">اسم الموظف / Employee:</Text>
                    <Text>{selectedAssetForAction?.holder_name}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">الرقم الوظيفي / Emp ID:</Text>
                    <Text>{selectedAssetForAction?.holder_employee_number || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">القسم / Department:</Text>
                    <Text>{selectedAssetForAction?.holder_department || 'General'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">تاريخ التسليم / Date:</Text>
                    <Text>{new Date().toISOString().split('T')[0]}</Text>
                  </Box>
                </SimpleGrid>

                <Box borderWidth="1px" borderColor="gray.300" p={3} borderRadius="sm">
                  <Heading size="xs" mb={2}>تفاصيل الأصل والملحقات / Asset Details</Heading>
                  <SimpleGrid columns={2} spacing={2} fontSize="xs">
                    <Text><Text as="span" fontWeight="bold">الأصل:</Text> {selectedAssetForAction?.asset_name}</Text>
                    <Text><Text as="span" fontWeight="bold">الماركة/الموديل:</Text> {selectedAssetForAction?.brand} {selectedAssetForAction?.model}</Text>
                    <Text><Text as="span" fontWeight="bold">الرقم التسلسلي S/N:</Text> {selectedAssetForAction?.serial_number || 'N/A'}</Text>
                    <Text><Text as="span" fontWeight="bold">التصنيف:</Text> {selectedAssetForAction?.category}</Text>
                  </SimpleGrid>
                </Box>

                <Text fontSize="10px" color="gray.600" textAlign="justify">
                  أقر أنا الموظف الموضح بياناتي أعلاه بأنني قد استلمت العهدة الموضحة بحالة سليمة وجيدة للعمل، وأتعهد بالمحافظة عليها واستخدامها في أغراض العمل الرسمية للشركة فقط، والالتزام بإعادتها عند طلب الإدارة أو عند انتهاء خدماتي بالشركة.
                  <br />
                  I acknowledge receipt of the company asset in good working condition and undertake to preserve it for business purposes and return it upon request or upon exit.
                </Text>

                <Flex justify="space-between" pt={8} borderTop="1px dashed" borderColor="gray.300">
                  <VStack align="start" spacing={6}>
                    <Text fontSize="xs" fontWeight="bold">المسؤول المُسلّم (IT/HR Admin):</Text>
                    <Text fontSize="xs">التوقيع: ___________________</Text>
                  </VStack>
                  <VStack align="start" spacing={6}>
                    <Text fontSize="xs" fontWeight="bold">الموظف المستلم (Receiver):</Text>
                    <Text fontSize="xs">التوقيع: ___________________</Text>
                  </VStack>
                </Flex>
              </VStack>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" mr={3} onClick={onPrintSlipClose}>
              Close
            </Button>
            <Button
              size="sm"
              leftIcon={<FiPrinter />}
              colorScheme="blue"
              onClick={() => window.print()}
            >
              Print Slip / طباعة
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL 6: Printable QR Code Sticker (ملصق باركود الأصل) */}
      <Modal isOpen={isQrModalOpen} onClose={onQrModalClose} size="sm">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader fontSize="md">
            {currentLanguage === 'ar' ? 'ملصق باركود الأصل (QR Sticker)' : 'Official Asset QR Sticker'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody textAlign="center">
            <Box
              p={6}
              borderWidth="2px"
              borderColor="gray.800"
              borderRadius="lg"
              bg="white"
              color="black"
              display="inline-block"
              id="qr-sticker-printable"
            >
              <VStack spacing={2}>
                <Text fontSize="xs" fontWeight="black" letterSpacing="wider">
                  SMART ERP • PROPERTY
                </Text>
                {qrCodeDataUrl && (
                  <Box
                    as="img"
                    src={qrCodeDataUrl}
                    alt="Asset QR Code"
                    boxSize="180px"
                    mx="auto"
                  />
                )}
                <Text fontFamily="mono" fontWeight="bold" fontSize="md" color="blue.700">
                  {selectedAssetForAction?.asset_tag}
                </Text>
                <Text fontSize="2xs" fontWeight="semibold" maxW="200px" isTruncated>
                  {selectedAssetForAction?.asset_name}
                </Text>
                {selectedAssetForAction?.serial_number && (
                  <Text fontSize="3xs" color="gray.600" fontFamily="mono">
                    S/N: {selectedAssetForAction.serial_number}
                  </Text>
                )}
              </VStack>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" mr={3} onClick={onQrModalClose}>
              Close
            </Button>
            <Button
              size="sm"
              leftIcon={<FiPrinter />}
              colorScheme="purple"
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head><title>Print QR Label - ${selectedAssetForAction?.asset_tag}</title></head>
                      <body style="display:flex; justify-content:center; align-items:center; height:100vh; margin:0; font-family:sans-serif;">
                        <div style="border:2px solid #000; padding:16px; text-align:center; border-radius:8px; width:220px;">
                          <h4 style="margin:0 0 8px 0; font-size:11px; letter-spacing:1px;">SMART ERP ASSET</h4>
                          <img src="${qrCodeDataUrl}" style="width:160px; height:160px; margin:0 auto;" />
                          <h3 style="margin:8px 0 2px 0; font-family:monospace; font-size:16px;">${selectedAssetForAction?.asset_tag}</h3>
                          <p style="margin:0; font-size:10px; color:#555;">${selectedAssetForAction?.asset_name}</p>
                        </div>
                        <script>window.onload = function() { window.print(); window.close(); }</script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }
              }}
            >
              Print Sticker / طباعة الملصق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL 7: Employee Self-Audit Form (التدقيق والفحص الذاتي للعهدة) */}
      <Modal isOpen={isSelfAuditOpen} onClose={onSelfAuditClose} size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent dir={isRtl ? 'rtl' : 'ltr'}>
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={FiCamera} color="teal.500" />
              <Text fontSize="md">
                {currentLanguage === 'ar' ? 'فحص وتدقيق العهدة الذاتي' : 'Asset Self-Audit & Physical Attestation'}
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md" fontSize="xs">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">{selectedAssetForAction?.asset_tag}: {selectedAssetForAction?.asset_name}</Text>
                  <Text fontSize="2xs">
                    {currentLanguage === 'ar'
                      ? 'يرجى تأكيد سلامة العهدة، مطابقة الباركود، والتقاط صور توثيقية للأصل'
                      : 'Please inspect your assigned asset, confirm physical QR tag match, and attach verification photos'}
                  </Text>
                </Box>
              </Alert>

              {/* Step 1: Physical QR Code Match Confirmation */}
              <Box p={3} borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={subBg}>
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Icon as={FaQrcode} color="purple.500" />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" fontWeight="bold">
                        {currentLanguage === 'ar' ? 'تم فحص ومطابقة ملصق الـ QR للأصل' : 'Physical QR Tag Verified'}
                      </Text>
                      <Text fontSize="2xs" color="gray.500" fontFamily="mono">
                        Tag: {selectedAssetForAction?.asset_tag}
                      </Text>
                    </VStack>
                  </HStack>
                  <Switch
                    colorScheme="green"
                    isChecked={selfAuditForm.qrScanned}
                    onChange={(e) => setSelfAuditForm((p) => ({ ...p, qrScanned: e.target.checked }))}
                  />
                </Flex>
              </Box>

              {/* Step 2: Operational Status & Condition */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'الحالة التشغيلية' : 'Operational Status'}</FormLabel>
                  <Select
                    size="sm"
                    value={selfAuditForm.operationalStatus}
                    onChange={(e) => setSelfAuditForm((p) => ({ ...p, operationalStatus: e.target.value }))}
                  >
                    <option value="fully_operational">Fully Operational (يعمل بكفاءة تامة)</option>
                    <option value="minor_issues">Minor Issues (يعمل مع ملاحظات بسيطة)</option>
                    <option value="inoperable">Inoperable / Broken (متوقف عن العمل / عاطل)</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'حالة الهيكل والمظهر' : 'Physical Condition'}</FormLabel>
                  <Select
                    size="sm"
                    value={selfAuditForm.condition}
                    onChange={(e) => setSelfAuditForm((p) => ({ ...p, condition: e.target.value }))}
                  >
                    <option value="excellent">Excellent (ممتاز / كالجديد)</option>
                    <option value="good">Good (جيد جداً)</option>
                    <option value="fair">Fair (مقبول / آثار استخدام طبيعي)</option>
                    <option value="damaged">Damaged (تالف / كسور أو خدوش بالغة)</option>
                    <option value="needs_maintenance">Needs Maintenance (يتطلب صيانة فنية)</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              {/* Step 3: Photo Uploads (Camera capture) */}
              <FormControl>
                <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'التقاط أو إرفاق صور للأصل' : 'Attach Verification Photos (Camera / Upload)'}</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  size="sm"
                  p={1}
                  onChange={handleAuditPhotoUpload}
                />
                <Text fontSize="2xs" color="gray.500" mt={1}>
                  {currentLanguage === 'ar' ? 'يمكنك التقاط صور للجهاز وملصق الرقم التسلسلي' : 'Take photos of the device, screen, and serial number tag'}
                </Text>

                {selfAuditForm.photos.length > 0 && (
                  <HStack spacing={2} mt={3} wrap="wrap">
                    {selfAuditForm.photos.map((img, i) => (
                      <Box key={i} position="relative">
                        <Box
                          as="img"
                          src={img}
                          alt="preview"
                          boxSize="70px"
                          objectFit="cover"
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="gray.300"
                        />
                        <IconButton
                          aria-label="Remove photo"
                          icon={<FiXCircle />}
                          size="xs"
                          colorScheme="red"
                          position="absolute"
                          top="-5px"
                          right="-5px"
                          borderRadius="full"
                          onClick={() =>
                            setSelfAuditForm((p) => ({
                              ...p,
                              photos: p.photos.filter((_, idx) => idx !== i),
                            }))
                          }
                        />
                      </Box>
                    ))}
                  </HStack>
                )}
              </FormControl>

              {/* Step 4: Notes & GPS */}
              <FormControl>
                <FormLabel fontSize="xs">{currentLanguage === 'ar' ? 'ملاحظات الفحص' : 'Auditor Notes / Discrepancies'}</FormLabel>
                <Textarea
                  size="sm"
                  value={selfAuditForm.notes}
                  onChange={(e) => setSelfAuditForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Battery health 85%, screen protector cracked..."
                />
              </FormControl>

              {selfAuditForm.gpsLat && (
                <HStack fontSize="2xs" color="gray.500">
                  <Icon as={FiCheckCircle} color="green.500" />
                  <Text>
                    GPS Location Captured: {selfAuditForm.gpsLat.toFixed(4)}, {selfAuditForm.gpsLng?.toFixed(4)}
                  </Text>
                </HStack>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" mr={3} onClick={onSelfAuditClose}>
              Cancel
            </Button>
            <Button size="sm" colorScheme="teal" leftIcon={<FiCheckCircle />} onClick={handleSubmitSelfAudit}>
              {currentLanguage === 'ar' ? 'اعتماد وإرسال الفحص' : 'Submit Self-Audit'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AssetManagementScreen;
