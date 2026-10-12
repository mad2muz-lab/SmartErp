import React, { useState, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  RadioGroup,
  Radio,
  Box,
  Badge,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FiFileText, FiStar } from 'react-icons/fi';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelected: (templateId: string | null) => void;
  organizationId?: string;
  templateType?: string;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onTemplateSelected,
  organizationId,
  templateType = 'delivery_note',
}) => {
  console.log('TemplateSelectionModal component called with props:', {
    isOpen,
    organizationId,
    templateType,
    onTemplateSelected: typeof onTemplateSelected,
    onClose: typeof onClose
  });
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Get all available templates (we'll filter by type if needed)
  const allTemplates = useQuery(
    api.printTemplates.listTemplates,
    organizationId ? { organization_id: organizationId as any } : 'skip'
  );

  // Filter templates by type if specified
  const templates = allTemplates ? (templateType ? allTemplates.filter(t => t.template_type === templateType) : allTemplates) : [];

  console.log('TemplateSelectionModal:', {
    isOpen,
    organizationId,
    templateType,
    allTemplatesCount: allTemplates?.length || 0,
    filteredTemplatesCount: templates?.length || 0,
    templates: templates?.map(t => ({ name: t.name, type: t.template_type }))
  });

  const handleConfirm = useCallback(() => {
    console.log('Confirm button clicked, selectedTemplateId:', selectedTemplateId);
    if (typeof onTemplateSelected !== 'function') {
      console.error('onTemplateSelected is not a function!');
      return;
    }

    console.log('Calling onTemplateSelected with:', selectedTemplateId || null);
    onTemplateSelected(selectedTemplateId || null);
    onClose();
    setSelectedTemplateId('');
  }, [selectedTemplateId, onTemplateSelected, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
    setSelectedTemplateId('');
  }, [onClose]);

  console.log('TemplateSelectionModal rendering with isOpen:', isOpen, 'organizationId:', organizationId, 'templateType:', templateType);

  if (!isOpen) {
    console.log('TemplateSelectionModal not rendering because isOpen is false');
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={2}>
            <FiFileText />
            <Text>Select Print Template</Text>
          </HStack>
          {/* Debug indicator */}
          <Text fontSize="xs" color="red.500" mt={2}>
            DEBUG: Modal is visible! isOpen={String(isOpen)} templateType={templateType}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Text color="gray.600">
              Choose a template for printing this document. {templateType ? `Showing ${templateType.replace('_', ' ')} templates.` : 'Showing all available templates.'} You can also print without a template using default formatting.
            </Text>

            {!templates ? (
              <Text>Loading templates...</Text>
            ) : templates.length === 0 ? (
              <>
                {console.log('No templates available')}
                <Box p={4} bg={cardBg} border="1px" borderColor={borderColor} borderRadius="md">
                  <Text color="gray.600" textAlign="center">
                    No templates available. You can create templates in Settings → Print Templates.
                  </Text>
                </Box>
              </>
            ) : (
              <>
                {console.log('Rendering templates:', templates.map(t => t.name))}
                <RadioGroup value={selectedTemplateId} onChange={(value) => {
                  console.log('Template selected:', value);
                  setSelectedTemplateId(value);
                }}>
                  <VStack spacing={3} align="stretch">
                    {/* No template option */}
                    <Box
                      p={3}
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => setSelectedTemplateId('')}
                    >
                      <Radio value="" size="lg">
                        <VStack align="start" spacing={1} ml={2}>
                          <Text fontWeight="medium">Default Format</Text>
                          <Text fontSize="sm" color="gray.600">
                            Use organization default formatting
                          </Text>
                        </VStack>
                      </Radio>
                    </Box>

                    {/* Template options */}
                  {templates.map((template) => (
                    <Box
                      key={template._id}
                      p={3}
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => setSelectedTemplateId(template._id)}
                    >
                      <Radio value={template._id} size="lg">
                        <VStack align="start" spacing={1} ml={2}>
                          <HStack spacing={2}>
                            <Text fontWeight="medium">{template.name}</Text>
                            {template.is_default && (
                              <Badge colorScheme="yellow" variant="subtle" size="sm">
                                <HStack spacing={1}>
                                  <FiStar size={12} />
                                  <Text>Default</Text>
                                </HStack>
                              </Badge>
                            )}
                          </HStack>
                          {template.description && (
                            <Text fontSize="sm" color="gray.600">
                              {template.description}
                            </Text>
                          )}
                          <HStack spacing={2}>
                            <Badge colorScheme={template.is_active ? 'green' : 'red'} variant="subtle" size="sm">
                              {template.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge colorScheme="blue" variant="subtle" size="sm">
                              {template.template_type.replace('_', ' ')}
                            </Badge>
                          </HStack>
                        </VStack>
                      </Radio>
                    </Box>
                  ))}
                  </VStack>
                </RadioGroup>
              </>
            )}

            <HStack spacing={3} justify="flex-end" pt={4}>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleConfirm}>
                Print with Selected Template
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TemplateSelectionModal;