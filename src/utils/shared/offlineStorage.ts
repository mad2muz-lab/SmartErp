import { getStorage } from './platform';

// Offline storage keys
const OFFLINE_KEYS = {
  PENDING_CHANGES: 'trading-erp-pending-changes',
  OFFLINE_DATA: 'trading-erp-offline-data',
  SYNC_QUEUE: 'trading-erp-sync-queue',
  LAST_SYNC: 'trading-erp-last-sync',
  CONFLICT_RESOLUTION: 'trading-erp-conflict-resolution',
  OFFLINE_STATUS: 'trading-erp-offline-status',
} as const;

// Types for offline storage
export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
  organization_id: string;
  user_id: string;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineData {
  [key: string]: {
    data: any[];
    lastUpdated: number;
    organization_id: string;
  };
}

export interface SyncQueue {
  changes: PendingChange[];
  lastProcessed: number;
  isProcessing: boolean;
}

export interface ConflictResolution {
  entityId: string;
  entityType: string;
  localVersion: any;
  serverVersion: any;
  resolution: 'local' | 'server' | 'manual';
  timestamp: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  lastOnlineCheck: number;
  pendingChangesCount: number;
  lastSyncAttempt: number;
  syncErrors: string[];
}

class OfflineStorageService {
  private storage = getStorage();
  private syncQueue: SyncQueue = { changes: [], lastProcessed: 0, isProcessing: false };
  private offlineStatus: OfflineStatus = {
    isOnline: true,
    lastOnlineCheck: Date.now(),
    pendingChangesCount: 0,
    lastSyncAttempt: 0,
    syncErrors: [],
  };

  // Initialize offline storage
  async initialize(): Promise<void> {
    try {
      // Load existing data
      await this.loadSyncQueue();
      await this.loadOfflineStatus();
      
      // Start online status monitoring
      this.startOnlineStatusMonitoring();
      
      console.log('🔄 OfflineStorageService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OfflineStorageService:', error);
    }
  }

  // Online status monitoring
  private startOnlineStatusMonitoring(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineStatusChange(true));
      window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
      
      // Check initial status
      this.handleOnlineStatusChange(navigator.onLine);
    }
  }

  private async handleOnlineStatusChange(isOnline: boolean): Promise<void> {
    const wasOnline = this.offlineStatus.isOnline;
    this.offlineStatus.isOnline = isOnline;
    this.offlineStatus.lastOnlineCheck = Date.now();

    if (!wasOnline && isOnline) {
      // Just came back online - trigger sync
      console.log('🌐 Connection restored - triggering sync');
      await this.triggerSync();
    } else if (wasOnline && !isOnline) {
      console.log('📴 Connection lost - switching to offline mode');
    }

    await this.saveOfflineStatus();
  }

  // Store data offline
  async storeOfflineData(key: string, data: any[], organization_id: string): Promise<void> {
    try {
      const offlineData: OfflineData = await this.getOfflineData();
      offlineData[key] = {
        data,
        lastUpdated: Date.now(),
        organization_id,
      };
      
      await this.storage.setItem(OFFLINE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData));
      console.log(`💾 Stored offline data for ${key}:`, data.length, 'items');
    } catch (error) {
      console.error('❌ Failed to store offline data:', error);
    }
  }

  // Get offline data
  async getOfflineData(): Promise<OfflineData> {
    try {
      const data = await this.storage.getItem(OFFLINE_KEYS.OFFLINE_DATA);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Failed to get offline data:', error);
      return {};
    }
  }

  // Get specific offline data
  async getOfflineDataForKey(key: string): Promise<any[]> {
    try {
      const offlineData = await this.getOfflineData();
      return offlineData[key]?.data || [];
    } catch (error) {
      console.error('❌ Failed to get offline data for key:', key, error);
      return [];
    }
  }

  // Add pending change to sync queue
  async addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const pendingChange: PendingChange = {
        ...change,
        id: `${change.type}-${change.entity}-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      this.syncQueue.changes.push(pendingChange);
      this.offlineStatus.pendingChangesCount = this.syncQueue.changes.length;
      
      await this.saveSyncQueue();
      await this.saveOfflineStatus();
      
      console.log(`📝 Added pending change:`, pendingChange.type, pendingChange.entity);
    } catch (error) {
      console.error('❌ Failed to add pending change:', error);
    }
  }

  // Get pending changes
  async getPendingChanges(): Promise<PendingChange[]> {
    return this.syncQueue.changes;
  }

  // Remove pending change (after successful sync)
  async removePendingChange(changeId: string): Promise<void> {
    try {
      this.syncQueue.changes = this.syncQueue.changes.filter(change => change.id !== changeId);
      this.offlineStatus.pendingChangesCount = this.syncQueue.changes.length;
      
      await this.saveSyncQueue();
      await this.saveOfflineStatus();
      
      console.log(`✅ Removed pending change:`, changeId);
    } catch (error) {
      console.error('❌ Failed to remove pending change:', error);
    }
  }

  // Update retry count for failed sync
  async updateRetryCount(changeId: string): Promise<void> {
    try {
      const change = this.syncQueue.changes.find(c => c.id === changeId);
      if (change) {
        change.retryCount++;
        await this.saveSyncQueue();
        console.log(`🔄 Updated retry count for change:`, changeId, change.retryCount);
      }
    } catch (error) {
      console.error('❌ Failed to update retry count:', error);
    }
  }

  // Trigger sync process
  async triggerSync(): Promise<void> {
    if (this.syncQueue.isProcessing || !this.offlineStatus.isOnline) {
      return;
    }

    this.syncQueue.isProcessing = true;
    this.offlineStatus.lastSyncAttempt = Date.now();

    try {
      console.log('🔄 Starting sync process...');
      
      const pendingChanges = await this.getPendingChanges();
      const validChanges = pendingChanges.filter(change => change.retryCount < change.maxRetries);

      if (validChanges.length === 0) {
        console.log('✅ No pending changes to sync');
        return;
      }

      console.log(`🔄 Syncing ${validChanges.length} changes...`);

      for (const change of validChanges) {
        try {
          await this.processChange(change);
          await this.removePendingChange(change.id);
        } catch (error) {
          console.error('❌ Failed to process change:', change.id, error);
          await this.updateRetryCount(change.id);
          
          // Add to sync errors
          this.offlineStatus.syncErrors.push(
            `${change.type} ${change.entity}: ${error.message}`
          );
        }
      }

      // Clear old errors (keep last 10)
      this.offlineStatus.syncErrors = this.offlineStatus.syncErrors.slice(-10);
      
      console.log('✅ Sync process completed');
    } catch (error) {
      console.error('❌ Sync process failed:', error);
    } finally {
      this.syncQueue.isProcessing = false;
      await this.saveSyncQueue();
      await this.saveOfflineStatus();
    }
  }

  // Process individual change
  private async processChange(change: PendingChange): Promise<void> {
    // Import dataSync service dynamically to avoid circular dependencies
    const { dataSync } = await import('./dataSync');
    await dataSync.processPendingChanges();
  }

  // Conflict resolution
  async addConflictResolution(conflict: ConflictResolution): Promise<void> {
    try {
      const conflicts = await this.getConflictResolutions();
      conflicts.push(conflict);
      
      await this.storage.setItem(OFFLINE_KEYS.CONFLICT_RESOLUTION, JSON.stringify(conflicts));
      console.log(`⚠️ Added conflict resolution for:`, conflict.entityType, conflict.entityId);
    } catch (error) {
      console.error('❌ Failed to add conflict resolution:', error);
    }
  }

  async getConflictResolutions(): Promise<ConflictResolution[]> {
    try {
      const data = await this.storage.getItem(OFFLINE_KEYS.CONFLICT_RESOLUTION);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Failed to get conflict resolutions:', error);
      return [];
    }
  }

  // Get offline status
  getOfflineStatus(): OfflineStatus {
    return { ...this.offlineStatus };
  }

  // Check if online
  isOnline(): boolean {
    return this.offlineStatus.isOnline;
  }

  // Get pending changes count
  getPendingChangesCount(): number {
    return this.offlineStatus.pendingChangesCount;
  }

  // Clear all offline data (for testing/debugging)
  async clearAllOfflineData(): Promise<void> {
    try {
      await this.storage.removeItem(OFFLINE_KEYS.PENDING_CHANGES);
      await this.storage.removeItem(OFFLINE_KEYS.OFFLINE_DATA);
      await this.storage.removeItem(OFFLINE_KEYS.SYNC_QUEUE);
      await this.storage.removeItem(OFFLINE_KEYS.LAST_SYNC);
      await this.storage.removeItem(OFFLINE_KEYS.CONFLICT_RESOLUTION);
      await this.storage.removeItem(OFFLINE_KEYS.OFFLINE_STATUS);
      
      this.syncQueue = { changes: [], lastProcessed: 0, isProcessing: false };
      this.offlineStatus = {
        isOnline: true,
        lastOnlineCheck: Date.now(),
        pendingChangesCount: 0,
        lastSyncAttempt: 0,
        syncErrors: [],
      };
      
      console.log('🧹 Cleared all offline data');
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
    }
  }

  // Private methods for persistence
  private async saveSyncQueue(): Promise<void> {
    await this.storage.setItem(OFFLINE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const data = await this.storage.getItem(OFFLINE_KEYS.SYNC_QUEUE);
      if (data) {
        this.syncQueue = JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Failed to load sync queue:', error);
    }
  }

  private async saveOfflineStatus(): Promise<void> {
    await this.storage.setItem(OFFLINE_KEYS.OFFLINE_STATUS, JSON.stringify(this.offlineStatus));
  }

  private async loadOfflineStatus(): Promise<void> {
    try {
      const data = await this.storage.getItem(OFFLINE_KEYS.OFFLINE_STATUS);
      if (data) {
        this.offlineStatus = JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Failed to load offline status:', error);
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();

// Export types
export type { PendingChange, OfflineData, SyncQueue, ConflictResolution, OfflineStatus };
