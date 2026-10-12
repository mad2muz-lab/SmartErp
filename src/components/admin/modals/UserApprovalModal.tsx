import React, { useState } from 'react';
import { getDefaultPermissionsForRole } from '../../../data/modelPermissions';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  CheckboxGroup,
  Checkbox,
  Button,
  Alert,
  AlertIcon,
  Text,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
} from '@chakra-ui/react';

interface PendingRegistration {
  _id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  created_at: number;
  status: string;
}

interface Organization {
  _id: string;
  name: string;
}

interface UserApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegistration: PendingRegistration | null;
  organizations: Organization[] | undefined;
  availableRoles: Array<{ value: string; label: string }>;
  availablePermissions: Array<{ value: string; label: string }>;
  availableModels: Array<{ name: string; label: string; description: string; permissions: string[] }>;
  form: {
    organization_id: string;
    role: string;
    permissions: string[];
    modelPermissions: Record<string, string[]>;
    countdownDays: number;
    isGlobalAdmin: boolean;
    isPrimaryOrg: boolean;
    notes: string;
  };
  onFormChange: (field: string, value: any) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const UserApprovalModal: React.FC<UserApprovalModalProps> = ({
  isOpen,
  onClose,
  selectedRegistration,
  organizations,
  availableRoles,
  availablePermissions,
  availableModels,
  form,
  onFormChange,
  onSubmit,
  isLoading = false,
}) => {
  const [customCountdownDays, setCustomCountdownDays] = useState<number>(30);

  // Auto-populate permissions when role changes
  const handleRoleChange = (newRole: string) => {
    const defaultPermissions = getDefaultPermissionsForRole(newRole);
    onFormChange('role', newRole);
    onFormChange('permissions', defaultPermissions.systemPermissions);
    
    // Auto-populate model permissions
    const modelPermissions = defaultPermissions.modelPermissions.reduce((acc, model) => {
      acc[model.model] = model.permissions;
      return acc;
    }, {} as Record<string, string[]>);
    onFormChange('modelPermissions', modelPermissions);
  };

  // Handle countdown days change
  const handleCountdownDaysChange = (days: number) => {
    onFormChange('countdownDays', days);
    if (days === -1) {
      setCustomCountdownDays(30);
      onFormChange('countdownDays', 30);
    }
  };

  // Handle custom countdown days change
  const handleCustomCountdownDaysChange = (days: number) => {
    setCustomCountdownDays(days);
    onFormChange('countdownDays', days);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Approve User Registration
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {selectedRegistration && (
              <Alert status="info">
                <AlertIcon />
                <Text>
                  Approving: <strong>{selectedRegistration.given_name} {selectedRegistration.family_name}</strong>
                  <br />
                  Email: <strong>{selectedRegistration.email}</strong>
                </Text>
              </Alert>
            )}

            <FormControl isRequired>
              <FormLabel>Organization</FormLabel>
              <Select
                placeholder="Select organization"
                value={form.organization_id}
                onChange={(e) => onFormChange('organization_id', e.target.value)}
                isDisabled={form.isGlobalAdmin}
              >
                {organizations?.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
              </Select>
              {form.isGlobalAdmin && (
                <Text fontSize="sm" color="gray.500">
                  Global admins don't require organization assignment
                </Text>
              )}
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Role</FormLabel>
              <Select
                value={form.role}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                {availableRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>System Permissions</FormLabel>
              <CheckboxGroup
                value={form.permissions}
                onChange={(values) => onFormChange('permissions', values as string[])}
              >
                <HStack spacing={4} wrap="wrap">
                  {availablePermissions.map((permission) => (
                    <Checkbox key={permission.value} value={permission.value}>
                      {permission.label}
                    </Checkbox>
                  ))}
                </HStack>
              </CheckboxGroup>
            </FormControl>

            {!form.isGlobalAdmin && (
              <FormControl>
                <FormLabel>Model Access Permissions</FormLabel>
                <VStack spacing={3} align="stretch">
                  {availableModels.map((model) => (
                    <VStack key={model.name} spacing={2} align="stretch" p={3} border="1px" borderColor="gray.200" borderRadius="md">
                      <Text fontWeight="medium">{model.label}</Text>
                      <Text fontSize="sm" color="gray.600">{model.description}</Text>
                      <CheckboxGroup
                        value={form.modelPermissions[model.name] || []}
                        onChange={(values) => onFormChange('modelPermissions', {
                          ...form.modelPermissions,
                          [model.name]: values as string[]
                        })}
                      >
                        <HStack spacing={3} wrap="wrap">
                          {model.permissions.map((permission) => (
                            <Checkbox key={permission} value={permission} size="sm">
                              {permission.charAt(0).toUpperCase() + permission.slice(1)}
                            </Checkbox>
                          ))}
                        </HStack>
                      </CheckboxGroup>
                    </VStack>
                  ))}
                </VStack>
              </FormControl>
            )}

            {!form.isGlobalAdmin && (
              <FormControl>
                <FormLabel>Countdown Timer (Days)</FormLabel>
                <HStack spacing={3}>
                  <Select
                    value={form.countdownDays}
                    onChange={(e) => handleCountdownDaysChange(Number(e.target.value))}
                    flex={1}
                  >
                    <option value={7}>7 Days</option>
                    <option value={15}>15 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={180}>180 Days</option>
                    <option value={365}>365 Days</option>
                    <option value={0}>No Limit</option>
                    <option value={-1}>Custom Days</option>
                  </Select>
                  {form.countdownDays === -1 && (
                    <NumberInput
                      value={customCountdownDays}
                      onChange={(_, value) => handleCustomCountdownDaysChange(value)}
                      min={0}
                      max={3650}
                      flex={1}
                    >
                      <NumberInputField placeholder="Enter days" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {form.countdownDays === 0 
                    ? "No time limit - user will have permanent access"
                    : form.countdownDays === -1
                    ? `Custom duration: ${customCountdownDays} days`
                    : `Set access duration for this user in the organization`
                  }
                </Text>
              </FormControl>
            )}

            {!form.isGlobalAdmin && (
              <FormControl>
                <HStack justify="space-between">
                  <FormLabel mb={0}>Set as Primary Organization</FormLabel>
                  <Switch
                    isChecked={form.isPrimaryOrg}
                    onChange={(e) => onFormChange('isPrimaryOrg', e.target.checked)}
                  />
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  The user will use this organization as their default workspace
                </Text>
              </FormControl>
            )}

            <FormControl>
              <HStack justify="space-between">
                <FormLabel mb={0}>Make Global Admin</FormLabel>
                <Switch
                  isChecked={form.isGlobalAdmin}
                  onChange={(e) => onFormChange('isGlobalAdmin', e.target.checked)}
                />
              </HStack>
              <Text fontSize="sm" color="gray.500">
                Global admins have system-wide access and can manage all organizations
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={onSubmit}
            isDisabled={isLoading || (!form.isGlobalAdmin && !form.organization_id)}
            leftIcon={isLoading ? <Spinner size="sm" /> : undefined}
          >
            {isLoading ? 'Approving...' : 'Approve User'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserApprovalModal;
