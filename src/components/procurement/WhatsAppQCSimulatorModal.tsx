import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Input,
  Select,
  useToast,
  useColorModeValue,
  Avatar,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCheckCircle, FiAlertTriangle, FiSend, FiTruck, FiCheck, FiX, FiEdit3 } from 'react-icons/fi';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/shared/AuthContext';

interface WhatsAppQCSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: any;
  purchaseOrderId?: Id<"purchase_orders"> | string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  buttons?: { label: string; action: string; colorScheme?: string }[];
  statusNote?: string;
}

export const WhatsAppQCSimulatorModal: React.FC<WhatsAppQCSimulatorModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  purchaseOrderId,
}) => {
  const toast = useToast();
  const { user } = useAuth();

  // Queries
  const purchaseOrders = useQuery(api.purchaseOrders.listPurchaseOrders, {
    organization_id: organizationId as any,
  });
  const effectivePOs = purchaseOrders?.filter((po: any) => po.status !== 'completed' && po.status !== 'cancelled') || [];
  
  const [selectedPOId, setSelectedPOId] = useState<string>(
    purchaseOrderId ? String(purchaseOrderId) : (effectivePOs[0]?._id || '')
  );

  const poItems = useQuery(
    api.purchaseOrderItems.listPurchaseOrderItems,
    selectedPOId ? { purchase_order_id: selectedPOId as any } : 'skip'
  );

  const createMaterialReceipt = useMutation(api.materialReceipts.createMaterialReceipt);
  const createMaterialReceiptItem = useMutation(api.materialReceiptItems.createMaterialReceiptItem);
  const generateMRNumber = useQuery(api.materialReceipts.generateMRNumber, { organization_id: organizationId as any });
  const updatePurchaseOrderStatus = useMutation(api.purchaseOrders.updatePurchaseOrderStatus);

  // Simulation Session State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<'idle' | 'arrival' | 'items' | 'qc' | 'completed'>('idle');
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [customQtyInput, setCustomQtyInput] = useState<string>('');
  const [isEditingQty, setIsEditingQty] = useState<boolean>(false);
  const [truckNumber, setTruckNumber] = useState<string>('7841 BDA');
  const [isEditingTruck, setIsEditingTruck] = useState<boolean>(false);
  const [customTruckInput, setCustomTruckInput] = useState<string>('');

  const proceedToLineItems = (confirmedTruck: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userReply: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      timestamp: timeNow,
      text: `🚛 Truck Registered: ${confirmedTruck}`,
    };

    if (!poItems || poItems.length === 0) {
      setMessages(prev => [...prev, userReply, {
        id: `msg_${Date.now() + 1}`,
        sender: 'bot',
        timestamp: timeNow,
        text: '⚠️ No line items found for this PO. Please verify with procurement.',
      }]);
      return;
    }

    const firstItem = poItems[0];
    const botFirstItem: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      sender: 'bot',
      timestamp: timeNow,
      text: `*Item 1 of ${poItems.length}:*\n🔩 *${firstItem.item_name}*\nOrdered Quantity: *${firstItem.quantity} ${firstItem.unit || 'pcs'}*\n\nPlease confirm received quantity:`,
      buttons: [
        { label: `✅ Full (${firstItem.quantity})`, action: 'item_full' },
        { label: '✏️ Edit Received Qty', action: 'item_edit' },
      ],
    };

    setMessages(prev => [...prev, userReply, botFirstItem]);
    setCurrentStep('items');
    setActiveItemIndex(0);
  };

  // QC Engineer Persona
  const [qcEngineerName, setQcEngineerName] = useState<string>('Eng. Tariq Al-Ghamdi (Site QC)');
  const [qcEngineerPhone, setQcEngineerPhone] = useState<string>('+966 54 819 2031');

  const chatContainerBg = useColorModeValue('#E5DDD5', '#121B22');
  const botBubbleBg = useColorModeValue('white', '#1F2C34');
  const userBubbleBg = useColorModeValue('#DCF8C6', '#005C4B');
  const cardBg = useColorModeValue('white', 'gray.800');

  const selectedPO = purchaseOrders?.find((p: any) => p._id === selectedPOId);

  // Start Simulation
  const handleStartArrivalCheck = () => {
    if (!selectedPO) {
      toast({
        title: 'Select a Purchase Order',
        description: 'Please select an incoming PO to simulate notification.',
        status: 'warning',
      });
      return;
    }

    const itemsSummary = poItems && poItems.length > 0 
      ? poItems.map((item: any, i: number) => `${i + 1}. ${item.item_name} (${item.quantity} ${item.unit || 'units'})`).join('\n')
      : 'Standard construction materials';

    const initialMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `📦 *INCOMING SHIPMENT NOTIFICATION*\nPO Number: *${selectedPO.po_number}*\nSupplier: *${selectedPO.supplier_name || 'Assigned Supplier'}*\nTentative Delivery Date: *${selectedPO.expected_delivery_date || 'Today'}*\nTotal Line Items: *${poItems?.length || 0}*\n\nExpected Materials:\n${itemsSummary}\n\n*Has the delivery truck arrived at the project site?*`,
      buttons: [
        { label: '🚚 Yes, Truck Arrived', action: 'truck_arrived', colorScheme: 'green' },
        { label: '⏳ Not Arrived Yet', action: 'truck_delayed', colorScheme: 'gray' },
      ],
    };

    setMessages([initialMsg]);
    setCurrentStep('arrival');
    setActiveItemIndex(0);
    setItemReceipts({});
    setIsEditingQty(false);
  };

  // Button Action Handler
  const handleButtonClick = async (action: string, payload?: any) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (action === 'truck_arrived') {
      // User tapped Yes, Arrived
      const userReply: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'user',
        timestamp: timeNow,
        text: '🚚 Yes, Truck Arrived on site',
      };

      // Prompt for Truck Details with Quick Plate Suggestions or manual input
      const botTruckPrompt: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'bot',
        timestamp: timeNow,
        text: `🚚 *TRUCK & WAYBILL REGISTRATION*\nPlease enter the *Truck Plate Number* & *Driver Name*:\n(e.g., "7841 BDA - Driver Ahmed" or Waybill Ref)`,
        buttons: [
          { label: '🚛 7841 BDA (Standard Fleet)', action: 'truck_preset_1' },
          { label: '🚛 9210 KSA (Al-Fozan Logistics)', action: 'truck_preset_2' },
          { label: '✏️ Enter Truck Plate Manually', action: 'truck_custom' },
        ],
      };

      setMessages(prev => [...prev, userReply, botTruckPrompt]);
      setCurrentStep('arrival');
      return;
    }

    if (action === 'truck_preset_1' || action === 'truck_preset_2' || action === 'truck_skip') {
      const selectedTruck = action === 'truck_preset_1' 
        ? '7841 BDA (Fleet Transport)' 
        : action === 'truck_preset_2' 
        ? '9210 KSA (Al-Fozan Logistics)' 
        : 'Plate Not Stated';
      
      setTruckNumber(selectedTruck);
      proceedToLineItems(selectedTruck);
      return;
    }

    if (action === 'truck_custom') {
      setIsEditingTruck(true);
      return;
    }

    if (action === 'truck_delayed') {
      const userReply: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'user',
        timestamp: timeNow,
        text: '⏳ Not Arrived Yet',
      };
      const botAck: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'bot',
        timestamp: timeNow,
        text: 'Understood. A follow-up reminder will be triggered tomorrow morning. Procurement team has been updated.',
      };
      setMessages(prev => [...prev, userReply, botAck]);
      setCurrentStep('idle');
      return;
    }

    if (action === 'item_full') {
      if (!poItems) return;
      const currentItem = poItems[activeItemIndex];
      const qtyReceived = currentItem.quantity;

      // Record item
      const updatedReceipts = {
        ...itemReceipts,
        [currentItem._id]: { received: qtyReceived, accepted: qtyReceived, rejected: 0 }
      };
      setItemReceipts(updatedReceipts);

      const userReply: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'user',
        timestamp: timeNow,
        text: `✅ Full (${qtyReceived} ${currentItem.unit || 'units'}) received`,
      };

      // Check if more items exist
      if (activeItemIndex + 1 < poItems.length) {
        const nextIdx = activeItemIndex + 1;
        const nextItem = poItems[nextIdx];

        const nextBotMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'bot',
          timestamp: timeNow,
          text: `*Item ${nextIdx + 1} of ${poItems.length}:*\n📦 *${nextItem.item_name}*\nOrdered Quantity: *${nextItem.quantity} ${nextItem.unit || 'pcs'}*\n\nPlease confirm received quantity:`,
          buttons: [
            { label: `✅ Full (${nextItem.quantity})`, action: 'item_full' },
            { label: '✏️ Edit Received Qty', action: 'item_edit' },
          ],
        };

        setMessages(prev => [...prev, userReply, nextBotMsg]);
        setActiveItemIndex(nextIdx);
      } else {
        // All items done, move to QC Inspection
        askQCInspection(userReply, updatedReceipts);
      }
      return;
    }

    if (action === 'item_edit') {
      setIsEditingQty(true);
      return;
    }

    if (action === 'qc_passed' || action === 'qc_rejected') {
      const isPassed = action === 'qc_passed';
      const userReply: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'user',
        timestamp: timeNow,
        text: isPassed ? '✅ Passed Quality & Condition Inspection' : '❌ Materials Damaged / Rejected',
      };

      // Create Receipt in Convex ERP Database
      await finalizeMaterialReceiptInERP(isPassed, userReply);
    }
  };

  const handleCustomQtySubmit = () => {
    if (!poItems) return;
    const currentItem = poItems[activeItemIndex];
    const qty = parseFloat(customQtyInput) || 0;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedReceipts = {
      ...itemReceipts,
      [currentItem._id]: { received: qty, accepted: qty, rejected: Math.max(0, currentItem.quantity - qty) }
    };
    setItemReceipts(updatedReceipts);
    setIsEditingQty(false);
    setCustomQtyInput('');

    const shortage = currentItem.quantity - qty;
    const note = shortage > 0 ? ` (${shortage} units pending backorder)` : '';

    const userReply: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      timestamp: timeNow,
      text: `✏️ Received: ${qty} ${currentItem.unit || 'units'}${note}`,
    };

    if (activeItemIndex + 1 < poItems.length) {
      const nextIdx = activeItemIndex + 1;
      const nextItem = poItems[nextIdx];

      const nextBotMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'bot',
        timestamp: timeNow,
        text: `*Item ${nextIdx + 1} of ${poItems.length}:*\n📦 *${nextItem.item_name}*\nOrdered Quantity: *${nextItem.quantity} ${nextItem.unit || 'pcs'}*\n\nPlease confirm received quantity:`,
        buttons: [
          { label: `✅ Full (${nextItem.quantity})`, action: 'item_full' },
          { label: '✏️ Edit Received Qty', action: 'item_edit' },
        ],
      };

      setMessages(prev => [...prev, userReply, nextBotMsg]);
      setActiveItemIndex(nextIdx);
    } else {
      askQCInspection(userReply, updatedReceipts);
    }
  };

  const askQCInspection = (previousUserMsg: ChatMessage, receipts: any) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const qcBotMsg: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      sender: 'bot',
      timestamp: timeNow,
      text: `🔍 *QUALITY & COMPLIANCE INSPECTION*\nAll line items counted.\nDid the delivered materials pass visual inspection, technical specifications, and damage checks?`,
      buttons: [
        { label: '✅ Passed QC Inspection', action: 'qc_passed', colorScheme: 'green' },
        { label: '❌ Defects / Reject', action: 'qc_rejected', colorScheme: 'red' },
      ],
    };

    setMessages(prev => [...prev, previousUserMsg, qcBotMsg]);
    setCurrentStep('qc');
  };

  const finalizeMaterialReceiptInERP = async (isQcPassed: boolean, userReply: ChatMessage) => {
    if (!selectedPO || !poItems) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const mrNumber = generateMRNumber || `MR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Create Material Receipt Note in Convex
      const mrId = await createMaterialReceipt({
        organization_id: organizationId as any,
        receipt_number: mrNumber,
        purchase_order_id: selectedPO._id,
        supplier_id: selectedPO.supplier_id,
        receipt_date: new Date().toISOString().split('T')[0],
        delivery_note_number: `DN-WA-${Date.now().toString().slice(-4)}`,
        truck_number: truckNumber,
        driver_name: 'Registered Transport Driver',
        notes: `Verified via WhatsApp Bot by ${qcEngineerName} (${qcEngineerPhone}). Truck: ${truckNumber}. QC Status: ${isQcPassed ? 'PASSED' : 'REJECTED'}.`,
        received_by: qcEngineerName,
        created_by: user?.email || 'WhatsApp Bot',
      });

      // 2. Create Receipt Items
      let hasShortage = false;
      for (const item of poItems) {
        const itemRec = itemReceipts[item._id] || { received: item.quantity, accepted: item.quantity, rejected: 0 };
        const recQty = itemRec.received;
        if (recQty < item.quantity) hasShortage = true;

        await createMaterialReceiptItem({
          material_receipt_id: mrId,
          purchase_order_item_id: item._id,
          item_name: item.item_name,
          quantity_ordered: item.quantity,
          quantity_received: recQty,
          quantity_accepted: isQcPassed ? recQty : 0,
          quantity_rejected: isQcPassed ? 0 : recQty,
          notes: isQcPassed ? 'Accepted on site' : 'Rejected during QC inspection',
        });
      }

      // 3. Update Purchase Order Status
      const newPoStatus = hasShortage ? 'received' : 'completed';
      await updatePurchaseOrderStatus({
        id: selectedPO._id,
        status: newPoStatus as any,
      });

      const finalBotMsg: ChatMessage = {
        id: `msg_${Date.now() + 2}`,
        sender: 'bot',
        timestamp: timeNow,
        text: `🎉 *MATERIAL RECEIPT REGISTERED IN ERP*\nReceipt #: *${mrNumber}*\nStatus: *${hasShortage ? 'PARTIALLY RECEIVED' : 'FULLY RECEIVED'}*\nQC Inspection: *${isQcPassed ? 'PASSED ✅' : 'REJECTED ❌'}*\n\n✅ ERP database, inventory ledger, and procurement dashboard updated in real-time. Thank you!`,
      };

      setMessages(prev => [...prev, userReply, finalBotMsg]);
      setCurrentStep('completed');

      toast({
        title: 'Material Receipt Generated',
        description: `Created ${mrNumber} and updated ${selectedPO.po_number} status.`,
        status: 'success',
        duration: 4000,
      });
    } catch (err) {
      console.error('Error creating receipt from WhatsApp bot:', err);
      toast({
        title: 'Error',
        description: 'Failed to record receipt in ERP database.',
        status: 'error',
        duration: 4000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl">
        <ModalHeader borderBottom="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Box p={2} bg="green.500" color="white" borderRadius="lg">
                <FaWhatsapp size={22} />
              </Box>
              <VStack align="start" spacing={0}>
                <HStack>
                  <Text fontSize="lg" fontWeight="bold">
                    WhatsApp Site QC & Receiving Bot
                  </Text>
                  <Badge colorScheme="green" fontSize="xs">Live Interactive Simulator</Badge>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  Line-by-line quick-reply button receiving for On-site Engineers & Storekeepers
                </Text>
              </VStack>
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={4}>
          <VStack spacing={4} align="stretch">
            {/* Control Bar: Select PO & Persona */}
            <Card bg={cardBg} variant="outline" size="sm">
              <CardBody>
                <HStack spacing={4} wrap="wrap">
                  <Box flex={1} minW="220px">
                    <Text fontSize="xs" fontWeight="semibold" mb={1} color="gray.500">
                      Select Incoming Purchase Order:
                    </Text>
                    <Select
                      size="sm"
                      value={selectedPOId}
                      onChange={(e) => setSelectedPOId(e.target.value)}
                    >
                      {effectivePOs.map((po: any) => (
                        <option key={po._id} value={po._id}>
                          {po.po_number} ({po.expected_delivery_date || 'No Date'}) - {po.supplier_name || 'Vendor'}
                        </option>
                      ))}
                    </Select>
                  </Box>

                  <Box flex={1} minW="220px">
                    <Text fontSize="xs" fontWeight="semibold" mb={1} color="gray.500">
                      Assigned Site QC Contact:
                    </Text>
                    <HStack>
                      <Avatar size="xs" name={qcEngineerName} bg="green.600" />
                      <Text fontSize="xs" fontWeight="medium">
                        {qcEngineerName}
                      </Text>
                    </HStack>
                  </Box>

                  <Button
                    size="sm"
                    colorScheme="green"
                    leftIcon={<FiSend />}
                    onClick={handleStartArrivalCheck}
                    alignSelf="flex-end"
                  >
                    Trigger Notification
                  </Button>
                </HStack>
              </CardBody>
            </Card>

            {/* Simulated WhatsApp Phone Frame */}
            <Box
              bg={chatContainerBg}
              borderRadius="xl"
              p={4}
              minH="420px"
              maxH="500px"
              overflowY="auto"
              border="2px solid"
              borderColor={useColorModeValue('gray.300', 'gray.700')}
              boxShadow="inner"
            >
              {messages.length === 0 ? (
                <VStack h="360px" justify="center" spacing={2} color="gray.500">
                  <FaWhatsapp size={48} color="#25D366" />
                  <Text fontWeight="semibold">No Active Session</Text>
                  <Text fontSize="xs" textAlign="center" maxW="300px">
                    Click <strong>"Trigger Notification"</strong> above to send the automated delivery notification with interactive buttons to the site engineer.
                  </Text>
                </VStack>
              ) : (
                <VStack spacing={3} align="stretch">
                  {messages.map((msg) => (
                    <Box
                      key={msg.id}
                      alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                      maxW="85%"
                    >
                      <Box
                        bg={msg.sender === 'user' ? userBubbleBg : botBubbleBg}
                        p={3}
                        borderRadius="lg"
                        boxShadow="sm"
                      >
                        <Text
                          fontSize="xs"
                          whiteSpace="pre-wrap"
                          color={useColorModeValue('gray.800', 'gray.100')}
                        >
                          {msg.text}
                        </Text>
                        <Text
                          fontSize="9px"
                          textAlign="right"
                          color="gray.400"
                          mt={1}
                        >
                          {msg.timestamp}
                        </Text>
                      </Box>

                      {/* Interactive Buttons (Rendered below message like native WhatsApp) */}
                      {msg.buttons && msg.buttons.length > 0 && currentStep !== 'completed' && (
                        <VStack mt={2} spacing={1} align="stretch">
                          {msg.buttons.map((btn, bIdx) => (
                            <Button
                              key={bIdx}
                              size="sm"
                              colorScheme={btn.colorScheme || 'green'}
                              variant="outline"
                              bg={useColorModeValue('white', 'gray.800')}
                              boxShadow="sm"
                              onClick={() => handleButtonClick(btn.action)}
                            >
                              {btn.label}
                            </Button>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  ))}

                  {/* Custom Truck Input */}
                  {isEditingTruck && (
                    <Box
                      p={3}
                      bg={useColorModeValue('blue.50', 'gray.800')}
                      borderRadius="lg"
                      border="1px"
                      borderColor="blue.300"
                    >
                      <Text fontSize="xs" fontWeight="bold" mb={2}>
                        Enter Truck Plate # and Driver Name:
                      </Text>
                      <HStack>
                        <Input
                          size="sm"
                          placeholder="e.g. 5412 KSA - Driver Fahad"
                          value={customTruckInput}
                          onChange={(e) => setCustomTruckInput(e.target.value)}
                          autoFocus
                          bg="white"
                        />
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => {
                            const val = customTruckInput.trim() || 'Plate Not Stated';
                            setTruckNumber(val);
                            setIsEditingTruck(false);
                            setCustomTruckInput('');
                            proceedToLineItems(val);
                          }}
                        >
                          Register Truck
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingTruck(false)}>
                          Cancel
                        </Button>
                      </HStack>
                    </Box>
                  )}

                  {/* Quantity Edit Inline Input */}
                  {isEditingQty && (
                    <Box
                      p={3}
                      bg={useColorModeValue('yellow.50', 'gray.800')}
                      borderRadius="lg"
                      border="1px"
                      borderColor="yellow.300"
                    >
                      <Text fontSize="xs" fontWeight="bold" mb={2}>
                        Enter Actual Quantity Received:
                      </Text>
                      <HStack>
                        <Input
                          size="sm"
                          type="number"
                          placeholder="e.g. 15"
                          value={customQtyInput}
                          onChange={(e) => setCustomQtyInput(e.target.value)}
                          autoFocus
                          bg="white"
                        />
                        <Button size="sm" colorScheme="yellow" onClick={handleCustomQtySubmit}>
                          Confirm Qty
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingQty(false)}>
                          Cancel
                        </Button>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              )}
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
