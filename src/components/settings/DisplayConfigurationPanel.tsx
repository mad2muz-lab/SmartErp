import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  useColorModeValue,
} from '@chakra-ui/react';
import { FIELD_LABELS } from '../../data/organizationData';

interface DisplayConfigurationPanelProps {
  config: any;
  onChange: (config: any) => void;
  title: string;
}

const DisplayConfigurationPanel: React.FC<DisplayConfigurationPanelProps> = ({
  config,
  onChange,
  title,
}) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleToggle = (field: string) => {
    onChange({
      ...config,
      [field]: !config[field],
    });
  };

  return (
    <Card bg={cardBg} border="1px" borderColor={borderColor}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold" fontSize="lg">{title}</Text>
          
          <VStack spacing={3} align="stretch">
            {Object.entries(FIELD_LABELS).map(([field, label]) => (
              <FormControl key={field} display="flex" alignItems="center">
                <FormLabel htmlFor={field} mb="0" flex="1">
                  {label}
                </FormLabel>
                <Switch
                  id={field}
                  isChecked={config[field] || false}
                  onChange={() => handleToggle(field)}
                  colorScheme="blue"
                />
              </FormControl>
            ))}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default DisplayConfigurationPanel;
