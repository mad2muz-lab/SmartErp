import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  useToast,
  useColorModeValue,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Badge,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/shared/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FiPhone, FiLock, FiShoppingBag, FiShield, FiKey, FiArrowRight, FiUserPlus } from 'react-icons/fi';
import { vendorAuthService, VendorAccount } from '../services/vendorAuthService';

const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loginVendor } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Vendor Login State
  const [vendorIdentifier, setVendorIdentifier] = useState('');
  const [vendorPassword, setVendorPassword] = useState('123456');
  const [isLoadingVendor, setIsLoadingVendor] = useState(false);

  // 2FA Challenge Modal State
  const { isOpen: is2FAOpen, onOpen: on2FAOpen, onClose: on2FAClose } = useDisclosure();
  const [pendingVendor, setPendingVendor] = useState<VendorAccount | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [active2FAOtp, setActive2FAOtp] = useState('');

  // Password Reset Modal State
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [generatedResetOtp, setGeneratedResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetStep2, setIsResetStep2] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // --- Vendor Sign In Flow ---
  const handleVendorLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = vendorIdentifier.trim();
    if (!cleanId) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى إدخال رقم الجوال / Please enter mobile number',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    const effectivePassword = vendorPassword.trim() || '123456';

    setIsLoadingVendor(true);
    try {
      const result = await vendorAuthService.verifyVendorCredentials(cleanId, effectivePassword);
      if (!result.success || !result.vendor) {
        toast({
          title: 'فشل تسجيل الدخول',
          description: result.error,
          status: 'error',
          duration: 3500,
        });
        setIsLoadingVendor(false);
        return;
      }

      // Instant entry to POS cashier
      if (loginVendor) {
        loginVendor(result.vendor);
      } else {
        vendorAuthService.startVendorSession(result.vendor);
      }

      toast({
        title: 'أهلاً بك مجدداً!',
        description: `${result.vendor.storeNameArabic || result.vendor.storeName} (${result.vendor.ownerName})`,
        status: 'success',
        duration: 2000,
      });

      navigate('/pos');
    } catch (err: any) {
      toast({
        title: 'خطأ غير متوقع',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoadingVendor(false);
    }
  };

  // Verify 2FA & complete vendor session
  const handleConfirm2FA = () => {
    if (!pendingVendor) return;
    const isValid = vendorAuthService.verifyToken(pendingVendor.phone, twoFactorCode, '2FA_LOGIN');

    if (!isValid && twoFactorCode !== active2FAOtp) {
      toast({
        title: 'رمز غير صحيح',
        description: 'رمز التحقق غير صالح أو انتهت صلاحيته / Invalid or expired code',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (loginVendor) {
      loginVendor(pendingVendor);
    } else {
      vendorAuthService.startVendorSession(pendingVendor);
    }
    on2FAClose();

    toast({
      title: 'تم التحقق بنجاح!',
      description: `أهلاً بك في نقطة البيع: ${pendingVendor.storeNameArabic || pendingVendor.storeName}`,
      status: 'success',
      duration: 2500,
    });

    navigate('/pos');
  };

  // --- Password Reset Flow ---
  const handleSendResetCode = () => {
    const cleanId = resetIdentifier.trim().replace(/\s+/g, '');
    if (!cleanId) {
      toast({
        title: 'أدخل رقم الجوال أو البريد',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    const code = vendorAuthService.createVerificationCode(cleanId, 'PASSWORD_RESET');
    setGeneratedResetOtp(code);
    setIsResetStep2(true);

    toast({
      title: 'رمز استعادة كلمة المرور',
      description: `رمز الاستعادة المؤقت: ${code} (Simulated SMS)`,
      status: 'info',
      duration: 10000,
      isClosable: true,
    });
  };

  const handleCompleteReset = async () => {
    if (newPassword.length < 6) {
      toast({
        title: 'كلمة المرور قصيرة',
        description: 'يجب ألا تقل عن 6 خانات',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    setIsResetting(true);
    const result = await vendorAuthService.resetPassword(resetIdentifier, resetCode, newPassword);
    setIsResetting(false);

    if (!result.success) {
      toast({
        title: 'فشل التعيين',
        description: result.error,
        status: 'error',
        duration: 3000,
      });
      return;
    }

    toast({
      title: 'تم تغيير كلمة المرور بنجاح!',
      description: 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة',
      status: 'success',
      duration: 3500,
    });

    onResetClose();
    setIsResetStep2(false);
    setResetCode('');
    setNewPassword('');
  };

  return (
    <Container maxW="lg" py={{ base: '8', md: '16' }} px={{ base: '4', sm: '8' }}>
      <VStack spacing="6">
        {/* App Title */}
        <VStack spacing="1" textAlign="center">
          <HStack spacing={2} justify="center">
            <Box p={2.5} bg="blue.600" color="white" borderRadius="xl">
              <FiShoppingBag size={24} />
            </Box>
            <Heading size="lg" color="blue.600">
              Trading ERP
            </Heading>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            بوابة تسجيل الدخول الآمنة • Secure Business Portal
          </Text>
        </VStack>

        <Card bg={cardBg} border="1px" borderColor={borderColor} w="full" borderRadius="2xl" shadow="md">
          <CardBody p={{ base: 4, sm: 6 }}>
            <Tabs isFitted variant="soft-rounded" colorScheme="blue">
              <TabList mb={5} p={1} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="xl">
                <Tab fontSize="xs" fontWeight="bold" borderRadius="lg">
                  🏪 التجار ونقاط البيع (Vendors)
                </Tab>
                <Tab fontSize="xs" fontWeight="bold" borderRadius="lg">
                  🏢 موظفي الشركة (Company)
                </Tab>
              </TabList>

              <TabPanels>
                {/* TAB 1: VENDORS (Mobile 2FA & Password) */}
                <TabPanel p={0}>
                  <form onSubmit={handleVendorLoginSubmit}>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold">
                          رقم الجوال أو البريد الإلكتروني
                        </FormLabel>
                        <Input
                          placeholder="+966 5X XXX XXXX (أدخل رقم الجوال)"
                          value={vendorIdentifier}
                          onChange={(e) => setVendorIdentifier(e.target.value)}
                          borderRadius="xl"
                          dir="ltr"
                        />
                      </FormControl>

                      <FormControl>
                        <HStack justify="space-between" mb={1}>
                          <FormLabel fontSize="xs" fontWeight="bold" m={0}>
                            كلمة المرور
                          </FormLabel>
                          <Button
                            variant="link"
                            size="xs"
                            colorScheme="blue"
                            onClick={() => {
                              setResetIdentifier(vendorIdentifier);
                              setIsResetStep2(false);
                              onResetOpen();
                            }}
                          >
                            نسيت كلمة المرور؟
                          </Button>
                        </HStack>
                        <Input
                          type="password"
                          placeholder="كلمة المرور (الافتراضية: 123456)"
                          value={vendorPassword}
                          onChange={(e) => setVendorPassword(e.target.value)}
                          borderRadius="xl"
                        />
                        <Text fontSize="2xs" color="teal.600" mt={1}>
                          ⚡ مفتوح للتجربة المحلية: كلمة المرور الافتراضية هي <strong>123456</strong>
                        </Text>
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="teal"
                        size="md"
                        w="full"
                        h="48px"
                        borderRadius="xl"
                        fontWeight="bold"
                        isLoading={isLoadingVendor}
                        rightIcon={<FiArrowRight />}
                      >
                        دخول مباشر للكاشير • Instant Open POS
                      </Button>

                      <Divider my={1} />

                      {/* Vendor Onboarding Link */}
                      <Button
                        variant="outline"
                        colorScheme="teal"
                        size="md"
                        w="full"
                        h="46px"
                        borderRadius="xl"
                        fontWeight="bold"
                        leftIcon={<FiUserPlus />}
                        onClick={() => navigate('/vendor-onboarding')}
                      >
                        انضمام متجر جديد • Register New Vendor
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* TAB 2: COMPANY EMPLOYEES (Google OAuth / SSO) */}
                <TabPanel p={0}>
                  <VStack spacing={5} textAlign="center">
                    <Box p={3} bg="blue.50" color="blue.600" borderRadius="full">
                      <FiShield size={32} />
                    </Box>
                    <VStack spacing={1}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">
                        حسابات منسوبي الشركة والمؤسسة
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        تسجيل الدخول مخصص للموظفين والإداريين عبر حساب الشركة الرسمي
                      </Text>
                    </VStack>

                    <Button
                      onClick={loginWithGoogle}
                      colorScheme="blue"
                      size="lg"
                      w="full"
                      borderRadius="xl"
                      leftIcon={<FcGoogle />}
                      _hover={{
                        transform: 'translateY(-1px)',
                        boxShadow: 'md',
                      }}
                    >
                      الدخول بحساب Google الرسمي
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* --- 2FA Verification Modal --- */}
      <Modal isOpen={is2FAOpen} onClose={on2FAClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={2}>
          <ModalHeader textAlign="center" pb={1}>
            <VStack spacing={1}>
              <Box p={2.5} bg="teal.50" color="teal.600" borderRadius="full">
                <FiLock size={26} />
              </Box>
              <Text fontSize="md" fontWeight="bold">
                التحقق الثنائي (2FA Verification)
              </Text>
              <Text fontSize="xs" color="gray.500">
                أدخل رمز التحقق المرسل لجوالك: {pendingVendor?.phone}
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={3}>
            {active2FAOtp && (
              <Box mb={3} p={2} bg="orange.50" borderRadius="lg" textAlign="center">
                <Text fontSize="2xs" color="orange.700" fontWeight="bold">
                  رمز التحقق (Simulated SMS OTP):
                </Text>
                <Text fontSize="xl" fontWeight="black" fontFamily="monospace" color="orange.800" letterSpacing="widest">
                  {active2FAOtp}
                </Text>
              </Box>
            )}

            <FormControl isRequired>
              <Input
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
                textAlign="center"
                fontSize="2xl"
                fontWeight="bold"
                letterSpacing="0.3em"
                borderRadius="xl"
                h="52px"
                autoFocus
              />
            </FormControl>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" pt={3}>
            <Button colorScheme="teal" w="100%" borderRadius="xl" fontWeight="bold" onClick={handleConfirm2FA}>
              تأكيد الدخول
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- Self-Service Password Reset Modal --- */}
      <Modal isOpen={isResetOpen} onClose={onResetClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={2}>
          <ModalHeader pb={1}>
            <HStack spacing={2}>
              <Box p={2} bg="blue.50" color="blue.600" borderRadius="lg">
                <FiKey size={18} />
              </Box>
              <Text fontSize="md" fontWeight="bold">
                استعادة كلمة المرور • Password Reset
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={3}>
            {!isResetStep2 ? (
              <VStack spacing={3} align="stretch">
                <Text fontSize="xs" color="gray.600">
                  أدخل رقم الجوال أو البريد الإلكتروني المسجل لإرسال رمز التحقق:
                </Text>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">رقم الجوال أو البريد</FormLabel>
                  <Input
                    placeholder="+966 5X XXX XXXX"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    borderRadius="xl"
                    dir="ltr"
                  />
                </FormControl>
                <Button colorScheme="blue" borderRadius="xl" onClick={handleSendResetCode} mt={2}>
                  إرسال رمز الاستعادة (Send Code)
                </Button>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                {generatedResetOtp && (
                  <Box p={2} bg="orange.50" borderRadius="lg" textAlign="center">
                    <Text fontSize="2xs" color="orange.700" fontWeight="bold">
                      رمز الاستعادة (Simulated SMS):
                    </Text>
                    <Text fontSize="lg" fontWeight="black" fontFamily="monospace" color="orange.800" letterSpacing="widest">
                      {generatedResetOtp}
                    </Text>
                  </Box>
                )}

                <FormControl isRequired>
                  <FormLabel fontSize="xs">رمز التحقق (6 أرقام)</FormLabel>
                  <Input
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    maxLength={6}
                    textAlign="center"
                    fontSize="xl"
                    fontWeight="bold"
                    letterSpacing="0.2em"
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">كلمة المرور الجديدة</FormLabel>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    borderRadius="xl"
                  />
                </FormControl>

                <Button
                  colorScheme="teal"
                  borderRadius="xl"
                  fontWeight="bold"
                  onClick={handleCompleteReset}
                  isLoading={isResetting}
                  mt={2}
                >
                  تأكيد كلمة المرور الجديدة
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default LoginScreen;
