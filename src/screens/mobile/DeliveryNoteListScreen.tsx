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

interface DeliveryNote {
  _id: string;
  delivery_note_number: string;
  customer_id?: string;
  customer_name: string;
  customer_name_arabic?: string;
  quotation_id?: string;
  issue_date: string;
  delivery_date: string;
  delivery_address: string;
  delivery_address_arabic?: string;
  received_by: string;
  received_by_signature?: string;
  status: 'pending' | 'delivered' | 'cancelled' | 'returned';
  notes?: string;
  organization_id: string;
  created_by: string;
  _creationTime: number;
}

const DeliveryNoteListScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<DeliveryNote | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { selectedOrganization } = useAuth();
  const { showNotification } = useUnifiedNotifications();
  
  // Fetch delivery notes using Convex
  const deliveryNotes = useQuery(
    api.deliveryNotes.listDeliveryNotes,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Mutations
  const createDeliveryNote = useMutation(api.deliveryNotes.createDeliveryNote);
  const updateDeliveryNote = useMutation(api.deliveryNotes.updateDeliveryNote);
  const deleteDeliveryNote = useMutation(api.deliveryNotes.deleteDeliveryNote);

  // Unified data management
  const { 
    data: localDeliveryNotes, 
    setData: setLocalDeliveryNotes, 
    isLoading, 
    error,
    refresh 
  } = useUnifiedData<DeliveryNote[]>(
    'deliveryNotes',
    deliveryNotes || [],
    {
      offlineSupport: true,
      syncOnConnect: true,
    }
  );

  // Filter delivery notes based on search term
  const filteredDeliveryNotes = localDeliveryNotes?.filter(note =>
    note.delivery_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.received_by.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handle delivery note deletion
  const handleDeleteDeliveryNote = (deliveryNoteId: string) => {
    Alert.alert(
      'Delete Delivery Note',
      'Are you sure you want to delete this delivery note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeliveryNote({ delivery_note_id: deliveryNoteId as any });
              showNotification('Delivery note deleted successfully', 'success');
            } catch (error) {
              showNotification('Failed to delete delivery note', 'error');
            }
          },
        },
      ]
    );
  };

  // Handle delivery note selection
  const handleDeliveryNotePress = (deliveryNote: DeliveryNote) => {
    setSelectedDeliveryNote(deliveryNote);
    setIsEditMode(false);
    // TODO: Navigate to delivery note detail screen
  };

  // Handle edit delivery note
  const handleEditDeliveryNote = (deliveryNote: DeliveryNote) => {
    setSelectedDeliveryNote(deliveryNote);
    setIsEditMode(true);
    // TODO: Navigate to delivery note edit screen
  };

  // Get status color and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', color: '#d69e2e' };
      case 'delivered':
        return { text: 'Delivered', color: '#38a169' };
      case 'cancelled':
        return { text: 'Cancelled', color: '#e53e3e' };
      case 'returned':
        return { text: 'Returned', color: '#dd6b20' };
      default:
        return { text: 'Unknown', color: '#718096' };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format date from timestamp
  const formatDateFromTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (deliveryNotes === undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Delivery Notes</Text>
          <Text style={styles.subtitle}>Loading delivery notes...</Text>
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
          <Text style={styles.title}>Delivery Notes</Text>
          <Text style={styles.subtitle}>Please select an organization to view delivery notes</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No organization selected</Text>
          <Text style={styles.emptySubtext}>
            Please select an organization from the dashboard to manage delivery notes
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (filteredDeliveryNotes.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Delivery Notes</Text>
          <Text style={styles.subtitle}>
            {searchTerm ? 'No delivery notes found' : 'No delivery notes yet'}
          </Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search delivery notes..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchTerm ? 'No delivery notes match your search' : 'No delivery notes created yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Create your first delivery note to get started'
            }
          </Text>
        </View>
      </View>
    );
  }

  // Render delivery note item
  const renderDeliveryNoteItem = ({ item }: { item: DeliveryNote }) => {
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <TouchableOpacity
        style={styles.deliveryNoteCard}
        onPress={() => handleDeliveryNotePress(item)}
      >
        <View style={styles.deliveryNoteHeader}>
          <View style={styles.deliveryNoteInfo}>
            <Text style={styles.deliveryNoteNumber}>{item.delivery_note_number}</Text>
            <Text style={styles.customerName}>{item.customer_name}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditDeliveryNote(item)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteDeliveryNote(item._id)}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.deliveryNoteDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issue Date:</Text>
            <Text style={styles.detailValue}>{formatDate(item.issue_date)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Date:</Text>
            <Text style={styles.detailValue}>{formatDate(item.delivery_date)}</Text>
          </View>
          
          {item.delivery_address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Address:</Text>
              <Text style={styles.detailValue}>📍 {item.delivery_address}</Text>
            </View>
          )}
          
          {item.received_by && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Received By:</Text>
              <Text style={styles.detailValue}>👤 {item.received_by}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>{formatDateFromTimestamp(item._creationTime)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Delivery Notes</Text>
        <Text style={styles.subtitle}>
          {filteredDeliveryNotes.length} delivery note{filteredDeliveryNotes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search delivery notes..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#666"
        />
      </View>

      {/* Delivery Notes List */}
      <FlatList
        data={filteredDeliveryNotes}
        renderItem={renderDeliveryNoteItem}
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

      {/* Add Delivery Note Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Create Delivery Note</Text>
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
  deliveryNoteCard: {
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
  deliveryNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryNoteInfo: {
    flex: 1,
  },
  deliveryNoteNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
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
  deliveryNoteDetails: {
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

export default DeliveryNoteListScreen;
