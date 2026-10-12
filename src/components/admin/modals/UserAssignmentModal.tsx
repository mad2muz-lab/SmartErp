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
} from '@chakra-ui/react';

interface User {
  _id: string;
  email: string;
  given_name?: string;
  family_name?: string;
}

interface Organization {
  _id: string;
  name: string;
}

interface UserAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User | null;
  selectedOrganization: Organization | null;
  assignmentAction: 'assign' | 'edit' | 'remove';
  selectedRole: string;
  selectedPermissions: string[];
  selectedModelPermissions: Record<string, string[]>;
  isPrimaryOrg: boolean;
  countdownDays: number;
  organizations: Organization[] | undefined;
  availableRoles: Array<{ value: string; label: string }>;
  availablePermissions: Array<{ value: string; label: string }>;
  availableModels: Array<{ name: string; label: string; description: string; permissions: string[] }>;
  onRoleChange: (role: string) => void;
  onPermissionsChange: (permissions: string[]) => void;
  onModelPermissionsChange: (model: string, permissions: string[]) => void;
  onOrganizationChange: (org: Organization | null) => void;
  onPrimaryOrgChange: (isPrimary: boolean) => void;
  onCountdownDaysChange: (days: number) => void;
  onProcessAssignment: () => void;
}

const UserAssignmentModal: React.FC<UserAssignmentModalProps> = ({
  isOpen,
  onClose,
  selectedUser,
  selectedOrganization,
  assignmentAction,
  selectedRole,
  selectedPermissions,
  selectedModelPermissions,
  isPrimaryOrg,
  countdownDays,
  organizations,
  availableRoles,
  availablePermissions,
  availableModels,
  onRoleChange,
  onPermissionsChange,
  onModelPermissionsChange,
  onOrganizationChange,
  onPrimaryOrgChange,
  onCountdownDaysChange,
  onProcessAssignment,
}) => {
  const [customCountdownDays, setCustomCountdownDays] = useState<number>(30);
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {assignmentAction === 'assign' && 'Assign User to Organization'}
          {assignmentAction === 'edit' && 'Edit User Assignment'}
          {assignmentAction === 'remove' && 'Remove User Assignment'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {selectedUser && (
              <Alert status="info">
                <AlertIcon />
                <Text>
                  User: <strong>{selectedUser.email}</strong>
                </Text>
              </Alert>
            )}

            {assignmentAction === 'remove' ? (
              <Alert status="warning">
                <AlertIcon />
                <Text>
                  Are you sure you want to remove <strong>{selectedUser?.email}</strong> from{' '}
                  <strong>{selectedOrganization?.name}</strong>?
                </Text>
              </Alert>
            ) : (
              <>
                <FormControl>
                  <FormLabel>Organization</FormLabel>
                  <Select
                    placeholder="Select organization"
                    value={selectedOrganization?._id || ''}
                    onChange={(e) => {
                      const orgId = e.target.value;
                      const org = organizations?.find(o => o._id === orgId);
                      onOrganizationChange(org || null);
                    }}
                    isDisabled={assignmentAction === 'edit'}
                  >
                    {organizations?.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={selectedRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      onRoleChange(newRole);
                      
                      // Auto-select model permissions based on role
                      const defaultPermissions = getDefaultPermissionsForRole(newRole);
                      defaultPermissions.modelPermissions.forEach((modelPerm: any) => {
                        onModelPermissionsChange(modelPerm.model, modelPerm.permissions);
                      });
                    }}
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
                    value={selectedPermissions}
                    onChange={(values) => onPermissionsChange(values as string[])}
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

                <FormControl>
                  <FormLabel>Model Access Permissions</FormLabel>
                  <VStack spacing={3} align="stretch">
                    {availableModels.map((model) => (
                      <VStack key={model.name} spacing={2} align="stretch" p={3} border="1px" borderColor="gray.200" borderRadius="md">
                        <Text fontWeight="medium">{model.label}</Text>
                        <Text fontSize="sm" color="gray.600">{model.description}</Text>
                        <CheckboxGroup
                          value={selectedModelPermissions[model.name] || []}
                          onChange={(values) => onModelPermissionsChange(model.name, values as string[])}
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

                <FormControl>
                  <FormLabel>Countdown Timer (Days)</FormLabel>
                  <HStack spacing={3}>
                    <Select
                      value={countdownDays}
                      onChange={(e) => onCountdownDaysChange(Number(e.target.value))}
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
                    {countdownDays === -1 && (
                      <NumberInput
                        value={customCountdownDays}
                        onChange={(_, value) => {
                          setCustomCountdownDays(value);
                          onCountdownDaysChange(value);
                        }}
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
                    {countdownDays === 0 
                      ? "No time limit - user will have permanent access"
                      : countdownDays === -1
                      ? `Custom duration: ${customCountdownDays} days`
                      : `Set access duration for this user in the organization`
                    }
                  </Text>
                </FormControl>

                <FormControl>
                  <HStack justify="space-between">
                    <FormLabel mb={0}>Set as Primary Organization</FormLabel>
                    <Switch
                      isChecked={isPrimaryOrg}
                      onChange={(e) => onPrimaryOrgChange(e.target.checked)}
                    />
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    The user will use this organization as their default workspace
                  </Text>
                </FormControl>
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme={assignmentAction === 'remove' ? 'red' : 'blue'}
            onClick={onProcessAssignment}
            isDisabled={assignmentAction !== 'remove' && !selectedOrganization}
          >
            {assignmentAction === 'assign' && 'Assign'}
            {assignmentAction === 'edit' && 'Update'}
            {assignmentAction === 'remove' && 'Remove'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserAssignmentModal;
