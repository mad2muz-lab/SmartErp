import React from 'react';
import { Badge, HStack, Icon, Text } from '@chakra-ui/react';
import { FiCheckCircle, FiClock, FiAlertTriangle, FiXCircle, FiShield } from 'react-icons/fi';
import { ZatcaComplianceStatus } from '../types/zatca.types';

interface ZatcaBadgeProps {
  status: ZatcaComplianceStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ZatcaBadge: React.FC<ZatcaBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'cleared':
        return {
          colorScheme: 'green',
          icon: FiShield,
          labelEn: 'ZATCA Cleared (معتمد)',
          labelAr: 'معتمد رسمياً',
        };
      case 'reported':
        return {
          colorScheme: 'teal',
          icon: FiCheckCircle,
          labelEn: 'Reported (مُبلّغ)',
          labelAr: 'تم الإبلاغ بنجاح',
        };
      case 'pending':
        return {
          colorScheme: 'yellow',
          icon: FiClock,
          labelEn: 'Pending Sync (قيد الإرسال)',
          labelAr: 'قيد الإرسال للمنظومة',
        };
      case 'warning':
        return {
          colorScheme: 'orange',
          icon: FiAlertTriangle,
          labelEn: 'ZATCA Warning (تنبيه)',
          labelAr: 'تنبيه نظام الفوترة',
        };
      case 'rejected':
        return {
          colorScheme: 'red',
          icon: FiXCircle,
          labelEn: 'Rejected (مرفوض)',
          labelAr: 'مرفوض من الهيئة',
        };
      case 'not_reported':
      default:
        return {
          colorScheme: 'gray',
          icon: FiClock,
          labelEn: 'Phase 1 Offline (محلي)',
          labelAr: 'متوافق محلياً',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      colorScheme={config.colorScheme}
      variant="subtle"
      px={2.5}
      py={1}
      borderRadius="full"
      fontSize={size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs'}
      fontWeight="semibold"
      textTransform="none"
    >
      <HStack spacing={1.5}>
        <Icon as={config.icon} />
        {showLabel && <Text>{config.labelEn}</Text>}
      </HStack>
    </Badge>
  );
};
