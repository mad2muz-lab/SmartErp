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
  Select,
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
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { useGovernance } from './GovernanceContext';
import { Id } from '../../../convex/_generated/dataModel';
import {
  FiGrid,
  FiPlus,
} from 'react-icons/fi';

interface ProjectRaciMatrixProps {
  organizationId: Id<"organizations">;
  userId: Id<"user_profiles">;
}

export const ProjectRaciMatrix: React.FC<ProjectRaciMatrixProps> = ({
  organizationId,
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();
  const raciModal = useDisclosure();

  // Local Governance Store
  const {
    projects,
    consortiumOrganizations,
    raciAssignments,
    createRaciAssignment,
  } = useGovernance();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects && projects[0] ? projects[0]._id : 'prj_1'
  );

  const raciEntries = selectedProjectId
    ? raciAssignments.filter((r) => !r.project_id || r.project_id === selectedProjectId)
    : raciAssignments;

  const [raciForm, setRaciForm] = useState({
    activity_name: 'Deep Trench Shoring & Site HSE Compliance (تدعيم الحفر والسلامة)',
    wbs_code: 'WBS-02.1',
    discipline: 'HSE & Safety (السلامة والبيئة)',
    target_org_id: (consortiumOrganizations && consortiumOrganizations[1] ? consortiumOrganizations[1]._id : 'org_heavy') as any,
    raci_role: 'INDEMNIFIER' as any,
    liability_notes: 'Partner contractor holds 100% sole legal indemnification against trench collapses or municipality fines.',
  });

  const handleSaveRaci = () => {
    if (!selectedProjectId) {
      toast({ title: 'Validation Error', description: 'Please select a project first.', status: 'warning' });
      return;
    }

    try {
      const selectedOrg = consortiumOrganizations.find((o) => o._id === raciForm.target_org_id || o.id === raciForm.target_org_id);
      createRaciAssignment({
        project_id: selectedProjectId,
        activity_name: raciForm.activity_name,
        wbs_code: raciForm.wbs_code || undefined,
        discipline: raciForm.discipline,
        contractor_name: selectedOrg ? selectedOrg.name : 'Gulf Heavy Machinery LLC (Partner)',
        raci_role: raciForm.raci_role,
        liability_notes: raciForm.liability_notes,
      });

      toast({ title: 'RACI Assignment Updated (تم تحديث جدول المسؤوليات)', status: 'success' });
      raciModal.onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, status: 'error' });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'R':
        return <Badge colorScheme="blue" fontSize="10px">Responsible [R] (المسؤول عن التنفيذ)</Badge>;
      case 'A':
        return <Badge colorScheme="purple" fontSize="10px">Accountable [A] (المعتمد النهائي)</Badge>;
      case 'C':
        return <Badge colorScheme="yellow" fontSize="10px">Consulted [C] (جهة استشارية)</Badge>;
      case 'I':
        return <Badge colorScheme="gray" fontSize="10px">Informed [I] (جهة متابعة)</Badge>;
      case 'INDEMNIFIER':
        return <Badge colorScheme="red" fontSize="10px">⚠️ 100% Sole Indemnifier [IND] (الضامن للغرامات)</Badge>;
      default:
        return <Badge colorScheme="gray" fontSize="10px">{role}</Badge>;
    }
  };

  return (
    <Box p={6} maxW="1600px" mx="auto">
      {/* Header with Bilingual Labels */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <HStack spacing={3}>
            <FiGrid size={26} color="#805AD5" />
            <Box>
              <HStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold">
                  Responsibility & Liability Matrix (RACI)
                </Text>
                <Badge colorScheme="purple" variant="subtle" fontSize="sm">
                  مصفوفة المسؤوليات والتعويض القانوني
                </Badge>
              </HStack>
              <Text color="gray.500" fontSize="sm">
                Defines contractual boundaries, execution duty, and legal indemnification per project activity across all consortium partners.
              </Text>
            </Box>
          </HStack>
        </Box>
        <HStack>
          <Button leftIcon={<FiPlus />} colorScheme="purple" onClick={raciModal.onOpen} isDisabled={!selectedProjectId}>
            Add Activity Assignment (إضافة توزيع مسؤولية)
          </Button>
        </HStack>
      </Flex>

      {/* Project Selector */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} p={4} mb={6}>
        <HStack spacing={4} flexWrap="wrap">
          <Text fontWeight="semibold" fontSize="sm" minW="180px">
            Select Active Project (اختر المشروع النشط):
          </Text>
          <Select
            placeholder="Choose Project..."
            maxW="450px"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value as any)}
          >
            {projects?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </Select>
        </HStack>
      </Card>

      {/* RACI Grid */}
      {selectedProjectId ? (
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
          <CardHeader pb={2}>
            <HStack spacing={2}>
              <Text fontSize="lg" fontWeight="bold">
                Cross-Company Activity & Liability Matrix (جدول المسؤوليات وتحمل الأضرار)
              </Text>
              <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                CONTRACTUAL ROLES
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              [R] Responsible • [A] Accountable • [C] Consulted • [I] Informed • [IND] Holds 100% Legal Liability for site fines and safety accidents.
            </Text>
          </CardHeader>
          <Divider />
          <CardBody p={0}>
            {raciEntries && raciEntries.length > 0 ? (
              <Table variant="simple" size="sm">
                <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                  <Tr>
                    <Th>WBS Code (رمز البند)</Th>
                    <Th>Activity Name (النشاط/الأعمال)</Th>
                    <Th>Discipline (المجال)</Th>
                    <Th>Assigned Contractor (المقاول المكلف)</Th>
                    <Th>RACI Designation (المسؤولية)</Th>
                    <Th>Liability & Indemnity Clause (شروط التعويض)</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {raciEntries.map((row) => {
                    const assignedOrg = consortiumOrganizations?.find((o) => o._id === (row as any).organization_id || o.id === (row as any).organization_id);
                    return (
                      <Tr key={row._id}>
                        <Td fontFamily="mono" fontSize="xs" fontWeight="bold" color="blue.600">
                          {row.wbs_code || '—'}
                        </Td>
                        <Td fontWeight="semibold" fontSize="xs">{row.activity_name}</Td>
                        <Td>
                          <Tag size="sm" colorScheme="blue" fontSize="10px">
                            {row.discipline}
                          </Tag>
                        </Td>
                        <Td fontWeight="medium" fontSize="xs">{row.contractor_name || assignedOrg?.name || 'Partner Org'}</Td>
                        <Td>{getRoleBadge(row.raci_role)}</Td>
                        <Td fontSize="11px" color="gray.600">
                          {row.liability_notes || 'Standard consortium terms'}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            ) : (
              <Box p={8} textAlign="center">
                <Text color="gray.500">No RACI assignments for this project yet.</Text>
              </Box>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} p={8} textAlign="center">
          <Text color="gray.500">Please select an active project above to view its RACI and Liability Matrix.</Text>
        </Card>
      )}

      {/* MODAL: ADD RACI */}
      <Modal isOpen={raciModal.isOpen} onClose={raciModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Activity Assignment (إضافة توزيع مسؤولية)</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Activity / Scope Name (اسم النشاط أو بند الأعمال)</FormLabel>
                <Input
                  value={raciForm.activity_name}
                  onChange={(e) => setRaciForm({ ...raciForm, activity_name: e.target.value })}
                />
              </FormControl>

              <HStack w="full">
                <FormControl>
                  <FormLabel fontSize="xs">WBS Code (رمز هيكل تجزئة العمل)</FormLabel>
                  <Input
                    value={raciForm.wbs_code}
                    onChange={(e) => setRaciForm({ ...raciForm, wbs_code: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Discipline (التخصص)</FormLabel>
                  <Select
                    value={raciForm.discipline}
                    onChange={(e) => setRaciForm({ ...raciForm, discipline: e.target.value })}
                  >
                    <option value="Civil & Earthworks">Civil & Earthworks (أعمال مدنية وحفر)</option>
                    <option value="Mechanical & Plant">Mechanical & Plant (ميكانيكا ومعدات)</option>
                    <option value="Electrical / MEP">Electrical / MEP (كهرباء وكهروميكانيك)</option>
                    <option value="HSE & Safety">HSE & Safety (أمن وسلامة مهنية)</option>
                    <option value="Client Billing">Client Billing (فوترة ومستخلصات)</option>
                    <option value="Procurement">Procurement (مشتريات وتوريد)</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Assigned Contractor Company (المقاول المسؤول)</FormLabel>
                <Select
                  value={raciForm.target_org_id}
                  onChange={(e) => setRaciForm({ ...raciForm, target_org_id: e.target.value as any })}
                >
                  {consortiumOrganizations?.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">RACI Role & Legal Duty (طبيعة المسؤولية والتعويض)</FormLabel>
                <Select
                  value={raciForm.raci_role}
                  onChange={(e) => setRaciForm({ ...raciForm, raci_role: e.target.value as any })}
                >
                  <option value="R">Responsible [R] (المسؤول عن التنفيذ الفعلي)</option>
                  <option value="A">Accountable [A] (المعتمد النهائي أمام العميل)</option>
                  <option value="C">Consulted [C] (جهة استشارية فنية)</option>
                  <option value="I">Informed [I] (جهة متابعة وإشعار)</option>
                  <option value="INDEMNIFIER">⚠️ Sole Indemnifier [IND] (الضامن الوحيد للغرامات والتعويضات)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs">Liability & Indemnity Clause (شروط التعويض والمسؤولية القانونية)</FormLabel>
                <Textarea
                  value={raciForm.liability_notes}
                  onChange={(e) => setRaciForm({ ...raciForm, liability_notes: e.target.value })}
                  rows={2}
                />
              </FormControl>

              <Button colorScheme="purple" w="full" onClick={handleSaveRaci}>
                Save RACI Rule (حفظ التكليف والمسؤولية)
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProjectRaciMatrix;
