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
import { PAYMENT_TERMS } from '../../data/inventoryData';

interface Supplier {
  _id: string;
  name: string;
  name_arabic?: string;
  contact_person?: string;
  contact_person_arabic?: string;
  email?: string;
  phone?: string;
  address?: string;
  address_arabic?: string;
  website?: string;
  vat_number?: string;
  cr_number?: string;
  payment_terms?: string;
  credit_limit?: number;
  reliability_rating?: number;
  notes?: string;
  notes_arabic?: string;
  organization_id: string;
  created_by: string;
  _creationTime: number;
}

const SuppliersScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { selectedOrganization } = useAuth();
  const { showNotification } = useUnifiedNotifications();
  
  // Fetch suppliers using Convex
  const suppliers = useQuery(
    api.suppliers.listSuppliers,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Get all entries for smart dropdowns
  const allPaymentTerms = getAllEntries('payment_terms', selectedOrganization || '', PAYMENT_TERMS);

  // Mutations
  const createSupplier = useMutation(api.suppliers.createSupplier);
  const updateSupplier = useMutation(api.suppliers.updateSupplier);
  const deleteSupplier = useMutation(api.suppliers.deleteSupplier);

  // Unified data management
  const { 
    data: localSuppliers, 
    setData: setLocalSuppliers, 
    isLoading, 
    error,
    refresh 
  } = useUnifiedData<Supplier[]>(
    'suppliers',
    suppliers || [],
    {
      offlineSupport: true,
      syncOnConnect: true,
    }
  );

  // Filter suppliers based on search term
  const filteredSuppliers = localSuppliers?.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.includes(searchTerm) ||
    supplier.vat_number?.includes(searchTerm) ||
    supplier.cr_number?.includes(searchTerm)
  ) || [];

  // Handle supplier deletion
  const handleDeleteSupplier = (supplierId: string) => {
    Alert.alert(
      'Delete Supplier',
      'Are you sure you want to delete this supplier?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSupplier({ id: supplierId as any });
              showNotification('Supplier deleted successfully', 'success');
            } catch (error) {
              showNotification('Failed to delete supplier', 'error');
            }
          },
        },
      ]
    );
  };

  // Handle supplier selection
  const handleSupplierPress = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsEditMode(false);
    // TODO: Navigate to supplier detail screen
  };

  // Handle edit supplier
  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsEditMode(true);
    // TODO: Navigate to supplier edit screen
  };

  // Get reliability rating color
  const getReliabilityColor = (rating: number) => {
    if (rating >= 8) return '#38a169'; // Green for high reliability
    if (rating >= 6) return '#d69e2e'; // Yellow for medium reliability
    return '#e53e3e'; // Red for low reliability
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} \uE900`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (suppliers === undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Suppliers Management</Text>
          <Text style={styles.subtitle}>Loading suppliers...</Text>
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
          <Text style={styles.title}>Suppliers Management</Text>
          <Text style={styles.subtitle}>Please select an organization to view suppliers</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No organization selected</Text>
          <Text style={styles.emptySubtext}>
            Please select an organization from the dashboard to manage suppliers
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (filteredSuppliers.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Suppliers Management</Text>
          <Text style={styles.subtitle}>
            {searchTerm ? 'No suppliers found' : 'No suppliers yet'}
          </Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search suppliers..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchTerm ? 'No suppliers match your search' : 'No suppliers added yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Add your first supplier to get started'
            }
          </Text>
        </View>
      </View>
    );
  }

  // Render supplier item
  const renderSupplierItem = ({ item }: { item: Supplier }) => {
    return (
      <TouchableOpacity
        style={styles.supplierCard}
        onPress={() => handleSupplierPress(item)}
      >
        <View style={styles.supplierHeader}>
          <View style={styles.supplierInfo}>
            <Text style={styles.supplierName}>{item.name}</Text>
            {item.contact_person && (
              <Text style={styles.contactPerson}>Contact: {item.contact_person}</Text>
            )}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditSupplier(item)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteSupplier(item._id)}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.supplierDetails}>
          {item.email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>📧 {item.email}</Text>
            </View>
          )}
          
          {item.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>📞 {item.phone}</Text>
            </View>
          )}
          
          {item.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>📍 {item.address}</Text>
            </View>
          )}
          
          {item.website && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Website:</Text>
              <Text style={styles.detailValue}>🌐 {item.website}</Text>
            </View>
          )}
          
          {item.vat_number && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>VAT Number:</Text>
              <Text style={styles.detailValue}>{item.vat_number}</Text>
            </View>
          )}
          
          {item.cr_number && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CR Number:</Text>
              <Text style={styles.detailValue}>{item.cr_number}</Text>
            </View>
          )}
          
          {item.payment_terms && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Terms:</Text>
              <Text style={styles.detailValue}>{item.payment_terms}</Text>
            </View>
          )}
          
          {item.credit_limit && item.credit_limit > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Credit Limit:</Text>
              <Text style={[styles.detailValue, { fontFamily: 'saudi_riyal' }]}>{formatCurrency(item.credit_limit)}</Text>
            </View>
          )}
          
          {item.reliability_rating && item.reliability_rating > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reliability:</Text>
              <Text style={[styles.detailValue, { color: getReliabilityColor(item.reliability_rating) }]}>
                {item.reliability_rating}/10 ⭐
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>{formatDate(item._creationTime)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suppliers Management</Text>
        <Text style={styles.subtitle}>
          {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#666"
        />
      </View>

      {/* Suppliers List */}
      <FlatList
        data={filteredSuppliers}
        renderItem={renderSupplierItem}
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

      {/* Add Supplier Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add Supplier</Text>
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
  supplierCard: {
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
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  contactPerson: {
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
  supplierDetails: {
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

export default SuppliersScreen;
