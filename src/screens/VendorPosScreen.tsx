import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Divider,
  useColorModeValue,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  useDisclosure,
  Tooltip,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiPrinter,
  FiCheckCircle,
  FiCreditCard,
  FiShield,
  FiShoppingBag,
  FiCoffee,
  FiZap,
  FiScissors,
  FiTool,
  FiTag,
  FiMaximize2,
  FiX,
  FiAward,
  FiPlusCircle,
  FiList,
  FiUploadCloud,
  FiDownload,
  FiEdit,
  FiPackage,
  FiGlobe,
  FiLogOut,
  FiUser,
} from 'react-icons/fi';
import { CashBanknoteIcon, SaudiRiyalIcon, RiyalCurrencySymbol } from '../components/icons/SaudiRiyalIcon';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/shared/AuthContext';
import { useLanguage } from '../contexts/shared/LanguageContext';
import { vendorAuthService, VendorAccount, VendorProduct } from '../services/vendorAuthService';
import { ZatcaInvoiceReceiptModal, ZatcaReceiptItem, ZatcaOnboardingModal } from '../modules/zatca';
import { QuickAddProductModal } from '../components/pos/QuickAddProductModal';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  posTranslations,
} from '../utils/posTranslations';

interface CartItem {
  id: string;
  name: string;
  nameArabic?: string;
  price: number;
  qty: number;
  vatRate: number;
  category?: string;
}

interface PresetItem {
  name: string;
  nameArabic: string;
  price: number;
  category: string;
  icon?: any;
  colorScheme?: string;
}

const PRESET_CATEGORIES = ['All / الكل', 'Beverages / مشروبات', 'Food / مأكولات', 'Services / خدمات', 'General / عام'];

const ELEGANT_PRESETS: PresetItem[] = [
  { name: 'Karak Tea', nameArabic: 'شاي كرك مميز', price: 3.5, category: 'Beverages / مشروبات', icon: FiCoffee, colorScheme: 'orange' },
  { name: 'Arabic Coffee (Dallah)', nameArabic: 'دلة قهوة عربية مع تمر', price: 18.0, category: 'Beverages / مشروبات', icon: FiCoffee, colorScheme: 'yellow' },
  { name: 'Specialty Espresso', nameArabic: 'إسبريسو مختص', price: 12.0, category: 'Beverages / مشروبات', icon: FiCoffee, colorScheme: 'amber' },
  { name: 'Mineral Water', nameArabic: 'مياه معدنية 330 مل', price: 1.5, category: 'Beverages / مشروبات', icon: FiZap, colorScheme: 'cyan' },
  { name: 'Fresh Orange Juice', nameArabic: 'عصير برتقال طازج', price: 14.0, category: 'Beverages / مشروبات', icon: FiZap, colorScheme: 'orange' },
  { name: 'Club Sandwich', nameArabic: 'كلوب ساندوتش مشكل', price: 16.0, category: 'Food / مأكولات', icon: FiShoppingBag, colorScheme: 'teal' },
  { name: 'Falafel Roll', nameArabic: 'ساندوتش فلافل سوبر', price: 8.0, category: 'Food / مأكولات', icon: FiShoppingBag, colorScheme: 'green' },
  { name: 'Shawarma Meal', nameArabic: 'وجبة شاورما عربي', price: 24.0, category: 'Food / مأكولات', icon: FiShoppingBag, colorScheme: 'red' },
  { name: 'VIP Haircut & Beard', nameArabic: 'حلاقة شعر وذقن VIP', price: 50.0, category: 'Services / خدمات', icon: FiScissors, colorScheme: 'purple' },
  { name: 'Express Car Wash', nameArabic: 'غسيل سيارة سريع مع تلميع', price: 35.0, category: 'Services / خدمات', icon: FiTool, colorScheme: 'blue' },
  { name: 'Oil & Filter Change', nameArabic: 'تغيير زيت وفلتر أصلي', price: 95.0, category: 'Services / خدمات', icon: FiTool, colorScheme: 'gray' },
  { name: 'Consultation Fee', nameArabic: 'استشارة فنية / خدمة', price: 50.0, category: 'Services / خدمات', icon: FiAward, colorScheme: 'indigo' },
  { name: 'Quick Sale 10', nameArabic: 'صنف عام 10 ريال', price: 10.0, category: 'General / عام', icon: FiTag, colorScheme: 'teal' },
  { name: 'Quick Sale 25', nameArabic: 'صنف عام 25 ريال', price: 25.0, category: 'General / عام', icon: FiTag, colorScheme: 'teal' },
  { name: 'Quick Sale 50', nameArabic: 'صنف عام 50 ريال', price: 50.0, category: 'General / عام', icon: FiTag, colorScheme: 'teal' },
  { name: 'Quick Sale 100', nameArabic: 'صنف عام 100 ريال', price: 100.0, category: 'General / عام', icon: FiTag, colorScheme: 'teal' },
];

export const VendorPosScreen: React.FC = () => {
  const { user, organizationDetails, activeVendor: contextActiveVendor } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Active vendor session for real-time vendor details display
  const [activeVendor, setActiveVendor] = useState<VendorAccount | null>(() => {
    return contextActiveVendor || vendorAuthService.getActiveVendorSession();
  });

  React.useEffect(() => {
    if (contextActiveVendor) {
      setActiveVendor(contextActiveVendor);
    }
  }, [contextActiveVendor]);

  React.useEffect(() => {
    const handleVendorSessionChanged = (e: any) => {
      setActiveVendor(e.detail || vendorAuthService.getActiveVendorSession());
    };
    window.addEventListener('vendor-session-changed', handleVendorSessionChanged);
    return () => window.removeEventListener('vendor-session-changed', handleVendorSessionChanged);
  }, []);

  // Custom Vendor Products loaded directly from vendor service
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

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All / الكل');
  const [keypadInput, setKeypadInput] = useState('');
  const [keypadLabel, setKeypadLabel] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mobile Drawer for Cart
  const { isOpen: isMobileCartOpen, onOpen: onMobileCartOpen, onClose: onMobileCartClose } = useDisclosure();

  // Quick Add Product Modal (Option 1)
  const { isOpen: isQuickAddOpen, onOpen: onQuickAddOpen, onClose: onQuickAddClose } = useDisclosure();

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastIssuedInvoice, setLastIssuedInvoice] = useState<{
    invoiceNumber: string;
    date: string;
    time: string;
    items: ZatcaReceiptItem[];
    subtotal: number;
    vat: number;
    grandTotal: number;
  } | null>(null);

  // Onboarding Modal
  const { isOpen: isOnboardOpen, onOpen: onOnboardOpen, onClose: onOnboardClose } = useDisclosure();

  // Responsive Breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false });

  // Multi-Language State (Universal across app)
  const { currentLanguage: currentLang, setLanguage, activeLangConfig, t } = useLanguage();

  const handleLanguageChange = (code: SupportedLanguage) => {
    setLanguage(code);
  };

  // Tab Index Control
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Store Products Tab State (Bulk import, Edit, Category filter)
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [storeCategoryFilter, setStoreCategoryFilter] = useState('all');
  const { isOpen: isBulkImportOpen, onOpen: onBulkImportOpen, onClose: onBulkImportClose } = useDisclosure();
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Edit Single Item State
  const [editingItem, setEditingItem] = useState<any>(null);
  const { isOpen: isEditItemOpen, onOpen: onEditItemOpen, onClose: onEditItemClose } = useDisclosure();

  // Inventory Mutations
  const createInventory = useMutation(api.inventory.createInventory);
  const updateInventory = useMutation(api.inventory.updateInventory);
  const deleteInventory = useMutation(api.inventory.deleteInventory);

  // Load Inventory from DB (only for standard Convex organizations)
  const isConvexOrg = Boolean(
    user?.organizationId &&
    !user.organizationId.startsWith('org_') &&
    user?.role !== 'vendor' &&
    !activeVendor
  );

  const rawInventory = useQuery(
    api.inventory.listInventory,
    isConvexOrg
      ? {
          organization_id: user.organizationId as Id<'organizations'>,
        }
      : 'skip'
  );

  const inventoryItems = useMemo(() => {
    if (!rawInventory) return [];
    return rawInventory
      .filter((item: any) => (item.selling_price || item.cost_price || 0) > 0)
      .slice(0, 100);
  }, [rawInventory]);

  const filteredInventory = useMemo(() => {
    if (!searchTerm.trim()) return inventoryItems.slice(0, 36);
    const q = searchTerm.toLowerCase();
    return inventoryItems.filter(
      (it: any) =>
        it.name.toLowerCase().includes(q) ||
        (it.name_arabic && it.name_arabic.includes(q)) ||
        (it.sku && it.sku.toLowerCase().includes(q))
    );
  }, [inventoryItems, searchTerm]);

  // Dynamic categories combined from vendor DB + presets
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All / الكل');
    inventoryItems.forEach((i: any) => {
      if (i.category) cats.add(i.category);
    });
    PRESET_CATEGORIES.forEach((c) => cats.add(c));
    return Array.from(cats);
  }, [inventoryItems]);

  // Vendor's unique DB product categories for the Store Products Tab
  const storeCategories = useMemo(() => {
    const set = new Set<string>();
    inventoryItems.forEach((i: any) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [inventoryItems]);

  // Filtered products specifically for Store Products Management Tab
  const storeFilteredProducts = useMemo(() => {
    return inventoryItems.filter((item: any) => {
      const matchesCategory = storeCategoryFilter === 'all' || item.category === storeCategoryFilter;
      const q = storeSearchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.name_arabic && item.name_arabic.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [inventoryItems, storeCategoryFilter, storeSearchTerm]);

  // Handle Delete Inventory item
  const handleDeleteProduct = async (id: Id<'inventory'>, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الصنف: ${name}؟`)) return;
    try {
      await deleteInventory({ id });
      toast({
        title: 'تم حذف الصنف',
        description: name,
        status: 'info',
        duration: 2500,
      });
    } catch (e: any) {
      toast({
        title: 'فشل الحذف',
        description: e.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Handle Edit Save
  const handleSaveProductEdit = async () => {
    if (!editingItem) return;
    try {
      if (editingItem._id && !editingItem._id.startsWith('prod_')) {
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
      }

      // If it exists in local vendor products, update image & attributes there too
      const currentVendorItems = vendorAuthService.getVendorProducts();
      const matchIndex = currentVendorItems.findIndex(p => p.id === (editingItem._id || editingItem.id) || p.sku === editingItem.sku);
      if (matchIndex >= 0) {
        currentVendorItems[matchIndex] = {
          ...currentVendorItems[matchIndex],
          name: editingItem.name,
          nameArabic: editingItem.name_arabic || editingItem.name,
          price: parseFloat(editingItem.selling_price) || currentVendorItems[matchIndex].price,
          category: editingItem.category || currentVendorItems[matchIndex].category,
          sku: editingItem.sku || currentVendorItems[matchIndex].sku,
          image: editingItem.image,
          imageUrl: editingItem.image,
        };
        localStorage.setItem('trading_erp_vendor_products', JSON.stringify(currentVendorItems));
        setLocalVendorProducts([...currentVendorItems]);
      }

      toast({
        title: 'تم تعديل الصنف بنجاح',
        status: 'success',
        duration: 2500,
      });
      onEditItemClose();
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
  const handleBulkImportProducts = async () => {
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

        // Also asynchronously sync to Convex DB if connected
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
      // Deduplicate by SKU
      const unique = combined.filter((item, idx, arr) => arr.findIndex((x) => x.sku === item.sku) === idx);
      vendorAuthService.saveVendorProducts(unique, activeVendor?.id);
      setLocalVendorProducts(unique);

      toast({
        title: 'تم استيراد الأصناف بنجاح',
        description: `تمت إضافة ${newImportedProducts.length} صنف جديد ومزامنتها مع نقطة البيع`,
        status: 'success',
        duration: 4000,
      });

      setBulkCsvText('');
      onBulkImportClose();
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
    link.setAttribute('download', 'store_products_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Combine vendor's real products with fallback presets so vendor's own items appear front and center
  const displayTiles = useMemo(() => {
    // 1. Vendor's imported / created products
    const localFormatted = localVendorProducts.map((item) => ({
      name: item.name,
      nameArabic: item.nameArabic || item.name,
      price: item.price,
      costPrice: item.costPrice,
      category: item.category || 'General / عام',
      icon: FiTag,
      image: item.image || item.imageUrl,
      isDbItem: true,
      sku: item.sku,
      vatRate: item.vatRate || 15,
      unit: item.unit || 'Pcs',
    }));

    // 2. Organization items from DB
    const dbFormatted = inventoryItems.map((item: any) => ({
      name: item.name,
      nameArabic: item.name_arabic || item.name,
      price: item.selling_price || item.cost_price || 0,
      costPrice: item.cost_price,
      category: item.category || 'General / عام',
      icon: FiTag,
      image: item.image || item.imageUrl || item.image_url,
      isDbItem: true,
      sku: item.sku,
      vatRate: 15,
      unit: item.unit || 'Pcs',
    }));

    // Vendor products first, then DB items, then default presets
    const combined = [...localFormatted, ...dbFormatted, ...ELEGANT_PRESETS];

    if (selectedCategory === 'All / الكل') return combined.slice(0, 60);
    return combined.filter((p) => p.category === selectedCategory).slice(0, 60);
  }, [localVendorProducts, inventoryItems, selectedCategory]);

  // Cart operations
  const addToCart = (item: { name: string; nameArabic?: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          name: item.name,
          nameArabic: item.nameArabic,
          price: item.price,
          qty: 1,
          vatRate: 15,
        },
      ];
    });

    toast({
      title: `+ ${item.nameArabic || item.name}`,
      status: 'info',
      duration: 1000,
      position: 'top-right',
      isClosable: false,
    });
  };

  const updateQty = (name: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.name === name) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  // Numpad actions
  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setKeypadInput('');
    } else if (val === '⌫') {
      setKeypadInput((prev) => prev.slice(0, -1));
    } else if (val === '.') {
      if (!keypadInput.includes('.')) {
        setKeypadInput((prev) => (prev === '' ? '0.' : prev + '.'));
      }
    } else {
      setKeypadInput((prev) => prev + val);
    }
  };

  const handleKeypadAdd = () => {
    const amount = parseFloat(keypadInput);
    if (!amount || amount <= 0) {
      toast({
        title: 'أدخل مبلغاً صالحاً',
        description: 'Please enter a valid price on keypad',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    addToCart({
      name: keypadLabel.trim() || `Item ${amount.toFixed(0)} \uE900`,
      nameArabic: keypadLabel.trim() || `صنف مخصص ${amount.toFixed(0)} \uE900`,
      price: amount,
    });
    setKeypadInput('');
    setKeypadLabel('');
  };

  // Financial calculations
  const totals = useMemo(() => {
    const rawTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const subtotal = rawTotal / 1.15;
    const vat = rawTotal - subtotal;
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    return {
      subtotal,
      vat,
      grandTotal: rawTotal,
      totalItems,
    };
  }, [cart]);

  // Handle Checkout & 1-Click Print
  const handleCheckoutAndPrint = () => {
    if (cart.length === 0) {
      toast({
        title: 'السلة فارغة / Empty Cart',
        description: 'Please add items before printing receipt',
        status: 'warning',
        duration: 2500,
      });
      return;
    }

    const now = new Date();
    const invoiceNumber = `POS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const receiptItems: ZatcaReceiptItem[] = cart.map((i) => ({
      name: i.name,
      nameArabic: i.nameArabic,
      qty: i.qty,
      unitPrice: i.price / 1.15,
      vatRate: 15,
      subtotal: i.price * i.qty,
    }));

    setLastIssuedInvoice({
      invoiceNumber,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      items: receiptItems,
      subtotal: totals.subtotal,
      vat: totals.vat,
      grandTotal: totals.grandTotal,
    });

    setIsReceiptOpen(true);
    setCart([]);
    if (isMobile) onMobileCartClose();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const bgGradient = useColorModeValue(
    'linear(to-br, gray.50, #f8fafc)',
    'linear(to-br, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Reusable Cart Bill Component (Used in Sidebar on desktop and Drawer on mobile)
  const CartBillPanel = () => (
    <Flex direction="column" h="100%" justify="space-between">
      <Box>
        <Flex justify="space-between" align="center" pb={3} borderBottomWidth="1px" borderColor={borderColor}>
          <HStack spacing={2}>
            <Box p={2} bg="teal.500" color="white" borderRadius="lg">
              <FiShoppingBag size={18} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="md">
                {activeVendor?.storeNameArabic || activeVendor?.storeName || t('orderBill')}
              </Text>
              <Text fontSize="2xs" color="gray.500">
                {activeVendor?.phone ? `📱 ${activeVendor.phone} • ` : ''}
                {totals.totalItems} {t('itemsSelected')}
              </Text>
            </VStack>
          </HStack>
          {cart.length > 0 && (
            <Button
              size="xs"
              colorScheme="red"
              variant="ghost"
              leftIcon={<FiTrash2 />}
              onClick={clearCart}
            >
              {t('clearCart')}
            </Button>
          )}
        </Flex>

        {/* Cart Item Rows */}
        <Box
          maxH={{ base: '320px', md: '340px', lg: '380px' }}
          overflowY="auto"
          py={2}
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
          }}
        >
          {cart.length === 0 ? (
            <Flex h="220px" align="center" justify="center" direction="column" color="gray.400" textAlign="center">
              <Box p={4} bg="gray.50" borderRadius="full" mb={2}>
                <FiShoppingBag size={32} color="#94a3b8" />
              </Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                {t('emptyCartTitle')}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {t('emptyCartDesc')}
              </Text>
            </Flex>
          ) : (
            <VStack spacing={2} align="stretch">
              {cart.map((item) => (
                <Flex
                  key={item.name}
                  p={2.5}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={borderColor}
                  justify="space-between"
                  align="center"
                  transition="all 0.15s ease"
                  _hover={{ borderColor: 'teal.300', transform: 'translateY(-1px)' }}
                >
                  <VStack align="start" spacing={0} flex={1} mr={2}>
                    <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                      {currentLang === 'ar' || currentLang === 'ur' ? (item.nameArabic || item.name) : (item.name || item.nameArabic)}
                    </Text>
                    <Text fontSize="2xs" color="gray.500" display="inline-flex" alignItems="center">
                      {item.price.toFixed(2)} <RiyalCurrencySymbol boxSize="0.9em" /> {t('unitPrice')}
                    </Text>
                  </VStack>

                  <HStack spacing={1}>
                    <IconButton
                      aria-label="Decrease"
                      icon={<FiMinus />}
                      size="xs"
                      variant="outline"
                      borderColor="gray.300"
                      borderRadius="md"
                      onClick={() => updateQty(item.name, -1)}
                    />
                    <Text fontSize="sm" fontWeight="bold" px={1.5} minW="22px" textAlign="center">
                      {item.qty}
                    </Text>
                    <IconButton
                      aria-label="Increase"
                      icon={<FiPlus />}
                      size="xs"
                      colorScheme="teal"
                      borderRadius="md"
                      onClick={() => updateQty(item.name, 1)}
                    />
                  </HStack>

                  <Text fontSize="xs" fontWeight="bold" color="teal.600" w="80px" textAlign="right" display="inline-flex" alignItems="center" justifyContent="flex-end">
                    {(item.price * item.qty).toFixed(2)} <RiyalCurrencySymbol boxSize="1em" />
                  </Text>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      </Box>

      {/* Bill Footer & Checkout Action */}
      <Box pt={3} borderTopWidth="1px" borderColor={borderColor}>
        {/* Payment Selector */}
        <SimpleGrid columns={2} spacing={2} mb={3}>
          <Button
            size="sm"
            h="40px"
            leftIcon={<FiCreditCard />}
            colorScheme={paymentMethod === 'card' ? 'teal' : 'gray'}
            variant={paymentMethod === 'card' ? 'solid' : 'outline'}
            borderRadius="lg"
            fontWeight="bold"
            onClick={() => setPaymentMethod('card')}
          >
            {t('cardPayment')}
          </Button>
          <Button
            size="sm"
            h="40px"
            leftIcon={<CashBanknoteIcon boxSize={4} />}
            colorScheme={paymentMethod === 'cash' ? 'teal' : 'gray'}
            variant={paymentMethod === 'cash' ? 'solid' : 'outline'}
            borderRadius="lg"
            fontWeight="bold"
            onClick={() => setPaymentMethod('cash')}
          >
            {t('cashPayment')}
          </Button>
        </SimpleGrid>

        {/* Financial Breakdown */}
        <VStack spacing={1} align="stretch" fontSize="xs" mb={3} p={3} bg="gray.50" borderRadius="xl">
          <Flex justify="space-between" color="gray.600" align="center">
            <Text>{t('subtotal')}</Text>
            <Text fontWeight="semibold" display="inline-flex" alignItems="center">
              {totals.subtotal.toFixed(2)} <RiyalCurrencySymbol boxSize="1em" />
            </Text>
          </Flex>
          <Flex justify="space-between" color="gray.600" align="center">
            <Text>{t('vatAmount')}</Text>
            <Text fontWeight="semibold" color="blue.600" display="inline-flex" alignItems="center">
              {totals.vat.toFixed(2)} <RiyalCurrencySymbol boxSize="1em" />
            </Text>
          </Flex>
          <Divider my={1} />
          <Flex justify="space-between" fontSize="md" fontWeight="bold" color="teal.700" align="center">
            <Text>{t('grandTotal')}</Text>
            <Text fontSize="lg" display="inline-flex" alignItems="center">
              {totals.grandTotal.toFixed(2)} <RiyalCurrencySymbol boxSize="1.2em" />
            </Text>
          </Flex>
        </VStack>

        {/* Big Print Checkout Button */}
        <Button
          w="100%"
          h="56px"
          colorScheme="teal"
          bgGradient="linear(to-r, teal.500, emerald.500, teal.600)"
          _hover={{ bgGradient: 'linear(to-r, teal.600, emerald.600, teal.700)' }}
          fontSize="md"
          fontWeight="bold"
          borderRadius="xl"
          leftIcon={<FiPrinter size={22} />}
          onClick={handleCheckoutAndPrint}
          isDisabled={cart.length === 0}
          boxShadow="0 4px 14px 0 rgba(13, 148, 136, 0.39)"
        >
          {t('printReceiptBtn')}
        </Button>
      </Box>
    </Flex>
  );

  return (
    <Box bg={bgGradient} minH="100vh" p={{ base: 2, sm: 3, md: 5 }} dir={activeLangConfig.dir}>
      {/* Sleek Top Banner */}
      <Flex
        bg={cardBg}
        px={{ base: 3, md: 5 }}
        py={3}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={borderColor}
        align="center"
        justify="space-between"
        mb={4}
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.05)"
      >
        <HStack spacing={3}>
          <Box p={2.5} bgGradient="linear(to-br, teal.500, teal.700)" color="white" borderRadius="xl" boxShadow="sm">
            <FiShoppingBag size={22} />
          </Box>
          <VStack align="start" spacing={0.5}>
            <HStack spacing={2} wrap="wrap">
              <Text fontWeight="extrabold" fontSize={{ base: 'md', md: 'lg' }} color="gray.800">
                {activeVendor?.storeNameArabic || activeVendor?.storeName || organizationDetails?.name || t('posTitle')}
              </Text>
              {activeVendor?.storeName && activeVendor?.storeNameArabic && activeVendor.storeName !== activeVendor.storeNameArabic && (
                <Text fontSize="xs" color="gray.500" fontWeight="medium">
                  ({activeVendor.storeName})
                </Text>
              )}
              <Badge colorScheme="green" variant="solid" fontSize="3xs" px={2} borderRadius="full">
                {t('live')}
              </Badge>
              {activeVendor?.businessCategory && (
                <Badge colorScheme="purple" variant="subtle" fontSize="3xs" px={2} borderRadius="full">
                  {activeVendor.businessCategory.split('/')[0].trim()}
                </Badge>
              )}
            </HStack>
            <HStack spacing={2} wrap="wrap" fontSize="2xs" color="gray.600">
              <Badge colorScheme="teal" variant="subtle" fontSize="3xs" borderRadius="md">
                <HStack spacing={1}>
                  <FiCheckCircle size={9} />
                  <Text>{t('zatcaPhase')}</Text>
                </HStack>
              </Badge>
              <Text>
                {t('vatNumber')}: <strong>{activeVendor?.vatNumber || (organizationDetails as any)?.vat_number || '310860308200003'}</strong>
              </Text>
              {activeVendor?.crNumber && (
                <Text display={{ base: 'none', sm: 'inline' }}>
                  • {t('crShort')}: <strong>{activeVendor.crNumber}</strong>
                </Text>
              )}
              {activeVendor?.ownerName && (
                <Text color="teal.700" fontWeight="medium" display={{ base: 'none', md: 'inline' }}>
                  • {t('cashier')}: <strong>{activeVendor.ownerName}</strong>
                </Text>
              )}
              {activeVendor?.phone && (
                <Text color="blue.700" fontWeight="bold" display={{ base: 'none', lg: 'inline' }} dir="ltr">
                  • 📱 {activeVendor.phone}
                </Text>
              )}
            </HStack>
          </VStack>
        </HStack>

        <HStack spacing={2}>
          <Tooltip label={t('quickAddTooltip')}>
            <Button
              size="sm"
              leftIcon={<FiPlusCircle />}
              colorScheme="teal"
              variant="solid"
              borderRadius="lg"
              fontSize="xs"
              onClick={onQuickAddOpen}
            >
              {t('quickAdd')}
            </Button>
          </Tooltip>

          <Tooltip label={t('bulkCsvTooltip')}>
            <Button
              size="sm"
              leftIcon={<FiUploadCloud />}
              colorScheme="purple"
              variant="outline"
              borderRadius="lg"
              fontSize="xs"
              display={{ base: 'none', md: 'inline-flex' }}
              onClick={onBulkImportOpen}
            >
              {t('bulkCsv')}
            </Button>
          </Tooltip>

          <Tooltip label={t('storeProductsTooltip')}>
            <Button
              size="sm"
              leftIcon={<FiList />}
              colorScheme={activeTabIndex === 3 ? 'teal' : 'gray'}
              variant={activeTabIndex === 3 ? 'solid' : 'outline'}
              borderRadius="lg"
              fontSize="xs"
              display={{ base: 'none', sm: 'inline-flex' }}
              onClick={() => setActiveTabIndex(3)}
            >
              {t('storeProductsTab')} ({inventoryItems.length})
            </Button>
          </Tooltip>

          <Tooltip label="FATOORA Connection Status">
            <Button
              size="sm"
              leftIcon={<FiShield />}
              colorScheme="teal"
              variant="outline"
              borderRadius="lg"
              fontSize="xs"
              onClick={onOnboardOpen}
            >
              FATOORA
            </Button>
          </Tooltip>

          {/* Vendor Details Popover Menu */}
          {activeVendor && (
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                leftIcon={<FiUser />}
                variant="outline"
                colorScheme="teal"
                borderRadius="lg"
                fontSize="xs"
                display={{ base: 'none', sm: 'inline-flex' }}
              >
                {activeVendor.ownerName || activeVendor.storeName}
              </MenuButton>
              <MenuList zIndex={100} p={3} minW="260px" borderRadius="xl" shadow="xl">
                <VStack align="stretch" spacing={2.5}>
                  <HStack justify="space-between">
                    <Text fontWeight="bold" fontSize="sm" color="teal.700">
                      {t('registeredStoreDetails')}
                    </Text>
                    <Badge colorScheme="green" variant="solid" fontSize="3xs" px={1.5} borderRadius="full">
                      {t('live')}
                    </Badge>
                  </HStack>
                  <Divider />
                  <Box fontSize="xs">
                    <Text color="gray.500" fontSize="2xs">{t('storeNameLabel')}:</Text>
                    <Text fontWeight="bold">{activeVendor.storeNameArabic || activeVendor.storeName}</Text>
                    {activeVendor.storeNameArabic && activeVendor.storeName && activeVendor.storeNameArabic !== activeVendor.storeName && (
                      <Text fontSize="2xs" color="gray.500">{activeVendor.storeName}</Text>
                    )}
                  </Box>
                  <Box fontSize="xs">
                    <Text color="gray.500" fontSize="2xs">{t('ownerCashier')}:</Text>
                    <Text fontWeight="semibold">{activeVendor.ownerName}</Text>
                  </Box>
                  <Box fontSize="xs">
                    <Text color="gray.500" fontSize="2xs">{t('mobileLabel')}:</Text>
                    <Text fontWeight="semibold" dir="ltr" color="teal.600">📱 {activeVendor.phone}</Text>
                  </Box>
                  <Box fontSize="xs">
                    <Text color="gray.500" fontSize="2xs">{t('vatShort')}:</Text>
                    <Text fontFamily="monospace" fontWeight="medium">{activeVendor.vatNumber || '310860308200003'}</Text>
                  </Box>
                  {activeVendor.crNumber && (
                    <Box fontSize="xs">
                      <Text color="gray.500" fontSize="2xs">{t('crShort')}:</Text>
                      <Text fontFamily="monospace">{activeVendor.crNumber}</Text>
                    </Box>
                  )}
                  {activeVendor.businessCategory && (
                    <Box fontSize="xs">
                      <Text color="gray.500" fontSize="2xs">{t('categoryLabel')}:</Text>
                      <Badge colorScheme="purple" variant="subtle" fontSize="2xs">{activeVendor.businessCategory}</Badge>
                    </Box>
                  )}
                </VStack>
              </MenuList>
            </Menu>
          )}

          {/* Multi-Language Selector Dropdown (Arabic, English, Hindi, Urdu, Bengali, Nepali, Tagalog) */}
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              leftIcon={<FiGlobe />}
              variant="outline"
              colorScheme="teal"
              borderRadius="lg"
              fontSize="xs"
              px={2.5}
            >
              {activeLangConfig.flag} {activeLangConfig.nativeName}
            </MenuButton>
            <MenuList zIndex={100} minW="180px" borderRadius="xl" shadow="lg">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <MenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  fontWeight={currentLang === lang.code ? 'bold' : 'normal'}
                  bg={currentLang === lang.code ? 'teal.50' : undefined}
                  color={currentLang === lang.code ? 'teal.700' : undefined}
                  fontSize="sm"
                >
                  <HStack justify="space-between" w="100%">
                    <HStack spacing={2}>
                      <Text fontSize="md">{lang.flag}</Text>
                      <Text>{lang.nativeName}</Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.400">
                      ({lang.name})
                    </Text>
                  </HStack>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Tooltip label="العودة لصفحة تسجيل الدخول الرئيسية • Switch to Main Login">
            <Button
              size="sm"
              leftIcon={<FiLogOut />}
              colorScheme="red"
              variant="ghost"
              borderRadius="lg"
              fontSize="xs"
              onClick={() => {
                localStorage.removeItem('trading_erp_active_vendor_session');
                localStorage.removeItem('trading-erp-user');
                localStorage.removeItem('trading-erp-organization');
                sessionStorage.clear();
                navigate('/login');
              }}
            >
              تسجيل الخروج (Login)
            </Button>
          </Tooltip>

          <IconButton
            aria-label="Fullscreen"
            icon={<FiMaximize2 />}
            size="sm"
            variant="ghost"
            display={{ base: 'none', md: 'flex' }}
            onClick={toggleFullscreen}
          />

          {/* Mobile Cart Trigger Button */}
          {isMobile && (
            <Button
              size="sm"
              colorScheme="teal"
              leftIcon={<FiShoppingBag />}
              borderRadius="lg"
              onClick={onMobileCartOpen}
              position="relative"
            >
              {t('cartMobile')} ({totals.totalItems})
              {totals.grandTotal > 0 && (
                <Badge ml={1} colorScheme="whiteAlpha" color="white" display="inline-flex" alignItems="center">
                  {totals.grandTotal.toFixed(0)} <RiyalCurrencySymbol boxSize="0.85em" ml="2px" />
                </Badge>
              )}
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Main Responsive Grid */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 380px', xl: '1fr 420px' }} gap={4} alignItems="start">
        {/* Left Interactive Products Column */}
        <GridItem>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" boxShadow="sm" overflow="hidden">
            <CardBody p={{ base: 3, md: 5 }}>
              <Tabs
                index={activeTabIndex}
                onChange={(idx) => setActiveTabIndex(idx)}
                variant="soft-rounded"
                colorScheme="teal"
              >
                <TabList mb={4} pb={1} overflowX="auto" css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
                  <Tab fontSize="sm" fontWeight="bold" borderRadius="xl" px={4}>
                    {t('tabFastTiles')}
                  </Tab>
                  <Tab fontSize="sm" fontWeight="bold" borderRadius="xl" px={4}>
                    {t('tabKeypad')}
                  </Tab>
                  <Tab fontSize="sm" fontWeight="bold" borderRadius="xl" px={4}>
                    {t('tabCatalog')} ({inventoryItems.length})
                  </Tab>
                  <Tab fontSize="sm" fontWeight="bold" borderRadius="xl" px={4} bg="teal.50" _selected={{ color: 'white', bg: 'teal.500' }}>
                    {t('tabStoreProducts')}
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Tab 1: Category Filtered Fast Touch Tiles */}
                  <TabPanel p={0}>
                    {/* Category Pills */}
                    <HStack spacing={2} mb={4} overflowX="auto" pb={2} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
                      {availableCategories.map((cat) => (
                        <Button
                          key={cat}
                          size="xs"
                          borderRadius="full"
                          px={3}
                          py={2}
                          fontWeight="semibold"
                          colorScheme={selectedCategory === cat ? 'teal' : 'gray'}
                          variant={selectedCategory === cat ? 'solid' : 'outline'}
                          onClick={() => setSelectedCategory(cat)}
                          whiteSpace="nowrap"
                        >
                          {cat.includes('All') || cat.includes('الكل')
                            ? t('catAll', 'All')
                            : cat.includes('Beverage') || cat.includes('مشروبات')
                            ? t('catBeverages', 'Beverages')
                            : cat.includes('Food') || cat.includes('مأكولات')
                            ? t('catFood', 'Food')
                            : cat.includes('Service') || cat.includes('خدمات')
                            ? t('catServices', 'Services')
                            : cat.includes('General') || cat.includes('عام')
                            ? t('catGeneral', 'General')
                            : cat}
                        </Button>
                      ))}
                    </HStack>

                    {/* Touch Tiles Grid */}
                    <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={3}>
                      {displayTiles.map((item, idx) => {
                        const Icon = item.icon || FiShoppingBag;
                        const hasImg = Boolean((item as any).image);
                        return (
                          <Card
                            key={idx}
                            as="button"
                            onClick={() => addToCart(item)}
                            variant="outline"
                            borderColor={borderColor}
                            borderRadius="xl"
                            p={2.5}
                            textAlign="right"
                            position="relative"
                            overflow="hidden"
                            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                            _hover={{
                              transform: 'translateY(-3px)',
                              boxShadow: '0 8px 20px -4px rgba(13, 148, 136, 0.15)',
                              borderColor: 'teal.400',
                            }}
                            _active={{ transform: 'scale(0.97)' }}
                          >
                            <VStack align="start" justify="space-between" h={hasImg ? "120px" : "95px"} w="100%">
                              <Flex justify="space-between" w="100%" align="center">
                                {hasImg ? (
                                  <Image
                                    src={(item as any).image}
                                    alt={item.name}
                                    boxSize="36px"
                                    objectFit="cover"
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                    fallback={
                                      <Box p={1.5} bg="teal.50" color="teal.600" borderRadius="lg">
                                        <Icon size={16} />
                                      </Box>
                                    }
                                  />
                                ) : (
                                  <Box p={1.5} bg="teal.50" color="teal.600" borderRadius="lg">
                                    <Icon size={16} />
                                  </Box>
                                )}
                                <Badge colorScheme="teal" fontSize="xs" px={2} py={0.5} borderRadius="full" display="inline-flex" alignItems="center">
                                  {item.price.toFixed(2)} <RiyalCurrencySymbol boxSize="0.95em" ml="2px" />
                                </Badge>
                              </Flex>

                              <Box w="100%">
                                <Text fontSize="xs" fontWeight="bold" noOfLines={1} color="gray.800">
                                  {currentLang === 'ar' || currentLang === 'ur' ? (item.nameArabic || item.name) : (item.name || item.nameArabic)}
                                </Text>
                                <Text fontSize="2xs" color="gray.500" noOfLines={1}>
                                  {currentLang === 'ar' || currentLang === 'ur' ? item.name : (item.nameArabic || '')}
                                </Text>
                              </Box>
                            </VStack>
                          </Card>
                        );
                      })}
                    </SimpleGrid>
                  </TabPanel>

                  {/* Tab 2: Smart Numpad & Quick Sale */}
                  <TabPanel p={0}>
                    <VStack spacing={4} maxW="420px" mx="auto" py={2}>
                      <Input
                        placeholder={t('customItemLabelPlaceholder')}
                        value={keypadLabel}
                        onChange={(e) => setKeypadLabel(e.target.value)}
                        size="md"
                        borderRadius="xl"
                      />

                      <Box
                        w="100%"
                        p={4}
                        bgGradient="linear(to-br, teal.50, emerald.50)"
                        borderRadius="2xl"
                        borderWidth="1px"
                        borderColor="teal.200"
                        textAlign="center"
                      >
                        <Text fontSize="2xs" fontWeight="bold" color="teal.700" textTransform="uppercase">
                          {t('keypadDisplayTitle')}
                        </Text>
                        <Text fontSize="4xl" fontWeight="black" color="teal.800" letterSpacing="tight" my={1} display="inline-flex" alignItems="center" justifyContent="center">
                          {keypadInput || '0.00'} <RiyalCurrencySymbol boxSize="0.75em" ml={2} />
                        </Text>
                      </Box>

                      {/* Clean 4x3 Touch Keypad */}
                      <SimpleGrid columns={3} spacing={3} w="100%">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
                          <Button
                            key={key}
                            h="62px"
                            fontSize="2xl"
                            fontWeight="bold"
                            variant="solid"
                            bg={key === '⌫' ? 'red.50' : 'gray.50'}
                            color={key === '⌫' ? 'red.600' : 'gray.800'}
                            _hover={{ bg: key === '⌫' ? 'red.100' : 'gray.100' }}
                            borderRadius="xl"
                            onClick={() => handleKeypadPress(key)}
                          >
                            {key}
                          </Button>
                        ))}
                      </SimpleGrid>

                      <HStack w="100%" spacing={3}>
                        <Button
                          flex={1}
                          h="50px"
                          variant="outline"
                          colorScheme="red"
                          borderRadius="xl"
                          onClick={() => setKeypadInput('')}
                        >
                          {t('clear')}
                        </Button>
                        <Button
                          flex={2}
                          h="50px"
                          colorScheme="teal"
                          fontSize="md"
                          fontWeight="bold"
                          borderRadius="xl"
                          leftIcon={<FiPlus />}
                          onClick={handleKeypadAdd}
                        >
                          {t('addToOrder')}
                        </Button>
                      </HStack>
                    </VStack>
                  </TabPanel>

                  {/* Tab 3: Catalog with Instant Search */}
                  <TabPanel p={0}>
                    <InputGroup mb={4}>
                      <InputLeftElement pointerEvents="none">
                        <FiSearch color="#94a3b8" />
                      </InputLeftElement>
                      <Input
                        placeholder={t('searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        borderRadius="xl"
                      />
                    </InputGroup>

                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} maxH="540px" overflowY="auto" pr={1}>
                      {filteredInventory.map((item: any) => {
                        const price = item.selling_price || item.cost_price || 0;
                        return (
                          <Card
                            key={item._id}
                            as="button"
                            onClick={() =>
                              addToCart({
                                name: item.name,
                                nameArabic: item.name_arabic,
                                price,
                              })
                            }
                            variant="outline"
                            borderColor={borderColor}
                            borderRadius="xl"
                            p={3}
                            textAlign="right"
                            _hover={{ borderColor: 'teal.400', bg: 'teal.50' }}
                          >
                            <VStack align="start" spacing={1} w="100%">
                              <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                                {currentLang === 'ar' || currentLang === 'ur' ? (item.name_arabic || item.name) : (item.name || item.name_arabic)}
                              </Text>
                              <Text fontSize="2xs" color="gray.500" noOfLines={1}>
                                {currentLang === 'ar' || currentLang === 'ur' ? item.name : (item.name_arabic || '')}
                              </Text>
                              <Flex justify="space-between" w="100%" align="center" mt={1}>
                                <Badge colorScheme="purple" fontSize="3xs">
                                  {item.sku || 'SKU'}
                                </Badge>
                                <Badge colorScheme="teal" fontSize="xs" display="inline-flex" alignItems="center">
                                  {price.toFixed(2)} <RiyalCurrencySymbol boxSize="0.95em" ml="2px" />
                                </Badge>
                              </Flex>
                            </VStack>
                          </Card>
                        );
                      })}
                    </SimpleGrid>
                  </TabPanel>

                  {/* Tab 4: Store Products Management & Bulk Import */}
                  <TabPanel p={0}>
                    <Box>
                      {/* Top Action Bar for Store Products */}
                      <Flex
                        p={3}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor={borderColor}
                        justify="space-between"
                        align="center"
                        mb={3}
                        flexWrap="wrap"
                        gap={2}
                      >
                        <HStack spacing={2}>
                          <Badge colorScheme="teal" px={2.5} py={1} borderRadius="full" fontSize="xs" fontWeight="bold">
                            {inventoryItems.length} {t('registeredItems')}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {t('storeProductsSub')}
                          </Text>
                        </HStack>

                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            leftIcon={<FiUploadCloud />}
                            colorScheme="purple"
                            borderRadius="lg"
                            fontSize="xs"
                            onClick={onBulkImportOpen}
                          >
                            {t('bulkCsvImport')}
                          </Button>
                          <Button
                            size="sm"
                            leftIcon={<FiPlus />}
                            colorScheme="teal"
                            borderRadius="lg"
                            fontSize="xs"
                            onClick={onQuickAddOpen}
                          >
                            {t('addSingleProduct')}
                          </Button>
                        </HStack>
                      </Flex>

                      {/* Filter & Search Bar */}
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                        <InputGroup size="sm">
                          <InputLeftElement pointerEvents="none">
                            <FiSearch color="#94a3b8" />
                          </InputLeftElement>
                          <Input
                            placeholder={t('searchProductsPlaceholder')}
                            value={storeSearchTerm}
                            onChange={(e) => setStoreSearchTerm(e.target.value)}
                            borderRadius="lg"
                          />
                        </InputGroup>

                        <Select
                          size="sm"
                          value={storeCategoryFilter}
                          onChange={(e) => setStoreCategoryFilter(e.target.value)}
                          borderRadius="lg"
                        >
                          <option value="all">{t('allCategories')}</option>
                          {storeCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                      </SimpleGrid>

                      {/* Store Products Table */}
                      <Box
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="xl"
                        overflow="hidden"
                        maxH="440px"
                        overflowY="auto"
                      >
                        <TableContainer>
                          <Table variant="simple" size="sm">
                            <Thead bg={useColorModeValue('gray.100', 'gray.700')}>
                              <Tr>
                                <Th fontSize="2xs">{t('colArabicName')}</Th>
                                <Th fontSize="2xs">{t('colEnglishName')}</Th>
                                <Th fontSize="2xs">{t('colPrice')}</Th>
                                <Th fontSize="2xs">{t('colCategory')}</Th>
                                <Th fontSize="2xs">{t('colSku')}</Th>
                                <Th fontSize="2xs" textAlign="center">{t('colActions')}</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {storeFilteredProducts.length === 0 ? (
                                <Tr>
                                  <Td colSpan={6} textAlign="center" py={8} color="gray.500">
                                    <VStack spacing={2}>
                                      <FiPackage size={30} color="#cbd5e1" />
                                      <Text fontSize="sm" fontWeight="semibold">{t('noProductsFound')}</Text>
                                      <Button size="xs" colorScheme="teal" leftIcon={<FiPlus />} onClick={onQuickAddOpen}>
                                        {t('quickAddPrompt')}
                                      </Button>
                                    </VStack>
                                  </Td>
                                </Tr>
                              ) : (
                                storeFilteredProducts.map((item: any) => {
                                  const price = item.selling_price || item.cost_price || 0;
                                  return (
                                    <Tr key={item._id} _hover={{ bg: useColorModeValue('gray.50', 'gray.750') }}>
                                      <Td fontWeight="bold" fontSize="xs">
                                        <Text noOfLines={1}>{item.name_arabic || item.name}</Text>
                                      </Td>
                                      <Td fontSize="xs" color="gray.600">
                                        <Text noOfLines={1}>{item.name}</Text>
                                      </Td>
                                      <Td>
                                        <Badge colorScheme="teal" fontSize="2xs" px={1.5} py={0.5} borderRadius="md" display="inline-flex" alignItems="center">
                                          {price.toFixed(2)} <RiyalCurrencySymbol boxSize="0.9em" ml="2px" />
                                        </Badge>
                                      </Td>
                                      <Td>
                                        <Badge colorScheme="blue" variant="subtle" fontSize="3xs" borderRadius="sm">
                                          {item.category || 'عام'}
                                        </Badge>
                                      </Td>
                                      <Td fontSize="3xs" fontFamily="monospace" color="gray.500">
                                        {item.sku || '-'}
                                      </Td>
                                      <Td textAlign="center">
                                        <HStack spacing={1} justify="center">
                                          <Tooltip label="إضافة فورية للسلة">
                                            <IconButton
                                              aria-label="Add to cart"
                                              icon={<FiPlus />}
                                              size="xs"
                                              colorScheme="teal"
                                              variant="solid"
                                              onClick={() =>
                                                addToCart({
                                                  name: item.name,
                                                  nameArabic: item.name_arabic,
                                                  price,
                                                })
                                              }
                                            />
                                          </Tooltip>
                                          <Tooltip label="تعديل الصنف والسعر">
                                            <IconButton
                                              aria-label="Edit"
                                              icon={<FiEdit />}
                                              size="xs"
                                              variant="ghost"
                                              colorScheme="blue"
                                              onClick={() => {
                                                setEditingItem({ ...item });
                                                onEditItemOpen();
                                              }}
                                            />
                                          </Tooltip>
                                          <Tooltip label="حذف الصنف">
                                            <IconButton
                                              aria-label="Delete"
                                              icon={<FiTrash2 />}
                                              size="xs"
                                              variant="ghost"
                                              colorScheme="red"
                                              onClick={() =>
                                                handleDeleteProduct(item._id, item.name_arabic || item.name)
                                              }
                                            />
                                          </Tooltip>
                                        </HStack>
                                      </Td>
                                    </Tr>
                                  );
                                })
                              )}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </GridItem>

        {/* Right Sticky Checkout Panel (Visible on Desktop/Tablet) */}
        <GridItem display={{ base: 'none', lg: 'block' }}>
          <Card
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="2xl"
            boxShadow="sm"
            p={4}
            position="sticky"
            top="16px"
            minH="620px"
          >
            <CartBillPanel />
          </Card>
        </GridItem>
      </Grid>

      {/* Mobile Drawer (Sliding Bottom/Right Bill for Phones) */}
      <Drawer isOpen={isMobileCartOpen} placement="bottom" onClose={onMobileCartClose}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="3xl" maxH="85vh" p={2}>
          <DrawerCloseButton />
          <DrawerHeader pt={2} pb={0} />
          <DrawerBody p={3}>
            <CartBillPanel />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* 80mm ZATCA Thermal Receipt Modal */}
      {lastIssuedInvoice && (
        <ZatcaInvoiceReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          sellerName={
            activeVendor?.storeNameArabic ||
            activeVendor?.storeName ||
            organizationDetails?.name ||
            'شركة النجاح للتجارة والمقاولات'
          }
          sellerVatNumber={activeVendor?.vatNumber || (organizationDetails as any)?.vat_number || '310860308200003'}
          sellerCrNumber={activeVendor?.crNumber || (organizationDetails as any)?.cr_number}
          sellerAddress={(organizationDetails as any)?.address || (activeVendor ? `المملكة العربية السعودية • جوال: ${activeVendor.phone}` : undefined)}
          sellerPhone={activeVendor?.phone || (organizationDetails as any)?.phone}
          invoiceNumber={lastIssuedInvoice.invoiceNumber}
          invoiceDate={lastIssuedInvoice.date}
          invoiceTime={lastIssuedInvoice.time}
          invoiceType="simplified"
          items={lastIssuedInvoice.items}
          subtotal={lastIssuedInvoice.subtotal}
          totalVat={lastIssuedInvoice.vat}
          grandTotal={lastIssuedInvoice.grandTotal}
          currency="SAR"
        />
      )}

      {/* Quick Add Product Modal (Option 1) */}
      <QuickAddProductModal
        isOpen={isQuickAddOpen}
        onClose={onQuickAddClose}
        onProductAdded={(newProduct) => addToCart({ name: newProduct.name, nameArabic: newProduct.name_arabic, price: newProduct.selling_price })}
      />

      {/* Bulk Add Modal (Option 2 - Bulk CSV) */}
      <Modal isOpen={isBulkImportOpen} onClose={onBulkImportClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={2}>
          <ModalHeader pb={2}>
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                {t('bulkModalTitle')}
              </Text>
              <Button
                size="xs"
                variant="outline"
                leftIcon={<FiDownload />}
                colorScheme="teal"
                onClick={handleDownloadSampleCsv}
              >
                {t('downloadSampleCsv')}
              </Button>
            </HStack>
            <Text fontSize="xs" color="gray.500" fontWeight="normal">
              {t('bulkModalDesc')}
            </Text>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={3}>
            <VStack spacing={3} align="stretch">
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold">
                  بيانات الأصناف (CSV format):
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
                    {t('uploadingItems')} {bulkProgress}%
                  </Text>
                  <Progress value={bulkProgress} size="sm" colorScheme="teal" borderRadius="full" hasStripe isAnimated />
                </Box>
              )}

              <Box p={3} bg="teal.50" border="1px solid" borderColor="teal.200" borderRadius="xl" fontSize="xs" color="teal.900">
                <Text fontWeight="bold" mb={1}>الأعمدة المدعومة (10 أعمدة كاملة أو 5 أعمدة سريعة):</Text>
                <Text fontSize="2xs" color="teal.700">
                  1. الاسم بالعربي • 2. الاسم بالإنجليزي • 3. سعر البيع • 4. سعر التكلفة • 5. التصنيف • 6. الباركود • 7. الكمية • 8. الوحدة • 9. نسبة الضريبة % • 10. الحد الأدنى
                </Text>
                <Text fontSize="2xs" mt={1} color="teal.600">
                  💡 يدعم النظام النسخ واللصق المباشر من Excel أو تحميل نموذج CSV الجاهز والمتوافق 100% مع اللغة العربية.
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" pt={3}>
            <HStack spacing={2} justify="flex-end" w="100%">
              <Button variant="ghost" onClick={onBulkImportClose} borderRadius="xl" isDisabled={isBulkUploading}>
                {t('cancel')}
              </Button>
              <Button
                colorScheme="purple"
                leftIcon={<FiUploadCloud />}
                onClick={handleBulkImportProducts}
                isLoading={isBulkUploading}
                borderRadius="xl"
                fontWeight="bold"
                px={6}
              >
                {t('importNowBtn')}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Single Item Modal */}
      {editingItem && (
        <Modal isOpen={isEditItemOpen} onClose={onEditItemClose} size="md" isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl" p={2}>
            <ModalHeader pb={2}>
              <Text fontSize="lg" fontWeight="bold">
                {t('editProduct')}
              </Text>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody py={3}>
              <VStack spacing={3} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('colArabicName')}
                  </FormLabel>
                  <Input
                    value={editingItem.name_arabic || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name_arabic: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {t('colEnglishName')}
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
                      {t('colPrice')}
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
                      {t('colSku')}
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
                    {t('colCategory')}
                  </FormLabel>
                  <Input
                    value={editingItem.category || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    borderRadius="xl"
                  />
                </FormControl>

                {/* Product Image in Edit Modal */}
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold" display="flex" justifyContent="space-between">
                    <span>صورة الصنف / Product Photo</span>
                    {editingItem.image && <Badge colorScheme="teal" fontSize="2xs">Has Image</Badge>}
                  </FormLabel>
                  {editingItem.image ? (
                    <HStack p={2} borderWidth="1px" borderColor="teal.300" borderRadius="xl" bg="teal.50" justify="space-between">
                      <HStack spacing={2.5}>
                        <Image
                          src={editingItem.image}
                          alt="preview"
                          boxSize="40px"
                          objectFit="cover"
                          borderRadius="md"
                        />
                        <Text fontSize="xs" color="teal.800" fontWeight="semibold">Photo Attached</Text>
                      </HStack>
                      <IconButton
                        aria-label="Remove photo"
                        icon={<FiTrash2 />}
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => setEditingItem({ ...editingItem, image: '' })}
                      />
                    </HStack>
                  ) : (
                    <VStack
                      borderWidth="1.5px"
                      borderStyle="dashed"
                      borderColor="gray.300"
                      borderRadius="xl"
                      p={2.5}
                      spacing={1}
                      cursor="pointer"
                      as="label"
                      _hover={{ borderColor: 'teal.400', bg: 'teal.50' }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setEditingItem({ ...editingItem, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <FiUploadCloud size={20} color="#0D9488" />
                      <Text fontSize="2xs" color="teal.700" fontWeight="bold">Upload Photo / رفع صورة</Text>
                    </VStack>
                  )}
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter borderTopWidth="1px" pt={3}>
              <HStack spacing={2} justify="flex-end" w="100%">
                <Button variant="ghost" onClick={onEditItemClose} borderRadius="xl">
                  {t('cancel')}
                </Button>
                <Button colorScheme="teal" onClick={handleSaveProductEdit} borderRadius="xl" fontWeight="bold">
                  {t('saveChanges')}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* ZATCA Onboarding Modal */}
      <ZatcaOnboardingModal isOpen={isOnboardOpen} onClose={onOnboardClose} />
    </Box>
  );
};

export default VendorPosScreen;
