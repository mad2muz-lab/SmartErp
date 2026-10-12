import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Push notification types
export type NotificationType = 
  | 'lead_assigned'
  | 'quotation_approved'
  | 'quotation_rejected'
  | 'delivery_scheduled'
  | 'payment_due'
  | 'inventory_low'
  | 'system_alert'
  | 'custom';

export type NotificationPriority = 'default' | 'normal' | 'high';

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  sound?: boolean;
  badge?: number;
  channelId?: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  description?: string;
  importance: Notifications.AndroidImportance;
  sound?: string;
  vibrationPattern?: number[];
  lightColor?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  channels: {
    [key: string]: boolean;
  };
}

class PushNotificationService {
  private settings: NotificationSettings = {
    enabled: true,
    sound: true,
    vibration: true,
    badge: true,
    channels: {
      leads: true,
      quotations: true,
      deliveries: true,
      payments: true,
      inventory: true,
      system: true,
    },
  };

  private channels: NotificationChannel[] = [
    {
      id: 'leads',
      name: 'Lead Notifications',
      description: 'Notifications for lead assignments and updates',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    },
    {
      id: 'quotations',
      name: 'Quotation Notifications',
      description: 'Notifications for quotation approvals and rejections',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    },
    {
      id: 'deliveries',
      name: 'Delivery Notifications',
      description: 'Notifications for delivery scheduling and updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    },
    {
      id: 'payments',
      name: 'Payment Notifications',
      description: 'Notifications for payment due dates and reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    },
    {
      id: 'inventory',
      name: 'Inventory Notifications',
      description: 'Notifications for low stock and inventory updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    },
    {
      id: 'system',
      name: 'System Notifications',
      description: 'System alerts and general notifications',
      importance: Notifications.AndroidImportance.LOW,
    },
  ];

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing push notifications...');

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: this.settings.sound,
          shouldSetBadge: this.settings.badge,
        }),
      });

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permissions not granted');
        return false;
      }

      // Get push token
      const token = await this.getPushToken();
      if (token) {
        console.log('✅ Push token obtained:', token);
      }

      // Setup notification channels (Android)
      if (Platform.OS === 'android') {
        await this.setupNotificationChannels();
      }

      // Load saved settings
      await this.loadSettings();

      console.log('✅ Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Get push token
  async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('⚠️ Push notifications only work on physical devices');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with actual project ID
      });

      return token.data;
    } catch (error) {
      console.error('❌ Failed to get push token:', error);
      return null;
    }
  }

  // Setup notification channels (Android)
  private async setupNotificationChannels(): Promise<void> {
    try {
      for (const channel of this.channels) {
        await Notifications.setNotificationChannelAsync(channel.id, {
          name: channel.name,
          description: channel.description,
          importance: channel.importance,
          sound: channel.sound,
          vibrationPattern: channel.vibrationPattern,
          lightColor: channel.lightColor,
        });
      }
      console.log('✅ Notification channels setup completed');
    } catch (error) {
      console.error('❌ Failed to setup notification channels:', error);
    }
  }

  // Send local notification
  async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      if (!this.settings.enabled) {
        console.log('⚠️ Notifications are disabled');
        return null;
      }

      // Check if channel is enabled
      const channelId = notification.channelId || this.getChannelIdForType(notification.type);
      if (!this.settings.channels[channelId]) {
        console.log(`⚠️ Channel ${channelId} is disabled`);
        return null;
      }

      console.log('🔔 Sending local notification:', notification.title);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: this.settings.sound && notification.sound !== false,
          badge: this.settings.badge ? notification.badge : undefined,
        },
        trigger: null, // Send immediately
      });

      console.log('✅ Local notification sent:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to send local notification:', error);
      return null;
    }
  }

  // Schedule notification
  async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      if (!this.settings.enabled) {
        console.log('⚠️ Notifications are disabled');
        return null;
      }

      const channelId = notification.channelId || this.getChannelIdForType(notification.type);
      if (!this.settings.channels[channelId]) {
        console.log(`⚠️ Channel ${channelId} is disabled`);
        return null;
      }

      console.log('⏰ Scheduling notification:', notification.title);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: this.settings.sound && notification.sound !== false,
          badge: this.settings.badge ? notification.badge : undefined,
        },
        trigger,
      });

      console.log('✅ Notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  // Cancel notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('✅ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
    }
  }

  // Get pending notifications
  async getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('❌ Failed to get pending notifications:', error);
      return [];
    }
  }

  // Get notification settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Update notification settings
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await this.saveSettings();
      console.log('✅ Notification settings updated');
    } catch (error) {
      console.error('❌ Failed to update notification settings:', error);
    }
  }

  // Enable/disable notifications
  async setEnabled(enabled: boolean): Promise<void> {
    await this.updateSettings({ enabled });
  }

  // Enable/disable channel
  async setChannelEnabled(channelId: string, enabled: boolean): Promise<void> {
    const channels = { ...this.settings.channels, [channelId]: enabled };
    await this.updateSettings({ channels });
  }

  // Get channel ID for notification type
  private getChannelIdForType(type: NotificationType): string {
    switch (type) {
      case 'lead_assigned':
        return 'leads';
      case 'quotation_approved':
      case 'quotation_rejected':
        return 'quotations';
      case 'delivery_scheduled':
        return 'deliveries';
      case 'payment_due':
        return 'payments';
      case 'inventory_low':
        return 'inventory';
      case 'system_alert':
      case 'custom':
      default:
        return 'system';
    }
  }

  // Send lead notification
  async sendLeadNotification(leadId: string, leadName: string, assignedTo: string): Promise<string | null> {
    return this.sendLocalNotification({
      type: 'lead_assigned',
      title: 'New Lead Assigned',
      body: `Lead "${leadName}" has been assigned to you`,
      data: { leadId, leadName, assignedTo },
      channelId: 'leads',
    });
  }

  // Send quotation notification
  async sendQuotationNotification(
    quotationId: string,
    quotationNumber: string,
    status: 'approved' | 'rejected',
    customerName: string
  ): Promise<string | null> {
    const isApproved = status === 'approved';
    return this.sendLocalNotification({
      type: isApproved ? 'quotation_approved' : 'quotation_rejected',
      title: `Quotation ${isApproved ? 'Approved' : 'Rejected'}`,
      body: `Quotation ${quotationNumber} for ${customerName} has been ${status}`,
      data: { quotationId, quotationNumber, status, customerName },
      channelId: 'quotations',
    });
  }

  // Send delivery notification
  async sendDeliveryNotification(
    deliveryId: string,
    deliveryNumber: string,
    customerName: string,
    deliveryDate: string
  ): Promise<string | null> {
    return this.sendLocalNotification({
      type: 'delivery_scheduled',
      title: 'Delivery Scheduled',
      body: `Delivery ${deliveryNumber} for ${customerName} scheduled for ${deliveryDate}`,
      data: { deliveryId, deliveryNumber, customerName, deliveryDate },
      channelId: 'deliveries',
    });
  }

  // Send payment reminder
  async sendPaymentReminder(
    invoiceId: string,
    invoiceNumber: string,
    customerName: string,
    amount: number,
    dueDate: string
  ): Promise<string | null> {
    return this.sendLocalNotification({
      type: 'payment_due',
      title: 'Payment Reminder',
      body: `Payment of ${amount} for invoice ${invoiceNumber} is due on ${dueDate}`,
      data: { invoiceId, invoiceNumber, customerName, amount, dueDate },
      channelId: 'payments',
    });
  }

  // Send inventory alert
  async sendInventoryAlert(
    itemId: string,
    itemName: string,
    currentStock: number,
    minStock: number
  ): Promise<string | null> {
    return this.sendLocalNotification({
      type: 'inventory_low',
      title: 'Low Stock Alert',
      body: `${itemName} stock is low (${currentStock}/${minStock})`,
      data: { itemId, itemName, currentStock, minStock },
      channelId: 'inventory',
    });
  }

  // Send system alert
  async sendSystemAlert(title: string, body: string, data?: Record<string, any>): Promise<string | null> {
    return this.sendLocalNotification({
      type: 'system_alert',
      title,
      body,
      data,
      channelId: 'system',
    });
  }

  // Save settings to storage
  private async saveSettings(): Promise<void> {
    try {
      // In a real app, you'd save to AsyncStorage or similar
      console.log('💾 Saving notification settings');
    } catch (error) {
      console.error('❌ Failed to save notification settings:', error);
    }
  }

  // Load settings from storage
  private async loadSettings(): Promise<void> {
    try {
      // In a real app, you'd load from AsyncStorage or similar
      console.log('📂 Loading notification settings');
    } catch (error) {
      console.error('❌ Failed to load notification settings:', error);
    }
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  // Get available channels
  getChannels(): NotificationChannel[] {
    return [...this.channels];
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationService();

// Export types
export type { NotificationData, NotificationChannel, NotificationSettings, NotificationType, NotificationPriority };
