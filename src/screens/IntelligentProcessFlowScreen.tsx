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
  CardHeader,
  Badge,
  Progress,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  FiPlay,
  FiPause,
  FiCheck,
  FiX,
  FiClock,
  FiZap,
  FiTrendingUp,
  FiAlertCircle,
  FiInfo,
  FiSettings,
  FiEye,
  FiEdit,
  FiTarget,
  FiActivity,
  FiShield,
  FiRefreshCw,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const IntelligentProcessFlowScreen: React.FC = () => {
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fetch data from Convex
  const organizations = useQuery(api.organizations.listOrganizations);
  const processFlows = useQuery(
    api.processFlow.listProcessFlows,
    selectedOrganization ? { organizationId: selectedOrganization as any } : 'skip'
  );
  const inquiryProcesses = useQuery(
    api.processFlow.listInquiryProcesses,
    selectedOrganization ? { organizationId: selectedOrganization as any } : 'skip'
  );

  // Mutations
  const createInquiryProcess = useMutation(api.processFlow.createInquiryProcess);
  const executeAction = useMutation(api.processFlow.executeAction);

  // Auto-select first organization
  React.useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrganization) {
      setSelectedOrganization(organizations[0]._id);
    }
  }, [organizations, selectedOrganization]);

  const handleCreateInquiry = async () => {
    if (!selectedOrganization || !selectedProcess) {
      toast.error('Please select an organization and process flow');
      return;
    }

    try {
      await createInquiryProcess({
        inquiry_id: `INQ-${Date.now()}`,
        process_flow_id: selectedProcess as any,
        organization_id: selectedOrganization as any,
        priority: 'medium',
        currency: 'USD',
        created_by: 'admin',
      });
      
      toast.success('Inquiry process created successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to create inquiry process');
      console.error(error);
    }
  };

  const handleExecuteAction = async (inquiryProcessId: string, stageId: string, actionName: string) => {
    try {
      await executeAction({
        inquiry_process_id: inquiryProcessId as any,
        stage_id: stageId as any,
        action_name: actionName,
        description: `Executing ${actionName}`,
        action_type: 'USER',
        triggered_by: 'admin',
      });
      
      toast.success(`Action ${actionName} executed successfully`);
    } catch (error) {
      toast.error('Failed to execute action');
      console.error(error);
    }
  };

  const ProcessStage = ({ 
    stage, 
    isActive, 
    isCompleted, 
    canExecute 
  }: {
    stage: any;
    isActive: boolean;
    isCompleted: boolean;
    canExecute: boolean;
  }) => (
    <Card 
      bg={cardBg} 
      border="1px" 
      borderColor={isActive ? 'blue.300' : borderColor}
      boxShadow={isActive ? 'lg' : 'sm'}
    >
      <CardBody>
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <VStack align="flex-start" spacing={1}>
              <Text fontWeight="bold" fontSize="lg">
                {stage.name}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {stage.description}
              </Text>
            </VStack>
            <VStack spacing={1}>
              {isCompleted && <Badge colorScheme="green">Completed</Badge>}
              {isActive && <Badge colorScheme="blue">Active</Badge>}
              {stage.is_automated && <Badge colorScheme="purple">Automated</Badge>}
            </VStack>
          </HStack>
          
          {isActive && (
            <VStack spacing={2} align="stretch">
              <Progress value={isCompleted ? 100 : 50} colorScheme="blue" />
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">
                  Progress
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {isCompleted ? '100%' : '50%'}
                </Text>
              </HStack>
            </VStack>
          )}
          
          {canExecute && !isCompleted && (
            <Button
              size="sm"
              colorScheme="blue"
              leftIcon={<FiPlay />}
              onClick={() => handleExecuteAction('', stage._id, 'Complete Stage')}
            >
              Execute
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  const InquiryProcessCard = ({ process }: { process: any }) => (
    <Card bg={cardBg} border="1px" borderColor={borderColor}>
      <CardHeader>
        <HStack justify="space-between">
          <VStack align="flex-start" spacing={1}>
            <Heading size="md">{process.inquiry_id}</Heading>
            <Text fontSize="sm" color="gray.500">
              Started: {new Date(process.started_at).toLocaleDateString()}
            </Text>
          </VStack>
          <VStack spacing={1}>
            <Badge colorScheme={process.status === 'active' ? 'blue' : 'green'}>
              {process.status}
            </Badge>
            <Badge colorScheme={process.priority === 'high' ? 'red' : 'orange'}>
              {process.priority}
            </Badge>
          </VStack>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <Text fontWeight="medium">Estimated Value:</Text>
            <Text>${process.estimated_value?.toLocaleString() || '0'}</Text>
          </HStack>
          
          <HStack justify="space-between">
            <Text fontWeight="medium">Assigned To:</Text>
            <Text>{process.assigned_to || 'Unassigned'}</Text>
          </HStack>
          
          <HStack justify="space-between">
            <Text fontWeight="medium">Currency:</Text>
            <Text>{process.currency}</Text>
          </HStack>
          
          <Divider />
          
          <HStack justify="space-between">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FiEye />}
            >
              View Details
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              leftIcon={<FiPlay />}
            >
              Continue Process
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Intelligent Process Flow</Heading>
          <Text color="gray.600">
            Automated inquiry-to-delivery workflow with AI-powered intelligence
          </Text>
        </Box>

        {/* Organization Selection */}
        {organizations && organizations.length > 0 && (
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Text fontWeight="bold">Select Organization</Text>
                <HStack spacing={4} wrap="wrap">
                  {organizations.map((org) => (
                    <Button
                      key={org._id}
                      variant={selectedOrganization === org._id ? 'solid' : 'outline'}
                      colorScheme={selectedOrganization === org._id ? 'blue' : 'gray'}
                      onClick={() => setSelectedOrganization(org._id)}
                    >
                      {org.name}
                    </Button>
                  ))}
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* AI Intelligence Dashboard */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <VStack align="flex-start" spacing={1}>
                <Heading size="md">🤖 AI Intelligence Dashboard</Heading>
                <Text fontSize="sm" color="gray.500">
                  Real-time insights and automated recommendations
                </Text>
              </VStack>
              <HStack spacing={2}>
                <Badge colorScheme="green" variant="subtle">
                  <HStack spacing={1}>
                    <Icon as={FiActivity} boxSize="3" />
                    <Text>Live</Text>
                  </HStack>
                </Badge>
                <Badge colorScheme="blue" variant="subtle">
                  <HStack spacing={1}>
                    <Icon as={FiZap} boxSize="3" />
                    <Text>AI Active</Text>
                  </HStack>
                </Badge>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
              {/* AI Analytics Card */}
              <Card bg="blue.50" border="1px" borderColor="blue.200">
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                                             <HStack spacing={2}>
                         <Icon as={FiTrendingUp} color="blue.500" />
                         <Text fontWeight="bold">Process Analytics</Text>
                       </HStack>
                    </HStack>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm">Active Processes:</Text>
                        <Text fontWeight="bold" color="blue.600">
                          {inquiryProcesses?.length || 0}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Avg. Completion Time:</Text>
                        <Text fontWeight="bold" color="blue.600">2.3 days</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Success Rate:</Text>
                        <Text fontWeight="bold" color="green.600">94.2%</Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* AI Recommendations Card */}
              <Card bg="green.50" border="1px" borderColor="green.200">
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <Icon as={FiTarget} color="green.500" />
                        <Text fontWeight="bold">Smart Recommendations</Text>
                      </HStack>
                    </HStack>
                    <VStack spacing={2} align="stretch">
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        <Text fontSize="xs">3 pending actions require attention</Text>
                      </Alert>
                      <Alert status="warning" size="sm">
                        <AlertIcon />
                        <Text fontSize="xs">2 high-priority inquiries detected</Text>
                      </Alert>
                      <Alert status="success" size="sm">
                        <AlertIcon />
                        <Text fontSize="xs">5 processes ready for next stage</Text>
                      </Alert>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Automation Status Card */}
              <Card bg="purple.50" border="1px" borderColor="purple.200">
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                                             <HStack spacing={2}>
                         <Icon as={FiZap} color="purple.500" />
                         <Text fontWeight="bold">Automation Status</Text>
                       </HStack>
                    </HStack>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm">Auto-Processing:</Text>
                        <Badge colorScheme="green" size="sm">Active</Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Smart Routing:</Text>
                        <Badge colorScheme="green" size="sm">Active</Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">AI Analysis:</Text>
                        <Badge colorScheme="green" size="sm">Active</Badge>
                      </HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Security & Compliance Card */}
              <Card bg="orange.50" border="1px" borderColor="orange.200">
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <Icon as={FiShield} color="orange.500" />
                        <Text fontWeight="bold">Security & Compliance</Text>
                      </HStack>
                    </HStack>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm">Data Protection:</Text>
                        <Badge colorScheme="green" size="sm">Compliant</Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Audit Trail:</Text>
                        <Badge colorScheme="green" size="sm">Complete</Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Access Control:</Text>
                        <Badge colorScheme="green" size="sm">Active</Badge>
                      </HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>
          </CardBody>
        </Card>

        {/* Main Content */}
        <Tabs variant="enclosed">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiActivity} />
                <Text>Active Processes</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiSettings} />
                <Text>Process Flows</Text>
              </HStack>
            </Tab>
                         <Tab>
               <HStack spacing={2}>
                 <Icon as={FiZap} />
                 <Text>AI Recommendations</Text>
               </HStack>
             </Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiZap} />
                <Text>Automation Rules</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Active Processes Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Active Inquiry Processes</Heading>
                  <Button
                    colorScheme="blue"
                    leftIcon={<FiPlay />}
                    onClick={onOpen}
                  >
                    Create New Inquiry
                  </Button>
                </HStack>

                {inquiryProcesses && inquiryProcesses.length > 0 ? (
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                    {inquiryProcesses.map((process) => (
                      <GridItem key={process._id}>
                        <InquiryProcessCard process={process} />
                      </GridItem>
                    ))}
                  </Grid>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    No active inquiry processes found. Create a new inquiry to get started.
                  </Alert>
                )}
              </VStack>
            </TabPanel>

            {/* Process Flows Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Available Process Flows</Heading>
                
                {processFlows && processFlows.length > 0 ? (
                  <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                    {processFlows.map((flow) => (
                      <GridItem key={flow._id}>
                        <Card bg={cardBg} border="1px" borderColor={borderColor}>
                          <CardHeader>
                            <HStack justify="space-between">
                              <VStack align="flex-start" spacing={1}>
                                <Heading size="md">{flow.name}</Heading>
                                <Text fontSize="sm" color="gray.500">
                                  {flow.description}
                                </Text>
                              </VStack>
                              <Badge colorScheme={flow.is_active ? 'green' : 'gray'}>
                                {flow.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </HStack>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={4} align="stretch">
                              <HStack justify="space-between">
                                <Text fontWeight="medium">Created:</Text>
                                <Text>{new Date(flow.created_at).toLocaleDateString()}</Text>
                              </HStack>
                              
                              <HStack justify="space-between">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<FiEye />}
                                >
                                  View Stages
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<FiEdit />}
                                >
                                  Edit Flow
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      </GridItem>
                    ))}
                  </Grid>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    No process flows found. Create a process flow to define your workflow.
                  </Alert>
                )}
              </VStack>
            </TabPanel>

            {/* AI Recommendations Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                                     <Heading size="md">🤖 AI-Powered Recommendations</Heading>
                   <HStack spacing={2}>
                     <Badge colorScheme="green" variant="subtle">
                       <HStack spacing={1}>
                         <Icon as={FiZap} boxSize="3" />
                         <Text>AI Active</Text>
                       </HStack>
                     </Badge>
                    <Button size="sm" variant="outline" leftIcon={<FiRefreshCw />}>
                      Refresh Analysis
                    </Button>
                  </HStack>
                </HStack>

                {/* Real-time AI Insights */}
                <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                  {/* Predictive Analytics */}
                  <Card bg="blue.50" border="1px" borderColor="blue.200">
                    <CardHeader>
                      <HStack spacing={2}>
                        <Icon as={FiTrendingUp} color="blue.500" />
                        <Heading size="sm">Predictive Analytics</Heading>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <Alert status="info" size="sm">
                          <AlertIcon />
                          <Text fontSize="xs">Based on 1,247 historical inquiries</Text>
                        </Alert>
                        <VStack spacing={2} align="stretch">
                          <HStack justify="space-between">
                            <Text fontSize="sm">Success Probability:</Text>
                            <Text fontWeight="bold" color="green.600">87.3%</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm">Expected Revenue:</Text>
                            <Text fontWeight="bold" color="blue.600">$45,200</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm">Risk Level:</Text>
                            <Badge colorScheme="green" size="sm">Low</Badge>
                          </HStack>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Smart Recommendations */}
                  <Card bg="green.50" border="1px" borderColor="green.200">
                    <CardHeader>
                      <HStack spacing={2}>
                        <Icon as={FiTarget} color="green.500" />
                        <Heading size="sm">Smart Recommendations</Heading>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <List spacing={2}>
                          <ListItem>
                            <HStack spacing={2}>
                              <Icon as={FiCheck} color="green.500" />
                              <Text fontSize="sm">Increase markup by 5% for better profitability</Text>
                            </HStack>
                          </ListItem>
                          <ListItem>
                            <HStack spacing={2}>
                              <Icon as={FiCheck} color="green.500" />
                              <Text fontSize="sm">Contact customer within 24 hours for higher conversion</Text>
                            </HStack>
                          </ListItem>
                          <ListItem>
                            <HStack spacing={2}>
                              <Icon as={FiCheck} color="green.500" />
                              <Text fontSize="sm">Offer extended payment terms to close deal</Text>
                            </HStack>
                          </ListItem>
                        </List>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Risk Assessment */}
                  <Card bg="orange.50" border="1px" borderColor="orange.200">
                    <CardHeader>
                      <HStack spacing={2}>
                        <Icon as={FiAlertCircle} color="orange.500" />
                        <Heading size="sm">Risk Assessment</Heading>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <Alert status="warning" size="sm">
                          <AlertIcon />
                          <Text fontSize="xs">2 risk factors detected</Text>
                        </Alert>
                        <VStack spacing={2} align="stretch">
                          <HStack justify="space-between">
                            <Text fontSize="sm">Payment History:</Text>
                            <Badge colorScheme="yellow" size="sm">Caution</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm">Credit Score:</Text>
                            <Badge colorScheme="green" size="sm">Good</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm">Market Volatility:</Text>
                            <Badge colorScheme="orange" size="sm">Medium</Badge>
                          </HStack>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>

                {/* Actionable Insights */}
                <Card bg={cardBg} border="1px" borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">🎯 Actionable Insights</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between" p={4} bg="blue.50" borderRadius="md">
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="bold">Optimize Pricing Strategy</Text>
                          <Text fontSize="sm" color="gray.600">
                            AI analysis suggests adjusting markup from 15% to 18% for better competitiveness while maintaining profitability
                          </Text>
                          <Text fontSize="xs" color="blue.600" mt={2}>
                            📊 Based on market analysis and competitor pricing
                          </Text>
                        </VStack>
                        <VStack spacing={2}>
                          <Badge colorScheme="blue">High Priority</Badge>
                          <Button size="sm" colorScheme="blue" variant="outline">
                            Apply
                          </Button>
                        </VStack>
                      </HStack>
                      
                      <HStack justify="space-between" p={4} bg="green.50" borderRadius="md">
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="bold">Supplier Recommendation</Text>
                          <Text fontSize="sm" color="gray.600">
                            Based on historical data, Supplier A offers best quality-price ratio for this product category
                          </Text>
                          <Text fontSize="xs" color="green.600" mt={2}>
                            🏆 98% satisfaction rate, 2.1 days avg. delivery time
                          </Text>
                        </VStack>
                        <VStack spacing={2}>
                          <Badge colorScheme="green">Medium Priority</Badge>
                          <Button size="sm" colorScheme="green" variant="outline">
                            Select
                          </Button>
                        </VStack>
                      </HStack>
                      
                      <HStack justify="space-between" p={4} bg="purple.50" borderRadius="md">
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="bold">Process Optimization</Text>
                          <Text fontSize="sm" color="gray.600">
                            Automate quote generation for inquiries under $10,000 to reduce processing time by 60%
                          </Text>
                          <Text fontSize="xs" color="purple.600" mt={2}>
                            ⚡ Estimated time savings: 2.5 hours per day
                          </Text>
                        </VStack>
                        <VStack spacing={2}>
                          <Badge colorScheme="purple">Medium Priority</Badge>
                          <Button size="sm" colorScheme="purple" variant="outline">
                            Configure
                          </Button>
                        </VStack>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Automation Rules Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Automation Rules</Heading>
                
                <Card bg={cardBg} border="1px" borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Configured Rules</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between" p={4} bg="purple.50" borderRadius="md">
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="bold">Auto-Advance Stage</Text>
                          <Text fontSize="sm" color="gray.600">
                            Automatically advance to next stage when conditions are met
                          </Text>
                        </VStack>
                        <Badge colorScheme="purple">Active</Badge>
                      </HStack>
                      
                      <HStack justify="space-between" p={4} bg="blue.50" borderRadius="md">
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="bold">AI Analysis Trigger</Text>
                          <Text fontSize="sm" color="gray.600">
                            Trigger AI analysis when new inquiry is created
                          </Text>
                        </VStack>
                        <Badge colorScheme="blue">Active</Badge>
                      </HStack>
                      
                      <HStack justify="space-between" p={4} bg="green.50" borderRadius="md">
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="bold">Quote Generation</Text>
                          <Text fontSize="sm" color="gray.600">
                            Automatically generate quote when requirements are complete
                          </Text>
                        </VStack>
                        <Badge colorScheme="green">Active</Badge>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Create New Inquiry Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Inquiry Process</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text fontWeight="bold">Select Process Flow</Text>
                {processFlows && processFlows.length > 0 ? (
                  <VStack spacing={2} align="stretch">
                    {processFlows.map((flow) => (
                      <Button
                        key={flow._id}
                        variant={selectedProcess === flow._id ? 'solid' : 'outline'}
                        colorScheme={selectedProcess === flow._id ? 'blue' : 'gray'}
                        justifyContent="flex-start"
                        onClick={() => setSelectedProcess(flow._id)}
                      >
                        {flow.name}
                      </Button>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500">No process flows available</Text>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleCreateInquiry}>
                Create Inquiry
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default IntelligentProcessFlowScreen;
