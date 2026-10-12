import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Tag,
  Flex,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { useGovernance } from './GovernanceContext';
import { Id } from '../../../convex/_generated/dataModel';
import {
  FiTruck,
  FiPlus,
} from 'react-icons/fi';

interface ResourceRequisitionTerminalProps {
  organizationId: Id<"organizations">;
  userId: Id<"user_profiles">;
}

export const ResourceRequisitionTerminal: React.FC<ResourceRequisitionTerminalProps> = ({
  organizationId,
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();

  const newResourceModal = useDisclosure();
  const newRequestModal = useDisclosure();

  // Governance Local Reactive Store
  const {
    resources,
    projects,
    consortiumOrganizations,
    createResource: createResourceLocal,
    submitResourceRequest: submitReqLocal,
  } = useGovernance();

  // Form States
  const [resForm, setResForm] = useState({
    category: 'Heavy Equipment (معدات ثقيلة)',
    sub_category: '50-Ton Crawler Crane',
    identifier: 'EQ-CRANE-08',
    name: 'Hitachi SCX550 Crawler Crane 50T',
    standard_unit: 'day',
    base_rate: 2800,
    is_sharable_externally: true,
  });

  const [reqForm, setReqForm] = useState({
    project_id: (projects && projects[0] ? projects[0]._id : 'prj_1') as any,
    supplying_org_id: (consortiumOrganizations && consortiumOrganizations[1] ? consortiumOrganizations[1]._id : 'org_heavy') as any,
    category: 'Heavy Equipment (معدات ثقيلة)',
    quantity: 1,
    unit: 'day',
    requested_rate: 2500,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mobilization_location: 'Riyadh Logistics Park, Gate 3',
    terms_conditions: 'Hirer to provide diesel; supplier provides certified operator',
  });

  const formatSAR = (amount: number) => {
    return `${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 }).format(amount)} \uE900`;
  };

  const handleCreateResource = async () => {
    try {
      createResourceLocal({
        category: resForm.category,
        sub_category: resForm.sub_category,
        identifier: resForm.identifier,
        name: resForm.name,
        standard_unit: resForm.standard_unit,
        base_rate: resForm.base_rate,
        is_sharable_externally: resForm.is_sharable_externally,
      });
      toast({ title: 'Resource Registered (تم قيد الأصل بالأسطول)', description: 'Available for site deployment and partner sharing.', status: 'success' });
      newResourceModal.onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, status: 'error' });
    }
  };

  const handleSubmitRequest = async () => {
    try {
      const selectedProj = projects.find((p) => p._id === reqForm.project_id || p.id === reqForm.project_id);
      const selectedOrg = consortiumOrganizations.find((o) => o._id === reqForm.supplying_org_id || o.id === reqForm.supplying_org_id);
      submitReqLocal({
        project_name: selectedProj ? selectedProj.name : 'Riyadh Logistics Park Phase 2',
        supplying_org: selectedOrg ? selectedOrg.name : 'Gulf Heavy Machinery LLC',
        resource_name: reqForm.category,
        requested_rate: reqForm.requested_rate,
        start_date: reqForm.start_date,
        end_date: reqForm.end_date,
        terms_conditions: reqForm.terms_conditions,
      });
      toast({ title: 'Requisition Dispatched (تم إرسال طلب الآلية للشريك)', description: 'Sent to partner with requested terms.', status: 'success' });
      newRequestModal.onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, status: 'error' });
    }
  };

  return (
    <Box p={6} maxW="1600px" mx="auto">
      {/* Header with Bilingual Labels */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <HStack spacing={3}>
            <FiTruck size={26} color="#DD6B20" />
            <Box>
              <HStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold">
                  Shared Fleet & Resource Requisitions
                </Text>
                <Badge colorScheme="orange" variant="subtle" fontSize="sm">
                  الآليات والمعدات والخدمات المشتركة
                </Badge>
              </HStack>
              <Text color="gray.500" fontSize="sm">
                Facilitates cross-company sharing of machinery, manpower, specialists, and licenses with negotiated counter-offers.
              </Text>
            </Box>
          </HStack>
        </Box>
        <HStack>
          <Button leftIcon={<FiPlus />} colorScheme="orange" onClick={newRequestModal.onOpen}>
            Request Resource (طلب آلية من الشريك)
          </Button>
          <Button leftIcon={<FiPlus />} colorScheme="blue" variant="outline" onClick={newResourceModal.onOpen}>
            Register Asset (تسجيل أصل بالأسطول)
          </Button>
        </HStack>
      </Flex>

      {/* Available Fleet Catalog */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm" mb={8}>
        <CardHeader pb={2}>
          <HStack spacing={2}>
            <Text fontSize="lg" fontWeight="bold">
              Available Fleet & Equipment Catalog (كتالوج الآليات والمعدات المتاحة)
            </Text>
            <Badge colorScheme="blue" variant="subtle" fontSize="xs">
              POOLED FLEET
            </Badge>
          </HStack>
          <Text fontSize="xs" color="gray.500">
            Owned fleet assets and sharable resources pooled across consortium partners.
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={0}>
          {resources && resources.length > 0 ? (
            <Table variant="simple" size="sm">
              <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                <Tr>
                  <Th>Tag / Fleet ID (رقم الأصل)</Th>
                  <Th>Resource Name (اسم المعدة/الطاقم)</Th>
                  <Th>Category (النوع)</Th>
                  <Th>Standard Base Rate (السعر اليومي)</Th>
                  <Th>Status (الحالة)</Th>
                  <Th>Sharing Scope (نطاق المشاركة)</Th>
                </Tr>
              </Thead>
              <Tbody>
                {resources.map((res) => (
                  <Tr key={res._id}>
                    <Td fontFamily="mono" fontWeight="bold" color="blue.600" fontSize="xs">
                      {res.identifier}
                    </Td>
                    <Td fontWeight="medium" fontSize="xs">{res.name}</Td>
                    <Td>
                      <Badge size="sm">{res.category}</Badge>
                    </Td>
                    <Td fontWeight="bold" fontSize="xs">
                      {formatSAR(res.base_rate)} / {res.standard_unit}
                    </Td>
                    <Td>
                      <Tag size="sm" colorScheme={res.current_status === 'available' ? 'green' : 'orange'}>
                        {res.current_status.toUpperCase()}
                      </Tag>
                    </Td>
                    <Td>
                      {res.is_sharable_externally ? (
                        <Badge colorScheme="green" fontSize="10px">Shared Pool (متاح للمشاريع)</Badge>
                      ) : (
                        <Badge colorScheme="gray" fontSize="10px">Private Internal (خاص بنا)</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Box p={8} textAlign="center">
              <FiTruck size={40} color="#CBD5E0" style={{ margin: '0 auto 12px' }} />
              <Text fontWeight="medium" color="gray.600">
                No resources registered in the catalog
              </Text>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* MODAL: REGISTER ASSET */}
      <Modal isOpen={newResourceModal.isOpen} onClose={newResourceModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Register Resource in Catalog (تسجيل آلية/أصل)</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Category (فئة الأصل)</FormLabel>
                <Select
                  value={resForm.category}
                  onChange={(e) => setResForm({ ...resForm, category: e.target.value as any })}
                >
                  <option value="Heavy Equipment (معدات ثقيلة)">Heavy Machinery (رافعات، حفارات)</option>
                  <option value="Manpower (طاقم عمالة فنية)">Manpower / Certified Labor (عمالة معتمدة)</option>
                  <option value="Power & Utilities (مولدات وطاقة)">Generators & Site Power (مولدات ديزل)</option>
                  <option value="Specialist (مهندس فاحص معتمد)">Specialist Engineer / Inspector (مهندس فاحص)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Fleet ID / Plate Number (رقم اللوحة أو التعريف)</FormLabel>
                <Input
                  value={resForm.identifier}
                  onChange={(e) => setResForm({ ...resForm, identifier: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Resource Name (اسم المعدة / الطاقم)</FormLabel>
                <Input
                  value={resForm.name}
                  onChange={(e) => setResForm({ ...resForm, name: e.target.value })}
                />
              </FormControl>

              <HStack w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Base Rate in <span className="icon-saudi_riyal" /> (السعر المعتمد)</FormLabel>
                  <NumberInput
                    value={resForm.base_rate}
                    onChange={(_, val) => setResForm({ ...resForm, base_rate: val || 0 })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Unit (الوحدة)</FormLabel>
                  <Select
                    value={resForm.standard_unit}
                    onChange={(e) => setResForm({ ...resForm, standard_unit: e.target.value })}
                  >
                    <option value="day">Per Day (يومي)</option>
                    <option value="hour">Per Hour (ساعة)</option>
                    <option value="month">Per Month (شهري)</option>
                  </Select>
                </FormControl>
              </HStack>

              <Button colorScheme="blue" w="full" onClick={handleCreateResource}>
                Save to Catalog (حفظ في الكتالوج)
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* MODAL: REQUEST RESOURCE */}
      <Modal isOpen={newRequestModal.isOpen} onClose={newRequestModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request Resource from Partner (طلب آلية من الشريك)</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Target Project (المشروع المستهدف)</FormLabel>
                <Select
                  value={reqForm.project_id}
                  onChange={(e) => setReqForm({ ...reqForm, project_id: e.target.value as any })}
                >
                  {projects?.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Supplying Partner Company (الشريك المورد للمعدة)</FormLabel>
                <Select
                  value={reqForm.supplying_org_id}
                  onChange={(e) => setReqForm({ ...reqForm, supplying_org_id: e.target.value as any })}
                >
                  {consortiumOrganizations
                    ?.filter((o) => o._id !== 'org_main')
                    .map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name}
                      </option>
                    ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Proposed Daily Rate in <span className="icon-saudi_riyal" /> (السعر اليومي المقترح)</FormLabel>
                <NumberInput
                  value={reqForm.requested_rate}
                  onChange={(_, val) => setReqForm({ ...reqForm, requested_rate: val || 0 })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <HStack w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Mobilization Date (تاريخ التوريد)</FormLabel>
                  <Input
                    type="date"
                    value={reqForm.start_date}
                    onChange={(e) => setReqForm({ ...reqForm, start_date: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Estimated End Date (تاريخ الانتهاء)</FormLabel>
                  <Input
                    type="date"
                    value={reqForm.end_date}
                    onChange={(e) => setReqForm({ ...reqForm, end_date: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Site Mobilization Location (موقع التسليم في المشروع)</FormLabel>
                <Input
                  value={reqForm.mobilization_location}
                  onChange={(e) => setReqForm({ ...reqForm, mobilization_location: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs">Terms & Diesel / Operator Notes (الشروط والديزل والمشغل)</FormLabel>
                <Textarea
                  value={reqForm.terms_conditions}
                  onChange={(e) => setReqForm({ ...reqForm, terms_conditions: e.target.value })}
                  rows={2}
                />
              </FormControl>

              <Button colorScheme="orange" w="full" onClick={handleSubmitRequest}>
                Dispatch Requisition to Partner (إرسال الطلب للشريك)
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResourceRequisitionTerminal;
