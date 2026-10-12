import React, { useState } from 'react';
import {
  VStack,
  HStack,
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
  Center,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FiClock, FiEdit3 } from 'react-icons/fi';

interface UserCountdown {
  _id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  organization_name?: string;
  countdown_type: string;
  countdown_value: number;
  days_remaining: number;
  is_expired: boolean;
  is_expiring_soon: boolean;
  is_active: boolean;
  has_countdown: boolean;
}

interface CountdownTimerManagementTabProps {
  userCountdowns: UserCountdown[] | undefined;
  onExtendCountdown: (countdownId: string, userId: string, additionalDays: number) => void;
  onCreateCountdown: (userId: string, userEmail: string, days: number) => void;
  onDisableUser: (userId: string, userEmail: string) => void;
  onEnableUser: (userId: string, userEmail: string) => void;
  onUpdateCountdown: (countdownId: string, userId: string, newDays: number) => void;
}

const CountdownTimerManagementTab: React.FC<CountdownTimerManagementTabProps> = ({
  userCountdowns,
  onExtendCountdown,
  onCreateCountdown,
  onDisableUser,
  onEnableUser,
  onUpdateCountdown,
}) => {
  const [customDays, setCustomDays] = useState<number>(30);
  const [editingCountdown, setEditingCountdown] = useState<string | null>(null);
  const [editDays, setEditDays] = useState<number>(30);

  const handleExtendWithCustomDays = (countdownId: string, userId: string) => {
    if (customDays > 0) {
      onExtendCountdown(countdownId, userId, customDays);
    } else {
      // If days is 0, remove user access
      onUpdateCountdown(countdownId, userId, 0);
    }
  };

  const handleCreateWithCustomDays = (userId: string, userEmail: string) => {
    if (customDays > 0) {
      onCreateCountdown(userId, userEmail, customDays);
    } else {
      // If days is 0, don't create countdown (user will have no access)
      console.log('No countdown created - user will have no access');
    }
  };

  const handleSaveEdit = (countdownId: string, userId: string) => {
    onUpdateCountdown(countdownId, userId, editDays);
    setEditingCountdown(null);
  };

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="semibold">
          Countdown Timer Management
        </Text>
        <Text fontSize="sm" color="gray.500">
          Manage user access countdown timers
        </Text>
      </HStack>

      <Card>
        <CardBody p={0}>
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>User</Th>
                <Th>Organization</Th>
                <Th>Countdown Type</Th>
                <Th>Days Remaining</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {userCountdowns?.map((countdown) => (
                <Tr key={countdown._id}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">{countdown.user_name}</Text>
                      <Text fontSize="sm" color="gray.500">{countdown.user_email}</Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Text>{countdown.organization_name || 'No Organization'}</Text>
                  </Td>
                  <Td>
                    {countdown.has_countdown ? (
                      <Badge colorScheme="blue">
                        {countdown.countdown_type} ({countdown.countdown_value})
                      </Badge>
                    ) : (
                      <Badge colorScheme="gray">No Countdown</Badge>
                    )}
                  </Td>
                  <Td>
                    {countdown.has_countdown ? (
                      <HStack>
                        <Text fontWeight="medium">{countdown.days_remaining}</Text>
                        {countdown.is_expiring_soon && (
                          <Badge colorScheme="orange" size="sm">Expiring Soon</Badge>
                        )}
                      </HStack>
                    ) : (
                      <Text color="gray.500">-</Text>
                    )}
                  </Td>
                  <Td>
                    {countdown.has_countdown ? (
                      countdown.is_expired ? (
                        <Badge colorScheme="red">Expired</Badge>
                      ) : countdown.is_active ? (
                        <Badge colorScheme="green">Active</Badge>
                      ) : (
                        <Badge colorScheme="gray">Inactive</Badge>
                      )
                    ) : (
                      <Badge colorScheme="red">No Access</Badge>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      {countdown.has_countdown && !countdown.is_expired && (
                        <Popover placement="top">
                          <PopoverTrigger>
                            <Button size="sm" colorScheme="orange">
                              Extend
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent p={4}>
                            <PopoverArrow />
                            <PopoverCloseButton />
                            <PopoverHeader>Extend Countdown</PopoverHeader>
                            <PopoverBody>
                              <FormControl>
                                <FormLabel>Additional Days</FormLabel>
                                <NumberInput
                                  value={customDays}
                                  onChange={(_, value) => setCustomDays(value)}
                                  min={0}
                                  max={3650} // 10 years max
                                >
                                  <NumberInputField />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500" mt={2}>
                                  {customDays === 0 
                                    ? "Setting to 0 will remove user access" 
                                    : `Will extend by ${customDays} days`
                                  }
                                </Text>
                              </FormControl>
                            </PopoverBody>
                            <PopoverFooter>
                              <HStack justify="flex-end" spacing={2}>
                                <Button size="sm" variant="outline">
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  colorScheme="orange"
                                  onClick={() => handleExtendWithCustomDays(countdown._id, countdown.user_id)}
                                >
                                  Extend
                                </Button>
                              </HStack>
                            </PopoverFooter>
                          </PopoverContent>
                        </Popover>
                      )}
                      {countdown.has_countdown && (
                        <Popover placement="top">
                          <PopoverTrigger>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              leftIcon={<FiEdit3 />}
                              onClick={() => {
                                setEditDays(countdown.countdown_value);
                                setEditingCountdown(countdown._id);
                              }}
                            >
                              Edit
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent p={4}>
                            <PopoverArrow />
                            <PopoverCloseButton />
                            <PopoverHeader>Edit Countdown</PopoverHeader>
                            <PopoverBody>
                              <FormControl>
                                <FormLabel>Total Days</FormLabel>
                                <NumberInput
                                  value={editDays}
                                  onChange={(_, value) => setEditDays(value)}
                                  min={0}
                                  max={3650} // 10 years max
                                >
                                  <NumberInputField />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500" mt={2}>
                                  {editDays === 0 
                                    ? "Setting to 0 will remove user access" 
                                    : `User will have ${editDays} days of access`
                                  }
                                </Text>
                              </FormControl>
                            </PopoverBody>
                            <PopoverFooter>
                              <HStack justify="flex-end" spacing={2}>
                                <Button size="sm" variant="outline">
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  colorScheme="blue"
                                  onClick={() => handleSaveEdit(countdown._id, countdown.user_id)}
                                >
                                  Save
                                </Button>
                              </HStack>
                            </PopoverFooter>
                          </PopoverContent>
                        </Popover>
                      )}
                      {!countdown.has_countdown && (
                        <Popover placement="top">
                          <PopoverTrigger>
                            <Button size="sm" colorScheme="green">
                              Create Countdown
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent p={4}>
                            <PopoverArrow />
                            <PopoverCloseButton />
                            <PopoverHeader>Create Countdown</PopoverHeader>
                            <PopoverBody>
                              <FormControl>
                                <FormLabel>Days of Access</FormLabel>
                                <NumberInput
                                  value={customDays}
                                  onChange={(_, value) => setCustomDays(value)}
                                  min={0}
                                  max={3650} // 10 years max
                                >
                                  <NumberInputField />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500" mt={2}>
                                  {customDays === 0 
                                    ? "User will have no access" 
                                    : `User will have ${customDays} days of access`
                                  }
                                </Text>
                              </FormControl>
                            </PopoverBody>
                            <PopoverFooter>
                              <HStack justify="flex-end" spacing={2}>
                                <Button size="sm" variant="outline">
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  colorScheme="green"
                                  onClick={() => handleCreateWithCustomDays(countdown.user_id, countdown.user_email)}
                                >
                                  Create
                                </Button>
                              </HStack>
                            </PopoverFooter>
                          </PopoverContent>
                        </Popover>
                      )}
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => onDisableUser(countdown.user_id, countdown.user_email)}
                      >
                        Disable User
                      </Button>
                      {!countdown.is_active && (
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => onEnableUser(countdown.user_id, countdown.user_email)}
                        >
                          Enable User
                        </Button>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
              {(!userCountdowns || userCountdowns.length === 0) && (
                <Tr>
                  <Td colSpan={6}>
                    <Center py={8}>
                      <VStack spacing={2}>
                        <FiClock size={48} color="gray" />
                        <Text fontSize="lg" color="gray.500">
                          No countdown timers found
                        </Text>
                        <Text fontSize="sm" color="gray.400">
                          Countdown timers will appear here once users are approved with time-based access
                        </Text>
                      </VStack>
                    </Center>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default CountdownTimerManagementTab;
