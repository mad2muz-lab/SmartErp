import { useState, useEffect, useCallback } from 'react';
import { pushNotifications, NotificationSettings, NotificationData, NotificationChannel } from '../../utils/mobile/pushNotifications';

export const usePushNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(pushNotifications.getSettings());
  const [channels, setChannels] = useState<NotificationChannel[]>(pushNotifications.getChannels());

  // Initialize push notifications
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const success = await pushNotifications.initialize();
        setIsInitialized(success);
        
        if (!success) {
          setError('Failed to initialize push notifications');
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize push notifications');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Send local notification
  const sendNotification = useCallback(async (notification: NotificationData): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const notificationId = await pushNotifications.sendLocalNotification(notification);
      
      if (!notificationId) {
        setError('Failed to send notification');
      }
      
      return notificationId;
    } catch (err) {
      const errorMessage = err.message || 'Failed to send notification';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Schedule notification
  const scheduleNotification = useCallback(async (
    notification: NotificationData,
    trigger: any
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const notificationId = await pushNotifications.scheduleNotification(notification, trigger);
      
      if (!notificationId) {
        setError('Failed to schedule notification');
      }
      
      return notificationId;
    } catch (err) {
      const errorMessage = err.message || 'Failed to schedule notification';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cancel notification
  const cancelNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await pushNotifications.cancelNotification(notificationId);
    } catch (err) {
      setError(err.message || 'Failed to cancel notification');
    }
  }, []);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await pushNotifications.cancelAllNotifications();
    } catch (err) {
      setError(err.message || 'Failed to cancel all notifications');
    }
  }, []);

  // Get pending notifications
  const getPendingNotifications = useCallback(async () => {
    try {
      return await pushNotifications.getPendingNotifications();
    } catch (err) {
      setError(err.message || 'Failed to get pending notifications');
      return [];
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await pushNotifications.updateSettings(newSettings);
      setSettings(pushNotifications.getSettings());
      
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update settings';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enable/disable notifications
  const setEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    return updateSettings({ enabled });
  }, [updateSettings]);

  // Enable/disable channel
  const setChannelEnabled = useCallback(async (channelId: string, enabled: boolean): Promise<boolean> => {
    const channels = { ...settings.channels, [channelId]: enabled };
    return updateSettings({ channels });
  }, [settings.channels, updateSettings]);

  // Send lead notification
  const sendLeadNotification = useCallback(async (
    leadId: string,
    leadName: string,
    assignedTo: string
  ): Promise<string | null> => {
    return pushNotifications.sendLeadNotification(leadId, leadName, assignedTo);
  }, []);

  // Send quotation notification
  const sendQuotationNotification = useCallback(async (
    quotationId: string,
    quotationNumber: string,
    status: 'approved' | 'rejected',
    customerName: string
  ): Promise<string | null> => {
    return pushNotifications.sendQuotationNotification(quotationId, quotationNumber, status, customerName);
  }, []);

  // Send delivery notification
  const sendDeliveryNotification = useCallback(async (
    deliveryId: string,
    deliveryNumber: string,
    customerName: string,
    deliveryDate: string
  ): Promise<string | null> => {
    return pushNotifications.sendDeliveryNotification(deliveryId, deliveryNumber, customerName, deliveryDate);
  }, []);

  // Send payment reminder
  const sendPaymentReminder = useCallback(async (
    invoiceId: string,
    invoiceNumber: string,
    customerName: string,
    amount: number,
    dueDate: string
  ): Promise<string | null> => {
    return pushNotifications.sendPaymentReminder(invoiceId, invoiceNumber, customerName, amount, dueDate);
  }, []);

  // Send inventory alert
  const sendInventoryAlert = useCallback(async (
    itemId: string,
    itemName: string,
    currentStock: number,
    minStock: number
  ): Promise<string | null> => {
    return pushNotifications.sendInventoryAlert(itemId, itemName, currentStock, minStock);
  }, []);

  // Send system alert
  const sendSystemAlert = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string | null> => {
    return pushNotifications.sendSystemAlert(title, body, data);
  }, []);

  // Test notification
  const testNotification = useCallback(async (): Promise<string | null> => {
    return sendNotification({
      type: 'system_alert',
      title: 'Test Notification',
      body: 'This is a test notification from TradingERP',
      data: { test: true },
      channelId: 'system',
    });
  }, [sendNotification]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if supported
  const isSupported = useCallback((): boolean => {
    return pushNotifications.isSupported();
  }, []);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    settings,
    channels,
    
    // Actions
    sendNotification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    getPendingNotifications,
    updateSettings,
    setEnabled,
    setChannelEnabled,
    
    // Business-specific notifications
    sendLeadNotification,
    sendQuotationNotification,
    sendDeliveryNotification,
    sendPaymentReminder,
    sendInventoryAlert,
    sendSystemAlert,
    
    // Utility
    testNotification,
    clearError,
    isSupported,
    
    // Computed values
    isEnabled: settings.enabled,
    hasSound: settings.sound,
    hasVibration: settings.vibration,
    hasBadge: settings.badge,
  };
};
