import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Card,
  CardBody,
  useToast,
  Select,
  SimpleGrid,
  Progress,
  Badge,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  FiShoppingBag,
  FiUser,
  FiPhone,
  FiLock,
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiGlobe,
  FiChevronDown,
  FiEdit3,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { vendorAuthService } from '../services/vendorAuthService';
import { useAuth } from '../contexts/shared/AuthContext';
import { useLanguage } from '../contexts/shared/LanguageContext';
import { onboardingTranslations } from '../utils/onboardingTranslations';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../utils/posTranslations';

const BUSINESS_CATEGORIES = [
  'Coffee Shop & Cafe / مقهى ومشروبات',
  'Perfumes & Cosmetics / عطور وتجميل',
  'Automotive & Care / خدمات وسيارات',
  'Barber & Salon / صالون وحلاقة',
  'Retail & Grocery / تموينات وتجزئة',
  'General Trading / تجارة عامة وخدمات',
  'CUSTOM_OTHER',
];

export const VendorOnboardingScreen: React.FC = () => {
  const { loginVendor } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Multi-Language state (Universal across app)
  const { currentLanguage: lang, setLanguage, activeLangConfig, t } = useLanguage();

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
  };

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Business Details
  const [storeName, setStoreName] = useState('');
  const [storeNameArabic, setStoreNameArabic] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [vatNumber, setVatNumber] = useState('310860308200003');
  const [crNumber, setCrNumber] = useState('1010987654');

  // Effective business category
  const effectiveCategory = selectedCategory === 'CUSTOM_OTHER'
    ? (customCategory.trim() || 'Other / نشاط مخصص')
    : selectedCategory;

  // Step 2: Credentials & Mobile
  const [phone, setPhone] = useState('+966 5');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 3: 2FA Verification
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Translations for custom category
  const customCategoryLabels: Record<SupportedLanguage, { option: string; label: string; placeholder: string }> = {
    ar: {
      option: '✨ نشاط تجاري آخر (مخصص)...',
      label: 'اكتب اسم النشاط التجاري المخصص',
      placeholder: 'مثال: صيدلية، مخبز وحلويات، مغسلة ملابس...',
    },
    en: {
      option: '✨ Other / Custom Category...',
      label: 'Specify Custom Business Category',
      placeholder: 'e.g. Pharmacy, Bakery, Dry Cleaning...',
    },
    hi: {
      option: '✨ अन्य / कस्टम व्यापार श्रेणी...',
      label: 'कस्टम व्यापार श्रेणी दर्ज करें',
      placeholder: 'उदा. फार्मेसी, बेकरी, लॉन्ड्री...',
    },
    ur: {
      option: '✨ دیگر / اپنی مرضی کا تجارتی زمرہ...',
      label: 'اپنے تجارتی زمرے کا نام درج کریں',
      placeholder: 'مثال: فارمیسی، بیکری، ڈرائی کلیننگ...',
    },
    bn: {
      option: '✨ অন্যান্য / কাস্টম ব্যবসার ধরন...',
      label: 'কাস্টম ব্যবসার ধরন লিখুন',
      placeholder: 'যেমন: ফার্মেসি, বেকারি, লন্ড্রি...',
    },
    ne: {
      option: '✨ अन्य / अनुकूलित व्यवसाय वर्ग...',
      label: 'आफ्नो व्यवसायको वर्ग लेख्नुहोस्',
      placeholder: 'उदा. फार्मेसी, बेकरी, कपडा धुलाई...',
    },
    tl: {
      option: '✨ Iba pa / Custom na Kategorya...',
      label: 'Ilagay ang Custom na Kategorya ng Negosyo',
      placeholder: 'Hal. Parmasya, Panaderya, Labahan...',
    },
  };

  const customText = customCategoryLabels[lang] || customCategoryLabels.en;

  // Validate and advance from Step 1 to Step 2
  const handleNextStep1 = () => {
    if (!storeName.trim() || !ownerName.trim()) {
      toast({
        title: t('missingDataTitle'),
        description: t('missingDataDesc'),
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (selectedCategory === 'CUSTOM_OTHER' && !customCategory.trim()) {
      toast({
        title: t('missingDataTitle'),
        description: customText.label,
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setStep(2);
  };

  // Validate and advance from Step 2 to Step 3 (generate 2FA OTP)
  const handleNextStep2 = () => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone.length < 9) {
      toast({
        title: t('invalidPhoneDesc'),
        description: t('invalidPhoneDesc'),
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    const effectivePass = password || '123456';
    const effectiveConfirm = confirmPassword || '123456';

    if (effectivePass.length < 6) {
      toast({
        title: t('shortPasswordDesc'),
        description: t('shortPasswordDesc'),
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (effectivePass !== effectiveConfirm) {
      toast({
        title: t('passwordMismatchDesc'),
        description: t('passwordMismatchDesc'),
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Generate 2FA code
    const code = vendorAuthService.createVerificationCode(cleanPhone, 'PHONE_VERIFY');
    setGeneratedOtp(code);
    setOtpCode(code); // Pre-fill OTP code for seamless user progress
    setStep(3);

    toast({
      title: 'رمز التحقق (2FA Code)',
      description: `${t('simulatedOtpTitle')} ${code}`,
      status: 'info',
      duration: 10000,
      isClosable: true,
    });
  };

  // Final Step: Complete Registration & 2FA
  const handleCompleteOnboarding = async () => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const currentOtp = otpCode || generatedOtp;
    const isValid = vendorAuthService.verifyToken(cleanPhone, currentOtp, 'PHONE_VERIFY');

    if (!isValid && currentOtp !== generatedOtp) {
      toast({
        title: t('invalidOtpDesc'),
        description: t('invalidOtpDesc'),
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await vendorAuthService.registerVendor({
        storeName: storeName.trim(),
        storeNameArabic: (storeNameArabic || storeName).trim(),
        ownerName: ownerName.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        password: password || '123456',
        vatNumber: vatNumber?.trim() || '310860308200003',
        crNumber: crNumber?.trim() || '1010987654',
        businessCategory: effectiveCategory,
      });

      if (!result.success || !result.vendor) {
        toast({
          title: 'Error',
          description: result.error,
          status: 'error',
          duration: 4000,
        });
        setIsSubmitting(false);
        return;
      }

      // Automatically launch vendor session in AuthContext & storage
      if (loginVendor) {
        loginVendor(result.vendor);
      } else {
        vendorAuthService.startVendorSession(result.vendor);
      }

      toast({
        title: 'تم تسجيل المتجر بنجاح!',
        description: `${result.vendor.storeNameArabic || result.vendor.storeName} - جاهز للبيع!`,
        status: 'success',
        duration: 2500,
      });

      navigate('/pos');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRtl = activeLangConfig.dir === 'rtl';

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, blue.50, teal.50, gray.100)"
      py={{ base: 6, md: 10 }}
      px={4}
      dir={activeLangConfig.dir}
    >
      <Container maxW="2xl">
        <VStack spacing={6} align="stretch">
          {/* Top Bar with Language Switcher & Back Link */}
          <HStack justify="space-between" align="center">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={isRtl ? <FiArrowRight /> : <FiArrowLeft />}
              onClick={() => navigate('/login')}
              borderRadius="xl"
            >
              {t('signInHere')}
            </Button>

            {/* Language Selector Dropdown */}
            <Menu placement="bottom-end">
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                bg="white"
                shadow="sm"
                borderRadius="xl"
                leftIcon={<FiGlobe />}
                rightIcon={<FiChevronDown />}
              >
                {activeLangConfig.flag} {activeLangConfig.nativeName}
              </MenuButton>
              <MenuList zIndex={100} shadow="lg" borderRadius="xl">
                {SUPPORTED_LANGUAGES.map((item) => (
                  <MenuItem
                    key={item.code}
                    onClick={() => handleLanguageChange(item.code)}
                    fontWeight={lang === item.code ? 'bold' : 'normal'}
                    color={lang === item.code ? 'teal.600' : 'inherit'}
                  >
                    <HStack justify="space-between" w="100%">
                      <Text>
                        {item.flag} {item.nativeName}
                      </Text>
                      <Badge size="sm" variant="subtle" colorScheme="gray">
                        {item.code.toUpperCase()}
                      </Badge>
                    </HStack>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </HStack>

          {/* Header */}
          <VStack spacing={2} textAlign="center">
            <HStack spacing={2} justify="center">
              <Box p={3} bg="teal.500" color="white" borderRadius="2xl" shadow="md">
                <FiShoppingBag size={28} />
              </Box>
              <VStack align="start" spacing={0}>
                <Heading size="md" color="gray.800">
                  {t('title')}
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  {t('subtitle')}
                </Text>
              </VStack>
            </HStack>

            {/* Stepper Progress */}
            <Box w="100%" pt={2}>
              <Progress value={(step / 3) * 100} size="xs" colorScheme="teal" borderRadius="full" hasStripe isAnimated />
              <HStack justify="space-between" mt={1} fontSize="2xs" color="gray.500">
                <Text fontWeight={step >= 1 ? 'bold' : 'normal'} color={step >= 1 ? 'teal.600' : undefined}>
                  {t('step1')}
                </Text>
                <Text fontWeight={step >= 2 ? 'bold' : 'normal'} color={step >= 2 ? 'teal.600' : undefined}>
                  {t('step2')}
                </Text>
                <Text fontWeight={step >= 3 ? 'bold' : 'normal'} color={step >= 3 ? 'teal.600' : undefined}>
                  {t('step3')}
                </Text>
              </HStack>
            </Box>
          </VStack>

          {/* Form Card */}
          <Card bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} shadow="sm">
            <CardBody p={{ base: 5, md: 8 }}>
              {/* STEP 1: Store & Owner Information */}
              {step === 1 && (
                <VStack spacing={4} align="stretch">
                  <Text fontSize="sm" fontWeight="bold" color="teal.700" pb={1} borderBottomWidth="1px">
                    {t('step1Header')}
                  </Text>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold">
                        {t('storeNameArabic')}
                      </FormLabel>
                      <Input
                        placeholder={t('storeNameArabicPlaceholder')}
                        value={storeNameArabic}
                        onChange={(e) => setStoreNameArabic(e.target.value)}
                        borderRadius="xl"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold">
                        {t('storeNameEnglish')}
                      </FormLabel>
                      <Input
                        placeholder={t('storeNameEnglishPlaceholder')}
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        borderRadius="xl"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold">
                      {t('ownerName')}
                    </FormLabel>
                    <Input
                      placeholder={t('ownerNamePlaceholder')}
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      borderRadius="xl"
                    />
                  </FormControl>

                  {/* Category Selection */}
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">
                      {t('businessCategory')}
                    </FormLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      borderRadius="xl"
                      borderColor={selectedCategory === 'CUSTOM_OTHER' ? 'teal.400' : undefined}
                    >
                      {BUSINESS_CATEGORIES.map((cat, i) => (
                        <option key={i} value={cat}>
                          {cat === 'CUSTOM_OTHER' ? customText.option : cat}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Custom Category Input (shown when CUSTOM_OTHER is selected) */}
                  {selectedCategory === 'CUSTOM_OTHER' && (
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold" color="teal.700">
                        <HStack spacing={1}>
                          <FiEdit3 />
                          <Text>{customText.label}</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        placeholder={customText.placeholder}
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        borderRadius="xl"
                        bg="teal.50"
                        borderColor="teal.300"
                        _focus={{ borderColor: 'teal.500', bg: 'white' }}
                        autoFocus
                      />
                      <FormHelperText fontSize="2xs">
                        {lang === 'ar'
                          ? 'يمكنك كتابة أي نشاط تجاري ترغب به وسيتم اعتماده مباشرة لمتجرك وفواتيرك'
                          : 'Enter your custom business activity to be printed on receipts and reports'}
                      </FormHelperText>
                    </FormControl>
                  )}

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold">
                        {t('vatNumber')}
                      </FormLabel>
                      <Input
                        value={vatNumber}
                        onChange={(e) => setVatNumber(e.target.value)}
                        borderRadius="xl"
                        dir="ltr"
                        fontFamily="monospace"
                        placeholder="310860308200003"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold">
                        {t('crNumber')}
                      </FormLabel>
                      <Input
                        value={crNumber}
                        onChange={(e) => setCrNumber(e.target.value)}
                        borderRadius="xl"
                        dir="ltr"
                        fontFamily="monospace"
                        placeholder="1010987654"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <Button
                    colorScheme="teal"
                    size="lg"
                    borderRadius="xl"
                    fontWeight="bold"
                    rightIcon={isRtl ? <FiArrowLeft /> : <FiArrowRight />}
                    mt={4}
                    onClick={handleNextStep1}
                  >
                    {t('btnNextStep1')}
                  </Button>
                </VStack>
              )}

              {/* STEP 2: Mobile Number & Password Setup */}
              {step === 2 && (
                <VStack spacing={4} align="stretch">
                  <Text fontSize="sm" fontWeight="bold" color="teal.700" pb={1} borderBottomWidth="1px">
                    {t('step2Header')}
                  </Text>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold">
                      {t('phoneLabel')}
                    </FormLabel>
                    <Input
                      placeholder="+966 5X XXX XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      borderRadius="xl"
                      dir="ltr"
                      fontFamily="monospace"
                    />
                    <FormHelperText fontSize="2xs">
                      {t('phoneHelp')}
                    </FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">
                      {t('emailLabel')}
                    </FormLabel>
                    <Input
                      type="email"
                      placeholder="store@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      borderRadius="xl"
                      dir="ltr"
                    />
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold">
                        {t('passwordLabel')}
                      </FormLabel>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        borderRadius="xl"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold">
                        {t('confirmPasswordLabel')}
                      </FormLabel>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        borderRadius="xl"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <HStack spacing={3} mt={4}>
                    <Button
                      variant="outline"
                      borderRadius="xl"
                      onClick={() => setStep(1)}
                      flex={1}
                      leftIcon={isRtl ? <FiArrowRight /> : <FiArrowLeft />}
                    >
                      {t('btnBack')}
                    </Button>
                    <Button
                      colorScheme="teal"
                      borderRadius="xl"
                      fontWeight="bold"
                      rightIcon={isRtl ? <FiArrowLeft /> : <FiArrowRight />}
                      onClick={handleNextStep2}
                      flex={2}
                      h="48px"
                    >
                      {t('btnSendOtp')}
                    </Button>
                  </HStack>
                </VStack>
              )}

              {/* STEP 3: 2FA Mobile Verification & Activation */}
              {step === 3 && (
                <VStack spacing={5} align="stretch" textAlign="center">
                  <Box p={3} bg="teal.50" color="teal.600" borderRadius="full" w="fit-content" mx="auto">
                    <FiShield size={32} />
                  </Box>

                  <VStack spacing={1}>
                    <Heading size="sm" color="gray.800">
                      {t('step3Header')}
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      {t('step3Sub')} <strong>{phone}</strong>
                    </Text>
                  </VStack>

                  {generatedOtp && (
                    <Box p={3} bg="orange.50" borderRadius="xl" borderWidth="1px" borderColor="orange.200">
                      <Text fontSize="2xs" color="orange.700" fontWeight="bold">
                        {t('simulatedOtpTitle')}
                      </Text>
                      <Text fontSize="2xl" fontWeight="black" fontFamily="monospace" color="orange.800" letterSpacing="widest">
                        {generatedOtp}
                      </Text>
                    </Box>
                  )}

                  <FormControl isRequired>
                    <Input
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      textAlign="center"
                      fontSize="2xl"
                      fontWeight="bold"
                      fontFamily="monospace"
                      letterSpacing="0.4em"
                      borderRadius="xl"
                      h="56px"
                      autoFocus
                    />
                  </FormControl>

                  <HStack spacing={3} mt={2}>
                    <Button
                      variant="ghost"
                      borderRadius="xl"
                      onClick={() => setStep(2)}
                      flex={1}
                      leftIcon={isRtl ? <FiArrowRight /> : <FiArrowLeft />}
                    >
                      {t('btnBack')}
                    </Button>
                    <Button
                      colorScheme="teal"
                      borderRadius="xl"
                      fontWeight="bold"
                      leftIcon={<FiCheckCircle />}
                      onClick={handleCompleteOnboarding}
                      isLoading={isSubmitting}
                      flex={2}
                      h="50px"
                    >
                      {t('btnActivate')}
                    </Button>
                  </HStack>
                </VStack>
              )}
            </CardBody>
          </Card>

          {/* Back to Login link */}
          <HStack justify="center" spacing={1} fontSize="xs" color="gray.500">
            <Text>{t('alreadyHaveAccount')}</Text>
            <Button variant="link" colorScheme="teal" fontSize="xs" onClick={() => navigate('/login')}>
              {t('signInHere')}
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default VendorOnboardingScreen;
