import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useMutation, useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiCheckCircle, FiPackage } from 'react-icons/fi';
import QRCode from 'qrcode';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import toast from 'react-hot-toast';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  qr_code?: string;
}

const InventoryMovementsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedOrganization } = useAuth();
  const isConvex = isConvexOrgId(selectedOrganization);
  const inventory = useQuery(
    api.inventory.listInventory,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );
  const ensureInventoryQr = useMutation(api.inventory.ensureInventoryQr);
  const createInventory = useMutation(api.inventory.createInventory);
  const adjustInventoryStock = useMutation(api.inventory.adjustInventoryStock);

  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [scanValue, setScanValue] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [legacyQrItem, setLegacyQrItem] = useState<InventoryItem | null>(null);
  const [createdQr, setCreatedQr] = useState<{ item: InventoryItem; code: string } | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [unknownCode, setUnknownCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'pcs',
    cost_price: 0,
    selling_price: 0,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<HTMLInputElement>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const cameraSessionRef = useRef(0);
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const items = useMemo(() => inventory || [], [inventory]);

  const updateScanValue = useCallback((value: string) => {
    setScanValue(value);
    setScannedItem(null);
    setLegacyQrItem(null);
    setUnknownCode('');
  }, []);

  const stopCamera = useCallback(() => {
    cameraSessionRef.current += 1;
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setIsCameraActive(false);
  }, []);

  useEffect(() => () => {
    cameraSessionRef.current += 1;
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!createdQr) {
      setQrImage('');
      return;
    }

    QRCode.toDataURL(createdQr.code, { width: 280, margin: 2 })
      .then((dataUrl) => {
        if (!cancelled) setQrImage(dataUrl);
      })
      .catch((error) => {
        console.error('Failed to generate item QR image:', error);
        if (!cancelled) toast.error('Could not render the item QR code');
      });
    return () => {
      cancelled = true;
    };
  }, [createdQr]);

  const resolveScan = useCallback((rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      toast.error('Scan or enter a material QR code first');
      return;
    }

    const matchedItem = items.find((item) => item.qr_code === code);
    if (matchedItem) {
      setScannedItem(matchedItem);
      setLegacyQrItem(null);
      setCreatedQr(null);
      setUnknownCode('');
      toast.success(`QR verified: ${matchedItem.name}`);
      return;
    }

    const knownItemWithoutQr = items.find(
      (item) =>
        !item.qr_code &&
        item._id !== createdQr?.item._id &&
        code === `smart-erp://inventory/${item._id}`
    );
    if (knownItemWithoutQr) {
      setScannedItem(null);
      setLegacyQrItem(knownItemWithoutQr);
      setCreatedQr(null);
      setUnknownCode('');
      toast('Known material found. Register its QR code before moving stock.');
      return;
    }

    if (createdQr?.code === code) {
      const newlyCreatedItem = items.find((item) => item._id === createdQr.item._id);
      if (newlyCreatedItem) {
        setScannedItem(newlyCreatedItem);
        setLegacyQrItem(null);
        setUnknownCode('');
        toast.success(`QR verified: ${newlyCreatedItem.name}`);
        return;
      }
      setScannedItem(createdQr.item);
      setLegacyQrItem(null);
      setUnknownCode('');
      toast.success(`QR verified: ${newItem.name}`);
      return;
    }

    setScannedItem(null);
    setCreatedQr(null);
    setUnknownCode(code);
    toast.error('QR code is not registered for an active material in this organization');
  }, [createdQr, items]);

  const generateQrForExistingItem = async (item: InventoryItem) => {
    if (!selectedOrganization) return;
    try {
      const code = await ensureInventoryQr({
        id: item._id as any,
        organization_id: selectedOrganization as any,
      });
      setScannedItem(null);
      setLegacyQrItem(null);
      setCreatedQr({ item: { ...item, qr_code: code }, code });
      setScanValue('');
      toast.success('QR code is ready. Scan the displayed code to verify it.');
    } catch (error) {
      console.error('Failed to generate QR code for inventory item:', error);
      toast.error(error instanceof Error ? error.message : 'Could not generate the item QR code');
    }
  };

  const createMaterial = async () => {
    if (!selectedOrganization) {
      toast.error('Select an organization before creating a material');
      return;
    }
    if (!newItem.name.trim()) {
      toast.error('Enter the material name first');
      return;
    }
    try {
      const itemId = await createInventory({
        name: newItem.name.trim(),
        sku: newItem.sku.trim() || undefined,
        category: newItem.category.trim() || 'General Item',
        unit: newItem.unit.trim() || 'pcs',
        cost_price: newItem.cost_price,
        selling_price: newItem.selling_price,
        quantity: 0,
        organization_id: selectedOrganization as any,
      });
      const code = `smart-erp://inventory/${itemId}`;
      const item: InventoryItem = {
        _id: itemId,
        name: newItem.name.trim(),
        sku: newItem.sku.trim(),
        category: newItem.category.trim() || 'General Item',
        unit: newItem.unit.trim() || 'pcs',
        quantity: 0,
        cost_price: newItem.cost_price,
        selling_price: newItem.selling_price,
        qr_code: code,
      };
      setScannedItem(null);
      setLegacyQrItem(null);
      setCreatedQr({ item, code });
      setMovementType('in');
      setUnknownCode('');
      setScanValue('');
      setNewItem({
        name: '',
        sku: '',
        category: '',
        unit: 'pcs',
        cost_price: 0,
        selling_price: 0,
      });
      toast.success('Material created. Scan its new QR code to continue.');
    } catch (error) {
      console.error('Failed to create inventory material:', error);
      toast.error(error instanceof Error ? error.message : 'Could not create the material');
    }
  };

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        window.isSecureContext
          ? 'Camera access is unavailable in this browser. Use a USB scanner or paste the QR code.'
          : 'Camera access requires HTTPS or localhost. Open the app securely, or use a USB scanner or paste the QR code.'
      );
      return;
    }
    const video = videoRef.current;
    if (!video) {
      setCameraError('The camera preview is not ready. Try again.');
      return;
    }

    setIsCameraStarting(true);
    const session = ++cameraSessionRef.current;
    try {
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        video,
        (result, _error, callbackControls) => {
          if (cameraSessionRef.current !== session || !result) return;
          updateScanValue(result.getText());
          callbackControls.stop();
          cameraSessionRef.current += 1;
          if (scannerControlsRef.current === callbackControls) scannerControlsRef.current = null;
          setIsCameraActive(false);
        }
      );
      if (cameraSessionRef.current !== session) {
        controls.stop();
      } else {
        scannerControlsRef.current = controls;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Could not access device camera:', error);
      setCameraError('Camera access was denied or is unavailable. Use a scanner or paste the QR code.');
      setIsCameraActive(false);
    } finally {
      setIsCameraStarting(false);
    }
  };

  const submitMovement = async () => {
    if (
      !selectedOrganization ||
      !scannedItem?.qr_code ||
      scanValue.trim() !== scannedItem.qr_code
    ) {
      toast.error('A verified material QR code is required');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Enter a quantity greater than zero');
      return;
    }
    setIsSaving(true);
    try {
      const result = await adjustInventoryStock({
        id: scannedItem._id as any,
        organization_id: selectedOrganization as any,
        movement_type: movementType,
        quantity,
        qr_code: scannedItem.qr_code,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`Stock ${movementType === 'in' ? 'received' : 'issued'}: ${result.previous_quantity} → ${result.new_quantity}`);
      setScannedItem(null);
      setCreatedQr(null);
      setScanValue('');
      setQuantity(1);
      setReference('');
      setNotes('');
      scannerRef.current?.focus();
    } catch (error) {
      console.error('Failed to record stock movement:', error);
      toast.error(error instanceof Error ? error.message : 'Could not record stock movement');
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedOrganization || !isConvex) {
    return (
      <Box p={6}>
        <Alert status="warning">
          <AlertIcon />
          <AlertDescription>Select a connected organization to use QR-verified stock movements.</AlertDescription>
        </Alert>
      </Box>
    );
  }

  if (inventory === undefined) {
    return <Box p={8} textAlign="center"><Spinner /> <Text mt={3}>Loading materials...</Text></Box>;
  }

  const itemsWithoutQr = items.filter((item) => !item.qr_code);

  return (
    <Box maxW="900px" mx="auto" p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Button leftIcon={<FiArrowLeft />} variant="ghost" onClick={() => navigate('/inventory')}>
            Inventory
          </Button>
          <HStack color="teal.600">
            <FiPackage />
            <Text fontWeight="semibold">QR-verified stock control</Text>
          </HStack>
        </HStack>

        <Box>
          <Heading size="lg">Material In / Out</Heading>
          <Text color="gray.600" mt={2}>
            Scan a registered material QR code to receive or issue stock. Unknown codes cannot change stock.
          </Text>
        </Box>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Scan material QR code</FormLabel>
                <HStack>
                  <Input
                    ref={scannerRef}
                    value={scanValue}
                    onChange={(event) => updateScanValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        resolveScan(scanValue);
                      }
                    }}
                    placeholder="Scan with a QR reader, or paste its content"
                    autoComplete="off"
                    autoFocus
                  />
                  <Button
                    leftIcon={<FiCamera />}
                    onClick={isCameraActive ? stopCamera : startCamera}
                    isLoading={isCameraStarting}
                    variant="outline"
                  >
                    {isCameraActive ? 'Stop camera' : 'Camera'}
                  </Button>
                  <Button colorScheme="teal" onClick={() => resolveScan(scanValue)}>
                    Verify
                  </Button>
                </HStack>
                {cameraError && <Text color="red.500" fontSize="sm" mt={2}>{cameraError}</Text>}
                <Box
                  mt={4}
                  maxW="400px"
                  display={isCameraActive || isCameraStarting ? 'block' : 'none'}
                >
                  <video ref={videoRef} muted playsInline style={{ width: '100%', borderRadius: '8px' }} />
                  <Text fontSize="sm" color="gray.600" mt={2}>Hold the QR code in front of the camera.</Text>
                </Box>
              </FormControl>

              {scannedItem && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon as={FiCheckCircle} />
                  <Box>
                    <AlertDescription fontWeight="bold">{scannedItem.name} — QR verified</AlertDescription>
                    <Text fontSize="sm">
                      SKU: {scannedItem.sku || '—'} | Available: {scannedItem.quantity} {scannedItem.unit}
                    </Text>
                  </Box>
                </Alert>
              )}

              {legacyQrItem && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertDescription fontWeight="bold">{legacyQrItem.name} needs QR registration</AlertDescription>
                    <Text fontSize="sm" mb={3}>
                      This code identifies an existing material, but it is not registered yet. Generate and scan its system QR before recording stock.
                    </Text>
                    <Button size="sm" colorScheme="blue" onClick={() => void generateQrForExistingItem(legacyQrItem)}>
                      Register QR code
                    </Button>
                  </Box>
                </Alert>
              )}

              {unknownCode && (
                <Alert status="warning" borderRadius="md" alignItems="flex-start">
                  <AlertIcon />
                  <Box flex="1">
                    <AlertDescription fontWeight="bold">This QR code is not registered</AlertDescription>
                    <Text fontSize="sm" mb={4}>
                      Stock movement is blocked. Create a material and its system QR code, then scan that code to continue.
                    </Text>
                    <VStack align="stretch" spacing={3}>
                      <FormControl isRequired>
                        <FormLabel>Material name</FormLabel>
                        <Input
                          value={newItem.name}
                          onChange={(event) => setNewItem({ ...newItem, name: event.target.value })}
                          placeholder="Enter material name"
                        />
                      </FormControl>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        <FormControl>
                          <FormLabel>SKU (optional)</FormLabel>
                          <Input
                            value={newItem.sku}
                            onChange={(event) => setNewItem({ ...newItem, sku: event.target.value })}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Category</FormLabel>
                          <Input
                            value={newItem.category}
                            onChange={(event) => setNewItem({ ...newItem, category: event.target.value })}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Unit</FormLabel>
                          <Input
                            value={newItem.unit}
                            onChange={(event) => setNewItem({ ...newItem, unit: event.target.value })}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Cost price</FormLabel>
                          <NumberInput
                            value={newItem.cost_price}
                            min={0}
                            precision={2}
                            onChange={(value) => setNewItem({ ...newItem, cost_price: Number(value) })}
                          >
                            <NumberInputField />
                          </NumberInput>
                        </FormControl>
                        <FormControl>
                          <FormLabel>Selling price</FormLabel>
                          <NumberInput
                            value={newItem.selling_price}
                            min={0}
                            precision={2}
                            onChange={(value) => setNewItem({ ...newItem, selling_price: Number(value) })}
                          >
                            <NumberInputField />
                          </NumberInput>
                        </FormControl>
                      </SimpleGrid>
                      <Button colorScheme="blue" alignSelf="flex-start" onClick={createMaterial}>
                        Create material and QR code
                      </Button>
                    </VStack>
                  </Box>
                </Alert>
              )}

              {createdQr && !scannedItem && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertDescription fontWeight="bold">QR code created — scan it to verify this material</AlertDescription>
                    <Text fontSize="sm" mt={1}>Initial stock remains zero until you complete a QR-verified Stock In.</Text>
                    {qrImage && (
                      <Box as="img" src={qrImage} alt="New inventory material QR code" boxSize="240px" mt={3} bg="white" />
                    )}
                    <Text fontSize="xs" mt={2} wordBreak="break-all">{createdQr.code}</Text>
                  </Box>
                </Alert>
              )}

              {itemsWithoutQr.length > 0 && (
                <FormControl>
                  <FormLabel>Existing material needs a QR? Select it to create one first.</FormLabel>
                  <Select
                    placeholder="Choose an existing material without a QR"
                    value=""
                    onChange={(event) => {
                      const item = itemsWithoutQr.find((candidate) => candidate._id === event.target.value);
                      if (item) void generateQrForExistingItem(item);
                    }}
                  >
                    {itemsWithoutQr.map((item) => (
                      <option key={item._id} value={item._id}>{item.name}{item.sku ? ` (${item.sku})` : ''}</option>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Movement type</FormLabel>
                <Select value={movementType} onChange={(event) => setMovementType(event.target.value as 'in' | 'out')}>
                  <option value="in">Stock In — receive material</option>
                  <option value="out">Stock Out — issue material</option>
                </Select>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Quantity</FormLabel>
                  <NumberInput value={quantity} min={0.01} precision={2} onChange={(value) => setQuantity(Number(value))}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Reference</FormLabel>
                  <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Order, delivery, or document number" />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
              </FormControl>

              <Button
                colorScheme={movementType === 'in' ? 'teal' : 'orange'}
                size="lg"
                onClick={submitMovement}
                isLoading={isSaving}
                isDisabled={!scannedItem || !scannedItem.qr_code || scanValue.trim() !== scannedItem.qr_code}
              >
                {movementType === 'in' ? 'Confirm Stock In' : 'Confirm Stock Out'}
              </Button>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                A valid QR scan is required for every movement. Stock Out is limited to available quantity.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default InventoryMovementsScreen;
