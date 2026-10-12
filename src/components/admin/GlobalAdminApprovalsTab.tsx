import React from 'react';
import {
  VStack,
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  HStack,
} from '@chakra-ui/react';
import { FiShield } from 'react-icons/fi';

interface PendingRegistration {
  _id: string;
  email: string;
  given_name: string;
  family_name: string;
  created_at: number;
  status: string;
}

interface GlobalAdminApprovalsTabProps {
  pendingApprovals: PendingRegistration[] | undefined;
  onApprove: (registrationId: string) => void;
  onReject: (registrationId: string, reason: string) => void;
}

const GlobalAdminApprovalsTab: React.FC<GlobalAdminApprovalsTabProps> = ({
  pendingApprovals,
  onApprove,
  onReject,
}) => {
  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Heading size="md" mb={2}>
          <HStack>
            <FiShield />
            <Text>Pending Global Admin Approvals</Text>
          </HStack>
        </Heading>
        <Text color="gray.600">Review and approve new user signup requests</Text>
      </Box>

      {pendingApprovals && pendingApprovals.length > 0 ? (
        <Card>
          <CardBody p={0}>
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>User</Th>
                  <Th>Requested At</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pendingApprovals.map((request) => (
                  <Tr key={request._id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">
                          {request.given_name} {request.family_name}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {request.email}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      {new Date(request.created_at).toLocaleDateString()}
                    </Td>
                    <Td>
                      <Badge colorScheme="orange">Pending Approval</Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => onApprove(request._id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) {
                              onReject(request._id, reason);
                            }
                          }}
                        >
                          Reject
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody textAlign="center" py={8}>
            <Text color="gray.500">No pending global admin approvals</Text>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default GlobalAdminApprovalsTab;
