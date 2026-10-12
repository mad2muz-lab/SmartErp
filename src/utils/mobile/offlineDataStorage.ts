import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Offline storage types
export interface StorageItem {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
  version: number;
  compressed: boolean;
  size: number;
  tags: string[];
}

export interface StorageStats {
  totalItems: number;
  totalSize: number;
  oldestItem: number;
  newestItem: number;
  byTag: Record<string, number>;
  byVersion: Record<string, number>;
}

export interface StorageConfig {
  maxSize: number; // in bytes
  maxAge: number; // in milliseconds
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  autoCleanup: boolean;
  cleanupInterval: number; // in milliseconds
}

class OfflineDataStorageService {
  private config: StorageConfig = {
    maxSize: 100 * 1024 * 1024, // 100MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    compressionEnabled: true,
    encryptionEnabled: false,
    autoCleanup: true,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  };

  private storageDir: string;
  private indexFile: string;
  private statsFile: string;

  constructor() {
    this.storageDir = `${FileSystem.documentDirectory}offline-storage/`;
    this.indexFile = `${this.storageDir}index.json`;
    this.statsFile = `${this.storageDir}stats.json`;
  }

  // Initialize storage
  async initialize(): Promise<void> {
    try {
      console.log('💾 Initializing offline data storage...');

      // Create storage directory
      const dirInfo = await FileSystem.getInfoAsync(this.storageDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.storageDir, { intermediates: true });
      }

      // Initialize index file
      const indexInfo = await FileSystem.getInfoAsync(this.indexFile);
      if (!indexInfo.exists) {
        await this.saveIndex({});
      }

      // Initialize stats file
      const statsInfo = await FileSystem.getInfoAsync(this.statsFile);
      if (!statsInfo.exists) {
        await this.saveStats({
          totalItems: 0,
          totalSize: 0,
          oldestItem: Date.now(),
          newestItem: Date.now(),
          byTag: {},
          byVersion: {},
        });
      }

      // Start auto cleanup if enabled
      if (this.config.autoCleanup) {
        this.startAutoCleanup();
      }

      console.log('✅ Offline data storage initialized');
    } catch (error) {
      console.error('❌ Failed to initialize offline data storage:', error);
    }
  }

  // Store data
  async store(
    key: string,
    data: any,
    options: {
      expiresAt?: number;
      tags?: string[];
      compress?: boolean;
      encrypt?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      console.log(`💾 Storing data for key: ${key}`);

      const item: StorageItem = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: options.expiresAt,
        version: 1,
        compressed: options.compress ?? this.config.compressionEnabled,
        size: 0,
        tags: options.tags || [],
      };

      // Compress data if enabled
      if (item.compressed) {
        item.data = await this.compressData(data);
      }

      // Encrypt data if enabled
      if (options.encrypt ?? this.config.encryptionEnabled) {
        item.data = await this.encryptData(JSON.stringify(item.data));
      }

      // Calculate size
      item.size = JSON.stringify(item.data).length;

      // Check storage limits
      const stats = await this.getStats();
      if (stats.totalSize + item.size > this.config.maxSize) {
        await this.cleanup();
      }

      // Save item
      const itemFile = `${this.storageDir}${key}.json`;
      await FileSystem.writeAsStringAsync(itemFile, JSON.stringify(item));

      // Update index
      const index = await this.getIndex();
      index[key] = {
        file: itemFile,
        timestamp: item.timestamp,
        size: item.size,
        tags: item.tags,
      };
      await this.saveIndex(index);

      // Update stats
      await this.updateStats(item, 'add');

      console.log(`✅ Data stored successfully for key: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store data for key: ${key}:`, error);
      return false;
    }
  }

  // Retrieve data
  async retrieve(key: string): Promise<any | null> {
    try {
      console.log(`📂 Retrieving data for key: ${key}`);

      const index = await this.getIndex();
      const itemInfo = index[key];

      if (!itemInfo) {
        console.log(`⚠️ No data found for key: ${key}`);
        return null;
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(itemInfo.file);
      if (!fileInfo.exists) {
        console.log(`⚠️ File not found for key: ${key}`);
        await this.remove(key);
        return null;
      }

      // Read item
      const itemData = await FileSystem.readAsStringAsync(itemInfo.file);
      const item: StorageItem = JSON.parse(itemData);

      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        console.log(`⚠️ Data expired for key: ${key}`);
        await this.remove(key);
        return null;
      }

      // Decrypt data if needed
      let data = item.data;
      if (this.config.encryptionEnabled) {
        data = await this.decryptData(data);
        data = JSON.parse(data);
      }

      // Decompress data if needed
      if (item.compressed) {
        data = await this.decompressData(data);
      }

      console.log(`✅ Data retrieved successfully for key: ${key}`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to retrieve data for key: ${key}:`, error);
      return null;
    }
  }

  // Remove data
  async remove(key: string): Promise<boolean> {
    try {
      console.log(`🗑️ Removing data for key: ${key}`);

      const index = await this.getIndex();
      const itemInfo = index[key];

      if (!itemInfo) {
        return false;
      }

      // Remove file
      await FileSystem.deleteAsync(itemInfo.file, { idempotent: true });

      // Update index
      delete index[key];
      await this.saveIndex(index);

      // Update stats
      await this.updateStats({ size: itemInfo.size, tags: itemInfo.tags }, 'remove');

      console.log(`✅ Data removed successfully for key: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove data for key: ${key}:`, error);
      return false;
    }
  }

  // Clear all data
  async clear(): Promise<boolean> {
    try {
      console.log('🧹 Clearing all offline data...');

      const index = await this.getIndex();
      
      // Remove all files
      for (const key in index) {
        await FileSystem.deleteAsync(index[key].file, { idempotent: true });
      }

      // Reset index and stats
      await this.saveIndex({});
      await this.saveStats({
        totalItems: 0,
        totalSize: 0,
        oldestItem: Date.now(),
        newestItem: Date.now(),
        byTag: {},
        byVersion: {},
      });

      console.log('✅ All offline data cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
      return false;
    }
  }

  // Get storage statistics
  async getStats(): Promise<StorageStats> {
    try {
      const statsData = await FileSystem.readAsStringAsync(this.statsFile);
      return JSON.parse(statsData);
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        totalItems: 0,
        totalSize: 0,
        oldestItem: Date.now(),
        newestItem: Date.now(),
        byTag: {},
        byVersion: {},
      };
    }
  }

  // Get items by tag
  async getByTag(tag: string): Promise<string[]> {
    try {
      const index = await this.getIndex();
      const keys: string[] = [];

      for (const key in index) {
        if (index[key].tags.includes(tag)) {
          keys.push(key);
        }
      }

      return keys;
    } catch (error) {
      console.error(`❌ Failed to get items by tag: ${tag}`, error);
      return [];
    }
  }

  // Remove items by tag
  async removeByTag(tag: string): Promise<number> {
    try {
      const keys = await this.getByTag(tag);
      let removedCount = 0;

      for (const key of keys) {
        if (await this.remove(key)) {
          removedCount++;
        }
      }

      console.log(`✅ Removed ${removedCount} items with tag: ${tag}`);
      return removedCount;
    } catch (error) {
      console.error(`❌ Failed to remove items by tag: ${tag}`, error);
      return 0;
    }
  }

  // Cleanup expired and old items
  async cleanup(): Promise<number> {
    try {
      console.log('🧹 Starting storage cleanup...');

      const index = await this.getIndex();
      const now = Date.now();
      let removedCount = 0;

      // Remove expired items
      for (const key in index) {
        const itemInfo = index[key];
        
        // Check if item is too old
        if (now - itemInfo.timestamp > this.config.maxAge) {
          if (await this.remove(key)) {
            removedCount++;
          }
        }
      }

      // If still over limit, remove oldest items
      const stats = await this.getStats();
      if (stats.totalSize > this.config.maxSize) {
        const sortedKeys = Object.keys(index).sort(
          (a, b) => index[a].timestamp - index[b].timestamp
        );

        for (const key of sortedKeys) {
          if (stats.totalSize <= this.config.maxSize) break;
          
          if (await this.remove(key)) {
            removedCount++;
            stats.totalSize -= index[key].size;
          }
        }
      }

      console.log(`✅ Cleanup completed, removed ${removedCount} items`);
      return removedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup storage:', error);
      return 0;
    }
  }

  // Configure storage
  async configure(config: Partial<StorageConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      console.log('✅ Storage configuration updated:', this.config);
    } catch (error) {
      console.error('❌ Failed to configure storage:', error);
    }
  }

  // Get configuration
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  // Check if storage is supported
  isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  // Private methods

  private async getIndex(): Promise<Record<string, any>> {
    try {
      const indexData = await FileSystem.readAsStringAsync(this.indexFile);
      return JSON.parse(indexData);
    } catch (error) {
      return {};
    }
  }

  private async saveIndex(index: Record<string, any>): Promise<void> {
    await FileSystem.writeAsStringAsync(this.indexFile, JSON.stringify(index));
  }

  private async saveStats(stats: StorageStats): Promise<void> {
    await FileSystem.writeAsStringAsync(this.statsFile, JSON.stringify(stats));
  }

  private async updateStats(item: Partial<StorageItem>, action: 'add' | 'remove'): Promise<void> {
    const stats = await this.getStats();
    
    if (action === 'add') {
      stats.totalItems++;
      stats.totalSize += item.size || 0;
      stats.newestItem = Math.max(stats.newestItem, item.timestamp || 0);
      stats.oldestItem = Math.min(stats.oldestItem, item.timestamp || Date.now());
      
      // Update tag counts
      for (const tag of item.tags || []) {
        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      }
      
      // Update version counts
      const version = String(item.version || 1);
      stats.byVersion[version] = (stats.byVersion[version] || 0) + 1;
    } else {
      stats.totalItems = Math.max(0, stats.totalItems - 1);
      stats.totalSize = Math.max(0, stats.totalSize - (item.size || 0));
      
      // Update tag counts
      for (const tag of item.tags || []) {
        stats.byTag[tag] = Math.max(0, (stats.byTag[tag] || 0) - 1);
      }
    }

    await this.saveStats(stats);
  }

  private async compressData(data: any): Promise<any> {
    // Simple compression - in a real app, you'd use a proper compression library
    const jsonString = JSON.stringify(data);
    return jsonString.length > 1000 ? { compressed: true, data: jsonString } : data;
  }

  private async decompressData(data: any): Promise<any> {
    if (data.compressed) {
      return JSON.parse(data.data);
    }
    return data;
  }

  private async encryptData(data: string): Promise<string> {
    // Simple encryption - in a real app, you'd use proper encryption
    return btoa(data);
  }

  private async decryptData(data: string): Promise<string> {
    // Simple decryption - in a real app, you'd use proper decryption
    return atob(data);
  }

  private startAutoCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
}

// Export singleton instance
export const offlineDataStorage = new OfflineDataStorageService();

// Export types
export type { StorageItem, StorageStats, StorageConfig };
