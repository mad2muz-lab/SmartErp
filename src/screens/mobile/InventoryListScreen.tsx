import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import { useUnifiedData, useUnifiedNotifications } from '../../hooks/shared/useUnifiedState';
import { getAllEntries } from '../../data/customEntries';
import { INVENTORY_CATEGORIES, INVENTORY_UNITS } from '../../data/inventoryData';

interface InventoryItem {
  _id: string;
  name: string;
  name_arabic?: string;
  sku?: string;
  description?: string;
  description_arabic?: string;
  category?: string;
  category_arabic?: string;
  unit?: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  min_quantity?: number;
  supplier_id?: string;
  supplier_name?: string;
  location?: string;
  notes?: string;
  brand?: string;
  brand_arabic?: string;
  organization_id: string;
  created_by: string;
  _creationTime: number;
}

const InventoryListScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { selectedOrganization } = useAuth();
  const { showNotification } = useUnifiedNotifications();
  
  // Fetch inventory using Convex
  const inventory = useQuery(
    api.inventory.listInventory,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Fetch suppliers for reference
  const suppliers = useQuery(
    api.suppliers.listSuppliers,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Get all entries for smart dropdowns
  const allCategories = getAllEntries('category', selectedOrganization || '', INVENTORY_CATEGORIES);
  const allUnits = getAllEntries('unit', selectedOrganization || '', INVENTORY_UNITS);
  const supplierNames = suppliers?.map(s => s.name) || [];
  const allSuppliers = getAllEntries('supplier', selectedOrganization || '', supplierNames);

  // Mutations
  const createInventory = useMutation(api.inventory.createInventory);
  const updateInventory = useMutation(api.inventory.updateInventory);
  const deleteInventory = useMutation(api.inventory.deleteInventory);

  // Unified data management
  const { 
    data: localInventory, 
    setData: setLocalInventory, 
    isLoading, 
    error,
    refresh 
  } = useUnifiedData<InventoryItem[]>(
    'inventory',
    inventory || [],
    {
      offlineSupport: true,
      syncOnConnect: true,
    }
  );

  // Filter inventory based on search term
  const filteredInventory = localInventory?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handle inventory deletion
  const handleDeleteInventory = (itemId: string) => {
    Alert.alert(
      'Delete Inventory Item',
      'Are you sure you want to delete this inventory item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInventory({ id: itemId as any });
              showNotification('Inventory item deleted successfully', 'success');
            } catch (error) {
              showNotification('Failed to delete inventory item', 'error');
            }
          },
        },
      ]
    );
  };

  // Handle item selection
  const handleItemPress = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditMode(false);
    // TODO: Navigate to inventory detail screen
  };

  // Handle edit item
  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditMode(true);
    // TODO: Navigate to inventory edit screen
  };

  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return { status: 'Out of Stock', color: '#e53e3e' };
    if (item.min_quantity && item.quantity <= item.min_quantity) return { status: 'Low Stock', color: '#d69e2e' };
    return { status: 'In Stock', color: '#38a169' };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Loading state
  if (inventory === undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventory Management</Text>
          <Text style={styles.subtitle}>Loading inventory...</Text>
        </View>
        <ActivityIndicator size="large" color="#3182ce" style={styles.loader} />
      </View>
    );
  }

  // No organization selected
  if (!selectedOrganization) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventory Management</Text>
          <Text style={styles.subtitle}>Please select an organization to view inventory</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No organization selected</Text>
          <Text style={styles.emptySubtext}>
            Please select an organization from the dashboard to manage inventory
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (filteredInventory.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventory Management</Text>
          <Text style={styles.subtitle}>
            {searchTerm ? 'No items found' : 'No inventory items yet'}
          </Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchTerm ? 'No items match your search' : 'No inventory items added yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Add your first inventory item to get started'
            }
          </Text>
        </View>
      </View>
    );
  }

  // Render inventory item
  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const stockStatus = getStockStatus(item);
    
    return (
      <TouchableOpacity
        style={styles.inventoryCard}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.inventoryHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.sku && <Text style={styles.itemSku}>SKU: {item.sku}</Text>}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditItem(item)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteInventory(item._id)}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{item.category || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>
              {item.quantity} {item.unit || 'units'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cost Price:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.cost_price)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Selling Price:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.selling_price)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: stockStatus.color }]}>
              {stockStatus.status}
            </Text>
          </View>
          
          {item.brand && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brand:</Text>
              <Text style={styles.detailValue}>{item.brand}</Text>
            </View>
          )}
          
          {item.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>📍 {item.location}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Management</Text>
        <Text style={styles.subtitle}>
          {filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search inventory..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#666"
        />
      </View>

      {/* Inventory List */}
      <FlatList
        data={filteredInventory}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => item._id}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            colors={['#3182ce']}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add Inventory Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add Inventory Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#2d3748',
  },
  list: {
    flex: 1,
  },
  inventoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  itemSku: {
    fontSize: 14,
    color: '#718096',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3182ce',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#e53e3e',
  },
  deleteButtonText: {
    color: 'white',
  },
  itemDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2d3748',
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#3182ce',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InventoryListScreen;
