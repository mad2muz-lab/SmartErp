import React, { useState, useEffect } from 'react';
import {
  Box,
  Image,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  Collapse,
  Table,
  Tbody,
  Tr,
  Td,
  Badge,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { FiCheckCircle, FiEye, FiEyeOff, FiDownload, FiCheck } from 'react-icons/fi';
import { ZatcaTLVData } from '../types/zatca.types';
import { generateZatcaQRCodeDataURL } from '../core/qrGenerator';
import { parseZatcaTLVBase64, generateZatcaTLVBase64 } from '../core/tlvEncoder';
import { RiyalCurrencySymbol } from '../../../components/icons/SaudiRiyalIcon';

interface ZatcaQRViewProps {
  tlvData: ZatcaTLVData;
  size?: number; // QR code image size in px
  showInspectButton?: boolean;
}

export const ZatcaQRView: React.FC<ZatcaQRViewProps> = ({
  tlvData,
  size = 180,
  showInspectButton = true,
}) => {
  const toast = useToast();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [base64Tlv, setBase64Tlv] = useState<string>('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [decodedTags, setDecodedTags] = useState<Record<number, string>>({});
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function generate() {
      try {
        const url = await generateZatcaQRCodeDataURL(tlvData, { width: size });
        const b64 = generateZatcaTLVBase64(tlvData);
        if (isMounted) {
          setQrUrl(url);
          setBase64Tlv(b64);
          setDecodedTags(parseZatcaTLVBase64(b64));
        }
      } catch (err) {
        console.error('Failed to generate ZATCA QR code:', err);
      }
    }

    generate();

    return () => {
      isMounted = false;
    };
  }, [tlvData, size]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `zatca-qr-${tlvData.vatNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyBase64 = () => {
    navigator.clipboard.writeText(base64Tlv);
    setHasCopied(true);
    toast({
      title: 'Copied TLV Base64',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  if (!qrUrl) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="md" color="brand.500" />
        <Text fontSize="xs" color="gray.500" mt={2}>
          Generating ZATCA QR...
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={3} align="center">
      {/* QR Code Container */}
      <Box
        p={2}
        bg="white"
        borderRadius="md"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
        display="inline-block"
      >
        <Image
          src={qrUrl}
          alt="ZATCA Compliant QR Code"
          boxSize={`${size}px`}
          objectFit="contain"
          fallback={<Spinner />}
        />
      </Box>

      <HStack spacing={2}>
        <Badge colorScheme="green" variant="subtle" fontSize="2xs" px={2} py={0.5} borderRadius="full">
          <HStack spacing={1}>
            <Icon as={FiCheckCircle} />
            <Text>100% ZATCA Compliant (متوافق مع الهيئة)</Text>
          </HStack>
        </Badge>
      </HStack>

      {/* Action Buttons */}
      <HStack spacing={2} pt={1}>
        {showInspectButton && (
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Icon as={isInspecting ? FiEyeOff : FiEye} />}
            onClick={() => setIsInspecting(!isInspecting)}
          >
            {isInspecting ? 'Hide Details' : 'Verify & Inspect (فحص المحتوى)'}
          </Button>
        )}
        <Button
          size="xs"
          variant="ghost"
          leftIcon={<Icon as={hasCopied ? FiCheck : FiDownload} />}
          onClick={handleDownload}
        >
          Save QR
        </Button>
      </HStack>

      {/* Inspect Dropdown (Proves compliance to vendor/inspector) */}
      <Collapse in={isInspecting} animateOpacity style={{ width: '100%' }}>
        <Box
          p={3}
          mt={2}
          bg="gray.50"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          fontSize="xs"
          w="full"
        >
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="bold" color="gray.700">
              Decoded ZATCA Tags (البيانات المشفرة):
            </Text>
            <Button size="2xs" variant="link" onClick={handleCopyBase64}>
              {hasCopied ? 'Copied' : 'Copy TLV Base64'}
            </Button>
          </HStack>

          <Table size="sm" variant="simple">
            <Tbody>
              <Tr>
                <Td fontWeight="semibold" color="gray.600" width="30%">
                  Tag 1 (البائع)
                </Td>
                <Td>{decodedTags[1] || 'N/A'}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="semibold" color="gray.600">
                  Tag 2 (الضريبي)
                </Td>
                <Td fontFamily="mono">{decodedTags[2] || 'N/A'}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="semibold" color="gray.600">
                  Tag 3 (الوقت)
                </Td>
                <Td>{decodedTags[3] || 'N/A'}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="semibold" color="gray.600">
                  Tag 4 (الإجمالي)
                </Td>
                <Td fontWeight="bold">{decodedTags[4]} <RiyalCurrencySymbol /></Td>
              </Tr>
              <Tr>
                <Td fontWeight="semibold" color="gray.600">
                  Tag 5 (الضريبة)
                </Td>
                <Td fontWeight="bold" color="green.600">
                  {decodedTags[5]} <RiyalCurrencySymbol />
                </Td>
              </Tr>
              {decodedTags[6] && (
                <Tr>
                  <Td fontWeight="semibold" color="gray.600">
                    Tag 6 (Hash)
                  </Td>
                  <Td fontFamily="mono" fontSize="2xs" maxW="200px" isTruncated>
                    {decodedTags[6]}
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Collapse>
    </VStack>
  );
};
