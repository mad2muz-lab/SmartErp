import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  Avatar,
  Badge,
  Divider,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/shared/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { FiEdit, FiMail, FiUser, FiShield, FiClock, FiCreditCard } from 'react-icons/fi';

const ProfileScreen: React.FC = () => {
  const { user, organizationDetails } = useAuth();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Get user countdown status
  const userCountdown = useQuery(
    api.countdownManagement.getUserCountdown,
    user?.id ? { user_id: user.id as any } : 'skip'
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin':
        return 'purple';
      case 'admin':
        return 'red';
      case 'manager':
        return 'blue';
      case 'user':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Box maxW="4xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Profile</Heading>
          <Text color="gray.600">Manage your account information and preferences</Text>
        </Box>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Profile Header */}
              <HStack spacing={4} align="center">
                <Avatar 
                  size="xl" 
                  name={`${user?.firstName} ${user?.lastName}`}
                />
                <VStack align="start" spacing={1} flex="1">
                  <HStack>
                    <Heading size="md">
                      {user?.firstName} {user?.lastName}
                    </Heading>
                    <Badge colorScheme={getRoleBadgeColor(user?.role || '')}>
                      {formatRole(user?.role || 'User')}
                    </Badge>
                  </HStack>
                  <Text color="gray.600" fontSize="sm">
                    {user?.email}
                  </Text>
                  {organizationDetails && (
                    <Text color="gray.500" fontSize="sm">
                      {organizationDetails.name}
                    </Text>
                  )}
                </VStack>
                <Button leftIcon={<FiEdit />} size="sm" variant="outline">
                  Edit Profile
                </Button>
              </HStack>

              <Divider />

              {/* Profile Details */}
              <VStack spacing={4} align="stretch">
                <Heading size="sm">Account Information</Heading>
                
                <HStack>
                  <Box minW="120px">
                    <HStack>
                      <FiUser />
                      <Text fontWeight="medium">Name:</Text>
                    </HStack>
                  </Box>
                  <Text>{user?.firstName} {user?.lastName}</Text>
                </HStack>

                <HStack>
                  <Box minW="120px">
                    <HStack>
                      <FiMail />
                      <Text fontWeight="medium">Email:</Text>
                    </HStack>
                  </Box>
                  <Text>{user?.email}</Text>
                </HStack>

                <HStack>
                  <Box minW="120px">
                    <HStack>
                      <FiShield />
                      <Text fontWeight="medium">Role:</Text>
                    </HStack>
                  </Box>
                  <HStack>
                    <Badge colorScheme={getRoleBadgeColor(user?.role || '')}>
                      {formatRole(user?.role || 'User')}
                    </Badge>
                  </HStack>
                </HStack>

                {organizationDetails && (
                  <HStack>
                    <Box minW="120px">
                      <Text fontWeight="medium">Organization:</Text>
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text>{organizationDetails.name}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {organizationDetails.email} • {organizationDetails.phone}
                      </Text>
                    </VStack>
                  </HStack>
                )}

                {user?.permissions && user.permissions.length > 0 && (
                  <HStack align="start">
                    <Box minW="120px">
                      <Text fontWeight="medium">Permissions:</Text>
                    </Box>
                    <HStack wrap="wrap">
                      {user.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" size="sm">
                          {permission}
                        </Badge>
                      ))}
                    </HStack>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Access Status Information */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="sm">Access Status</Heading>
              
              {userCountdown ? (
                <Alert 
                  status={userCountdown.is_expired ? "error" : userCountdown.is_expiring_soon ? "warning" : "success"} 
                  borderRadius="md"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle>
                      <HStack>
                        <FiClock />
                        <Text>
                          {userCountdown.is_expired 
                            ? "Access Expired" 
                            : userCountdown.is_expiring_soon 
                              ? "Access Expiring Soon" 
                              : "Access Active"
                          }
                        </Text>
                      </HStack>
                    </AlertTitle>
                    <AlertDescription>
                      {userCountdown.is_expired 
                        ? "Your access has expired. Please contact your administrator to renew access."
                        : userCountdown.is_expiring_soon
                          ? `Your access will expire in ${userCountdown.days_remaining} days. Contact your administrator to extend access.`
                          : `You have ${userCountdown.days_remaining} days of access remaining.`
                      }
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>
                      <HStack>
                        <FiClock />
                        <Text>No Access Timer Assigned</Text>
                      </HStack>
                    </AlertTitle>
                    <AlertDescription>
                      No access timer has been assigned to your account. Please contact your administrator to set up access permissions.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default ProfileScreen;
