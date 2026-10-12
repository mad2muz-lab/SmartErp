import React from 'react';
import {
  HStack,
  Card,
  CardBody,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiUsers, FiHome, FiEye } from 'react-icons/fi';

interface StatsCardsProps {
  totalUsers: number;
  totalOrganizations: number;
  pendingApprovals: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  totalUsers,
  totalOrganizations,
  pendingApprovals,
}) => {
  return (
    <HStack spacing={4} wrap="wrap">
      <Card minW="200px" bg="blue.50" borderColor="blue.200" borderWidth="1px">
        <CardBody>
          <HStack>
            <FiUsers size={24} color="blue" />
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                {totalUsers}
              </Text>
              <Text fontSize="sm" color="blue.500">Total Users</Text>
            </VStack>
          </HStack>
        </CardBody>
      </Card>

      <Card minW="200px" bg="green.50" borderColor="green.200" borderWidth="1px">
        <CardBody>
          <HStack>
            <FiHome size={24} color="green" />
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {totalOrganizations}
              </Text>
              <Text fontSize="sm" color="green.500">Organizations</Text>
            </VStack>
          </HStack>
        </CardBody>
      </Card>

      <Card minW="200px" bg="orange.50" borderColor="orange.200" borderWidth="1px">
        <CardBody>
          <HStack>
            <FiEye size={24} color="orange" />
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                {pendingApprovals}
              </Text>
              <Text fontSize="sm" color="orange.500">Pending Approvals</Text>
            </VStack>
          </HStack>
        </CardBody>
      </Card>
    </HStack>
  );
};

export default StatsCards;
