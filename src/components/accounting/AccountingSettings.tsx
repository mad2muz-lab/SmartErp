import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Select,
  Switch,
  Text,
  Textarea,
  VStack,
  HStack,
  useToast,
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
  IconButton
} from '@chakra-ui/react';
import { FiSave, FiRefreshCw, FiSettings, FiCalendar, FiFileText, FiShield } from 'react-icons/fi';
import { SaudiRiyalIcon } from '../icons/SaudiRiyalIcon';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import { formatCurrencyWithIcon } from '../../utils/currencyUtils';
import { isConvexOrgId } from '../../utils/accountingUtils';
import '../../utils/procurementCurrency.css';

interface AccountingSettings {
  organization_id: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  base_currency: string;
  vat_rate: number;
  vat_number?: string;
  tax_id?: string;
  company_registration?: string;
  accounting_method: 'cash' | 'accrual';
  auto_backup: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  email_notifications: boolean;
  low_balance_alert: boolean;
  low_balance_threshold: number;
  invoice_numbering: 'auto' | 'manual';
  invoice_prefix: string;
  invoice_start_number: number;
  receipt_numbering: 'auto' | 'manual';
  receipt_prefix: string;
  receipt_start_number: number;
  payment_numbering: 'auto' | 'manual';
  payment_prefix: string;
  payment_start_number: number;
  journal_voucher_numbering: 'auto' | 'manual';
  journal_voucher_prefix: string;
  journal_voucher_start_number: number;
  created_at: string;
  updated_at: string;
}

const AccountingSettings: React.FC = () => {
  const { user, selectedOrganization } = useAuth();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [settings, setSettings] = useState<Partial<AccountingSettings>>({
    fiscal_year_start: '2025-01-01',
    fiscal_year_end: '2025-12-31',
    base_currency: 'SAR',
    vat_rate: 15,
    accounting_method: 'accrual',
    auto_backup: true,
    backup_frequency: 'daily',
    email_notifications: true,
    low_balance_alert: true,
    low_balance_threshold: 1000,
    invoice_numbering: 'auto',
    invoice_prefix: 'INV',
    invoice_start_number: 1,
    receipt_numbering: 'auto',
    receipt_prefix: 'RCP',
    receipt_start_number: 1,
    payment_numbering: 'auto',
    payment_prefix: 'PAY',
    payment_start_number: 1,
    journal_voucher_numbering: 'auto',
    journal_voucher_prefix: 'JV',
    journal_voucher_start_number: 1
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const organizationId = typeof selectedOrganization === 'string' 
    ? selectedOrganization 
    : selectedOrganization?._id;

  const isConvex = isConvexOrgId(organizationId);

  const toIsoDate = (val?: string, defaultMMDD: string = '01-01') => {
    const currentYear = new Date().getFullYear();
    if (!val) return `${currentYear}-${defaultMMDD}`;
    if (/^\d{2}-\d{2}$/.test(val)) return `${currentYear}-${val}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    return `${currentYear}-${defaultMMDD}`;
  };

  // Queries
  const accountingSettings = useQuery(
    api.accounting.accountingSettings.getAccountingSettings,
    isConvex ? { organization_id: organizationId } : "skip"
  );

  // Mutations
  const updateSettings = useMutation(api.accounting.accountingSettings.updateAccountingSettings);
  const initializeSettings = useMutation(api.accounting.accountingSettings.initializeAccountingSettings);

  // Update settings when data loads
  React.useEffect(() => {
    if (accountingSettings) {
      setSettings(prev => ({
        ...prev,
        fiscal_year_start: toIsoDate(accountingSettings.fiscal_year_start, '01-01'),
        fiscal_year_end: toIsoDate(accountingSettings.fiscal_year_end, '12-31'),
        base_currency: accountingSettings.base_currency || prev.base_currency || 'SAR',
        default_currency: (accountingSettings as any).default_currency || prev.base_currency || 'SAR',
        auto_generate_voucher_numbers: (accountingSettings as any).auto_generate_voucher_numbers ?? true,
        voucher_number_prefix: (accountingSettings as any).voucher_number_prefix || prev.journal_voucher_prefix || 'JV',
        receipt_number_prefix: (accountingSettings as any).receipt_number_prefix || prev.receipt_prefix || 'RCP',
        payment_number_prefix: (accountingSettings as any).payment_number_prefix || prev.payment_prefix || 'PAY',
        enable_multi_currency: (accountingSettings as any).enable_multi_currency ?? false,
        enable_budget_control: (accountingSettings as any).enable_budget_control ?? false,
        enable_approval_workflow: (accountingSettings as any).enable_approval_workflow ?? false,
        journal_voucher_start_number: (accountingSettings as any).journal_voucher_start_number || prev.journal_voucher_start_number || 1
      }));
    } else if (!isConvex && organizationId) {
      try {
        const saved = localStorage.getItem(`trading_erp_accounting_settings_${organizationId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings(prev => ({
            ...prev,
            ...parsed,
            fiscal_year_start: toIsoDate(parsed.fiscal_year_start, '01-01'),
            fiscal_year_end: toIsoDate(parsed.fiscal_year_end, '12-31')
          }));
        }
      } catch {}
    }
  }, [accountingSettings, isConvex, organizationId]);

  const handleSaveSettings = async () => {
    if (!organizationId || !user) return;

    setIsSaving(true);
    try {
      if (isConvex) {
        await updateSettings({
          organization_id: organizationId,
          fiscal_year_start: settings.fiscal_year_start,
          default_currency: settings.default_currency,
          base_currency: settings.base_currency,
          auto_generate_voucher_numbers: settings.auto_generate_voucher_numbers,
          voucher_number_prefix: settings.voucher_number_prefix,
          receipt_number_prefix: settings.receipt_number_prefix,
          payment_number_prefix: settings.payment_number_prefix,
          enable_multi_currency: settings.enable_multi_currency,
          enable_budget_control: settings.enable_budget_control,
          enable_approval_workflow: settings.enable_approval_workflow,
        });
      } else {
        localStorage.setItem(`trading_erp_accounting_settings_${organizationId}`, JSON.stringify(settings));
      }

      toast({
        title: 'Settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitializeSettings = async () => {
    if (!organizationId || !user) return;

    try {
      if (isConvex) {
        await initializeSettings({
          organization_id: organizationId,
          created_by: user._id
        });
      } else {
        localStorage.setItem(`trading_erp_accounting_settings_${organizationId}`, JSON.stringify(settings));
        localStorage.setItem(`trading_erp_accounting_initialized_${organizationId}`, 'true');
      }

      toast({
        title: 'Settings initialized successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error initializing settings',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const currencies = [
    { value: 'SAR', label: '\uE900 Saudi Riyal' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'AED', label: 'UAE Dirham (AED)' }
  ];

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Accounting Settings</Heading>
            <Text color="gray.600">Configure accounting system settings</Text>
          </VStack>
          <HStack spacing={2}>
            {!accountingSettings && (
              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                onClick={handleInitializeSettings}
              >
                Initialize Settings
              </Button>
            )}
            <Button
              leftIcon={<FiSave />}
              colorScheme="blue"
              onClick={handleSaveSettings}
              isLoading={isSaving}
              loadingText="Saving..."
            >
              Save Settings
            </Button>
          </HStack>
        </Flex>

        {!accountingSettings && (
          <Alert status="warning">
            <AlertIcon />
            <AlertTitle>Settings Not Initialized</AlertTitle>
            <AlertDescription>
              Please initialize the accounting settings before configuring the system.
            </AlertDescription>
          </Alert>
        )}

        <Tabs variant="enclosed">
          <TabList>
            <Tab><FiSettings style={{ marginRight: '8px' }} />General</Tab>
            <Tab><SaudiRiyalIcon boxSize={4} style={{ marginRight: '8px' }} />Currency & Tax</Tab>
            <Tab><FiCalendar style={{ marginRight: '8px' }} />Fiscal Year</Tab>
            <Tab><FiFileText style={{ marginRight: '8px' }} />Numbering</Tab>
            <Tab><FiShield style={{ marginRight: '8px' }} />Security & Backup</Tab>
          </TabList>

          <TabPanels>
            {/* General Settings */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">General Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                      <FormControl>
                        <FormLabel>Accounting Method</FormLabel>
                        <Select
                          value={settings.accounting_method}
                          onChange={(e) => handleSettingChange('accounting_method', e.target.value)}
                        >
                          <option value="cash">Cash Basis</option>
                          <option value="accrual">Accrual Basis</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Email Notifications</FormLabel>
                        <Switch
                          isChecked={settings.email_notifications}
                          onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                        />
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          Send email notifications for important events
                        </Text>
                      </FormControl>
                    </Grid>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Currency & Tax Settings */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Currency & Tax Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                      <FormControl>
                        <FormLabel>Base Currency</FormLabel>
                        <Select
                          value={settings.base_currency}
                          onChange={(e) => handleSettingChange('base_currency', e.target.value)}
                        >
                          {currencies.map((currency) => (
                            <option key={currency.value} value={currency.value}>
                              {currency.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>VAT Rate (%)</FormLabel>
                        <NumberInput
                          value={settings.vat_rate}
                          onChange={(value) => handleSettingChange('vat_rate', Number(value))}
                          min={0}
                          max={100}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>VAT Number</FormLabel>
                        <Input
                          value={settings.vat_number || ''}
                          onChange={(e) => handleSettingChange('vat_number', e.target.value)}
                          placeholder="Enter VAT number"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Tax ID</FormLabel>
                        <Input
                          value={settings.tax_id || ''}
                          onChange={(e) => handleSettingChange('tax_id', e.target.value)}
                          placeholder="Enter tax ID"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Company Registration</FormLabel>
                        <Input
                          value={settings.company_registration || ''}
                          onChange={(e) => handleSettingChange('company_registration', e.target.value)}
                          placeholder="Enter company registration number"
                        />
                      </FormControl>
                    </Grid>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Fiscal Year Settings */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Fiscal Year Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                      <FormControl>
                        <FormLabel>Fiscal Year Start</FormLabel>
                        <Input
                          type="date"
                          value={toIsoDate(settings.fiscal_year_start, '01-01')}
                          onChange={(e) => handleSettingChange('fiscal_year_start', e.target.value)}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Fiscal Year End</FormLabel>
                        <Input
                          type="date"
                          value={toIsoDate(settings.fiscal_year_end, '12-31')}
                          onChange={(e) => handleSettingChange('fiscal_year_end', e.target.value)}
                        />
                      </FormControl>
                    </Grid>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Numbering Settings */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Document Numbering</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      {/* Invoice Numbering */}
                      <Box>
                        <Heading size="sm" mb={3}>Invoice Numbering</Heading>
                        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                          <FormControl>
                            <FormLabel>Numbering Type</FormLabel>
                            <Select
                              value={settings.invoice_numbering}
                              onChange={(e) => handleSettingChange('invoice_numbering', e.target.value)}
                            >
                              <option value="auto">Automatic</option>
                              <option value="manual">Manual</option>
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Prefix</FormLabel>
                            <Input
                              value={settings.invoice_prefix || ''}
                              onChange={(e) => handleSettingChange('invoice_prefix', e.target.value)}
                              placeholder="INV"
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Start Number</FormLabel>
                            <NumberInput
                              value={settings.invoice_start_number ?? 1}
                              onChange={(value) => handleSettingChange('invoice_start_number', Number(value))}
                              min={1}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                        </Grid>
                      </Box>

                      <Divider />

                      {/* Receipt Numbering */}
                      <Box>
                        <Heading size="sm" mb={3}>Receipt Numbering</Heading>
                        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                          <FormControl>
                            <FormLabel>Numbering Type</FormLabel>
                            <Select
                              value={settings.receipt_numbering || 'auto'}
                              onChange={(e) => handleSettingChange('receipt_numbering', e.target.value)}
                            >
                              <option value="auto">Automatic</option>
                              <option value="manual">Manual</option>
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Prefix</FormLabel>
                            <Input
                              value={settings.receipt_prefix || ''}
                              onChange={(e) => handleSettingChange('receipt_prefix', e.target.value)}
                              placeholder="RCP"
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Start Number</FormLabel>
                            <NumberInput
                              value={settings.receipt_start_number ?? 1}
                              onChange={(value) => handleSettingChange('receipt_start_number', Number(value))}
                              min={1}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                        </Grid>
                      </Box>

                      <Divider />

                      {/* Payment Numbering */}
                      <Box>
                        <Heading size="sm" mb={3}>Payment Numbering</Heading>
                        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                          <FormControl>
                            <FormLabel>Numbering Type</FormLabel>
                            <Select
                              value={settings.payment_numbering || 'auto'}
                              onChange={(e) => handleSettingChange('payment_numbering', e.target.value)}
                            >
                              <option value="auto">Automatic</option>
                              <option value="manual">Manual</option>
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Prefix</FormLabel>
                            <Input
                              value={settings.payment_prefix || ''}
                              onChange={(e) => handleSettingChange('payment_prefix', e.target.value)}
                              placeholder="PAY"
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Start Number</FormLabel>
                            <NumberInput
                              value={settings.payment_start_number ?? 1}
                              onChange={(value) => handleSettingChange('payment_start_number', Number(value))}
                              min={1}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                        </Grid>
                      </Box>

                      <Divider />

                      {/* Journal Voucher Numbering */}
                      <Box>
                        <Heading size="sm" mb={3}>Journal Voucher Numbering</Heading>
                        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                          <FormControl>
                            <FormLabel>Numbering Type</FormLabel>
                            <Select
                              value={settings.journal_voucher_numbering || 'auto'}
                              onChange={(e) => handleSettingChange('journal_voucher_numbering', e.target.value)}
                            >
                              <option value="auto">Automatic</option>
                              <option value="manual">Manual</option>
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Prefix</FormLabel>
                            <Input
                              value={settings.journal_voucher_prefix || ''}
                              onChange={(e) => handleSettingChange('journal_voucher_prefix', e.target.value)}
                              placeholder="JV"
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Start Number</FormLabel>
                            <NumberInput
                              value={settings.journal_voucher_start_number}
                              onChange={(value) => handleSettingChange('journal_voucher_start_number', Number(value))}
                              min={1}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                        </Grid>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Security & Backup Settings */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Security & Backup Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                      <FormControl>
                        <FormLabel>Auto Backup</FormLabel>
                        <Switch
                          isChecked={settings.auto_backup}
                          onChange={(e) => handleSettingChange('auto_backup', e.target.checked)}
                        />
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          Automatically backup accounting data
                        </Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Backup Frequency</FormLabel>
                        <Select
                          value={settings.backup_frequency}
                          onChange={(e) => handleSettingChange('backup_frequency', e.target.value)}
                          isDisabled={!settings.auto_backup}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Low Balance Alert</FormLabel>
                        <Switch
                          isChecked={settings.low_balance_alert}
                          onChange={(e) => handleSettingChange('low_balance_alert', e.target.checked)}
                        />
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          Alert when account balance is low
                        </Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Low Balance Threshold</FormLabel>
                        <NumberInput
                          value={settings.low_balance_threshold}
                          onChange={(value) => handleSettingChange('low_balance_threshold', Number(value))}
                          min={0}
                          isDisabled={!settings.low_balance_alert}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          Alert when balance falls below this amount
                        </Text>
                      </FormControl>
                    </Grid>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default AccountingSettings;
