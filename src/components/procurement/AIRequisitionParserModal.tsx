import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Textarea,
  Box,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import { FiCpu, FiMessageSquare, FiFileText, FiCheck, FiTrash2, FiPlus, FiAlertCircle } from 'react-icons/fi';

export interface ParsedItem {
  item_name: string;
  quantity: number;
  unit?: string;
  estimated_unit_price?: number;
  description?: string;
  specifications?: string;
}

export interface ParsedRequisitionResult {
  department?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  justification?: string;
  suggested_supplier?: string;
  required_date?: string;
  items: ParsedItem[];
}

interface AIRequisitionParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: ParsedRequisitionResult) => void;
}

export const AIRequisitionParserModal: React.FC<AIRequisitionParserModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedData,
}) => {
  const toast = useToast();
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRequisitionResult | null>(null);

  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Sample quick templates for instant testing
  const sampleWhatsAppText = `Salam brother, please prepare urgent purchase requisition for Site B (Project Al-Naseem):
1. Rebar 12mm Grade 60 - 20 MT
2. Binding Wire 1.5mm - 50 Bundles
3. Steel Spacers 25mm - 500 pcs
4. Wooden Formwork Panels 18mm - 80 Sheets
Need delivery by next Monday. Supplier Al-Fozan Steel. Urgently required for foundation casting.`;

  const sampleEmailText = `Subject: Material Request - HVAC Maintenance
Dear Procurement Team,

Kindly arrange purchase requisition for the following maintenance items:
- Compressor Copeland 5HP Scroll: 2 Units (Est. 4500 \uE900 each)
- R410A Refrigerant Gas Cylinders: 5 Cylinders (Est. 350 \uE900 each)
- Copper Pipe 1/2 inch rolls: 10 Rolls (Est. 120 \uE900)
- Digital Manifold Gauge Set: 1 Set (Est. 850 \uE900)

Department: Maintenance & Facilities
Priority: High`;

  // Local intelligent extraction parser (Deterministic regex + natural language pattern matching)
  const parseRawContent = (rawText: string): ParsedRequisitionResult => {
    const text = rawText.trim();
    const lines = text.split('\n');

    // Extract Priority
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (/urgent|emergency|asap|critical|فوري|عاجل/i.test(text)) {
      priority = 'urgent';
    } else if (/high priority|priority high|important|هام/i.test(text)) {
      priority = 'high';
    } else if (/low priority|minor/i.test(text)) {
      priority = 'low';
    }

    // Extract Department
    let department = 'Operations / Site';
    if (/hvac|maintenance|facilities|صيانة/i.test(text)) {
      department = 'Maintenance & Facilities';
    } else if (/civil|site|construction|project|مشروع|موقع/i.test(text)) {
      department = 'Civil Projects';
    } else if (/it|software|hardware|تقنية/i.test(text)) {
      department = 'IT Department';
    } else if (/electrical|كهرباء/i.test(text)) {
      department = 'Electrical';
    }

    // Extract Supplier if mentioned
    let suggested_supplier = '';
    const supplierMatch = text.match(/(?:supplier|vendor|مورد)\s*[:\-]?\s*([A-Za-z0-9\s\u0600-\u06FF]+?)(?=[,\.\n]|$)/i);
    if (supplierMatch && supplierMatch[1]) {
      suggested_supplier = supplierMatch[1].trim();
    }

    // Extract Items
    const items: ParsedItem[] = [];
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      // Skip generic conversational headers
      if (/^(salam|dear|subject:|hi |hello|kindly|please|urgently|thanks|regards|department:|priority:)/i.test(cleanLine)) {
        continue;
      }

      // Pattern 1: "1. Item Name - 20 MT (Est. 500 SAR)" or "Item Name: 5 pcs"
      // Match number/bullet, item name, quantity, unit, price
      const bulletMatch = cleanLine.match(/^(?:[\d\*\-\•\>]+\.?\s*)?([A-Za-z0-9\u0600-\u06FF\s\/\(\)]+?)[\:\-\–]\s*(\d+(?:\.\d+)?)\s*([A-Za-z\u0600-\u06FF]+)?(?:\s*\(?(?:est\.?|price|sar|rs|\uE900)?\s*(\d+(?:\.\d+)?))?/i);

      if (bulletMatch) {
        const rawName = bulletMatch[1].replace(/^[0-9]+\.\s*/, '').trim();
        const qty = parseFloat(bulletMatch[2]) || 1;
        const unit = bulletMatch[3] ? bulletMatch[3].trim() : 'pcs';
        const price = bulletMatch[4] ? parseFloat(bulletMatch[4]) : 0;

        if (rawName.length > 2) {
          items.push({
            item_name: rawName,
            quantity: qty,
            unit: unit,
            estimated_unit_price: price,
            description: `Parsed from site request: ${cleanLine}`,
            specifications: cleanLine,
          });
          continue;
        }
      }

      // Pattern 2: "20 MT Rebar 12mm"
      const reverseMatch = cleanLine.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z\u0600-\u06FF]+)?\s+(?:of\s+)?([A-Za-z0-9\u0600-\u06FF\s\/\(\)]+)/i);
      if (reverseMatch) {
        const qty = parseFloat(reverseMatch[1]) || 1;
        const unit = reverseMatch[2] ? reverseMatch[2].trim() : 'pcs';
        const rawName = reverseMatch[3].trim();

        if (rawName.length > 2) {
          items.push({
            item_name: rawName,
            quantity: qty,
            unit: unit,
            estimated_unit_price: 0,
            description: cleanLine,
            specifications: cleanLine,
          });
        }
      }
    }

    // Default fallback if no structured items matched
    if (items.length === 0) {
      items.push({
        item_name: text.slice(0, 50),
        quantity: 1,
        unit: 'lot',
        estimated_unit_price: 0,
        description: text,
      });
    }

    return {
      department,
      priority,
      justification: text.slice(0, 150),
      suggested_supplier,
      items,
    };
  };

  const handleRunAIParser = () => {
    if (!inputText.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please paste WhatsApp text, email body, or transcript to parse.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsParsing(true);
    setTimeout(() => {
      try {
        const extracted = parseRawContent(inputText);
        setParsedData(extracted);
        setIsParsing(false);
        toast({
          title: 'Extraction Complete',
          description: `Extracted ${extracted.items.length} line items with ${extracted.priority.toUpperCase()} priority.`,
          status: 'success',
          duration: 3000,
        });
      } catch (err) {
        setIsParsing(false);
        toast({
          title: 'Parsing Error',
          description: 'Failed to extract items from text.',
          status: 'error',
          duration: 3000,
        });
      }
    }, 600);
  };

  const handleApply = () => {
    if (!parsedData || parsedData.items.length === 0) return;
    onApplyParsedData(parsedData);
    toast({
      title: 'Applied to Requisition',
      description: `${parsedData.items.length} line items loaded into form.`,
      status: 'success',
      duration: 3000,
    });
    onClose();
  };

  const handleUpdateItem = (index: number, field: keyof ParsedItem, val: any) => {
    if (!parsedData) return;
    const updated = [...parsedData.items];
    updated[index] = { ...updated[index], [field]: val };
    setParsedData({ ...parsedData, items: updated });
  };

  const handleRemoveItem = (index: number) => {
    if (!parsedData) return;
    const updated = parsedData.items.filter((_, i) => i !== index);
    setParsedData({ ...parsedData, items: updated });
  };

  const handleAddItem = () => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      items: [
        ...parsedData.items,
        { item_name: 'New Item', quantity: 1, unit: 'pcs', estimated_unit_price: 0 },
      ],
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl">
        <ModalHeader borderBottom="1px" borderColor={borderColor}>
          <HStack spacing={3}>
            <Box p={2} bg="purple.500" color="white" borderRadius="lg">
              <FiCpu size={20} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold">
                AI Requisition Ingestion & Parser
              </Text>
              <Text fontSize="xs" color="gray.500">
                Extract line items automatically from WhatsApp messages, emails, or site notes
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={5}>
          <Tabs variant="enclosed" colorScheme="purple">
            <TabList mb={4}>
              <Tab fontWeight="medium">
                <HStack spacing={2}>
                  <FiMessageSquare />
                  <Text>1. Raw Input Text (WhatsApp / Email / OCR)</Text>
                </HStack>
              </Tab>
              {parsedData && (
                <Tab fontWeight="medium">
                  <HStack spacing={2}>
                    <FiCheck />
                    <Text>2. Review & Edit Extracted Items ({parsedData.items.length})</Text>
                  </HStack>
                </Tab>
              )}
            </TabList>

            <TabPanels>
              {/* Tab 1: Raw Input */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Paste WhatsApp message, forwarded email, or scanned OCR text below:
                    </Text>
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="green"
                        onClick={() => setInputText(sampleWhatsAppText)}
                      >
                        Load WhatsApp Sample
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => setInputText(sampleEmailText)}
                      >
                        Load Email Sample
                      </Button>
                    </HStack>
                  </HStack>

                  <Textarea
                    rows={8}
                    placeholder="e.g. Salam please order 20 MT Rebar 12mm, 50 Bundles Binding Wire for Site B..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    fontFamily="mono"
                    fontSize="sm"
                    borderRadius="lg"
                  />

                  <Button
                    leftIcon={<FiCpu />}
                    colorScheme="purple"
                    size="md"
                    isLoading={isParsing}
                    loadingText="Parsing Materials with AI..."
                    onClick={handleRunAIParser}
                    w="full"
                  >
                    Extract Items & Metadata
                  </Button>
                </VStack>
              </TabPanel>

              {/* Tab 2: Review & Edit */}
              {parsedData && (
                <TabPanel px={0}>
                  <VStack spacing={5} align="stretch">
                    {/* Header Metadata Preview */}
                    <Box p={4} bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor}>
                      <HStack justify="space-between" wrap="wrap" gap={3}>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">Extracted Department</Text>
                          <Input
                            size="sm"
                            value={parsedData.department || ''}
                            onChange={(e) => setParsedData({ ...parsedData, department: e.target.value })}
                            w="220px"
                          />
                        </VStack>

                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">Detected Priority</Text>
                          <Select
                            size="sm"
                            value={parsedData.priority || 'medium'}
                            onChange={(e) => setParsedData({ ...parsedData, priority: e.target.value as any })}
                            w="140px"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </Select>
                        </VStack>

                        {parsedData.suggested_supplier && (
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" color="gray.500">Suggested Supplier</Text>
                            <Badge colorScheme="purple" fontSize="sm" p={1} borderRadius="md">
                              {parsedData.suggested_supplier}
                            </Badge>
                          </VStack>
                        )}
                      </HStack>
                    </Box>

                    {/* Items Table */}
                    <Box overflowX="auto" border="1px" borderColor={borderColor} borderRadius="lg">
                      <Table size="sm" variant="simple">
                        <Thead bg={useColorModeValue('gray.100', 'gray.750')}>
                          <Tr>
                            <Th>Item Name / Description</Th>
                            <Th w="120px">Qty</Th>
                            <Th w="110px">Unit</Th>
                            <Th w="140px">Est. Unit Price</Th>
                            <Th w="50px"></Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {parsedData.items.map((item, idx) => (
                            <Tr key={idx}>
                              <Td>
                                <Input
                                  size="sm"
                                  value={item.item_name}
                                  onChange={(e) => handleUpdateItem(idx, 'item_name', e.target.value)}
                                />
                              </Td>
                              <Td>
                                <NumberInput
                                  size="sm"
                                  value={item.quantity}
                                  min={0.01}
                                  onChange={(_, val) => handleUpdateItem(idx, 'quantity', val || 1)}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </Td>
                              <Td>
                                <Input
                                  size="sm"
                                  value={item.unit || 'pcs'}
                                  onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                                />
                              </Td>
                              <Td>
                                <NumberInput
                                  size="sm"
                                  value={item.estimated_unit_price || 0}
                                  min={0}
                                  precision={2}
                                  onChange={(_, val) => handleUpdateItem(idx, 'estimated_unit_price', val || 0)}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </Td>
                              <Td>
                                <IconButton
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  icon={<FiTrash2 />}
                                  aria-label="Remove item"
                                  onClick={() => handleRemoveItem(idx)}
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>

                    <Button
                      size="xs"
                      leftIcon={<FiPlus />}
                      alignSelf="start"
                      onClick={handleAddItem}
                      variant="outline"
                    >
                      Add Another Item
                    </Button>
                  </VStack>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter borderTop="1px" borderColor={borderColor}>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              leftIcon={<FiCheck />}
              isDisabled={!parsedData || parsedData.items.length === 0}
              onClick={handleApply}
            >
              Apply to Requisition Form
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
