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
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  organization_id: string;
  created_by: string;
  _creationTime: number;
}

const CustomerListScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { selectedOrganization } = useAuth();
  const { showNotification } = useUnifiedNotifications();
  
  // Fetch customers using Convex
  const customers = useQuery(
    api.customers.listCustomers,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Mutations
  const createCustomer = useMutation(api.customers.createCustomer);
  const updateCustomer = useMutation(api.customers.updateCustomer);
  const deleteCustomer = useMutation(api.customers.deleteCustomer);

  // Unified data management
  const { 
    data: localCustomers, 
    setData: setLocalCustomers, 
    isLoading, 
    error,
    refresh 
  } = useUnifiedData<Customer[]>(
    'customers',
    customers || [],
    {
      offlineSupport: true,
      syncOnConnect: true,
    }
  );

  // Filter customers based on search term
  const filteredCustomers = localCustomers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  ) || [];

  // Handle customer deletion
  const handleDeleteCustomer = (customerId: string) => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomer({ customer_id: customerId as any });
              showNotification('Customer deleted successfully', 'success');
            } catch (error) {
              showNotification('Failed to delete customer', 'error');
            }
          },
        },
      ]
    );
  };

  // Handle customer selection
  const handleCustomerPress = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditMode(false);
    // TODO: Navigate to customer detail screen
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditMode(true);
    // TODO: Navigate to customer edit screen
  };

  // Loading state
  if (customers === undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Customer Management</Text>
          <Text style={styles.subtitle}>Loading customers...</Text>
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
          <Text style={styles.title}>Customer Management</Text>
          <Text style={styles.subtitle}>Please select an organization to view customers</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No organization selected</Text>
          <Text style={styles.emptySubtext}>
            Please select an organization from the dashboard to manage customers
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (filteredCustomers.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Customer Management</Text>
          <Text style={styles.subtitle}>
            {searchTerm ? 'No customers found' : 'No customers yet'}
          </Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchTerm ? 'No customers match your search' : 'No customers added yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Add your first customer to get started'
            }
          </Text>
        </View>
      </View>
    );
  }

  // Render customer item
  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={() => handleCustomerPress(item)}
    >
      <View style={styles.customerHeader}>
        <Text style={styles.customerName}>{item.name}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditCustomer(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteCustomer(item._id)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {item.email && (
        <Text style={styles.customerDetail}>📧 {item.email}</Text>
      )}
      {item.phone && (
        <Text style={styles.customerDetail}>📞 {item.phone}</Text>
      )}
      {item.address && (
        <Text style={styles.customerDetail}>📍 {item.address}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Management</Text>
        <Text style={styles.subtitle}>
          {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#666"
        />
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
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

      {/* Add Customer Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add Customer</Text>
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
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
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
  customerDetail: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
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

export default CustomerListScreen;
