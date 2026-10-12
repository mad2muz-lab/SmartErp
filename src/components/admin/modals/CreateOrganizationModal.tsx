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
  Textarea,
  Button,
} from '@chakra-ui/react';

interface CreateOrgForm {
  name: string;
  description: string;
  industry: string;
  website: string;
  contact_email: string;
  phone: string;
  address: string;
  max_users: number;
  features: string[];
}

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CreateOrgForm;
  onFormChange: (field: keyof CreateOrgForm, value: any) => void;
  onSubmit: () => void;
}

const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  isOpen,
  onClose,
  form,
  onFormChange,
  onSubmit,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Organization</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Organization Name</FormLabel>
              <Input
                value={form.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                placeholder="Enter organization name"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={form.description}
                onChange={(e) => onFormChange('description', e.target.value)}
                placeholder="Brief description of the organization..."
              />
            </FormControl>

            <HStack spacing={4} width="100%">
              <FormControl>
                <FormLabel>Industry</FormLabel>
                <Input
                  value={form.industry}
                  onChange={(e) => onFormChange('industry', e.target.value)}
                  placeholder="e.g., Technology, Healthcare"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Contact Email</FormLabel>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => onFormChange('contact_email', e.target.value)}
                  placeholder="contact@organization.com"
                />
              </FormControl>
            </HStack>

            <HStack spacing={4} width="100%">
              <FormControl>
                <FormLabel>Website</FormLabel>
                <Input
                  value={form.website}
                  onChange={(e) => onFormChange('website', e.target.value)}
                  placeholder="https://www.organization.com"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  value={form.phone}
                  onChange={(e) => onFormChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Address</FormLabel>
              <Textarea
                value={form.address}
                onChange={(e) => onFormChange('address', e.target.value)}
                placeholder="Full address..."
              />
            </FormControl>

            <HStack spacing={4} width="100%">
              <FormControl>
                <FormLabel>Max Users</FormLabel>
                <Input
                  type="number"
                  value={form.max_users}
                  onChange={(e) => onFormChange('max_users', parseInt(e.target.value) || 100)}
                  min="1"
                />
              </FormControl>
            </HStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="green" onClick={onSubmit}>
            Create Organization
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateOrganizationModal;
