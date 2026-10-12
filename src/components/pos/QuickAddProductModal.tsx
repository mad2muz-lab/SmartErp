import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  SimpleGrid,
  Select,
  useToast,
  Text,
  Badge,
  Box,
  Image,
  IconButton,
} from '@chakra-ui/react';
import { FiPlus, FiTag, FiUploadCloud, FiTrash2, FiImage } from 'react-icons/fi';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/shared/AuthContext';
import { useLanguage } from '../../contexts/shared/LanguageContext';
import { vendorAuthService } from '../../services/vendorAuthService';
import { RiyalCurrencySymbol } from '../icons/SaudiRiyalIcon';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: (product: any) => void;
}

const COMMON_CATEGORIES = [
  'General / عام',
  'Beverages / مشروبات',
  'Food / مأكولات',
  'Services / خدمات',
  'Perfumes / عطور',
  'Auto & Parts / قطع غيار',
  'Electronics / إلكترونيات',
  'Clothing / ملابس',
  'Grocery / مواد غذائية',
];

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
}) => {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const toast = useToast();
  const createInventory = useMutation(api.inventory.createInventory);

  const [name, setName] = useState('');
  const [nameArabic, setNameArabic] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('General / عام');
  const [customCategory, setCustomCategory] = useState('');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Please select an image smaller than 2MB',
        status: 'warning',
        duration: 2500,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Product name required',
        description: 'Please enter a product name',
        status: 'warning',
        duration: 2500,
      });
      return;
    }

    const sellingPrice = parseFloat(price);
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Please enter a valid selling price',
        status: 'warning',
        duration: 2500,
      });
      return;
    }

    if (!user?.organizationId) {
      toast({
        title: 'Organization not found',
        description: 'Please select an organization first',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCategory = customCategory.trim() || category;
      const generatedSku = sku.trim() || `SKU-${Date.now().toString().slice(-6)}`;
      const prodId = `prod_${Date.now()}`;

      // Always save to vendor catalog
      vendorAuthService.addVendorProduct({
        id: prodId,
        name: name.trim(),
        nameArabic: nameArabic.trim() || name.trim(),
        price: sellingPrice,
        costPrice: sellingPrice,
        category: finalCategory,
        categoryArabic: finalCategory,
        sku: generatedSku,
        quantity: 100,
        unit: 'Pcs',
        vatRate: 15,
        image: imageUrl || undefined,
        imageUrl: imageUrl || undefined,
      });

      // Also attempt to sync to Convex DB
      let newId: any = prodId;
      if (user?.organizationId) {
        try {
          const res = await createInventory({
            organization_id: user.organizationId as any,
            name: name.trim(),
            name_arabic: nameArabic.trim() || name.trim(),
            selling_price: sellingPrice,
            cost_price: sellingPrice,
            category: finalCategory,
            category_arabic: finalCategory,
            sku: generatedSku,
            unit: 'Pcs',
            quantity: 100,
            min_quantity: 5,
            created_by: user.email || 'cashier',
          });
          if (res) newId = res;
        } catch (e) {
          // Safe fallback for vendor mode
        }
      }

      toast({
        title: 'تمت إضافة الصنف بنجاح',
        description: `${nameArabic || name} (${sellingPrice.toFixed(2)} \uE900)`,
        status: 'success',
        duration: 3000,
      });

      if (onProductAdded) {
        onProductAdded({
          _id: newId,
          id: newId,
          name: name.trim(),
          name_arabic: nameArabic.trim() || name.trim(),
          nameArabic: nameArabic.trim() || name.trim(),
          selling_price: sellingPrice,
          price: sellingPrice,
          category: finalCategory,
          sku: generatedSku,
          image: imageUrl || undefined,
          imageUrl: imageUrl || undefined,
        });
      }

      // Reset
      setName('');
      setNameArabic('');
      setPrice('');
      setSku('');
      setCustomCategory('');
      setImageUrl('');
      onClose();
    } catch (error: any) {
      console.error('Failed to create inventory:', error);
      toast({
        title: 'Failed to add product',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2} dir={dir}>
        <ModalHeader pb={2}>
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">
              {t('quickAddTitle')}
            </Text>
            <Badge colorScheme="teal" borderRadius="full" px={2}>
              POS Ready
            </Badge>
          </HStack>
          <Text fontSize="xs" color="gray.500" fontWeight="normal">
            {t('quickAddSub')}
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={3}>
          <VStack spacing={3.5} align="stretch">
            {/* Arabic Name */}
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="bold" mb={1}>
                {t('productArabicName')}
              </FormLabel>
              <Input
                placeholder="مثال: عطر مسك أبيض 50 مل / قهوة لاتيه"
                value={nameArabic}
                onChange={(e) => setNameArabic(e.target.value)}
                dir="rtl"
                borderRadius="xl"
              />
            </FormControl>

            {/* English Name */}
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="bold" mb={1}>
                {t('productEnglishName')}
              </FormLabel>
              <Input
                placeholder="e.g. White Musk Perfume 50ml / Cafe Latte"
                value={name}
                onChange={(e) => setName(e.target.value)}
                borderRadius="xl"
              />
            </FormControl>

            {/* Price & SKU */}
            <SimpleGrid columns={2} spacing={3}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold" mb={1} display="inline-flex" alignItems="center">
                  {t('priceVatIncl')} (<RiyalCurrencySymbol boxSize="0.85em" />)
                </FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  borderRadius="xl"
                  fontWeight="bold"
                  color="teal.600"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" mb={1}>
                  {t('barcodeOptional')}
                </FormLabel>
                <Input
                  placeholder="Scan or auto-gen"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  borderRadius="xl"
                />
              </FormControl>
            </SimpleGrid>

            {/* Category */}
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="bold" mb={1}>
                {t('productCategory')}
              </FormLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                borderRadius="xl"
                mb={2}
              >
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="custom">{t('customCategoryOpt')}</option>
              </Select>
              {category === 'custom' && (
                <Input
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  borderRadius="xl"
                  size="sm"
                />
              )}
            </FormControl>

            {/* Product Image Upload / Preview */}
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="bold" mb={1} display="flex" alignItems="center" justifyContent="space-between">
                <HStack spacing={1.5}>
                  <FiImage />
                  <span>Product Image / صورة الصنف</span>
                </HStack>
                {imageUrl && (
                  <Badge colorScheme="green" fontSize="2xs" borderRadius="md">
                    Image Loaded
                  </Badge>
                )}
              </FormLabel>

              {imageUrl ? (
                <HStack p={2} borderWidth="1px" borderColor="teal.300" borderRadius="xl" bg="teal.50" justify="space-between">
                  <HStack spacing={3}>
                    <Image
                      src={imageUrl}
                      alt="Product preview"
                      boxSize="48px"
                      objectFit="cover"
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="gray.200"
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" fontWeight="bold" color="teal.800">Product Photo Ready</Text>
                      <Text fontSize="2xs" color="gray.500">Will display on POS Touch Tile</Text>
                    </VStack>
                  </HStack>
                  <IconButton
                    aria-label="Remove image"
                    icon={<FiTrash2 />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => setImageUrl('')}
                  />
                </HStack>
              ) : (
                <VStack
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor="gray.300"
                  borderRadius="xl"
                  p={3}
                  spacing={2}
                  _hover={{ borderColor: 'teal.400', bg: 'teal.50' }}
                  cursor="pointer"
                  as="label"
                  transition="all 0.2s"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />
                  <FiUploadCloud size={24} color="#0D9488" />
                  <VStack spacing={0}>
                    <Text fontSize="xs" fontWeight="bold" color="teal.700">
                      Upload Product Photo / رفع صورة
                    </Text>
                    <Text fontSize="2xs" color="gray.500">
                      JPG, PNG, WebP up to 2MB (or enter URL below)
                    </Text>
                  </VStack>
                </VStack>
              )}

              {/* Or Direct Image URL input */}
              {!imageUrl && (
                <Input
                  mt={2}
                  size="xs"
                  placeholder="Or paste image URL (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  borderRadius="lg"
                />
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" pt={3}>
          <HStack spacing={2} w="100%" justify="flex-end">
            <Button variant="ghost" onClick={onClose} borderRadius="xl">
              {t('cancelBtn')}
            </Button>
            <Button
              colorScheme="teal"
              leftIcon={<FiPlus />}
              onClick={handleSave}
              isLoading={isSubmitting}
              borderRadius="xl"
              fontWeight="bold"
              px={6}
            >
              {t('saveToPosBtn')}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
