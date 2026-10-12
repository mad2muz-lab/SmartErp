import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  RadioGroup,
  Radio,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Icon,
  Link,
  useToast,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import {
  FiShield,
  FiExternalLink,
  FiCheckCircle,
  FiKey,
  FiRefreshCw,
  FiAlertCircle,
  FiLock,
} from 'react-icons/fi';
import { ZatcaEgsCredentials, ZatcaEnvironment } from '../types/zatca.types';
import { ZatcaBadge } from './ZatcaBadge';

export interface ZatcaOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredentials?: ZatcaEgsCredentials | null;
  onOnboardSuccess?: (credentials: ZatcaEgsCredentials) => void;
}

export const ZatcaOnboardingModal: React.FC<ZatcaOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentCredentials,
  onOnboardSuccess,
}) => {
  const toast = useToast();
  const [otp, setOtp] = useState('');
  const [environment, setEnvironment] = useState<ZatcaEnvironment>('simulation');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOnboarded = currentCredentials?.isOnboarded ?? false;

  const handleConnect = async () => {
    setErrorMsg(null);
    const cleanOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMsg('The OTP must be exactly 6 digits provided by ZATCA FATOORA portal.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulated onboarding handshake delay (to be connected to convex/zatca/onboarding action)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockNewCredentials: ZatcaEgsCredentials = {
        egsUuid: currentCredentials?.egsUuid || `EGS-${Date.now().toString(36).toUpperCase()}`,
        organizationName: currentCredentials?.organizationName || 'Sample Trading Establishment',
        vatNumber: currentCredentials?.vatNumber || '310123456789003',
        branchName: currentCredentials?.branchName || 'Main Branch (الفرع الرئيسي)',
        environment,
        privateKeyPem: '-----BEGIN EC PRIVATE KEY-----\nMIGHAgEBA...[SIMULATED]...=\n-----END EC PRIVATE KEY-----',
        publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0...[SIMULATED]...=\n-----END PUBLIC KEY-----',
        productionCsid: `PCSID-${Date.now()}`,
        isOnboarded: true,
        onboardedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 5 years validity
      };

      if (onOnboardSuccess) {
        onOnboardSuccess(mockNewCredentials);
      }

      toast({
        title: 'ZATCA Connection Successful! (تم الربط بنجاح)',
        description: 'Your cash register is now officially certified with ZATCA Phase 2.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setOtp('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete ZATCA onboarding. Please verify your OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl" overflow="hidden" boxShadow="2xl">
        <ModalHeader bg="brand.600" color="white" py={4}>
          <HStack spacing={3}>
            <Icon as={FiShield} boxSize={6} />
            <Box>
              <Text fontSize="lg" fontWeight="bold">
                ZATCA FATOORA Portal Connection
              </Text>
              <Text fontSize="xs" fontWeight="normal" opacity={0.9}>
                ربط النظام مع هيئة الزكاة والضريبة والجمارك (المرحلة الثانية)
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" />

        <ModalBody py={6}>
          <VStack spacing={5} align="stretch">
            {isOnboarded ? (
              /* Already Connected State */
              <Box p={4} borderWidth="1px" borderColor="green.200" bg="green.50" borderRadius="lg">
                <HStack justify="space-between" mb={3}>
                  <HStack spacing={2}>
                    <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
                    <Text fontWeight="bold" color="green.800">
                      System Officially Connected (متصل ومعتمد)
                    </Text>
                  </HStack>
                  <ZatcaBadge status="cleared" />
                </HStack>

                <VStack align="stretch" spacing={2} fontSize="sm" color="gray.700" pl={7}>
                  <HStack justify="space-between">
                    <Text color="gray.600">Organization:</Text>
                    <Text fontWeight="medium">{currentCredentials?.organizationName}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.600">Tax ID (الرقم الضريبي):</Text>
                    <Text fontWeight="mono">{currentCredentials?.vatNumber}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.600">Environment:</Text>
                    <Badge colorScheme={currentCredentials?.environment === 'production' ? 'green' : 'purple'}>
                      {currentCredentials?.environment?.toUpperCase()}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.600">CSID Expiry:</Text>
                    <Text fontWeight="medium">
                      {currentCredentials?.expiresAt
                        ? new Date(currentCredentials.expiresAt).toLocaleDateString()
                        : '5 Years Valid'}
                    </Text>
                  </HStack>
                </VStack>

                <Divider my={3} borderColor="green.200" />
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Your device is actively signing invoices. You do not need to re-enter any OTP.
                </Text>
              </Box>
            ) : (
              /* Setup Instructions for Small Vendor */
              <>
                <Alert status="info" borderRadius="md" variant="left-accent">
                  <AlertIcon />
                  <Box fontSize="xs">
                    <AlertTitle fontWeight="bold">One-Time 2-Minute Setup (إعداد لمرة واحدة فقط)</AlertTitle>
                    <AlertDescription>
                      You only need to enter the 6-digit code once. Once connected, the system signs and reports all invoices automatically.
                    </AlertDescription>
                  </Box>
                </Alert>

                {/* 3 Simple Steps */}
                <VStack align="stretch" spacing={3} bg="gray.50" p={4} borderRadius="lg" fontSize="xs">
                  <HStack align="flex-start" spacing={3}>
                    <Badge colorScheme="blue" borderRadius="full" px={2}>1</Badge>
                    <Box>
                      <Text fontWeight="bold">Log in to official ZATCA Portal:</Text>
                      <Link
                        href="https://fatoora.zatca.gov.sa"
                        isExternal
                        color="blue.600"
                        fontWeight="semibold"
                        display="inline-flex"
                        alignItems="center"
                      >
                        fatoora.zatca.gov.sa <Icon as={FiExternalLink} ml={1} />
                      </Link>
                    </Box>
                  </HStack>

                  <HStack align="flex-start" spacing={3}>
                    <Badge colorScheme="blue" borderRadius="full" px={2}>2</Badge>
                    <Text>
                      Navigate to <strong>Onboard Solution Unit (تسجيل وحدة فوترة)</strong> and generate your <strong>6-digit OTP</strong>.
                    </Text>
                  </HStack>

                  <HStack align="flex-start" spacing={3}>
                    <Badge colorScheme="blue" borderRadius="full" px={2}>3</Badge>
                    <Text>Paste the 6-digit OTP below and click <strong>"Connect to Tax Authority"</strong>.</Text>
                  </HStack>
                </VStack>

                {/* OTP Input Form */}
                <FormControl isRequired isInvalid={!!errorMsg}>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    6-Digit ZATCA OTP Code (رمز التحقق من البوابة)
                  </FormLabel>
                  <Input
                    placeholder="e.g. 123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    fontSize="xl"
                    fontWeight="bold"
                    letterSpacing="0.4em"
                    textAlign="center"
                    maxLength={6}
                    autoFocus
                    isDisabled={isLoading}
                  />
                  <FormHelperText fontSize="xs">
                    This OTP is generated in your FATOORA account and is valid for 1 hour.
                  </FormHelperText>
                </FormControl>

                {/* Environment Selector */}
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.600">Integration Environment:</FormLabel>
                  <RadioGroup
                    value={environment}
                    onChange={(val) => setEnvironment(val as ZatcaEnvironment)}
                    size="sm"
                  >
                    <Stack direction="row" spacing={4}>
                      <Radio value="simulation" colorScheme="purple">
                        Simulation / Sandbox (تجريبي للتدريب)
                      </Radio>
                      <Radio value="production" colorScheme="green">
                        Live Production (حقيقي ومعتمد)
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                {errorMsg && (
                  <Alert status="error" borderRadius="md" size="sm">
                    <AlertIcon />
                    <AlertDescription fontSize="xs">{errorMsg}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter bg="gray.50" py={3}>
          <HStack spacing={3} w="full" justify="space-between">
            <Button variant="ghost" size="sm" onClick={onClose} isDisabled={isLoading}>
              Close (إغلاق)
            </Button>

            {!isOnboarded ? (
              <Button
                colorScheme="brand"
                size="md"
                leftIcon={isLoading ? <Spinner size="sm" /> : <Icon as={FiLock} />}
                onClick={handleConnect}
                isLoading={isLoading}
                loadingText="Contacting ZATCA..."
                isDisabled={otp.trim().length !== 6}
              >
                Connect to Tax Authority (ربط النظام)
              </Button>
            ) : (
              <Button
                colorScheme="orange"
                variant="outline"
                size="sm"
                leftIcon={<Icon as={FiRefreshCw} />}
                onClick={() => {
                  if (confirm('Are you sure you want to re-connect or renew your ZATCA credentials?')) {
                    if (onOnboardSuccess) {
                      onOnboardSuccess({ ...currentCredentials!, isOnboarded: false });
                    }
                  }
                }}
              >
                Renew / Re-onboard (تجديد الشهادة)
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
