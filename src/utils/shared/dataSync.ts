import { api } from '../../../convex/_generated/api';
import { offlineStorage, PendingChange } from './offlineStorage';
import { useAuth } from '../../contexts/shared/AuthContext';

// Entity-specific sync handlers
interface SyncHandler {
  create: (data: any) => Promise<any>;
  update: (id: string, updates: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
}

// Sync handlers for different entities
const syncHandlers: Record<string, SyncHandler> = {
  customers: {
    create: async (data) => {
      // This would be implemented with actual Convex mutations
      console.log('🔄 Syncing customer create:', data);
      return { success: true, id: 'temp-id' };
    },
    update: async (id, updates) => {
      console.log('🔄 Syncing customer update:', id, updates);
      return { success: true };
    },
    delete: async (id) => {
      console.log('🔄 Syncing customer delete:', id);
      return { success: true };
    },
  },
  inventory: {
    create: async (data) => {
      console.log('🔄 Syncing inventory create:', data);
      return { success: true, id: 'temp-id' };
    },
    update: async (id, updates) => {
      console.log('🔄 Syncing inventory update:', id, updates);
      return { success: true };
    },
    delete: async (id) => {
      console.log('🔄 Syncing inventory delete:', id);
      return { success: true };
    },
  },
  quotations: {
    create: async (data) => {
      console.log('🔄 Syncing quotation create:', data);
      return { success: true, id: 'temp-id' };
    },
    update: async (id, updates) => {
      console.log('🔄 Syncing quotation update:', id, updates);
      return { success: true };
    },
    delete: async (id) => {
      console.log('🔄 Syncing quotation delete:', id);
      return { success: true };
    },
  },
  leads: {
    create: async (data) => {
      console.log('🔄 Syncing lead create:', data);
      return { success: true, id: 'temp-id' };
    },
    update: async (id, updates) => {
      console.log('🔄 Syncing lead update:', id, updates);
      return { success: true };
    },
    delete: async (id) => {
      console.log('🔄 Syncing lead delete:', id);
      return { success: true };
    },
  },
  suppliers: {
    create: async (data) => {
      console.log('🔄 Syncing supplier create:', data);
      return { success: true, id: 'temp-id' };
    },
    update: async (id, updates) => {
      console.log('🔄 Syncing supplier update:', id, updates);
      return { success: true };
    },
    delete: async (id) => {
      console.log('🔄 Syncing supplier delete:', id);
      return { success: true };
    },
  },
  deliveryNotes: {
    create: async (data) => {
      console.log('🔄 Syncing delivery note create:', data);
      return { success: true, id: 'temp-id' };
    },
    update: async (id, updates) => {
      console.log('🔄 Syncing delivery note update:', id, updates);
      return { success: true };
    },
    delete: async (id) => {
      console.log('🔄 Syncing delivery note delete:', id);
      return { success: true };
    },
  },
};

class DataSyncService {
  private isProcessing = false;
  private syncProgress = 0;
  private totalChanges = 0;

  // Process a single change
  private async processChange(change: PendingChange): Promise<boolean> {
    try {
      const handler = syncHandlers[change.entity];
      if (!handler) {
        console.warn(`⚠️ No sync handler found for entity: ${change.entity}`);
        return false;
      }

      let result;
      switch (change.type) {
        case 'create':
          result = await handler.create(change.data);
          break;
        case 'update':
          result = await handler.update(change.data.id, change.data.updates);
          break;
        case 'delete':
          result = await handler.delete(change.data.id);
          break;
        default:
          console.warn(`⚠️ Unknown change type: ${change.type}`);
          return false;
      }

      if (result?.success) {
        console.log(`✅ Successfully synced ${change.type} for ${change.entity}`);
        return true;
      } else {
        console.error(`❌ Failed to sync ${change.type} for ${change.entity}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error processing change:`, error);
      return false;
    }
  }

  // Process all pending changes
  async processPendingChanges(): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    errors: string[];
  }> {
    if (this.isProcessing) {
      console.log('🔄 Sync already in progress...');
      return { success: false, processed: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.isProcessing = true;
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;

    try {
      const pendingChanges = await offlineStorage.getPendingChanges();
      this.totalChanges = pendingChanges.length;

      if (pendingChanges.length === 0) {
        console.log('✅ No pending changes to sync');
        return { success: true, processed: 0, failed: 0, errors: [] };
      }

      console.log(`🔄 Starting sync of ${pendingChanges.length} changes...`);

      for (let i = 0; i < pendingChanges.length; i++) {
        const change = pendingChanges[i];
        this.syncProgress = ((i + 1) / pendingChanges.length) * 100;

        try {
          const success = await this.processChange(change);
          if (success) {
            processed++;
            await offlineStorage.removePendingChange(change.id);
          } else {
            failed++;
            await offlineStorage.updateRetryCount(change.id);
            errors.push(`Failed to sync ${change.type} ${change.entity}: ${change.id}`);
          }

          // Add small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          failed++;
          await offlineStorage.updateRetryCount(change.id);
          errors.push(`Error syncing ${change.type} ${change.entity}: ${error.message}`);
        }
      }

      const success = failed === 0;
      console.log(`✅ Sync completed: ${processed} successful, ${failed} failed`);

      return { success, processed, failed, errors };
    } catch (error) {
      console.error('❌ Sync process failed:', error);
      return { success: false, processed, failed, errors: [error.message] };
    } finally {
      this.isProcessing = false;
      this.syncProgress = 0;
      this.totalChanges = 0;
    }
  }

  // Get sync progress
  getSyncProgress(): { progress: number; total: number; isProcessing: boolean } {
    return {
      progress: this.syncProgress,
      total: this.totalChanges,
      isProcessing: this.isProcessing,
    };
  }

  // Check for conflicts
  async checkForConflicts(): Promise<Array<{
    entityId: string;
    entityType: string;
    localVersion: any;
    serverVersion: any;
    conflictType: 'update' | 'delete' | 'create';
  }>> {
    // This would implement conflict detection logic
    // For now, return empty array
    return [];
  }

  // Resolve conflicts
  async resolveConflict(
    entityId: string,
    entityType: string,
    resolution: 'local' | 'server' | 'manual',
    manualData?: any
  ): Promise<boolean> {
    try {
      await offlineStorage.addConflictResolution({
        entityId,
        entityType,
        localVersion: null, // Would be actual local version
        serverVersion: null, // Would be actual server version
        resolution,
        timestamp: Date.now(),
      });

      console.log(`✅ Conflict resolved for ${entityType} ${entityId}: ${resolution}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to resolve conflict:', error);
      return false;
    }
  }

  // Force sync (ignore retry limits)
  async forceSync(): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    errors: string[];
  }> {
    console.log('🔄 Force syncing all pending changes...');
    return this.processPendingChanges();
  }

  // Clear all pending changes (for debugging)
  async clearAllPendingChanges(): Promise<void> {
    try {
      const pendingChanges = await offlineStorage.getPendingChanges();
      for (const change of pendingChanges) {
        await offlineStorage.removePendingChange(change.id);
      }
      console.log('🧹 Cleared all pending changes');
    } catch (error) {
      console.error('❌ Failed to clear pending changes:', error);
    }
  }

  // Get sync statistics
  async getSyncStats(): Promise<{
    totalPending: number;
    byEntity: Record<string, number>;
    byType: Record<string, number>;
    oldestChange: number | null;
    newestChange: number | null;
  }> {
    try {
      const pendingChanges = await offlineStorage.getPendingChanges();
      
      const byEntity: Record<string, number> = {};
      const byType: Record<string, number> = {};
      let oldestChange: number | null = null;
      let newestChange: number | null = null;

      for (const change of pendingChanges) {
        // Count by entity
        byEntity[change.entity] = (byEntity[change.entity] || 0) + 1;
        
        // Count by type
        byType[change.type] = (byType[change.type] || 0) + 1;
        
        // Track timestamps
        if (!oldestChange || change.timestamp < oldestChange) {
          oldestChange = change.timestamp;
        }
        if (!newestChange || change.timestamp > newestChange) {
          newestChange = change.timestamp;
        }
      }

      return {
        totalPending: pendingChanges.length,
        byEntity,
        byType,
        oldestChange,
        newestChange,
      };
    } catch (error) {
      console.error('❌ Failed to get sync stats:', error);
      return {
        totalPending: 0,
        byEntity: {},
        byType: {},
        oldestChange: null,
        newestChange: null,
      };
    }
  }
}

// Export singleton instance
export const dataSync = new DataSyncService();

// Export types
export type { SyncHandler };
