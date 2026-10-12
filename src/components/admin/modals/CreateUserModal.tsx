import React from 'react';
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
  Input,
  Select,
  CheckboxGroup,
  Checkbox,
  Button,
  Textarea,
  FormHelperText,
} from '@chakra-ui/react';

interface CreateUserForm {
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  organization_id: string;
  permissions: string[];
  is_global_admin: boolean;
  notes: string;
}

interface Organization {
  _id: string;
  name: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CreateUserForm;
  organizations: Organization[] | undefined;
  availableRoles: Array<{ value: string; label: string }>;
  availablePermissions: Array<{ value: string; label: string }>;
  onFormChange: (field: keyof CreateUserForm, value: any) => void;
  onSubmit: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  form,
  organizations,
  availableRoles,
  availablePermissions,
  onFormChange,
  onSubmit,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New User</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <HStack spacing={4} width="100%">
              <FormControl isRequired>
                <FormLabel>First Name</FormLabel>
                <Input
                  value={form.given_name}
                  onChange={(e) => onFormChange('given_name', e.target.value)}
                  placeholder="Enter first name"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Last Name</FormLabel>
                <Input
                  value={form.family_name}
                  onChange={(e) => onFormChange('family_name', e.target.value)}
                  placeholder="Enter last name"
                />
              </FormControl>
            </HStack>
            
            <FormControl isRequired>
              <FormLabel>Email (Google Account)</FormLabel>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => onFormChange('email', e.target.value)}
                placeholder="user@gmail.com"
              />
              <FormHelperText>User must sign in with this Google account</FormHelperText>
            </FormControl>

            <HStack spacing={4} width="100%">
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={form.role}
                  onChange={(e) => onFormChange('role', e.target.value)}
                >
                  {availableRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Organization</FormLabel>
                <Select
                  value={form.organization_id}
                  onChange={(e) => onFormChange('organization_id', e.target.value)}
                >
                  <option value="">No Organization</option>
                  {organizations?.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Permissions</FormLabel>
              <CheckboxGroup
                value={form.permissions}
                onChange={(values) => onFormChange('permissions', values as string[])}
              >
                <HStack spacing={4}>
                  {availablePermissions.map((permission) => (
                    <Checkbox key={permission.value} value={permission.value}>
                      {permission.label}
                    </Checkbox>
                  ))}
                </HStack>
              </CheckboxGroup>
            </FormControl>

            <FormControl>
              <Checkbox
                isChecked={form.is_global_admin}
                onChange={(e) => onFormChange('is_global_admin', e.target.checked)}
              >
                Make Global Admin
              </Checkbox>
              <FormHelperText>Global admins have access to all organizations</FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Notes (Optional)</FormLabel>
              <Textarea
                value={form.notes}
                onChange={(e) => onFormChange('notes', e.target.value)}
                placeholder="Any additional notes about this user..."
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={onSubmit}>
            Create User
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateUserModal;
