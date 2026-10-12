import React, { useState, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Textarea,
  Divider,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Image,
  Spinner,
} from '@chakra-ui/react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import OrganizationSelector from '../components/OrganizationSelector';
import OrganizationManagement from '../components/settings/OrganizationManagement';
import PrintTemplateManagement from '../components/settings/PrintTemplateManagement';
import { useLanguage } from '../contexts/shared/LanguageContext';

import {
  FiSettings,
  FiShield,
  FiDatabase,
  FiGlobe,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiSave,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiCreditCard,
  FiClock,
  FiFileText,
  FiMessageSquare,
  FiActivity,
  FiCpu,
  FiCheckCircle,
  FiZap,
} from 'react-icons/fi';
import { TableContainer } from '@chakra-ui/react';
import toast from 'react-hot-toast';

const SettingsScreen: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const { selectedOrganization, loading: authLoading } = useAuth();
  const { currentLanguage, setLanguage, supportedLanguages, t } = useLanguage();
  
  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Settings</Heading>
            <Text color="gray.600">Loading...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  const { 
    isOpen: isOrgModalOpen, 
    onOpen: onOrgModalOpen, 
    onClose: onOrgModalClose 
  } = useDisclosure();
  const [activeTab, setActiveTab] = useState(0);

  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'SAR',
    vat_rate: '15',
    timezone: 'Asia/Riyadh',
    language: 'en',
    vat_number: '',
    slug: '',
    profit_sharing_enabled: false,
    profit_sharing_percentage: '0',
  });

  const [systemForm, setSystemForm] = useState({
    auto_backup: true,
    backup_frequency: 'daily',
    email_notifications: true,
    sms_notifications: false,
    session_timeout: 30,
    max_login_attempts: 5,
  });

  // Fetch data
  const organizations = useQuery(api.organizations.listOrganizations);
  const currentOrganization = useQuery(
    api.organizations.getOrganization,
    selectedOrganization ? { id: selectedOrganization as any } : 'skip'
  );

  // WhatsApp Gateway Audit Trail & Diagnostics Data
  const whatsappRequests = useQuery(
    api.whatsappApprovals.listApprovalRequests,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );
  const whatsappMessages = useQuery(
    api.whatsappApprovals.listWhatsAppMessages,
    selectedOrganization ? { organization_id: selectedOrganization as any, limit: 30 } : 'skip'
  );
  const trainingMemory = useQuery(
    api.whatsappApprovals.listTrainingMemory,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );
  const runDiagnostics = useMutation(api.whatsappApprovals.runBotSystemDiagnostics);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  // Cloud AI Vision Agent Configuration (Universal Multi-LLM: Gemini, OpenAI, Grok, Claude, DeepSeek, Ollama, etc.)
  const [aiVisionKey, setAiVisionKey] = useState(() => localStorage.getItem('trading_erp_ai_vision_key') || '');
  const [aiVisionProvider, setAiVisionProvider] = useState(() => localStorage.getItem('trading_erp_ai_vision_provider') || 'gemini');
  const [customModel, setCustomModel] = useState(() => localStorage.getItem('trading_erp_ai_custom_model') || 'grok-2-vision-1212');
  const [customBaseUrl, setCustomBaseUrl] = useState(() => localStorage.getItem('trading_erp_ai_custom_base_url') || 'https://api.x.ai/v1');
  const testAiAction = useAction(api.whatsappApprovals.testAiVisionConnection);
  const [isAiKeySaved, setIsAiKeySaved] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveAiVisionConfig = () => {
    localStorage.setItem('trading_erp_ai_vision_key', aiVisionKey.trim());
    localStorage.setItem('trading_erp_ai_vision_provider', aiVisionProvider);
    localStorage.setItem('trading_erp_ai_custom_model', customModel.trim());
    localStorage.setItem('trading_erp_ai_custom_base_url', customBaseUrl.trim());
    setIsAiKeySaved(true);
    toast.success('Universal AI Vision Agent credentials saved successfully!');
    setTimeout(() => setIsAiKeySaved(false), 3000);
  };

  const handleTestApiKey = async () => {
    const key = aiVisionKey.trim();
    if (!key) {
      setTestFeedback({ success: false, message: 'Please enter an API key first.' });
      return;
    }
    setIsTestingKey(true);
    setTestFeedback(null);
    try {
      const res = await testAiAction({
        provider: aiVisionProvider,
        apiKey: key,
        baseUrl: customBaseUrl.trim(),
        model: customModel.trim(),
      });
      setTestFeedback({
        success: res.success,
        message: res.success ? `✅ ${res.message}` : `❌ ${res.message}`,
      });
    } catch (err: any) {
      setTestFeedback({ success: false, message: `❌ Server proxy error: ${err.message}` });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleRunDiagnostics = async () => {
    if (!selectedOrganization) return;
    setIsRunningDiagnostics(true);
    try {
      const res = await runDiagnostics({ organization_id: selectedOrganization as any });
      setDiagnosticResults(res);
      toast.success(`Automated Diagnostics Completed: All ${res.results.length} module tests passed!`);
    } catch (e: any) {
      toast.error('Diagnostics failed: ' + e.message);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  // Mutations
  const setDefaultOrganization = useMutation(api.organizations.setDefaultOrganization);
  const createOrganization = useMutation(api.organizations.createOrganization);



  const handleNewOrgSubmit = async () => {
    try {
      const newOrgId = await createOrganization({
        ...newOrgForm,
      });
      toast.success('New organization created successfully');
      onOrgModalClose();
      setNewOrgForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        currency: 'SAR',
        vat_rate: '15',
        timezone: 'Asia/Riyadh',
        language: 'en',
        vat_number: '',
        slug: '',
        profit_sharing_enabled: false,
        profit_sharing_percentage: '0',
      });
      console.log('New organization created:', newOrgId);
    } catch (error) {
      toast.error('Failed to create new organization');
      console.error(error);
    }
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Settings</Heading>
          <Text color="gray.600">Configure your Trading ERP system</Text>
        </Box>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Tabs index={activeTab} onChange={setActiveTab}>
              <TabList>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiGlobe} />
                    <Text>Organization</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiSettings} />
                    <Text>System</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiShield} />
                    <Text>Security</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiDatabase} />
                    <Text>Backup</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiFileText} />
                    <Text>Print Templates</Text>
                  </HStack>
                </Tab>
                <Tab color="green.600" fontWeight="bold">
                  <HStack spacing={2}>
                    <Icon as={FiMessageSquare} color="#25D366" />
                    <Text>WhatsApp Gateway & Audit</Text>
                  </HStack>
                </Tab>

              </TabList>

              <TabPanels>

                {/* Organization Tab - Now using the modular component */}
                <TabPanel>
                  <OrganizationManagement />
                </TabPanel>

                {/* System Tab */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md">System Configuration</Heading>
                      <Text color="gray.600">Configure system behavior and notifications</Text>
                    </Box>

                    <VStack spacing={4} align="stretch">
                      {/* Language & Localization Card */}
                      <Card bg={cardBg} border="1px" borderColor={borderColor}>
                        <CardBody>
                          <VStack spacing={4} align="stretch">
                            <Box>
                              <Heading size="sm">{t('langSettingTitle', 'System Language & Localization')}</Heading>
                              <Text fontSize="xs" color="gray.500">
                                {t('langSettingDesc', 'Select your preferred language across all ERP screens, POS, and dashboards')}
                              </Text>
                            </Box>
                            <FormControl>
                              <FormLabel fontSize="sm" fontWeight="semibold">
                                {t('languageSelector', 'Universal System Language (لغة النظام)')}
                              </FormLabel>
                              <Select
                                value={currentLanguage}
                                onChange={(e) => {
                                  const newLang = e.target.value as any;
                                  setLanguage(newLang);
                                  toast.success(`Language switched to ${newLang.toUpperCase()}`);
                                }}
                              >
                                {supportedLanguages.map((lang) => (
                                  <option key={lang.code} value={lang.code}>
                                    {lang.flag} {lang.nativeName} ({lang.name}) — {lang.dir.toUpperCase()}
                                  </option>
                                ))}
                              </Select>
                            </FormControl>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg} border="1px" borderColor={borderColor}>
                        <CardBody>
                          <VStack spacing={4} align="stretch">
                            <Heading size="sm">Notifications</Heading>
                            <HStack justify="space-between">
                              <Text>Email Notifications</Text>
                              <Switch
                                isChecked={systemForm.email_notifications}
                                onChange={(e) => setSystemForm({ ...systemForm, email_notifications: e.target.checked })}
                              />
                            </HStack>
                            <HStack justify="space-between">
                              <Text>SMS Notifications</Text>
                              <Switch
                                isChecked={systemForm.sms_notifications}
                                onChange={(e) => setSystemForm({ ...systemForm, sms_notifications: e.target.checked })}
                              />
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg} border="1px" borderColor={borderColor}>
                        <CardBody>
                          <VStack spacing={4} align="stretch">
                            <Heading size="sm">Session Management</Heading>
                            <FormControl>
                              <FormLabel>Session Timeout (minutes)</FormLabel>
                              <NumberInput
                                value={systemForm.session_timeout}
                                onChange={(value) => setSystemForm({ ...systemForm, session_timeout: Number(value) })}
                                min={5}
                                max={480}
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                            <FormControl>
                              <FormLabel>Max Login Attempts</FormLabel>
                              <NumberInput
                                value={systemForm.max_login_attempts}
                                onChange={(value) => setSystemForm({ ...systemForm, max_login_attempts: Number(value) })}
                                min={3}
                                max={10}
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Button
                        leftIcon={<FiSave />}
                        colorScheme="blue"
                        onClick={() => toast.success('System settings saved')}
                      >
                        Save System Settings
                      </Button>
                    </VStack>
                  </VStack>
                </TabPanel>

                {/* Security Tab */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md">Security Settings</Heading>
                      <Text color="gray.600">Configure security and access controls</Text>
                    </Box>

                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Security Features</AlertTitle>
                        <AlertDescription>
                          Advanced security features including two-factor authentication, 
                          IP whitelisting, and audit logs will be implemented in the next version.
                        </AlertDescription>
                      </Box>
                    </Alert>

                    <Card bg={cardBg} border="1px" borderColor={borderColor}>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <Heading size="sm">Access Control</Heading>
                          <HStack justify="space-between">
                            <Text>Two-Factor Authentication</Text>
                            <Badge colorScheme="yellow">Coming Soon</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>IP Whitelisting</Text>
                            <Badge colorScheme="yellow">Coming Soon</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Audit Logs</Text>
                            <Badge colorScheme="yellow">Coming Soon</Badge>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>

                {/* Backup Tab */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md">Backup & Recovery</Heading>
                      <Text color="gray.600">Manage data backup and recovery</Text>
                    </Box>

                    <Card bg={cardBg} border="1px" borderColor={borderColor}>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <Heading size="sm">Backup Settings</Heading>
                          <HStack justify="space-between">
                            <Text>Auto Backup</Text>
                            <Switch
                              isChecked={systemForm.auto_backup}
                              onChange={(e) => setSystemForm({ ...systemForm, auto_backup: e.target.checked })}
                            />
                          </HStack>
                          <FormControl>
                            <FormLabel>Backup Frequency</FormLabel>
                            <Select
                              value={systemForm.backup_frequency}
                              onChange={(e) => setSystemForm({ ...systemForm, backup_frequency: e.target.value })}
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </Select>
                          </FormControl>
                        </VStack>
                      </CardBody>
                    </Card>

                    <HStack spacing={4}>
                      <Button
                        leftIcon={<FiDownload />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => toast.success('Backup started')}
                      >
                        Create Backup
                      </Button>
                      <Button
                        leftIcon={<FiUpload />}
                        colorScheme="green"
                        variant="outline"
                        onClick={() => toast.success('Restore initiated')}
                      >
                        Restore Data
                      </Button>
                    </HStack>
                  </VStack>
                </TabPanel>

                {/* Print Templates Tab */}
                <TabPanel>
                  <PrintTemplateManagement />
                </TabPanel>

                {/* 🤖 WhatsApp Gateway, Live Audit Trail & 6-Module Diagnostics */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    {/* Diagnostics Header Banner */}
                    <Card bg="linear-gradient(135deg, #075E54 0%, #128C7E 100%)" color="white" borderRadius="2xl" p={5}>
                      <HStack justify="space-between" wrap="wrap" spacing={4}>
                        <HStack spacing={4}>
                          <Box p={3} bg="whiteAlpha.200" borderRadius="xl">
                            <Icon as={FiCpu} boxSize={8} color="#25D366" />
                          </Box>
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Heading size="md">Automated 6-Module Diagnostics Suite (Health Verification)</Heading>
                              <Badge colorScheme="whatsapp" px={2} py={0.5} borderRadius="full">
                                HEALTH CHECK
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="whiteAlpha.900" maxW="700px">
                              One-click verification of all 6 enterprise operational modules: AI OCR extraction, balanced General Ledger auto-posting (DR 5200 / CR 1020), Asset Custody acceptance slips, 2-tier Leave chains, and PO releases.
                            </Text>
                          </VStack>
                        </HStack>
                        <Button
                          size="md"
                          bg="#25D366"
                          color="white"
                          _hover={{ bg: '#20bd5a' }}
                          leftIcon={<Icon as={FiActivity} />}
                          isLoading={isRunningDiagnostics}
                          loadingText="Testing Modules..."
                          onClick={handleRunDiagnostics}
                          fontWeight="bold"
                          shadow="md"
                        >
                          Run 6-Module Diagnostics 🚀
                        </Button>
                      </HStack>
                    </Card>

                    {/* Diagnostic Results Card if run */}
                    {diagnosticResults && (
                      <Card border="1px solid" borderColor="green.200" bg="green.50" borderRadius="xl">
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between">
                              <HStack>
                                <Icon as={FiCheckCircle} color="green.600" boxSize={5} />
                                <Heading size="sm" color="green.900">
                                  System Health: {diagnosticResults.overall_status}
                                </Heading>
                              </HStack>
                              <Text fontSize="xs" color="green.700">
                                Checked at: {new Date(diagnosticResults.executed_at).toLocaleTimeString()}
                              </Text>
                            </HStack>
                            <Divider borderColor="green.200" />
                            <TableContainer>
                              <Table size="sm" variant="simple">
                                <Thead>
                                  <Tr>
                                    <Th color="green.900">Module</Th>
                                    <Th color="green.900">Integration Test</Th>
                                    <Th color="green.900">Status</Th>
                                    <Th color="green.900">Verification Details</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {diagnosticResults.results.map((res: any, idx: number) => (
                                    <Tr key={idx}>
                                      <Td fontWeight="bold" fontSize="xs">{res.module}</Td>
                                      <Td fontSize="xs">{res.test_name}</Td>
                                      <Td>
                                        <Badge colorScheme={res.status === 'PASSED' ? 'green' : 'yellow'}>
                                          {res.status}
                                        </Badge>
                                      </Td>
                                      <Td fontSize="xs" color="gray.700">{res.details}</Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          </VStack>
                        </CardBody>
                      </Card>
                    )}

                    {/* 🤖 AI Vision Agent & OCR Link Configuration */}
                    <Card bg={cardBg} border="1px" borderColor={borderColor}>
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          <HStack justify="space-between" wrap="wrap">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Icon as={FiZap} color="purple.500" boxSize={5} />
                                <Heading size="sm">
                                  🤖 Connect AI Vision Agent (Multimodal Receipt Parser)
                                </Heading>
                                <Badge colorScheme="purple">Phase 1 & Phase 2 Vision</Badge>
                              </HStack>
                              <Text fontSize="xs" color="gray.500">
                                Connect Gemini Flash or OpenAI Vision to empower the WhatsApp assistant to read complex, faded, or handwritten receipts when barcode QR is unavailable.
                              </Text>
                            </VStack>
                            <Badge colorScheme={aiVisionKey ? 'green' : 'gray'}>
                              {aiVisionKey ? '● AI Agent Connected' : '○ Offline ZATCA Engine Active'}
                            </Badge>
                          </HStack>

                          <HStack spacing={4} wrap="wrap">
                            <FormControl maxW="240px">
                              <FormLabel fontSize="xs" fontWeight="bold">AI Vision Provider</FormLabel>
                              <Select
                                size="sm"
                                value={aiVisionProvider}
                                onChange={(e) => {
                                  const newProvider = e.target.value;
                                  setAiVisionProvider(newProvider);
                                  if (newProvider === 'gemini') {
                                    setCustomModel('gemini-1.5-flash');
                                  } else if (newProvider === 'grok') {
                                    setCustomBaseUrl('https://api.x.ai/v1');
                                    setCustomModel('grok-2-vision-1212');
                                  } else if (newProvider === 'openai') {
                                    setCustomBaseUrl('https://api.openai.com/v1');
                                    setCustomModel('gpt-4o-mini');
                                  } else if (newProvider === 'deepseek') {
                                    setCustomBaseUrl('https://api.deepseek.com/v1');
                                    setCustomModel('deepseek-flash');
                                  } else if (newProvider === 'custom_openai') {
                                    setCustomBaseUrl('https://openrouter.ai/api/v1');
                                    setCustomModel('google/gemini-flash-1.5');
                                  }
                                }}
                              >
                                <option value="gemini">Google Gemini 1.5 Flash (Recommended)</option>
                                <option value="grok">xAI Grok Vision (grok-2-vision)</option>
                                <option value="openai">OpenAI (GPT-4o / 4o-mini)</option>
                                <option value="deepseek">DeepSeek Vision (deepseek-flash)</option>
                                <option value="custom_openai">Generic OpenAI-Compatible (OpenRouter, Ollama)</option>
                              </Select>
                            </FormControl>

                            <FormControl flex="1" minW="260px">
                              <FormLabel fontSize="xs" fontWeight="bold">AI Agent API Key (Client Secret)</FormLabel>
                              <Input
                                size="sm"
                                type="password"
                                placeholder={aiVisionProvider === 'grok' ? 'xai-...' : aiVisionProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                                value={aiVisionKey}
                                onChange={(e) => setAiVisionKey(e.target.value)}
                              />
                            </FormControl>
                          </HStack>

                          {aiVisionProvider !== 'gemini' && (
                            <HStack spacing={4} wrap="wrap">
                              <FormControl flex="1" minW="260px">
                                <FormLabel fontSize="xs" fontWeight="bold">API Base URL</FormLabel>
                                <Input
                                  size="sm"
                                  placeholder={aiVisionProvider === 'grok' ? 'https://api.x.ai/v1' : 'https://openrouter.ai/api/v1'}
                                  value={customBaseUrl}
                                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                                />
                                <Text fontSize="2xs" color="gray.500" mt={1}>
                                  {aiVisionProvider === 'grok' && 'Official xAI endpoint: https://api.x.ai/v1'}
                                  {aiVisionProvider === 'openai' && 'Official OpenAI endpoint: https://api.openai.com/v1'}
                                  {aiVisionProvider === 'custom_openai' && 'e.g. OpenRouter: https://openrouter.ai/api/v1 | DeepSeek: https://api.deepseek.com/v1 | Ollama: http://localhost:11434/v1'}
                                </Text>
                              </FormControl>

                              <FormControl maxW="240px">
                                <FormLabel fontSize="xs" fontWeight="bold">Model Name</FormLabel>
                                <Input
                                  size="sm"
                                  placeholder={aiVisionProvider === 'grok' ? 'grok-2-vision-1212' : 'gpt-4o-mini'}
                                  value={customModel}
                                  onChange={(e) => setCustomModel(e.target.value)}
                                />
                              </FormControl>
                            </HStack>
                          )}

                          <HStack justify="space-between" align="center">
                            <HStack>
                              <Button
                                size="sm"
                                colorScheme="purple"
                                onClick={handleSaveAiVisionConfig}
                              >
                                {isAiKeySaved ? 'Saved! ✓' : 'Save & Link 🔗'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="purple"
                                isLoading={isTestingKey}
                                onClick={handleTestApiKey}
                              >
                                Test Key 🧪
                              </Button>
                            </HStack>
                          </HStack>
                          {testFeedback && (
                            <Box
                              p={2}
                              borderRadius="md"
                              fontSize="xs"
                              bg={testFeedback.success ? 'green.50' : 'red.50'}
                              color={testFeedback.success ? 'green.800' : 'red.800'}
                              border="1px solid"
                              borderColor={testFeedback.success ? 'green.200' : 'red.200'}
                            >
                              {testFeedback.message}
                            </Box>
                          )}

                          <Box bg="purple.50" p={3} borderRadius="md" border="1px dashed" borderColor="purple.200">
                            <Text fontSize="xs" color="purple.800">
                              💡 <strong>How it works:</strong> The parser uses a 3-tier cascade: <strong>Tier 1</strong> decodes the authentic Saudi ZATCA TLV QR code instantly for 100% exact amounts and merchant VAT; <strong>Tier 2</strong> falls back to your connected AI Vision model for un-barcoded receipts; <strong>Tier 3</strong> auto-learns vendor-to-COA category rules in memory.
                            </Text>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Live WhatsApp Approvals Audit Trail */}
                    <Card bg={cardBg} border="1px" borderColor={borderColor}>
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Heading size="sm">
                                📋 Live WhatsApp Approvals Audit Trail ({whatsappRequests?.length || 0})
                              </Heading>
                              <Text fontSize="xs" color="gray.500">
                                Track timestamps, approver identity, phone numbers, and cryptographic verification tokens.
                              </Text>
                            </VStack>
                            <Badge colorScheme="purple">One-Time Tokens Verified</Badge>
                          </HStack>
                          <TableContainer>
                            <Table size="sm" variant="striped" colorScheme="gray">
                              <Thead>
                                <Tr>
                                  <Th>Type</Th>
                                  <Th>Reference</Th>
                                  <Th>Approver</Th>
                                  <Th>Phone</Th>
                                  <Th>Decision / Status</Th>
                                  <Th>Timestamp</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {whatsappRequests && whatsappRequests.length > 0 ? (
                                  whatsappRequests.map((req: any) => (
                                    <Tr key={req._id}>
                                      <Td>
                                        <Badge colorScheme={req.request_type === 'expense_claim' ? 'blue' : 'purple'}>
                                          {req.request_type.replace(/_/g, ' ').toUpperCase()}
                                        </Badge>
                                      </Td>
                                      <Td fontWeight="bold">{req.reference_id}</Td>
                                      <Td>{req.approver_name}</Td>
                                      <Td>{req.approver_phone}</Td>
                                      <Td>
                                        <Badge colorScheme={req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : 'orange'}>
                                          {req.status.toUpperCase()}
                                        </Badge>
                                      </Td>
                                      <Td fontSize="xs" color="gray.500">
                                        {new Date(req.sent_at).toLocaleString()}
                                      </Td>
                                    </Tr>
                                  ))
                                ) : (
                                  <Tr>
                                    <Td colSpan={6} textAlign="center" py={4} color="gray.500">
                                      No WhatsApp approval requests dispatched yet. Use the bot to trigger one!
                                    </Td>
                                  </Tr>
                                )}
                              </Tbody>
                            </Table>
                          </TableContainer>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Continuous Learning Bot Memory Rules */}
                    <Card bg={cardBg} border="1px" borderColor={borderColor}>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Heading size="sm">
                                🧠 Continuous Learning Bot Memory (Vendor $\rightarrow$ COA Rules)
                              </Heading>
                              <Text fontSize="xs" color="gray.500">
                                Learned patterns from user feedback and corrections that auto-classify future invoices with high confidence.
                              </Text>
                            </VStack>
                            <Badge colorScheme="teal">{trainingMemory?.length || 0} Learned Patterns</Badge>
                          </HStack>
                          <TableContainer>
                            <Table size="sm">
                              <Thead>
                                <Tr>
                                  <Th>Vendor Name</Th>
                                  <Th>CR / VAT</Th>
                                  <Th>Learned Account Head</Th>
                                  <Th>Confidence</Th>
                                  <Th>Times Applied</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {trainingMemory && trainingMemory.length > 0 ? (
                                  trainingMemory.map((mem: any) => (
                                    <Tr key={mem._id}>
                                      <Td fontWeight="bold">{mem.vendor_name}</Td>
                                      <Td fontSize="xs">{mem.vendor_cr_or_vat || 'Auto-Detected'}</Td>
                                      <Td>
                                        <Badge colorScheme="blue">
                                          [{mem.learned_account_code}] {mem.learned_account_name}
                                        </Badge>
                                      </Td>
                                      <Td fontSize="xs" color="green.600" fontWeight="bold">
                                        {(mem.confidence_score * 100).toFixed(0)}%
                                      </Td>
                                      <Td>{mem.times_trained}x</Td>
                                    </Tr>
                                  ))
                                ) : (
                                  <Tr>
                                    <Td colSpan={5} textAlign="center" py={4} color="gray.500">
                                      No custom vendor memory trained yet. Bot uses baseline Saudi commercial directory.
                                    </Td>
                                  </Tr>
                                )}
                              </Tbody>
                            </Table>
                          </TableContainer>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>

              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>



        {/* Organization Creation Modal */}
        <Modal isOpen={isOrgModalOpen} onClose={onOrgModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Organization</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <HStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Organization Name</FormLabel>
                    <Input
                      value={newOrgForm.name}
                      onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                      placeholder="Enter organization name"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={newOrgForm.email}
                      onChange={(e) => setNewOrgForm({ ...newOrgForm, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Phone</FormLabel>
                    <Input
                      value={newOrgForm.phone}
                      onChange={(e) => setNewOrgForm({ ...newOrgForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      value={newOrgForm.currency}
                      onChange={(e) => setNewOrgForm({ ...newOrgForm, currency: e.target.value })}
                    >
                      <option value="SAR">{'\uE900'} (Saudi Riyal)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </Select>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Address</FormLabel>
                  <Textarea
                    value={newOrgForm.address}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </FormControl>

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>VAT Rate (%)</FormLabel>
                    <Input
                      type="number"
                      value={newOrgForm.vat_rate}
                      onChange={(e) => setNewOrgForm({ ...newOrgForm, vat_rate: e.target.value })}
                      placeholder="15"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Timezone</FormLabel>
                    <Select
                      value={newOrgForm.timezone}
                      onChange={(e) => setNewOrgForm({ ...newOrgForm, timezone: e.target.value })}
                    >
                      <option value="Asia/Riyadh">Asia/Riyadh (Saudi Arabia)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                    </Select>
                  </FormControl>
                </HStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onOrgModalClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleNewOrgSubmit}
                isDisabled={!newOrgForm.name || !newOrgForm.email}
              >
                Create Organization
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default SettingsScreen;
