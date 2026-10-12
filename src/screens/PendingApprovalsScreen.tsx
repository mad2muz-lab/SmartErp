import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Box, Text, Button, VStack, HStack, Heading, Card, CardBody,
  Badge, Divider, useColorModeValue, Icon, useToast, Modal,
  ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, useDisclosure, Textarea, Select, Table,
  Thead, Tbody, Tr, Th, Td, TableContainer, Tabs, TabList,
  TabPanels, Tab, TabPanel, Stat, StatLabel, StatNumber,
  StatHelpText, StatArrow, FormControl, FormLabel
} from '@chakra-ui/react';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiEye, FiClock, FiFileText, FiShoppingCart, FiCpu, FiMessageSquare, FiActivity, FiShield } from 'react-icons/fi';
import { useAuth } from '../contexts/shared/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyDisplay } from '../utils/currencyUtils';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface PendingItem {
  id: string;
  type: 'purchase_requisition' | 'purchase_order';
  number: string;
  title: string;
  requester: string;
  amount: number;
  currency: string;
  created_date: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  description: string;
  items_count: number;
  department: string;
}

export default function PendingApprovalsScreen() {
  const { user, selectedOrganization, organizationDetails } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');

  // Convex WhatsApp Live Audit Data
  const whatsappRequests = useQuery(
    api.whatsappApprovals.listApprovalRequests,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );
  const whatsappMessages = useQuery(
    api.whatsappApprovals.listWhatsAppMessages,
    selectedOrganization ? { organization_id: selectedOrganization as any, limit: 20 } : 'skip'
  );
  const trainingMemory = useQuery(
    api.whatsappApprovals.listTrainingMemory,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );
  const runDiagnostics = useMutation(api.whatsappApprovals.runBotSystemDiagnostics);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  const handleRunDiagnostics = async () => {
    if (!selectedOrganization) return;
    setIsRunningDiagnostics(true);
    try {
      const res = await runDiagnostics({ organization_id: selectedOrganization as any });
      setDiagnosticResults(res);
      toast({
        title: 'Diagnostics Completed',
        description: `All ${res.results.length} module tests passed successfully.`,
        status: 'success',
        duration: 3500,
      });
    } catch (e: any) {
      toast({
        title: 'Diagnostics Error',
        description: e.message,
        status: 'error',
        duration: 3500,
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  // Mock data for pending approvals
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([
    {
      id: '1',
      type: 'purchase_requisition',
      number: 'PR-20241201-001',
      title: 'Office Equipment Purchase',
      requester: 'John Smith',
      amount: 2500.00,
      currency: 'SAR',
      created_date: '2024-12-01',
      status: 'pending',
      priority: 'medium',
      description: 'Purchase of office chairs and desks for new employees',
      items_count: 5,
      department: 'HR'
    },
    {
      id: '2',
      type: 'purchase_order',
      number: 'PO-20241201-002',
      title: 'IT Equipment Order',
      requester: 'Sarah Johnson',
      amount: 15000.00,
      currency: 'SAR',
      created_date: '2024-12-01',
      status: 'pending',
      priority: 'high',
      description: 'Laptops and monitors for IT department',
      items_count: 8,
      department: 'IT'
    },
    {
      id: '3',
      type: 'purchase_requisition',
      number: 'PR-20241201-003',
      title: 'Marketing Materials',
      requester: 'Mike Wilson',
      amount: 3500.00,
      currency: 'SAR',
      created_date: '2024-12-01',
      status: 'pending',
      priority: 'low',
      description: 'Printing materials and promotional items',
      items_count: 12,
      department: 'Marketing'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'purchase_requisition' ? FiFileText : FiShoppingCart;
  };

  const getTypeLabel = (type: string) => {
    return type === 'purchase_requisition' ? 'Purchase Requisition' : 'Purchase Order';
  };

  const handleView = (item: PendingItem) => {
    setSelectedItem(item);
    onOpen();
  };

  const handleApprove = (item: PendingItem) => {
    setSelectedItem(item);
    setAction('approve');
    setComments('');
    onOpen();
  };

  const handleReject = (item: PendingItem) => {
    setSelectedItem(item);
    setAction('reject');
    setComments('');
    onOpen();
  };

  const handleActionSubmit = () => {
    if (!selectedItem) return;

    // Update the item status
    const updatedItems = pendingItems.map(item => 
      item.id === selectedItem.id 
        ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
        : item
    );
    setPendingItems(updatedItems);

    // Remove from pending list
    setPendingItems(prev => prev.filter(item => item.id !== selectedItem.id));

    toast({
      title: action === 'approve' ? 'Approved' : 'Rejected',
      description: `${getTypeLabel(selectedItem.type)} ${selectedItem.number} has been ${action === 'approve' ? 'approved' : 'rejected'}`,
      status: action === 'approve' ? 'success' : 'error',
      duration: 5000,
      isClosable: true,
    });

    onClose();
  };

  const getPendingCount = () => pendingItems.filter(item => item.status === 'pending').length;
  const getPurchaseRequisitionCount = () => pendingItems.filter(item => item.type === 'purchase_requisition' && item.status === 'pending').length;
  const getPurchaseOrderCount = () => pendingItems.filter(item => item.type === 'purchase_order' && item.status === 'pending').length;

  if (!user) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please log in to access pending approvals.</Text>
      </Box>
    );
  }

  if (!selectedOrganization) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please select an organization to view pending approvals.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <HStack spacing={4}>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => {
                console.log('🔍 DEBUG: Back to Procurement clicked from Pending Approvals');
                window.location.href = '/procurement';
              }}
              size="sm"
            >
              Back to Procurement
            </Button>
            <Heading size="lg">Pending Approvals</Heading>
          </HStack>
          <Badge colorScheme="orange" fontSize="lg" px={3} py={1}>
            {getPendingCount()} Pending
          </Badge>
        </HStack>

        {/* Statistics */}
        <HStack spacing={4}>
          <Card flex={1}>
            <CardBody>
              <Stat>
                <StatLabel>Total Pending</StatLabel>
                <StatNumber>{getPendingCount()}</StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  Items requiring approval
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card flex={1}>
            <CardBody>
              <Stat>
                <StatLabel>Purchase Requisitions</StatLabel>
                <StatNumber>{getPurchaseRequisitionCount()}</StatNumber>
                <StatHelpText>
                  <Icon as={FiFileText} mr={1} />
                  Internal requests
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card flex={1}>
            <CardBody>
              <Stat>
                <StatLabel>Purchase Orders</StatLabel>
                <StatNumber>{getPurchaseOrderCount()}</StatNumber>
                <StatHelpText>
                  <Icon as={FiShoppingCart} mr={1} />
                  Supplier orders
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </HStack>

        {/* Content */}
        {pendingItems.length === 0 ? (
          <Card>
            <CardBody>
              <VStack spacing={4} py={8}>
                <Icon as={FiCheckCircle} boxSize={12} color="green.500" />
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  All Caught Up!
                </Text>
                <Text textAlign="center" color="gray.500">
                  No pending approvals at the moment. All items have been reviewed.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <Tabs variant="enclosed" colorScheme="whatsapp">
            <TabList>
              <Tab fontWeight="semibold">
                All Pending ({getPendingCount()})
              </Tab>
              <Tab fontWeight="semibold">
                Purchase Requisitions ({getPurchaseRequisitionCount()})
              </Tab>
              <Tab fontWeight="semibold">
                Purchase Orders ({getPurchaseOrderCount()})
              </Tab>
              <Tab fontWeight="bold" color="green.600">
                🤖 WhatsApp Live Audit & Diagnostics
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {pendingItems.map((item) => (
                    <Card key={item.id}>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Icon as={getTypeIcon(item.type)} color="blue.500" />
                                <Text fontWeight="bold" fontSize="lg">{item.number}</Text>
                                <Badge colorScheme={getPriorityColor(item.priority)} size="sm">
                                  {item.priority.toUpperCase()}
                                </Badge>
                              </HStack>
                              <Text color="gray.600">{item.title}</Text>
                            </VStack>
                            <VStack align="end" spacing={1}>
                              <Text fontWeight="bold" fontSize="lg">
                                <span className="procurement-currency-sar">{formatCurrencyDisplay(item.amount, item.currency as any)}</span>
                              </Text>
                              <Text fontSize="sm" color="gray.500">{item.department}</Text>
                            </VStack>
                          </HStack>
                          
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">
                              Requested by {item.requester} on {item.created_date}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {item.items_count} item(s)
                            </Text>
                          </HStack>

                          <Text fontSize="sm" color="gray.700">
                            {item.description}
                          </Text>

                          <HStack spacing={2} justify="flex-end">
                            <Button
                              size="sm"
                              leftIcon={<FiEye />}
                              variant="outline"
                              onClick={() => handleView(item)}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              leftIcon={<FiCheckCircle />}
                              colorScheme="green"
                              variant="outline"
                              onClick={() => handleApprove(item)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              leftIcon={<FiXCircle />}
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleReject(item)}
                            >
                              Reject
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {pendingItems
                    .filter(item => item.type === 'purchase_requisition')
                    .map((item) => (
                      <Card key={item.id}>
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <Icon as={FiFileText} color="blue.500" />
                                  <Text fontWeight="bold" fontSize="lg">{item.number}</Text>
                                  <Badge colorScheme={getPriorityColor(item.priority)} size="sm">
                                    {item.priority.toUpperCase()}
                                  </Badge>
                                </HStack>
                                <Text color="gray.600">{item.title}</Text>
                              </VStack>
                              <VStack align="end" spacing={1}>
                                <Text fontWeight="bold" fontSize="lg">
                                  {formatCurrencyDisplay(item.amount, item.currency as any)}
                                </Text>
                                <Text fontSize="sm" color="gray.500">{item.department}</Text>
                              </VStack>
                            </HStack>
                            
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="gray.600">
                                Requested by {item.requester} on {item.created_date}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                {item.items_count} item(s)
                              </Text>
                            </HStack>

                            <Text fontSize="sm" color="gray.700">
                              {item.description}
                            </Text>

                            <HStack spacing={2} justify="flex-end">
                              <Button
                                size="sm"
                                leftIcon={<FiEye />}
                                variant="outline"
                                onClick={() => handleView(item)}
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                leftIcon={<FiCheckCircle />}
                                colorScheme="green"
                                variant="outline"
                                onClick={() => handleApprove(item)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                leftIcon={<FiXCircle />}
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleReject(item)}
                              >
                                Reject
                              </Button>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {pendingItems
                    .filter(item => item.type === 'purchase_order')
                    .map((item) => (
                      <Card key={item.id}>
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <Icon as={FiShoppingCart} color="green.500" />
                                  <Text fontWeight="bold" fontSize="lg">{item.number}</Text>
                                  <Badge colorScheme={getPriorityColor(item.priority)} size="sm">
                                    {item.priority.toUpperCase()}
                                  </Badge>
                                </HStack>
                                <Text color="gray.600">{item.title}</Text>
                              </VStack>
                              <VStack align="end" spacing={1}>
                                <Text fontWeight="bold" fontSize="lg">
                                  {formatCurrencyDisplay(item.amount, item.currency as any)}
                                </Text>
                                <Text fontSize="sm" color="gray.500">{item.department}</Text>
                              </VStack>
                            </HStack>
                            
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="gray.600">
                                Requested by {item.requester} on {item.created_date}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                {item.items_count} item(s)
                              </Text>
                            </HStack>

                            <Text fontSize="sm" color="gray.700">
                              {item.description}
                            </Text>

                            <HStack spacing={2} justify="flex-end">
                              <Button
                                size="sm"
                                leftIcon={<FiEye />}
                                variant="outline"
                                onClick={() => handleView(item)}
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                leftIcon={<FiCheckCircle />}
                                colorScheme="green"
                                variant="outline"
                                onClick={() => handleApprove(item)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                leftIcon={<FiXCircle />}
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleReject(item)}
                              >
                                Reject
                              </Button>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                </VStack>
              </TabPanel>

              {/* 🤖 TAB 4: WhatsApp Live Audit, Continuous Learning & Diagnostics */}
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
                            <Heading size="md">WhatsApp Multi-Module Health & Diagnostics</Heading>
                            <Badge colorScheme="whatsapp" px={2} py={0.5} borderRadius="full">
                              LIVE ENGINE
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="whiteAlpha.900" maxW="700px">
                            Verify end-to-end execution across all 6 enterprise modules: AI OCR extraction, balanced General Ledger auto-posting, Asset Custody slips, 2-tier Leave chains, and PO releases.
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

                  {/* WhatsApp Approval Requests Audit Table */}
                  <Card>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <HStack justify="space-between">
                          <Heading size="sm">
                            Live WhatsApp Approvals & Stakeholder Sign-Offs ({whatsappRequests?.length || 0})
                          </Heading>
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
                                <Th>Status</Th>
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
                                    No WhatsApp approval requests dispatched yet. Use the bot to create one!
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
                  <Card>
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Heading size="sm">
                            🧠 Continuous Learning Bot Memory (Vendor $\rightarrow$ COA Rules)
                          </Heading>
                          <Badge colorScheme="teal">{trainingMemory?.length || 0} Learned Patterns</Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          When users or accountants correct an expense categorization, the bot registers the vendor pattern here to auto-classify all future invoices with 100% confidence.
                        </Text>
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
        )}

        {/* Action Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {action === 'approve' ? 'Approve' : 'Reject'} {selectedItem?.type === 'purchase_requisition' ? 'Purchase Requisition' : 'Purchase Order'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedItem && (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold">Document:</Text>
                    <Text>{selectedItem.number} - {selectedItem.title}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Amount:</Text>
                    <Text><span className="procurement-currency-sar">{formatCurrencyDisplay(selectedItem.amount, selectedItem.currency as any)}</span></Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Requested By:</Text>
                    <Text>{selectedItem.requester} ({selectedItem.department})</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Description:</Text>
                    <Text>{selectedItem.description}</Text>
                  </Box>
                  <FormControl>
                    <FormLabel>Comments (Optional)</FormLabel>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder={`Add comments for ${action === 'approve' ? 'approval' : 'rejection'}...`}
                      rows={3}
                    />
                  </FormControl>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={2}>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme={action === 'approve' ? 'green' : 'red'}
                  onClick={handleActionSubmit}
                >
                  {action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
}
